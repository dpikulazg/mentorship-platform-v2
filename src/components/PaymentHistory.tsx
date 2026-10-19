import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { CheckCircle2, Clock, AlertCircle, ArrowDownToLine } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Transaction } from '../types';

export function PaymentHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    let fallbackUnsub: any = null;
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(doc => doc.data() as Transaction));
      setLoading(false);
    }, (err) => {
      // If index doesn't exist, we might get an error. Attempt without orderBy as fallback
      console.warn("Index might be missing, falling back to basic query");
      fallbackUnsub = onSnapshot(collection(db, 'transactions'), (fallbackSnap) => {
        const txs = fallbackSnap.docs.map(doc => doc.data() as Transaction);
        // sort manually
        txs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(txs);
        setLoading(false);
      }, (fallbackErr) => {
        handleFirestoreError(fallbackErr, OperationType.LIST, 'transactions');
        setLoading(false);
      });
    });
    return () => {
      unsub();
      if (fallbackUnsub) fallbackUnsub();
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <span className="inline-flex items-center px-2 py-0.5 border bg-green-500/10 text-green-500 border-green-500/20 text-[9px] uppercase font-semibold"><CheckCircle2 className="w-3 h-3 mr-1"/> Completed</span>;
      case 'pending': return <span className="inline-flex items-center px-2 py-0.5 border bg-orange-500/10 text-orange-500 border-orange-500/20 text-[9px] uppercase font-semibold"><Clock className="w-3 h-3 mr-1"/> Pending</span>;
      case 'failed': return <span className="inline-flex items-center px-2 py-0.5 border bg-red-500/10 text-red-500 border-red-500/20 text-[9px] uppercase font-semibold"><AlertCircle className="w-3 h-3 mr-1"/> Failed</span>;
      case 'refunded': return <span className="inline-flex items-center px-2 py-0.5 border bg-gray-500/10 text-gray-500 border-gray-500/20 text-[9px] uppercase font-semibold">Refunded</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 border bg-gray-500/10 text-gray-500 border-gray-500/20 text-[9px] uppercase font-semibold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
        <CardHeader className="border-b border-primary/20 bg-primary/5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-heading text-primary tracking-wide flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5"/>
              Customer Transactions
            </CardTitle>
            <CardDescription className="text-[10px] text-primary/60 font-mono uppercase mt-1">Real-time revenue monitoring</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#05050a]">
              <TableRow className="border-primary/20 hover:bg-transparent">
                <TableHead className="font-mono text-[10px] uppercase text-primary/60">TXN_ID</TableHead>
                <TableHead className="font-mono text-[10px] uppercase text-primary/60">Timestamp</TableHead>
                <TableHead className="font-mono text-[10px] uppercase text-primary/60">Subject (UID)</TableHead>
                <TableHead className="font-mono text-[10px] uppercase text-primary/60">Product_ID</TableHead>
                <TableHead className="font-mono text-[10px] uppercase text-primary/60 text-right">Value</TableHead>
                <TableHead className="font-mono text-[10px] uppercase text-primary/60 text-right">State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-sm">
              {loading ? (
                <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-primary/40 text-xs">Syncing data...</TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-primary/40 text-xs">No transactions strictly found.</TableCell>
                </TableRow>
              ) : transactions.map((txn) => (
                <TableRow key={txn.id} className="border-primary/10 hover:bg-primary/5 transition-colors">
                  <TableCell className="text-[#bfb9ca] text-[11px]">{txn.id}</TableCell>
                  <TableCell className="text-[#bfb9ca] text-[11px]">{new Date(txn.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-white text-[12px]">{txn.userId.substring(0,8)}...</TableCell>
                  <TableCell className="text-[#bfb9ca] text-[11px] uppercase tracking-wider">{txn.productId}</TableCell>
                  <TableCell className="text-white font-bold text-right">{txn.currency} {txn.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{getStatusBadge(txn.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
