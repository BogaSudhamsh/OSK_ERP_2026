import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  IndianRupee,
  ShoppingCart,
  Box,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Users,
  Building2,
  Filter,
  Search,
  MapPin,
  Check,
  X,
  Pencil,
} from 'lucide-react';
import { useApp } from '@/app/context/AppContext';

interface BranchAdminDashboardProps {
  branchId: string;
  branchLocation: string;
  onNavigate: (screen: string) => void;
  userRole?: 'super-admin' | 'branch-admin' | 'stock-manager';
}

export const BranchAdminDashboard: React.FC<BranchAdminDashboardProps> = ({
  branchId,
  branchLocation,
  onNavigate,
  userRole = 'branch-admin',
}) => {
  // Live data from AppContext (stays in sync when products are added/transferred)
  const { branchStock, branches, updateBranchStockRack, orders } = useApp();

  // State for branch filter — defaults to OWN branch so stock managers see their stock first
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(branchId);
  const [rackSearch, setRackSearch] = useState('');
  const [editingRackId, setEditingRackId] = useState<string | null>(null);
  const [editRackValue, setEditRackValue] = useState('');

  // Get branch data
  const branch = branches.find((b) => b.id === branchId);
  const stock = branchStock.filter((s) => s.branchId === branchId);
  const branchOrders = orders.filter((o) => o.branchId === branchId);

  // Get branch stock with filter — own branch by default
  const allBranchStock = selectedBranchFilter === 'all' 
    ? branchStock 
    : branchStock.filter((s) => s.branchId === selectedBranchFilter);

  // Apply rack search filter
  const filteredBranchStock = rackSearch.trim()
    ? allBranchStock.filter((s) => 
        (s.rackLocation || '').toUpperCase().includes(rackSearch.trim().toUpperCase()) ||
        s.productName.toLowerCase().includes(rackSearch.trim().toLowerCase()) ||
        s.sku.toLowerCase().includes(rackSearch.trim().toLowerCase())
      )
    : allBranchStock;

  // Missing rack items for own branch
  const missingRackItems = branchStock.filter(
    (s) => s.branchId === branchId && (!s.rackLocation || s.rackLocation.trim() === '')
  );

  // Rack validation helpers
  const validateRack = (rack: string): boolean => /^[A-Za-z0-9]+$/.test(rack);
  const normalizeRack = (rack: string): string => rack.trim().toUpperCase();

  const handleSaveRack = (stockId: string) => {
    const normalized = normalizeRack(editRackValue);
    if (!normalized) {
      toast.error('Rack location cannot be empty');
      return;
    }
    if (!validateRack(normalized)) {
      toast.error('Rack code must be alphanumeric only (e.g., A1, B12, R3)');
      return;
    }
    updateBranchStockRack(stockId, normalized);
    setEditingRackId(null);
    setEditRackValue('');
    toast.success(`Rack location updated to ${normalized}`);
  };

  // Calculate metrics
  const totalStockValue = filteredBranchStock.reduce(
    (sum, item) => sum + item.freshQuantity * item.costPrice,
    0
  );
  const lowStockItems = filteredBranchStock.filter((item) => item.freshQuantity < 100);
  const brokenStockValue = filteredBranchStock.reduce(
    (sum, item) => sum + item.brokenQuantity * item.costPrice,
    0
  );
  const recentSales = [...branchOrders].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysSales = branchOrders.filter((o) => o.createdAt >= today);
  const todaysSalesAmount = todaysSales.reduce((sum, o) => sum + o.totalAmount, 0);

  const stats = [
    {
      title: "Today's Sales",
      value: `₹${todaysSalesAmount.toLocaleString('en-IN')}`,
      change: '+12.5%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Total Stock Value',
      value: `₹${totalStockValue.toLocaleString('en-IN')}`,
      change: `${filteredBranchStock.reduce((sum, item) => sum + item.freshQuantity, 0)} items`,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockItems.length.toString(),
      change: 'Needs attention',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Broken Stock',
      value: `₹${brokenStockValue.toLocaleString('en-IN')}`,
      change: filteredBranchStock.reduce((sum, item) => sum + item.brokenQuantity, 0) + ' units',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  ];

  const quickActions = [
    {
      title: 'Stock Inward',
      description: 'Add new stock entry',
      icon: TrendingUp,
      action: () => onNavigate('stock-inward'),
      gradient: 'from-blue-600 to-blue-700',
    },
    {
      title: 'POS Billing',
      description: 'Create new invoice',
      icon: ShoppingCart,
      action: () => onNavigate('pos-billing'),
      gradient: 'from-[#B8860B] to-[#DAA520]',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-[#2C2C2C] mb-2">
              {branch?.name || 'Branch Dashboard'}
            </h1>
            <p className="text-[#6B6B6B] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {userRole === 'stock-manager' ? 'Stock Manager Portal' : 'Branch Admin Portal'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-[#B8860B] text-white px-4 py-2 text-sm">
              {branch?.location || 'Branch'}
            </Badge>
            <Badge variant="outline" className="border-[#B8860B] text-[#B8860B] px-4 py-2 text-sm">
              {branch?.manager || 'Manager'}
            </Badge>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-2 ${stat.borderColor} hover:shadow-lg transition-shadow`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-[#6B6B6B] mb-2">{stat.title}</p>
                        <p className="text-2xl font-bold text-[#2C2C2C] mb-1">
                          {stat.value}
                        </p>
                        <p className="text-xs text-[#6B6B6B]">{stat.change}</p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
                      >
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-[#B8860B]/20">
            <CardHeader>
              <CardTitle className="text-xl text-[#2C2C2C]">Quick Actions</CardTitle>
              <CardDescription>Common tasks for daily operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.title}
                      onClick={action.action}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative overflow-hidden rounded-xl border-2 border-[#B8860B]/20 bg-gradient-to-br from-white to-[#FFF8F0] p-6 text-left hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#2C2C2C] mb-1 group-hover:text-[#B8860B] transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-[#6B6B6B]">{action.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#B8860B] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-[#B8860B]/20 h-full">
              <CardHeader>
                <CardTitle className="text-xl text-[#2C2C2C] flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#B8860B]" />
                  Recent Sales
                </CardTitle>
                <CardDescription>Latest transactions at this branch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSales.length > 0 ? (
                    recentSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[#FFF8F0] to-white border border-[#B8860B]/10 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-[#2C2C2C] text-sm">
                            {sale.orderNumber}
                          </p>
                          <p className="text-xs text-[#6B6B6B]">{sale.customerName}</p>
                          <p className="text-xs text-[#6B6B6B]">{sale.createdAt.toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#B8860B]">
                            ₹{sale.totalAmount.toLocaleString('en-IN')}
                          </p>
                          <Badge
                            className={
                              sale.paymentStatus === 'paid'
                                ? 'bg-green-100 text-green-700 text-xs'
                                : 'bg-orange-100 text-orange-700 text-xs'
                            }
                          >
                            {sale.paymentStatus.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[#6B6B6B] py-8">No sales data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Low Stock Alerts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-white h-full">
              <CardHeader>
                <CardTitle className="text-xl text-[#2C2C2C] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription>Items requiring restocking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStockItems.length > 0 ? (
                    lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white border border-orange-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-[#2C2C2C] text-sm">
                            {item.productName}
                          </p>
                          <p className="text-xs text-[#6B6B6B]">SKU: {item.sku}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-orange-100 text-orange-700 text-xs">
                            {item.freshQuantity} left
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-green-600 font-medium">All stock levels healthy!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Missing Rack Locations Warning Panel */}
        {missingRackItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
          >
            <Card className="border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="border-b border-orange-200 bg-orange-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-orange-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Missing Rack Locations ({missingRackItems.length})
                    </CardTitle>
                    <CardDescription className="text-orange-700 mt-1">
                      Rack location must be assigned before performing stock operations.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {missingRackItems.map((item) => {
                    const isEditing = editingRackId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white border border-orange-200 hover:border-orange-300 transition-colors"
                      >
                        <div className="flex-1 flex items-center gap-4">
                          <div>
                            <p className="font-semibold text-[#2C2C2C] text-sm">{item.productName}</p>
                            <p className="text-xs text-[#6B6B6B]">SKU: {item.sku} • Qty: {item.freshQuantity}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <Input
                                value={editRackValue}
                                onChange={(e) => setEditRackValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRack(item.id); }}
                                placeholder="e.g. A1"
                                className="w-24 border-orange-300 focus:border-[#B8860B] text-sm"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveRack(item.id)}
                                className="bg-[#B8860B] hover:bg-[#DAA520] text-white px-3"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setEditingRackId(null); setEditRackValue(''); }}
                                className="border-orange-300 px-3"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setEditingRackId(item.id); setEditRackValue(''); }}
                              className="border-orange-300 text-orange-700 hover:bg-orange-50"
                            >
                              <MapPin className="w-3.5 h-3.5 mr-1" />
                              Assign Rack
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* All Branch Stock Inventory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-[#2C2C2C] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#B8860B]" />
                    All Branch Stock Inventory
                  </CardTitle>
                  <CardDescription>View products from all branches with filtering</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#B8860B]" />
                  <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
                    <SelectTrigger className="w-[200px] border-[#B8860B]/30">
                      <SelectValue placeholder="Filter by branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          All Branches
                        </div>
                      </SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {b.name.replace('OSK Granite - ', '')}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Rack Search Bar */}
              <div className="mt-3 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8860B]/50" />
                <Input
                  value={rackSearch}
                  onChange={(e) => setRackSearch(e.target.value)}
                  placeholder="Search by rack, product, or SKU..."
                  className="pl-9 border-[#B8860B]/20 focus:border-[#B8860B] text-sm"
                />
                {rackSearch && (
                  <button
                    onClick={() => setRackSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#2C2C2C]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#B8860B]/10 to-[#DAA520]/10 border-b border-[#B8860B]/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-[#B8860B] uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          Rack
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">
                        Fresh Stock
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">
                        Broken Stock
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">
                        Selling Price
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">
                        Stock Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#B8860B]/10">
                    {filteredBranchStock.length > 0 ? (
                      filteredBranchStock.map((item, index) => {
                        const itemBranch = branches.find((b) => b.id === item.branchId);
                        const stockValue = item.freshQuantity * item.costPrice;
                        const isCurrentBranch = item.branchId === branchId;
                        
                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className={`hover:bg-[#FFF8F0]/30 transition-colors ${
                              isCurrentBranch ? 'bg-green-50/30' : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-semibold text-[#2C2C2C] text-sm">
                                    {item.productName}
                                  </p>
                                  {isCurrentBranch && (
                                    <Badge variant="outline" className="border-green-500 text-green-700 text-xs mt-1">
                                      Your Branch
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                className={`${
                                  isCurrentBranch 
                                    ? 'bg-green-100 text-green-700 border-green-300' 
                                    : 'bg-[#B8860B]/10 text-[#B8860B] border-[#B8860B]/20'
                                }`}
                                variant="outline"
                              >
                                <Building2 className="w-3 h-3 mr-1" />
                                {itemBranch?.name.replace('OSK Granite - ', '') || item.branchLocation}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-[#6B6B6B] font-mono">{item.sku}</p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {item.category}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {editingRackId === item.id ? (
                                <Input
                                  value={editRackValue}
                                  onChange={(e) => setEditRackValue(e.target.value)}
                                  placeholder="Enter rack code"
                                  className="w-20 border-[#B8860B]/20 focus:border-[#B8860B] text-sm"
                                />
                              ) : (
                                <Badge 
                                  className={`${
                                    item.rackLocation ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {item.rackLocation || 'Not Set'}
                                </Badge>
                              )}
                              {editingRackId === item.id ? (
                                <Button
                                  onClick={() => handleSaveRack(item.id)}
                                  className="ml-2 px-2 py-1 text-xs bg-[#B8860B] text-white rounded"
                                >
                                  Save
                                </Button>
                              ) : (
                                <Pencil
                                  onClick={() => {
                                    setEditingRackId(item.id);
                                    setEditRackValue(item.rackLocation || '');
                                  }}
                                  className="ml-2 w-4 h-4 text-[#B8860B] cursor-pointer"
                                />
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge 
                                className={`${
                                  item.freshQuantity < 100 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {item.freshQuantity.toLocaleString()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge 
                                variant="outline" 
                                className={`${
                                  item.brokenQuantity > 0 
                                    ? 'border-orange-300 text-orange-700 bg-orange-50' 
                                    : 'border-gray-300 text-gray-500'
                                }`}
                              >
                                {item.brokenQuantity.toLocaleString()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div>
                                <p className="font-semibold text-[#B8860B]">
                                  ₹{item.sellingPriceMax.toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-[#6B6B6B]">
                                  Min: ₹{item.sellingPriceMin.toLocaleString('en-IN')}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="font-bold text-[#2C2C2C]">
                                ₹{stockValue.toLocaleString('en-IN')}
                              </p>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center">
                          <Package className="w-12 h-12 text-[#B8860B]/30 mx-auto mb-3" />
                          <p className="text-[#6B6B6B]">No stock data available</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Branch Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#2C2C2C]">Branch Information</CardTitle>
              <CardDescription>Contact and operational details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Manager</p>
                    <p className="font-semibold text-[#2C2C2C]">{branch?.manager}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Box className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Contact</p>
                    <p className="font-semibold text-[#2C2C2C]">{branch?.phone}</p>
                    <p className="text-xs text-[#6B6B6B]">{branch?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">GST Number</p>
                    <p className="font-semibold text-[#2C2C2C]">{branch?.gstNumber}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};