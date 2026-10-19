import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Module, Lesson } from '../types';
import { unifiedDataService } from '../services/dataSource';
import { useDataSource } from '../hooks/useDataSource';
import { getVideoBlob, saveVideoBlob } from '../lib/sqlite';
import { toast } from 'sonner';
import { 
  Film, Video, Plus, Search, Filter, Play, 
  ExternalLink, Edit2, Trash2, Clock, Copy, 
  CheckCircle2, X, Download, HardDrive, FileVideo, 
  Layers, Upload, FolderPlus, Info, Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export function MentorshipVideoLibrary() {
  const { updateTick, triggerRefresh } = useDataSource();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [viewFormat, setViewFormat] = useState<'grid' | 'table'>('grid');

  // Modal - Create / Edit Lesson
  const [showModal, setShowModal] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [newModuleName, setNewModuleName] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonLink, setLessonLink] = useState('');
  const [lessonDuration, setLessonDuration] = useState('15:00');
  const [lessonOrder, setLessonOrder] = useState<number>(1);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [existingBlobId, setExistingBlobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal - Video Player Preview
  const [activePlayLesson, setActivePlayLesson] = useState<Lesson | null>(null);
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);

  // Load existing lessons and modules from SQLite
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedModules, fetchedLessons] = await Promise.all([
        unifiedDataService.getModules(),
        unifiedDataService.getLessons()
      ]);
      setModules(fetchedModules);
      setLessons(fetchedLessons);

      if (fetchedModules.length > 0 && !selectedModuleId) {
        setSelectedModuleId(fetchedModules[0].id);
      }
    } catch (err) {
      console.error('Failed to load video library data from SQLite:', err);
      toast.error('Failed to load mentorship library.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [updateTick]);

  // Convert raw URLs into embeddable iframe URL for streaming links
  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    const ytMatch = rawUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    if (ytMatch && ytMatch[2].length === 11) {
      return `https://www.youtube.com/embed/${ytMatch[2]}?autoplay=1&rel=0`;
    }
    const vimeoMatch = rawUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
    if (vimeoMatch && vimeoMatch[3]) {
      return `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1`;
    }
    return rawUrl;
  };

  // Filtered lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      const matchesSearch = 
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lesson.description && lesson.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lesson.videoUrl && lesson.videoUrl.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesModule = 
        selectedModuleFilter === 'all' || lesson.moduleId === selectedModuleFilter;

      return matchesSearch && matchesModule;
    });
  }, [lessons, searchQuery, selectedModuleFilter]);

  // Handle open modal for creation
  const handleOpenCreate = () => {
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonDesc('');
    setLessonLink('');
    setLessonDuration('15:00');
    setUploadFile(null);
    setExistingBlobId(null);
    setNewModuleName('');
    if (modules.length > 0) {
      setSelectedModuleId(modules[0].id);
      setLessonOrder(lessons.filter(l => l.moduleId === modules[0].id).length + 1);
    } else {
      setSelectedModuleId('new');
      setLessonOrder(1);
    }
    setShowModal(true);
  };

  // Handle open modal for editing
  const handleOpenEdit = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setSelectedModuleId(lesson.moduleId);
    setLessonTitle(lesson.title);
    setLessonDesc(lesson.description || '');
    setLessonLink(lesson.videoUrl || '');
    setLessonDuration(lesson.duration || '15:00');
    setLessonOrder(lesson.order || 1);
    setExistingBlobId(lesson.videoBlobId || null);
    setUploadFile(null);
    setNewModuleName('');
    setShowModal(true);
  };

  // Handle File selection for video
  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please choose a valid video file (.mp4, .webm, .mov)');
      return;
    }

    setUploadFile(file);
    if (!lessonTitle) {
      setLessonTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }

    // Auto-detect duration
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    const tempUrl = URL.createObjectURL(file);
    tempVideo.src = tempUrl;
    tempVideo.onloadedmetadata = () => {
      const totalSec = Math.round(tempVideo.duration);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      setLessonDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      URL.revokeObjectURL(tempUrl);
    };
  };

  // Save lesson metadata to SQLite
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lessonTitle.trim()) {
      toast.error('Lesson title is required.');
      return;
    }

    if (!lessonLink.trim() && !uploadFile && !existingBlobId) {
      toast.error('Please provide a video link or select a video file.');
      return;
    }

    try {
      let targetModuleId = selectedModuleId;

      // Handle on-the-fly module creation if requested
      if (selectedModuleId === 'new') {
        if (!newModuleName.trim()) {
          toast.error('Please specify a title for the new learning module.');
          return;
        }
        targetModuleId = `mod-${Date.now().toString(36)}`;
        const newMod: Module = {
          id: targetModuleId,
          title: newModuleName.trim(),
          description: 'Created via Mentorship Video Library',
          order: modules.length + 1,
          createdAt: new Date().toISOString()
        };
        await unifiedDataService.saveModule(newMod);
      }

      const lessonId = editingLessonId || `les-${Date.now().toString(36)}`;
      const isUpload = Boolean(uploadFile || existingBlobId);
      const blobId = existingBlobId || (uploadFile ? `blob-${lessonId}-${Date.now()}` : undefined);

      const lessonData: Lesson = {
        id: lessonId,
        moduleId: targetModuleId,
        title: lessonTitle.trim(),
        description: lessonDesc.trim(),
        videoUrl: lessonLink.trim(),
        duration: lessonDuration.trim() || '15:00',
        order: Number(lessonOrder) || 1,
        createdAt: new Date().toISOString(),
        videoType: isUpload ? 'upload' : 'url',
        videoFileName: uploadFile ? uploadFile.name : undefined,
        videoFileSize: uploadFile ? uploadFile.size : undefined,
        videoBlobId: blobId,
        isUploaded: isUpload
      };

      await unifiedDataService.saveLesson(lessonData, uploadFile || undefined);
      toast.success(editingLessonId ? 'LESSON METADATA UPDATED' : 'NEW MENTORSHIP VIDEO STORED IN SQLITE');
      setShowModal(false);
      loadData();
      triggerRefresh();
    } catch (err: any) {
      console.error('Error saving lesson to SQLite:', err);
      toast.error('Failed to save lesson: ' + (err.message || 'Unknown error'));
    }
  };

  // Delete lesson
  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!confirm(`Are you sure you want to remove lesson "${lesson.title}" from the SQLite library?`)) {
      return;
    }
    try {
      await unifiedDataService.deleteLesson(lesson.id);
      toast.success('LESSON REMOVED FROM SQLITE STORE');
      loadData();
      triggerRefresh();
    } catch (err: any) {
      toast.error('Failed to delete lesson: ' + err.message);
    }
  };

  // Play video modal handler
  const handlePlayVideo = async (lesson: Lesson) => {
    setActivePlayLesson(lesson);
    if ((lesson.videoType === 'upload' || lesson.isUploaded) && lesson.videoBlobId) {
      const blob = await getVideoBlob(lesson.videoBlobId);
      if (blob) {
        setActiveBlobUrl(URL.createObjectURL(blob));
      } else {
        setActiveBlobUrl(null);
        toast.error('Video blob not found in local store.');
      }
    } else {
      setActiveBlobUrl(null);
    }
  };

  const handleClosePlayer = () => {
    if (activeBlobUrl) {
      URL.revokeObjectURL(activeBlobUrl);
    }
    setActivePlayLesson(null);
    setActiveBlobUrl(null);
  };

  const copyLessonLink = (lesson: Lesson) => {
    const link = lesson.videoUrl || `${window.location.origin}/#program`;
    navigator.clipboard.writeText(link);
    toast.success(`COPIED VIDEO LINK: ${link}`);
  };

  return (
    <div className="space-y-8 font-mono">
      {/* 1. Header Bar & Library Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-all shadow-[0_0_10px_rgba(175,70,255,0.2)]" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-primary/50 uppercase tracking-widest">Library Lessons</p>
              <h3 className="text-2xl font-black text-white tracking-tight mt-1">{lessons.length}</h3>
            </div>
            <div className="p-2 bg-primary/10 border border-primary/20 text-primary">
              <Film className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/40 group-hover:bg-purple-500 transition-all" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-purple-400/60 uppercase tracking-widest">Modules Configured</p>
              <h3 className="text-2xl font-black text-white tracking-tight mt-1">{modules.length}</h3>
            </div>
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/40 group-hover:bg-blue-500 transition-all" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-400/60 uppercase tracking-widest">External Stream Links</p>
              <h3 className="text-2xl font-black text-white tracking-tight mt-1">
                {lessons.filter(l => l.videoType !== 'upload' && !l.isUploaded).length}
              </h3>
            </div>
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ExternalLink className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#050507]/60 border-primary/20 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500/40 group-hover:bg-green-500 transition-all" />
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-green-400/60 uppercase tracking-widest">Local Uploaded Media</p>
              <h3 className="text-2xl font-black text-green-400 tracking-tight mt-1">
                {lessons.filter(l => l.videoType === 'upload' || l.isUploaded).length}
              </h3>
            </div>
            <div className="p-2 bg-green-500/10 border border-green-500/20 text-green-400">
              <HardDrive className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Control & Search Toolbar */}
      <div className="bg-[#0a0712] border border-primary/20 p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search lessons by title, notes, link..."
              className="bg-[#050508] border-primary/25 rounded-none text-xs h-9 pl-8 text-white w-full"
            />
            <Search className="w-3.5 h-3.5 text-primary/45 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-primary/50 hidden sm:block" />
            <select
              value={selectedModuleFilter}
              onChange={e => setSelectedModuleFilter(e.target.value)}
              className="bg-[#050508] border border-primary/25 text-white text-xs px-2.5 h-9 rounded-none focus:border-primary focus:outline-none"
            >
              <option value="all">All Modules ({lessons.length})</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Toggle & Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex border border-primary/20 p-0.5 bg-[#050508] gap-1">
            <button
              onClick={() => setViewFormat('grid')}
              className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all ${
                viewFormat === 'grid' ? 'bg-primary text-black' : 'text-primary/60 hover:text-white'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewFormat('table')}
              className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all ${
                viewFormat === 'table' ? 'bg-primary text-black' : 'text-primary/60 hover:text-white'
              }`}
            >
              Table View
            </button>
          </div>

          <Button 
            onClick={handleOpenCreate}
            className="rounded-none bg-primary text-black hover:bg-primary/80 text-[10px] font-bold uppercase tracking-widest h-9 px-4 shadow-[0_0_12px_rgba(175,70,255,0.25)]"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Store Video Lesson
          </Button>
        </div>
      </div>

      {/* 3. Main Library Content */}
      {filteredLessons.length === 0 ? (
        <Card className="bg-[#050507]/40 border-primary/20 rounded-none p-12 text-center">
          <Video className="w-10 h-10 text-primary/30 mx-auto mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Mentorship Videos Found</h3>
          <p className="text-[10px] text-[#bfb9ca] mt-1 max-w-md mx-auto">
            {searchQuery 
              ? 'No lessons matched your search query. Try clearing the filter.' 
              : 'The mentorship video library is currently empty. Click "Store Video Lesson" to upload your first lesson.'}
          </p>
          <Button 
            onClick={handleOpenCreate}
            className="mt-4 rounded-none bg-primary text-black hover:bg-primary/80 text-[10px] font-bold uppercase tracking-widest h-8 px-4"
          >
            <Plus className="w-3 h-3 mr-1" /> Add First Lesson
          </Button>
        </Card>
      ) : viewFormat === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map(lesson => {
            const mod = modules.find(m => m.id === lesson.moduleId);
            const isLocalUpload = lesson.videoType === 'upload' || lesson.isUploaded;

            return (
              <Card 
                key={lesson.id} 
                className="bg-[#080512] border-primary/20 rounded-none overflow-hidden group hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail / Video Screen preview top */}
                  <div 
                    onClick={() => handlePlayVideo(lesson)}
                    className="aspect-video bg-black/80 relative flex items-center justify-center cursor-pointer border-b border-primary/10 overflow-hidden group/screen"
                  >
                    <div className="absolute inset-0 bg-primary/5 group-hover/screen:bg-primary/15 transition-all" />
                    <div className="p-3 bg-primary/20 border border-primary/40 rounded-full group-hover/screen:scale-110 group-hover/screen:bg-primary text-primary group-hover/screen:text-black transition-all">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="text-[8px] bg-black/80 border border-primary/30 text-primary px-2 py-0.5 uppercase tracking-widest font-bold">
                        #{lesson.order}
                      </span>
                      {isLocalUpload ? (
                        <span className="text-[8px] bg-green-500/20 border border-green-500/30 text-green-300 px-1.5 py-0.5 uppercase tracking-widest font-bold flex items-center gap-1">
                          <HardDrive className="w-2.5 h-2.5" /> SQLite Blob
                        </span>
                      ) : (
                        <span className="text-[8px] bg-purple-500/20 border border-purple-500/30 text-purple-300 px-1.5 py-0.5 uppercase tracking-widest font-bold flex items-center gap-1">
                          <ExternalLink className="w-2.5 h-2.5" /> Web Stream
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2 text-[9px] bg-black/80 text-white/80 px-2 py-0.5 border border-white/10 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-primary" /> {lesson.duration || '10:00'}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2">
                    <span className="text-[9px] text-primary/60 uppercase tracking-widest block truncate">
                      {mod ? mod.title : 'Uncategorized Module'}
                    </span>
                    <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {lesson.title}
                    </h4>
                    <p className="text-[10px] text-[#bfb9ca] line-clamp-2 leading-relaxed">
                      {lesson.description || 'No detailed lesson description provided.'}
                    </p>
                  </div>
                </div>

                {/* Footer with Link & Actions */}
                <div className="p-4 pt-2 border-t border-primary/10 bg-black/30 flex items-center justify-between text-xs">
                  <div className="truncate max-w-[170px]">
                    {lesson.videoUrl ? (
                      <a 
                        href={lesson.videoUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] text-primary hover:underline truncate inline-flex items-center gap-1"
                        title={lesson.videoUrl}
                      >
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{lesson.videoUrl.replace(/^https?:\/\//, '')}</span>
                      </a>
                    ) : (
                      <span className="text-[9px] text-green-400/80 truncate block">
                        {lesson.videoFileName || 'Local binary video file'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="w-7 h-7 text-primary/60 hover:text-primary rounded-none"
                      onClick={() => copyLessonLink(lesson)}
                      title="Copy Lesson Link"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="w-7 h-7 text-primary/60 hover:text-primary rounded-none"
                      onClick={() => handleOpenEdit(lesson)}
                      title="Edit Lesson Metadata"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="w-7 h-7 text-primary/60 hover:text-red-400 rounded-none"
                      onClick={() => handleDeleteLesson(lesson)}
                      title="Delete Lesson"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#05050a]">
                <TableRow className="border-primary/20 hover:bg-transparent">
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60 w-12 text-center">Seq</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60">Lesson Title</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60">Module</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60">Media Type</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60">Duration</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60">Link / Destination</TableHead>
                  <TableHead className="text-[9px] uppercase tracking-wider text-primary/60 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map(lesson => {
                  const mod = modules.find(m => m.id === lesson.moduleId);
                  const isLocalUpload = lesson.videoType === 'upload' || lesson.isUploaded;

                  return (
                    <TableRow key={lesson.id} className="border-primary/10 hover:bg-primary/5 transition-colors">
                      <TableCell className="text-center font-bold text-xs text-primary/70">{lesson.order}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-bold text-xs text-white block">{lesson.title}</span>
                          {lesson.description && (
                            <span className="text-[9px] text-[#bfb9ca] block truncate max-w-[220px]">
                              {lesson.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[#bfb9ca]">
                        {mod ? mod.title : 'Uncategorized'}
                      </TableCell>
                      <TableCell>
                        {isLocalUpload ? (
                          <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/30 px-1.5 py-0.5 uppercase tracking-widest font-bold inline-flex items-center gap-1">
                            <HardDrive className="w-2.5 h-2.5" /> SQLite Blob
                          </span>
                        ) : (
                          <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 uppercase tracking-widest font-bold inline-flex items-center gap-1">
                            <ExternalLink className="w-2.5 h-2.5" /> Web Stream
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-[10px] text-[#bfb9ca]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary/50" />
                          {lesson.duration || '10:00'}
                        </span>
                      </TableCell>
                      <TableCell className="text-[10px]">
                        {lesson.videoUrl ? (
                          <a 
                            href={lesson.videoUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-primary hover:underline inline-flex items-center gap-1 max-w-[140px] truncate"
                          >
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{lesson.videoUrl}</span>
                          </a>
                        ) : (
                          <span className="text-[#bfb9ca] text-[9px] italic">Stored locally in IndexedDB</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="w-7 h-7 text-primary/70 hover:text-green-400 rounded-none"
                            onClick={() => handlePlayVideo(lesson)}
                            title="Play Video"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="w-7 h-7 text-primary/50 hover:text-primary rounded-none"
                            onClick={() => handleOpenEdit(lesson)}
                            title="Edit Metadata"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="w-7 h-7 text-primary/50 hover:text-red-500 rounded-none"
                            onClick={() => handleDeleteLesson(lesson)}
                            title="Delete Lesson"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 4. Modal - Add / Edit Video Lesson */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0814] border border-primary/30 w-full max-w-xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-primary/20 pb-3">
              <div>
                <h3 className="text-base font-heading text-primary">
                  {editingLessonId ? 'Modify Mentorship Video Lesson' : 'Upload & Store Mentorship Video Lesson'}
                </h3>
                <p className="text-[9px] text-primary/50 uppercase">
                  Stored directly in SQLite local store with relational metadata
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowModal(false)}
                className="text-primary/60 hover:text-white rounded-none"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-4">
              {/* Module Selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-primary/60 uppercase font-bold">Curriculum Module / Chapter</label>
                <select
                  value={selectedModuleId}
                  onChange={e => setSelectedModuleId(e.target.value)}
                  className="w-full bg-[#050508] border border-primary/20 p-2 text-xs text-white rounded-none focus:border-primary focus:outline-none"
                >
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>
                      Modul #{m.order}: {m.title}
                    </option>
                  ))}
                  <option value="new">+ Create New Module Track...</option>
                </select>
              </div>

              {selectedModuleId === 'new' && (
                <div className="space-y-1.5 p-3 bg-primary/10 border border-primary/20">
                  <label className="text-[9px] text-primary uppercase font-bold">New Module Title</label>
                  <Input 
                    value={newModuleName}
                    onChange={e => setNewModuleName(e.target.value)}
                    placeholder="e.g., Napredne Tehnike & Trgovanje Uživo"
                    className="bg-transparent border-primary/30 rounded-none text-xs text-white"
                    required
                  />
                </div>
              )}

              {/* Title & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[9px] text-primary/60 uppercase font-bold">Lesson Title</label>
                  <Input 
                    value={lessonTitle}
                    onChange={e => setLessonTitle(e.target.value)}
                    placeholder="e.g., Prepoznavanje Institucionalnih Narudžbi"
                    className="bg-transparent border-primary/20 rounded-none text-xs text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] text-primary/60 uppercase font-bold">Duration</label>
                  <Input 
                    value={lessonDuration}
                    onChange={e => setLessonDuration(e.target.value)}
                    placeholder="15:30"
                    className="bg-transparent border-primary/20 rounded-none text-xs text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-primary/60 uppercase font-bold">Lesson Description / Key Takeaways</label>
                <textarea 
                  rows={3}
                  value={lessonDesc}
                  onChange={e => setLessonDesc(e.target.value)}
                  placeholder="Outline key setups, market conditions analyzed, and action items for students..."
                  className="w-full bg-[#050508] border border-primary/20 p-2.5 text-xs text-white rounded-none focus:border-primary focus:outline-none"
                />
              </div>

              {/* Video Link */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-primary/60 uppercase font-bold flex items-center justify-between">
                  <span>Video Link / Stream URL (YouTube, Vimeo, MP4 stream)</span>
                  <span className="text-[9px] text-primary/40 font-normal">Optional if uploading file</span>
                </label>
                <div className="relative">
                  <Input 
                    value={lessonLink}
                    onChange={e => setLessonLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://cdn.video.stream/..."
                    className="bg-transparent border-primary/20 rounded-none text-xs pl-8 text-white"
                  />
                  <Video className="w-3.5 h-3.5 text-primary/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* OR Local File Upload */}
              <div className="space-y-1.5 pt-1 border-t border-primary/10">
                <label className="text-[9px] text-primary/60 uppercase font-bold flex items-center justify-between">
                  <span>OR Upload Local Video Binary (Stored in SQLite & Local Blob Storage)</span>
                  {uploadFile && (
                    <span className="text-green-400 text-[9px]">
                      {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadFile.name}
                    </span>
                  )}
                </label>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-primary/30 hover:border-primary p-4 text-center cursor-pointer transition-colors bg-[#050508] flex items-center justify-center gap-3"
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleVideoFileSelect}
                    className="hidden" 
                  />
                  <FileVideo className="w-5 h-5 text-primary/60" />
                  <span className="text-xs text-white font-bold">
                    {uploadFile ? uploadFile.name : (existingBlobId ? 'Replace Existing Local Video File' : 'Click to Select MP4 / WebM File')}
                  </span>
                </div>
              </div>

              {/* Order index */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-primary/60 uppercase font-bold">Curriculum Sequence Order</label>
                <Input 
                  type="number"
                  min="1"
                  value={lessonOrder}
                  onChange={e => setLessonOrder(parseInt(e.target.value) || 1)}
                  className="bg-transparent border-primary/20 rounded-none text-xs text-white w-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-primary/20">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowModal(false)}
                  className="rounded-none text-xs text-primary/60"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-black hover:bg-primary/80 rounded-none text-xs font-bold uppercase tracking-wider px-6"
                >
                  {editingLessonId ? 'Commit Changes' : 'Store in SQLite'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal - Video Player Preview */}
      {activePlayLesson && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0814] border border-primary/40 w-full max-w-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-primary/20 pb-3">
              <div>
                <span className="text-[9px] text-primary/50 uppercase tracking-widest block">
                  Mentorship Video Stream Playback
                </span>
                <h3 className="text-base font-bold text-white">{activePlayLesson.title}</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClosePlayer}
                className="text-primary/60 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Video Canvas */}
            <div className="aspect-video bg-black flex items-center justify-center border border-primary/20 overflow-hidden">
              {activeBlobUrl ? (
                <video 
                  src={activeBlobUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain" 
                />
              ) : activePlayLesson.videoUrl ? (
                <iframe 
                  src={getEmbedUrl(activePlayLesson.videoUrl)} 
                  title={activePlayLesson.title} 
                  className="w-full h-full border-0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                />
              ) : (
                <div className="text-primary/40 text-xs">No playable video media stream configured.</div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="space-y-2 pt-2 text-xs">
              {activePlayLesson.description && (
                <p className="text-[11px] text-[#bfb9ca] bg-[#050508] p-3 border border-primary/10">
                  {activePlayLesson.description}
                </p>
              )}
              <div className="flex justify-between items-center text-[10px] text-primary/60 font-mono">
                <span>Duration: {activePlayLesson.duration}</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => copyLessonLink(activePlayLesson)} 
                    className="hover:text-primary underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Link
                  </button>
                  {activeBlobUrl && (
                    <a 
                      href={activeBlobUrl} 
                      download={activePlayLesson.videoFileName || `${activePlayLesson.title}.mp4`}
                      className="hover:text-primary underline flex items-center gap-1 text-green-400"
                    >
                      <Download className="w-3 h-3" /> Download MP4
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
