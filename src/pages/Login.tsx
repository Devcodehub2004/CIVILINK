import React, { useState } from 'react';
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
  const { login } = useAuth();
  const navigate = useNavigate();

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
            <span className="label-sm uppercase tracking-[0.2em]">EST. 2024</span>
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
