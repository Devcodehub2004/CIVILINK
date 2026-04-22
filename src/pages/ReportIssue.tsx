import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  BarChart2, 
  Droplet, 
  Zap, 
  Trash2, 
  LayoutGrid, 
  MapPin, 
  Camera, 
  Send,
  Loader2,
  X,
  Edit2,
  Scan
} from 'lucide-react';
import { CameraCapture } from '../components/CameraCapture';

import { cn } from '../utils';

export const ReportIssue = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ROAD',
    address: '',
    latitude: 23.8103,
    longitude: 90.4125,
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleImageUpload = async (eOrFile: React.ChangeEvent<HTMLInputElement> | File) => {
    let file: File | undefined;
    
    if (eOrFile instanceof File) {
      file = eOrFile;
    } else {
      file = eOrFile.target.files?.[0];
    }

    if (!file) return;

    setUploading(true);
    setError('');

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: uploadData,
        }
      );
      const data = await response.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (err: any) {
      setError(`[ CLOUDINARY ERROR ]: ${err.message}`);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const categories = [
    { id: 'ROAD', label: 'ROADS', icon: BarChart2 },
    { id: 'WATER', label: 'WATER', icon: Droplet },
    { id: 'ELECTRICITY', label: 'POWER', icon: Zap },
    { id: 'SANITATION', label: 'WASTE', icon: Trash2 },
    { id: 'OTHER', label: 'MISC', icon: LayoutGrid }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/issues', formData);
      if (res.data.success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface relative isolate py-20 px-6">
      {/* Grain Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.04]"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      />

      <div className="max-w-4xl mx-auto animate-float">
        {/* Header */}
        <header className="mb-16">
          <span className="text-[10px] font-bold text-neutral-400 tracking-[0.3em] uppercase block">
            ACTION PORTAL // NEW REPORT
          </span>
          <h1 className="text-5xl md:text-7xl font-display leading-[0.85] mt-4 mb-6 tracking-tighter uppercase">
            REPORT<br />INCIDENT.
          </h1>
          <p className="text-neutral-500 italic text-lg max-w-lg leading-relaxed">
            "Documenting civic failure is the first step toward collaborative restoration."
          </p>
        </header>

        {error && (
          <div className="p-6 mb-12 bg-primary/10 text-primary text-sm font-mono font-bold uppercase tracking-widest border border-primary/20 rounded-xl">
            [ TRACE ERROR ]: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column: Inputs */}
          <div className="space-y-10">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase mb-4">
                INCIDENT TITLE
              </label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Burst Pipeline on 5th" 
                className="w-full bg-[#F3F3F3] border-1.5 border-transparent rounded-[24px] px-6 py-5 outline-none focus:border-primary focus:bg-white focus:shadow-[0_10px_20px_-5px_rgba(255,77,0,0.1)] transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase mb-4">
                DEEP DESCRIPTION
              </label>
              <textarea 
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe parameters of the issue..." 
                className="w-full bg-[#F3F3F3] border-1.5 border-transparent rounded-[24px] px-6 py-5 outline-none focus:border-primary focus:bg-white focus:shadow-[0_10px_20px_-5px_rgba(255,77,0,0.1)] transition-all font-medium min-h-[160px] resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase mb-4">
                PRECISE LOCATION
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Sector 4, Main Road..." 
                  className="w-full bg-[#F3F3F3] border-1.5 border-transparent rounded-[24px] px-6 py-5 pr-14 outline-none focus:border-primary focus:bg-white focus:shadow-[0_10px_20px_-5px_rgba(255,77,0,0.1)] transition-all font-medium"
                />
                <MapPin className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Right Column: Categories & Media */}
          <div className="space-y-10 flex flex-col">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase mb-4">
                SYSTEM CATEGORY
              </label>
              <div className="grid grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={cn(
                        "rounded-[16px] p-4 flex flex-col items-center gap-2 transition-all cursor-pointer group",
                        formData.category === cat.id
                          ? "bg-primary text-white shadow-[0_10px_20px_-5px_rgba(255,77,0,0.3)]"
                          : "bg-[#F3F3F3] hover:bg-[#EBEBEB] hover:-translate-y-0.5"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", formData.category === cat.id ? "text-white" : "text-on-surface")} />
                      <span className="text-[9px] font-bold tracking-widest uppercase">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase mb-4">
                MEDIA CAPTURE
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="flex items-center justify-center gap-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl py-4 transition-all group"
                >
                  <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">TAKE LIVE PHOTO</span>
                </button>
                <label
                  htmlFor="image-upload"
                  className="flex items-center justify-center gap-3 bg-[#F3F3F3] hover:bg-[#EBEBEB] text-[#777777] rounded-2xl py-4 cursor-pointer transition-all group"
                >
                  <Scan className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">BROWSE FILES</span>
                </label>
              </div>

              <div className="relative w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <div
                  className={cn(
                    "w-full aspect-[16/9] border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-3 transition-all overflow-hidden relative group",
                    formData.imageUrl 
                      ? "border-primary border-solid" 
                      : "border-[#D1D1D1] text-[#A3A3A3]"
                  )}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-[9px] font-black tracking-widest text-primary animate-pulse uppercase">TRANSMITTING IMAGE...</span>
                    </div>
                  ) : formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="text-white w-6 h-6" />
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, imageUrl: '' }));
                        }}
                        className="absolute top-4 right-4 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg z-20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-[#F3F3F3] flex items-center justify-center text-[#A3A3A3] group-hover:text-primary transition-colors">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-[9px] font-bold tracking-[0.2em] uppercase">EVIDENCE PREVIEW</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Camera Overlay */}
            {isCameraOpen && (
              <CameraCapture 
                onCapture={(file) => handleImageUpload(file)}
                onClose={() => setIsCameraOpen(false)}
              />
            )}

            <button 
              disabled={loading || uploading}
              className="mt-auto btn-submit shine-effect w-full bg-on-surface text-white rounded-[24px] py-5 font-bold uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] disabled:opacity-50 transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  TRANSMIT REPORT
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
