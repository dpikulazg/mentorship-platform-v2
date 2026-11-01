import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Flame, Target, Shield, TrendingUp, User as UserIcon, Award, Film, ShieldCheck, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { TradeSubmissionForm } from '../components/TradeSubmissionForm';
import { CreditLedger } from '../components/CreditLedger';
import { MentorCamera } from '../components/MentorCamera';
import { AffiliateDashboard } from '../components/AffiliateDashboard';
import { MentorshipVideoLibrary } from '../components/MentorshipVideoLibrary';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { TradeSubmission } from '../types';

export function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [trades, setTrades] = useState<TradeSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'vault' | 'moderation' | 'library' | 'affiliate'>('vault');
  const [moderationFilter, setModerationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'trades'), orderBy('createdAt', 'asc'));
    let fallbackUnsub: any = null;
    const unsub = onSnapshot(q, (snap) => {
      setTrades(snap.docs.map(doc => doc.data() as TradeSubmission));
    }, (err) => {
      console.warn("Falling back for dashboard, check indexes");
      fallbackUnsub = onSnapshot(collection(db, 'users', user.uid, 'trades'), (fallback) => {
        const trs = fallback.docs.map(doc => doc.data() as TradeSubmission);
        trs.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setTrades(trs);
      }, (fail) => {
        handleFirestoreError(fail, OperationType.LIST, `users/${user.uid}/trades`);
      });
    });
    return () => {
      unsub();
      if (fallbackUnsub) fallbackUnsub();
    };
  }, [user]);

  if (loading) return <div className="p-8 text-white">Loading protocols...</div>;
  if (!user || !profile) return <div className="p-8 text-white">ACCESS DENIED. Subject unverified.</div>;

  if (!user.emailVerified) {
    return (
      <div className="container mx-auto px-6 py-10 relative mt-20 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-primary/30 pointer-events-none hidden lg:block text-right uppercase">
          SUBJECT ID: {user.uid}<br/>
          STATUS: INACTIVE<br/>
          AUTH_TIME: {new Date().toISOString()}
        </div>
        
        <Card className="max-w-md w-full bg-card/20 border-primary/40 rounded-none relative overflow-hidden backdrop-blur-xl">
          <CardHeader className="text-center pt-10 pb-8">
            <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-3xl font-black font-heading tracking-tighter mb-2 text-red-500 uppercase">
              System Restricted
            </CardTitle>
            <CardDescription className="text-xs font-mono text-primary/70 uppercase">
              Email Verification Required to Activate {profile.plan?.toUpperCase() || 'STARTER'} Protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-10 text-center">
            <p className="text-sm text-foreground/80 font-sans mb-8">
              Aktivacijski link je poslan na <strong>{user.email}</strong>. 
              Molimo potvrdite svoju email adresu kako biste dobili potpuni pristup platformi.
            </p>
            <div className="p-4 bg-primary/5 border border-primary/20 text-[10px] font-mono text-primary/60 uppercase tracking-widest flex items-center gap-2 mb-6">
               Osvježite stranicu nakon uspješne verifikacije.
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full h-12 border border-primary/40 bg-transparent text-primary tracking-widest uppercase font-black text-[12px] hover:bg-primary hover:text-black transition-colors rounded-none"
            >
              Osvježi
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Derive charts
  let cumulativePnl = 0;
  const pnlData = trades.map((t, idx) => {
      cumulativePnl += (t.pnl || 0);
      return {
          name: `Trade ${idx+1}`,
          pnl: cumulativePnl,
          daily: t.pnl || 0
      };
  });

  const winRate = trades.length > 0 
    ? Math.round((trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100) 
    : 0;

  return (
    <div className="container mx-auto px-6 py-10 relative mt-20">
      <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-primary/30 pointer-events-none hidden lg:block text-right uppercase">
        SUBJECT ID: {user.uid}<br/>
        PLAN: {profile.plan?.toUpperCase() || 'NONE'}<br/>
        AUTH_TIME: {new Date().toISOString()}
      </div>

      <div className="mb-10 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(175,70,255,0.15)]">
            <Activity className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-primary/40 uppercase tracking-[0.3em] mb-1">
              Personal Vault // Status: {profile.status?.toUpperCase() || 'UNVERIFIED'}
            </div>
            <h1 className="text-[36px] font-black text-foreground tracking-tighter uppercase italic leading-none">
              Trader <span className="text-primary italic">Dashboard</span>
            </h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border border-primary/20 p-1 bg-[#050508] gap-1 font-mono">
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'vault'
                ? 'bg-primary text-black'
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Trading Vault
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'moderation'
                ? 'bg-primary text-black'
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Moderation & Status
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'library'
                ? 'bg-primary text-black'
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Video Library
          </button>
          <button
            onClick={() => setActiveTab('affiliate')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'affiliate'
                ? 'bg-primary text-black'
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Affiliate & Commissions
          </button>
        </div>
      </div>

      {activeTab === 'moderation' ? (
        <div className="space-y-8 font-mono">
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#050507] border-primary/20 rounded-none p-4">
              <span className="text-[10px] text-primary/60 uppercase tracking-widest block">Total Submissions</span>
              <div className="text-3xl font-black font-heading text-white mt-1">{trades.length}</div>
              <p className="text-[9px] text-primary/40 mt-1 uppercase">Logged to mentor queue</p>
            </Card>

            <Card className="bg-[#050507] border-primary/20 rounded-none p-4">
              <span className="text-[10px] text-primary/60 uppercase tracking-widest block">Approved</span>
              <div className="text-3xl font-black font-heading text-green-400 mt-1">
                {trades.filter(t => t.status === 'approved' || t.status === 'reviewed').length}
              </div>
              <p className="text-[9px] text-primary/40 mt-1 uppercase">Accredited by mentor</p>
            </Card>

            <Card className="bg-[#050507] border-primary/20 rounded-none p-4">
              <span className="text-[10px] text-primary/60 uppercase tracking-widest block">In Queue / Review</span>
              <div className="text-3xl font-black font-heading text-amber-400 mt-1">
                {trades.filter(t => t.status === 'pending' || t.status === 'under_review').length}
              </div>
              <p className="text-[9px] text-primary/40 mt-1 uppercase">Awaiting evaluation</p>
            </Card>

            <Card className="bg-[#050507] border-primary/20 rounded-none p-4">
              <span className="text-[10px] text-primary/60 uppercase tracking-widest block">Revisions Required</span>
              <div className="text-3xl font-black font-heading text-red-400 mt-1">
                {trades.filter(t => t.status === 'rejected').length}
              </div>
              <p className="text-[9px] text-primary/40 mt-1 uppercase">Actionable mentor feedback</p>
            </Card>
          </div>

          {/* Submissions List */}
          <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
            <CardHeader className="border-b border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-heading text-primary uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Your Content & Trade Moderation Status
                </CardTitle>
                <CardDescription className="text-[10px] text-primary/60 font-mono uppercase mt-1">
                  Track whether your submitted trade setups comply with institutional risk rules
                </CardDescription>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex bg-[#050508] p-1 border border-primary/20 gap-1">
                <button
                  onClick={() => setModerationFilter('all')}
                  className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all ${
                    moderationFilter === 'all' ? 'bg-primary text-black' : 'text-primary/60 hover:text-primary'
                  }`}
                >
                  All ({trades.length})
                </button>
                <button
                  onClick={() => setModerationFilter('pending')}
                  className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all ${
                    moderationFilter === 'pending' ? 'bg-amber-400 text-black' : 'text-amber-400/80 hover:text-amber-400'
                  }`}
                >
                  Pending ({trades.filter(t => t.status === 'pending' || t.status === 'under_review').length})
                </button>
                <button
                  onClick={() => setModerationFilter('approved')}
                  className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all ${
                    moderationFilter === 'approved' ? 'bg-green-400 text-black' : 'text-green-400/80 hover:text-green-400'
                  }`}
                >
                  Approved ({trades.filter(t => t.status === 'approved' || t.status === 'reviewed').length})
                </button>
                <button
                  onClick={() => setModerationFilter('rejected')}
                  className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all ${
                    moderationFilter === 'rejected' ? 'bg-red-400 text-black' : 'text-red-400/80 hover:text-red-400'
                  }`}
                >
                  Needs Revision ({trades.filter(t => t.status === 'rejected').length})
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {trades.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Clock className="w-8 h-8 text-primary/40 mx-auto" />
                  <p className="text-xs text-primary/60 uppercase">No submissions logged yet.</p>
                  <button
                    onClick={() => setActiveTab('vault')}
                    className="px-4 py-2 bg-primary text-black text-xs font-bold uppercase tracking-wider rounded-none"
                  >
                    Open Trading Vault to Log First Trade
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-primary/10">
                  {trades
                    .filter(t => {
                      if (moderationFilter === 'pending') return t.status === 'pending' || t.status === 'under_review';
                      if (moderationFilter === 'approved') return t.status === 'approved' || t.status === 'reviewed';
                      if (moderationFilter === 'rejected') return t.status === 'rejected';
                      return true;
                    })
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(t => {
                      const isApproved = t.status === 'approved' || t.status === 'reviewed';
                      const isRejected = t.status === 'rejected';
                      const isUnderReview = t.status === 'under_review';
                      const isPending = t.status === 'pending';

                      return (
                        <div key={t.id} className="p-5 hover:bg-white/2 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-base font-bold text-white font-heading">{t.pair} Trade Setup</span>
                              
                              {/* Status Badge */}
                              {isApproved && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Approved
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
                                  <XCircle className="w-3 h-3" />
                                  Revision Required
                                </span>
                              )}
                              {isUnderReview && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                  <Clock className="w-3 h-3" />
                                  Under Mentor Review
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  Pending Review
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-primary/60 font-mono">
                              Logged on {new Date(t.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {/* Trade Parameter Chips */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 bg-[#050508] p-3 border border-white/5 text-xs">
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase block">Entry</span>
                              <span className="font-bold text-white font-mono">{t.orderEntry || '-'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase block">Target / Exit</span>
                              <span className="font-bold text-white font-mono">{t.orderExit || '-'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase block">Realized PnL</span>
                              <span className={`font-bold font-mono ${t.pnl && t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {t.pnl !== undefined ? `$${t.pnl.toFixed(2)}` : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase block">Review State</span>
                              <span className="font-bold text-primary font-mono uppercase">{t.status}</span>
                            </div>
                          </div>

                          {/* Rejection Alert */}
                          {isRejected && t.rejectionReason && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 text-xs text-red-300 mb-3 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-red-400">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Reviewer Reason: {t.rejectionReason}
                              </div>
                              <p className="text-[11px] text-red-200/90 font-sans">
                                Please review your risk-management parameters and adjust stop-loss/position size before resubmitting.
                              </p>
                            </div>
                          )}

                          {/* Mentor Feedback Note */}
                          {t.mentorFeedback && (
                            <div className="p-3 bg-primary/5 border-l-2 border-primary text-xs space-y-1">
                              <span className="text-[9px] uppercase tracking-widest text-primary/60 font-bold block">
                                Direct Mentor Evaluation Critique:
                              </span>
                              <p className="text-zinc-200 italic font-mono">
                                "{t.mentorFeedback}"
                              </p>
                            </div>
                          )}

                          {/* Student Notes */}
                          {t.notes && (
                            <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2">
                              Your notes: {t.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : activeTab === 'library' ? (
        <MentorshipVideoLibrary />
      ) : activeTab === 'affiliate' ? (
        <AffiliateDashboard />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-8">
            <MetricCard icon={Target} title="Win Rate" value={`${winRate}%`} sub="Across logged trades" />
            <MetricCard icon={TrendingUp} title="Gross PnL" value={`$${Math.abs(cumulativePnl).toFixed(2)}`} sub="Cumulative net output" />
            <MetricCard icon={Flame} title="Active Trades" value={trades.length.toString()} sub="Total verified inputs" />
            <MetricCard icon={Shield} title="Psych Score" value="A+" sub="High Emotional Stability" />
          </div>

          {profile.plan === 'mentorship' && (
            <div className="mb-8">
               <CreditLedger />
            </div>
          )}

          {(profile.role === 'mentor' || profile.role === 'admin') && (
            <div className="mb-8">
              <MentorCamera />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Charts Section */}
            <div className="lg:col-span-2 space-y-8">
                <Card className="bg-card border-primary/20 rounded-none overflow-hidden h-96">
                    <CardHeader className="border-b border-primary/20 bg-primary/5">
                    <CardTitle className="text-lg font-heading text-primary tracking-wide">Cumulative Yield Curve</CardTitle>
                    <CardDescription className="text-[10px] text-primary/60 font-mono uppercase">Performance tracked over time</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-[calc(100%-70px)]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={pnlData}>
                                <defs>
                                    <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#af46ff" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#af46ff" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#af46ff20" />
                                <XAxis dataKey="name" stroke="#af46ff60" fontSize={10} tickMargin={10} />
                                <YAxis stroke="#af46ff60" fontSize={10} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#05050A', borderColor: '#af46ff60', borderRadius: 0, border: '1px solid #af46ff40' }}
                                    itemStyle={{ color: '#af46ff', fontSize: 12, fontWeight: 'bold' }}
                                    labelStyle={{ color: '#fff', fontSize: 10,  marginBottom: 4 }}
                                />
                                <Area type="monotone" dataKey="pnl" stroke="#af46ff" fillOpacity={1} fill="url(#colorPnl)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
                    <CardHeader className="border-b border-primary/20 bg-primary/5 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-heading text-primary tracking-wide">Evaluating Mentor Feedback</CardTitle>
                      <CardDescription className="text-[10px] text-primary/60 font-mono uppercase">Direct feedback on your recent trades</CardDescription>
                    </div>
                    <button 
                      onClick={() => setActiveTab('moderation')}
                      className="text-[10px] font-mono uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      View All Statuses
                    </button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {trades.filter(t => t.mentorFeedback || t.status === 'approved' || t.status === 'rejected' || t.status === 'reviewed').length === 0 ? (
                            <div className="p-8 text-center text-xs text-primary/40 font-mono uppercase">
                                No mentor feedback received yet. Log more trades to get evaluated.
                            </div>
                        ) : (
                            <div className="divide-y divide-primary/10">
                                {trades
                                  .filter(t => t.mentorFeedback || t.status === 'approved' || t.status === 'rejected' || t.status === 'reviewed')
                                  .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                  .slice(0, 5)
                                  .map(t => {
                                    const isApproved = t.status === 'approved' || t.status === 'reviewed';
                                    const isRejected = t.status === 'rejected';

                                    return (
                                      <div key={t.id} className="p-4 bg-primary/5 hover:bg-primary/10 transition-colors font-mono">
                                          <div className="flex justify-between items-center mb-2">
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white">{t.pair} Trade</span>
                                                {isApproved && (
                                                  <span className="px-1.5 py-0.2 bg-green-500/10 text-green-400 border border-green-500/30 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                    <CheckCircle2 className="w-2.5 h-2.5" /> Approved
                                                  </span>
                                                )}
                                                {isRejected && (
                                                  <span className="px-1.5 py-0.2 bg-red-500/10 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                    <XCircle className="w-2.5 h-2.5" /> Revision Required
                                                  </span>
                                                )}
                                                {t.status === 'under_review' && (
                                                  <span className="px-1.5 py-0.2 bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[9px] font-bold uppercase tracking-wider">
                                                    Under Review
                                                  </span>
                                                )}
                                                {t.status === 'pending' && (
                                                  <span className="px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase tracking-wider">
                                                    Pending
                                                  </span>
                                                )}
                                              </div>
                                              <span className="text-[10px] text-primary/60">{new Date(t.createdAt).toLocaleDateString()}</span>
                                          </div>

                                          {t.rejectionReason && (
                                            <div className="text-[11px] text-red-400 font-bold mb-1.5 flex items-center gap-1">
                                              <AlertTriangle className="w-3 h-3" />
                                              Reason: {t.rejectionReason}
                                            </div>
                                          )}

                                          {t.mentorFeedback ? (
                                            <p className="text-xs text-primary/80 italic border-l-2 border-primary pl-3 py-1">
                                                "{t.mentorFeedback}"
                                            </p>
                                          ) : (
                                            <p className="text-[11px] text-zinc-400 italic pl-3">
                                              Trade logged into mentor moderation queue.
                                            </p>
                                          )}
                                      </div>
                                    );
                                  })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Input Section */}
            <div className="h-full">
                <TradeSubmissionForm />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, sub }: { icon: any, title: string, value: string, sub: string }) {
  return (
    <Card className="bg-card border-primary/20 rounded-none overflow-hidden hover:border-primary/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-primary/10 border border-primary/20">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-mono text-primary/40 uppercase tracking-widest">{title}</p>
          <div className="text-[22px] font-black font-heading text-foreground tracking-tighter/50 uppercase">
             {value}
          </div>
        </div>
        <div className="mt-4 text-[9px] font-mono text-primary/60 uppercase">
          {sub}
        </div>
      </CardContent>
    </Card>
  );
}
