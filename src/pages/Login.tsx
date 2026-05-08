import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

type LoginMode = 'password' | 'otp';

export const Login = () => {
  const [mode, setMode] = useState<LoginMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Google OAuth hash handler
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        window.history.replaceState('', document.title, window.location.pathname + window.location.search);
        const processGoogleToken = async (token: string) => {
          setGoogleLoading(true);
          setError('');
          try {
            const res = await axios.post('/api/auth/google', { credential: token });
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
    const redirectUri = window.location.origin + '/login';
    const scope = 'email profile';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  };

  // Switch mode and reset state
  const switchMode = (newMode: LoginMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setOtp('');
    setPassword('');
    setOtpSent(false);
    setShowPassword(false);
  };

  // --- PASSWORD LOGIN ---
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { email, password });
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

  // --- OTP LOGIN: Send OTP ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await axios.post('/api/auth/send-otp', { email });
      if (res.data.success) {
        setSuccessMsg('OTP sent! Check your email inbox.');
        setOtpSent(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // --- OTP LOGIN: Verify OTP ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/otp-login', { email, otp });
      if (res.data.success) {
        login(res.data.data.user, res.data.data.accessToken);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // --- Resend OTP ---
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await axios.post('/api/auth/send-otp', { email });
      if (res.data.success) {
        setSuccessMsg('New OTP sent to your email.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[90vh] flex items-center justify-center px-6 py-24 md:py-32 max-w-[1440px] mx-auto overflow-hidden">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

        {/* Branding Side */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:block space-y-12 pr-8 relative"
        >
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
          <section className="space-y-10 relative z-10" id="login-form">
            <div className="space-y-2">
              <span className="label-sm uppercase tracking-[0.2em] text-primary font-bold">Authentication</span>
              <h2 className="text-4xl font-black font-headline uppercase tracking-tight">Login to CiviLink</h2>
            </div>

            {/* Status Messages */}
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

            {/* Google Sign-In */}
            <div className="space-y-4 flex flex-col items-center w-full">
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
              <span className="label-sm uppercase tracking-[0.3em] text-outline/50 text-[10px] font-bold">or continue with</span>
              <div className="flex-1 h-[1px] bg-on-surface/10"></div>
            </div>

            {/* Mode Tabs: Password / OTP */}
            <div className="flex rounded-full bg-surface-container-high p-1 gap-1">
              <button
                type="button"
                onClick={() => switchMode('password')}
                className={`flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  mode === 'password'
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                Password
              </button>
              <button
                type="button"
                onClick={() => switchMode('otp')}
                className={`flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  mode === 'otp'
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                Email OTP
              </button>
            </div>

            {/* ==================== PASSWORD MODE ==================== */}
            {mode === 'password' && (
              <motion.form
                key="password-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handlePasswordLogin}
                className="space-y-8"
              >
                {/* Email */}
                <div className="relative space-y-2">
                  <label className="label-sm uppercase tracking-widest text-on-surface block font-medium">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-0 bottom-4 text-xl opacity-40">mail</span>
                    <input
                      type="email"
                      value={email}
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-on-surface py-4 pl-8 focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline/40"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="relative space-y-2">
                  <label className="label-sm uppercase tracking-widest text-on-surface block font-medium">Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-0 bottom-4 text-xl opacity-40">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      required
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-b border-on-surface py-4 pl-8 pr-10 focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline/40"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 bottom-4 text-outline/50 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">help</span>
                    Forgot Password?
                  </Link>
                </div>

                <div className="relative overflow-hidden group rounded-full">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-primary text-on-primary rounded-full py-5 font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale relative z-10"
                  >
                    {loading ? 'Signing in...' : 'SIGN IN'}
                  </button>
                  <div className="absolute top-0 left-0 h-full w-full bg-white/20 -skew-x-12 hidden group-hover:block animate-shine z-20 pointer-events-none"></div>
                </div>
              </motion.form>
            )}

            {/* ==================== OTP MODE ==================== */}
            {mode === 'otp' && (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {!otpSent ? (
                  /* Step 1: Enter email to get OTP */
                  <form onSubmit={handleSendOtp} className="space-y-8">
                    <div className="relative space-y-2">
                      <label className="label-sm uppercase tracking-widest text-on-surface block font-medium">Email Address</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-0 bottom-4 text-xl opacity-40">mail</span>
                        <input
                          type="email"
                          value={email}
                          required
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-transparent border-b border-on-surface py-4 pl-8 focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline/40"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="relative overflow-hidden group rounded-full">
                      <button
                        disabled={loading}
                        type="submit"
                        className="w-full bg-primary text-on-primary rounded-full py-5 font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale relative z-10"
                      >
                        {loading ? 'Sending...' : 'SEND OTP'}
                      </button>
                      <div className="absolute top-0 left-0 h-full w-full bg-white/20 -skew-x-12 hidden group-hover:block animate-shine z-20 pointer-events-none"></div>
                    </div>
                  </form>
                ) : (
                  /* Step 2: Enter OTP */
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-3 p-4 bg-green-500/5 rounded-xl border border-green-500/10">
                      <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-green-500 text-lg">mark_email_read</span>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-outline/70">
                        Code sent to <span className="text-on-surface">{email}</span>
                      </p>
                    </div>

                    <div className="relative space-y-2">
                      <label className="label-sm uppercase tracking-widest text-on-surface block font-medium">Verification Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-transparent border-b border-on-surface py-4 focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline/40 font-mono tracking-[0.5em] text-center text-2xl"
                        placeholder="••••••"
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(''); setError(''); setSuccessMsg(''); }}
                        className="text-xs text-outline hover:text-primary transition-colors uppercase tracking-widest font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Change email
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-xs text-primary hover:text-primary/80 transition-colors uppercase tracking-widest font-bold disabled:opacity-40"
                      >
                        Resend Code
                      </button>
                    </div>

                    <div className="relative overflow-hidden group rounded-full">
                      <button
                        disabled={loading || otp.length !== 6}
                        type="submit"
                        className="w-full bg-primary text-on-primary rounded-full py-5 font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale relative z-10"
                      >
                        {loading ? 'Verifying...' : 'VERIFY & LOGIN'}
                      </button>
                      <div className="absolute top-0 left-0 h-full w-full bg-white/20 -skew-x-12 hidden group-hover:block animate-shine z-20 pointer-events-none"></div>
                    </div>
                  </motion.form>
                )}
              </motion.div>
            )}

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
