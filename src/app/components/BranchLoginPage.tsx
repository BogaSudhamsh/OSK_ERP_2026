import React, { useState } from 'react';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Building2, ArrowLeft, Package, Store, Eye, EyeOff, LogIn, AlertCircle, ChevronRight, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import oskLogo from '@/assets/356d3a3460dadc43b90004f966e6aa635e39adc6.png';

interface BranchLoginPageProps {
  branchId: string;
  branchName: string;
  branchEmail: string;
  onBack: () => void;
  onDirectLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

type RoleType = 'branch-admin' | 'stock-manager' | 'store' | null;

export const BranchLoginPage: React.FC<BranchLoginPageProps> = ({
  branchId,
  branchName,
  branchEmail,
  onBack,
  onDirectLogin,
}) => {
  const stockEmail = branchEmail.replace('@', '-stock@');
  const storeEmail = branchEmail.replace('@', '-store@');

  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    {
      id: 'branch-admin' as RoleType,
      title: 'Branch Admin',
      description: 'Complete branch management',
      icon: ClipboardList,
      features: ['Sales Reports', 'Branch Analytics', 'Full Access'],
      defaultEmail: branchEmail,
      buttonLabel: 'Login as Branch',
    },
    {
      id: 'stock-manager' as RoleType,
      title: 'Stock Manager',
      description: 'Branch inventory control',
      icon: Package,
      features: ['Stock Levels', 'Inventory Tracking', 'Stock Reports', 'Reorder Alerts'],
      defaultEmail: stockEmail,
      buttonLabel: 'Login as Stock',
    },
    {
      id: 'store' as RoleType,
      title: 'Store',
      description: 'Customer & order management',
      icon: Store,
      features: ['Customer Management', 'Product Catalog', 'Order Processing', 'Purchase Orders'],
      defaultEmail: storeEmail,
      buttonLabel: 'Login as Store',
    },
  ];

