import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', avatarUrl: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await axios.post('/api/auth/send-otp', { email: formData.email });
      if (res.data.success) {
        setSuccessMsg('OTP sent! Check your email inbox.');
        setStep(2);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/register', { ...formData, otp });
      if (res.data.success) {
        login(res.data.data.user, res.data.data.accessToken);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <span className="label-sm text-outline mb-4 block">REGISTRATION // 01</span>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-2 leading-none">
          {step === 1 ? 'Join the Movement' : 'Confirm Registration'}
        </h1>
        <p className="font-body italic text-lg opacity-60 mb-12">
          {step === 1 
            ? "Become a verified node in the civic network." 
            : `Enter the access code sent to ${formData.email}`}
        </p>

        {error && (
          <div className="p-6 mb-8 bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest border border-primary/20 rounded-xl">
            [ ERROR ]: {error}
          </div>
        )}

        {successMsg && (
          <div className="p-6 mb-8 bg-green-500/10 text-green-400 text-sm font-bold uppercase tracking-widest border border-green-500/20 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-xl">mark_email_read</span>
            {successMsg}
          </div>
        )}

        <form onSubmit={step === 1 ? handleSendOtp : handleRegister} className="flex flex-col gap-6">
          {step === 1 ? (
            <>
              <div className="flex flex-col items-center justify-center mb-8 gap-4">
                <label htmlFor="avatar-upload" className="relative w-32 h-32 rounded-full border-4 border-on-surface bg-surface cursor-pointer group overflow-hidden hover:border-primary transition-colors flex items-center justify-center shadow-lg">
                  {formData.avatarUrl ? (
                    <>
                      <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-on-surface/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-3xl">edit</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-4xl opacity-40 group-hover:scale-110 transition-transform">add_a_photo</span>
                    </div>
                  )}
                </label>

                <div className="flex flex-col items-center gap-3">
                  <span className="label-sm text-outline tracking-widest bg-on-surface/5 px-3 py-1 rounded-full">[ OPTIONAL PROFILE PHOTO ]</span>
                  
                  {formData.avatarUrl && (
                    <div className="flex items-center gap-6 mt-1">
                      <label htmlFor="avatar-upload" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 cursor-pointer flex items-center gap-1 transition-colors">
                         <span className="material-symbols-outlined text-sm">edit</span> Edit
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, avatarUrl: '' }))}
                        className="text-xs font-bold uppercase tracking-widest text-error hover:text-error/80 flex items-center gap-1 transition-colors"
                      >
                         <span className="material-symbols-outlined text-sm">delete</span> Remove
                      </button>
                    </div>
                  )}
                </div>

                <input 
                  id="avatar-upload"
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const uploadData = new FormData();
                    uploadData.append('file', file);
                    uploadData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default');

                    try {
                      setLoading(true);
                      const response = await fetch(
                        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
                        { method: 'POST', body: uploadData }
                      );
                      const data = await response.json();
                      if (data.secure_url) {
                        setFormData(prev => ({ ...prev, avatarUrl: data.secure_url }));
                      }
                    } catch (err) {
                      setError('Avatar upload failed');
                    } finally {
                      setLoading(false);
                      if (e.target) e.target.value = '';
                    }
                  }} 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="label-sm text-outline ml-6">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-8 py-5 bg-transparent border-2 border-on-surface rounded-full text-xl font-bold focus:bg-on-surface focus:text-surface transition-all outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="label-sm text-outline ml-6">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-40">mail</span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-14 pr-8 py-5 bg-transparent border-2 border-on-surface rounded-full text-xl font-bold focus:bg-on-surface focus:text-surface transition-all outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="label-sm text-outline ml-6">Phone Number <span className="opacity-40">(Optional)</span></label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-40">phone</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-14 pr-8 py-5 bg-transparent border-2 border-on-surface rounded-full text-xl font-bold focus:bg-on-surface focus:text-surface transition-all outline-none"
                    placeholder="+91 00000 00000"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="label-sm text-outline ml-6">Verify Token</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-8 py-5 bg-on-surface text-surface rounded-full text-center text-4xl tracking-[1em] font-black focus:ring-4 focus:ring-primary/40 transition-all outline-none"
                placeholder="000000"
              />
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setError(''); setSuccessMsg(''); }}
                className="text-sm text-outline hover:text-primary transition-colors mt-2 ml-6 self-start"
              >
                ← Use a different email
              </button>
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-primary text-on-primary py-6 rounded-full font-bold uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-2xl">
                  {step === 1 ? 'person_add' : 'task_alt'}
                </span>
                {step === 1 ? "Send Verification Code" : "Verify & Complete"}
              </>
            )}
          </button>
        </form>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-on-surface/10 pt-8">
           <p className="label-sm text-outline">Already registered?</p>
           <Link to="/login" className="text-xl font-black uppercase tracking-tighter hover:text-primary transition-colors border-b-4 border-primary">
             Back to Access Portal
           </Link>
        </div>
      </motion.div>
    </div>
  );
};
