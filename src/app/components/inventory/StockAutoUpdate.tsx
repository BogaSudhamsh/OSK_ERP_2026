import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Input } from '@/app/components/ui/input';
import { useApp } from '@/app/context/AppContext';
import { 
  TrendingDown, 
  TrendingUp, 
  Search, 
  Zap, 
  AlertCircle,
  CheckCircle2,
  Activity,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const StockAutoUpdate: React.FC = () => {
  const { products, stockMovements, updateProduct, autoStockReductionEnabled, setAutoStockReductionEnabled } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentUpdates, setRecentUpdates] = useState<Array<{
    id: string;
    productName: string;
    oldQuantity: number;
    newQuantity: number;
    timestamp: Date;
  }>>([]);

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.dealerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stock statistics
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const recentReductions = stockMovements
    .filter(m => m.type === 'out' && new Date().getTime() - m.createdAt.getTime() < 3600000)
    .length;

  // Toggle auto-update
  const handleToggleAutoUpdate = (enabled: boolean) => {
    setAutoStockReductionEnabled(enabled);
    toast(
      enabled ? (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span>Auto Stock Update <strong>Enabled</strong></span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <span>Auto Stock Update <strong>Disabled</strong></span>
        </div>
      ),
      { duration: 2000 }
    );
  };

  // Simulate stock reduction animation
  const handleStockChange = (productId: string, change: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const oldQuantity = product.stock;
    const newQuantity = Math.max(0, oldQuantity + change);

    // Update product stock
    updateProduct(productId, { stock: newQuantity });

    // Add to recent updates
    setRecentUpdates(prev => [{
      id: `${productId}-${Date.now()}`,
      productName: product.name,
      oldQuantity,
      newQuantity,
      timestamp: new Date()
    }, ...prev.slice(0, 4)]);

    // Show toast notification
    if (change < 0) {
      toast(
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-blue-500" />
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-600">
              Stock reduced: {oldQuantity} → {newQuantity}
            </p>
          </div>
        </div>,
        { duration: 3000 }
      );
    }
  };

  // Get stock status
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-500', textColor: 'text-red-700' };
    if (stock <= 10) return { label: 'Low Stock', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (stock <= 50) return { label: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-700' };
    return { label: 'In Stock', color: 'bg-green-500', textColor: 'text-green-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header with Auto-Update Toggle */}
      <Card className="border-[#B8860B]/20 shadow-lg">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent flex items-center gap-2">
                <Activity className="w-6 h-6 text-[#B8860B]" />
                Stock Auto-Update System
              </CardTitle>
              <p className="text-sm text-[#6B6B6B] mt-1">
                Real-time inventory tracking with automatic stock reduction
              </p>
            </div>

            {/* Auto-Update Toggle */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-[#FFF8F0] to-white border border-[#B8860B]/20">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={`w-4 h-4 ${autoStockReductionEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="font-semibold text-sm">Auto Stock Reduction</span>
                </div>
                <p className="text-xs text-[#6B6B6B]">
                  {autoStockReductionEnabled ? 'Active - Stock updates on sale' : 'Inactive - Manual mode'}
                </p>
              </div>
              <Switch
                checked={autoStockReductionEnabled}
                onCheckedChange={handleToggleAutoUpdate}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#B8860B] data-[state=checked]:to-[#DAA520] data-[state=unchecked]:bg-gray-200"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-[#B8860B]/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-[#B8860B]" />
                <Badge className="bg-[#B8860B]/10 text-[#B8860B]">Total</Badge>
              </div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{totalProducts}</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Products Tracked</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-yellow-500/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-8 h-8 text-yellow-500" />
                <Badge className="bg-yellow-500/10 text-yellow-700">Alert</Badge>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{lowStockCount}</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Low Stock Items</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-red-500/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-8 h-8 text-red-500" />
                <Badge className="bg-red-500/10 text-red-700">Critical</Badge>
              </div>
              <p className="text-2xl font-bold text-red-700">{outOfStockCount}</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Out of Stock</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-blue-500/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-blue-500" />
                <Badge className="bg-blue-500/10 text-blue-700">1hr</Badge>
              </div>
              <p className="text-2xl font-bold text-blue-700">{recentReductions}</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Recent Updates</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Stock Updates */}
      <AnimatePresence>
        {recentUpdates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-blue-500/20 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                  <Activity className="w-5 h-5" />
                  Recent Stock Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentUpdates.map((update, index) => (
                    <motion.div
                      key={update.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-white border border-blue-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <TrendingDown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[#1A1A1A]">{update.productName}</p>
                          <p className="text-xs text-[#6B6B6B]">
                            {update.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {update.oldQuantity}
                        </Badge>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <Badge className="bg-red-500/10 text-red-700 font-mono">
                          {update.newQuantity}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <Card className="border-[#B8860B]/20">
        <CardContent className="p-4">
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

      {/* Product Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product, index) => {
          const status = getStockStatus(product.stock);
          
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={`border-[#B8860B]/20 hover:shadow-xl transition-all group ${
                product.stock === 0 ? 'bg-red-50/30' : product.stock <= 10 ? 'bg-yellow-50/30' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1A1A1A] line-clamp-1 mb-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {product.dealerName}
                        </Badge>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${status.color} animate-pulse`} />
                  </div>

                  {/* Stock Quantity Display */}
                  <div className="bg-gradient-to-br from-[#FFF8F0] to-white border border-[#B8860B]/10 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#6B6B6B] font-medium">Current Stock</span>
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.p
                        key={product.stock}
                        initial={{ scale: 1.5, color: '#B8860B' }}
                        animate={{ scale: 1, color: '#1A1A1A' }}
                        transition={{ duration: 0.3 }}
                        className="text-3xl font-bold"
                      >
                        {product.stock}
                      </motion.p>
                      <span className="text-sm text-[#6B6B6B]">units</span>
                    </div>

                    {/* Stock Level Bar */}
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${status.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </div>
                  </div>

                  {/* Auto-Update Indicator */}
                  {autoStockReductionEnabled && (
                    <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                      <Zap className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">
                        Auto-Update Active
                      </span>
                    </div>
                  )}

                  {/* Quick Actions (Demo - for testing) */}
                  {import.meta.env.DEV && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                      <button
                        onClick={() => handleStockChange(product.id, -1)}
                        className="flex-1 py-1 px-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        disabled={product.stock === 0}
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleStockChange(product.id, 1)}
                        className="flex-1 py-1 px-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        +1
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card className="border-dashed border-[#B8860B]/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-[#B8860B]/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-sm text-[#6B6B6B]">
              {searchQuery ? 'Try adjusting your search criteria' : 'No products available'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
