import React, { useState, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { useApp } from '@/app/context/AppContext';
import { 
  Home, 
  Package, 
  TrendingUp, 
  FileText, 
  Users, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Building2,
  Wallet,
  ArrowLeftRight,
  BookOpen,
  Boxes,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { StockInwardForm } from './StockInwardForm';
import { BranchDetailView } from './BranchDetailView';
import { BranchAdminDashboard } from './BranchAdminDashboard';
import { BranchInventory } from './BranchInventory';
import { VendorLedgerEnhanced } from './VendorLedgerEnhanced';
import { DealerBillPayments } from './DealerBillPayments';
import { BranchPurchaseOrders } from './BranchPurchaseOrders';
import { BranchStockTransfer } from './BranchStockTransfer';
import { BranchComparisonReports } from './BranchComparisonReports';
import { DailyLedger } from './DailyLedger';
import { StoreDashboard } from '@/app/components/store/StoreDashboard';
import { CustomerManagement } from '@/app/components/store/CustomerManagement';
import { CustomerDetail } from '@/app/components/store/CustomerDetail';
import oskLogo from '@/assets/356d3a3460dadc43b90004f966e6aa635e39adc6.png';

type ERPScreen =
  | 'super-admin-dashboard'
  | 'branch-dashboard'
  | 'store-dashboard'
  | 'branch-inventory'
  | 'stock-inward'
  | 'stock-transfer'
  | 'dealer-bills'
  | 'purchase-orders'
  | 'branch-detail'
  | 'stock-alerts'
  | 'vendor-ledger'
  | 'branch-comparison'
  | 'daily-ledger'
  | 'customers'
  | 'customer-detail';

interface ERPMainFlowProps {
  userId: string;
}

const ROLE_LABEL: Record<string, string> = {
  'super-admin':   'Super Admin',
  'branch-admin':  'Branch Admin',
  'stock-manager': 'Stock Manager',
};

export const ERPMainFlow: React.FC<ERPMainFlowProps> = ({ userId }) => {
  const { logout, currentUser: contextCurrentUser } = useApp();

  // ── Resolve the current ERP user ────────────────────────────────────────
  const currentUser = contextCurrentUser;

  // Fallback if no users exist
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8860B] flex items-center justify-center">
            <Users className="w-10 h-10 text-[#0A0A0A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#E8D5A3] mb-2">No Users Found</h2>
          <p className="text-[#D4AF37]/60 mb-6">Please configure ERP users to continue</p>
          <Button
            onClick={logout}
            className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#B8860B] hover:to-[#D4AF37] text-[#0A0A0A] font-semibold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  const initialScreen: ERPScreen = currentUser.role === 'super-admin'
    ? 'super-admin-dashboard'
    : 'branch-dashboard';

  const [currentScreen, setCurrentScreen] = useState<ERPScreen>(initialScreen);
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (screen: string, branchId?: string) => {
    setCurrentScreen(screen as ERPScreen);
    if (branchId) setSelectedBranchId(branchId);
    setSidebarOpen(false);
  };

  // ── Navigation items per role ──────────────────────────────────────────────
  const menuItems: Array<{ name: string; icon: React.ElementType; screen: string }> = useMemo(() => {
    if (currentUser.role === 'super-admin') {
      return [
        { name: 'Dashboard',          icon: Home,        screen: 'super-admin-dashboard' },
        { name: 'Customers',          icon: Users,       screen: 'customers' },
        { name: 'Stock Inward',       icon: TrendingUp,  screen: 'stock-inward' },
        { name: 'Stock Transfer',     icon: ArrowLeftRight, screen: 'stock-transfer' },
        { name: 'Dealer Bills',       icon: Wallet,      screen: 'dealer-bills' },
        { name: 'Purchase Orders',    icon: FileText,    screen: 'purchase-orders' },
        { name: 'Dealer Ledger',      icon: Building2,   screen: 'vendor-ledger' },
        { name: 'Reports',            icon: BarChart3,   screen: 'branch-comparison' },
        { name: 'Daily Ledger',       icon: BookOpen,    screen: 'daily-ledger' },
      ];
    } else if (currentUser.role === 'stock-manager') {
      return [
        { name: 'Dashboard',        icon: Home,        screen: 'branch-dashboard' },
        { name: 'Inventory',        icon: Boxes,       screen: 'branch-inventory' },
        { name: 'Purchase Orders',  icon: FileText,    screen: 'purchase-orders' },
        { name: 'Stock Inward',     icon: TrendingUp,  screen: 'stock-inward' },
        { name: 'Stock Transfer',   icon: ArrowLeftRight, screen: 'stock-transfer' },
      ];
    } else {
      // Branch Admin
      return [
        { name: 'Dashboard',        icon: Home,        screen: 'branch-dashboard' },
        { name: 'Inventory',        icon: Boxes,       screen: 'branch-inventory' },
        { name: 'Store Dashboard',  icon: Package,     screen: 'store-dashboard' },
        { name: 'Customers',        icon: Users,       screen: 'customers' },
        { name: 'Purchase Orders',  icon: FileText,    screen: 'purchase-orders' },
        { name: 'Stock Inward',     icon: TrendingUp,  screen: 'stock-inward' },
        { name: 'Stock Transfer',   icon: ArrowLeftRight, screen: 'stock-transfer' },
        { name: 'Dealer Bills',     icon: Wallet,      screen: 'dealer-bills' },
        { name: 'Daily Ledger',     icon: BookOpen,    screen: 'daily-ledger' },
      ];
    }
  }, [currentUser.role]);

  // ── Screen Renderer ────────────────────────────────────────────────────────
  const renderScreen = () => {
    switch (currentScreen) {
      case 'super-admin-dashboard':
        return <SuperAdminDashboard onNavigate={handleNavigate} />;

      case 'branch-dashboard':
        return (
          <BranchAdminDashboard
            branchId={currentUser.branchId || 'branch-1'}
            branchLocation={currentUser.branchLocation || 'aziz-nagar'}
            onNavigate={handleNavigate}
            userRole={currentUser.role as 'super-admin' | 'branch-admin' | 'stock-manager'}
          />
        );

      case 'store-dashboard':
        return (
          <StoreDashboard
            onNavigate={(page: string) => { console.log('Store nav:', page); }}
            branchId={currentUser.branchId}
            branchLocation={currentUser.branchLocation}
          />
        );

      case 'branch-inventory':
        return (
          <BranchInventory
            branchId={currentUser.branchId || 'branch-1'}
            branchLocation={currentUser.branchLocation || 'aziz-nagar'}
            userRole={currentUser.role as 'super-admin' | 'branch-admin' | 'stock-manager'}
            onNavigate={handleNavigate}
          />
        );

      case 'stock-inward':
        return (
          <div className="w-full px-4 lg:px-6 py-6 lg:py-8">
            <StockInwardForm
              userRole={currentUser.role as 'super-admin' | 'branch-admin' | 'stock-manager'}
              currentBranchId={currentUser.branchId}
            />
          </div>
        );

      case 'stock-transfer':
        return (
          <BranchStockTransfer
            currentBranchId={currentUser.branchId || 'branch-1'}
            currentBranchLocation={currentUser.branchLocation || 'aziz-nagar'}
            userRole={currentUser.role as 'super-admin' | 'branch-admin' | 'stock-manager'}
          />
        );

      case 'dealer-bills':
        return (
          <div className="w-full px-4 lg:px-6 py-6 lg:py-8">
            <DealerBillPayments />
          </div>
        );

      case 'purchase-orders':
        return (
          <BranchPurchaseOrders
            branchId={currentUser.branchId || 'branch-1'}
            branchLocation={currentUser.branchLocation || 'aziz-nagar'}
            userRole={currentUser.role as 'super-admin' | 'branch-admin' | 'stock-manager'}
          />
        );

      case 'branch-detail':
        return selectedBranchId ? (
          <BranchDetailView
            branchId={selectedBranchId}
            onBack={() => setCurrentScreen('super-admin-dashboard')}
          />
        ) : (
          <div className="p-8">
            <p className="text-[#6B6B6B]">No branch selected</p>
            <Button onClick={() => setCurrentScreen('super-admin-dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        );

      case 'stock-alerts':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold">Stock Alerts</h1>
            <p className="text-gray-600 mt-2">This feature is coming soon...</p>
            <Button onClick={() => setCurrentScreen('super-admin-dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        );

      case 'branch-comparison':
        return <BranchComparisonReports onBack={() => setCurrentScreen('super-admin-dashboard')} />;

      case 'vendor-ledger':
        return <VendorLedgerEnhanced onBack={() => setCurrentScreen('super-admin-dashboard')} />;

      case 'daily-ledger':
        return (
          <div className="w-full px-4 lg:px-6 py-6 lg:py-8">
            <DailyLedger
              userRole={currentUser.role as 'super-admin' | 'branch-admin' | 'stock-manager'}
              currentBranchId={currentUser.branchId}
              currentBranchLocation={currentUser.branchLocation}
            />
          </div>
        );

      case 'customers':
        return (
          <CustomerManagement onViewCustomer={(customerId: string) => {
            setSelectedCustomerId(customerId);
            setCurrentScreen('customer-detail');
          }} />
        );

      case 'customer-detail':
        return (
          <CustomerDetail
            customerId={selectedCustomerId}
            onBack={() => setCurrentScreen('customers')}
          />
        );

      default:
        return <SuperAdminDashboard onNavigate={handleNavigate} />;
    }
  };

  // ── Sidebar Content (reusable) ─────────────────────────────────────────────
  const SidebarNav = () => (
    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
      {menuItems.map(item => {
        const Icon = item.icon;
        const isActive = currentScreen === item.screen || (item.screen === 'customers' && currentScreen === 'customer-detail');
        return (
          <motion.button
            key={item.name}
            onClick={() => handleNavigate(item.screen)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive
                ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-lg'
                : 'text-[#6B6B6B] hover:bg-[#FFF8F0] hover:text-[#B8860B]'
            }`}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
            <span className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
              {item.name}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0] flex">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-gradient-to-br from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] shadow-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-[#C9A961]/20 shadow-lg fixed left-0 top-0 h-screen z-40">
        {/* Logo */}
        <div className="p-6 border-b border-[#C9A961]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center">
              <img src={oskLogo} alt="OSK Granite" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-bold text-[#C9A961] text-lg">
                {currentUser.role === 'super-admin'
                  ? 'OSK Group'
                  : `OSK ${(currentUser.branchLocation || '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
              </h2>
              <p className="text-xs text-[#6B6B6B]">ERP & POS</p>
            </div>
          </div>
        </div>

        {/* User Info */}


        <SidebarNav />

        {/* Logout */}
        <div className="p-4 border-t border-[#B8860B]/10">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 w-64 h-screen bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Logo */}
              <div className="p-6 border-b border-[#C9A961]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 flex items-center justify-center">
                    <img src={oskLogo} alt="OSK Granite" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#C9A961] text-lg">
                      {currentUser.role === 'super-admin'
                        ? 'OSK Group'
                        : `OSK ${(currentUser.branchLocation || '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
                    </h2>
                    <p className="text-xs text-[#6B6B6B]">ERP & POS</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.screen || (item.screen === 'customers' && currentScreen === 'customer-detail');
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigate(item.screen)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-lg'
                          : 'text-[#6B6B6B] hover:bg-[#FFF8F0] hover:text-[#B8860B]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                      <span className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-[#B8860B]/10">
                <Button
                  onClick={logout}
                  variant="outline"
                  className="w-full border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {renderScreen()}
      </div>
    </div>
  );
};