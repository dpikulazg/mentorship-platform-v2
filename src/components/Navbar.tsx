 import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useDataSource } from '../hooks/useDataSource';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { LogOut, Shield, Menu, X, AlertTriangle, HardDrive } from 'lucide-react';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, profile, isAdmin, isVerified } = useAuth();
  const { dataSource } = useDataSource();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ripples, setRipples] = useState<{ x: number, y: number, id: number }[]>([]);

  const addRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples([...ripples, { x, y, id: Date.now() }]);
  };

  return (
    <>
      {user && !isVerified && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 flex items-center justify-center gap-2 text-[10px] uppercase font-mono tracking-widest text-amber-500">
          <AlertTriangle className="w-3 h-3" />
          System Restricted: Email Verification Required to Activate {profile?.plan?.toUpperCase()} Protocol
        </div>
      )}
      <nav className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8 h-[80px]" style={{ height: '80px' }}>
          <div className="flex items-center gap-8">
            <Link to="/" className="flex flex-col group">
              <div 
                className="text-lg font-bold tracking-tight text-white group-hover:text-primary transition-colors font-heading uppercase relative overflow-hidden px-2"
                onClick={addRipple}
              >
                <AnimatePresence>
                  {ripples.map((ripple) => (
                    <motion.span
                      key={ripple.id}
                      initial={{ scale: 0, opacity: 0.5 }}
                      animate={{ scale: 10, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      onAnimationComplete={() => setRipples(prev => prev.filter(r => r.id !== ripple.id))}
                      style={{
                        position: 'absolute',
                        top: ripple.y,
                        left: ripple.x,
                        width: 20,
                        height: 20,
                        backgroundColor: 'rgba(175, 70, 255, 0.4)',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 0
                      }}
                    />
                  ))}
                </AnimatePresence>
                <span className="relative z-10 italic font-black tracking-tighter text-[14px]">
                  CryptoMentors<span className="text-primary italic drop-shadow-[0_0_8px_rgba(175,70,255,0.4)]">Pro</span>
                </span>
              </div>
              <div className="text-[10px] text-primary/40 uppercase tracking-[0.4em] font-mono pl-2">Powered by CryptoMentorPro</div>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-[18px]">
              <a 
                href="/#program" 
                className="text-[12px] font-mono uppercase tracking-widest text-foreground/40 hover:text-primary transition-colors"
                style={{ fontFamily: 'Courier New, monospace' }}
              >
                Program
              </a>
              <a 
                href="/#pricing" 
                className="text-[12px] font-mono uppercase tracking-widest text-foreground/40 hover:text-primary transition-colors"
                style={{ fontFamily: 'Courier New, monospace' }}
              >
                Postani Član
              </a>
              {user && (
                <Link 
                  to="/dashboard" 
                  className="text-[12px] font-mono uppercase tracking-widest text-foreground/40 hover:text-primary transition-colors"
                  style={{ fontFamily: 'Courier New, monospace' }}
                >
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link to="/admin" className="text-[12px] font-mono uppercase tracking-widest text-primary border border-primary/20 px-2 py-1 bg-primary/5 hover:bg-primary/10 transition-all flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Terminal
                  </Link>
                  <span className="hidden xl:inline-flex items-center gap-1.5 text-[9px] font-mono text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-1 uppercase tracking-widest">
                    <HardDrive className="w-2.5 h-2.5" />
                    {dataSource === 'sqlite' ? 'SQLite Engine' : 'Firestore'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex bg-white/5 border border-white/5 rounded-none p-0.5">
              <button 
                onClick={() => i18n.changeLanguage('hr')}
                className={`px-3 py-1 text-[9px] font-bold rounded-none transition-all border border-[#9d1ff4]`}
                style={{ borderColor: '#9d1ff4' }}
              >
                HR
              </button>
              <button 
                onClick={() => i18n.changeLanguage('en')}
                className={`px-3 py-1 text-[9px] font-bold rounded-none transition-all ${i18n.language === 'en' ? 'bg-primary text-black' : 'text-foreground/40 hover:text-white'}`}
              >
                EN
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-white/5 border border-white/5">
                  <div className="w-5 h-5 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                    {user.email?.substring(0, 1).toUpperCase()}
                  </div>
                  <span className="text-[12px] font-mono text-foreground/60 uppercase tracking-widest">{user.email?.split('@')[0]}</span>
                </div>
                <button onClick={() => signOut(auth)} className="text-foreground/40 hover:text-white transition-colors">
                  <LogOut className="w-4 h-4 border" style={{ borderColor: '#36005c', color: '#7d08e8' }} />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-4">
                <Link to="/login" className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/#pricing">
                  <Button className="rounded-none bg-primary text-black px-6 py-2 h-10 text-[10px] font-black uppercase tracking-widest italic hover:shadow-[0_0_15px_rgba(175,70,255,0.4)] transition-all">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            <button
              className="rounded-none border border-white/5 p-2 md:hidden text-foreground/40"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="border-b border-t border-white/10 md:hidden bg-background/95 backdrop-blur-2xl absolute top-full left-0 w-full shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden"
            >
              <div className="px-6 py-8 space-y-8">
                <div className="flex flex-col gap-6">
                  <a href="/#program" onClick={() => setMobileMenuOpen(false)} className="text-sm font-heading font-bold uppercase tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                    Program
                  </a>
                  <a href="/#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-heading font-bold uppercase tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                    Postani Član
                  </a>
                  {user && (
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-sm font-heading font-bold uppercase tracking-[0.2em] text-foreground/70 hover:text-primary flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                      Dashboard
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-sm font-heading font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                      <Shield className="w-4 h-4" />
                      Terminal
                    </Link>
                  )}
                </div>
                
                <div className="h-px bg-white/10 w-full" />
                
                <div className="flex gap-4">
                  <button onClick={() => i18n.changeLanguage('hr')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${i18n.language === 'hr' ? 'bg-primary text-black shadow-[0_0_15px_rgba(175,70,255,0.4)]' : 'border border-white/10 text-foreground/50 hover:bg-white/5'}`}>HR</button>
                  <button onClick={() => i18n.changeLanguage('en')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${i18n.language === 'en' ? 'bg-primary text-black shadow-[0_0_15px_rgba(175,70,255,0.4)]' : 'border border-white/10 text-foreground/50 hover:bg-white/5'}`}>EN</button>
                </div>

                {!user ? (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full h-12 border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded-none">Login</Button>
                    </Link>
                    <Link to="/#pricing" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full h-12 bg-primary text-black text-xs font-bold uppercase tracking-widest italic hover:shadow-[0_0_20px_rgba(175,70,255,0.5)] transition-all rounded-none">Register</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="pt-2">
                    <Button onClick={() => { signOut(auth); setMobileMenuOpen(false); }} variant="outline" className="w-full h-12 border-white/10 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 hover:text-red-400 mt-2 hover:border-red-500/20 rounded-none">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
