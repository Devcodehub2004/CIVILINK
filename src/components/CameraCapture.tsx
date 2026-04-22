import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);

  const startCamera = async () => {
    setIsInitializing(true);
    setError('');
    try {
      const constraints = {
        video: { facingMode: 'environment' },
        audio: false,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera Access Error:', err);
      setError(
        err.name === 'NotAllowedError' 
          ? 'Camera access denied. Please enable permissions.' 
          : 'Could not access camera. Please ensure no other app is using it.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // Set canvas dimensions to match video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob then file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          onClose();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8 animate-share-pop">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl aspect-[3/4] md:aspect-video bg-[#1A1A1A] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase">
              LIVE FEED // SECURE_CAPTURE
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Preview */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {isInitializing && (
            <div className="flex flex-col items-center gap-4 text-white/40">
              <Loader2 className="w-10 h-10 animate-spin" />
              <span className="text-[10px] font-bold tracking-widest uppercase">INITIALIZING SENSORS...</span>
            </div>
          )}
          
          {error && (
            <div className="max-w-xs text-center flex flex-col items-center gap-4 px-6 text-white">
              <AlertCircle className="w-12 h-12 text-primary" />
              <p className="text-sm font-medium leading-relaxed opacity-80">{error}</p>
              <button 
                onClick={startCamera}
                className="mt-2 px-6 py-3 bg-primary rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <RefreshCw className="w-4 h-4" />
                RETRY CONNECTION
              </button>
            </div>
          )}

          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={cn(
              "w-full h-full object-cover transition-opacity duration-700",
              (isInitializing || error) ? "opacity-0" : "opacity-100"
            )}
          />
          
          {/* Snap Corners Overlay */}
          {!isInitializing && !error && (
            <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-2xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary -translate-x-1 -translate-y-1 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary translate-x-1 -translate-y-1 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary -translate-x-1 translate-y-1 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary translate-x-1 translate-y-1 rounded-br-lg" />
            </div>
          )}
        </div>

        {/* Footer / Controls */}
        <div className="p-8 bg-black flex justify-center items-center relative z-20">
          <button 
            disabled={isInitializing || !!error}
            onClick={handleCapture}
            className="group relative w-20 h-20 rounded-full flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
          >
            {/* Outer Ring */}
            <div className="absolute inset-0 border-4 border-white/20 rounded-full group-hover:border-primary/50 transition-colors" />
            {/* Inner Ring */}
            <div className="absolute inset-2 border-2 border-white/40 rounded-full group-hover:scale-90 transition-transform" />
            {/* Pulse Ring */}
            <div className="absolute inset-0 rounded-full bg-primary/20 scale-110 opacity-0 group-hover:opacity-100 animate-pulse" />
            {/* Capture Button */}
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-primary transition-colors">
              <Camera className="w-6 h-6 text-black group-hover:text-white transition-colors" />
            </div>
          </button>
          
          <div className="absolute right-8 text-[9px] font-bold text-white/30 tracking-[0.3em] uppercase hidden md:block">
            STITCHING_MODULE_V3.1
          </div>
        </div>

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
