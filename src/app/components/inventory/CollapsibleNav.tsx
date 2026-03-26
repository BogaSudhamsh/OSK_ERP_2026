import React from 'react';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Home, Zap, Building2, Package, TrendingUp, BarChart3, Menu, X, LogOut, Receipt, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CollapsibleNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onViewDealers: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const CollapsibleNav: React.FC<CollapsibleNavProps> = ({ 
  currentScreen, 
  onNavigate, 
  onViewDealers,
  isExpanded,
  onToggleExpanded,
}) => {
  const { logout, pendingBills } = useApp();
  // Count pending bills
  const pendingBillsCount = pendingBills.filter(b => b.status !== 'paid').length;

  const menuItems = [
    { name: 'Dashboard', icon: Home, screen: 'dashboard', onClick: () => onNavigate('dashboard') },
    { name: 'Stock Inward', icon: Truck, screen: 'stock-inward', onClick: () => onNavigate('stock-inward') },
    { name: 'Stock Auto-Update', icon: Zap, screen: 'stock-auto-update', onClick: () => onNavigate('stock-auto-update') },
    { name: 'View Dealers', icon: Building2, screen: 'dealers', onClick: onViewDealers },
    { name: 'Pending Bills', icon: Receipt, screen: 'bills-dashboard', onClick: () => onNavigate('bills-dashboard'), badge: pendingBillsCount },
    { name: 'Manage Products', icon: Package, screen: 'products', onClick: () => onNavigate('products') },
    { name: 'Stock Tracking', icon: TrendingUp, screen: 'stock-tracking', onClick: () => onNavigate('stock-tracking') },
    { name: 'View Reports', icon: BarChart3, screen: 'inventory-ledger', onClick: () => onNavigate('inventory-ledger') },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={onToggleExpanded}
          className="bg-gradient-to-br from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] shadow-lg w-12 h-12 p-0"
        >
          {isExpanded ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Desktop Collapsible Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 256 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex lg:flex-col bg-white border-r border-[#B8860B]/20 shadow-lg fixed left-0 top-0 h-screen z-40"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#B8860B] to-[#DAA520] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Package className="w-6 h-6 text-white" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="font-bold text-[#B8860B] text-lg whitespace-nowrap">OSK Group</h2>
                  <p className="text-xs text-[#6B6B6B] whitespace-nowrap">Inventory Portal</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="p-3 border-b border-[#B8860B]/10">
          <Button
            onClick={onToggleExpanded}
            variant="outline"
            className="w-full border-[#B8860B]/30 hover:bg-[#FFF8F0] hover:border-[#B8860B]"
          >
            <Menu className="w-5 h-5 text-[#B8860B]" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-2 text-[#B8860B]"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.screen || 
              (item.screen === 'dealers' && currentScreen === 'dealers-listing');
            
            return (
              <motion.button
                key={item.name}
                onClick={() => {
                  item.onClick();
                  if (window.innerWidth < 1024) onToggleExpanded();
                }}
                className={`
                  relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-lg' 
                    : 'text-[#6B6B6B] hover:bg-[#FFF8F0] hover:text-[#B8860B]'
                  }
                `}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`text-sm font-medium whitespace-nowrap ${
                        isActive ? 'text-white' : ''
                      }`}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge !== undefined && item.badge > 0 && (
                  <div className={`ml-auto w-6 h-6 ${isActive ? 'bg-white text-[#B8860B]' : 'bg-[#D4AF37] text-white'} text-xs flex items-center justify-center rounded-full font-bold`}>
                    {item.badge}
                  </div>
                )}
                {isActive && !isExpanded && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-0 w-1 h-8 bg-white rounded-l-full"
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-[#B8860B]/10">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full border-[#B8860B]/40 text-[#B8860B] hover:bg-[#FFF8F0] hover:border-[#B8860B] flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggleExpanded}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 w-64 h-screen bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Mobile Sidebar Header */}
              <div className="p-6 border-b border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#B8860B] to-[#DAA520] rounded-xl flex items-center justify-center shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#B8860B] text-lg">OSK Group</h2>
                    <p className="text-xs text-[#6B6B6B]">Inventory Portal</p>
                  </div>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.screen || 
                    (item.screen === 'dealers' && currentScreen === 'dealers-listing');
                  
                  return (
                    <motion.button
                      key={item.name}
                      onClick={() => {
                        item.onClick();
                        onToggleExpanded();
                      }}
                      className={`
                        relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                        ${isActive 
                          ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-lg' 
                          : 'text-[#6B6B6B] hover:bg-[#FFF8F0] hover:text-[#B8860B]'
                        }
                      `}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                      <span className={`text-sm font-medium flex-1 text-left ${isActive ? 'text-white' : ''}`}>
                        {item.name}
                      </span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <div className={`w-6 h-6 ${isActive ? 'bg-white text-[#B8860B]' : 'bg-[#D4AF37] text-white'} text-xs flex items-center justify-center rounded-full font-bold flex-shrink-0`}>
                          {item.badge}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="p-3 border-t border-[#B8860B]/10">
                <Button
                  onClick={logout}
                  variant="outline"
                  className="w-full border-[#B8860B]/40 text-[#B8860B] hover:bg-[#FFF8F0]"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="ml-2">Logout</span>
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};