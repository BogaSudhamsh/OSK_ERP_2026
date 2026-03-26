import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/app/components/ui/sheet';
import { Badge } from '@/app/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { motion, AnimatePresence } from 'motion/react';
import oskLogo from '@/assets/356d3a3460dadc43b90004f966e6aa635e39adc6.png';

interface LayoutProps {
  children: React.ReactNode;
  navigation: Array<{
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    badge?: number;
  }>;
  currentPage: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, navigation, currentPage }) => {
  const { currentUser, logout, getFilteredNotifications, markNotificationAsRead } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use branch-filtered notifications instead of raw global list
  const branchNotifications = getFilteredNotifications();
  const unreadNotifications = branchNotifications.filter(n => !n.read);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'store': return 'from-[#B8860B] to-[#DAA520]';
      case 'inventory': return 'from-[#8B6914] to-[#B8860B]';
      case 'sales': return 'from-[#8B6914] to-[#B8860B]';
      default: return 'from-[#B8860B] to-[#DAA520]';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F5F5F0]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#B8860B]/10 backdrop-blur-xl bg-white/80 shadow-sm">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-[#B8860B]/5">
                  <Menu className="h-5 w-5 text-[#B8860B]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 border-[#B8860B]/20">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation for the application</SheetDescription>
                </SheetHeader>
                <div className="p-6 border-b border-[#B8860B]/10 bg-gradient-to-br from-[#FFF8F0] to-white">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={oskLogo} alt="OSK" className="w-12 h-12" />
                    <div>
                      <h2 className="font-bold text-[#B8860B]">OSK Granite</h2>
                      <p className="text-sm text-[#6B6B6B] capitalize">{currentUser?.role} Portal</p>
                    </div>
                  </div>
                </div>
                <nav className="px-3 py-4">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        item.onClick();
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1.5 transition-all duration-200 ${
                        currentPage === item.name
                          ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-lg shadow-[#B8860B]/20'
                          : 'text-[#1A1A1A] hover:bg-[#FFF8F0]'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1 text-left font-medium">{item.name}</span>
                      {item.badge ? (
                        <Badge variant="destructive" className="ml-auto">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3">
              <img src={oskLogo} alt="OSK" className="w-10 h-10" />
              <div>
                <h1 className="font-bold text-[#B8860B]">OSK Granite</h1>
                <p className="text-xs text-[#6B6B6B] hidden sm:block capitalize">{currentUser?.role} Portal</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-[#B8860B]/5">
                  <Bell className="h-5 w-5 text-[#B8860B]" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#D4AF37] text-white text-[10px] rounded-full animate-pulse shadow-lg shadow-[#D4AF37]/50 px-1">
                      {unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 border-[#B8860B]/20 shadow-xl" align="end">
                <div className="p-4 border-b border-[#B8860B]/10 bg-gradient-to-br from-[#FFF8F0] to-white">
                  <h3 className="font-semibold text-[#B8860B]">Notifications</h3>
                  <p className="text-sm text-[#6B6B6B]">
                    {unreadNotifications.length} unread
                  </p>
                </div>
                <ScrollArea className="h-[400px]">
                  {branchNotifications.length === 0 ? (
                    <div className="p-8 text-center text-[#6B6B6B]">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30 text-[#B8860B]" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {branchNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => markNotificationAsRead(notification.id)}
                          className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-200 ${
                            notification.read
                              ? 'bg-[#F5F5F5] opacity-60'
                              : 'bg-[#FFF8F0] hover:bg-[#FFF0E0] border border-[#B8860B]/10'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${getNotificationColor(notification.type)}`}>
                              <Bell className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-[#1A1A1A]">{notification.title}</p>
                              <p className="text-sm text-[#6B6B6B] mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-xs text-[#B8860B]/60 mt-1">
                                {notification.createdAt.toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-[#B8860B] rounded-full mt-2 shadow-sm shadow-[#B8860B]/30"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <div className="hidden sm:flex items-center gap-3 ml-2 pl-3 border-l border-[#B8860B]/20">
              <div className="text-right">
                <p className="text-sm font-semibold text-[#1A1A1A]">{currentUser?.name}</p>
                <p className="text-xs text-[#B8860B] capitalize">{currentUser?.role}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getRoleColor(currentUser?.role || '')} flex items-center justify-center text-white font-bold shadow-lg`}>
                {currentUser?.name.charAt(0)}
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logout} 
              className="text-[#B8860B] hover:text-[#DAA520] hover:bg-[#B8860B]/5"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex border-t border-[#B8860B]/10 px-6 bg-gradient-to-r from-white via-[#FFF8F0]/30 to-white">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={item.onClick}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all duration-200 font-medium relative ${
                currentPage === item.name
                  ? 'border-[#B8860B] text-[#B8860B] bg-[#FFF8F0]/50'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#B8860B] hover:bg-[#FFF8F0]/30'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
              {item.badge ? (
                <Badge variant="destructive" className="ml-1 bg-[#D4AF37] hover:bg-[#B8860B]">
                  {item.badge}
                </Badge>
              ) : null}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 lg:p-6 min-w-0 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};