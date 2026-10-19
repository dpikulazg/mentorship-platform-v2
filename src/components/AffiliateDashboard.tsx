import React, { useState, useEffect, useMemo } from 'react';
import { Affiliate, AffiliateReferral, AffiliatePayout } from '../types';
import { unifiedDataService } from '../services/dataSource';
import { useDataSource } from '../hooks/useDataSource';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { 
  Award, Users, DollarSign, TrendingUp, Sparkles, 
  Copy, ExternalLink, ShieldCheck, CheckCircle2, 
  AlertCircle, ArrowUpRight, Zap, Target, BookmarkCheck,
  RefreshCw, Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export interface CommissionTier {
  name: string;
  minReferrals: number;
  rate: number;
  color: string;
  badge: string;
  perks: string;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { 
    name: 'Bronze Ambassador', 
    minReferrals: 0, 
    rate: 15, 
    color: '#cd7f32', 
    badge: 'BRONZE',
    perks: 'Standard 15% payout cut on all membership sales'
  },
  { 
    name: 'Silver Pro Partner', 
    minReferrals: 3, 
    rate: 20, 
    color: '#c0c0c0', 
    badge: 'SILVER',
    perks: 'Boosted 20% cut + priority monthly settlements'
  },
  { 
    name: 'Gold Elite Mentor', 
    minReferrals: 10, 
    rate: 25, 
    color: '#ffd700', 
    badge: 'GOLD',
    perks: '25% commission rate + private mentor group access'
  },
  { 
    name: 'Diamond Master Lead', 
    minReferrals: 25, 
    rate: 30, 
    color: '#38bdf8', 
    badge: 'DIAMOND',
    perks: 'Maximum 30% revenue share + dedicated VIP telegram node'
  },
];

export function calculateTierInfo(totalSignUps: number) {
  let currentTier = COMMISSION_TIERS[0];
  for (const tier of COMMISSION_TIERS) {
    if (totalSignUps >= tier.minReferrals) {
      currentTier = tier;
    }
  }

  const currentIndex = COMMISSION_TIERS.indexOf(currentTier);
  const nextTier = currentIndex < COMMISSION_TIERS.length - 1 ? COMMISSION_TIERS[currentIndex + 1] : null;

  let progressPercent = 100;
  let referralsNeeded = 0;
  if (nextTier) {
    const prevMin = currentTier.minReferrals;
    const nextMin = nextTier.minReferrals;
    const gained = totalSignUps - prevMin;
    const span = nextMin - prevMin;
    progressPercent = Math.min(100, Math.max(0, Math.round((gained / span) * 100)));
    referralsNeeded = nextMin - totalSignUps;
  }

  return {
    currentTier,
    nextTier,
    progressPercent,
    referralsNeeded
  };
}

export function AffiliateDashboard() {
  const { user } = useAuth();
  const { updateTick } = useDataSource();

  const [sessionRefCode, setSessionRefCode] = useState<string>('');
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Sync sessionStorage referral code
  const refreshSessionCode = () => {
    const code = sessionStorage.getItem('cryptomentor_ref_code') || '';
    setSessionRefCode(code);
    setManualCodeInput(code);
  };

  const handleUpdateSessionCode = (newCode: string) => {
    const clean = newCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (clean) {
      sessionStorage.setItem('cryptomentor_ref_code', clean);
      setSessionRefCode(clean);
      toast.success(`SESSION REFERRAL ATTRIBUTION SET TO: ${clean}`);
    } else {
      sessionStorage.removeItem('cryptomentor_ref_code');
      setSessionRefCode('');
      toast.info('Session referral attribution cleared.');
    }
  };

  // Load existing SQLite data
  const loadSqliteData = async () => {
    try {
      setLoading(true);
      const [affs, refs] = await Promise.all([
        unifiedDataService.getAffiliates(),
        unifiedDataService.getAffiliateReferrals()
      ]);

      setAffiliates(affs);
      setReferrals(refs);

      // Default selected mentor: if user is logged in, find matching email or take first mentor
      if (affs.length > 0) {
        setSelectedMentorId(prev => {
          if (prev && affs.some(a => a.id === prev)) return prev;
          const userAff = affs.find(a => a.userEmail === user?.email);
          return userAff ? userAff.id : affs[0].id;
        });
      }
    } catch (err) {
      console.error('Failed to load SQLite affiliate data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSessionCode();
    loadSqliteData();
  }, [updateTick]);

  // Aggregate stats per mentor
  const mentorSignUpsMap = useMemo(() => {
    const map: Record<string, {
      total: number;
      starter: number;
      pro: number;
      mentorship: number;
      grossSales: number;
      commissions: number;
    }> = {};

    affiliates.forEach(aff => {
      map[aff.id] = { total: 0, starter: 0, pro: 0, mentorship: 0, grossSales: 0, commissions: 0 };
    });

    referrals.forEach(ref => {
      if (!map[ref.affiliateId]) {
        map[ref.affiliateId] = { total: 0, starter: 0, pro: 0, mentorship: 0, grossSales: 0, commissions: 0 };
      }
      map[ref.affiliateId].total += 1;
      map[ref.affiliateId].grossSales += ref.saleAmount || 0;
      map[ref.affiliateId].commissions += ref.commissionAmount || 0;
      if (ref.plan === 'starter') map[ref.affiliateId].starter += 1;
      if (ref.plan === 'pro') map[ref.affiliateId].pro += 1;
      if (ref.plan === 'mentorship') map[ref.affiliateId].mentorship += 1;
    });

    return map;
  }, [affiliates, referrals]);

  // Active selected mentor details
  const activeMentor = useMemo(() => {
    return affiliates.find(a => a.id === selectedMentorId) || affiliates[0] || null;
  }, [affiliates, selectedMentorId]);

  const activeMentorStats = useMemo(() => {
    if (!activeMentor) return { total: 0, starter: 0, pro: 0, mentorship: 0, grossSales: 0, commissions: 0 };
    return mentorSignUpsMap[activeMentor.id] || { 
      total: activeMentor.totalReferrals || 0, 
      starter: 0, 
      pro: 0, 
      mentorship: 0, 
      grossSales: 0, 
      commissions: activeMentor.totalEarnings || 0 
    };
  }, [activeMentor, mentorSignUpsMap]);

  // Tier calculation for active mentor
  const tierInfo = useMemo(() => {
    const count = activeMentorStats.total || activeMentor?.totalReferrals || 0;
    return calculateTierInfo(count);
  }, [activeMentorStats, activeMentor]);

  const copyMentorLink = (code: string) => {
    const url = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success(`COPIED REFERRAL URL: ${url}`);
  };

  return (
    <div className="space-y-8 font-mono">
      {/* 1. Session Storage Referral Code Tracker Banner */}
      <div className="bg-[#0b0814] border border-primary/30 p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-purple-500" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Session Storage Referral Tracker
              </span>
              <span className={`text-[9px] px-2 py-0.5 border font-bold uppercase tracking-widest ${
                sessionRefCode 
                  ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                  : 'bg-primary/10 text-primary/60 border-primary/20'
              }`}>
                {sessionRefCode ? `Active Tracking: ${sessionRefCode}` : 'No Active Session Code'}
              </span>
            </div>
            <p className="text-[10px] text-[#bfb9ca] leading-relaxed max-w-2xl">
              Tracks visitor conversion attribution captured in <code className="text-primary bg-primary/10 px-1">sessionStorage('cryptomentor_ref_code')</code>. 
              Any user registering during this browser session automatically credits the associated mentor.
            </p>
          </div>

          {/* Quick Session Attribution Form */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Input 
              value={manualCodeInput} 
              onChange={e => setManualCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. ALPHA_TRADER_HR"
              className="bg-[#050508] border-primary/25 rounded-none text-xs h-9 uppercase font-bold text-white w-48"
            />
            <Button 
              size="sm"
              onClick={() => handleUpdateSessionCode(manualCodeInput)}
              className="bg-primary text-black hover:bg-primary/80 rounded-none text-[10px] font-bold uppercase tracking-widest h-9 px-3"
            >
              Set Tracking
            </Button>
            {sessionRefCode && (
              <Button 
                size="sm"
                variant="ghost"
                onClick={() => handleUpdateSessionCode('')}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-none text-[10px] h-9 px-2"
                title="Clear current session code"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Mentor Selector & Tier Progress Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Active Mentor Card & Tier Status (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
            <CardHeader className="border-b border-primary/20 bg-primary/5 pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-base font-heading text-primary tracking-wide">
                    Mentor Ambassador Commission Profile
                  </CardTitle>
                  <CardDescription className="text-[9px] text-primary/50 uppercase">
                    Dynamically resolved from local SQLite database records
                  </CardDescription>
                </div>

                {/* Mentor Dropdown Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-primary/60 uppercase">Mentor:</span>
                  <select 
                    value={selectedMentorId} 
                    onChange={e => setSelectedMentorId(e.target.value)}
                    className="bg-[#05050a] border border-primary/30 text-white text-xs px-2.5 py-1.5 focus:border-primary focus:outline-none"
                  >
                    {affiliates.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.userName} ({a.affiliateCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {activeMentor && (
                <>
                  {/* Mentor Header Details */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0712] p-4 border border-primary/15">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{activeMentor.userName}</h3>
                        <span 
                          className="text-[9px] px-2 py-0.5 border font-bold uppercase tracking-wider"
                          style={{ 
                            borderColor: tierInfo.currentTier.color, 
                            color: tierInfo.currentTier.color,
                            backgroundColor: `${tierInfo.currentTier.color}15`
                          }}
                        >
                          {tierInfo.currentTier.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#bfb9ca] mt-0.5">{activeMentor.userEmail}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[9px] text-primary/50 uppercase tracking-widest block">Tracking Code</span>
                        <span className="text-xs font-bold text-primary tracking-widest bg-primary/10 border border-primary/25 px-2 py-0.5 inline-block">
                          {activeMentor.affiliateCode}
                        </span>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="w-8 h-8 text-primary/70 hover:text-primary rounded-none"
                        onClick={() => copyMentorLink(activeMentor.affiliateCode)}
                        title="Copy Mentor Referral Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Commission Tier Progress Meter */}
                  <div className="space-y-3 p-4 bg-[#050508] border border-primary/15">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-primary/60 uppercase tracking-wider block">Commission Tier Rate</span>
                        <span className="text-2xl font-black text-white">
                          {tierInfo.currentTier.rate}%
                        </span>
                      </div>

                      {tierInfo.nextTier ? (
                        <div className="text-right">
                          <span className="text-[10px] text-primary/60 uppercase tracking-wider block">Next Level</span>
                          <span 
                            className="text-xs font-bold uppercase"
                            style={{ color: tierInfo.nextTier.color }}
                          >
                            {tierInfo.nextTier.name} ({tierInfo.nextTier.rate}%)
                          </span>
                          <span className="text-[9px] text-[#bfb9ca] block">
                            {tierInfo.referralsNeeded} more sign-up{tierInfo.referralsNeeded === 1 ? '' : 's'} needed
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] text-green-400 uppercase font-bold tracking-wider">
                            ★ Top Tier Maxed Out
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 h-2 overflow-hidden border border-white/10">
                      <div 
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${tierInfo.progressPercent}%`,
                          backgroundColor: tierInfo.currentTier.color
                        }}
                      />
                    </div>

                    <p className="text-[9px] text-[#bfb9ca] italic">
                      Active Tier Benefit: {tierInfo.currentTier.perks}
                    </p>
                  </div>

                  {/* Sign-ups breakdown cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-[#080512] border border-primary/15">
                      <span className="text-[9px] text-primary/50 uppercase block">Total Sign-ups</span>
                      <span className="text-2xl font-black text-white mt-1 block">
                        {activeMentorStats.total}
                      </span>
                    </div>

                    <div className="p-3 bg-[#080512] border border-primary/15">
                      <span className="text-[9px] text-primary/50 uppercase block">Starter Passes</span>
                      <span className="text-2xl font-black text-primary mt-1 block">
                        {activeMentorStats.starter}
                      </span>
                    </div>

                    <div className="p-3 bg-[#080512] border border-primary/15">
                      <span className="text-[9px] text-primary/50 uppercase block">Pro Tier</span>
                      <span className="text-2xl font-black text-primary mt-1 block">
                        {activeMentorStats.pro}
                      </span>
                    </div>

                    <div className="p-3 bg-[#080512] border border-primary/15">
                      <span className="text-[9px] text-primary/50 uppercase block">Mentorship VIP</span>
                      <span className="text-2xl font-black text-yellow-400 mt-1 block">
                        {activeMentorStats.mentorship}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Commission Tier Ladder Guide (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
            <CardHeader className="border-b border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-heading text-primary tracking-wide">
                  Commission Tier Structure Matrix
                </CardTitle>
              </div>
              <CardDescription className="text-[9px] text-primary/50 uppercase">
                Volume-scaled compensation based on total verified sign-ups
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-primary/10">
                {COMMISSION_TIERS.map(tier => {
                  const isActive = tierInfo.currentTier.badge === tier.badge;
                  return (
                    <div 
                      key={tier.badge} 
                      className={`p-4 transition-colors ${
                        isActive ? 'bg-primary/10 border-l-[3px] border-primary' : 'hover:bg-primary/5 bg-[#030305]/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-[9px] px-1.5 py-0.5 border font-bold uppercase tracking-wider"
                            style={{ 
                              borderColor: tier.color, 
                              color: tier.color,
                              backgroundColor: `${tier.color}15`
                            }}
                          >
                            {tier.badge}
                          </span>
                          <span className="text-xs font-bold text-white">{tier.name}</span>
                        </div>
                        <span className="text-xs font-black text-white">{tier.rate}% Cut</span>
                      </div>
                      <p className="text-[9px] text-[#bfb9ca] leading-relaxed mt-1">
                        Requirement: <strong className="text-white">{tier.minReferrals}+ verified sign-ups</strong>
                      </p>
                      <p className="text-[9px] text-primary/60 italic mt-0.5">
                        {tier.perks}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* 3. Comprehensive Mentors Leaderboard & Total Sign-ups Table */}
      <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
        <CardHeader className="border-b border-primary/20 bg-primary/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-sm font-heading text-primary tracking-wide">
                Mentor Ambassador Sign-ups & Commission Index
              </CardTitle>
              <CardDescription className="text-[9px] text-primary/50 uppercase">
                Live performance summary queried from SQLite local data store
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={loadSqliteData}
              className="rounded-none border-primary/20 text-primary/70 hover:text-primary text-[10px] h-8"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Refresh SQLite
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {affiliates.length === 0 ? (
            <div className="p-8 text-center text-primary/40 text-xs">
              No mentor affiliate records found in SQLite.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#05050a]">
                <TableRow className="border-primary/20 hover:bg-transparent">
                  <TableHead className="text-[9px] uppercase text-primary/60">Mentor Partner</TableHead>
                  <TableHead className="text-[9px] uppercase text-primary/60">Referral Code</TableHead>
                  <TableHead className="text-[9px] uppercase text-primary/60 text-center">Calculated Tier</TableHead>
                  <TableHead className="text-[9px] uppercase text-primary/60 text-center">Commission Cut</TableHead>
                  <TableHead className="text-[9px] uppercase text-primary/60 text-center">Total Sign-ups</TableHead>
                  <TableHead className="text-[9px] uppercase text-primary/60">Gross Sales Volume</TableHead>
                  <TableHead className="text-[9px] uppercase text-primary/60">Commissions Accrued</TableHead>
                  <TableHead className="text-[9px] uppercase text-primary/60 text-right">Quick Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map(aff => {
                  const stats = mentorSignUpsMap[aff.id] || { 
                    total: aff.totalReferrals || 0, 
                    starter: 0, 
                    pro: 0, 
                    mentorship: 0, 
                    grossSales: 0, 
                    commissions: aff.totalEarnings || 0 
                  };
                  const mentorTier = calculateTierInfo(stats.total);

                  return (
                    <TableRow 
                      key={aff.id} 
                      className={`border-primary/10 hover:bg-primary/5 transition-colors ${
                        aff.id === selectedMentorId ? 'bg-primary/5' : ''
                      }`}
                    >
                      <TableCell>
                        <div>
                          <span className="font-bold text-xs text-white block">{aff.userName}</span>
                          <span className="text-[9px] text-[#bfb9ca] block">{aff.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 text-[10px] font-bold tracking-widest">
                          {aff.affiliateCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span 
                          className="text-[8px] px-2 py-0.5 border font-bold uppercase tracking-wider inline-block"
                          style={{ 
                            borderColor: mentorTier.currentTier.color, 
                            color: mentorTier.currentTier.color,
                            backgroundColor: `${mentorTier.currentTier.color}15`
                          }}
                        >
                          {mentorTier.currentTier.badge}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs text-primary">
                        {mentorTier.currentTier.rate}%
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs text-white">
                        {stats.total}
                      </TableCell>
                      <TableCell className="text-xs text-white">
                        €{stats.grossSales.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-green-400">
                        €{(stats.commissions || aff.totalEarnings || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[9px] text-primary/70 hover:text-primary rounded-none"
                            onClick={() => setSelectedMentorId(aff.id)}
                          >
                            Inspect
                          </Button>
                          <Button 
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 text-primary/50 hover:text-primary rounded-none"
                            onClick={() => copyMentorLink(aff.affiliateCode)}
                            title="Copy Referral Link"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
