import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export function getBadge(points: number) {
  if (points >= 100) return "🌟 Community Leader";
  if (points >= 50) return "🔥 Active Voice";
  if (points >= 10) return "✨ Verified Citizen";
  return "🌱 New Member";
}

export const Profile = () => {
  const { user, login } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [stats, setStats] = useState({ reports: 0, resolved: 0 });

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

  // Fetch user's issue stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`/api/users/${user.id}/issues`);
        if (res.data.success) {
          const issues = res.data.data || [];
          setStats({
            reports: issues.length,
            resolved: issues.filter((i: any) => i.status === 'RESOLVED').length,
          });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    if (user?.id) fetchStats();
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
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6]">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8F8F6]">

      {/* Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.04]"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      />

      {/* Page Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">

        {/* Header */}
        <div className="mb-12 md:mb-16">
          <span className="label-sm uppercase tracking-[0.2em] text-neutral-400 font-bold block mb-2">USER ACCOUNT</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight font-headline text-neutral-900">
            Civilian Identity
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
          
          {/* ───────────── LEFT: Animated Profile Card (matches design) ───────────── */}
          <div className="w-full lg:w-auto shrink-0 flex justify-center lg:justify-start">
            <div className="animate-float">
              <div
                className="shine-effect relative overflow-hidden"
                style={{
                  backgroundColor: '#EBEBEB',
                  borderRadius: '48px',
                  width: '320px',
                  padding: '40px 24px',
                  boxShadow: '0 40px 80px -20px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-10 relative z-10">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full border-[3px] border-[#FF4D00] p-1 animate-pulse-glow">
                      <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden">
                        {avatarFile ? (
                          <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                        ) : profileData?.avatarUrl && !removeAvatar ? (
                          <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            {profileData?.name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Small Badge */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FF4D00] rounded-full border-2 border-[#EBEBEB] flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    </div>
                  </div>
                  <h2
                    className="text-2xl font-bold tracking-tight text-neutral-900 uppercase text-center"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {profileData?.name || 'Citizen'}
                  </h2>
                  <p className="text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase mt-1">
                    CITIZEN
                  </p>
                </div>

                {/* Reputation Section */}
                <div className="bg-white rounded-[28px] p-5 mb-6 flex items-center justify-between shadow-sm relative z-10">
                  <span className="text-[9px] font-bold text-neutral-400 tracking-[0.1em] uppercase">REPUTATION</span>
                  <span
                    className="text-2xl font-bold text-[#FF4D00] tracking-tighter"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {profileData?.points || 0} PTS
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="flex gap-4 mb-8 relative z-10">
                  <div className="flex-1 bg-white rounded-3xl p-4 shadow-sm">
                    <span className="text-[9px] font-bold text-neutral-400 tracking-[0.1em] uppercase block mb-2">REPORTS</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {stats.reports}
                    </span>
                  </div>
                  <div className="flex-1 bg-white rounded-3xl p-4 shadow-sm">
                    <span className="text-[9px] font-bold text-neutral-400 tracking-[0.1em] uppercase block mb-2">RESOLVED</span>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {stats.resolved}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    login(null, '');
                    window.location.href = '/login';
                  }}
                  className="relative z-10 w-full font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: '#F2DED4',
                    color: '#FF4D00',
                    borderRadius: '20px',
                    padding: '12px',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#FF4D00';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#F2DED4';
                    e.currentTarget.style.color = '#FF4D00';
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  LOG OUT
                </button>
              </div>
            </div>
          </div>

          {/* ───────────── RIGHT: Profile Details & Editing ───────────── */}
          <div
            className="flex-1 relative overflow-hidden w-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(0,0,0,0.04)',
              borderRadius: '48px',
              padding: 'clamp(24px, 4vw, 48px)',
              boxShadow: '0 40px 80px -20px rgba(0,0,0,0.08)',
            }}
          >
            {/* Decorative background element */}
            <div className="absolute -bottom-16 -right-16 opacity-[0.02] pointer-events-none">
              <span className="material-symbols-outlined text-[20rem]">fingerprint</span>
            </div>

            <div className="flex justify-between items-center mb-10 relative z-10">
              <h3
                className="text-2xl md:text-3xl font-black uppercase tracking-tight"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Identity Settings
              </h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  title="Edit your profile information"
                  className="text-[#FF4D00] hover:text-neutral-900 transition-colors text-[10px] uppercase tracking-widest font-bold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">edit</span> Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-8 relative z-10">
                 {/* Avatar Upload in Edit Mode */}
                <div className="flex items-center gap-6 bg-[#F8F8F6] p-6 rounded-3xl border border-neutral-100 shadow-sm mb-6">
                  <div className="w-16 h-16 rounded-full border-2 border-[#FF4D00] flex items-center justify-center overflow-hidden bg-[#F8F8F6] shrink-0">
                    {avatarFile ? (
                      <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : profileData?.avatarUrl && !removeAvatar ? (
                      <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover border-none" />
                    ) : (
                      <span className="text-2xl font-black uppercase text-neutral-900">{profileData?.name?.[0] || 'U'}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Avatar Image</span>
                    <div className="flex gap-3">
                      <label
                        className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors"
                        style={{ backgroundColor: '#F2DED4', color: '#FF4D00' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FF4D00'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F2DED4'; e.currentTarget.style.color = '#FF4D00'; }}
                      >
                        Upload New
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setAvatarFile(e.target.files[0]);
                            setRemoveAvatar(false);
                          }
                        }} />
                      </label>
                      {(profileData?.avatarUrl || avatarFile) && !removeAvatar && (
                        <button 
                          type="button"
                          onClick={() => { setRemoveAvatar(true); setAvatarFile(null); }} 
                          className="text-[#FF3B30] bg-[#FF3B30]/10 hover:bg-[#FF3B30] hover:text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-2">Full Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40">person</span>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[#F8F8F6] border border-neutral-200 rounded-2xl pl-12 pr-4 py-4 focus:border-[#FF4D00] outline-none transition-colors font-medium text-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-2">Phone Number <span className="opacity-40">(Optional)</span></label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-40">phone</span>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-[#F8F8F6] border border-neutral-200 rounded-2xl pl-12 pr-4 py-4 focus:border-[#FF4D00] outline-none transition-colors font-medium text-lg"
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button 
                    type="submit"
                    className="text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-transform shadow-lg flex-1 md:flex-none"
                    style={{ backgroundColor: '#FF4D00', boxShadow: '0 10px 30px -5px rgba(255,77,0,0.3)' }}
                  >
                    Save Identity
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="border border-neutral-200 hover:border-neutral-400 bg-[#F8F8F6] transition-colors px-8 py-4 rounded-full font-bold uppercase tracking-widest flex-1 md:flex-none"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                <div className="bg-[#F8F8F6] p-7 rounded-[28px] border border-neutral-100 shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">mail</span> Registered Email
                  </span>
                  <p className="font-bold text-lg tracking-tight truncate text-neutral-900">{profileData?.email}</p>
                </div>
                <div className="bg-[#F8F8F6] p-7 rounded-[28px] border border-neutral-100 shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">phone_iphone</span> Phone Number
                  </span>
                  <p className="font-bold text-lg tracking-tight text-neutral-900">{profileData?.phone || 'Not provided'}</p>
                </div>
                <div className="bg-[#F8F8F6] p-7 rounded-[28px] border border-neutral-100 shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">social_leaderboard</span> Community Rank
                  </span>
                  <p className="font-bold text-lg tracking-tight uppercase text-[#FF4D00]">{getBadge(profileData?.points || 0)}</p>
                </div>
                <div className="bg-[#F8F8F6] p-7 rounded-[28px] border border-neutral-100 shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">calendar_clock</span> Access Granted
                  </span>
                  <p className="font-bold text-lg tracking-tight truncate text-neutral-900">
                    {new Date(profileData?.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
