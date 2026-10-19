import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Module, Lesson } from '../types';
import { unifiedDataService } from '../services/dataSource';
import { useDataSource } from '../hooks/useDataSource';
import { getVideoBlob } from '../lib/sqlite';
import { 
  Play, PlayCircle, Folder, Lock, CheckCircle2, 
  Tv, Film, Eye, Flame, Award, BookOpen, Clock,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Secure default items in case Firestore is empty initially
const defaultModules: Module[] = [
  { 
    id: 'def-1', 
    title: 'Osnove Tržišta & Blockchain', 
    description: 'Uvod u kripto ekosustav, razumijevanje rasta i bazične strukture grafova za nove polaznike.', 
    order: 1, 
    createdAt: '' 
  },
  { 
    id: 'def-2', 
    title: 'Institucijska Likvidnost & Redoslijed', 
    description: 'Dubinska analiza trgovanja: Zone ponude i potražnje, pametni novac i prepoznavanje manipulacija.', 
    order: 2, 
    createdAt: '' 
  },
  { 
    id: 'def-3', 
    title: 'Praktične Strategije & Upravljanje Rizikom', 
    description: 'Napredni setovi pravila, kalkulacija rizika i psihološka priprema za live crypto trading.', 
    order: 3, 
    createdAt: '' 
  }
];

const defaultLessons: Lesson[] = [
  { 
    id: 'l1', 
    moduleId: 'def-1', 
    title: '1. Uvod u likvidnost i pametni novac', 
    description: 'Sve o osnovama i kretanju novca na tržištima.', 
    videoUrl: 'https://www.youtube.com/embed/Yp_O6A9Yf_4', 
    duration: '12:44', 
    order: 1, 
    createdAt: '' 
  },
  { 
    id: 'l2', 
    moduleId: 'def-1', 
    title: '2. Kako čitati svijećnjake i volumene?', 
    description: 'Otkrijte skrivenu priču iza svijećnjaka.', 
    videoUrl: 'https://www.youtube.com/embed/gU9G7_mP2pU', 
    duration: '18:15', 
    order: 2, 
    createdAt: '' 
  },
  { 
    id: 'l3', 
    moduleId: 'def-2', 
    title: '1. Manipulacije na otvaranju sesija', 
    description: 'Prepoznavanje zamki na ključnim zonama.', 
    videoUrl: 'https://www.youtube.com/embed/Yp_O6A9Yf_4', 
    duration: '22:40', 
    order: 1, 
    createdAt: '' 
  }
];

export function CourseExperience() {
  const { user, profile } = useAuth();
  const { dataSource, updateTick } = useDataSource();
  const [dbModules, setDbModules] = useState<Module[]>([]);
  const [dbLessons, setDbLessons] = useState<Lesson[]>([]);
  
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeUploadedBlobUrl, setActiveUploadedBlobUrl] = useState<string | null>(null);

  // Fetch unified data (SQLite / Firestore)
  useEffect(() => {
    let isMounted = true;
    const loadModulesAndLessons = async () => {
      try {
        const [mods, less] = await Promise.all([
          unifiedDataService.getModules(),
          unifiedDataService.getLessons()
        ]);
        if (isMounted) {
          if (mods.length > 0) setDbModules(mods);
          if (less.length > 0) setDbLessons(less);
        }
      } catch (e) {
        console.warn('Could not fetch from unified service, using Firestore/defaults:', e);
      }
    };

    loadModulesAndLessons();

    // Also keep Firestore listener active for real-time sync if using Firestore
    const unsubModules = onSnapshot(collection(db, 'modules'), (snap) => {
      if (dataSource === 'firestore') {
        const list = snap.docs.map(d => d.data() as Module);
        list.sort((a, b) => a.order - b.order);
        if (list.length > 0) setDbModules(list);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'modules'));

    const unsubLessons = onSnapshot(collection(db, 'lessons'), (snap) => {
      if (dataSource === 'firestore') {
        const list = snap.docs.map(d => d.data() as Lesson);
        list.sort((a, b) => a.order - b.order);
        if (list.length > 0) setDbLessons(list);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'lessons'));

    return () => {
      isMounted = false;
      unsubModules();
      unsubLessons();
    };
  }, [dataSource, updateTick]);

  // Load uploaded video blob if active lesson is an upload
  useEffect(() => {
    let currentUrl: string | null = null;
    let isCancelled = false;

    const loadBlob = async () => {
      if (activeLesson && (activeLesson.videoType === 'upload' || activeLesson.isUploaded) && activeLesson.videoBlobId) {
        const blob = await getVideoBlob(activeLesson.videoBlobId);
        if (blob && !isCancelled) {
          currentUrl = URL.createObjectURL(blob);
          setActiveUploadedBlobUrl(currentUrl);
          return;
        }
      }
      if (!isCancelled) {
        setActiveUploadedBlobUrl(null);
      }
    };

    loadBlob();

    return () => {
      isCancelled = true;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [activeLesson]);

  // Use dynamic or fallback static data
  const finalModules = dbModules.length > 0 ? dbModules : defaultModules;
  const finalLessons = dbLessons.length > 0 ? dbLessons : defaultLessons;

  // Set default active states once data is ready
  useEffect(() => {
    if (finalModules.length > 0 && !activeModule) {
      setActiveModule(finalModules[0]);
    }
  }, [finalModules]);

  useEffect(() => {
    if (activeModule) {
      // Find first lesson for this module
      const moduleLessons = finalLessons.filter(l => l.moduleId === activeModule.id);
      setActiveLesson(moduleLessons[0] || null);
    }
  }, [activeModule, finalLessons]);

  // Check if a module is locked for the viewer
  const getIsModuleLocked = (mod: Module, index: number) => {
    // Admins have everything unlocked
    if (profile?.role === 'admin') return false;
    
    // First module is always free/starter
    if (index === 0) return false;

    // Remaining modules require a subscription plan (Pro or Mentorship)
    const userPlan = profile?.plan;
    if (userPlan === 'pro' || userPlan === 'mentorship') {
      return false;
    }

    return true;
  };

  // Convert typical video URL into embed compatible
  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = rawUrl.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`;
    }
    let vimeoReg = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    let vimeoMatch = rawUrl.match(vimeoReg);
    if (vimeoMatch && vimeoMatch[3]) {
      return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
    }
    return rawUrl;
  };

  const moduleLessons = activeModule ? finalLessons.filter(l => l.moduleId === activeModule.id) : [];
  const isActiveModuleLocked = activeModule ? getIsModuleLocked(activeModule, finalModules.findIndex(m => m.id === activeModule.id)) : false;

  return (
    <section id="program" className="py-24 relative overflow-hidden bg-[#0a0512] border-y border-primary/10">
      {/* Visual background details */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-primary/5 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[550px] h-[550px] bg-primary/5 rounded-full blur-[110px] pointer-events-none" />
      
      {/* Ambient scanning indicators */}
      <div className="absolute top-0 left-0 w-full p-4 font-mono text-[9px] text-primary/20 pointer-events-none flex justify-between uppercase">
        <span>CURRICULUM_PLAYER // OFFLINE_CACHING: READY</span>
        <span>INDEXING_SUITE: v2.5 // SECURE</span>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Heading */}
        <div className="flex flex-col items-center mb-12 sm:mb-16 text-center px-2">
          <div className="flex items-center gap-2 mb-4 group cursor-default">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
            <span className="text-primary text-[10px] sm:text-[12px] font-mono uppercase tracking-[0.2em] leading-snug">
              Interaktivna Platforma & Video Lekcije
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 sm:mb-6 text-white leading-tight">
            Edukacijski <span className="text-primary italic">Sustav</span>
          </h2>
          <p className="text-white/70 max-w-2xl text-base sm:text-lg leading-relaxed">
            Pristupite strukturiranom znanju gdje su sve stručne video lekcije precizno raspoređene po modulima za lakšu navigaciju, brže učenje i razumijevanje financijskih tržišta.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
          
          {/* LEFT PANEL: Module Navigation (5 Columns) */}
          <div className="lg:col-span-4 space-y-4 font-mono">
            <div className="flex items-center justify-between px-2 text-[10px] uppercase tracking-wider text-primary/50 font-bold border-b border-primary/10 pb-2">
              <span>Kurikulum Tečaja</span>
              <span>{finalModules.length} Modula</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {finalModules.map((mod, i) => {
                const isSelected = activeModule?.id === mod.id;
                const isLocked = getIsModuleLocked(mod, i);
                const modLessons = finalLessons.filter(l => l.moduleId === mod.id);

                return (
                  <motion.div 
                    key={mod.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onClick={() => setActiveModule(mod)}
                    className={`p-4 border transition-all duration-300 relative cursor-pointer ${
                      isSelected 
                        ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(175,70,255,0.15)] scale-[1.01]' 
                        : 'bg-black/50 border-white/5 hover:border-primary/20'
                    }`}
                  >
                    {/* Locked overlay badge */}
                    {isLocked && (
                      <div className="absolute top-2 right-2 p-1 bg-black/60 border border-orange-500/35 rounded-none">
                        <Lock className="w-3 h-3 text-orange-500" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold tracking-tight ${isSelected ? 'text-primary' : 'text-primary/40'}`}>
                          MODUL {i + 1}
                        </span>
                        {isLocked && <span className="text-[8px] uppercase tracking-widest text-[#f97316] border border-orange-500/20 bg-orange-500/5 px-1">LOCK</span>}
                      </div>

                      <h3 className={`font-bold text-sm tracking-tight ${isSelected ? 'text-white' : 'text-foreground/80'} line-clamp-1`}>
                        {mod.title}
                      </h3>

                      <p className="text-[10px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                        {mod.description}
                      </p>

                      <div className="flex items-center gap-3 text-[9px] text-[#bfb9ca] mt-2 uppercase tracking-wide">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-2.5 h-2.5 text-primary/50" />
                          {modLessons.length} Lekcija
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-primary/50" />
                          {modLessons.reduce((acc, l) => acc + (l.duration ? 1 : 0), 0) > 0 ? `${modLessons.length * 15} MIN` : 'VARIABLE'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: Interactive Screen, Player, and Lessons Playlist (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Active Video Player Screen */}
            <div className="border border-primary/20 bg-black p-2 relative shadow-[0_0_30px_rgba(175,70,255,0.06)] group">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-[#7d08e8]" />
              
              <div className="bg-[#050508] aspect-video relative flex flex-col items-center justify-center border border-white/5 overflow-hidden">
                {isActiveModuleLocked ? (
                  /* Locked Module CTA */
                  <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-8 text-center z-30 font-mono">
                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-6 relative">
                      <div className="absolute inset-0 bg-orange-500/5 animate-ping" />
                      <Lock className="w-8 h-8 relative z-10" />
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.3em] text-orange-500/70 mb-2">RESTRICTED_ACCESS_PROTOCOL</span>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight mb-3">Zaključani Premium Sadržaj</h4>
                    <p className="text-xs text-muted-foreground max-w-md leading-relaxed mb-6">
                      Ovaj modul i povezane mentorske video lekcije zahtijevaju aktivni pro ili mentorski ugovor kako bi bili otključani.
                    </p>
                    <a 
                      href="#pricing" 
                      className="px-6 py-2.5 bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(175,70,255,0.4)] transition-all italic"
                    >
                      Postani Član i Otključaj
                    </a>
                  </div>
                ) : activeLesson ? (
                  activeUploadedBlobUrl ? (
                    /* Locally Uploaded Video Player */
                    <video 
                      src={activeUploadedBlobUrl} 
                      controls 
                      autoPlay 
                      className="w-full h-full aspect-video z-20 object-contain bg-black"
                    />
                  ) : (
                    /* Live Embedded Video Player */
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={getEmbedUrl(activeLesson.videoUrl)} 
                      title={activeLesson.title}
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                      referrerPolicy="no-referrer"
                      className="w-full h-full aspect-video z-20"
                    />
                  )
                ) : (
                  /* Loading / No Lessons fallback */
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                    <Tv className="w-10 h-10 text-primary/30 mb-2" />
                    <span className="text-xs text-primary/45 uppercase tracking-widest font-bold">Nema učitanih video lekcija</span>
                  </div>
                )}
              </div>

              {/* Player Bottom status details */}
              {activeLesson && !isActiveModuleLocked && (
                <div className="p-4 bg-black/40 border-t border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#bfb9ca] block">Trenutno se reproducira:</span>
                    <span className="text-xs font-bold text-white block mt-0.5">{activeLesson.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-[#bfb9ca]/80 uppercase tracking-widest border border-white/10 px-2 py-0.5 bg-white/5 inline-flex items-center gap-1.5 font-mono">
                      <Clock className="w-3 h-3 text-primary" /> {activeLesson.duration}
                    </span>
                    {activeLesson.videoType === 'upload' || activeLesson.isUploaded ? (
                      <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest border border-green-500/20 px-2 py-0.5 bg-green-500/5 inline-flex items-center gap-1.5 font-mono">
                        <HardDrive className="w-3 h-3 text-green-400" /> Local HD Video
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-primary uppercase tracking-widest border border-primary/20 px-2 py-0.5 bg-primary/5 inline-flex items-center gap-1.5 font-mono">
                        <Award className="w-3 h-3" /> Mentor Stream
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Module Playlist Lessons List */}
            {activeModule && !isActiveModuleLocked && (
              <div className="p-5 bg-card/40 border border-primary/10 font-mono space-y-4">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-primary/60 border-b border-primary/10 pb-2">
                  <span className="flex items-center gap-2">
                    <Film className="w-3.5 h-3.5 text-primary" />
                    Popis lekcija modula: {activeModule.title}
                  </span>
                  <span>{moduleLessons.length} lekcija</span>
                </div>

                {moduleLessons.length === 0 ? (
                  <p className="text-xs text-[#bfb9ca]/60 py-4 text-center">Nema dodanih video lekcija unutar ovog modula.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                    {moduleLessons.map((les) => {
                      const isCurrentVideo = activeLesson?.id === les.id;
                      return (
                        <div 
                          key={les.id}
                          className={`p-3 border transition-all flex items-center justify-between cursor-pointer ${
                            isCurrentVideo 
                              ? 'bg-primary/5 border-primary/40' 
                              : 'bg-black/30 border-white/5 hover:border-primary/25'
                          }`}
                          onClick={() => setActiveLesson(les)}
                        >
                          <div className="flex items-center gap-3 pr-4 truncate">
                            <div className={`w-7 h-7 flex items-center justify-center shrink-0 border ${
                              isCurrentVideo ? 'bg-primary/20 text-primary border-primary/40' : 'bg-white/5 text-muted-foreground border-white/10'
                            }`}>
                              {isCurrentVideo ? <PlayCircle className="w-4 h-4 fill-primary/10 animate-pulse text-primary" /> : <Play className="w-3.5 h-3.5" />}
                            </div>
                            <div className="truncate">
                              <span className={`text-xs font-bold block ${isCurrentVideo ? 'text-primary' : 'text-white/95'}`}>
                                {les.title}
                              </span>
                              {les.description && <span className="text-[9px] text-muted-foreground block truncate max-w-[400px] mt-0.5">{les.description}</span>}
                            </div>
                          </div>

                          <span className="text-[10px] font-mono font-bold text-primary/70 shrink-0 bg-primary/5 px-2 py-0.5 border border-primary/10">
                            {les.duration}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Quick Tips or features panel for study */}
            <div className="p-5 bg-card/25 border border-primary/5 font-mono text-[11px] text-muted-foreground leading-relaxed flex gap-3 items-start">
              <Flame className="w-5 h-5 text-[#ff8300]/80 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-white uppercase tracking-wider block">Mentorski savjet za razumijevanje:</span>
                Nemojte samo gledati videozapise — bilježite zone likvidnosti na vlastitim grafovima uživo i pazite na smjer akumulacije velikih investicijskih entiteta prije nego uđete u rizik.
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
