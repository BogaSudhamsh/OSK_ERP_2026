import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { AppProvider, useApp } from '@/app/context/AppContext';
import { LoginPage } from '@/app/components/LoginPage';
import { Layout } from '@/app/components/Layout';
import { Toaster } from '@/app/components/ui/sonner';
import { RoleSelector } from '@/app/components/RoleSelector';
import { BranchLoginPage } from '@/app/components/BranchLoginPage';

// Store Role Components
import { CustomerManagement } from '@/app/components/store/CustomerManagement';
import { ProductCatalog } from '@/app/components/store/ProductCatalog';
import { ShoppingCart } from '@/app/components/store/ShoppingCart';
import { StoreDashboard } from '@/app/components/store/StoreDashboard';
import { NewOrder } from '@/app/components/store/NewOrder';
import { OrderWorkflow } from '@/app/components/store/OrderWorkflow';
import { CustomerDetail } from '@/app/components/store/CustomerDetail';
import { TextureApplyGenerator } from '@/app/components/store/TextureApplyGenerator';

// Inventory Role Components
import { ProductManagement } from '@/app/components/inventory/ProductManagement';
import { StockTracking } from '@/app/components/inventory/StockTracking';
import { DealerManagement } from '@/app/components/inventory/DealerManagement';
import { InventoryDashboard } from '@/app/components/inventory/InventoryDashboard';
import { InventoryMainFlow } from '@/app/components/inventory/InventoryMainFlow';
import { AddStock } from '@/app/components/inventory/AddStock';
import { IncomingOrders } from '@/app/components/inventory/IncomingOrders';
import { TransportInvoice } from '@/app/components/inventory/TransportInvoice';
import { InventoryLedger } from '@/app/components/inventory/InventoryLedger';

// ERP Components (NEW)
import { ERPMainFlow } from '@/app/components/erp/ERPMainFlow';

import { Users, Package, ShoppingCart as CartIcon, BarChart3, TrendingUp, Warehouse, PhoneCall, Home, FileText, Wand2 } from 'lucide-react';

import oskLogo from '@/assets/356d3a3460dadc43b90004f966e6aa635e39adc6.png';

// Error boundary to prevent blank screens
class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
          <div className="bg-[#1a1a2e] border border-[#D4AF37]/30 rounded-xl p-8 max-w-lg text-center">
            <h2 className="text-[#D4AF37] text-xl mb-4">Something went wrong</h2>
            <p className="text-gray-400 mb-6 text-sm">{this.state.error?.message}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="px-6 py-2 bg-[#D4AF37] text-black rounded-lg hover:bg-[#c4a030] transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const StorePortal: React.FC = () => {
  const { cart, currentUser } = useApp();
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedOrderCustomerId, setSelectedOrderCustomerId] = useState<string | null>(null);

  const navigation = [
    { name: 'Dashboard', icon: Home, onClick: () => setCurrentPage('Dashboard') },
    { name: 'New Order', icon: FileText, onClick: () => setCurrentPage('New Order') },
    { name: 'Customers', icon: Users, onClick: () => setCurrentPage('Customers') },
    { name: 'Products', icon: Package, onClick: () => setCurrentPage('Products') },
    { name: 'AI Visualizer', icon: Wand2, onClick: () => setCurrentPage('AI Visualizer') },
    { name: 'Cart', icon: CartIcon, onClick: () => setCurrentPage('Cart'), badge: cart.length },
  ];

  const handleViewCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentPage('Customer Detail');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return (
          <StoreDashboard
            onNavigate={(page) => setCurrentPage(page)}
            branchId={currentUser?.branchId}
            branchLocation={currentUser?.branchLocation}
          />
        );
      case 'New Order':
        return (
          <OrderWorkflow
            onBack={() => setCurrentPage('Dashboard')}
            onNavigate={(page) => setCurrentPage(page)}
            selectedOrderCustomerId={selectedOrderCustomerId}
            onSelectOrderCustomer={setSelectedOrderCustomerId}
          />
        );
      case 'Customers':
        return <CustomerManagement onViewCustomer={handleViewCustomer} />;
      case 'Customer Detail':
        return <CustomerDetail customerId={selectedCustomerId} onBack={() => setCurrentPage('Customers')} />;
      case 'Products':
        return <ProductCatalog />;
      case 'AI Visualizer':
        return <TextureApplyGenerator />;
      case 'Cart':
        return (
          <ShoppingCart
            onNavigate={(page) => setCurrentPage(page)}
            selectedOrderCustomerId={selectedOrderCustomerId}
          />
        );
      default:
        return (
          <StoreDashboard
            onNavigate={(page) => setCurrentPage(page)}
            branchId={currentUser?.branchId}
            branchLocation={currentUser?.branchLocation}
          />
        );
    }
  };

  return (
    <Layout navigation={navigation} currentPage={currentPage === 'Customer Detail' ? 'Customers' : currentPage}>
      {renderPage()}
    </Layout>
  );
};

