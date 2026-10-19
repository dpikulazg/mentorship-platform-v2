import React, { useState, useEffect } from 'react';
import { Affiliate, AffiliateReferral, AffiliatePayout } from '../types';
import { unifiedDataService } from '../services/dataSource';
import { useDataSource } from '../hooks/useDataSource';
import { toast } from 'sonner';
import { 
  Users, DollarSign, Award, ArrowUpRight, Plus, 
  Send, CheckCircle2, Clock, AlertCircle, Copy, 
  ExternalLink, Trash2, Edit3, Filter, ShieldCheck, 
  CreditCard, RefreshCw, Sparkles, TrendingUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AffiliateDashboard } from './AffiliateDashboard';

export function AffiliateAdmin() {
  const { updateTick } = useDataSource();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'directory' | 'dashboard'>('directory');

  // Form states - Create / Edit Affiliate
  const [showAddModal, setShowAddModal] = useState(false);
  const [affiliateName, setAffiliateName] = useState('');
  const [affiliateEmail, setAffiliateEmail] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [commissionRate, setCommissionRate] = useState(20);
  const [payoutMethod, setPayoutMethod] = useState<'crypto_usdt' | 'bank_iban' | 'revolut' | 'paypal'>('crypto_usdt');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [editingAffiliateId, setEditingAffiliateId] = useState<string | null>(null);

  // Form states - Payout modal
  const [payoutAffiliate, setPayoutAffiliate] = useState<Affiliate | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutRefId, setPayoutRefId] = useState('');

  // Form states - Simulate Referral
  const [simAffiliateId, setSimAffiliateId] = useState<string>('');
  const [simUserEmail, setSimUserEmail] = useState('novi.klijent@crypto.hr');
  const [simPlan, setSimPlan] = useState<'starter' | 'pro' | 'mentorship'>('mentorship');

  const planPrices: Record<'starter' | 'pro' | 'mentorship', number> = {
    starter: 99.00,
    pro: 249.00,
    mentorship: 499.00
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [affs, refs, pays] = await Promise.all([
        unifiedDataService.getAffiliates(),
        unifiedDataService.getAffiliateReferrals(),
        unifiedDataService.getAffiliatePayouts()
      ]);
      setAffiliates(affs);
      setReferrals(refs);
      setPayouts(pays);
    } catch (err) {
      console.error('Failed to load affiliate data:', err);
      toast.error('Failed to load affiliate records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [updateTick]);

  // Aggregate stats
  const totalAffiliates = affiliates.length;
  const totalEarningsAll = affiliates.reduce((sum, a) => sum + (a.totalEarnings || 0), 0);
  const totalUnpaidLiability = affiliates.reduce((sum, a) => sum + (a.unpaidBalance || 0), 0);
  const totalReferredSales = referrals.reduce((sum, r) => sum + (r.saleAmount || 0), 0);
  const totalPaidOut = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleSaveAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliateName.trim() || !affiliateEmail.trim() || !affiliateCode.trim()) {
      toast.error('Partner name, email and unique referral code are required.');
      return;
    }

    const cleanCode = affiliateCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');

    try {
      const existing = affiliates.find(a => a.id === editingAffiliateId);
      const affiliateData: Affiliate = {
        id: editingAffiliateId || `aff-${Date.now().toString(36)}`,
        userName: affiliateName.trim(),
        userEmail: affiliateEmail.trim(),
        affiliateCode: cleanCode,
        commissionRate: Number(commissionRate) || 20,
        totalEarnings: existing ? existing.totalEarnings : 0,
        unpaidBalance: existing ? existing.unpaidBalance : 0,
        totalReferrals: existing ? existing.totalReferrals : 0,
        status: existing ? existing.status : 'active',
        payoutMethod,
        payoutDetails: payoutDetails.trim() || 'Pending verification',
        createdAt: existing ? existing.createdAt : new Date().toISOString()
      };

      await unifiedDataService.saveAffiliate(affiliateData);
      toast.success(editingAffiliateId ? 'AFFILIATE PARTNER UPDATED' : 'NEW AFFILIATE PARTNER REGISTERED');
      resetAffiliateForm();
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save affiliate partner.');
    }
  };

  const handleEditClick = (aff: Affiliate) => {
    setEditingAffiliateId(aff.id);
    setAffiliateName(aff.userName);
    setAffiliateEmail(aff.userEmail);
    setAffiliateCode(aff.affiliateCode);
    setCommissionRate(aff.commissionRate);
    setPayoutMethod(aff.payoutMethod);
    setPayoutDetails(aff.payoutDetails);
    setShowAddModal(true);
  };

  const handleDeleteAffiliate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove affiliate partner "${name}"?`)) return;
    try {
      await unifiedDataService.deleteAffiliate(id);
      toast.success('AFFILIATE REMOVED FROM REGISTRY');
      loadData();
    } catch (err: any) {
      toast.error('Failed to delete affiliate.');
    }
  };

  const resetAffiliateForm = () => {
    setEditingAffiliateId(null);
    setAffiliateName('');
    setAffiliateEmail('');
    setAffiliateCode('');
    setCommissionRate(20);
    setPayoutMethod('crypto_usdt');
    setPayoutDetails('');
  };

  const handleOpenPayout = (aff: Affiliate) => {
    setPayoutAffiliate(aff);
    setPayoutAmount(aff.unpaidBalance);
    setPayoutRefId(`TXID-${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
  };

  const handleExecutePayout = async () => {
    if (!payoutAffiliate || payoutAmount <= 0) {
      toast.error('Invalid payout amount.');
      return;
    }

    try {
      const payout: AffiliatePayout = {
        id: `pay-${Date.now().toString(36)}`,
        affiliateId: payoutAffiliate.id,
        affiliateCode: payoutAffiliate.affiliateCode,
        amount: payoutAmount,
        payoutMethod: payoutAffiliate.payoutMethod,
        payoutDetails: payoutAffiliate.payoutDetails,
        referenceId: payoutRefId.trim() || `SETTLE-${Date.now()}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      await unifiedDataService.processPayout(payout);
      toast.success(`PAYOUT OF €${payoutAmount.toFixed(2)} DISPATCHED TO ${payoutAffiliate.userName.toUpperCase()}`);
      setPayoutAffiliate(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to process payout.');
    }
  };

  const handleSimulateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simAffiliateId) {
      toast.error('Select an affiliate partner first.');
      return;
    }

    const partner = affiliates.find(a => a.id === simAffiliateId);
    if (!partner) return;

    const saleAmount = planPrices[simPlan];
    const commission = (saleAmount * partner.commissionRate) / 100;

    try {
      const newRef: AffiliateReferral = {
        id: `ref-${Date.now().toString(36)}`,
        affiliateId: partner.id,
        affiliateCode: partner.affiliateCode,
        referredUserEmail: simUserEmail.trim() || 'anonymous@crypto.hr',
        plan: simPlan,
        saleAmount,
        commissionAmount: Number(commission.toFixed(2)),
        status: 'approved',
        createdAt: new Date().toISOString()
      };

      await unifiedDataService.recordReferral(newRef);
      toast.success(`ATTRIBUTED REFERRAL: €${commission.toFixed(2)} CREDITED TO ${partner.affiliateCode}`);
      loadData();
    } catch (err: any) {
      toast.error('Simulation failed.');
    }
  };

  const copyReferralLink = (code: string) => {
    const url = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success(`COPIED REFERRAL LINK: ${url}`);
  };

  return (
    <div className="space-y-10 font-mono">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-all shadow-[0_0_10px_rgba(175,70,255,0.2)]" />
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-primary/50 uppercase tracking-widest">Active Partners</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-black font-heading text-white tracking-tight">{totalAffiliates}</div>
            <p className="text-[9px] text-[#bfb9ca] mt-2">Certified mentor ambassadors</p>
          </CardContent>
        </Card>

        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500/40 group-hover:bg-green-500 transition-all shadow-[0_0_10px_rgba(34,197,94,0.2)]" />
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-green-400/60 uppercase tracking-widest">Referred Sales Volume</span>
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-3xl font-black font-heading text-white tracking-tight">€{totalReferredSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-[9px] text-[#bfb9ca] mt-2">Gross subscription revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/40 group-hover:bg-yellow-500 transition-all shadow-[0_0_10px_rgba(234,179,8,0.2)]" />
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-yellow-400/60 uppercase tracking-widest">Pending Payout Liability</span>
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-3xl font-black font-heading text-yellow-400 tracking-tight">€{totalUnpaidLiability.toFixed(2)}</div>
            <p className="text-[9px] text-[#bfb9ca] mt-2">Unpaid accrued commissions</p>
          </CardContent>
        </Card>

        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/40 group-hover:bg-purple-500 transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)]" />
          <CardContent className="p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-purple-400/60 uppercase tracking-widest">Settled Payouts</span>
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black font-heading text-white tracking-tight">€{totalPaidOut.toFixed(2)}</div>
            <p className="text-[9px] text-[#bfb9ca] mt-2">{payouts.length} successful transfers</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0712] p-4 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/20 text-primary">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Affiliate & Partner Protocol</h3>
            <p className="text-[10px] text-primary/50">Stored securely in SQLite with instant transaction settlement</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-primary/20 p-0.5 bg-[#050508] gap-1">
            <button
              type="button"
              onClick={() => setViewMode('directory')}
              className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all ${
                viewMode === 'directory' ? 'bg-primary text-black' : 'text-primary/60 hover:text-primary'
              }`}
            >
              Operations & Directory
            </button>
            <button
              type="button"
              onClick={() => setViewMode('dashboard')}
              className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all ${
                viewMode === 'dashboard' ? 'bg-primary text-black' : 'text-primary/60 hover:text-primary'
              }`}
            >
              Mentor Tiers & Sign-ups
            </button>
          </div>

          <Button 
            onClick={() => { resetAffiliateForm(); setShowAddModal(true); }}
            className="rounded-none bg-primary text-black hover:bg-primary/80 text-[10px] font-bold uppercase tracking-widest h-9 px-4"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Register Partner
          </Button>
          <Button 
            variant="outline" 
            onClick={loadData}
            className="rounded-none border-primary/20 text-primary/70 hover:text-primary text-[10px] h-9 px-3"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {viewMode === 'dashboard' ? (
        <AffiliateDashboard />
      ) : (
        <>
          {/* Main Affiliate Directory Table */}
          <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
        <CardHeader className="border-b border-primary/20 bg-primary/5">
          <CardTitle className="text-sm font-heading text-primary tracking-wide">
            Registered Affiliate Ambassadors
          </CardTitle>
          <CardDescription className="text-[9px] text-primary/50 uppercase">
            Direct tracking codes, commission splits, and pending payout ledger
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {affiliates.length === 0 ? (
            <div className="p-8 text-center text-primary/40 text-xs">
              No affiliate ambassadors registered. Click "Register Partner" above.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#05050a]">
                <TableRow className="border-primary/20 hover:bg-transparent">
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60">Partner</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60">Referral Code</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60 text-center">Cut %</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60 text-center">Referrals</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60">Earnings</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60">Unpaid Balance</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60">Payout Target</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map((aff) => (
                  <TableRow key={aff.id} className="border-primary/10 hover:bg-primary/5 transition-colors">
                    <TableCell>
                      <div>
                        <span className="font-bold text-xs text-white block">{aff.userName}</span>
                        <span className="text-[9px] text-[#bfb9ca] block">{aff.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 text-[10px] font-bold tracking-widest">
                          {aff.affiliateCode}
                        </span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="w-6 h-6 text-primary/50 hover:text-primary rounded-none"
                          onClick={() => copyReferralLink(aff.affiliateCode)}
                          title="Copy Referral URL"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-primary">
                      {aff.commissionRate}%
                    </TableCell>
                    <TableCell className="text-center text-xs text-white">
                      {aff.totalReferrals || 0}
                    </TableCell>
                    <TableCell className="text-xs text-white font-bold">
                      €{(aff.totalEarnings || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold ${aff.unpaidBalance > 0 ? 'text-yellow-400' : 'text-[#bfb9ca]'}`}>
                        €{(aff.unpaidBalance || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-[9px] max-w-[140px] truncate text-[#bfb9ca]" title={aff.payoutDetails}>
                        <span className="uppercase text-primary/60 font-bold block">{aff.payoutMethod.replace('_', ' ')}</span>
                        {aff.payoutDetails || 'None provided'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        {aff.unpaidBalance > 0 && (
                          <Button 
                            size="sm" 
                            className="h-7 text-[9px] bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500 hover:text-black border border-yellow-500/30 rounded-none px-2"
                            onClick={() => handleOpenPayout(aff)}
                          >
                            <Send className="w-2.5 h-2.5 mr-1" /> Payout
                          </Button>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="w-7 h-7 text-primary/50 hover:text-primary rounded-none"
                          onClick={() => handleEditClick(aff)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="w-7 h-7 text-primary/50 hover:text-red-500 rounded-none"
                          onClick={() => handleDeleteAffiliate(aff.id, aff.userName)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout: Simulate Referral Conversion + Recent Payout Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Referral Simulation Tool & Quick Link Generator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
            <CardHeader className="border-b border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-heading text-primary tracking-wide">
                  Referral Conversion Tester & Engine
                </CardTitle>
              </div>
              <CardDescription className="text-[9px] text-primary/50 uppercase">
                Simulate client subscription to verify commission calculations in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSimulateReferral} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-primary/60 uppercase font-bold">Select Affiliate Code</label>
                  <Select value={simAffiliateId} onValueChange={setSimAffiliateId}>
                    <SelectTrigger className="bg-transparent border-primary/20 rounded-none text-xs h-9 text-white">
                      <SelectValue placeholder="Choose an affiliate partner..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b0814] border-primary/30 text-white font-mono text-xs">
                      {affiliates.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.affiliateCode} - {a.userName} ({a.commissionRate}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-primary/60 uppercase font-bold">Referred Client Email</label>
                  <Input 
                    type="email" 
                    value={simUserEmail}
                    onChange={e => setSimUserEmail(e.target.value)}
                    placeholder="student.trader@stampar.hr"
                    className="bg-transparent border-primary/20 rounded-none text-xs h-9 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-primary/60 uppercase font-bold">Selected Subscription Plan</label>
                  <Select value={simPlan} onValueChange={(val: any) => setSimPlan(val)}>
                    <SelectTrigger className="bg-transparent border-primary/20 rounded-none text-xs h-9 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b0814] border-primary/30 text-white font-mono text-xs">
                      <SelectItem value="starter">Starter Pass (€99.00)</SelectItem>
                      <SelectItem value="pro">Pro Scalper Tier (€249.00)</SelectItem>
                      <SelectItem value="mentorship">Elite Mentorship VIP (€499.00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {simAffiliateId && (
                  <div className="p-3 bg-primary/10 border border-primary/20 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-primary/70">Plan Price:</span>
                      <span className="text-white font-bold">€{planPrices[simPlan].toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary/70">Commission Cut:</span>
                      <span className="text-primary font-bold">
                        {affiliates.find(a => a.id === simAffiliateId)?.commissionRate}%
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-primary/20 pt-1">
                      <span className="text-white font-bold">Instant Payout Accrual:</span>
                      <span className="text-green-400 font-bold">
                        €{((planPrices[simPlan] * (affiliates.find(a => a.id === simAffiliateId)?.commissionRate || 20)) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-black hover:bg-primary/80 font-bold text-[10px] uppercase tracking-widest h-9 rounded-none"
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-2" />
                  Simulate Referral Sale
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Conversion & Settlement History (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
            <CardHeader className="border-b border-primary/20 bg-primary/5">
              <CardTitle className="text-sm font-heading text-primary tracking-wide">
                Recent Referral Conversions Ledger
              </CardTitle>
              <CardDescription className="text-[9px] text-primary/50 uppercase">
                Audit trail of all attributed memberships
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 max-h-[360px] overflow-y-auto">
              {referrals.length === 0 ? (
                <div className="p-6 text-center text-primary/40 text-xs">
                  No conversions logged yet.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-[#05050a]">
                    <TableRow className="border-primary/20">
                      <TableHead className="text-[9px] uppercase text-primary/60">Date</TableHead>
                      <TableHead className="text-[9px] uppercase text-primary/60">Partner Code</TableHead>
                      <TableHead className="text-[9px] uppercase text-primary/60">Client</TableHead>
                      <TableHead className="text-[9px] uppercase text-primary/60">Tier</TableHead>
                      <TableHead className="text-[9px] uppercase text-primary/60 text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map(r => (
                      <TableRow key={r.id} className="border-primary/10 hover:bg-primary/5">
                        <TableCell className="text-[9px] text-[#bfb9ca]">
                          {r.createdAt.substring(0, 10)}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-primary">
                          {r.affiliateCode}
                        </TableCell>
                        <TableCell className="text-[10px] text-white truncate max-w-[120px]">
                          {r.referredUserEmail}
                        </TableCell>
                        <TableCell className="text-[9px] uppercase text-primary/80">
                          {r.plan}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-green-400">
                          +€{r.commissionAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Processed Payouts History */}
          <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
            <CardHeader className="border-b border-primary/20 bg-primary/5">
              <CardTitle className="text-sm font-heading text-primary tracking-wide">
                Completed Commission Payouts
              </CardTitle>
              <CardDescription className="text-[9px] text-primary/50 uppercase">
                Cryptographic transaction receipts and wire transfers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
              {payouts.length === 0 ? (
                <div className="p-6 text-center text-primary/40 text-xs">
                  No payouts executed yet.
                </div>
              ) : (
                <div className="divide-y divide-primary/10">
                  {payouts.map(p => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-primary/5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{p.affiliateCode}</span>
                          <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/30 px-1 py-0.5 uppercase tracking-widest">
                            Settled
                          </span>
                        </div>
                        <p className="text-[9px] text-[#bfb9ca]">{p.referenceId || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-white">€{p.amount.toFixed(2)}</span>
                        <span className="text-[8px] text-primary/40 uppercase block">{p.payoutMethod.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
      </>
      )}

      {/* Modal - Register / Edit Partner */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0814] border border-primary/30 w-full max-w-lg p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-primary/20 pb-3">
              <h3 className="text-base font-heading text-primary">
                {editingAffiliateId ? 'Modify Affiliate Partner' : 'Register New Affiliate Partner'}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAddModal(false)}
                className="text-primary/60 hover:text-white rounded-none"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSaveAffiliate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-primary/60 uppercase font-bold">Partner Full Name</label>
                <Input 
                  value={affiliateName} 
                  onChange={e => setAffiliateName(e.target.value)} 
                  placeholder="e.g. Dario Forensics"
                  className="bg-transparent border-primary/20 rounded-none text-xs text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-primary/60 uppercase font-bold">Contact Email</label>
                <Input 
                  type="email"
                  value={affiliateEmail} 
                  onChange={e => setAffiliateEmail(e.target.value)} 
                  placeholder="partner@forensics.hr"
                  className="bg-transparent border-primary/20 rounded-none text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-primary/60 uppercase font-bold">Custom Promo / Referral Code</label>
                  <Input 
                    value={affiliateCode} 
                    onChange={e => setAffiliateCode(e.target.value.toUpperCase())} 
                    placeholder="ALPHA_PRO"
                    className="bg-transparent border-primary/20 rounded-none text-xs text-white uppercase font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-primary/60 uppercase font-bold">Commission Cut (%)</label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={commissionRate} 
                    onChange={e => setCommissionRate(parseFloat(e.target.value) || 20)} 
                    className="bg-transparent border-primary/20 rounded-none text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-primary/60 uppercase font-bold">Preferred Payout Channel</label>
                <Select value={payoutMethod} onValueChange={(val: any) => setPayoutMethod(val)}>
                  <SelectTrigger className="bg-transparent border-primary/20 rounded-none text-xs h-9 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0814] border-primary/30 text-white font-mono text-xs">
                    <SelectItem value="crypto_usdt">USDT Crypto Wallet (TRC-20 / ERC-20)</SelectItem>
                    <SelectItem value="bank_iban">SEPA / EU Bank Wire (IBAN)</SelectItem>
                    <SelectItem value="revolut">Revolut Handle (@tag)</SelectItem>
                    <SelectItem value="paypal">PayPal Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-primary/60 uppercase font-bold">Wallet Address / IBAN Details</label>
                <Input 
                  value={payoutDetails} 
                  onChange={e => setPayoutDetails(e.target.value)} 
                  placeholder="e.g. TRC20: TXYZ... or HR12 2360..."
                  className="bg-transparent border-primary/20 rounded-none text-xs text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-primary/20">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowAddModal(false)}
                  className="rounded-none text-xs text-primary/60"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-black hover:bg-primary/80 rounded-none text-xs font-bold uppercase tracking-wider px-6"
                >
                  {editingAffiliateId ? 'Update Partner' : 'Confirm Registration'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Process Payout */}
      {payoutAffiliate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0814] border border-yellow-500/40 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-primary/20 pb-3">
              <h3 className="text-sm font-heading text-yellow-400">
                Disburse Commission Settlement
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setPayoutAffiliate(null)}
                className="text-primary/60 hover:text-white rounded-none"
              >
                ✕
              </Button>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-xs space-y-1">
              <p className="text-white font-bold">{payoutAffiliate.userName} ({payoutAffiliate.affiliateCode})</p>
              <p className="text-primary/70">{payoutAffiliate.payoutMethod.replace('_', ' ').toUpperCase()}: {payoutAffiliate.payoutDetails}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-primary/60 uppercase font-bold">Disbursement Amount (€)</label>
              <Input 
                type="number"
                step="0.01"
                value={payoutAmount}
                onChange={e => setPayoutAmount(parseFloat(e.target.value) || 0)}
                className="bg-transparent border-primary/20 rounded-none text-xs text-white font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-primary/60 uppercase font-bold">Payment Reference / Tx Hash</label>
              <Input 
                value={payoutRefId}
                onChange={e => setPayoutRefId(e.target.value)}
                placeholder="TXID_9941..."
                className="bg-transparent border-primary/20 rounded-none text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-primary/20">
              <Button 
                variant="ghost" 
                onClick={() => setPayoutAffiliate(null)}
                className="rounded-none text-xs text-primary/60"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleExecutePayout}
                className="bg-yellow-400 text-black hover:bg-yellow-300 rounded-none text-xs font-bold uppercase tracking-wider px-6"
              >
                Confirm Settlement
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
