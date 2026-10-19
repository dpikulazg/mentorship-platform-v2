import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Lock, UserPlus, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { unifiedDataService } from '../services/dataSource';

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'starter';
  const refCode = searchParams.get('ref') || sessionStorage.getItem('cryptomentor_ref_code') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'mentor'>('user');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);
      toast.success('VERIFIKACIJSKI PROTOKOL AKTIVIRAN', {
        description: 'Provjerite email za aktivacijski link.'
      });

      // Create profile in Firestore
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        role: role,
        languagePreference: 'en',
        createdAt: new Date().toISOString(),
        plan: plan as any,
        status: 'pending',
      };

      await setDoc(doc(db, 'users', user.uid), profile);

      // Record affiliate attribution if referred
      if (refCode) {
        try {
          const affiliates = await unifiedDataService.getAffiliates();
          const partner = affiliates.find(a => a.affiliateCode.toUpperCase() === refCode.toUpperCase());
          if (partner) {
            const prices: Record<string, number> = { starter: 99, pro: 249, mentorship: 499 };
            const saleAmount = prices[plan] || 99;
            const commission = Number(((saleAmount * partner.commissionRate) / 100).toFixed(2));
            await unifiedDataService.recordReferral({
              id: `ref-${Date.now().toString(36)}`,
              affiliateId: partner.id,
              affiliateCode: partner.affiliateCode,
              referredUserEmail: user.email || email,
              plan: plan as any,
              saleAmount,
              commissionAmount: commission,
              status: 'approved',
              createdAt: new Date().toISOString()
            });
          }
        } catch (affErr) {
          console.warn('Failed to record affiliate conversion:', affErr);
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Registration failed:", err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('EMAIL U UPOTREBI', { description: 'Prijavite se umjesto registracije.' });
      } else if (err.code === 'auth/invalid-email') {
        toast.error('NEVALJANA EMAIL ADRESA', { description: 'Unesite ispravan format email adrese.' });
      } else if (err.code === 'auth/operation-not-allowed') {
        toast.error('AUTH METODA ONEMOGUĆENA', { description: 'Email/Password provjera nije omogućena u Firebase Console. Omogućite je pod sekcijom Authentication -> Sign-in method.' });
      } else if (err.code === 'auth/weak-password') {
        toast.error('SLABA LOZINKA', { description: 'Lozinka mora sadržavati barem 6 znakova.' });
      } else {
        toast.error('Registracija neuspješna', { description: err.message || 'Došlo je do pogreške prilikom registracije.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <Card className="w-full max-w-md bg-card/20 border-primary/20 rounded-none relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-primary/30 uppercase">Verification Sent</div>
          <CardHeader className="text-center pt-12">
            <div className="mx-auto w-16 h-16 bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
              <ShieldCheck className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-3xl font-black font-heading italic uppercase tracking-tighter mb-2">
              Provjeri <span className="text-primary italic">Email</span>
            </CardTitle>
            <CardDescription className="font-sans text-muted-foreground">
              Poslali smo ti link za aktivaciju na <strong>{email}</strong>. 
              Klikni na link u mailu kako bi aktivirao svoj account.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-12 text-center">
            <div className="p-4 bg-primary/5 border border-primary/10 mb-8">
              <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest text-left mb-2 flex items-center gap-2">
                <span className="w-1 h-1 bg-primary" /> System Status
              </p>
              <p className="text-xs text-foreground/80 font-sans text-left italic">
                Nakon aktivacije, dobit ćeš pristup odabranom <strong>{plan.toUpperCase()}</strong> planu i svim pripadajućim materijalima.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full h-14 bg-primary text-black rounded-none font-black uppercase tracking-widest italic hover:shadow-[0_0_20px_rgba(175,70,255,0.4)] transition-all"
            >
              Idi na Login <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <Card className="w-full max-w-lg bg-card/20 border-primary/20 rounded-none relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-primary/30 uppercase">Account protocol v4.0</div>
        
        <CardHeader className="pt-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary px-3 py-1 text-[10px] font-black text-black uppercase tracking-widest italic">
              {plan} pack
            </div>
            <div className="h-[1px] flex-1 bg-primary/20" />
          </div>
          <CardTitle className="text-4xl font-black font-heading italic uppercase tracking-tighter mb-2">
            Postani <span className="text-primary italic">Član</span>
          </CardTitle>
          <CardDescription className="font-sans">
            Započni svoju transformaciju uz jasan sustav i podršku.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-10">
          {refCode && (
            <div className="mb-6 p-3 bg-primary/10 border border-primary/30 flex items-center justify-between text-xs font-mono">
              <span className="text-primary/70 uppercase tracking-wider text-[10px]">Partner Referral Activated:</span>
              <span className="font-bold text-primary tracking-widest bg-primary/20 px-2 py-0.5 border border-primary/30">
                {refCode}
              </span>
            </div>
          )}
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.2em] ml-1">Email Adresa</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ime@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 bg-black/40 border-primary/10 rounded-none focus:border-primary focus:ring-0 transition-all text-foreground placeholder:text-muted-foreground/30 font-sans"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.2em] ml-1">Lozinka</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 bg-black/40 border-primary/10 rounded-none focus:border-primary focus:ring-0 transition-all text-foreground placeholder:text-muted-foreground/30 font-sans"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.2em] ml-1">Tip Računa</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={role === 'user' ? 'default' : 'outline'}
                  onClick={() => setRole('user')}
                  className={`h-12 rounded-none font-sans uppercase tracking-widest text-[11px] transition-all ${
                    role === 'user' 
                      ? 'bg-primary text-black hover:bg-primary/90' 
                      : 'border-primary/20 text-foreground hover:bg-primary/10'
                  }`}
                >
                  Student
                </Button>
                <Button
                  type="button"
                  variant={role === 'mentor' ? 'default' : 'outline'}
                  onClick={() => setRole('mentor')}
                  className={`h-12 rounded-none font-sans uppercase tracking-widest text-[11px] transition-all ${
                    role === 'mentor' 
                      ? 'bg-primary text-black hover:bg-primary/90' 
                      : 'border-primary/20 text-foreground hover:bg-primary/10'
                  }`}
                >
                  Mentor
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 bg-primary text-black rounded-none font-black uppercase tracking-widest italic hover:shadow-[0_0_25px_rgba(175,70,255,0.4)] transition-all disabled:opacity-50"
              >
                {loading ? 'Procesiranje...' : (
                  <>
                    <UserPlus className="mr-2 w-5 h-5" /> Kreiraj Account
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Već imaš račun? <button type="button" onClick={() => navigate('/login')} className="text-primary hover:underline italic">Prijavi se ovdje</button>
            </p>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span className="text-[9px] font-mono text-primary/40 uppercase tracking-widest">Instant Access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              <span className="text-[9px] font-mono text-primary/40 uppercase tracking-widest">Active Community</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
