import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Link, Zap } from 'lucide-react';

export function TradeSubmissionForm() {
  const { user, profile } = useAuth();
  const [exchange, setExchange] = useState('');
  const [pair, setPair] = useState('BTC/USDT');
  const [orderEntry, setOrderEntry] = useState('');
  const [orderExit, setOrderExit] = useState('');
  const [pnl, setPnl] = useState('');
  const [notes, setNotes] = useState('');
  const [emotion, setEmotion] = useState('neutral');

  const handleSubmit = async () => {
    if (!user || !profile || profile.status !== 'active') {
        toast.error('Only active verified users can submit trades.');
        return;
    }
    
    if (!pair || !orderEntry || !pnl) {
      toast.error('Pair, Entry and PNL are strictly required');
      return;
    }

    const tradeId = Math.random().toString(36).substr(2, 9);
    try {
      await setDoc(doc(db, 'users', user.uid, 'trades', tradeId), {
        id: tradeId,
        userId: user.uid,
        pair,
        orderEntry: parseFloat(orderEntry),
        orderExit: orderExit ? parseFloat(orderExit) : null,
        pnl: parseFloat(pnl),
        notes: `[Exchange: ${exchange}] [Emotion: ${emotion}]\n${notes}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('TRADE LOGGED TO MENTOR VAULT');
      setPair('BTC/USDT');
      setOrderEntry('');
      setOrderExit('');
      setPnl('');
      setNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/trades/${tradeId}`);
      toast.error('TRADE LOG FAILED');
    }
  };

  const handle1ClickImport = () => {
    if (!exchange) return toast.error('Select an exchange connector first.');
    // Simulated 1-click import logic
    toast.message(`Connecting to ${exchange} API...`);
    setTimeout(() => {
        setPair('ETH/USDT');
        setOrderEntry('3100.50');
        setOrderExit('3150.00');
        setPnl('49.50');
        toast.success(`Latest trade imported from ${exchange} successfully.`);
    }, 1500);
  };

  return (
    <Card className="bg-card border-primary/20 rounded-none overflow-hidden h-full flex flex-col">
      <CardHeader className="border-b border-primary/20 bg-primary/5">
        <CardTitle className="text-lg font-heading text-white tracking-wide uppercase">
          Journal & <span className="text-primary italic">Mentor Evaluation</span>
        </CardTitle>
        <CardDescription className="text-[10px] text-zinc-400 font-mono uppercase">Log your trades or 1-Click Import from exchange</CardDescription>
      </CardHeader>
      <CardContent className="p-6 font-mono flex-1 flex flex-col space-y-4">
        
        <div className="flex gap-4 items-end bg-secondary/50 p-4 border border-primary/10">
            <div className="flex-1 space-y-2">
                <label className="text-[10px] uppercase text-zinc-300 tracking-widest font-semibold">Connect Trade Platform</label>
                <Select value={exchange} onValueChange={setExchange}>
                    <SelectTrigger className="bg-background border-primary/30 rounded-none h-10 text-xs focus:border-primary transition-all font-mono text-white">
                        <SelectValue placeholder="Select Exchange" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-primary/20 rounded-none font-mono">
                        <SelectItem value="Binance">Binance</SelectItem>
                        <SelectItem value="ByBit">ByBit</SelectItem>
                        <SelectItem value="KuCoin">KuCoin</SelectItem>
                        <SelectItem value="OKX">OKX</SelectItem>
                        <SelectItem value="Kraken">Kraken</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handle1ClickImport} variant="outline" className="border-primary/30 text-primary font-bold uppercase tracking-widest text-[10px] h-10 rounded-none hover:bg-primary/20 hover:text-white transition-all">
                <Zap className="w-3 h-3 mr-2"/> 1-Click Sync
            </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-400 tracking-widest font-semibold">Pair</label>
                <Input className="bg-background border-primary/30 rounded-none h-10 text-xs focus:border-primary text-white" placeholder="BTC/USDT" value={pair} onChange={e => setPair(e.target.value)} />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-400 tracking-widest font-semibold">PnL (USD)</label>
                <Input type="number" className="bg-background border-primary/30 rounded-none h-10 text-xs focus:border-primary text-white" placeholder="e.g. 150.00 or -50.00" value={pnl} onChange={e => setPnl(e.target.value)} />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-400 tracking-widest font-semibold">Entry Price</label>
                <Input type="number" className="bg-background border-primary/30 rounded-none h-10 text-xs focus:border-primary text-white" value={orderEntry} onChange={e => setOrderEntry(e.target.value)} />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-400 tracking-widest font-semibold">Exit Price</label>
                <Input type="number" className="bg-background border-primary/30 rounded-none h-10 text-xs focus:border-primary text-white" value={orderExit} onChange={e => setOrderExit(e.target.value)} />
            </div>
        </div>

        <div className="space-y-1">
            <label className="text-[10px] uppercase text-zinc-400 tracking-widest font-semibold">Psychology / Emotion State</label>
            <Select value={emotion} onValueChange={setEmotion}>
                <SelectTrigger className="bg-background border-primary/30 rounded-none h-10 text-xs focus:border-primary transition-all font-mono text-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-primary/20 rounded-none font-mono">
                    <SelectItem value="neutral">Neutral & Disciplined</SelectItem>
                    <SelectItem value="fomo">FOMO (Fear Of Missing Out)</SelectItem>
                    <SelectItem value="revenge">Revenge Trading</SelectItem>
                    <SelectItem value="overtrading">Overtrading / Boredom</SelectItem>
                    <SelectItem value="fear">Fear / Early Exit</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-1 flex-1 flex flex-col">
            <label className="text-[10px] uppercase text-zinc-400 tracking-widest font-semibold">Journal Notes / Context</label>
            <textarea 
                className="flex-1 min-h-[80px] bg-background border border-primary/30 p-3 text-xs focus:border-primary transition-colors text-white resize-none outline-none"
                placeholder="Describe setup strategy, mistakes, confluences..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
            />
        </div>

        <Button onClick={handleSubmit} className="w-full bg-primary text-black hover:bg-primary/80 font-bold uppercase tracking-[0.2em] rounded-none h-12 shadow-[0_0_15px_rgba(175,70,255,0.2)]">
            Log Trade & Request Eval
        </Button>
      </CardContent>
    </Card>
  );
}
