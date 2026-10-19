import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  BarChart2, 
  LineChart, 
  ShieldCheck, 
  Brain, 
  Target,
  Search,
  BookOpen,
  MessageSquare
} from 'lucide-react';

export function Hero() {
  const pillars = [
    { id: '01', title: 'Market Structure', icon: BarChart2, active: false },
    { id: '02', title: 'Price Action & Liquidity', icon: LineChart, active: false },
    { id: '03', title: 'Risk & Money Management', icon: ShieldCheck, active: true },
    { id: '04', title: 'Trading Psychology', icon: Brain, active: false },
    { id: '05', title: 'Execution & Review', icon: Target, active: false },
  ];

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden pt-20 pb-12" style={{ backgroundColor: '#111010' }}>
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 right-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-[5%] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-[1fr_500px] gap-12 items-center">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-6 group cursor-default">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
              <span className="text-primary text-xs sm:text-[14px] font-mono uppercase tracking-[0.2em] leading-snug">
                Strukturiran mentorship za tradere
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold leading-[1.2] lg:leading-[60px] mb-8 select-none text-white tracking-tight">
              Realnost i razumijevanje financijskih tržišta sa <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#4D7CFE] via-[#AF46FF] to-[#A855F7] bg-clip-text text-transparent drop-shadow-sm">
                Iskusnim vodstvom.
              </span>
            </h1>

            <div className="space-y-4 mb-10">
              <p className="text-base sm:text-lg text-white/90 leading-relaxed font-sans font-medium drop-shadow-sm">
                Jasan sustav koji te uči gledati tržište bez da te boli glava od nagađanja, ispravnim sustavom naučenim sa treningom i vlastitom sigurnošću.
              </p>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed font-sans max-w-xl">
                Strukturirani mentorship kroz video lekcije, praktični primjeri kao i jasan plan napretka.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <a href="/login" className="group relative px-6 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-primary to-[#4D7CFE] text-black font-bold text-sm sm:text-base rounded-none flex items-center gap-2 sm:gap-3 transition-all hover:shadow-[0_0_20px_rgba(175,70,255,0.4)] overflow-hidden">
                <span className="relative z-10">Započni besplatno</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <a href="#program" className="px-6 py-3.5 sm:px-8 sm:py-4 bg-transparent border border-white/10 hover:border-primary/50 text-foreground font-bold text-sm sm:text-base rounded-none flex items-center gap-2 sm:gap-3 transition-colors">
                Pogledaj program
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 opacity-50 group-hover:opacity-100" />
              </a>
            </div>
          </motion.div>

          {/* Right Featured Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden lg:block relative justify-self-center lg:mx-auto w-full max-w-[500px]"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 to-purple-500/30 blur-2xl opacity-20" />
            <div className="relative bg-[#0A0A0C]/80 border border-white/5 backdrop-blur-xl p-8 rounded-none overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-center gap-4 mb-10 w-full">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/10" />
                <h2 className="text-xs font-mono tracking-[0.3em] uppercase flex gap-2">
                  <span className="opacity-70">5 Ključnih</span>
                  <span className="text-primary font-bold">Stupova</span>
                  <span className="opacity-70">Mentorshipa</span>
                </h2>
                <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/10" />
              </div>

              {/* Pillars Grid */}
              <div className="flex justify-between items-start gap-4 mb-12 relative">
                {/* Connecting lines */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2 z-0" />
                
                {pillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div key={pillar.id} className="relative z-10 flex flex-col items-center gap-4 w-[85px]">
                      <span className={`text-[10px] font-mono mb-1 ${pillar.active ? 'text-primary' : 'text-muted-foreground'}`}>
                        {pillar.id}
                      </span>
                      <div className={`
                        w-full aspect-square border transition-all duration-500 flex items-center justify-center relative group/box
                        ${pillar.active 
                          ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(175,70,255,0.3)]' 
                          : 'bg-black/40 border-white/10 hover:border-primary/40'}
                      `}>
                        <Icon className={`w-8 h-8 transition-colors ${pillar.active ? 'text-primary' : 'text-muted-foreground group-hover/box:text-primary'}`} />
                        {pillar.active && (
                          <>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]" />
                          </>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold text-center leading-tight uppercase transition-colors ${pillar.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {pillar.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 justify-center group cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono text-primary uppercase tracking-widest">
                  Zavirite u paket <span className="text-foreground/50 lowercase tracking-normal">i otkrijte cijeli program</span>
                </span>
              </div>

              {/* Visual accents */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Feature Cards at bottom */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 sm:mt-24 px-2">
          <FeatureCard 
            icon={Search}
            title="Market Crypto Analyses"
            desc="Što su Vam jasniji dnevni breakdown-ovi te kretanja kroz trade konfiguraciju, to je indikator da mentor zaslužuje recenziju 5 *  ;)."
          />
          <FeatureCard 
            icon={BookOpen}
            title="On-Demand Course Library"
            desc="Vlastitim tempom kroz strukturirane video lekcije, mentor personalno određuje dodatne module koji su Vam potrebni."
          />
          <FeatureCard 
            icon={MessageSquare}
            title="24/7 Discord Pristup"
            desc="Komuniciraj s našom zajednicom, mentor je tu da Vas tradere okuplja i da vam pomaže, postavljaj pitanja i dobivaj live feedback mentora."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="group bg-black/40 border border-white/5 p-6 sm:p-8 relative overflow-hidden transition-all hover:bg-black/60 hover:border-primary/20">
      <div className="absolute top-0 left-0 w-1 h-0 bg-primary transition-all duration-500 group-hover:h-full" />
      <div className="bg-primary/5 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/10 transition-colors">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold mb-3 tracking-tight group-hover:text-primary transition-colors text-white">
        {title}
      </h3>
      <p className="text-white/70 text-sm sm:text-base leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
