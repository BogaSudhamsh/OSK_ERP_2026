import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Store, Shield, Lock, ChevronRight, Zap, Warehouse } from 'lucide-react';
import { motion } from 'motion/react';
import adminBadge from '@/assets/df57c585bbceadb945d76b823fdc0042e96dbf38.png';
import graniteTexture from '@/assets/c3e6582857fea39c6c1d69e827a0b241e0596d42.png';
import { SuperAdminLoginPage } from './SuperAdminLoginPage';
import { InventoryLoginPage } from './InventoryLoginPage';

interface RoleSelectorProps {
  onSelectRole: (role: string) => void;
  onSelectBranch?: (branchId: string) => void;
  onDirectLogin?: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelectRole, onSelectBranch, onDirectLogin }) => {
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const [showInventoryLogin, setShowInventoryLogin] = useState(false);

  const branches = [
    {
      id: 'aziz-nagar',
      name: 'Aziz Nagar',
      email: 'aziz@oskgranite.com',
      gradient: 'from-[#FFD700] to-[#B8860B]',
      shadow: 'shadow-[#FFD700]/20'
    },
    {
      id: 'sangareddy',
      name: 'Sangareddy',
      email: 'sangareddy@oskgranite.com',
      gradient: 'from-[#D4AF37] to-[#A07D1C]',
      shadow: 'shadow-[#D4AF37]/20'
    },
    {
      id: 'vikarabad',
      name: 'Vikarabad',
      email: 'vikarabad@oskgranite.com',
      gradient: 'from-[#DAA520] to-[#8B6914]',
      shadow: 'shadow-[#DAA520]/20'
    },
  ];

  const roles = [
    {
      id: 'inventory',
      title: 'Inventory Manager',
      description: 'Product catalog management, stock tracking, dealer management',
      icon: Warehouse,
      gradient: 'from-amber-500 to-orange-600',
      features: ['Product management', 'Stock tracking', 'Dealer network', 'Auto-stock updates'],
    },
  ];

  // If Super Admin full-page login is active, render it
  if (showSuperAdminLogin) {
    return (
      <SuperAdminLoginPage
        onBack={() => setShowSuperAdminLogin(false)}
        onLogin={(email, password) => onDirectLogin?.(email, password) ?? Promise.resolve({ success: false, error: 'Login handler not available' })}
      />
    );
  }

  // If Inventory Manager full-page login is active, render it
  if (showInventoryLogin) {
    return (
      <InventoryLoginPage
        onBack={() => setShowInventoryLogin(false)}
        onLogin={(email, password) => onDirectLogin?.(email, password) ?? Promise.resolve({ success: false, error: 'Login handler not available' })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-start lg:justify-center p-4 lg:p-6 py-8 relative overflow-x-hidden overflow-y-auto font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Granite Texture Background */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={graniteTexture} alt="" className="w-full h-full object-cover opacity-20" />
      </div>

      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent rounded-[100%] blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-radial-gradient from-[#B8860B]/15 to-transparent blur-3xl opacity-40" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light"></div>

      {/* Admin Badge - Top Right Corner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15, delay: 0.5 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="absolute top-6 right-6 md:top-10 md:right-10 z-50 group"
      >
        <div
          className="w-16 h-16 md:w-24 md:h-24 cursor-pointer relative"
          onClick={() => setShowSuperAdminLogin(true)}
        >
          <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
          <img
            src={adminBadge}
            alt="Admin Access"
            className="w-full h-full object-contain drop-shadow-2xl relative z-10 scale-150"
          />
        </div>
      </motion.div>

      <div className="max-w-7xl w-full relative z-10 flex flex-col items-center">

        {/* Main Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20 md:mb-24"
        >
          <div className="relative inline-block">
            <h1 className="font-serif font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#F3E5AB] via-[#D4AF37] to-[#8C7335] drop-shadow-sm pb-2 text-[36px] lg:text-[48px]">OSK GROUP</h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.8, duration: 1 }}
              className="h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent absolute bottom-0 left-0"
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[#D4AF37] text-lg md:text-xl font-medium tracking-[0.2em] uppercase mt-4 opacity-80"
          >
            Enterprise Management System
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-5 lg:mt-8 font-light tracking-wide text-[15px] lg:text-[17px] text-[#cbcbcb]"
          >
            Select your role to access the system
          </motion.p>

          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: 0.8, duration: 1 }}
            className="h-[1px] max-w-[700px] bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mt-5 lg:mt-6"
          />
        </motion.div>

        {/* Branch Portals Section */}
        <div className="w-full max-w-6xl mb-14 lg:mb-20 -mt-4 lg:-mt-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mb-6 lg:mb-10"
          >
            <h2 className="text-3xl font-serif text-[#D4AF37] mb-2">Branch Portals</h2>
            <div className="h-1 w-20 bg-[#D4AF37]/30 mx-auto rounded-full" />
            <p className="text-zinc-400 mt-3 text-sm tracking-wide">Select your branch to access administration, store, and stock modules</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 px-4">
            {branches.map((branch, index) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.8 + index * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <div
                  onClick={() => onSelectBranch?.(branch.id)}
                  className="relative h-[260px] lg:h-[320px] rounded-3xl cursor-pointer overflow-hidden backdrop-blur-md bg-[#1a1a1a] border border-white/10 hover:border-[#D4AF37]/40 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                >
                  {/* Gradient Glow on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${branch.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                  {/* Top Gradient Line */}
                  <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${branch.gradient} opacity-70`} />

                  <div className="h-full flex flex-col items-center justify-center p-6 lg:p-8 pt-8 lg:pt-10 pb-6 lg:pb-8 relative z-10">
                    {/* Subtle Background Glow Effect */}
                    <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-gradient-to-br ${branch.gradient} opacity-0 group-hover:opacity-[0.08] blur-[80px] transition-opacity duration-700 rounded-full pointer-events-none`} />

                    {/* Icon Container */}
                    <div className="relative mb-5 group-hover:-translate-y-1.5 transition-transform duration-500 ease-out">
                      <div className={`absolute -inset-3 rounded-3xl bg-gradient-to-br ${branch.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-600`} />
                      <div className="relative w-[76px] h-[76px] rounded-2xl border border-white/[0.06] p-[6px] bg-gradient-to-b from-white/[0.04] to-transparent">
                        <div className="w-full h-full rounded-xl bg-[#0d0d0d] border border-white/[0.08] flex items-center justify-center group-hover:border-[#D4AF37]/40 transition-all duration-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <div className={`absolute inset-[6px] bg-gradient-to-br ${branch.gradient} opacity-[0.06] rounded-xl`} />
                          <Store className="w-7 h-7 text-[#D4AF37] opacity-90 drop-shadow-[0_0_12px_rgba(212,175,55,0.25)]" />
                        </div>
                      </div>
                    </div>

                    {/* Branch Name */}
                    <h3 className="text-[22px] font-serif text-white/95 mb-1 tracking-[0.04em] group-hover:text-[#D4AF37] transition-colors duration-400 relative z-10">
                      {branch.name}
                    </h3>

                    {/* Branch Email Subtitle */}
                    <p className="text-zinc-600 text-[11px] tracking-wide mb-4 font-mono">
                      {branch.email}
                    </p>

                    {/* Decorative Separator */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`h-[1px] w-8 bg-gradient-to-r from-transparent ${branch.gradient.split(' ')[0]} opacity-40 group-hover:w-12 transition-all duration-500`} />
                      <div className={`w-1.5 h-1.5 rotate-45 bg-gradient-to-br ${branch.gradient} opacity-50 group-hover:opacity-80 transition-opacity duration-500`} />
                      <div className={`h-[1px] w-8 bg-gradient-to-l from-transparent ${branch.gradient.split(' ')[0]} opacity-40 group-hover:w-12 transition-all duration-500`} />
                    </div>

                    {/* Access Label + Arrow */}
                    <div className="flex items-center gap-3 group-hover:gap-4 transition-all duration-300">
                      <span className="text-zinc-500 text-[10px] uppercase tracking-[0.25em] group-hover:text-[#D4AF37]/70 transition-colors duration-300">
                        Enter Portal
                      </span>
                      <div className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] transition-all duration-300 bg-white/[0.02]">
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-black transition-colors duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Central Management / Inventory Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="w-full max-w-4xl px-4 mb-8"
        >
          <div className="text-center mb-6 lg:mb-10">
            <h2 className="text-3xl font-serif text-[#D4AF37] mb-2">Central Management</h2>
            <div className="h-1 w-20 bg-[#D4AF37]/30 mx-auto rounded-full" />
            <p className="text-zinc-400 mt-3 text-sm tracking-wide">Enterprise-wide inventory, stock tracking, and dealer operations</p>
          </div>

          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                whileHover={{ scale: 1.01 }}
                className="group relative rounded-3xl overflow-hidden bg-zinc-800/40 border border-white/5 hover:border-[#D4AF37]/20 transition-all duration-500 cursor-pointer"
                onClick={() => setShowInventoryLogin(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex flex-col md:flex-row items-center p-6 lg:p-8 md:p-10 gap-6 lg:gap-8 relative z-10">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shrink-0 shadow-lg shadow-orange-900/20">
                    <Icon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-zinc-100 mb-2">{role.title}</h3>
                    <p className="text-zinc-400 mb-4">{role.description}</p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      {role.features.map((feature, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-white/5 text-xs text-[#D4AF37] border border-[#D4AF37]/10 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button className="group/btn relative overflow-hidden bg-gradient-to-b from-[#E5C058] to-[#B8860B] hover:from-[#F3D57D] hover:to-[#CFA144] text-black font-semibold rounded-xl px-10 py-4 h-auto text-[17px] tracking-wide transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(212,175,55,0.4)] hover:shadow-[0_12px_25px_-8px_rgba(212,175,55,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] border border-[#FDEB9F]/40">
                      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10 flex items-center justify-center">
                        <Lock className="w-5 h-5 mr-2.5 opacity-90 group-hover/btn:opacity-100 transition-opacity" />
                        <span>Login</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Footer Content */}
        <div className="flex flex-col items-center gap-3 mt-10 lg:mt-16 mb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="text-[#D4AF37]/60 text-xs tracking-[0.2em] font-medium"
          >
            Powered by BRISTLETECH
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex items-center gap-2 text-zinc-600 text-sm"
          >
            <Shield className="w-4 h-4" />
            <span>Secure Enterprise Environment  Authorized Personnel Only</span>
          </motion.div>
        </div>

      </div>
    </div>
  );
};