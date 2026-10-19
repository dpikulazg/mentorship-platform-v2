import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  CheckCircle2, 
  Target,
  Award,
  BarChart3,
  Shield,
  ChevronRight,
  Quote
} from 'lucide-react';
import mentorImage from '../assets/images/mentor_portrait_v2_1779752172379.png';

export function AboutMentor() {
  const experiences = [
    "Više od 6 godina aktivno se bavim financijskim tržištima. Svoj trading put započeo sam sa 17 godina, prolazeći kroz tržišta, učeći od mentora i razvijajući vlastiti pristup.",
    "Cilj mentorshipa nije da kopirate tuđi stil trgovanja, već da kroz širok spektar znanja, alata i pristupa pronađete ono što najbolje odgovara vama.",
    "Najviše se fokusiram na indekse poput Nasdaqa, Forex parove kao što je EUR/USD te zlato, odnosno XAU/USD. Prioriteti koje podučavam primjenjivi su na gotovo sve vrste financijskih tržišta.",
    "Ne fokusiramo se na brzu zaradu, već na proces, disciplinu, razumijevanje tržišta i izgradnju dugoročnog pristupa. Trading, kadar mu se pristupi ozbiljno i odgovorno, može biti alat za stvaranje dugoročne financijske stabilnosti i generacijskog bogatstva."
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-background">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 select-none pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 select-none pointer-events-none" />
      
      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] select-none pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #AF46FF 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-16 items-center lg:items-start">
          
          {/* Left: Mentor Portrait Column */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:max-w-md mx-auto lg:mx-0 w-full"
          >
            <div className="relative group w-full">
              {/* Outer Glow frame */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-[#3a1d63] to-[#251042] rounded-[32px] blur-sm opacity-50 transition-opacity duration-700" />
              
              <div className="relative rounded-[32px] overflow-hidden border border-white/10 aspect-[4/5] bg-black">
                <img 
                  src={mentorImage} 
                  alt="Mentor Trading Portrait" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent opacity-80" />
              </div>

              {/* Floating Quote Box */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-6 -left-6 md:-left-12 w-[calc(100%+48px)] max-w-sm bg-[#080811] rounded-[24px] border border-[#2d2146] p-6 md:p-8 shadow-2xl z-20 flex gap-4 items-start"
              >
                <Quote className="w-10 h-10 text-[#6d3ee8] shrink-0 fill-current opacity-80" />
                <p className="text-lg md:text-xl font-serif font-medium leading-relaxed italic text-white/90">
                  Ne učimo te što da pratiš —<br />
                  <span className="text-[#a87dff]">učimo te kako da razmišljaš.</span>
                </p>
              </motion.div>
            </div>

            {/* Stats / Focus Bar moved below the image */}
            <div className="grid grid-cols-1 gap-4 mt-16 md:mt-20 relative z-30 w-full">
               <div className="px-6 py-4 bg-[#05050a]/80 backdrop-blur-sm border border-[#2d2146] rounded-[16px] flex items-center gap-4 hover:border-primary/50 transition-colors duration-300">
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0 border border-primary/20">
                   <Award className="w-6 h-6 text-primary" />
                 </div>
                 <div className="flex flex-col justify-center">
                   <p className="text-2xl font-serif font-bold text-white leading-none mb-1">6+</p>
                   <p className="text-sm font-sans text-[#bfb9ca]">godina iskustva</p>
                 </div>
               </div>

               <div className="px-6 py-4 bg-[#05050a]/80 backdrop-blur-sm border border-[#2d2146] rounded-[16px] flex items-center gap-4 hover:border-primary/50 transition-colors duration-300">
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0 border border-primary/20">
                   <BarChart3 className="w-6 h-6 text-primary" />
                 </div>
                 <div className="flex flex-col justify-center">
                   <p className="text-sm font-sans font-bold text-white mb-1 leading-none uppercase tracking-wider text-primary/80">Fokus Tržišta</p>
                   <p className="text-sm font-sans text-white/90 leading-tight">Nasdaq, EUR/USD, XAU/USD</p>
                 </div>
               </div>

               <div className="px-6 py-4 bg-[#05050a]/80 backdrop-blur-sm border border-[#2d2146] rounded-[16px] flex items-center gap-4 hover:border-primary/50 transition-colors duration-300">
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0 border border-primary/20">
                   <Shield className="w-6 h-6 text-primary" />
                 </div>
                 <div className="flex flex-col justify-center">
                   <p className="text-sm font-sans font-medium text-white leading-tight">
                     <span className="font-bold text-primary/80 uppercase tracking-wider block mb-1">MINDSET</span>
                     Proces &bull; Disciplina &bull; Konzistentnost
                   </p>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Right: Content Column */}
          <div className="flex flex-col pt-8">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-[#a87dff]" />
              <span className="text-[12px] sm:text-[14px] font-sans uppercase tracking-[0.2em] text-[#a87dff]">O Meni</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-[54px] font-serif font-bold text-white mb-6 sm:mb-8 leading-[1.2] lg:leading-[1.1] tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Izgradi profesionalan <br />
              <span style={{ fontFamily: 'Georgia, serif' }}>trading proces</span>
            </h2>

            <div className="space-y-4 text-[#bfb9ca] text-[15px] sm:text-base font-sans max-w-2xl mb-12 leading-relaxed">
              <p>
                Moj mentorship je kreiran za ljude koji žele prestati ovisiti o tuđim signalima i početi razumjeti zašto, kada i kako donijeti vlastitu trading odluku.
              </p>
              <p>
                Profesionalni trading nije samo ulazak u trade. To je kompletan proces: priprema prije marketa, analiza strukture, definiranje rizika, čekanje pravog setupa, egzekucija bez emocija i pregled rezultata nakon zatvaranja pozicije.
              </p>
              <p className="font-medium text-white shadow-sm">
                Kroz ovaj program učim članove kako izgraditi upravo takav proces.
              </p>
              <p>
                Fokusirano se na razumijevanje marketa, risk management, psihologiju, journaling, backtesting i razvoj dugoročne konzistentnosti. Cilj nije da budeš ovisan o meni — cilj je da naučiš razmišljati samostalno, disciplinirano i profesionalno.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Experience Section - Moved to full width for better display */}
      <div className="container mx-auto px-4 relative z-10 mt-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-black/40 backdrop-blur-sm border border-[#2d2146]/60 rounded-[32px] p-8 lg:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 relative z-10">
            <div className="lg:w-1/3 shrink-0 text-center lg:text-left">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6 border border-primary/20">
                 <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-3xl lg:text-4xl font-serif text-white mb-3 sm:mb-4">Moje<br/><span className="text-primary italic">iskustvo</span></h3>
              <p className="text-[15px] sm:text-base text-white/70 leading-relaxed max-w-sm mx-auto lg:mx-0">
                Kroz godine učenja, vođenja i aktivnog trgovanja izgradio sam temelj koji sada prenosim novim generacijama tradera.
              </p>
            </div>
            
            <div className="lg:w-2/3 grid sm:grid-cols-2 gap-x-8 gap-y-6 sm:gap-y-8">
              {experiences.map((exp, i) => (
                <div key={i} className="flex gap-4 group items-start">
                  <CheckCircle2 className="w-5 h-5 text-primary/60 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                  <p className="text-[14px] sm:text-[15px] leading-relaxed text-[#bfb9ca] group-hover:text-white transition-colors">
                    {exp}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
