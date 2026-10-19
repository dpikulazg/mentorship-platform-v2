import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { CreditLedgerEntry, Booking } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { requestBooking, cancelBooking } from '../services/booking';
import { toast } from 'sonner';
import { Clock, Calendar, X, AlertCircle } from 'lucide-react';

export function CreditLedger() {
  const { user, profile } = useAuth();
  const [ledgerEntries, setLedgerEntries] = useState<CreditLedgerEntry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    if (!user) return;

    const ledgerQ = query(collection(db, 'users', user.uid, 'credit_ledger'), orderBy('createdAt', 'desc'));
    const unsubLedger = onSnapshot(ledgerQ, (snap) => {
      setLedgerEntries(snap.docs.map(doc => doc.data() as CreditLedgerEntry));
    });

    const bookingsQ = query(collection(db, 'bookings'), where('userId', '==', user.uid));
    const unsubBookings = onSnapshot(bookingsQ, (snap) => {
      const bks = snap.docs.map(doc => doc.data() as Booking);
      bks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(bks);
      setLoading(false);
    });

    return () => {
      unsubLedger();
      unsubBookings();
    };
  }, [user]);

  if (!user || !profile) return null;

  const validUntil = profile.serviceAccessExpiresAt ? new Date(profile.serviceAccessExpiresAt) : null;
  const isExpired = validUntil ? validUntil < new Date() : false;
  const hasCredits = profile.availableCredits && profile.availableCredits > 0;

  const handleBook = async () => {
    if (!date) return toast.error('Check your date selection.', { description: 'Please select a valid date/time.' });
    const scheduled = new Date(date);
    if (scheduled <= new Date()) {
      return toast.error('Invalid Date', { description: 'Booking time must be in the future.' });
    }

    try {
      setIsBooking(true);
      await requestBooking(user.uid, profile, scheduled);
      toast.success('Booking requested', { description: 'Your session has been scheduled successfully.' });
      setDate('');
    } catch (err: any) {
      toast.error('Booking Failed', { description: err.message });
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBooking(user.uid, bookingId);
      toast.success('Booking Cancelled', { description: 'Your credit has been released back to your balance.' });
    } catch (err: any) {
      toast.error('Cancellation Failed', { description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
        <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black uppercase text-foreground mb-1">
                Mentorship Sessions
              </CardTitle>
              <CardDescription className="text-xs uppercase font-mono tracking-wider">
                1-ON-1 priority support & consulting quota
              </CardDescription>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center md:text-right">
                <div className="text-[10px] text-primary/60 font-mono uppercase tracking-widest mb-1">
                  Available Credits
                </div>
                <div className="text-4xl font-black font-mono text-primary leading-none">
                  {profile.availableCredits || 0}
                </div>
              </div>
            </div>
          </div>
          
          {validUntil && (
            <div className={`mt-4 p-3 border text-xs font-mono uppercase tracking-wider flex items-center gap-2 ${isExpired ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-primary/5 border-primary/20 text-primary'}`}>
              <AlertCircle className="w-4 h-4" />
              Service access window {isExpired ? 'expired on' : 'valid until'}: {validUntil.toLocaleDateString()}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Booking Form Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80 border-b border-border pb-2 mb-4">
                  Request New Session
                </h3>
              </div>
              
              {!hasCredits ? (
                <div className="p-4 border border-border text-center text-sm font-mono text-muted-foreground bg-card/50">
                  Insufficient credits to request a session.
                </div>
              ) : isExpired ? (
                <div className="p-4 border border-border text-center text-sm font-mono text-red-400 bg-red-500/5">
                  Your mentorship service access window has expired.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-primary/60 uppercase tracking-widest mb-2">
                       Preferred Date / Time
                    </label>
                    <input 
                      type="datetime-local" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-background border border-primary/20 focus:border-primary px-3 py-2 text-sm text-foreground outline-none font-sans"
                    />
                  </div>
                  <button 
                    onClick={handleBook}
                    disabled={isBooking || !date}
                    className="w-full bg-primary text-black font-black uppercase tracking-widest text-xs py-3 hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isBooking ? 'Processing...' : 'Secure Date'}
                  </button>
                  <p className="text-[10px] text-muted-foreground uppercase text-center block">
                    Securing a date will place 1 credit on hold.
                  </p>
                </div>
              )}
            </div>

            {/* Bookings & Ledger */}
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80 border-b border-border pb-2 mb-4">
                  Active Bookings
                </h3>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Loading...</div>
                  ) : bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length === 0 ? (
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">No active sessions.</div>
                  ) : (
                    bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').map(b => (
                      <div key={b.id} className="flex items-center justify-between p-3 border border-border bg-card/50">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3 h-3 text-primary" />
                            <span className="text-xs font-bold text-foreground">
                              {new Date(b.scheduledAt).toLocaleString()}
                            </span>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${b.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            {b.status}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleCancelBooking(b.id)}
                          className="p-2 hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-colors rounded"
                          title="Cancel Session"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80 border-b border-border pb-2 mb-4">
                  Credit Ledger Activity
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {loading ? (
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Loading...</div>
                  ) : ledgerEntries.length === 0 ? (
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">No credit activity.</div>
                  ) : (
                    ledgerEntries.map(e => (
                      <div key={e.id} className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
                         <div className="flex items-center gap-3">
                           <Calendar className="w-4 h-4 text-primary/40" />
                           <div>
                             <div className="text-xs text-foreground font-mono">
                               {e.type.toUpperCase()}: <span className="font-bold text-primary">{e.amount}</span>
                             </div>
                             {e.notes && <div className="text-[10px] text-muted-foreground uppercase">{e.notes}</div>}
                           </div>
                         </div>
                         <div className="text-[10px] font-mono text-primary/40">
                           {new Date(e.createdAt).toLocaleDateString()}
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
