import React, { useState, useEffect, useRef } from 'react';
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  // Check for Google OAuth hash in URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        // Clear hash so it doesn't stay in the URL
        window.history.replaceState('', document.title, window.location.pathname + window.location.search);
        
        const processGoogleToken = async (token: string) => {
          setGoogleLoading(true);
          setError('');
          try {
            const res = await axios.post('/api/auth/google', {
              credential: token,
            });
            if (res.data.success) {
              login(res.data.data.user, res.data.data.accessToken);
              navigate('/dashboard');
            }
          } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed via Google');
          } finally {
            setGoogleLoading(false);
          }
        };
        
        processGoogleToken(accessToken);
      }
    }
  }, []);

  const triggerGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = window.location.origin + '/register'; // Must be added to Google Cloud Redirect URIs
    const scope = 'email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  };

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
    <main className="min-h-screen bg-surface-container flex flex-col items-center justify-center py-24 px-6 relative z-10 w-full overflow-hidden">
      {/* Decorative text watermark with slow rotation */}
      <div className="absolute top-0 right-0 pointer-events-none opacity-[0.03] overflow-hidden w-full h-full flex items-center justify-center z-[-1]">
        <span className="text-[20vw] font-black uppercase tracking-tighter font-headline whitespace-nowrap text-on-surface scale-150 rotate-[-10deg] animate-rotate-slow" style={{ animationDuration: '40s' }}>REGISTER</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-xl mx-auto space-y-12"
      >
        <div className="space-y-4">
          <span className="label-sm uppercase tracking-[0.2em] text-primary font-bold">New Citizen Registration</span>
          <h3 className="text-4xl md:text-5xl font-black font-headline uppercase tracking-tight">
            {step === 1 ? 'Join the Movement' : 'Confirm Registration'}
          </h3>
          <p className="font-body italic text-lg opacity-60">
            {step === 1 
              ? "Become a verified node in the civic network. Transparent. Accountable. Driven by you." 
              : `Enter the access code sent to ${formData.email}`}
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>[ ERROR ]: {error}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-green-500/10 text-green-500 font-bold uppercase tracking-widest border border-green-500/20 rounded-lg flex items-center gap-3 text-xs">
            <span className="material-symbols-outlined text-lg animate-scale-pulse">mark_email_read</span>
            {successMsg}
          </motion.div>
        )}

        {/* Google Sign-In - Only show on step 1 */}
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="space-y-4 flex flex-col items-center w-full">
              {/* Custom styled Google button */}
              <button
                type="button"
                disabled={googleLoading}
                onClick={triggerGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 rounded-full py-4 font-bold text-sm uppercase tracking-widest border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:scale-[1.02] active:scale-95 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:grayscale"
              >
                {googleLoading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Sign up with Google
                  </>
                )}
              </button>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-[1px] bg-on-surface/10"></div>
              <span className="label-sm uppercase tracking-[0.3em] text-outline/50 text-[10px] font-bold">or register with email</span>
              <div className="flex-1 h-[1px] bg-on-surface/10"></div>
            </div>
          </motion.div>
        )}

        <form onSubmit={step === 1 ? handleSendOtp : handleRegister} className="grid grid-cols-1 gap-8 bg-surface p-8 md:p-12 rounded-xl border border-on-surface/5 shadow-2xl relative">
          
          {/* Subtle pulse background logic for form */}
          <div className="absolute -inset-4 bg-primary/5 rounded-2xl -z-10 blur-2xl animate-pulse-ring opacity-50"></div>

          {step === 1 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Optional Photo */}
              <div className="flex flex-col items-center justify-center mb-4 gap-4">
                <label htmlFor="avatar-upload" className="relative w-24 h-24 rounded-full border-2 border-primary/20 bg-surface cursor-pointer group overflow-hidden transition-colors flex items-center justify-center shadow-lg hover:border-primary/50 hover:shadow-primary/20">
                  {formData.avatarUrl ? (
                    <>
                      <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-on-surface/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-3xl">edit</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-3xl opacity-40 text-primary group-hover:scale-110 transition-transform">add_a_photo</span>
                    </div>
                  )}
                </label>

                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-outline">Optional Profile Photo</span>
                  
                  {formData.avatarUrl && (
                    <div className="flex items-center gap-6 mt-1">
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, avatarUrl: '' }))}
                        className="text-xs font-bold uppercase tracking-widest text-error hover:text-error/80 flex items-center gap-1 transition-colors"
                      >
                         <span className="material-symbols-outlined text-sm">delete</span> Drop Image
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

              <div className="space-y-2 relative">
                <label className="label-sm uppercase tracking-widest text-on-surface">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-0 bottom-4 text-xl opacity-40">person</span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-transparent border-b border-on-surface py-4 pl-8 focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline/40 font-medium"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="label-sm uppercase tracking-widest text-on-surface">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-0 bottom-4 text-xl opacity-40">mail</span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent border-b border-on-surface py-4 pl-8 focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline/40 font-medium"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="label-sm uppercase tracking-widest text-on-surface">Phone <span className="opacity-40">(Optional)</span></label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-0 bottom-4 text-xl opacity-40">phone</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-transparent border-b border-on-surface py-4 pl-8 focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline/40 font-medium"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 relative">
              <label className="label-sm uppercase tracking-widest text-on-surface">Verify Token</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-transparent border-b border-on-surface py-4 focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline/40 font-mono tracking-[0.5em] text-center text-2xl"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setError(''); setSuccessMsg(''); }}
                className="text-xs text-outline hover:text-primary transition-colors mt-4 block uppercase tracking-widest font-bold text-center w-full"
              >
                ← Use a different email
              </button>
            </motion.div>
          )}

          <div className="pt-2 relative overflow-hidden group rounded-full">
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-primary text-on-primary rounded-full py-5 font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale relative z-10"
            >
              {loading ? 'Processing...' : (step === 1 ? "SEND VERIFICATION" : "CREATE ACCOUNT")}
            </button>
            <div className="absolute top-0 left-0 h-full w-full bg-white/20 -skew-x-12 hidden group-hover:block animate-shine z-20 pointer-events-none"></div>
          </div>
        </form>

        <div className="text-center pt-8">
           <Link to="/login" className="label-sm uppercase tracking-widest text-outline hover:text-primary transition-colors group">
             Already registered? <span className="font-bold border-b border-primary text-primary inline-flex items-center gap-1">Login <span className="material-symbols-outlined text-[10px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">arrow_forward</span></span>
           </Link>
        </div>
      </motion.div>
    </main>
  );
};
