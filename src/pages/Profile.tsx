import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export function getBadge(points: number) {
  if (points >= 100) return "🌟 Community Leader";
  if (points >= 50) return "🔥 Active Voice";
  if (points >= 10) return "✨ Verified Citizen";
  return "🌱 New Member";
}

export const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/users/${user.id}`);
        if (res.data.success) {
          setProfileData(res.data.data);
          setFormData({ name: res.data.data.name || '', phone: res.data.data.phone || '' });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchProfile();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let avatarUrl = profileData?.avatarUrl || '';

      // Upload avatar directly to Cloudinary from frontend
      if (avatarFile) {
        const uploadData = new FormData();
        uploadData.append('file', avatarFile);
        uploadData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: 'POST', body: uploadData }
        );
        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) {
          avatarUrl = cloudData.secure_url;
        }
      }

      if (removeAvatar) avatarUrl = '';

      const res = await axios.put(`/api/users/${user.id}`, {
        name: formData.name,
        phone: formData.phone || undefined,
        avatarUrl: avatarUrl || null,
        removeAvatar: removeAvatar,
      });
      if (res.data.success) {
        setProfileData(res.data.data);
        setIsEditing(false);
        setAvatarFile(null);
        setRemoveAvatar(false);
        window.location.reload(); 
      }
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-24">
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="label-sm text-outline">USER ACCOUNT</span>
          <h1 className="text-5xl font-bold uppercase tracking-tighter mt-2">My Profile</h1>
        </div>
      </div>

      <div className="bg-surface-container border border-on-surface/5 p-8 md:p-12 rounded-3xl relative overflow-hidden">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-8 mb-12 border-b border-on-surface/10 pb-12">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center overflow-hidden bg-surface shrink-0 shadow-2xl">
              {avatarFile ? (
                <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
              ) : profileData?.avatarUrl && !removeAvatar ? (
                <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover border-none" />
              ) : (
                <span className="text-6xl font-black uppercase text-on-surface opacity-50">{profileData?.name?.[0] || 'U'}</span>
              )}
            </div>
            {isEditing && (
              <div className="absolute -bottom-2 -right-2 flex gap-2">
                <label 
                  title="Upload new avatar"
                  className="w-10 h-10 bg-primary text-on-primary border-2 border-on-surface shadow-[2px_2px_0px_#000] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setAvatarFile(e.target.files[0]);
                      setRemoveAvatar(false);
                    }
                  }} />
                </label>
                {(profileData?.avatarUrl || avatarFile) && !removeAvatar && (
                  <button 
                    onClick={() => { setRemoveAvatar(true); setAvatarFile(null); }} 
                    title="Remove profile picture"
                    className="w-10 h-10 bg-surface text-on-surface border-2 border-on-surface shadow-[2px_2px_0px_#000] rounded-full flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform hover:bg-[#FF3B30] hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold tracking-tight uppercase">{profileData?.name}</h2>
            <p className="text-outline label-sm mt-1">{profileData?.email}</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1 rounded-full label-sm border border-primary/20">
                <span className="material-symbols-outlined text-sm">stars</span>
                {profileData?.points || 0} PTS
              </div>
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-1 rounded-full label-sm border border-secondary/20 font-bold uppercase tracking-wider">
                {getBadge(profileData?.points || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold uppercase tracking-widest">Personal Details</h3>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              title="Edit your profile information"
              className="text-primary hover:text-on-surface transition-colors label-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span> Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="label-sm text-outline block mb-2">FULL NAME</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-surface border border-on-surface/20 rounded-xl px-4 py-3 focus:border-primary outline-none transition-colors"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-sm text-outline block mb-2">PHONE NUMBER <span className="opacity-40">(Optional)</span></label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40">phone</span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-surface border border-on-surface/20 rounded-xl pl-12 pr-4 py-3 focus:border-primary outline-none transition-colors"
                  placeholder="+91 00000 00000"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="submit"
                className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Save Changes
              </button>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="border border-on-surface/20 hover:border-on-surface transition-colors px-8 py-3 rounded-full font-bold uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-surface p-6 rounded-2xl border border-on-surface/5">
              <span className="label-sm text-outline block mb-1">Role</span>
              <p className="font-bold text-lg uppercase">{profileData?.role}</p>
            </div>
            <div className="bg-surface p-6 rounded-2xl border border-on-surface/5">
              <span className="label-sm text-outline block mb-1">Email</span>
              <p className="font-bold text-lg">{profileData?.email}</p>
            </div>
            <div className="bg-surface p-6 rounded-2xl border border-on-surface/5">
              <span className="label-sm text-outline block mb-1">Phone Number</span>
              <p className="font-bold text-lg">{profileData?.phone || 'Not provided'}</p>
            </div>
            <div className="bg-surface p-6 rounded-2xl border border-on-surface/5">
              <span className="label-sm text-outline block mb-1">Member Since</span>
              <p className="font-bold text-lg">{new Date(profileData?.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
