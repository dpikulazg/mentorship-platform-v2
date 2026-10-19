import React from "react";
import { useTranslation } from "react-i18next";
import { Hero } from "../components/Hero";
import { ProgramFeatures } from "../components/ProgramFeatures";
import { AboutMentor } from "../components/AboutMentor";
import { Pricing } from "../components/Pricing";
import { CourseExperience } from "../components/CourseExperience";

export function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground glow-cursor">
      {/* Scanning light animation */}
      <div className="scanning-line" />
      
      <main>
        <Hero />
        
        <div className="container mx-auto px-4 py-24 relative overflow-hidden bg-[#0e071a]/50 border-y border-primary/10 backdrop-blur-sm">
          {/* Ambient background aura inside the panel */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-8 tracking-tight">
              Sustav koji <span className="text-primary">mijenja pravila igre.</span>
            </h2>
            <p className="text-muted-foreground text-[19px] mb-12 font-sans border-l border-primary/20 pl-6 py-2">
              Zaboravi na komplicirane indikatore i nagađanja po društvenim mrežama i portalima. 
              Fokusiramo se na definiranu likvidnost i logiku tržišta, ne biste vjerovali ali dok ovo čitate institucije drmaju profitabilnosti.
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              <div className="p-6 bg-black/60 border-2 border-primary/10 text-center sm:text-left group hover:border-primary/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(175,70,255,0.15)] transition-all duration-300">
                <div className="text-primary font-mono text-xl font-bold mb-2 group-hover:scale-110 transition-transform origin-left inline-block">95%</div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Trader fail rate</p>
              </div>
              <div className="p-6 bg-black/60 border border-primary/10 text-center sm:text-left group hover:border-primary/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(175,70,255,0.15)] transition-all duration-300">
                <div className="text-primary font-mono text-xl font-bold mb-2 group-hover:scale-110 transition-transform origin-left inline-block">24/7</div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Live Podrška</p>
              </div>
              <div className="p-6 bg-black/60 border border-primary/10 text-center sm:text-left group hover:border-primary/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(175,70,255,0.15)] transition-all duration-300">
                <div className="text-primary font-mono text-xl font-bold mb-2 group-hover:scale-110 transition-transform origin-left inline-block">100+</div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Lekcije  online 
                </p>
              </div>
              <div className="p-6 bg-black/60 border border-primary/10 text-center sm:text-left group hover:border-primary/50 hover:bg-black/80 hover:shadow-[0_0_20px_rgba(175,70,255,0.15)] transition-all duration-300">
                <div className="text-primary font-mono text-xl font-bold mb-2 group-hover:scale-110 transition-transform origin-left inline-block">GOLD</div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Standard Edukacije</p>
              </div>
            </div>
          </div>
        </div>

        <ProgramFeatures />
        
        <CourseExperience />
        
        <AboutMentor />
        
        <Pricing />

        {/* Footer style CTA */}
        <section className="py-24 border-t border-white/5 relative bg-black">
          <div className="container mx-auto px-4 text-center">
             <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
               Spreman za <span className="text-primary">idući nivo?</span>
             </h2>
             <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
               Pridruži se zajednici ozbiljnih tradera i kreni putem profitabilnosti uz jasan sustav i podršku.
             </p>
             <a href="#pricing" className="inline-block px-10 py-4 bg-primary text-black font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(175,70,255,0.4)] transition-all">
                Postani Član
             </a>
          </div>
        </section>
      </main>
    </div>
  );
}
