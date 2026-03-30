import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    { id: 'ROAD', label: 'Roads', icon: 'road' },
    { id: 'WATER', label: 'Water', icon: 'water_drop' },
    { id: 'ELECTRICITY', label: 'Power', icon: 'electric_bolt' },
    { id: 'SANITATION', label: 'Waste', icon: 'delete' },
    { id: 'OTHER', label: 'Misc', icon: 'category' }
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
    <div className="max-w-[1440px] mx-auto px-6 py-12 md:py-24 mb-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16">
          <span className="label-sm text-outline block mb-4">ACTION PORTAL // NEW REPORT</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
            Report<br/>Incident.
          </h1>
          <p className="font-body italic text-xl opacity-60 mt-6 md:w-2/3">
            "Documenting civic failure is the first step toward collaborative restoration."
          </p>
        </header>

        {error && (
          <div className="p-6 mb-12 bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest border border-primary/20 rounded-xl">
            [ TRACE ERROR ]: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Main Controls */}
          <div className="md:col-span-8 flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <label className="label-sm text-outline ml-6">Incident Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-8 py-5 bg-transparent border-2 border-on-surface rounded-full text-xl font-bold focus:bg-on-surface focus:text-surface transition-all outline-none"
                placeholder="e.g., Burst Pipeline on 5th"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="label-sm text-outline ml-6">Deep Description</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-8 py-6 bg-transparent border-2 border-on-surface rounded-[2.5rem] text-lg font-medium focus:bg-on-surface focus:text-surface transition-all outline-none resize-none"
                placeholder="Describe parameters of the issue..."
              />
            </div>

            <div className="flex flex-col gap-3">
               <label className="label-sm text-outline ml-6">Precise Location</label>
               <div className="relative group">
                 <input
                   type="text"
                   required
                   value={formData.address}
                   onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                   className="w-full px-8 py-5 bg-transparent border-2 border-on-surface rounded-full text-xl font-bold pr-16 focus:bg-on-surface focus:text-surface transition-all outline-none"
                   placeholder="Sector 4, Main Road..."
                 />
                 <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-primary text-2xl group-hover:scale-110 transition-transform">location_on</span>
               </div>
            </div>
          </div>

          {/* Configuration & Meta */}
          <div className="md:col-span-4 flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <label className="label-sm text-outline">System Category</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    title={`Select ${cat.label} category`}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 py-6 rounded-2xl border-2 transition-all group",
                      formData.category === cat.id 
                        ? "bg-primary border-primary text-on-primary" 
                        : "border-on-surface/10 hover:border-on-surface text-on-surface hover:bg-on-surface/5"
                    )}
                  >
                    <span className="material-symbols-outlined text-2xl mb-2">{cat.icon}</span>
                    <span className="label-sm">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="label-sm text-outline">Media Capture</label>
              <div className="relative aspect-square w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  title="Upload evidence photo"
                  className={cn(
                    "aspect-square w-full border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer overflow-hidden relative group",
                    formData.imageUrl ? "border-primary border-solid" : "border-on-surface/20 hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {uploading ? (
                    <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
                  ) : formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-on-surface/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-4xl">edit</span>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFormData(prev => ({ ...prev, imageUrl: '' }));
                        }}
                        title="Remove image"
                        className="absolute top-4 right-4 w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg z-20"
                      >
                        <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-5xl opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all">add_a_photo</span>
                      <span className="label-sm opacity-40 group-hover:opacity-100">Attach Evidence</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <button
              disabled={loading || uploading}
              title="Submit your civic report"
              className="mt-auto w-full bg-on-surface text-surface py-6 rounded-full font-bold uppercase tracking-[0.2em] hover:bg-primary hover:text-on-primary active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl">upload_file</span>
                  Transmit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
