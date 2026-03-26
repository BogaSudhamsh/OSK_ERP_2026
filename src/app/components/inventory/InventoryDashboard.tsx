import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useApp } from '@/app/context/AppContext';
import { Package, AlertTriangle, ShoppingCart, Users, TrendingDown, TrendingUp, Box, DollarSign, Boxes } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '@/app/components/ui/badge';

interface InventoryDashboardProps {
  onNavigate: (page: string) => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ onNavigate }) => {
  const { products, orders, dealers } = useApp();

  // Calculate stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockProducts = products.filter(p => p.stock <= 10 && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const disabledProducts = products.filter(p => !p.enabled);
  const pendingOrders = orders.filter(o => o.status === 'pending');

  // Dealer-wise stock with enhanced information
  const dealerStock = dealers.map(dealer => {
    const dealerProducts = products.filter(p => p.dealerName === dealer.name);
    const totalItems = dealerProducts.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = dealerProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const lowStockCount = dealerProducts.filter(p => p.stock <= 10 && p.stock > 0).length;
    return { 
      dealer: dealer.name, 
      items: totalItems, 
      products: dealerProducts.length,
      totalValue,
      lowStockCount,
      dealerId: dealer.id
    };
  });

  const stats = [
    {
      title: 'Total Products',
      value: totalProducts.toString(),
      subtitle: `${products.filter(p => p.enabled).length} enabled`,
      icon: Package,
      color: 'from-[#8B6914] to-[#B8860B]',
      onClick: () => onNavigate('Products'),
    },
    {
      title: 'Current Stock',
      value: totalStock.toString(),
      subtitle: 'units available',
      icon: Boxes,
      color: 'from-[#DAA520] to-[#B8860B]',
      onClick: () => onNavigate('Products'),
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockProducts.length.toString(),
      subtitle: 'need restocking',
      icon: AlertTriangle,
      color: 'from-[#FF8C00] to-[#FFA500]',
      onClick: () => onNavigate('Products'),
      alert: lowStockProducts.length > 0,
    },
    {
      title: 'Pending Orders',
      value: pendingOrders.length.toString(),
      subtitle: 'awaiting processing',
      icon: ShoppingCart,
      color: 'from-[#8B6914] to-[#B8860B]',
      onClick: () => onNavigate('Incoming Orders'),
      alert: pendingOrders.length > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent mb-2">
          Inventory Dashboard
        </h1>
        <p className="text-[#6B6B6B]">Complete stock management and order tracking control center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`border-[#B8860B]/20 hover:border-[#B8860B]/40 transition-all cursor-pointer group ${
                stat.alert ? 'ring-2 ring-yellow-500/20' : ''
              }`}
              onClick={stat.onClick}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  {stat.alert && (
                    <AlertTriangle className="w-4 h-4 text-yellow-600 animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{stat.value}</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">{stat.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Critical Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <Card className="border-yellow-500/30 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alerts ({lowStockProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white border border-yellow-200 cursor-pointer hover:border-yellow-300 transition-colors"
                    onClick={() => onNavigate('Products')}
                  >
                    <div>
                      <p className="font-medium text-[#1A1A1A]">{product.name}</p>
                      <p className="text-sm text-[#6B6B6B]">{product.category} • {product.dealerName}</p>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {product.stock} units left
                    </Badge>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <button
                    onClick={() => onNavigate('Products')}
                    className="w-full py-2 text-sm text-yellow-700 hover:text-yellow-800 font-medium"
                  >
                    View {lowStockProducts.length - 5} more...
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Out of Stock */}
        {outOfStockProducts.length > 0 && (
          <Card className="border-red-500/30 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Package className="w-5 h-5" />
                Out of Stock ({outOfStockProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {outOfStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white border border-red-200 cursor-pointer hover:border-red-300 transition-colors"
                    onClick={() => onNavigate('Add Stock')}
                  >
                    <div>
                      <p className="font-medium text-[#1A1A1A]">{product.name}</p>
                      <p className="text-sm text-[#6B6B6B]">
                        Dealer: {product.dealerName}
                        {!product.enabled && <span className="text-red-600"> • Disabled</span>}
                      </p>
                    </div>
                    <Badge variant="destructive">Out of Stock</Badge>
                  </div>
                ))}
                {outOfStockProducts.length > 5 && (
                  <button
                    onClick={() => onNavigate('Products')}
                    className="w-full py-2 text-sm text-red-700 hover:text-red-800 font-medium"
                  >
                    View {outOfStockProducts.length - 5} more...
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dealer-wise Stock Summary */}
      <Card className="border-[#B8860B]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#B8860B] flex items-center gap-2">
              <Users className="w-5 h-5" />
              Dealer-wise Stock Summary ({dealers.length} Dealers)
            </CardTitle>
            <button
              onClick={() => onNavigate('Dealers')}
              className="text-sm text-[#B8860B] hover:text-[#DAA520] font-medium"
            >
              View All Dealers →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dealerStock.map((dealer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[#FFF8F0] to-white border border-[#B8860B]/10 hover:border-[#B8860B]/30 transition-all cursor-pointer"
                onClick={() => onNavigate('Dealers')}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">{dealer.dealer}</p>
                    <p className="text-sm text-[#6B6B6B]">{dealer.products} products • {dealer.items} units</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {dealer.lowStockCount > 0 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {dealer.lowStockCount} low stock
                    </Badge>
                  )}
                  <div className="text-right">
                    <p className="text-xs text-[#6B6B6B]">Stock Value</p>
                    <p className="text-lg font-bold text-[#B8860B]">₹{(dealer.totalValue / 100000).toFixed(2)}L</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
        <CardHeader>
          <CardTitle className="text-[#B8860B]">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => onNavigate('Add Stock')}
              className="p-6 rounded-xl bg-gradient-to-br from-[#B8860B] to-[#DAA520] text-white hover:shadow-lg hover:shadow-[#B8860B]/20 transition-all group"
            >
              <Box className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold">Add Stock</p>
              <p className="text-sm opacity-90 mt-1">Record new inventory</p>
            </button>
            <button
              onClick={() => onNavigate('Incoming Orders')}
              className="p-6 rounded-xl border-2 border-[#B8860B]/20 hover:border-[#B8860B]/40 hover:bg-[#FFF8F0]/50 transition-all group"
            >
              <ShoppingCart className="w-8 h-8 mb-3 text-[#B8860B] group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-[#1A1A1A]">View Orders</p>
              <p className="text-sm text-[#6B6B6B] mt-1">{pendingOrders.length} pending</p>
            </button>
            <button
              onClick={() => onNavigate('Stock Tracking')}
              className="p-6 rounded-xl border-2 border-[#B8860B]/20 hover:border-[#B8860B]/40 hover:bg-[#FFF8F0]/50 transition-all group"
            >
              <TrendingUp className="w-8 h-8 mb-3 text-[#B8860B] group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-[#1A1A1A]">Track Stock</p>
              <p className="text-sm text-[#6B6B6B] mt-1">In/Out movements</p>
            </button>
            <button
              onClick={() => onNavigate('Inventory Ledger')}
              className="p-6 rounded-xl border-2 border-[#B8860B]/20 hover:border-[#B8860B]/40 hover:bg-[#FFF8F0]/50 transition-all group"
            >
              <TrendingDown className="w-8 h-8 mb-3 text-[#B8860B] group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-[#1A1A1A]">View Ledger</p>
              <p className="text-sm text-[#6B6B6B] mt-1">Complete history</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};