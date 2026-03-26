import React, { useState } from 'react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { ArrowLeft, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import oskLogo from '@/assets/356d3a3460dadc43b90004f966e6aa635e39adc6.png';

interface SuperAdminLoginPageProps {
  onBack: () => void;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export const SuperAdminLoginPage: React.FC<SuperAdminLoginPageProps> = ({ onBack, onLogin }) => {
  const [email, setEmail] = useState('admin@oskgranite.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    const result = await onLogin(email.trim(), password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please check your email and password.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0c0a06] flex flex-col lg:flex-row relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#B8860B]/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* ─── LEFT BRANDING PANEL ─── */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative">
        {/* Subtle radial glow behind logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-gradient-to-b from-[#D4AF37]/[0.08] via-[#D4AF37]/[0.03] to-transparent rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center px-12 relative z-10"
        >
          {/* Logo with glow container */}
          <div className="relative mb-10">
            {/* Outer glow ring */}
            <div className="absolute -inset-6 bg-gradient-to-b from-[#D4AF37]/15 via-[#D4AF37]/5 to-transparent rounded-3xl blur-2xl" />
            {/* Inner bordered container */}
            <div className="relative w-[160px] h-[160px] rounded-[28px] border border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1708]/80 to-[#0f0d06]/80 backdrop-blur-sm flex items-center justify-center shadow-[0_0_60px_-10px_rgba(212,175,55,0.15)]">
              <img
                src={oskLogo}
                alt="OSK Granite"
                className="w-[120px] h-[120px] object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif text-[36px] tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#F3E5AB] via-[#D4AF37] to-[#8C7335] mb-6">
            OSK Granite
          </h1>

          {/* Description */}
          <p className="text-[#C9A961] text-[15px] leading-relaxed max-w-[340px]">
            Enterprise Resource Planning & Management System. Streamlining operations with precision and reliability.
          </p>
        </motion.div>
      </div>

      {/* ─── RIGHT LOGIN PANEL ─── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-[440px]"
        >
          {/* Mobile logo (shown only on small screens) */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="relative w-[100px] h-[100px] rounded-2xl border border-[#D4AF37]/20 bg-[#1a1708]/80 flex items-center justify-center mb-4">
              <img src={oskLogo} alt="OSK Granite" className="w-[72px] h-[72px] object-contain" />
            </div>
            <h1 className="font-serif text-2xl text-[#D4AF37] mb-1">OSK Granite</h1>
            <p className="text-[#C9A961] text-xs text-center">Enterprise Resource Planning & Management System</p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#151310]/80 backdrop-blur-xl shadow-[0_0_80px_-20px_rgba(212,175,55,0.08)] p-7 lg:p-9">
            {/* Back Link */}
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#D4AF37] hover:text-[#F3E5AB] transition-colors text-sm mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Selection
            </button>

            {/* Welcome */}
            <div className="mb-8">
              <h2 className="text-[#E8D5A3] text-[22px] mb-1.5 tracking-tight" style={{ fontWeight: 600 }}>
                Welcome back
              </h2>
              <p className="text-[#C9A961] text-sm">Please enter your details to sign in.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="sa-email" className="text-[#C9A961] text-sm" style={{ fontWeight: 500 }}>
                  Email Address
                </Label>
                <Input
                  id="sa-email"
                  type="email"
                  placeholder="admin@oskgranite.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="h-12 bg-[#0d0b07] border-[#D4AF37]/15 text-[#E8D5A3] placeholder:text-[#C9A961]/30 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 rounded-xl"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sa-password" className="text-[#C9A961] text-sm" style={{ fontWeight: 500 }}>
                    Password
                  </Label>
                  <button type="button" className="text-[#D4AF37]/70 hover:text-[#D4AF37] text-xs transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="sa-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="h-12 bg-[#0d0b07] border-[#D4AF37]/15 text-[#E8D5A3] placeholder:text-[#C9A961]/30 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C9A961]/70 hover:text-[#C9A961] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2.5 p-3 bg-orange-500/8 border border-orange-500/20 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 text-orange-400 shrink-0" />
                    <span className="text-sm text-orange-300/90">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C5A030] to-[#B8960B] hover:from-[#C5A030] hover:via-[#B8960B] hover:to-[#A07D1C] text-black font-semibold text-[15px] transition-all duration-300 shadow-[0_4px_24px_-4px_rgba(212,175,55,0.3)] hover:shadow-[0_4px_30px_-4px_rgba(212,175,55,0.45)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-[18px] h-[18px]" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-7 pt-5 border-t border-[#D4AF37]/8 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
              <span className="text-xs text-[#C9A961]/70 tracking-wide">Mock Authentication Enabled</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};