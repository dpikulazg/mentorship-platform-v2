import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { collectionGroup, onSnapshot, query, orderBy, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { TradeSubmission } from '../types';
import { CheckCircle2, Clock, MessageSquareText, Target } from 'lucide-react';
import { toast } from 'sonner';

export function TradeAnalysisAdmin() {
  const [trades, setTrades] = useState<TradeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<TradeSubmission | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const q = query(collectionGroup(db, 'trades'), orderBy('createdAt', 'desc'));
    let fallbackUnsub: any = null;
    const unsub = onSnapshot(q, (snap) => {
      setTrades(snap.docs.map(doc => doc.data() as TradeSubmission));
      setLoading(false);
    }, (err) => {
      console.warn("Falling back, check indexes");
      fallbackUnsub = onSnapshot(collectionGroup(db, 'trades'), (fallback) => {
        const trs = fallback.docs.map(doc => doc.data() as TradeSubmission);
        trs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTrades(trs);
        setLoading(false);
      }, (fail) => {
        handleFirestoreError(fail, OperationType.LIST, 'trades');
        setLoading(false);
      });
    });
    return () => {
      unsub();
      if (fallbackUnsub) fallbackUnsub();
    };
  }, []);

  const handleSaveFeedback = async () => {
    if (!selectedTrade || !feedback) return;
    try {
      // Path format: users/{userId}/trades/{tradeId}
      const ref = doc(db, 'users', selectedTrade.userId, 'trades', selectedTrade.id);
      const now = new Date().toISOString();
      await updateDoc(ref, {
        mentorFeedback: feedback,
        status: 'reviewed',
        updatedAt: now
      });

      // Transmit notification to student
      const notifId = `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      try {
        await setDoc(doc(db, 'users', selectedTrade.userId, 'notifications', notifId), {
          id: notifId,
          userId: selectedTrade.userId,
          title: `Mentor Feedback: ${selectedTrade.pair} Trade`,
          message: feedback,
          type: 'approved',
          read: false,
          relatedSubmissionId: selectedTrade.id,
          createdAt: now
        });
      } catch (ne) {
        console.warn('Could not dispatch notification:', ne);
      }

      toast.success('FEEDBACK TRANSMITTED & NOTIFICATION SENT');
      setSelectedTrade(null);
      setFeedback('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${selectedTrade.userId}/trades/${selectedTrade.id}`);
      toast.error('FEEDBACK TRANSMISSION FAILED');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="bg-card border-primary/20 rounded-none overflow-hidden lg:col-span-2">
        <CardHeader className="border-b border-primary/20 bg-primary/5">
          <CardTitle className="text-lg font-heading text-primary tracking-wide flex items-center gap-2">
            <Target className="w-5 h-5"/>
            Submitted Trades Queue
          </CardTitle>
          <CardDescription className="text-[10px] text-primary/60 font-mono uppercase">Student trade analytics for review</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#05050a]">
              <TableRow className="border-primary/20 hover:bg-transparent">
                <TableHead className="font-mono text-[10px] uppercase text-primary/60">Date</TableHead>
                <TableHead className="font-mono text-[10px] uppercase text-primary/60">Pair</TableHead>
                <TableHead className="font-mono text-[10px] uppercase text-primary/60">Entry</TableHead>
                <TableHead className="font-mono text-[10px] uppercase text-primary/60">Exit</TableHead>
                <TableHead className="font-mono text-[10px] uppercase text-primary/60 text-right">PnL</TableHead>
                <TableHead className="font-mono text-[10px] uppercase text-primary/60 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-sm">
              {loading ? (
                <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-primary/40 text-xs">Syncing queue...</TableCell>
                </TableRow>
              ) : trades.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-primary/40 text-xs">Queue is empty.</TableCell>
                </TableRow>
              ) : trades.map((trade) => (
                <TableRow 
                  key={trade.id} 
                  className={`border-primary/10 transition-colors cursor-pointer ${selectedTrade?.id === trade.id ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                  onClick={() => {
                    setSelectedTrade(trade);
                    setFeedback(trade.mentorFeedback || '');
                  }}
                >
                  <TableCell className="text-[#bfb9ca] text-[11px]">{new Date(trade.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-white font-bold">{trade.pair}</TableCell>
                  <TableCell className="text-[#bfb9ca] text-[11px]">{trade.orderEntry || '-'}</TableCell>
                  <TableCell className="text-[#bfb9ca] text-[11px]">{trade.orderExit || '-'}</TableCell>
                  <TableCell className={`text-right font-bold ${trade.pnl && trade.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.pnl ? trade.pnl.toFixed(2) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {trade.status === 'reviewed' ? 
                      <span className="inline-flex items-center text-green-500 text-[10px] uppercase"><CheckCircle2 className="w-3 h-3 mr-1"/> Reviewed</span> : 
                      <span className="inline-flex items-center text-orange-500 text-[10px] uppercase"><Clock className="w-3 h-3 mr-1"/> Pending</span>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-card border-primary/20 rounded-none overflow-hidden flex flex-col h-[500px]">
        <CardHeader className="border-b border-primary/20 bg-primary/5 shrink-0">
          <CardTitle className="text-lg font-heading text-primary tracking-wide flex items-center gap-2">
            <MessageSquareText className="w-5 h-5"/>
            Analysis Panel
          </CardTitle>
          <CardDescription className="text-[10px] text-primary/60 font-mono uppercase">Provide mentor feedback</CardDescription>
        </CardHeader>
        <CardContent className="p-6 font-mono flex-1 overflow-y-auto flex flex-col">
          {selectedTrade ? (
            <div className="space-y-4 flex-1 flex flex-col">
               <div>
                 <p className="text-[10px] uppercase tracking-widest text-primary/40 mb-1">Student Notes</p>
                 <div className="p-3 bg-secondary/50 border border-white/5 text-xs text-white/80 min-h-[60px]">
                   {selectedTrade.notes || 'No notes provided by student.'}
                 </div>
               </div>
               
               <div className="flex-1 flex flex-col mt-4">
                 <p className="text-[10px] uppercase tracking-widest text-primary/40 mb-1">Mentor Action Context</p>
                 <textarea 
                   className="flex-1 bg-background border border-primary/20 p-3 text-xs focus:border-primary transition-colors text-white resize-none"
                   placeholder="Write your analysis and constructive feedback here..."
                   value={feedback}
                   onChange={e => setFeedback(e.target.value)}
                 />
                 <Button 
                   onClick={handleSaveFeedback} 
                   className="mt-4 bg-primary text-black hover:bg-primary/80 rounded-none h-10 w-full text-[10px] font-bold uppercase tracking-widest"
                 >
                   Submit Evaluation
                 </Button>
               </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-primary/40 text-xs">
              Select a trade from the queue to provide analysis.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
