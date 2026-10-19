import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { toast } from 'sonner';

export function MentorCamera() {
  const { user, profile, isMentor } = useAuth();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!user || (!isMentor && profile?.role !== 'admin')) return null;

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error('CAMERA ACCESS FAILED', { description: 'Please allow camera permissions.' });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Match canvas to video dimensions
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        // Compress image to save in datastore (Firebase Auth / Firestore)
        const imageDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7);
        setPreviewImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  const cancelPhoto = () => {
    setPreviewImage(null);
    startCamera();
  };

  const savePhoto = async () => {
    if (!previewImage) return;

    try {
      // Update Firebase Auth profile
      await updateProfile(user, { photoURL: previewImage });

      // Update Firestore user profile
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoUrl: previewImage });

      toast.success('PROFILE VERIFIED', { description: 'Biometric scan saved successfully.' });
      setPreviewImage(null);
    } catch (err) {
      console.error("Error saving photo:", err);
      toast.error('SAVE ERROR', { description: 'Could not upload biometric scan.' });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 border border-primary/20 bg-primary/5 p-4 rounded-none">
      <div className="text-[10px] font-mono text-primary/60 uppercase tracking-widest w-full border-b border-primary/10 pb-2 mb-2">
        Biometric Identification
      </div>
      
      {/* Profile Image Preview */}
      {!isCameraOpen && !previewImage && (
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Mentor" 
              className="w-32 h-32 object-cover border-2 border-primary grayscale hover:grayscale-0 transition-all duration-500"
            />
          ) : (
            <div className="w-32 h-32 bg-black/50 border border-primary/30 flex items-center justify-center">
              <Camera className="text-primary/30 w-8 h-8" />
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={startCamera}
            className="rounded-none border-primary/40 text-primary uppercase text-[10px] tracking-widest h-8"
          >
            <Camera className="w-4 h-4 mr-2" /> Update Image
          </Button>
        </div>
      )}

      {/* Active Camera View */}
      {isCameraOpen && (
        <div className="flex flex-col items-center w-full relative">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full max-w-sm h-64 bg-black object-cover border border-primary/50"
          ></video>
          
          {/* Overlay grid for targeting */}
          <div className="absolute inset-0 max-w-sm mx-auto pointer-events-none flex items-center justify-center p-4">
            <div className="w-32 h-32 border border-primary/30 relative">
               <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary" />
               <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary" />
               <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary" />
               <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary" />
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <Button 
              onClick={stopCamera} 
              variant="outline"
              className="rounded-none border-red-500/40 text-red-500 hover:bg-red-500/10 uppercase text-[10px] tracking-widest"
            >
              Cancel
            </Button>
            <Button 
              onClick={capturePhoto}
              className="rounded-none bg-primary text-black hover:bg-primary/90 uppercase text-[10px] tracking-widest font-black"
            >
              Capture
            </Button>
          </div>
        </div>
      )}

      {/* Captured Image Preview & Confirm */}
      {previewImage && (
        <div className="flex flex-col items-center w-full">
          <img 
            src={previewImage} 
            alt="Captured" 
            className="w-full max-w-sm h-64 object-cover border-2 border-primary grayscale"
          />
          <div className="flex gap-4 mt-4">
            <Button 
              onClick={cancelPhoto} 
              variant="outline"
              className="rounded-none border-primary/40 text-primary uppercase text-[10px] tracking-widest h-8"
            >
              <RefreshCw className="w-3 h-3 mr-2" /> Retake
            </Button>
            <Button 
              onClick={savePhoto}
              className="rounded-none bg-primary text-black hover:bg-primary/90 uppercase text-[10px] tracking-widest font-black h-8"
            >
              <Check className="w-4 h-4 mr-2" /> Confirm
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}
