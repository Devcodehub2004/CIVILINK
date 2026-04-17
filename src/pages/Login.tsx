import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
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
            setError(err.response?.data?.message || 'Google sign-in failed');
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
    const redirectUri = window.location.origin + '/login'; // Must be added to Google Cloud Redirect URIs
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
      const res = await axios.post('/api/auth/send-otp', { email });
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { email, otp });
      if (res.data.success) {
        login(res.data.data.user, res.data.data.accessToken);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[90vh] flex items-center justify-center px-6 py-24 md:py-32 max-w-[1440px] mx-auto overflow-hidden">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        
        {/* Branding/Visual Side (Asymmetric Editorial Style) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:block space-y-12 pr-8 relative"
        >
          {/* Animated decorative ring */}
          <div className="absolute -top-20 -left-10 w-48 h-48 border border-primary/20 rounded-full animate-pulse-ring pointer-events-none"></div>

          <div className="space-y-4 relative z-10">
            <span className="label-sm uppercase tracking-[0.2em] text-outline">JOIN THE MOVEMENT</span>
            <h1 className="text-6xl xl:text-[5.5rem] leading-[0.9] font-black uppercase tracking-[-0.05em] font-headline relative">
              CIVIC<br/><span className="text-primary relative inline-block">IMPACT</span>
            </h1>
          </div>
          <p className="text-xl font-body italic text-outline leading-relaxed max-w-md relative z-10">
            "Your voice has power. Report issues, rally the community, and let the viral spread naturally bring the government's attention."
          </p>
          <div className="flex items-center gap-6 relative z-10">
            <div className="h-[1px] w-24 bg-primary relative overflow-hidden">
                <div className="absolute top-0 h-full w-full bg-white/50 -skew-x-12 animate-shine"></div>
            </div>
            <span className="label-sm uppercase tracking-[0.2em]">EST. 2026</span>
          </div>
        </motion.div>

        {/* Auth Container */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="bg-surface-container-low p-8 md:p-16 rounded-xl relative overflow-hidden border border-on-surface/5 shadow-2xl hover:shadow-3xl transition-shadow duration-500"
        >
          <section className="space-y-12 relative z-10" id="login-form">
            <div className="space-y-2">
              <span className="label-sm uppercase tracking-[0.2em] text-primary font-bold">Authentication</span>
              <h2 className="text-4xl font-black font-headline uppercase tracking-tight relative inline-block">
                Login to CiviLink
              </h2>
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

            {/* Google Sign-In Button */}
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
                    Signing in...
                  </span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-[1px] bg-on-surface/10"></div>
              <span className="label-sm uppercase tracking-[0.3em] text-outline/50 text-[10px] font-bold">or continue with email</span>
              <div className="flex-1 h-[1px] bg-on-surface/10"></div>
            </div>

            <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp} className="space-y-8">
              <div className="space-y-6">
                {step === 1 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                    <label className="label-sm uppercase tracking-widest text-on-surface mb-2 block font-medium">Email Address</label>
                    <input 
                      type="email"
                      value={email}
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-on-surface py-4 focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline/40" 
                      placeholder="you@example.com" 
                    />
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                    <label className="label-sm uppercase tracking-widest text-on-surface mb-2 block font-medium">Verify Code</label>
                    <input 
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-transparent border-b border-on-surface py-4 focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline/40 font-mono tracking-[0.5em] text-center text-2xl" 
                      placeholder="••••••" 
                    />
                    <button
                      type="button"
                      onClick={() => { setStep(1); setOtp(''); setError(''); setSuccessMsg(''); }}
                      className="text-xs text-outline hover:text-primary transition-colors mt-4 block uppercase tracking-widest font-bold"
                    >
                      ← Use different email
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="pt-4 relative overflow-hidden group rounded-full">
                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full bg-primary text-on-primary rounded-full py-5 font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale relative z-10"
                >
                  {loading ? 'Processing...' : (step === 1 ? 'SEND VERIFICATION' : 'AUTHENTICATE')}
                </button>
                <div className="absolute top-0 left-0 h-full w-full bg-white/20 -skew-x-12 hidden group-hover:block animate-shine z-20 pointer-events-none"></div>
              </div>
            </form>

            <div className="text-center pt-8 border-t border-outline/20">
              <Link to="/register" className="label-sm uppercase tracking-widest text-outline hover:text-primary transition-colors group">
                Don't have an account? <span className="font-bold border-b border-primary text-primary inline-flex items-center gap-1">Register <span className="material-symbols-outlined text-[10px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">arrow_forward</span></span>
              </Link>
            </div>
          </section>
          
          {/* Floating Editorial Element */}
          <div className="absolute -bottom-12 -right-12 opacity-[0.03] pointer-events-none animate-rotate-slow">
            <span className="material-symbols-outlined text-[18rem]">gavel</span>
          </div>
        </motion.div>
        
      </div>
    </main>
  );
};
