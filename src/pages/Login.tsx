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
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <span className="label-sm text-outline mb-4 block">IDENTIFICATION // 01</span>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-2 leading-none">
          {step === 1 ? 'Welcome Back' : 'Verify Portal'}
        </h1>
        <p className="font-body italic text-lg opacity-60 mb-12">
          {step === 1 
            ? "Reconnect to the civic governance network." 
            : `Enter the 6-digit access code sent to ${email}`}
        </p>

        {error && (
          <div className="p-6 mb-8 bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest border border-primary/20 rounded-xl flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">error</span>
              <span>[ ERROR ]: {error}</span>
            </div>
            {error.toLowerCase().includes('not found') && (
              <Link 
                to="/register" 
                className="bg-primary text-on-primary px-6 py-2 rounded-full text-center text-xs font-black hover:scale-105 transition-transform"
              >
                Create New Identity
              </Link>
            )}
          </div>
        )}

        {successMsg && (
          <div className="p-6 mb-8 bg-green-500/10 text-green-400 text-sm font-bold uppercase tracking-widest border border-green-500/20 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-xl">mark_email_read</span>
            {successMsg}
          </div>
        )}

        <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp} className="flex flex-col gap-6">
          {step === 1 ? (
            <div className="flex flex-col gap-2">
              <label className="label-sm text-outline ml-6">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-40">mail</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-8 py-5 bg-transparent border-2 border-on-surface rounded-full text-xl font-bold focus:bg-on-surface focus:text-surface transition-all outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="label-sm text-outline ml-6">Verify Code</label>
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
                  {step === 1 ? 'send' : 'verified_user'}
                </span>
                {step === 1 ? "Send Verification Code" : "Verify & Authenticate"}
              </>
            )}
          </button>
        </form>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-on-surface/10 pt-8">
           <p className="label-sm text-outline">No credentials found?</p>
           <Link to="/register" className="text-xl font-black uppercase tracking-tighter hover:text-primary transition-colors border-b-4 border-primary">
             Join the Movement
           </Link>
        </div>
      </motion.div>
    </div>
  );
};
