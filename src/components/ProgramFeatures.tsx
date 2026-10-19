import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Video, 
  Zap, 
  Users, 
  Settings, 
  FileText,
  LineChart,
  Brain,
  Layers,
  MessageCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

export function ProgramFeatures() {
  const steps = [
    {
      id: '01',
      weeks: 'Tjedni 1–2',
      title: 'Live edukacija i analiza',
      icon: Video,
      items: [
        'Tjedne live market analize',
        'Live price action breakdown',
        'Candle-by-candle analiza',
        'Napredno čitanje price actiona',
        'Market Structure analiza'
      ]
    },
    {
      id: '02',
      weeks: 'Tjedni 2–3',
      title: 'Price action, liquidity i entry',
      icon: Zap,
      items: [
        'Prepoznavanje liquidity zona',
        'Prepoznavanje fake breakout scenarija',
        'Analiza rejectiona i reakcije cijene',
        'Entry confirmation modeli',
        'Multi-timeframe i kontekstualna analiza'
      ]
    },
    {
      id: '03',
      weeks: 'Tjedni 3–4',
      title: 'Mentorski program i feedback',
      icon: MessageCircle,
      items: [
        'Strukturirana lekcija i tjedni zadaci',
        'Pregled trading journala',
        'Pregled analiza polaznika',
        'Feedback na trade ideje',
        'Grupni coaching pozivi i pitanja mentoru',
        'Praćenje napretka i jasni ciljevi'
      ]
    },
    {
      id: '04',
      weeks: 'Tjedni 4–5',
      title: 'Napredne teme i psihološki pristup',
      icon: Brain,
      items: [
        'Advanced price action i Market structure u dubinu',
        'Liquidity koncept i Entry modeli',
        'Trade management i Risk scaling',
        'Kako filtrirati loše setupe i čekati potvrdu',
        'Kako izbjeći impulsivne ulaze i razviti emocionalnu kontrolu',
        'Psihologija gubitka, win/loss serija i razvoj vlastitog sistema'
      ]
    },
    {
      id: '05',
      weeks: 'Tjedni 5–6',
      title: 'Praktični alati i materijali za učenje',
      icon: FileText,
      items: [
        'Advanced trading plan configured for tradeing',
        'Advanced journal template i Weekly review template',
        'Backtesting framework i Personal performance tracker',
        'Checklist za advanced setup i trade management',
        'Primjeri dobrih i loših analiza',
        'Privatna biblioteka snimljenih live analiza'
      ]
    },
    {
      id: '06',
      weeks: 'Tjedni 6+',
      title: 'Community i ekskluzivnost',
      icon: Users,
      items: [
        'Privatna advanced grupa',
        'Limitiran broj mjesta',
        'Prijava prije ulaska',
        'Direktniji pristup mentoru',
        'Zatvorena zajednica ozbiljnih polaznika',
        'Povremeni live pozivi'
      ]
    }
  ];

  return (
    <section id="program" className="py-24 relative overflow-hidden bg-[#0d0618]/50 border-y border-primary/10 backdrop-blur-sm">
      {/* Background system decor */}
      <div className="absolute top-0 right-0 w-[800px] h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-full h-[800px] border border-primary/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute top-0 right-0 w-[80%] h-[600px] border border-primary/5 rounded-full -translate-y-1/4 translate-x-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-12 sm:mb-16 px-2">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-[1px] bg-primary" />
            <span className="text-primary text-[10px] sm:text-xs font-mono tracking-[0.4em] uppercase">Program</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 tracking-tight text-white leading-tight block">
            Što dobivaš u <br />
            <span className="text-primary">Advanced mentorshipu</span>
          </h2>
          <p className="max-w-2xl text-white/70 text-base sm:text-lg leading-relaxed font-sans">
            Napredni paket fokusiran na live analizu, preciznije čitanje tržišta i direktniji mentorski rad za ozbiljne polaznike.
          </p>
        </div>

        {/* Stepper Navigation */}
        <div className="relative pb-16 border-b border-white/5 mb-16">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent translate-y-[0.5px]" />
          
          <div className="mb-10 text-center">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary/40 mb-2">Roadmap</h4>
            <p className="text-xl font-black uppercase italic tracking-tighter">Plan po <span className="text-primary italic">tjednima</span></p>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-4 md:gap-8">
            {steps.map((step) => (
              <a key={step.id} href={`#program-step-${step.id}`} className="relative group flex items-center gap-4">
                 {/* Tooltip for mobile/touch */}
                 <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    whileHover={{ opacity: 1, y: 0, scale: 1 }}
                    whileTap={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 pointer-events-none z-50 whitespace-nowrap lg:hidden"
                 >
                    <div className="bg-primary text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 italic shadow-[0_0_20px_rgba(175,70,255,0.4)] border border-white/20">
                      {step.title}
                    </div>
                    <div className="w-2 h-2 bg-primary rotate-45 mx-auto -mt-1" />
                 </motion.div>

                 <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-none border border-primary/25 flex items-center justify-center text-[10px] font-mono text-primary/60 group-hover:bg-primary group-hover:text-black transition-all group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(175,70,255,0.3)] cursor-pointer"
                 >
                    {step.id}
                 </motion.div>
                 
                 <div className="hidden lg:block group-hover:translate-x-1 transition-transform">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest leading-none mb-1">Step {step.id}</p>
                    <p className="text-xs font-bold text-foreground/70 uppercase group-hover:text-primary transition-colors">{step.title.split(' ')[0]}</p>
                 </div>
              </a>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              id={`program-step-${step.id}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group bg-black/40 border border-white/5 p-6 rounded-none relative overflow-hidden flex flex-col scroll-mt-32"
            >
              <div className="absolute top-4 right-6 text-4xl font-bold text-white/5 select-none group-hover:text-primary/10 transition-colors">
                {step.id}
              </div>

              <div className="mb-8">
                <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-[10px] font-mono font-bold rounded-none mb-4 border border-primary/20">
                  {step.weeks}
                </div>
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
              </div>

              <div className="space-y-3 sm:space-y-4 mb-6 flex-grow">
                {step.items.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-[15px] text-white/80 font-sans leading-tight">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <a 
                href="#pricing" 
                className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary hover:text-white transition-colors mb-6 group/link w-fit"
              >
                Odaberi Paket
                <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
              </a>

              {/* Simple visual placeholders for illustrations */}
              <div className="mt-auto border-t border-white/5 pt-4 opacity-50 group-hover:opacity-100 transition-opacity">
                {index === 0 && <ChartVisual type="line" />}
                {index === 1 && <ChartVisual type="candlestick" />}
                {index === 2 && <ChartVisual type="boxes" />}
                {index === 3 && <ChartVisual type="brain" />}
                {index === 4 && <ChartVisual type="files" />}
                {index === 5 && <ChartVisual type="users" />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChartVisual({ type }: { type: string }) {
  if (type === 'line') {
    return (
      <div className="h-12 w-full bg-primary/5 rounded-none border border-primary/10 overflow-hidden relative p-2">
        <div className="flex items-end gap-1 h-full w-full opacity-50">
           {[30, 45, 35, 60, 40, 70, 50, 85].map((h, i) => (
             <div key={i} className="flex-1 bg-primary/20" style={{ height: `${h}%` }} />
           ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
           <LineChart className="w-5 h-5 text-primary/40" />
        </div>
      </div>
    );
  }
  
  if (type === 'candlestick') {
    return (
      <div className="h-12 w-full bg-primary/5 rounded-none border border-primary/10 flex items-center justify-center gap-1 opacity-50">
        <div className="w-2 h-6 border border-primary/40" />
        <div className="w-2 h-8 bg-primary/40" />
        <div className="w-2 h-4 bg-primary/60" />
        <div className="w-2 h-10 border border-primary/40" />
      </div>
    );
  }

  return (
     <div className="h-12 w-full bg-primary/5 rounded-none border border-primary/10 flex items-center justify-center opacity-40">
        <Layers className="w-5 h-5 text-primary" />
     </div>
  );
}
