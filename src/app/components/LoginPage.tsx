import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useApp } from '@/app/context/AppContext';
import { Store, Package, TrendingUp, Shield } from 'lucide-react';
import oskLogo from '@/assets/356d3a3460dadc43b90004f966e6aa635e39adc6.png';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const accountHints = [
    { 
      role: 'Branch Admin - Aziz Nagar', 
      email: 'aziz@oskgranite.com', 
      icon: Shield, 
      gradient: 'from-[#B8860B] to-[#DAA520]',
      description: 'Branch Management'
    },
    { 
      role: 'Store', 
      email: 'aziz-store@oskgranite.com', 
      icon: Store, 
      gradient: 'from-[#B8860B] to-[#DAA520]',
      description: 'Customer & Orders'
    },
    { 
      role: 'Inventory', 
      email: 'inventory@oskgranite.com', 
      icon: Package, 
      gradient: 'from-[#DAA520] to-[#B8860B]',
      description: 'Stock Management'
    },
    { 
      role: 'Sales / Marketing', 
      email: 'sales@oskgranite.com', 
      icon: TrendingUp, 
      gradient: 'from-[#8B6914] to-[#B8860B]',
      description: 'Lead Generation'
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
    setIsLoading(false);
  };

  const handleAccountHint = (loginEmail: string) => {
    setEmail(loginEmail);
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A1A] via-[#2A1F1A] to-[#1A1A1A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-[#B8860B]/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-[#8B6914]/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl relative z-10"
      >
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#B8860B] to-[#DAA520] blur-2xl opacity-30 rounded-full"></div>
              <img 
                src={oskLogo} 
                alt="OSK Granite Logo" 
                className="w-40 h-40 relative z-10 drop-shadow-2xl"
              />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl font-bold bg-gradient-to-r from-[#DAA520] via-[#B8860B] to-[#DAA520] bg-clip-text text-transparent mb-3"
          >
            OSK Granite
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[#DAA520]/80 text-lg"
          >
            Enterprise Management System
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#1A1A1A]/90 to-[#2A1F1A]/90 backdrop-blur-xl shadow-2xl">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl text-white">Sign In</CardTitle>
                <CardDescription className="text-[#DAA520]/60">
                  Enter your credentials to access the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#DAA520]/90">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@oskgranite.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black/30 border-[#B8860B]/30 text-white placeholder:text-white/30 focus:border-[#DAA520] focus:ring-[#DAA520]/20 h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#DAA520]/90">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/30 border-[#B8860B]/30 text-white placeholder:text-white/30 focus:border-[#DAA520] focus:ring-[#DAA520]/20 h-11"
                      required
                    />
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2"
                    >
                      {error}
                    </motion.p>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white shadow-lg shadow-[#B8860B]/20 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Access */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#1A1A1A]/90 to-[#2A1F1A]/90 backdrop-blur-xl shadow-2xl">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl text-white">Account Hints</CardTitle>
                <CardDescription className="text-[#DAA520]/60">
                  Select an email to prefill, then enter your real password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountHints.map((item, index) => (
                  <motion.button
                    key={item.email}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    onClick={() => handleAccountHint(item.email)}
                    className="w-full group relative overflow-hidden"
                  >
                    <div className="relative flex items-center gap-4 p-5 rounded-xl border border-[#B8860B]/20 bg-gradient-to-br from-black/40 to-black/20 hover:from-black/60 hover:to-black/40 transition-all duration-300 group-hover:border-[#DAA520]/40 group-hover:shadow-lg group-hover:shadow-[#B8860B]/10">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-white mb-1">{item.role}</p>
                        <p className="text-xs text-[#DAA520]/70 mb-1">{item.description}</p>
                        <p className="text-sm text-[#DAA520]/50">{item.email}</p>
                      </div>
                      <div className="text-[#DAA520]/40 group-hover:text-[#DAA520] transition-colors group-hover:translate-x-1 transition-transform duration-300">
                        →
                      </div>
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-8 text-sm text-[#DAA520]/60 bg-black/20 backdrop-blur-sm border border-[#B8860B]/10 rounded-full px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#DAA520] rounded-full animate-pulse shadow-lg shadow-[#DAA520]/50"></div>
              <span>System Online</span>
            </div>
            <span className="text-[#B8860B]/40">•</span>
            <span>Firebase Authentication</span>
            <span className="text-[#B8860B]/40">•</span>
            <span>Live Account Login</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};