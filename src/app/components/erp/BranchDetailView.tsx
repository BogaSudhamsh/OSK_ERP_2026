import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  Building2,
  ArrowLeft,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Boxes,
  IndianRupee,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '@/app/context/AppContext';

interface BranchDetailViewProps {
  branchId: string;
  onBack: () => void;
}

export const BranchDetailView: React.FC<BranchDetailViewProps> = ({ branchId, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const { branches, branchStock, orders } = useApp();
  
  // Get branch data
  const branch = branches.find((b) => b.id === branchId);
  const stockItems = branchStock.filter((s) => s.branchId === branchId);
  const branchOrders = orders.filter((o) => o.branchId === branchId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysSales = branchOrders.filter((o) => o.createdAt >= today);

  const performance = {
    dailySales: todaysSales.reduce((sum, o) => sum + o.totalAmount, 0),
    dailyProfit: todaysSales.reduce((sum, o) => sum + (o.totalAmount * 0.15), 0),
    totalStock: stockItems.reduce((sum, item) => sum + item.freshQuantity, 0),
    pendingReceivables: branchOrders.filter((o) => o.paymentStatus !== 'paid').reduce((sum, o) => sum + o.totalAmount, 0),
    cashInHand: todaysSales
      .filter((o) => o.paymentMode === 'cash')
      .reduce((sum, o) => sum + (o.amountPaid ?? o.totalAmount), 0),
  };

  const branchSales = [...branchOrders].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (!branch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0] flex items-center justify-center">
        <Card className="border-[#B8860B]/20 p-8">
          <p className="text-[#6B6B6B]">Branch not found</p>
          <Button onClick={onBack} className="mt-4">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate additional metrics
  const totalStockValue = stockItems.reduce(
    (sum, item) => sum + item.freshQuantity * item.sellingPriceMax,
    0
  );
  const lowStockItems = stockItems.filter((s) => s.freshQuantity < 100);
  const brokenStockItems = stockItems.filter((s) => s.brokenQuantity > 0);
  const totalBrokenValue = brokenStockItems.reduce(
    (sum, item) => sum + item.brokenQuantity * item.sellingPriceMax,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0]">
      {/* Header */}
      <div className="bg-white border-b border-[#B8860B]/20 shadow-sm sticky top-0 z-10">
        <div className="w-full px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="hover:bg-[#FFF8F0] text-[#B8860B]"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div className="h-8 w-px bg-[#B8860B]/20" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#B8860B] to-[#DAA520] rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#2C2C2C]">{branch.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-3 h-3 text-[#6B6B6B]" />
                    <p className="text-sm text-[#6B6B6B]">{branch.location}</p>
                  </div>
                </div>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-300 px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              Active
            </Badge>
          </div>
        </div>
      </div>

      <div className="w-full px-4 lg:px-6 py-6 lg:py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Daily Sales</p>
                    <h3 className="text-3xl font-bold text-[#2C2C2C] mb-2">
                      ₹{(performance.dailySales / 1000).toFixed(1)}K
                    </h3>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">+15.3%</span>
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl">
                    <ShoppingCart className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Daily Profit</p>
                    <h3 className="text-3xl font-bold text-green-600 mb-2">
                      ₹{(performance.dailyProfit / 1000).toFixed(1)}K
                    </h3>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">+12.8%</span>
                    </div>
                  </div>
                  <div className="bg-[#FFF8F0] p-3 rounded-xl">
                    <DollarSign className="w-6 h-6 text-[#B8860B]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Total Stock</p>
                    <h3 className="text-3xl font-bold text-[#2C2C2C] mb-2">
                      {performance.totalStock.toLocaleString()}
                    </h3>
                    <p className="text-sm text-[#6B6B6B]">
                      Value: ₹{(totalStockValue / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Package className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Receivables</p>
                    <h3 className="text-3xl font-bold text-orange-600 mb-2">
                      ₹{(performance.pendingReceivables / 1000).toFixed(0)}K
                    </h3>
                    <p className="text-sm text-[#6B6B6B]">
                      Cash: ₹{performance.cashInHand.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Branch Contact Info */}
        <Card className="border-[#B8860B]/20 mb-8">
          <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#B8860B]" />
              Branch Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B]">Contact</p>
                  <p className="font-semibold text-[#2C2C2C]">{branch.contact}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B]">Email</p>
                  <p className="font-semibold text-[#2C2C2C]">{branch.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#FFF8F0] p-3 rounded-lg">
                  <Users className="w-5 h-5 text-[#B8860B]" />
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B]">Manager</p>
                  <p className="font-semibold text-[#2C2C2C]">{branch.manager}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-[#B8860B]/20 p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B8860B] data-[state=active]:to-[#DAA520] data-[state=active]:text-white"
            >
              <Package className="w-4 h-4 mr-2" />
              Stock Overview
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B8860B] data-[state=active]:to-[#DAA520] data-[state=active]:text-white"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Recent Sales
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#B8860B] data-[state=active]:to-[#DAA520] data-[state=active]:text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alerts ({lowStockItems.length + brokenStockItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Stock Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="border-[#B8860B]/20">
              <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
                <CardTitle>Stock Inventory - All Products</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#FFF8F0] border-b border-[#B8860B]/10">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Product
                        </th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          SKU
                        </th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Fresh Stock
                        </th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Broken Stock
                        </th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Rate (₹)
                        </th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Value (₹)
                        </th>
                        <th className="text-center py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#B8860B]/10">
                      {stockItems.map((item) => {
                        const itemValue = item.freshQuantity * item.sellingPriceMax;
                        const isLowStock = item.freshQuantity < 100;
                        const hasBroken = item.brokenQuantity > 0;

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-[#FFF8F0]/50 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-medium text-[#2C2C2C]">
                                  {item.productName}
                                </p>
                                <p className="text-sm text-[#6B6B6B] mt-1">
                                  {item.category}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {item.sku}
                              </code>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <p className="font-semibold text-[#2C2C2C]">
                                {item.freshQuantity.toLocaleString()}
                              </p>
                              <p className="text-xs text-[#6B6B6B]">boxes</p>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {hasBroken ? (
                                <>
                                  <p className="font-semibold text-red-600">
                                    {item.brokenQuantity.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-[#6B6B6B]">boxes</p>
                                </>
                              ) : (
                                <p className="text-[#6B6B6B]">-</p>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <p className="font-semibold text-[#2C2C2C]">
                                ₹{item.sellingPriceMax}
                              </p>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <p className="font-semibold text-[#2C2C2C]">
                                ₹{itemValue.toLocaleString()}
                              </p>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1 items-center">
                                {isLowStock && (
                                  <Badge
                                    variant="outline"
                                    className="border-orange-400 text-orange-700 text-xs"
                                  >
                                    Low Stock
                                  </Badge>
                                )}
                                {hasBroken && (
                                  <Badge
                                    variant="outline"
                                    className="border-red-400 text-red-700 text-xs"
                                  >
                                    Has Broken
                                  </Badge>
                                )}
                                {!isLowStock && !hasBroken && (
                                  <Badge
                                    variant="outline"
                                    className="border-green-400 text-green-700 text-xs"
                                  >
                                    Good
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Sales Tab */}
          <TabsContent value="sales" className="space-y-6">
            <Card className="border-[#B8860B]/20">
              <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
                <CardTitle>Recent Sales Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#FFF8F0] border-b border-[#B8860B]/10">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Invoice
                        </th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Customer
                        </th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Date
                        </th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Amount
                        </th>
                        <th className="text-center py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Payment
                        </th>
                        <th className="text-center py-3 px-6 text-sm font-semibold text-[#2C2C2C]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#B8860B]/10">
                      {branchSales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="hover:bg-[#FFF8F0]/50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#B8860B]" />
                              <code className="text-sm font-medium text-[#2C2C2C]">
                                {sale.orderNumber}
                              </code>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-medium text-[#2C2C2C]">
                              {sale.customerName}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#6B6B6B]" />
                              <p className="text-sm text-[#6B6B6B]">{sale.createdAt.toLocaleDateString('en-IN')}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <p className="font-semibold text-[#2C2C2C]">
                              ₹{sale.totalAmount.toLocaleString('en-IN')}
                            </p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Badge
                              variant="outline"
                              className="border-green-400 text-green-700"
                            >
                              Standard
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Badge
                              variant="outline"
                              className={
                                sale.paymentStatus === 'paid'
                                  ? 'border-green-400 text-green-700'
                                  : 'border-orange-400 text-orange-700'
                              }
                            >
                              {sale.paymentStatus === 'paid' ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {sale.paymentStatus.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Low Stock Alerts */}
              <Card className="border-orange-200">
                <CardHeader className="bg-orange-50 border-b border-orange-200">
                  <CardTitle className="flex items-center gap-2 text-orange-900">
                    <AlertTriangle className="w-5 h-5" />
                    Low Stock Items ({lowStockItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {lowStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-[#2C2C2C]">
                              {item.productName}
                            </p>
                            <p className="text-sm text-[#6B6B6B] mt-1">
                              SKU: {item.sku}
                            </p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                            Urgent
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-[#6B6B6B]">Current Stock</p>
                            <p className="text-lg font-bold text-orange-600">
                              {item.freshQuantity}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#6B6B6B]">Reorder Level</p>
                            <p className="text-lg font-bold text-[#2C2C2C]">100</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Broken Stock Alerts */}
              <Card className="border-red-200">
                <CardHeader className="bg-red-50 border-b border-red-200">
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <XCircle className="w-5 h-5" />
                    Broken Stock Items ({brokenStockItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {brokenStockItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-[#2C2C2C]">
                              {item.productName}
                            </p>
                            <p className="text-sm text-[#6B6B6B] mt-1">
                              SKU: {item.sku}
                            </p>
                          </div>
                          <Badge className="bg-red-100 text-red-700 border-red-300">
                            Damaged
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-[#6B6B6B]">Broken Qty</p>
                            <p className="text-lg font-bold text-red-600">
                              {item.brokenQuantity}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#6B6B6B]">Loss Value</p>
                            <p className="text-lg font-bold text-red-600">
                              ₹{(item.brokenQuantity * item.sellingPriceMax).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-700 mb-2">
                      Total Low Stock Items
                    </p>
                    <p className="text-3xl font-bold text-orange-600">
                      {lowStockItems.length}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 mb-2">Total Broken Items</p>
                    <p className="text-3xl font-bold text-red-600">
                      {brokenStockItems.length}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-[#6B6B6B] mb-2">Broken Stock Loss</p>
                    <p className="text-3xl font-bold text-[#2C2C2C]">
                      ₹{(totalBrokenValue / 1000).toFixed(1)}K
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};