  const handleRoleSelect = (roleId: RoleType) => {
    const role = roles.find(r => r.id === roleId);
    setSelectedRole(roleId);
    setEmail(role?.defaultEmail || '');
    setPassword('');
    setError('');
    setShowPassword(false);
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setError('');
  };

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
    const result = await onDirectLogin(email.trim(), password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please check your email and password.');
    }
    setIsLoading(false);
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  // ─── SPLIT-PAGE LOGIN FORM (when a role is selected) ───
  if (selectedRole && selectedRoleData) {
    return (
      <div className="min-h-screen bg-[#0c0a06] flex flex-col lg:flex-row relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/[0.04] rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#B8860B]/[0.03] rounded-full blur-[120px]" />
        </div>

        {/* LEFT BRANDING */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[500px] bg-gradient-to-b from-[#D4AF37]/[0.08] via-[#D4AF37]/[0.03] to-transparent rounded-full blur-[100px]" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center px-12 relative z-10"
          >
            <div className="relative mb-10">
              <div className="absolute -inset-6 bg-gradient-to-b from-[#D4AF37]/15 via-[#D4AF37]/5 to-transparent rounded-3xl blur-2xl" />
              <div className="relative w-[160px] h-[160px] rounded-[28px] border border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1708]/80 to-[#0f0d06]/80 backdrop-blur-sm flex items-center justify-center shadow-[0_0_60px_-10px_rgba(212,175,55,0.15)]">
                <img src={oskLogo} alt="OSK Granite" className="w-[120px] h-[120px] object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]" />
              </div>
            </div>
            <h1 className="font-serif text-[36px] tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#F3E5AB] via-[#D4AF37] to-[#8C7335] mb-3">
              OSK Granite
            </h1>
            <p className="text-[#D4AF37]/60 text-xs tracking-[0.2em] uppercase mb-6">Enterprise Management System</p>
            <div className="px-6 py-2.5 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5">
              <span className="text-[#D4AF37] text-sm tracking-wide">{branchName} &bull; {selectedRoleData.title}</span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT LOGIN FORM */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-[440px]"
          >
            {/* Mobile header */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="relative w-[100px] h-[100px] rounded-2xl border border-[#D4AF37]/20 bg-[#1a1708]/80 flex items-center justify-center mb-4">
                <img src={oskLogo} alt="OSK Granite" className="w-[72px] h-[72px] object-contain" />
              </div>
              <h1 className="font-serif text-2xl text-[#D4AF37] mb-1">OSK Granite</h1>
              <p className="text-[#C9A961]/50 text-xs">{branchName} &bull; {selectedRoleData.title}</p>
            </div>

            {/* Login Card */}
            <div className="rounded-2xl border border-[#D4AF37]/15 bg-[#151310]/80 backdrop-blur-xl shadow-[0_0_80px_-20px_rgba(212,175,55,0.08)] p-7 lg:p-9">
              {/* Back */}
              <button
                onClick={handleBackToRoles}
                className="flex items-center gap-2 text-[#D4AF37] hover:text-[#F3E5AB] transition-colors text-sm mb-8 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Roles
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
                <div className="space-y-2">
                  <Label htmlFor="branch-email" className="text-[#C9A961] text-sm" style={{ fontWeight: 500 }}>
                    Email Address
                  </Label>
                  <Input
                    id="branch-email"
                    type="email"
                    placeholder="user@oskgranite.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="h-12 bg-[#0d0b07] border-[#D4AF37]/15 text-[#E8D5A3] placeholder:text-[#C9A961]/30 focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 rounded-xl"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="branch-password" className="text-[#C9A961] text-sm" style={{ fontWeight: 500 }}>
                      Password
                    </Label>
                    <button type="button" className="text-[#D4AF37]/70 hover:text-[#D4AF37] text-xs transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="branch-password"
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

              <div className="mt-7 pt-5 border-t border-[#D4AF37]/8 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                <span className="text-xs text-[#C9A961]/70 tracking-wide">Mock Authentication Enabled</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── ROLE SELECTION PAGE (matching the design image) ───
  return (
    <div className="min-h-screen bg-[#0c0a06] flex flex-col items-center p-4 lg:p-6 pt-8 lg:pt-12 relative overflow-x-hidden overflow-y-auto">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#D4AF37]/[0.08] via-[#D4AF37]/[0.03] to-transparent rounded-[100%] blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[400px] bg-[#B8860B]/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[1100px] relative z-10 flex flex-col items-center">

        {/* ─── TOP BRANDING ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center mb-8 lg:mb-10"
        >
          {/* Logo */}
          <div className="relative mb-5">
            <div className="absolute -inset-5 bg-gradient-to-b from-[#D4AF37]/20 via-[#D4AF37]/8 to-transparent rounded-2xl blur-xl" />
            <div className="relative w-[80px] h-[80px] lg:w-[100px] lg:h-[100px] rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#1a1708] to-[#0f0d06] flex items-center justify-center shadow-[0_0_50px_-8px_rgba(212,175,55,0.25)]">
                <img src={oskLogo} alt="OSK Granite" className="w-[56px] h-[56px] lg:w-[72px] lg:h-[72px] object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.35)]" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif text-[30px] lg:text-[38px] tracking-wide text-[#D4AF37] mb-1.5">
            OSK Granite
          </h1>
          <p className="text-[#C9A961] text-[10px] lg:text-[11px] tracking-[0.25em] uppercase mb-6">
            Enterprise Management System
          </p>

          {/* Branch Pill */}
          <div className="px-10 py-3.5 rounded-xl border border-[#D4AF37]/25 bg-[#1a1708]/60">
            <h2 className="text-[#E8D5A3] text-[18px] lg:text-[20px] mb-0.5" style={{ fontWeight: 600 }}>{branchName}</h2>
            <p className="text-[#C9A961]/90 text-[13px]">Select your administrative role to continue</p>
          </div>
        </motion.div>

        {/* ─── BACK TO BRANCHES ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-[960px] mb-6"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#D4AF37] hover:text-[#F3E5AB] transition-colors text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Branches
          </button>
        </motion.div>

        {/* ─── ROLE CARDS ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-[960px] grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mb-12"
        >
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.08 }}
                className="group"
              >
                <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#151210] hover:border-[#D4AF37]/40 transition-all duration-400 p-6 lg:p-7 flex flex-col h-full">
                  {/* Icon */}
                  <div className="mb-5">
                    <div className="w-[56px] h-[56px] rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/[0.08] flex items-center justify-center group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/[0.12] transition-all duration-300">
                      <Icon className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-[#E8D5A3] text-[17px] lg:text-[19px] mb-1" style={{ fontWeight: 600 }}>
                    {role.title}
                  </h3>
                  <p className="text-[#D4AF37]/60 text-[13px] mb-5">
                    {role.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {role.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-[13px] text-[#E8D5A3]/80">
                        <div className="w-[6px] h-[6px] rounded-full bg-[#D4AF37] shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Login Button */}
                  <button
                    onClick={() => handleRoleSelect(role.id)}
                    className="w-full h-11 rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/[0.08] hover:bg-[#D4AF37]/[0.15] hover:border-[#D4AF37]/50 transition-all duration-300 flex items-center justify-center gap-2 text-[#D4AF37] text-[14px] tracking-wide group/btn"
                    style={{ fontWeight: 500 }}
                  >
                    {role.buttonLabel}
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── FOOTER ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-xs text-[#C9A961]/70 tracking-wide">Secure Firebase Authentication</span>
        </motion.div>

      </div>
    </div>
  );
};