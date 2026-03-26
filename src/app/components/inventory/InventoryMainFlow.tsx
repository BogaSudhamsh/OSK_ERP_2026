import React, { useState } from 'react';
import { EnhancedInventoryDashboard } from './EnhancedInventoryDashboard';
import { DealersListing } from './DealersListing';
import { DealerDetails } from './DealerDetails';
import { ProductDetailScreen } from './ProductDetailScreen';
import { ProductManagement } from './ProductManagement';
import { StockTracking } from './StockTracking';
import { StockAutoUpdate } from './StockAutoUpdate';
import { StockInward } from './StockInward';
import { InventoryLedger } from './InventoryLedger';
import { BillsDashboard } from './BillsDashboard';
import { CollapsibleNav } from './CollapsibleNav';

type ScreenType = 
  | 'dashboard'
  | 'dealers-listing'
  | 'dealer-details'
  | 'product-detail'
  | 'products'
  | 'stock-tracking'
  | 'stock-auto-update'
  | 'stock-inward'
  | 'inventory-ledger'
  | 'bills-dashboard';

interface ScreenState {
  screen: ScreenType;
  dealerId?: string;
  productId?: string;
  returnTo?: ScreenType;
}

export const InventoryMainFlow: React.FC = () => {
  const [screenState, setScreenState] = useState<ScreenState>({
    screen: 'dashboard',
  });
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const toggleSidebar = () => setSidebarExpanded(prev => !prev);

  const navigateTo = (screen: ScreenType) => {
    setScreenState({ screen });
  };

  const viewDealers = () => {
    setScreenState({ screen: 'dealers-listing' });
  };

  const selectDealer = (dealerId: string) => {
    setScreenState({
      screen: 'dealer-details',
      dealerId,
      returnTo: 'dealers-listing',
    });
  };

  const viewProductFromDealer = (productId: string) => {
    setScreenState(prev => ({
      screen: 'product-detail',
      productId,
      dealerId: prev.dealerId,
      returnTo: 'dealer-details',
    }));
  };

  const viewProductFromProducts = (productId: string) => {
    setScreenState({
      screen: 'product-detail',
      productId,
      returnTo: 'products',
    });
  };

  const goBack = () => {
    if (screenState.returnTo === 'dealer-details' && screenState.dealerId) {
      setScreenState({
        screen: 'dealer-details',
        dealerId: screenState.dealerId,
        returnTo: 'dealers-listing',
      });
    } else if (screenState.returnTo) {
      setScreenState({ screen: screenState.returnTo });
    } else {
      setScreenState({ screen: 'dashboard' });
    }
  };

  // Shared wrapper for screens that have the sidebar
  const withSidebarLayout = (screenName: string, content: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0] flex">
      <CollapsibleNav 
        currentScreen={screenName} 
        onNavigate={navigateTo} 
        onViewDealers={viewDealers}
        isExpanded={sidebarExpanded}
        onToggleExpanded={toggleSidebar}
      />
      <div
        className={`flex-1 min-w-0 transition-[margin] duration-300 ease-in-out mt-16 lg:mt-0 ${sidebarExpanded ? 'lg:ml-[256px]' : 'lg:ml-[80px]'}`}
      >
        <div className="container mx-auto px-4 py-6 lg:px-8">
          {content}
        </div>
      </div>
    </div>
  );

  // Render the appropriate screen
  switch (screenState.screen) {
    case 'dashboard':
      return withSidebarLayout('dashboard',
        <EnhancedInventoryDashboard
          onNavigate={navigateTo}
          onViewDealers={viewDealers}
        />
      );

    case 'dealers-listing':
      return withSidebarLayout('dealers-listing',
        <DealersListing 
          onSelectDealer={selectDealer} 
          onBack={() => setScreenState({ screen: 'dashboard' })}
        />
      );

    case 'dealer-details':
      if (!screenState.dealerId) {
        setScreenState({ screen: 'dealers-listing' });
        return null;
      }
      return withSidebarLayout('dealers-listing',
        <DealerDetails
          dealerId={screenState.dealerId}
          onBack={() => setScreenState({ screen: 'dealers-listing' })}
          onViewProduct={viewProductFromDealer}
        />
      );

    case 'product-detail':
      if (!screenState.productId) {
        goBack();
        return null;
      }
      return withSidebarLayout('products',
        <ProductDetailScreen productId={screenState.productId} onBack={goBack} />
      );

    case 'products':
      return withSidebarLayout('products',
        <ProductManagement />
      );

    case 'stock-tracking':
      return withSidebarLayout('stock-tracking',
        <StockTracking onBack={() => setScreenState({ screen: 'dashboard' })} />
      );

    case 'stock-auto-update':
      return withSidebarLayout('stock-auto-update',
        <StockAutoUpdate />
      );

    case 'stock-inward':
      return withSidebarLayout('stock-inward',
        <StockInward onBack={() => setScreenState({ screen: 'dashboard' })} />
      );

    case 'inventory-ledger':
      return withSidebarLayout('inventory-ledger',
        <InventoryLedger onBack={() => setScreenState({ screen: 'dashboard' })} />
      );

    case 'bills-dashboard':
      return withSidebarLayout('bills-dashboard',
        <BillsDashboard onBack={() => setScreenState({ screen: 'dashboard' })} />
      );

    default:
      return withSidebarLayout('dashboard',
        <EnhancedInventoryDashboard
          onNavigate={navigateTo}
          onViewDealers={viewDealers}
        />
      );
  }
};