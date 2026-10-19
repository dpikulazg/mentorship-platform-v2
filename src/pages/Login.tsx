import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LogIn, Mail, Lock, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('AUTORIZACIJA USPJEŠNA');
      navigate('/');
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // Silent ignore
      } else if (err.code === 'auth/operation-not-allowed') {
        toast.error('Google prijava nije omogućena');
      } else {
        toast.error('Prijava putem Google-a nije uspjela');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        toast.error('EMAIL NIJE VERIFICIRAN', {
          description: 'Provjerite svoj inbox (i Spam folder)'
        });
      } else {
        toast.success('ULAZ ODOBREN');
        navigate('/');
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('KRIVI PODACI', { description: 'Kriva email adresa ili lozinka.' });
      } else if (err.code === 'auth/invalid-email') {
        toast.error('NEVALJANA EMAIL ADRESA', { description: 'Unesite ispravan format email adrese.' });
      } else if (err.code === 'auth/too-many-requests') {
        toast.error('PREVIŠE POKUŠAJA', { description: 'Račun je privremeno blokiran. Pokušajte ponovno kasnije ili ponovno postavite lozinku.' });
      } else if (err.code === 'auth/operation-not-allowed') {
        toast.error('AUTH METODA ONEMOGUĆENA', { description: 'Email/Password Authentication is not enabled in Firebase Console. Please enable it in Authentication -> Sign-in methods.' });
      } else {
        toast.error('Pristup odbijen', { description: err.message || 'Došlo je do greške.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('NEDOSTAJE EMAIL', { description: 'Unesite email adresu za reset lozinke' });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('RESET PROTOKOL POSLAN', {
        description: 'Link za reset lozinke je poslan na vaš email.'
      });
    } catch (err: any) {
      console.error("Reset failed:", err);
      toast.error('GREŠKA PRI RESETU', { description: 'Provjerite email adresu' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
      <Card className="w-full max-w-lg bg-card/20 border-primary/20 rounded-none relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-primary/30 uppercase">Login Protocol v2.5</div>
        
        <CardHeader className="pt-10">
          <CardTitle className="text-4xl font-black font-heading italic uppercase tracking-tighter mb-2">
            Pristup <span className="text-primary italic">Sustavu</span>
          </CardTitle>
          <CardDescription className="font-sans">
            Dobrodošli natrag. Unesite svoje podatke za pristup mentorskom panelu.
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-10">
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.2em] ml-1">Korisnički Identitet (Email)</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ime@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 bg-black/40 border-primary/10 rounded-none focus:border-primary focus:ring-0 transition-all text-white placeholder:text-muted-foreground/30 font-sans"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.2em]">Sigurnosni Ključ (Password)</Label>
                <button 
                  type="button" 
                  onClick={handleResetPassword}
                  className="text-[9px] font-mono text-primary/40 uppercase hover:text-primary transition-colors tracking-widest"
                >
                  Zaboravljena lozinka?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 bg-black/40 border-primary/10 rounded-none focus:border-primary focus:ring-0 transition-all text-white placeholder:text-muted-foreground/30 font-sans"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 bg-primary text-black rounded-none font-black uppercase tracking-widest italic hover:shadow-[0_0_25px_rgba(175,70,255,0.4)] transition-all disabled:opacity-50"
              >
                {loading ? 'Provjera...' : (
                  <>
                    <LogIn className="mr-2 w-5 h-5" /> Autoriziraj Ulaz
                  </>
                )}
              </Button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
                  <span className="bg-[#050507] px-4 text-muted-foreground">ili koristi</span>
                </div>
              </div>

              <Button 
                type="button"
                onClick={handleGoogleLogin} 
                variant="outline"
                className="w-full h-14 border-white/10 rounded-none font-bold uppercase tracking-widest text-[11px] hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale opacity-70 group-hover:grayscale-0 transition-all" alt="Google" />
                Google Identitet
              </Button>
            </div>
            
            <p className="text-center text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-8">
              Nemaš račun? <button type="button" onClick={() => navigate('/#pricing')} className="text-primary hover:underline italic">Odaberi plan i kreni</button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
