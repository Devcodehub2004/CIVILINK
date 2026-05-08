import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  const navigate = useNavigate();

  // Password strength
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    number: false,
  });

  useEffect(() => {
    setPasswordChecks({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
    });
  }, [newPassword]);

  const strengthScore = Object.values(passwordChecks).filter(Boolean).length;
  const strengthColor = strengthScore === 0 ? 'bg-outline/20' : strengthScore === 1 ? 'bg-red-500' : strengthScore === 2 ? 'bg-yellow-500' : 'bg-green-500';
  const strengthLabel = strengthScore === 0 ? '' : strengthScore === 1 ? 'Weak' : strengthScore === 2 ? 'Fair' : 'Strong';

  // Step 1: Send reset code
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setStep('reset');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.number) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      if (res.data.success) {
        setResetComplete(true);
        setSuccessMsg(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      if (res.data.success) {
        setSuccessMsg('A new reset code has been sent to your email.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Reset complete — show success state
  if (resetComplete) {
    return (
      <main className="min-h-[90vh] flex items-center justify-center px-6 py-24 md:py-32 max-w-[1440px] mx-auto overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md text-center space-y-10"
        >
          <div className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="material-symbols-outlined text-green-500 text-5xl"
            >
              check_circle
            </motion.span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black font-headline uppercase tracking-tight">Password Reset!</h2>
            <p className="text-outline font-body italic text-lg">
              Your password has been updated successfully. You can now log in with your new password.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-full px-10 py-4 font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-transform shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            Go to Login
          </Link>
        </motion.div>
      </main>
    );
  }

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
            <span className="label-sm uppercase tracking-[0.2em] text-outline">ACCOUNT RECOVERY</span>
            <h1 className="text-6xl xl:text-[5.5rem] leading-[0.9] font-black uppercase tracking-[-0.05em] font-headline relative">
              RESET<br/><span className="text-primary relative inline-block">ACCESS</span>
            </h1>
          </div>
          <p className="text-xl font-body italic text-outline leading-relaxed max-w-md relative z-10">
            "Don't worry — we'll send a secure code to your email so you can set a new password and get back to making civic impact."
          </p>
          <div className="flex items-center gap-6 relative z-10">
            <div className="h-[1px] w-24 bg-primary relative overflow-hidden">
              <div className="absolute top-0 h-full w-full bg-white/50 -skew-x-12 animate-shine"></div>
            </div>
            <span className="label-sm uppercase tracking-[0.2em]">SECURE RECOVERY</span>
          </div>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="bg-surface-container-low p-8 md:p-16 rounded-xl relative overflow-hidden border border-on-surface/5 shadow-2xl hover:shadow-3xl transition-shadow duration-500"
        >
          <section className="space-y-10 relative z-10" id="forgot-password-form">
            <div className="space-y-2">
              <span className="label-sm uppercase tracking-[0.2em] text-primary font-bold">Password Recovery</span>
              <h2 className="text-4xl font-black font-headline uppercase tracking-tight">
                {step === 'email' ? 'Forgot Password' : 'Set New Password'}
              </h2>
              <p className="text-sm text-outline/70 font-body italic">
                {step === 'email'
                  ? 'Enter your registered email to receive a reset code'
                  : `Enter the code sent to ${email} and your new password`
                }
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

            {step === 'email' ? (
              <form onSubmit={handleSendResetCode} className="space-y-8">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative space-y-2">
                  <label className="label-sm uppercase tracking-widest text-on-surface mb-2 block font-medium">Email Address</label>
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
                </motion.div>

                <div className="pt-4 relative overflow-hidden group rounded-full">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-primary text-on-primary rounded-full py-5 font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale relative z-10"
                  >
                    {loading ? 'Sending...' : 'SEND RESET CODE'}
                  </button>
                  <div className="absolute top-0 left-0 h-full w-full bg-white/20 -skew-x-12 hidden group-hover:block animate-shine z-20 pointer-events-none"></div>
                </div>
              </form>
            ) : (
              <motion.form
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleResetPassword}
                className="space-y-8"
              >
                {/* OTP Input */}
                <div className="relative space-y-2">
                  <label className="label-sm uppercase tracking-widest text-on-surface mb-2 block font-medium">Reset Code</label>
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

                {/* New Password */}
                <div className="relative space-y-2">
                  <label className="label-sm uppercase tracking-widest text-on-surface mb-2 block font-medium">New Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-0 bottom-4 text-xl opacity-40">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-transparent border-b border-on-surface py-4 pl-8 pr-10 focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline/40 font-medium"
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 bottom-4 text-outline/50 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>

                  {/* Password Strength */}
                  {newPassword.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pt-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-outline/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(strengthScore / 3) * 100}%` }}
                            className={`h-full rounded-full transition-colors ${strengthColor}`}
                          />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${strengthScore === 3 ? 'text-green-600' : strengthScore === 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {strengthLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1">
                        {[
                          { key: 'length', label: '8+ chars' },
                          { key: 'uppercase', label: 'Uppercase' },
                          { key: 'number', label: 'Number' },
                        ].map(({ key, label }) => (
                          <span key={key} className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${passwordChecks[key as keyof typeof passwordChecks] ? 'text-green-600' : 'text-outline/40'}`}>
                            <span className="material-symbols-outlined text-xs">
                              {passwordChecks[key as keyof typeof passwordChecks] ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            {label}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="relative space-y-2">
                  <label className="label-sm uppercase tracking-widest text-on-surface mb-2 block font-medium">Confirm New Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-0 bottom-4 text-xl opacity-40">lock_reset</span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-transparent border-b py-4 pl-8 pr-10 focus:ring-0 outline-none transition-all placeholder:text-outline/40 font-medium ${
                        confirmPassword.length > 0 && confirmPassword !== newPassword
                          ? 'border-red-400 focus:border-red-500'
                          : confirmPassword.length > 0 && confirmPassword === newPassword
                          ? 'border-green-400 focus:border-green-500'
                          : 'border-on-surface focus:border-primary'
                      }`}
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 bottom-4 text-outline/50 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                      Passwords do not match
                    </motion.p>
                  )}
                  {confirmPassword.length > 0 && confirmPassword === newPassword && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span> Passwords match
                    </motion.p>
                  )}
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-xs text-outline hover:text-primary transition-colors uppercase tracking-widest font-bold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-xs text-primary hover:text-primary/80 transition-colors uppercase tracking-widest font-bold disabled:opacity-40"
                  >
                    Resend Code
                  </button>
                </div>

                <div className="pt-2 relative overflow-hidden group rounded-full">
                  <button
                    disabled={loading || otp.length !== 6 || newPassword !== confirmPassword || !passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.number}
                    type="submit"
                    className="w-full bg-primary text-on-primary rounded-full py-5 font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale relative z-10"
                  >
                    {loading ? 'Resetting...' : 'RESET PASSWORD'}
                  </button>
                  <div className="absolute top-0 left-0 h-full w-full bg-white/20 -skew-x-12 hidden group-hover:block animate-shine z-20 pointer-events-none"></div>
                </div>
              </motion.form>
            )}

            <div className="text-center pt-8 border-t border-outline/20">
              <Link to="/login" className="label-sm uppercase tracking-widest text-outline hover:text-primary transition-colors group">
                Remember your password? <span className="font-bold border-b border-primary text-primary inline-flex items-center gap-1">Login <span className="material-symbols-outlined text-[10px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">arrow_forward</span></span>
              </Link>
            </div>
          </section>

          {/* Floating Editorial Element */}
          <div className="absolute -bottom-12 -right-12 opacity-[0.03] pointer-events-none animate-rotate-slow">
            <span className="material-symbols-outlined text-[18rem]">lock_reset</span>
          </div>
        </motion.div>

      </div>
    </main>
  );
};
