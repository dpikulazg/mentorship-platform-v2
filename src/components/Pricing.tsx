import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Target, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';

const defaultPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    interval: '/mjesečno',
    icon: Target,
    description: 'Savršeno za prevladavanje prvih prepreka i učenje stabilnih temelja.',
    features: [
      'Pristup osnovnim video lekcijama',
      'Uvod u Market Structure i Likvidnost',
      'Pristup Discord zajednici za početnike',
      'Tjedni Market Breakdown',
      'Email podrška'
    ],
    color: 'border-white/10',
    bgClasses: 'bg-black/40',
    buttonVariant: 'outline' as const,
    buttonText: 'Kreni sa Starterom'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    interval: '/mjesečno',
    icon: Zap,
    description: 'Sveobuhvatan sustav za tradere spremne na ostvarivanje konzistentnosti.',
    features: [
      'Sve iz Starter paketa',
      'Napredni modeli ulaza u pozicije (Entries)',
      'Risk & Psychology Management Protokoli',
      'Pristup premium sekciji u Discordu',
      '24/7 Priority Support',
      'Dnevni trade setupovi',
      'Korištenje Journaling alata u platformi'
    ],
    featured: true,
    color: 'border-primary/50',
    bgClasses: 'bg-primary/[0.03]',
    buttonVariant: 'default' as const,
    buttonText: 'Postani Pro'
  },
  {
    id: 'mentorship',
    name: 'Mentorship',
    price: 299,
    interval: '/mjesečno',
    icon: Shield,
    description: '1-na-1 pristup za profesionalni napredak i skaliranje kapitala.',
    features: [
      'Sve iz Pro paketa',
      '2 1-na-1 Live poziva tjedno',
      'Detaljna evaluacija tvog Journala',
      'Prilagođen plan učenja',
      'Direct Message pristup mentoru',
      'Napredno testiranje strategija'
    ],
    color: 'border-white/10',
    bgClasses: 'bg-black/40',
    buttonVariant: 'outline' as const,
    buttonText: 'Prijavi se za mentorstvo'
  }
];

export function Pricing() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>(defaultPlans);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      const docs = snap.docs.map(d => d.data() as Product);
      if (docs.length > 0) {
        // Map dynamic products back into display properties
        const mapped = docs.map(doc => {
          let icon = Target;
          let featured = false;
          let color = 'border-white/10';
          let bgClasses = 'bg-black/40';
          let buttonVariant: "outline" | "default" = 'outline';

          if (doc.price > 100 && doc.price < 200) {
            icon = Zap; featured = true; color = 'border-primary/50'; bgClasses = 'bg-primary/[0.03]'; buttonVariant = 'default';
          } else if (doc.price >= 200) {
            icon = Shield;
          }

          return {
            id: doc.id,
            name: doc.name,
            price: doc.price,
            interval: doc.type === 'subscription' ? '/mjesečno' : '/jednokratno',
            icon,
            description: doc.description || 'Premium sadržaj i pristup platformi.',
            features: doc.features || ['Pristup edukaciji', 'Podrška mentora'],
            featured,
            color,
            bgClasses,
            buttonVariant,
            buttonText: 'Odaberi plan'
          };
        });
        setProducts(mapped);
      }
    });

    return () => unsub();
  }, []);

  const handleSelectPlan = (planId: string) => {
    navigate(`/register?plan=${planId}`);
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-[#05050A]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-16 lg:mb-24 px-2">
           <div className="inline-flex items-center justify-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary">Članstva</span>
           </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 tracking-tighter uppercase italic text-white flex flex-col gap-2">
            Odaberi svoju <span className="text-primary">putanju</span>
          </h2>
          <p className="text-white/70 font-sans text-base sm:text-lg lg:text-xl">
            Transkarentne cijene prilagođene tvojoj trenutnoj razini. Uloži u svoje znanje i izbjegni skupe greške na marketu.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 xl:gap-10 max-w-6xl mx-auto items-stretch">
          {products.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.5, ease: 'easeOut' }}
                viewport={{ once: true, margin: "-100px" }}
                className={`relative rounded-[32px] p-8 md:p-10 border ${plan.color} ${plan.bgClasses} flex flex-col group transition-all duration-300 hover:border-primary/40 backdrop-blur-sm ${plan.featured ? 'lg:-translate-y-4 shadow-[0_0_50px_rgba(175,70,255,0.1)]' : 'hover:bg-white/[0.02]'}`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-bold px-6 py-2 uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(175,70,255,0.3)] whitespace-nowrap">
                    Najpopularnije
                  </div>
                )}

                <div className="mb-8">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${plan.featured ? 'bg-primary/20 border text-primary border-primary/30' : 'bg-white/5 text-foreground/70 border border-white/10 group-hover:text-foreground group-hover:border-white/20'} flex items-center justify-center mb-6 sm:mb-8 transition-colors`}>
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black font-heading uppercase italic tracking-tight mb-3 sm:mb-4 text-white">
                    {plan.name}
                  </h3>
                  <p className="text-sm sm:text-base text-white/70 font-sans leading-relaxed min-h-[50px] sm:min-h-[60px] mb-6">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black font-heading tracking-tighter text-white">€{plan.price}</span>
                    <span className="text-xs sm:text-sm text-white/60 font-sans font-medium">{plan.interval}</span>
                  </div>
                </div>

                <div className="h-px w-full bg-white/10 mb-8" />

                <div className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                         <Check className="w-3 h-3 text-primary stroke-[3]" />
                      </div>
                      <span className="text-sm sm:text-[15px] text-white/90 font-sans leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={plan.buttonVariant}
                  className={`w-full h-14 rounded-2xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    plan.featured 
                      ? 'bg-primary text-black hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(175,70,255,0.4)]' 
                      : 'border-white/20 text-white hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  {plan.buttonText}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
