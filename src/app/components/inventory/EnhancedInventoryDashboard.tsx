import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Package,
  Building2,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  BarChart3,
  Bell,
  User,
  LogOut,
  Home,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';

interface EnhancedInventoryDashboardProps {
  onNavigate: (page: string) => void;
  onViewDealers: () => void;
}

export const EnhancedInventoryDashboard: React.FC<EnhancedInventoryDashboardProps> = ({
  onNavigate,
  onViewDealers,
}) => {
  const { products, dealers, currentUser, getFilteredNotifications } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate statistics
  const totalProducts = products.length;
  const totalDealers = dealers.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const filteredNotifications = getFilteredNotifications();
  const unreadNotifications = filteredNotifications.filter(n => !n.read).length;

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.dealerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    {
      title: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'from-[#B8860B] to-[#DAA520]',
      subtitle: `${products.filter(p => p.enabled).length} enabled`,
      onClick: () => onNavigate('products'),
    },
    {
      title: 'Total Dealers',
      value: totalDealers,
      icon: Building2,
      color: 'from-[#DAA520] to-[#B8860B]',
      subtitle: 'Active partnerships',
      onClick: onViewDealers,
    },
    {
      title: 'Total Stock',
      value: totalStock,
      icon: TrendingUp,
      color: 'from-[#8B6914] to-[#B8860B]',
      subtitle: 'units available',
      onClick: () => onNavigate('stock-tracking'),
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockProducts.length,
      icon: AlertTriangle,
      color: 'from-[#FF8C00] to-[#FFA500]',
      subtitle: 'need attention',
      alert: lowStockProducts.length > 0,
      onClick: () => onNavigate('products'),
    },
  ];

  return (
    <div className="space-y-6">{/* Dashboard Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Inventory Dashboard</h1>
          <p className="text-[#6B6B6B] mt-2">
            Dealer-wise stock tracking with automatic stock reduction & real-time availability
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={stat.onClick}
          >
            <Card
              className={`border-[#B8860B]/20 hover:border-[#B8860B]/60 hover:shadow-xl transition-all cursor-pointer group ${
                stat.alert ? 'ring-2 ring-yellow-500/20' : ''
              }`}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  {stat.alert && (
                    <AlertTriangle className="w-4 h-4 text-yellow-600 animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-xs md:text-sm text-[#6B6B6B] mb-1">{stat.title}</p>
                  <p className="text-xl md:text-2xl font-bold text-[#1A1A1A]">{stat.value}</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">{stat.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filter & Search Section */}
      <Card className="border-[#B8860B]/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-[#B8860B] flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter & Search
            </CardTitle>
            <Button
              onClick={onViewDealers}
              className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] w-full sm:w-auto"
            >
              <Building2 className="w-4 h-4 mr-2" />
              View All Dealers
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
            <Input
              placeholder="Search products by name, category, or dealer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#B8860B]/20 focus:border-[#B8860B]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Out of Stock Products */}
      {outOfStockProducts.length > 0 && (
        <Card className="border-red-500/30 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Out of Stock Products ({outOfStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {outOfStockProducts.slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  className="p-3 rounded-lg bg-white border border-red-200 hover:border-red-300 transition-colors cursor-pointer"
                  onClick={() => onNavigate('Products')}
                >
                  <p className="font-medium text-[#1A1A1A] line-clamp-1">{product.name}</p>
                  <p className="text-sm text-[#6B6B6B]">{product.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.dealerName}
                    </Badge>
                    <Badge variant="destructive" className="text-xs">
                      Out of Stock
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {outOfStockProducts.length > 6 && (
              <button
                onClick={() => onNavigate('Products')}
                className="w-full mt-3 py-2 text-sm text-red-700 hover:text-red-800 font-medium"
              >
                View {outOfStockProducts.length - 6} more...
              </button>
            )}
          </CardContent>
        </Card>
      )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockProducts.slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  className="p-3 rounded-lg bg-white border border-yellow-200 hover:border-yellow-300 transition-colors cursor-pointer"
                  onClick={() => onNavigate('Products')}
                >
                  <p className="font-medium text-[#1A1A1A] line-clamp-1">{product.name}</p>
                  <p className="text-sm text-[#6B6B6B]">{product.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.dealerName}
                    </Badge>
                    <Badge className="bg-yellow-500 text-xs">
                      {product.stock} units left
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {lowStockProducts.length > 6 && (
              <button
                onClick={() => onNavigate('Products')}
                className="w-full mt-3 py-2 text-sm text-yellow-700 hover:text-yellow-800 font-medium"
              >
                View {lowStockProducts.length - 6} more...
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchQuery && (
        <Card className="border-[#B8860B]/20">
          <CardHeader>
            <CardTitle className="text-[#B8860B]">
              Search Results ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-3 rounded-lg border border-[#B8860B]/20 hover:border-[#B8860B]/40 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onNavigate('Products')}
                >
                  <p className="font-medium text-[#1A1A1A] line-clamp-1 mb-1">
                    {product.name}
                  </p>
                  <Badge variant="secondary" className="text-xs mb-2">
                    {product.category}
                  </Badge>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B6B6B]">Stock:</span>
                    <span className={`font-semibold ${
                      product.stock === 0
                        ? 'text-red-600'
                        : product.stock <= 10
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {product.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};