import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ContentItem, UserProfile, AppSettings } from '../types';
import { Plus, Save, Trash2, UserCog, FileText, CreditCard, Activity, Shield, Terminal, Zap, Banknote, Users, ClipboardCheck, TrendingUp, Video, UserCheck, UserX, Award, Database, HardDrive } from 'lucide-react';
import { EngagementMetricsChart } from '../components/EngagementMetricsChart';
import { PaymentHistory } from '../components/PaymentHistory';
import { AdminVideoCMS } from '../components/AdminVideoCMS';
import { ProductsAdmin } from '../components/ProductsAdmin';
import { TradeAnalysisAdmin } from '../components/TradeAnalysisAdmin';
import { AffiliateAdmin } from '../components/AffiliateAdmin';
import { SqliteStudio } from '../components/SqliteStudio';
import { MentorshipVideoLibrary } from '../components/MentorshipVideoLibrary';
import { useDataSource } from '../hooks/useDataSource';
import { Target, Film } from 'lucide-react';

export function Admin() {
  const { t } = useTranslation();
  const { isAdmin, loading: authLoading } = useAuth();
  const { dataSource, switchDataSource } = useDataSource();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ monetizationEnabled: false, subscriptionPrice: 0, currency: 'EUR' });
  const [newContent, setNewContent] = useState<Partial<ContentItem>>({ key: '', en: '', hr: '', type: 'text' });
  const [videoViewMode, setVideoViewMode] = useState<'library' | 'cms'>('library');



  const [activeTab, setActiveTab] = useState('overview');

  const stats = React.useMemo(() => {
    const totalRevenue = users.reduce((acc, user) => {
      // Simple logic: if pro/mentorship, add price
      if (user.plan === 'pro' || user.plan === 'mentorship') {
        return acc + settings.subscriptionPrice;
      }
      return acc;
    }, 0);

    const mentorshipUsers = users.filter(u => u.plan === 'mentorship').length;
    const pendingVerifications = users.filter(u => u.status === 'pending').length;

    return {
      totalRevenue,
      mentorshipUsers,
      pendingVerifications,
      capacity: 25 // Arbitrary capacity for "slots"
    };
  }, [users, settings]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => d.data() as UserProfile));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    const unsubContent = onSnapshot(collection(db, 'content'), (snap) => {
      setContent(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentItem)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'content'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) setSettings(snap.data() as AppSettings);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/global'));

    return () => {
      unsubUsers();
      unsubContent();
      unsubSettings();
    };
  }, [isAdmin]);

  const handleUpdateUserRole = async (uid: string, role: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      toast.success('SUBJECT ACCESS LEVEL MODIFIED');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      toast.error('ACCESS MODIFICATION FAILED');
    }
  };

  const handleUpdateUserStatus = async (uid: string, status: 'pending' | 'active' | 'suspended') => {
    try {
      await updateDoc(doc(db, 'users', uid), { status });
      toast.success(`STUDENT STATE RE-CONFIGURED TO ${status.toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      toast.error('STATE PROTOCOL UPDATE FAILED');
    }
  };

  const handleUpdateUserPlan = async (uid: string, plan: 'starter' | 'pro' | 'mentorship') => {
    try {
      await updateDoc(doc(db, 'users', uid), { plan });
      toast.success(`STUDENT CURRICULUM PLAN CHANGED TO ${plan.toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      toast.error('PLAN ACCREDITATION FAILED');
    }
  };

  const handleSaveContent = async (item: ContentItem) => {
    try {
      await updateDoc(doc(db, 'content', item.id), { ...item, lastUpdated: new Date().toISOString() });
      toast.success('ASSET MODULE UPDATED');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `content/${item.id}`);
      toast.error('ASSET UPDATE FAILED');
    }
  };

  const handleAddContent = async () => {
    if (!newContent.key) {
      toast.error('KEY IDENTIFIER REQUIRED');
      return;
    }
    const id = Math.random().toString(36).substr(2, 9);
    try {
      await setDoc(doc(db, 'content', id), {
        ...newContent,
        id,
        lastUpdated: new Date().toISOString()
      });
      setNewContent({ key: '', en: '', hr: '', type: 'text' });
      toast.success('NEW ASSET APPENDED');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `content/${id}`);
      toast.error('ASSET CREATION FAILED');
    }
  };

  const handleDeleteContent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'content', id));
      toast.success('ASSET PURGED FROM REGISTRY');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `content/${id}`);
      toast.error('PURGE PROTOCOL FAILED');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      toast.success('GLOBAL PROTOCOL CHANGES COMMITTED');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
      toast.error('COMMIT FAILED');
    }
  };

  if (authLoading) return <div className="p-8">{t('common.loading')}</div>;
  if (!isAdmin) return <div className="p-8 text-destructive">Access Denied</div>;

  return (
    <div className="container mx-auto px-6 py-10 relative">
      {/* Decorative terminal elements */}
      <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-primary/30 pointer-events-none hidden lg:block text-right">
        CRYPTO_MENTOR_PRO_OS [v2.4.0]<br/>
        NODE_STATUS: OPTIMAL<br/>
        SECURITY_PROTOCOL: ACTIVE<br/>
        {new Date().toISOString()}
      </div>

      <div className="mb-12 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(175,70,255,0.15)]">
            <Zap className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-primary/40 uppercase tracking-[0.3em] mb-1">
              Command Central // Authentication: Secured
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase italic leading-none">
              CryptoMentorPro <span className="text-primary italic">Intelligence</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => switchDataSource(dataSource === 'sqlite' ? 'firestore' : 'sqlite')}
            className={`rounded-none border text-[10px] font-mono uppercase tracking-widest h-10 px-4 transition-all ${
              dataSource === 'sqlite' 
                ? 'border-green-500/40 text-green-400 bg-green-500/5 hover:bg-green-500/15' 
                : 'border-primary/20 text-primary/60 hover:text-primary'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 mr-2" />
            Store: {dataSource === 'sqlite' ? 'SQLite (Active)' : 'Firestore (Active)'}
          </Button>
          <Button variant="outline" className="rounded-none border-primary/20 text-primary/60 hover:text-primary hover:border-primary text-[10px] font-mono uppercase tracking-widest h-10 px-4 transition-all">
            <Shield className="w-3 h-3 mr-2" /> Security Scan
          </Button>
          <Button className="rounded-none bg-primary text-black hover:bg-primary/80 text-[10px] font-bold uppercase tracking-widest h-10 px-6 transition-all shadow-[0_0_15px_rgba(175,70,255,0.25)]">
            <Plus className="w-3 h-3 mr-2" /> Global Protocol
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-secondary/40 p-1 border border-primary/20 rounded-none backdrop-blur-md flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-black border border-transparent data-[state=active]:border-primary transition-all duration-300 px-5 py-2 uppercase font-mono text-xs font-bold tracking-widest">
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="cms" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-black border border-transparent data-[state=active]:border-primary transition-all duration-300 px-5 py-2 uppercase font-mono text-xs font-bold tracking-widest">
            <FileText className="w-4 h-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-black border border-transparent data-[state=active]:border-primary transition-all duration-300 px-5 py-2 uppercase font-mono text-xs font-bold tracking-widest">
            <UserCog className="w-4 h-4 mr-2" />
            Identity
          </TabsTrigger>
          <TabsTrigger value="monetization" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-black border border-transparent data-[state=active]:border-primary transition-all duration-300 px-5 py-2 uppercase font-mono text-xs font-bold tracking-widest">
            <CreditCard className="w-4 h-4 mr-2" />
            Stream
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-black border border-transparent data-[state=active]:border-primary transition-all duration-300 px-5 py-2 uppercase font-mono text-xs font-bold tracking-widest">
            <Banknote className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="trades" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-black border border-transparent data-[state=active]:border-primary transition-all duration-300 px-5 py-2 uppercase font-mono text-xs font-bold tracking-widest">
            <Target className="w-4 h-4 mr-2" />
            Trades
          </TabsTrigger>
          <TabsTrigger value="videos" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-black border border-transparent data-[state=active]:border-primary transition-all duration-300 px-5 py-2 uppercase font-mono text-xs font-bold tracking-widest">
            <Video className="w-4 h-4 mr-2" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-black border border-transparent data-[state=active]:border-primary transition-all duration-300 px-5 py-2 uppercase font-mono text-xs font-bold tracking-widest">
            <Award className="w-4 h-4 mr-2" />
            Affiliates
          </TabsTrigger>
          <TabsTrigger value="sqlite" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-black border border-transparent data-[state=active]:border-primary transition-all duration-300 px-5 py-2 uppercase font-mono text-xs font-bold tracking-widest">
            <Database className="w-4 h-4 mr-2" />
            SQLite Studio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-12">
          {/* KPI Dashboard Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="text-[11px] font-mono font-bold uppercase tracking-[0.4em] text-primary/60">Real-Time Performance Indices</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-all shadow-[0_0_10px_rgba(175,70,255,0.2)]" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-primary/10 border border-primary/20">
                      <Banknote className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-[10px] font-mono text-primary/30 uppercase tracking-widest flex items-center">
                      Live Stream <span className="ml-2 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-primary/40 uppercase tracking-widest">Gross Revenue Output</p>
                    <div className="text-4xl font-black font-heading text-foreground tracking-tighter flex items-baseline gap-2">
                       <span className="text-xl font-mono text-primary/20 uppercase font-normal">{settings.currency}</span>
                       {stats.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-green-400/60 uppercase">
                    <TrendingUp className="w-3 h-3" />
                    Protocol Growth: +14.2%
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-all shadow-[0_0_10px_rgba(175,70,255,0.2)]" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-primary/10 border border-primary/20">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-[10px] font-mono text-primary/30 uppercase tracking-widest">
                      Load Factor {Math.round((stats.mentorshipUsers / stats.capacity) * 100)}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-primary/40 uppercase tracking-widest">Active Mentorship Slots</p>
                    <div className="text-4xl font-black font-heading text-foreground tracking-tighter flex items-baseline gap-2">
                       {stats.mentorshipUsers} <span className="text-xl font-mono text-primary/20 uppercase font-normal">/ {stats.capacity}</span>
                    </div>
                  </div>
                  <div className="mt-4 h-1 w-full bg-primary/5 relative">
                    <div 
                      className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_var(--primary)]"
                      style={{ width: `${(stats.mentorshipUsers / stats.capacity) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-[#050507]/60 border-primary/20 rounded-none relative group overflow-hidden cursor-pointer transition-all duration-300 hover:border-orange-500/50 hover:bg-[#0c0805]/80 hover:shadow-[0_0_20px_rgba(249,115,22,0.12)]"
                onClick={() => setActiveTab('users')}
              >
                <div className="absolute top-0 left-0 w-[2px] h-full bg-orange-500/35 group-hover:bg-orange-500 transition-all duration-350 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-orange-500/10 border border-orange-500/20 group-hover:border-orange-500/50 group-hover:bg-orange-500/20 transition-colors duration-300">
                      <ClipboardCheck className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="text-[10px] font-mono text-orange-500/60 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                      Attention Required
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-primary/40 uppercase tracking-widest group-hover:text-primary/60 transition-colors">Pending Verifications</p>
                    <div className="text-4xl font-black font-heading text-orange-500 tracking-tighter group-hover:scale-105 group-hover:translate-x-0.5 transition-all duration-300 origin-left">
                       {stats.pendingVerifications}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[9px] font-mono text-orange-500/40 uppercase tracking-widest group-hover:text-orange-500/60 transition-colors">
                    // SCANNING_INBOX_QUEUE
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/40 border-primary/10 rounded-none relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Shield className="w-24 h-24 text-primary" />
              </div>
              <CardContent className="pt-8 pb-6">
                <div className="text-[10px] uppercase tracking-[0.3em] text-primary/40 font-mono mb-4 flex items-center">
                  <span className="w-2 h-[1px] bg-primary mr-2" />
                  Active Members
                </div>
                <div className="flex items-end gap-3">
                  <div className="text-5xl font-black font-heading text-foreground tracking-tighter">{users.length}</div>
                  <div className="text-[10px] text-green-400 font-mono mb-1.5 border border-green-500/20 px-1 px-0.5">+2 // 24H</div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5">
                   <p className="text-[10px] text-primary/30 uppercase tracking-widest font-mono">Registry Integrity: 100%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-primary/10 rounded-none relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="w-24 h-24 text-primary" />
              </div>
              <CardContent className="pt-8 pb-6">
                <div className="text-[10px] uppercase tracking-[0.3em] text-primary/40 font-mono mb-4 flex items-center">
                  <span className="w-2 h-[1px] bg-primary mr-2" />
                  Revenue Node
                </div>
                <div className="flex items-end gap-2">
                  <div className="text-5xl font-black font-heading text-foreground tracking-tighter">
                    <span className="text-primary/30 text-2xl mr-1 font-mono uppercase font-normal">{settings.currency}</span>
                    {settings.monetizationEnabled ? (users.length * settings.subscriptionPrice).toFixed(0) : "0"}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5">
                   <p className="text-[10px] text-primary/30 uppercase tracking-widest font-mono">Stream: {settings.monetizationEnabled ? 'ONLINE' : 'OFFLINE'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-primary/10 rounded-none relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Terminal className="w-24 h-24 text-primary" />
              </div>
              <CardContent className="pt-8 pb-6">
                <div className="text-[10px] uppercase tracking-[0.3em] text-primary/40 font-mono mb-4 flex items-center">
                  <span className="w-2 h-[1px] bg-primary mr-2" />
                  Asset Modules
                </div>
                <div className="text-5xl font-black font-heading text-foreground tracking-tighter">{content.length}</div>
                <div className="mt-4 pt-4 border-t border-white/5">
                   <p className="text-[10px] text-primary/30 uppercase tracking-widest font-mono">Database Load: Nominal</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <EngagementMetricsChart users={users} settings={settings} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard icon={FileText} title="Manage Assets" desc="Direct access to CMS" onClick={() => setActiveTab('cms')} />
            <QuickActionCard icon={UserCog} title="Audit Identities" desc="View all system subjects" onClick={() => setActiveTab('users')} />
            <QuickActionCard icon={CreditCard} title="Stream Settings" desc="Monetization protocol" onClick={() => setActiveTab('monetization')} />
            <QuickActionCard icon={Terminal} title="System Logs" desc="View raw telemetry" />
          </div>

          <div className="mt-12 text-center text-primary/20 font-mono text-[10px] uppercase tracking-[0.5em] pb-10">
            Powered by CryptoMentorPro // Secure Admin Access
          </div>
        </TabsContent>

        <TabsContent value="cms">
          <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
            <CardHeader className="border-b border-primary/20 bg-primary/5">
              <CardTitle className="text-lg font-heading text-primary tracking-wide">Content Management</CardTitle>
              <CardDescription className="text-[10px] text-primary/60 font-mono uppercase">Manage system-wide multilingual strings.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 font-mono">
              <div className="p-6 border-b border-primary/10 bg-primary/2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input className="bg-background border-primary/20 rounded-none h-10 text-xs focus:border-primary transition-all" placeholder="KEY_IDENTIFIER" value={newContent.key} onChange={e => setNewContent({...newContent, key: e.target.value})} />
                  <Input className="bg-background border-primary/20 rounded-none h-10 text-xs focus:border-primary transition-all" placeholder="LOCALE_EN" value={newContent.en} onChange={e => setNewContent({...newContent, en: e.target.value})} />
                  <Input className="bg-background border-primary/20 rounded-none h-10 text-xs focus:border-primary transition-all" placeholder="LOCALE_HR" value={newContent.hr} onChange={e => setNewContent({...newContent, hr: e.target.value})} />
                  <Button onClick={handleAddContent} className="bg-primary text-black hover:bg-primary/80 rounded-none h-10 text-[10px] font-bold uppercase tracking-widest">
                    <Plus className="w-4 h-4 mr-2" /> Append Asset
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-primary/10 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Pointer</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">English_Value</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Croatian_Value</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-right text-primary/70">Op_Code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.map(item => (
                    <TableRow key={item.id} className="border-primary/10 hover:bg-primary/5 transition-colors">
                      <TableCell className="font-mono text-[10px] text-primary/80">{item.key}</TableCell>
                      <TableCell>
                        <Input className="bg-transparent border-transparent hover:border-primary/20 focus:bg-background h-8 text-[10px] rounded-none transition-all" value={item.en} onChange={e => {
                          const updated = content.map(c => c.id === item.id ? {...c, en: e.target.value} : c);
                          setContent(updated);
                        }} />
                      </TableCell>
                      <TableCell>
                        <Input className="bg-transparent border-transparent hover:border-primary/20 focus:bg-background h-8 text-[10px] rounded-none transition-all" value={item.hr} onChange={e => {
                          const updated = content.map(c => c.id === item.id ? {...c, hr: e.target.value} : c);
                          setContent(updated);
                        }} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary/40 hover:text-primary hover:bg-primary/10 rounded-none" onClick={() => handleSaveContent(item)}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary/40 hover:text-destructive hover:bg-destructive/10 rounded-none" onClick={() => handleDeleteContent(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
            <CardHeader className="border-b border-primary/20 bg-primary/5">
              <CardTitle className="text-lg font-heading text-primary tracking-wide">Registered Student Registry // Accounts</CardTitle>
              <CardDescription className="text-[10px] text-primary/60 font-mono uppercase">Manage registered student identities, credentials, subscription plans, and system clearance access.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 font-mono">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-primary/10 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Student / UID</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Clearance Level (Role)</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Active Plan</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Verification State</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Registered (UTC)</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70 text-right">Administrative Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-primary/40 text-xs">
                        No registered users found in database.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(user => {
                      const userStatus = user.status || 'pending';
                      const userPlan = user.plan || 'starter';

                      return (
                        <TableRow key={user.uid} className="border-primary/10 hover:bg-primary/5 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 text-primary flex items-center justify-center text-[11px] font-black border border-primary/30">
                                {user.email?.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs text-white block">{user.email}</span>
                                <span className="text-[9px] text-[#bfb9ca]/60 font-mono block">UID: {user.uid}</span>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <Select value={user.role} onValueChange={(val: 'admin' | 'user') => handleUpdateUserRole(user.uid, val)}>
                              <SelectTrigger className="w-[110px] h-8 text-[10px] bg-background border-primary/20 rounded-none font-mono">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-primary/20 rounded-none font-mono">
                                <SelectItem value="user" className="text-[10px] uppercase">Students</SelectItem>
                                <SelectItem value="admin" className="text-[10px] uppercase">Administrators</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell>
                            <Select value={userPlan} onValueChange={(val: 'starter' | 'pro' | 'mentorship') => handleUpdateUserPlan(user.uid, val)}>
                              <SelectTrigger className="w-[120px] h-8 text-[10px] bg-background border-primary/20 rounded-none font-mono text-primary font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-primary/20 rounded-none font-mono">
                                <SelectItem value="starter" className="text-[10px] uppercase font-mono">Starter Pack</SelectItem>
                                <SelectItem value="pro" className="text-[10px] uppercase font-mono">Pro Content</SelectItem>
                                <SelectItem value="mentorship" className="text-[10px] uppercase font-mono">Mentorship VIP</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell>
                            {userStatus === 'active' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                Active (Verified)
                              </span>
                            )}
                            {userStatus === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Pending
                              </span>
                            )}
                            {userStatus === 'suspended' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                Suspended
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-[10px] text-primary/60 font-mono">
                            {user.createdAt ? new Date(user.createdAt).toISOString().replace('T', ' ').substring(0, 19) : 'PRE-LEGACY'}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Verify / Activate Action Button */}
                              {userStatus !== 'active' && (
                                <Button 
                                  size="sm"
                                  className="h-8 px-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-none text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                                  onClick={() => handleUpdateUserStatus(user.uid, 'active')}
                                >
                                  <UserCheck className="w-3 h-3" />
                                  Verify
                                </Button>
                              )}

                              {/* Suspend Action Button */}
                              {userStatus !== 'suspended' && (
                                <Button 
                                  size="sm"
                                  className="h-8 px-3 bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/25 rounded-none text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                                  onClick={() => handleUpdateUserStatus(user.uid, 'suspended')}
                                >
                                  <UserX className="w-3 h-3" />
                                  Suspend
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monetization" className="space-y-8">
          <Card className="bg-card border-primary/20 rounded-none max-w-2xl overflow-hidden">
            <CardHeader className="border-b border-primary/20 bg-primary/5">
              <CardTitle className="text-lg font-heading text-primary tracking-wide">Monetization Registry</CardTitle>
              <CardDescription className="text-[10px] text-primary/60 font-mono uppercase">System-wide transaction and pricing protocols.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8 font-mono">
              <div className="flex items-center justify-between p-6 bg-primary/5 border border-primary/10 rounded-none group hover:border-primary/30 transition-all">
                <Label htmlFor="monetization" className="flex flex-col space-y-1">
                  <span className="font-bold text-sm tracking-widest uppercase">Enable Revenue Stream</span>
                  <span className="font-normal text-[10px] text-primary/40">MASTER_SWITCH // TOGGLE_READY</span>
                </Label>
                <Switch 
                  id="monetization" 
                  checked={settings.monetizationEnabled} 
                  onCheckedChange={val => setSettings({...settings, monetizationEnabled: val})} 
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold">Base Price Point</Label>
                  <Input 
                    className="bg-transparent border-primary/20 rounded-none h-12 text-primary focus:border-primary transition-all text-lg"
                    type="number" 
                    value={settings.subscriptionPrice} 
                    onChange={e => setSettings({...settings, subscriptionPrice: parseFloat(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold">Currency Unit</Label>
                  <Select value={settings.currency} onValueChange={val => setSettings({...settings, currency: val})}>
                    <SelectTrigger className="bg-transparent border-primary/20 rounded-none h-12 text-primary focus:border-primary transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-primary/20 rounded-none font-mono">
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="HRK">HRK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="w-full h-14 bg-primary text-black hover:bg-primary/80 font-bold text-xs uppercase tracking-[0.3em] rounded-none shadow-[0_0_15px_rgba(175,70,255,0.2)] hover:shadow-[0_0_25px_rgba(175,70,255,0.45)] transition-all">
                Commit Protocol Changes
              </Button>
            </CardContent>
          </Card>

          <ProductsAdmin />
        </TabsContent>

        <TabsContent value="payments" className="space-y-12">
          <PaymentHistory />
        </TabsContent>

        <TabsContent value="trades" className="space-y-12">
          <TradeAnalysisAdmin />
        </TabsContent>

        <TabsContent value="videos" className="space-y-8">
          <div className="flex border border-primary/20 p-1 bg-[#050508] gap-1 font-mono max-w-md">
            <button
              type="button"
              onClick={() => setVideoViewMode('library')}
              className={`flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                videoViewMode === 'library' 
                  ? 'bg-primary text-black' 
                  : 'text-primary/60 hover:text-primary'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Mentorship Video Library
            </button>
            <button
              type="button"
              onClick={() => setVideoViewMode('cms')}
              className={`flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                videoViewMode === 'cms' 
                  ? 'bg-primary text-black' 
                  : 'text-primary/60 hover:text-primary'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Curriculum CMS
            </button>
          </div>

          {videoViewMode === 'library' ? (
            <MentorshipVideoLibrary />
          ) : (
            <AdminVideoCMS />
          )}
        </TabsContent>

        <TabsContent value="affiliates" className="space-y-12">
          <AffiliateAdmin />
        </TabsContent>

        <TabsContent value="sqlite" className="space-y-12">
          <SqliteStudio />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, desc, onClick }: { icon: any, title: string, desc: string, onClick?: () => void }) {
  return (
    <Card 
      className="bg-card/20 border-primary/5 rounded-none p-4 group hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/5 border border-primary/10 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">{title}</h4>
          <p className="text-[9px] text-primary/30 font-mono uppercase tracking-widest">{desc}</p>
        </div>
      </div>
    </Card>
  );
}
