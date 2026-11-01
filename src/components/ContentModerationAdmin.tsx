import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useDataSource } from '../hooks/useDataSource';
import { moderationService } from '../services/moderation';
import { subscribeToSqlite } from '../lib/sqlite';
import { ModerationItem, ModerationStatus, ModerationContentType } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Flag, 
  Eye, 
  MessageSquare, 
  Check, 
  X, 
  RefreshCw, 
  FileCheck, 
  Sparkles, 
  TrendingUp, 
  BarChart2, 
  Zap, 
  Trash2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

const PRESET_REJECTION_REASONS = [
  'Negative Risk/Reward (< 1:2 Ratio)',
  'Missing Hard Stop-Loss Definition',
  'Emotional/FOMO Trade (Strategy Breach)',
  'Low-Probability Setup / Lack of Confluence',
  'Insufficient Technical Context / Notes',
  'Inappropriate or Incomplete Material'
];

export function ContentModerationAdmin() {
  const { user } = useAuth();
  const { dataSource } = useDataSource();

  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | ModerationStatus | 'flagged'>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | ModerationContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Inspection & Review modal states
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [reviewMode, setReviewMode] = useState<'none' | 'approve' | 'reject'>('none');
  const [mentorNotes, setMentorNotes] = useState('');
  const [selectedRejectReason, setSelectedRejectReason] = useState(PRESET_REJECTION_REASONS[0]);
  const [customRejectReason, setCustomRejectReason] = useState('');

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const all = await moderationService.getQueue(dataSource);
      setItems(all);
    } catch (err) {
      console.error('Failed to load moderation queue:', err);
      toast.error('Failed to sync moderation queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    if (dataSource === 'sqlite') {
      const unsub = subscribeToSqlite(() => {
        loadItems();
      });
      return () => unsub();
    }
  }, [dataSource]);

  // Derived counts
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const underReviewCount = items.filter(i => i.status === 'under_review').length;
  const approvedCount = items.filter(i => i.status === 'approved').length;
  const rejectedCount = items.filter(i => i.status === 'rejected').length;
  const flaggedCount = items.filter(i => i.flagged).length;

  // Filtered list
  const filteredItems = items.filter(item => {
    if (activeStatusFilter === 'flagged') {
      if (!item.flagged) return false;
    } else if (activeStatusFilter !== 'all') {
      if (item.status !== activeStatusFilter) return false;
    }

    if (contentTypeFilter !== 'all' && item.contentType !== contentTypeFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmail = item.userEmail.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchPair = item.payload?.pair?.toLowerCase().includes(q);
      if (!matchEmail && !matchTitle && !matchPair) return false;
    }

    return true;
  });

  const handleOpenReview = (item: ModerationItem, mode: 'approve' | 'reject') => {
    setSelectedItem(item);
    setReviewMode(mode);
    setMentorNotes(item.reviewerNotes || '');
    if (mode === 'reject') {
      setSelectedRejectReason(item.rejectionReason || PRESET_REJECTION_REASONS[0]);
      setCustomRejectReason('');
    }
  };

  const handleApprove = async () => {
    if (!selectedItem || !user) return;
    setIsSubmitting(true);
    try {
      await moderationService.reviewSubmission(dataSource, {
        id: selectedItem.id,
        userId: selectedItem.userId,
        userEmail: selectedItem.userEmail,
        status: 'approved',
        reviewerNotes: mentorNotes || 'Approved by Mentor. Exceptional setup execution and trade discipline.',
        reviewerId: user.uid,
        reviewerEmail: user.email || 'Mentor',
        contentTitle: selectedItem.title
      });

      toast.success(`SUBMISSION APPROVED: ${selectedItem.title}`);
      setReviewMode('none');
      setSelectedItem(null);
      setMentorNotes('');
      await loadItems();
    } catch (err) {
      console.error(err);
      toast.error('APPROVAL FAILED');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem || !user) return;
    setIsSubmitting(true);
    const finalReason = customRejectReason.trim() ? customRejectReason : selectedRejectReason;
    try {
      await moderationService.reviewSubmission(dataSource, {
        id: selectedItem.id,
        userId: selectedItem.userId,
        userEmail: selectedItem.userEmail,
        status: 'rejected',
        rejectionReason: finalReason,
        reviewerNotes: mentorNotes,
        reviewerId: user.uid,
        reviewerEmail: user.email || 'Mentor',
        contentTitle: selectedItem.title
      });

      toast.success(`SUBMISSION REJECTED: Reason logged & transmitted to user.`);
      setReviewMode('none');
      setSelectedItem(null);
      setMentorNotes('');
      await loadItems();
    } catch (err) {
      console.error(err);
      toast.error('REJECTION ACTION FAILED');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkUnderReview = async (item: ModerationItem) => {
    if (!user) return;
    try {
      await moderationService.reviewSubmission(dataSource, {
        id: item.id,
        userId: item.userId,
        userEmail: item.userEmail,
        status: 'under_review',
        reviewerId: user.uid,
        reviewerEmail: user.email || 'Mentor',
        contentTitle: item.title
      });
      toast.info(`Status updated to 'UNDER REVIEW'`);
      await loadItems();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleToggleFlag = async (item: ModerationItem) => {
    try {
      await moderationService.toggleFlag(dataSource, item.id, Boolean(item.flagged));
      toast.success(item.flagged ? 'FLAG CLEARED' : 'CONTENT FLAGGED FOR REVIEW');
      await loadItems();
    } catch (err) {
      toast.error('Failed to toggle flag');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently purge this item from the queue?')) return;
    try {
      await moderationService.deleteItem(dataSource, id);
      toast.success('ITEM PURGED');
      if (selectedItem?.id === id) setSelectedItem(null);
      await loadItems();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0 || !user) return;
    setIsSubmitting(true);
    try {
      for (const id of selectedIds) {
        const item = items.find(i => i.id === id);
        if (item) {
          await moderationService.reviewSubmission(dataSource, {
            id: item.id,
            userId: item.userId,
            userEmail: item.userEmail,
            status: 'approved',
            reviewerNotes: 'Bulk approved by Mentor.',
            reviewerId: user.uid,
            reviewerEmail: user.email || 'Mentor',
            contentTitle: item.title
          });
        }
      }
      toast.success(`BATCH APPROVED: ${selectedIds.length} items`);
      setSelectedIds([]);
      await loadItems();
    } catch (err) {
      toast.error('Bulk approve failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredItems.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[#050507] border-primary/20 rounded-none p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-primary/60 uppercase tracking-widest">Pending Review</span>
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div className="text-3xl font-black font-heading text-amber-400 mt-2">{pendingCount}</div>
          <p className="text-[9px] text-primary/40 mt-1 uppercase">Awaiting mentor critique</p>
        </Card>

        <Card className="bg-[#050507] border-primary/20 rounded-none p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-primary/60 uppercase tracking-widest">Under Review</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-3xl font-black font-heading text-blue-400 mt-2">{underReviewCount}</div>
          <p className="text-[9px] text-primary/40 mt-1 uppercase">Being evaluated</p>
        </Card>

        <Card className="bg-[#050507] border-primary/20 rounded-none p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-primary/60 uppercase tracking-widest">Approved</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          </div>
          <div className="text-3xl font-black font-heading text-green-400 mt-2">{approvedCount}</div>
          <p className="text-[9px] text-primary/40 mt-1 uppercase">Passed risk/reward rules</p>
        </Card>

        <Card className="bg-[#050507] border-primary/20 rounded-none p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-primary/60 uppercase tracking-widest">Rejected</span>
            <XCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-3xl font-black font-heading text-red-400 mt-2">{rejectedCount}</div>
          <p className="text-[9px] text-primary/40 mt-1 uppercase">Feedback transmitted</p>
        </Card>

        <Card className="bg-[#050507] border-primary/20 rounded-none p-4 relative overflow-hidden col-span-2 md:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-primary/60 uppercase tracking-widest">Flagged Items</span>
            <Flag className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="text-3xl font-black font-heading text-orange-400 mt-2">{flaggedCount}</div>
          <p className="text-[9px] text-primary/40 mt-1 uppercase">Priority investigation</p>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
        <CardHeader className="border-b border-primary/20 bg-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg font-heading text-primary uppercase tracking-wide">
                Content Moderation & Review Engine
              </CardTitle>
            </div>
            <CardDescription className="text-[10px] text-primary/60 font-mono uppercase mt-1">
              Active Store: {dataSource === 'sqlite' ? 'Local SQLite (WASM/IDB)' : 'Firebase Firestore'} // Filter, evaluate, and notify students in real time
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadItems} 
              disabled={loading}
              className="rounded-none border-primary/20 text-primary/60 hover:text-primary text-[10px] font-mono h-8"
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Queue
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Controls: Filter Tabs & Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-primary/10 pb-6">
            {/* Status Pills */}
            <div className="flex flex-wrap gap-1 bg-[#050508] p-1 border border-primary/20">
              <button
                type="button"
                onClick={() => setActiveStatusFilter('all')}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all ${
                  activeStatusFilter === 'all' ? 'bg-primary text-black' : 'text-primary/60 hover:text-primary'
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatusFilter('pending')}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                  activeStatusFilter === 'pending' ? 'bg-amber-400 text-black' : 'text-amber-400/80 hover:text-amber-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatusFilter('under_review')}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all ${
                  activeStatusFilter === 'under_review' ? 'bg-blue-400 text-black' : 'text-blue-400/80 hover:text-blue-400'
                }`}
              >
                Under Review ({underReviewCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatusFilter('approved')}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all ${
                  activeStatusFilter === 'approved' ? 'bg-green-400 text-black' : 'text-green-400/80 hover:text-green-400'
                }`}
              >
                Approved ({approvedCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatusFilter('rejected')}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all ${
                  activeStatusFilter === 'rejected' ? 'bg-red-400 text-black' : 'text-red-400/80 hover:text-red-400'
                }`}
              >
                Rejected ({rejectedCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatusFilter('flagged')}
                className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all flex items-center gap-1 ${
                  activeStatusFilter === 'flagged' ? 'bg-orange-500 text-black' : 'text-orange-400/80 hover:text-orange-400'
                }`}
              >
                <Flag className="w-2.5 h-2.5" />
                Flagged ({flaggedCount})
              </button>
            </div>

            {/* Search and Content Type */}
            <div className="flex items-center gap-3">
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 text-primary/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="SEARCH EMAIL / PAIR..."
                  className="bg-background border-primary/20 rounded-none h-9 pl-9 text-[11px] focus:border-primary text-white"
                />
              </div>

              <select
                value={contentTypeFilter}
                onChange={e => setContentTypeFilter(e.target.value as any)}
                aria-label="Filter queue by submission type"
                className="bg-background border border-primary/20 h-9 px-3 text-[10px] uppercase text-primary tracking-wider focus:outline-none focus:border-primary"
              >
                <option value="all">All Types</option>
                <option value="trade">Trades</option>
                <option value="setup">Setups</option>
                <option value="question">Questions</option>
                <option value="resource">Resources</option>
              </select>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-primary/10 border border-primary/30 p-3 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-primary font-bold">
                {selectedIds.length} item(s) selected
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  onClick={handleBulkApprove} 
                  disabled={isSubmitting}
                  className="bg-green-500 hover:bg-green-600 text-black rounded-none h-8 text-[10px] font-bold uppercase tracking-widest"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  Bulk Approve
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds([])}
                  className="rounded-none border-primary/20 text-primary/60 hover:text-primary h-8 text-[10px] font-mono"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="border border-primary/10 overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#05050a]">
                <TableRow className="border-primary/20 hover:bg-transparent">
                  <TableHead className="w-10">
                    <input 
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredItems.length}
                      onChange={handleSelectAll}
                      className="accent-[#af46ff] cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-primary/60">Status</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-primary/60">Submitter</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-primary/60">Type & Title</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-primary/60">Execution Metrics</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-primary/60">Submitted</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-primary/60 text-right">Moderator Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-primary/40 font-mono">
                      Querying moderation queue...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-primary/40 font-mono">
                      No submissions match active filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map(item => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <TableRow 
                        key={item.id} 
                        className={`border-primary/10 transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-primary/5'
                        }`}
                      >
                        <TableCell>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            className="accent-[#af46ff] cursor-pointer"
                          />
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {item.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Pending
                              </span>
                            )}
                            {item.status === 'under_review' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                <Clock className="w-2.5 h-2.5" />
                                Under Review
                              </span>
                            )}
                            {item.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/30">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Approved
                              </span>
                            )}
                            {item.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
                                <XCircle className="w-2.5 h-2.5" />
                                Rejected
                              </span>
                            )}
                            {item.flagged && (
                              <span title="Flagged content" className="text-orange-500">
                                <Flag className="w-3 h-3 fill-orange-500" />
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Submitter */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-bold text-white block">{item.userEmail}</span>
                            <span className="text-[9px] text-[#bfb9ca]/60 font-mono block">UID: {item.userId.substring(0, 8)}...</span>
                          </div>
                        </TableCell>

                        {/* Type & Title */}
                        <TableCell>
                          <div className="space-y-0.5 max-w-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] uppercase px-1.5 py-0.2 bg-primary/10 border border-primary/20 text-primary font-bold">
                                {item.contentType}
                              </span>
                              <span className="font-bold text-white truncate block">{item.title}</span>
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-[#bfb9ca]/80 line-clamp-1 italic">
                                "{item.description}"
                              </p>
                            )}
                            {item.rejectionReason && (
                              <p className="text-[10px] text-red-400 line-clamp-1">
                                Rejection: {item.rejectionReason}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Execution Metrics */}
                        <TableCell>
                          {item.payload?.pair ? (
                            <div className="space-y-0.5 text-[10px]">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">{item.payload.pair}</span>
                                {item.payload.exchange && (
                                  <span className="text-[9px] text-zinc-400">({item.payload.exchange})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-zinc-300">
                                <span>Entry: {item.payload.orderEntry ?? '-'}</span>
                                {item.payload.riskRewardRatio && (
                                  <span className="text-green-400 font-bold">R:R {item.payload.riskRewardRatio}</span>
                                )}
                                {item.payload.pnl !== undefined && (
                                  <span className={item.payload.pnl >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                    {item.payload.pnl >= 0 ? `+$${item.payload.pnl}` : `-$${Math.abs(item.payload.pnl)}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-[10px]">General Material</span>
                          )}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-[10px] text-[#bfb9ca]/70 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>

                        {/* Moderator Actions */}
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedItem(item);
                                setReviewMode('none');
                              }}
                              className="h-7 px-2 border-primary/20 text-primary/80 hover:text-primary rounded-none text-[9px] font-mono"
                              title="Inspect Full Details"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Inspect
                            </Button>

                            {/* Quick Approve */}
                            {item.status !== 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenReview(item, 'approve')}
                                className="h-7 px-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-none text-[9px] font-bold uppercase tracking-wider"
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                            )}

                            {/* Quick Reject */}
                            {item.status !== 'rejected' && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenReview(item, 'reject')}
                                className="h-7 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-none text-[9px] font-bold uppercase tracking-wider"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            )}

                            {/* Flag Toggle */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleFlag(item)}
                              className={`h-7 w-7 p-0 rounded-none ${
                                item.flagged ? 'text-orange-500 bg-orange-500/10' : 'text-zinc-600 hover:text-orange-400'
                              }`}
                              title={item.flagged ? 'Remove Flag' : 'Flag Content'}
                            >
                              <Flag className="w-3 h-3" />
                            </Button>

                            {/* Delete */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                              className="h-7 w-7 p-0 text-zinc-600 hover:text-red-400 rounded-none"
                              title="Delete from Queue"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review & Inspection Modal Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#09090d] border border-primary/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-[0_0_50px_rgba(175,70,255,0.2)]">
            <button
              onClick={() => {
                setSelectedItem(null);
                setReviewMode('none');
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="border-b border-primary/20 pb-4 mb-6">
              <div className="flex items-center gap-2 text-[10px] text-primary/60 uppercase tracking-widest mb-1">
                <span>Moderation Docket</span>
                <span>//</span>
                <span>ID: {selectedItem.id}</span>
              </div>
              <h3 className="text-xl font-heading font-black text-white uppercase tracking-wide">
                {selectedItem.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Submitted by: <strong className="text-primary">{selectedItem.userEmail}</strong> on {new Date(selectedItem.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Content Details */}
            <div className="space-y-4">
              {/* Description / Strategy Notes */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-primary/60 font-bold block mb-1">
                  Student Setup / Analysis Description
                </label>
                <div className="p-3 bg-secondary/30 border border-primary/10 text-xs text-zinc-200 whitespace-pre-wrap">
                  {selectedItem.description || 'No descriptive notes provided.'}
                </div>
              </div>

              {/* Trade Specific Payload */}
              {selectedItem.payload && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-primary/60 font-bold block mb-2">
                    Trade Matrix & Parameters
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2.5 bg-black/60 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-400 block">Instrument</span>
                      <span className="text-sm font-bold text-white font-mono">{selectedItem.payload.pair || 'N/A'}</span>
                    </div>
                    <div className="p-2.5 bg-black/60 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-400 block">Entry Price</span>
                      <span className="text-sm font-bold text-white font-mono">{selectedItem.payload.orderEntry || 'N/A'}</span>
                    </div>
                    <div className="p-2.5 bg-black/60 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-400 block">Exit / TP</span>
                      <span className="text-sm font-bold text-white font-mono">{selectedItem.payload.orderExit || 'N/A'}</span>
                    </div>
                    <div className="p-2.5 bg-black/60 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-400 block">Stop-Loss</span>
                      <span className="text-sm font-bold text-amber-400 font-mono">{selectedItem.payload.stopLoss || 'NOT DEFINED'}</span>
                    </div>
                    <div className="p-2.5 bg-black/60 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-400 block">Risk:Reward</span>
                      <span className="text-sm font-bold text-green-400 font-mono">{selectedItem.payload.riskRewardRatio ? `1:${selectedItem.payload.riskRewardRatio}` : 'N/A'}</span>
                    </div>
                    <div className="p-2.5 bg-black/60 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-400 block">Net PnL</span>
                      <span className={`text-sm font-bold font-mono ${selectedItem.payload.pnl && selectedItem.payload.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedItem.payload.pnl !== undefined ? `$${selectedItem.payload.pnl.toFixed(2)}` : 'N/A'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-black/60 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-400 block">Exchange</span>
                      <span className="text-sm font-bold text-white font-mono">{selectedItem.payload.exchange || 'Direct'}</span>
                    </div>
                    <div className="p-2.5 bg-black/60 border border-white/5">
                      <span className="text-[9px] uppercase text-zinc-400 block">Psychology State</span>
                      <span className="text-sm font-bold text-primary font-mono capitalize">{selectedItem.payload.emotion || 'Neutral'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Audit Info */}
              <div className="p-3 bg-primary/5 border border-primary/20 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Current Status:</span>
                  <span className="font-bold text-white uppercase">{selectedItem.status}</span>
                </div>
                {selectedItem.reviewerEmail && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Reviewed By:</span>
                    <span className="text-primary">{selectedItem.reviewerEmail} ({selectedItem.reviewedAt ? new Date(selectedItem.reviewedAt).toLocaleDateString() : ''})</span>
                  </div>
                )}
                {selectedItem.rejectionReason && (
                  <div className="flex justify-between">
                    <span className="text-red-400">Rejection Reason:</span>
                    <span className="text-red-300 font-bold">{selectedItem.rejectionReason}</span>
                  </div>
                )}
                {selectedItem.reviewerNotes && (
                  <div className="mt-2 pt-2 border-t border-primary/10">
                    <span className="text-zinc-400 block text-[10px] uppercase">Mentor Evaluation Note:</span>
                    <p className="text-primary italic mt-0.5">"{selectedItem.reviewerNotes}"</p>
                  </div>
                )}
              </div>

              {/* Action Form If In Review Mode */}
              {reviewMode === 'approve' && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase">
                    <Sparkles className="w-4 h-4" />
                    Approve Submission & Notify Student
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-300 block mb-1">
                      Mentor Feedback / Commendation (Optional)
                    </label>
                    <textarea
                      value={mentorNotes}
                      onChange={e => setMentorNotes(e.target.value)}
                      placeholder="e.g. Excellent execution on HTF confluence! Risk management executed perfectly."
                      className="w-full h-20 bg-background border border-green-500/30 p-2 text-xs text-white focus:outline-none focus:border-green-400 resize-none font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold uppercase tracking-wider text-[11px] rounded-none h-10"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirm Approval & Send Notification
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setReviewMode('none')}
                      className="border-white/20 text-white rounded-none h-10 text-[11px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {reviewMode === 'reject' && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    Reject Submission & Transmit Corrective Guidance
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-300 block mb-1">
                      Select Primary Rejection Reason
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                      {PRESET_REJECTION_REASONS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSelectedRejectReason(r)}
                          className={`p-2 text-[10px] text-left border uppercase tracking-wider transition-all ${
                            selectedRejectReason === r
                              ? 'bg-red-500 text-black border-red-500 font-bold'
                              : 'bg-black/40 border-red-500/20 text-zinc-300 hover:border-red-500/50'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    <Input
                      placeholder="Or specify custom rejection reason..."
                      value={customRejectReason}
                      onChange={e => setCustomRejectReason(e.target.value)}
                      className="bg-background border-red-500/30 text-xs text-white rounded-none h-9 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-zinc-300 block mb-1">
                      Actionable Mentor Critique (Crucial for Student Growth)
                    </label>
                    <textarea
                      value={mentorNotes}
                      onChange={e => setMentorNotes(e.target.value)}
                      placeholder="Detail exactly what requires fixing (e.g. Always place hard stop-loss behind swing low before entering, reread module 3)..."
                      className="w-full h-20 bg-background border border-red-500/30 p-2 text-xs text-white focus:outline-none focus:border-red-400 resize-none font-mono"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wider text-[11px] rounded-none h-10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Commit Rejection & Transmit Feedback
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setReviewMode('none')}
                      className="border-white/20 text-white rounded-none h-10 text-[11px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons if not currently in a sub-mode */}
              {reviewMode === 'none' && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-primary/20">
                  <Button
                    onClick={() => setReviewMode('approve')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold uppercase tracking-wider text-xs rounded-none h-11"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Submission
                  </Button>

                  <Button
                    onClick={() => setReviewMode('reject')}
                    className="flex-1 bg-red-500/90 hover:bg-red-600 text-white font-bold uppercase tracking-wider text-xs rounded-none h-11"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject With Reasons
                  </Button>

                  {selectedItem.status !== 'under_review' && (
                    <Button
                      variant="outline"
                      onClick={() => handleMarkUnderReview(selectedItem)}
                      className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 rounded-none h-11 text-xs uppercase"
                    >
                      <Clock className="w-4 h-4 mr-1.5" />
                      Mark Under Review
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
