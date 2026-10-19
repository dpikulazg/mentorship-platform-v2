import React, { useState, useEffect, useRef } from 'react';
import { Module, Lesson } from '../types';
import { unifiedDataService } from '../services/dataSource';
import { useDataSource } from '../hooks/useDataSource';
import { getVideoBlob, saveVideoBlob, deleteVideoBlob } from '../lib/sqlite';
import { toast } from 'sonner';
import { 
  Plus, Save, Trash2, Edit2, Film, FolderPlus, 
  Clock, ArrowUpDown, ChevronRight, Video, 
  ExternalLink, ListOrdered, ClipboardList, Info,
  Upload, HardDrive, Play, CheckCircle2, FileVideo,
  Eye, RefreshCw, X, Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export function AdminVideoCMS() {
  const { dataSource, updateTick, triggerRefresh } = useDataSource();
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states for Module
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [moduleOrder, setModuleOrder] = useState(1);

  // Form states for Lesson
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonMode, setLessonMode] = useState<'upload' | 'url'>('upload');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState('10:00');
  const [lessonOrder, setLessonOrder] = useState(1);

  // Video Upload file states
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [existingBlobId, setExistingBlobId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active preview modal
  const [activePreviewLesson, setActivePreviewLesson] = useState<Lesson | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedModules, fetchedLessons] = await Promise.all([
        unifiedDataService.getModules(),
        unifiedDataService.getLessons()
      ]);

      setModules(fetchedModules);
      setLessons(fetchedLessons);

      if (fetchedModules.length > 0) {
        setSelectedModule(prev => {
          if (prev && fetchedModules.some(m => m.id === prev.id)) {
            return fetchedModules.find(m => m.id === prev.id) || fetchedModules[0];
          }
          return fetchedModules[0];
        });
      }
    } catch (err) {
      console.error('Failed to load CMS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [updateTick, dataSource]);

  // Handle Video file selection & duration parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file (.mp4, .webm, .mov, etc.)');
      return;
    }

    setSelectedVideoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);

    // Auto-calculate video duration
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;
    tempVideo.onloadedmetadata = () => {
      const totalSec = Math.round(tempVideo.duration);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      setLessonDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };

    if (!lessonTitle) {
      // Auto-populate title from filename without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setLessonTitle(cleanName);
    }
  };

  // Handle Module operations
  const handleSaveModule = async () => {
    if (!moduleTitle.trim()) {
      toast.error('Module title is required.');
      return;
    }

    const moduleId = editingModuleId || `mod-${Date.now().toString(36)}`;
    const newModule: Module = {
      id: moduleId,
      title: moduleTitle.trim(),
      description: moduleDesc.trim(),
      order: moduleOrder,
      createdAt: new Date().toISOString()
    };

    try {
      await unifiedDataService.saveModule(newModule);
      toast.success(editingModuleId ? 'MODULE CONFIGURATION UPDATED' : 'NEW LEARNING MODULE REGISTERED');
      resetModuleForm();
      loadData();
      triggerRefresh();
    } catch (err: any) {
      toast.error('Failed to save module: ' + err.message);
    }
  };

  const handleEditModule = (mod: Module) => {
    setEditingModuleId(mod.id);
    setModuleTitle(mod.title);
    setModuleDesc(mod.description);
    setModuleOrder(mod.order);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this module? All related video lessons will be deleted.')) {
      return;
    }

    try {
      await unifiedDataService.deleteModule(moduleId);
      toast.success('MODULE AND LINKED VIDEO LESSONS PURGED');
      if (selectedModule?.id === moduleId) {
        setSelectedModule(null);
      }
      loadData();
      triggerRefresh();
    } catch (err: any) {
      toast.error('Module deletion failed: ' + err.message);
    }
  };

  const resetModuleForm = () => {
    setEditingModuleId(null);
    setModuleTitle('');
    setModuleDesc('');
    setModuleOrder(modules.length + 1);
  };

  // Handle Lesson operations
  const handleSaveLesson = async () => {
    if (!selectedModule) {
      toast.error('Please select or create a learning module first.');
      return;
    }
    if (!lessonTitle.trim()) {
      toast.error('Lesson title is required.');
      return;
    }

    if (lessonMode === 'url' && !lessonVideoUrl.trim()) {
      toast.error('Video or stream URL is required.');
      return;
    }

    if (lessonMode === 'upload' && !selectedVideoFile && !existingBlobId) {
      toast.error('Please choose a video file to upload.');
      return;
    }

    const lessonId = editingLessonId || `les-${Date.now().toString(36)}`;
    const blobId = existingBlobId || (selectedVideoFile ? `blob-${lessonId}-${Date.now()}` : undefined);

    const newLesson: Lesson = {
      id: lessonId,
      moduleId: selectedModule.id,
      title: lessonTitle.trim(),
      description: lessonDesc.trim(),
      videoUrl: lessonMode === 'url' ? lessonVideoUrl.trim() : '',
      duration: lessonDuration.trim() || '10:00',
      order: lessonOrder,
      createdAt: new Date().toISOString(),
      videoType: lessonMode,
      videoFileName: selectedVideoFile ? selectedVideoFile.name : undefined,
      videoFileSize: selectedVideoFile ? selectedVideoFile.size : undefined,
      videoBlobId: blobId,
      isUploaded: lessonMode === 'upload'
    };

    try {
      setUploadProgress(40);
      await unifiedDataService.saveLesson(newLesson, selectedVideoFile || undefined);
      setUploadProgress(100);

      toast.success(editingLessonId ? 'VIDEO LESSON DATA MODIFIED' : 'NEW LESSON SAVED & VIDEO ATTACHED');
      resetLessonForm();
      loadData();
      triggerRefresh();
    } catch (err: any) {
      toast.error('Failed to save lesson: ' + err.message);
    } finally {
      setTimeout(() => setUploadProgress(null), 800);
    }
  };

  const handleEditLesson = async (les: Lesson) => {
    setEditingLessonId(les.id);
    setLessonTitle(les.title);
    setLessonDesc(les.description);
    setLessonOrder(les.order);
    setLessonDuration(les.duration);

    if (les.videoType === 'upload' || les.isUploaded) {
      setLessonMode('upload');
      setExistingBlobId(les.videoBlobId || null);
      if (les.videoBlobId) {
        const blob = await getVideoBlob(les.videoBlobId);
        if (blob) {
          setVideoPreviewUrl(URL.createObjectURL(blob));
        }
      }
    } else {
      setLessonMode('url');
      setLessonVideoUrl(les.videoUrl);
      setExistingBlobId(null);
      setVideoPreviewUrl(null);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to remove this video lesson?')) {
      return;
    }

    try {
      await unifiedDataService.deleteLesson(lessonId);
      toast.success('VIDEO LESSON PURGED SUCCESSFULLY');
      loadData();
      triggerRefresh();
    } catch (err: any) {
      toast.error('Lesson purge failed: ' + err.message);
    }
  };

  const resetLessonForm = () => {
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDesc('');
    setLessonVideoUrl('');
    setSelectedVideoFile(null);
    setVideoPreviewUrl(null);
    setExistingBlobId(null);
    setLessonDuration('10:00');
    if (fileInputRef.current) fileInputRef.current.value = '';
    const nextOrder = lessons.filter(l => l.moduleId === selectedModule?.id).length + 1;
    setLessonOrder(nextOrder);
  };

  // Preview Player Modal
  const openLessonPreview = async (lesson: Lesson) => {
    setActivePreviewLesson(lesson);
    if (lesson.videoType === 'upload' && lesson.videoBlobId) {
      const blob = await getVideoBlob(lesson.videoBlobId);
      if (blob) {
        setPreviewBlobUrl(URL.createObjectURL(blob));
      } else {
        setPreviewBlobUrl(null);
        toast.error('Video blob not found in local store.');
      }
    } else {
      setPreviewBlobUrl(null);
    }
  };

  const closeLessonPreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setActivePreviewLesson(null);
    setPreviewBlobUrl(null);
  };

  const selectedModuleLessons = lessons.filter(l => l.moduleId === selectedModule?.id);

  return (
    <div className="space-y-10 font-mono">
      {/* CMS Statistics bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-primary/50 uppercase tracking-widest">Total Modules</p>
              <h3 className="text-3xl font-black text-white tracking-tighter mt-1">{modules.length}</h3>
            </div>
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary">
              <ClipboardList className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-primary/50 uppercase tracking-widest">Total Lessons</p>
              <h3 className="text-3xl font-black text-white tracking-tighter mt-1">{lessons.length}</h3>
            </div>
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary">
              <Film className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-primary/50 uppercase tracking-widest">Local Uploaded Videos</p>
              <h3 className="text-3xl font-black text-green-400 tracking-tighter mt-1">
                {lessons.filter(l => l.videoType === 'upload' || l.isUploaded).length}
              </h3>
            </div>
            <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-primary/50 uppercase tracking-widest">Active Data Store</p>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                {dataSource === 'sqlite' ? 'SQLite Engine' : 'Firestore'}
              </h3>
            </div>
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary">
              <RefreshCw className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Modules management (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
            <CardHeader className="border-b border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-heading text-primary tracking-wide">
                    {editingModuleId ? 'Edit Learning Module' : 'Create Learning Module'}
                  </CardTitle>
                  <CardDescription className="text-[9px] text-primary/50 uppercase">
                    Setup curriculum chapters & knowledge tracks
                  </CardDescription>
                </div>
                {editingModuleId && (
                  <Button size="sm" variant="ghost" className="text-primary/60 text-[9px] h-6 rounded-none underline hover:text-primary" onClick={resetModuleForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-primary/60 uppercase font-bold">Module Title</label>
                <Input 
                  placeholder="e.g., Likvidnost i Struktura Grafova" 
                  value={moduleTitle} 
                  onChange={e => setModuleTitle(e.target.value)}
                  className="bg-transparent border-primary/20 rounded-none text-xs h-9 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-primary/60 uppercase font-bold">Description / Learning Goals</label>
                <textarea 
                  placeholder="Curriculum overview for students..." 
                  value={moduleDesc} 
                  onChange={e => setModuleDesc(e.target.value)}
                  className="w-full bg-transparent border border-primary/20 p-3 rounded-none text-xs focus:border-primary focus:outline-none min-h-[80px] text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-primary/60 uppercase font-bold">Sequence Order</label>
                  <Input 
                    type="number" 
                    value={moduleOrder} 
                    onChange={e => setModuleOrder(parseInt(e.target.value) || 1)}
                    className="bg-transparent border-primary/20 rounded-none text-xs h-9 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    className="w-full h-9 bg-primary text-black hover:bg-primary/80 font-bold text-[10px] uppercase tracking-widest rounded-none"
                    onClick={handleSaveModule}
                  >
                    <FolderPlus className="w-3.5 h-3.5 mr-2" />
                    {editingModuleId ? 'Update Module' : 'Register Module'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module Registry List */}
          <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
            <CardHeader className="border-b border-primary/20 bg-primary/5">
              <CardTitle className="text-sm font-heading text-primary tracking-wide">
                Learning Modules Hierarchy
              </CardTitle>
              <CardDescription className="text-[9px] text-primary/50 uppercase">
                Select a module to manage its attached video lessons
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 max-h-[380px] overflow-y-auto">
              {modules.length === 0 ? (
                <div className="p-6 text-center text-primary/35 text-xs">
                  No learning modules configured yet.
                </div>
              ) : (
                <div className="divide-y divide-primary/10">
                  {modules.map((mod) => {
                    const lessonsCount = lessons.filter(l => l.moduleId === mod.id).length;
                    const isSelected = selectedModule?.id === mod.id;
                    return (
                      <div 
                        key={mod.id} 
                        className={`p-4 flex items-center justify-between transition-all cursor-pointer ${
                          isSelected ? 'bg-primary/15 border-l-[3px] border-primary' : 'hover:bg-primary/5 bg-[#030305]/40'
                        }`}
                        onClick={() => setSelectedModule(mod)}
                      >
                        <div className="space-y-1 pr-3 truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-primary/50 border border-primary/20 px-1 py-0.5 bg-primary/5">
                              #{mod.order}
                            </span>
                            <span className="font-bold text-xs text-white truncate">{mod.title}</span>
                          </div>
                          <p className="text-[9px] text-[#bfb9ca] truncate max-w-[220px]">{mod.description || 'No description.'}</p>
                          <div className="text-[8px] uppercase tracking-widest text-primary/60 flex items-center gap-1.5 mt-1">
                            <Film className="w-2.5 h-2.5" />
                            <span>{lessonsCount} lessons attached</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="w-7 h-7 text-primary/50 hover:text-primary rounded-none"
                            onClick={() => handleEditModule(mod)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="w-7 h-7 text-primary/50 hover:text-red-500 rounded-none"
                            onClick={() => handleDeleteModule(mod.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Video Lesson Upload CRM & Curriculum List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!selectedModule ? (
            <div className="border border-dashed border-primary/25 p-12 text-center text-primary/40 text-xs rounded-none">
              <Info className="w-8 h-8 text-primary/30 mx-auto mb-3 animate-pulse" />
              SELECT OR CREATE A MODULE TO UPLOAD VIDEO LESSONS.
            </div>
          ) : (
            <>
              {/* Selected Module Banner */}
              <div className="p-5 bg-[#0c0815] border border-primary/30 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-[#7d08e8]" />
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5">
                    Modul {selectedModule.order} Active
                  </span>
                  <h3 className="text-base font-black text-white italic tracking-tight mt-1">{selectedModule.title}</h3>
                  <p className="text-[10px] text-[#bfb9ca] max-w-[420px]">{selectedModule.description || 'No description assigned.'}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary tracking-tighter block">{selectedModuleLessons.length}</span>
                  <span className="text-[8px] text-primary/40 uppercase tracking-widest block">Lessons Attached</span>
                </div>
              </div>

              {/* Lesson Input / Video Upload CRM Form */}
              <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
                <CardHeader className="border-b border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-heading text-primary tracking-wide">
                        {editingLessonId ? 'Modify Mentorship Lesson' : 'Upload Mentorship Video Lesson'}
                      </CardTitle>
                      <CardDescription className="text-[9px] text-primary/50 uppercase">
                        Store video directly in SQLite local store or link external stream
                      </CardDescription>
                    </div>
                    {editingLessonId && (
                      <Button size="sm" variant="ghost" className="text-primary/60 text-[9px] h-6 rounded-none underline hover:text-primary" onClick={resetLessonForm}>
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {/* Mode Selector: Direct Upload vs Stream URL */}
                  <div className="flex border border-primary/20 p-1 bg-[#050508] gap-1">
                    <button
                      type="button"
                      onClick={() => setLessonMode('upload')}
                      className={`flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        lessonMode === 'upload' 
                          ? 'bg-primary text-black' 
                          : 'text-primary/60 hover:text-primary'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Direct Local Video File Upload (MP4 / WebM)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLessonMode('url')}
                      className={`flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        lessonMode === 'url' 
                          ? 'bg-primary text-black' 
                          : 'text-primary/60 hover:text-primary'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      External Stream URL (YouTube / Vimeo)
                    </button>
                  </div>

                  {/* Upload Field or URL Field */}
                  {lessonMode === 'upload' ? (
                    <div className="space-y-3">
                      <label className="text-[9px] text-primary/60 uppercase font-bold flex items-center justify-between">
                        <span>Video Mentorship File (Stored in SQLite & Local Blob Storage)</span>
                        {selectedVideoFile && (
                          <span className="text-green-400 text-[9px]">
                            {(selectedVideoFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedVideoFile.name}
                          </span>
                        )}
                      </label>

                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-primary/30 hover:border-primary p-6 text-center cursor-pointer transition-colors bg-[#080511]/50 group"
                      >
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          onChange={handleFileChange}
                          className="hidden" 
                        />
                        <FileVideo className="w-8 h-8 text-primary/50 group-hover:text-primary mx-auto mb-2 transition-colors" />
                        <p className="text-xs text-white font-bold">
                          {selectedVideoFile ? selectedVideoFile.name : (existingBlobId ? 'Replace Existing Local Video File' : 'Click to Browse or Drag & Drop Mentorship Video')}
                        </p>
                        <p className="text-[9px] text-[#bfb9ca] mt-1">
                          Supports MP4, WebM, MOV. Instant zero-cloud local playback.
                        </p>
                      </div>

                      {/* Video Preview Player inside form */}
                      {videoPreviewUrl && (
                        <div className="border border-primary/20 bg-black p-2 space-y-2">
                          <div className="flex justify-between items-center text-[9px] text-primary/60 px-1">
                            <span>Uploaded Video Local Preview</span>
                            <span>{lessonDuration}</span>
                          </div>
                          <video 
                            src={videoPreviewUrl} 
                            controls 
                            className="w-full max-h-[220px] bg-black" 
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-primary/60 uppercase font-bold">Video Stream URL</label>
                      <div className="relative">
                        <Input 
                          placeholder="https://www.youtube.com/embed/... or https://video.stream/..." 
                          value={lessonVideoUrl}
                          onChange={e => setLessonVideoUrl(e.target.value)}
                          className="bg-transparent border-primary/20 rounded-none text-xs h-9 pl-9 text-white"
                        />
                        <Video className="w-4 h-4 text-primary/45 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}

                  {/* Lesson Title & Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-primary/60 uppercase font-bold">Lesson Name</label>
                      <Input 
                        placeholder="e.g., Likvidnost i Pametni Novac" 
                        value={lessonTitle}
                        onChange={e => setLessonTitle(e.target.value)}
                        className="bg-transparent border-primary/20 rounded-none text-xs h-9 text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-primary/60 uppercase font-bold">Duration / Time-interval</label>
                      <Input 
                        placeholder="e.g., 14:20 or 1h 05m" 
                        value={lessonDuration}
                        onChange={e => setLessonDuration(e.target.value)}
                        className="bg-transparent border-primary/20 rounded-none text-xs h-9 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-primary/60 uppercase font-bold">Detailed Notes / Action Items</label>
                    <textarea 
                      placeholder="Key concepts covered in this mentorship recording..." 
                      value={lessonDesc}
                      onChange={e => setLessonDesc(e.target.value)}
                      className="w-full bg-transparent border border-primary/20 p-3 rounded-none text-xs focus:border-primary focus:outline-none min-h-[60px] text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-primary/60 uppercase font-bold">Lesson Index Sequence</label>
                      <Input 
                        type="number" 
                        value={lessonOrder}
                        onChange={e => setLessonOrder(parseInt(e.target.value) || 1)}
                        className="bg-transparent border-primary/20 rounded-none text-xs h-9 text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        className="w-full h-9 bg-primary text-black hover:bg-primary/80 font-bold text-[10px] uppercase tracking-widest rounded-none shadow-[0_0_10px_rgba(175,70,255,0.15)]"
                        onClick={handleSaveLesson}
                      >
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        {editingLessonId ? 'Commit Modification' : 'Save & Attach Lesson'}
                      </Button>
                    </div>
                  </div>

                  {uploadProgress !== null && (
                    <div className="w-full bg-primary/10 h-1.5 overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lesson Playlist Table */}
              <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
                <CardHeader className="border-b border-primary/20 bg-primary/5">
                  <CardTitle className="text-sm font-heading text-primary tracking-wide">
                    Curriculum Video Playlist // Lessons
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {selectedModuleLessons.length === 0 ? (
                    <div className="p-8 text-center text-primary/35 text-xs">
                      No video lessons attached to this module.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-[#05050a]">
                        <TableRow className="border-primary/20">
                          <TableHead className="text-[9px] uppercase text-primary/60 w-10 text-center">No</TableHead>
                          <TableHead className="text-[9px] uppercase text-primary/60">Lesson Title</TableHead>
                          <TableHead className="text-[9px] uppercase text-primary/60">Type</TableHead>
                          <TableHead className="text-[9px] uppercase text-primary/60">Duration</TableHead>
                          <TableHead className="text-[9px] uppercase text-primary/60 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedModuleLessons.map((les) => (
                          <TableRow key={les.id} className="border-primary/10 hover:bg-primary/5 transition-colors">
                            <TableCell className="text-center font-bold text-xs text-primary/70">{les.order}</TableCell>
                            <TableCell>
                              <div>
                                <span className="font-bold text-xs text-white block">{les.title}</span>
                                {les.description && <span className="text-[9px] text-[#bfb9ca] block truncate max-w-[240px]">{les.description}</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {les.videoType === 'upload' || les.isUploaded ? (
                                <span className="inline-flex items-center gap-1 text-[8px] bg-green-500/10 text-green-400 border border-green-500/30 px-1.5 py-0.5 uppercase tracking-widest font-bold">
                                  <HardDrive className="w-2.5 h-2.5" /> Local Video
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 uppercase tracking-widest font-bold">
                                  <ExternalLink className="w-2.5 h-2.5" /> Web Stream
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-[10px] text-[#bfb9ca]">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-primary/50" />
                                {les.duration}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="w-7 h-7 text-primary/70 hover:text-green-400 rounded-none"
                                  onClick={() => openLessonPreview(les)}
                                  title="Play / Preview Video"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="w-7 h-7 text-primary/50 hover:text-primary rounded-none"
                                  onClick={() => handleEditLesson(les)}
                                  title="Edit Lesson"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="w-7 h-7 text-primary/50 hover:text-red-500 rounded-none"
                                  onClick={() => handleDeleteLesson(les.id)}
                                  title="Delete Lesson"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

      </div>

      {/* Video Preview Modal */}
      {activePreviewLesson && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0814] border border-primary/40 w-full max-w-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-primary/20 pb-3">
              <div>
                <span className="text-[9px] text-primary/50 uppercase tracking-widest block">Video Playback Preview</span>
                <h3 className="text-base font-bold text-white">{activePreviewLesson.title}</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={closeLessonPreview}
                className="text-primary/60 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center border border-primary/20 overflow-hidden">
              {previewBlobUrl ? (
                <video 
                  src={previewBlobUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain" 
                />
              ) : activePreviewLesson.videoUrl ? (
                <iframe 
                  src={activePreviewLesson.videoUrl} 
                  title={activePreviewLesson.title} 
                  className="w-full h-full border-0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                />
              ) : (
                <div className="text-primary/40 text-xs">No playable video media stream available.</div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 text-[10px] text-[#bfb9ca]">
              <span>Duration: {activePreviewLesson.duration}</span>
              {previewBlobUrl && (
                <a 
                  href={previewBlobUrl} 
                  download={activePreviewLesson.videoFileName || `${activePreviewLesson.title}.mp4`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <Download className="w-3 h-3" /> Download Local File
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