const InventoryPortal: React.FC = () => {
  // Use the new InventoryMainFlow which handles all navigation internally
  return <InventoryMainFlow />;
};

const ERPPortal: React.FC = () => {
  // Use the new ERPMainFlow which handles all navigation internally
  return <ERPMainFlow userId="super-admin-1" />;
};

const MainAppContent: React.FC = () => {
  const { currentUser, authLoading, login } = useApp();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<{ id: string; name: string; email: string } | null>(null);

  const branches = [
    { id: 'aziz-nagar', name: 'Aziz Nagar', email: 'aziz@oskgranite.com' },
    { id: 'sangareddy', name: 'Sangareddy', email: 'sangareddy@oskgranite.com' },
    { id: 'vikarabad', name: 'Vikarabad', email: 'vikarabad@oskgranite.com' },
  ];

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };

  const handleBranchSelect = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setSelectedBranch(branch);
    }
  };

  const handleDirectLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    return login(email, password);
  };

  const handleBackToBranches = () => {
    setSelectedBranch(null);
  };

  // Show auth loading screen while Firebase checks session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0c0a06] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-b from-[#D4AF37]/15 via-[#D4AF37]/5 to-transparent rounded-2xl blur-xl" />
          <div className="relative w-[80px] h-[80px] rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#1a1708] to-[#0f0d06] flex items-center justify-center">
            <img src={oskLogo} alt="OSK Granite" className="w-[56px] h-[56px] object-contain" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
          <p className="text-[#D4AF37]/60 text-sm tracking-wide">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Show role selector if no user is logged in
  if (!currentUser) {
    // If a branch is selected, show branch login page
    if (selectedBranch) {
      return (
        <BranchLoginPage
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
          branchEmail={selectedBranch.email}
          onBack={handleBackToBranches}
          onDirectLogin={handleDirectLogin}
        />
      );
    }

    // If a role is selected (non-branch), show login page
    if (selectedRole) {
      return <LoginPage />;
    }

    // Otherwise show role selector
    return (
      <RoleSelector
        onSelectRole={handleRoleSelect}
        onSelectBranch={handleBranchSelect}
        onDirectLogin={handleDirectLogin}
      />
    );
  }

  switch (currentUser.role) {
    case 'super-admin':
    case 'branch-admin':
    case 'stock-manager':
      return <ERPMainFlow userId={currentUser.id} />;
    case 'store-manager':
      return <StorePortal />;
    case 'store':
      return <StorePortal />;
    case 'inventory':
    case 'inventory-manager':
      return <InventoryPortal />;
    default:
      return <LoginPage />;
  }
};

// App root – AppProvider must wrap every consumer of useApp
export default function App() {
  return (
    <AppProvider>
      <AppErrorBoundary>
        <MainAppContent />
      </AppErrorBoundary>
      <Toaster position="top-right" richColors />
    </AppProvider>
  );
}