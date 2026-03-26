import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useApp } from '@/app/context/AppContext';
import {
  FileText,
  Search,
  Filter,
  Package,
  User,
  Phone,
  MapPin,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Eye,
  ArrowLeft,
  ShoppingCart,
  Building2,
  CreditCard,
  TrendingUp,
  Users,
  Receipt,
  History,
} from 'lucide-react';

import type { Order } from '@/app/types';

interface BranchPurchaseOrdersProps {
  branchId: string;
  branchLocation: string;
  userRole: 'super-admin' | 'branch-admin' | 'stock-manager';
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Truck },
  completed: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: XCircle },
};

export const BranchPurchaseOrders: React.FC<BranchPurchaseOrdersProps> = ({
  branchId,
  branchLocation,
  userRole,
}) => {
  const { orders, updateOrderStatus, branches } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'history'>('orders');

  // Filter orders for this branch
  const branchOrders = orders.filter(order => order.branchId === branchId);

  // Apply search and status filters
  const filteredOrders = branchOrders.filter(order => {
    const matchesSearch =
      !searchQuery ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.poNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Separate active and completed orders
  const activeOrders = filteredOrders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status));
  const completedOrders = filteredOrders.filter(o => ['completed', 'cancelled'].includes(o.status));

  // Customer purchase history (Branch Admin only)
  const customerHistory = branchOrders.reduce((acc, order) => {
    if (!acc[order.customerName]) {
      acc[order.customerName] = {
        name: order.customerName,
        phone: order.customerPhone || '-',
        orders: [],
        totalSpent: 0,
      };
    }
    acc[order.customerName].orders.push(order);
    acc[order.customerName].totalSpent += order.totalAmount || order.total || 0;
    return acc;
  }, {} as Record<string, { name: string; phone: string; orders: Order[]; totalSpent: number }>);

  const customers = Object.values(customerHistory).sort((a, b) => b.totalSpent - a.totalSpent);

  // Stats
  const totalRevenue = branchOrders.reduce((sum, o) => o.status !== 'cancelled' ? sum + (o.totalAmount || o.total || 0) : sum, 0);
  const pendingCount = branchOrders.filter(o => o.status === 'pending').length;
  const completedCount = branchOrders.filter(o => o.status === 'completed').length;

  const branch = branches.find(b => b.id === branchId);
  const branchDisplayName = branch?.name?.replace('OSK Granite - ', '') || branchLocation;

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  // ── Order Detail View ──────────────────────────────────────────────────────
  if (selectedOrder) {
    const statusConfig = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.pending;
    const StatusIcon = statusConfig.icon;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            onClick={() => setSelectedOrder(null)}
            variant="ghost"
            className="text-[#B8860B] hover:bg-[#B8860B]/10 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>

          {/* Order Header */}
          <Card className="border-[#B8860B]/20 overflow-hidden">
            <div className="bg-gradient-to-r from-[#B8860B]/10 to-[#DAA520]/10 p-6 border-b border-[#B8860B]/20">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#2C2C2C]">
                    {selectedOrder.poNumber || selectedOrder.id}
                  </h2>
                  <p className="text-[#6B6B6B] mt-1">Order ID: {selectedOrder.id}</p>
                </div>
                <Badge className={`${statusConfig.bgColor} ${statusConfig.color} px-4 py-2 text-sm font-semibold`}>
                  <StatusIcon className="w-4 h-4 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-[#FFF8F0] rounded-xl border border-[#B8860B]/10">
                  <User className="w-5 h-5 text-[#B8860B]" />
                  <div>
                    <p className="text-xs text-[#6B6B6B]">Customer</p>
                    <p className="font-semibold text-[#2C2C2C]">{selectedOrder.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-[#FFF8F0] rounded-xl border border-[#B8860B]/10">
                  <Phone className="w-5 h-5 text-[#B8860B]" />
                  <div>
                    <p className="text-xs text-[#6B6B6B]">Phone</p>
                    <p className="font-semibold text-[#2C2C2C]">{selectedOrder.customerPhone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-[#FFF8F0] rounded-xl border border-[#B8860B]/10">
                  <Calendar className="w-5 h-5 text-[#B8860B]" />
                  <div>
                    <p className="text-xs text-[#6B6B6B]">Date</p>
                    <p className="font-semibold text-[#2C2C2C]">
                      {selectedOrder.createdAt instanceof Date
                        ? selectedOrder.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {selectedOrder.customerAddress && (
                <div className="flex items-center gap-3 p-4 bg-[#FFF8F0] rounded-xl border border-[#B8860B]/10">
                  <MapPin className="w-5 h-5 text-[#B8860B]" />
                  <div>
                    <p className="text-xs text-[#6B6B6B]">Address</p>
                    <p className="font-semibold text-[#2C2C2C]">{selectedOrder.customerAddress}</p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-[#2C2C2C] mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#B8860B]" />
                  Order Items ({selectedOrder.items.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#B8860B]/10 to-[#DAA520]/10 border-b border-[#B8860B]/20">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C2C2C] uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C2C2C] uppercase">Category</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#2C2C2C] uppercase">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[#2C2C2C] uppercase">Price</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[#2C2C2C] uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#B8860B]/10">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#FFF8F0]/50">
                          <td className="px-4 py-3 font-medium text-[#2C2C2C]">{item.productName}</td>
                          <td className="px-4 py-3 text-[#6B6B6B] text-sm">{item.category || '-'}</td>
                          <td className="px-4 py-3 text-center font-semibold text-[#2C2C2C]">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-[#6B6B6B]">₹{(item.rate || item.price || 0).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#B8860B]">₹{(item.amount || item.total || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between p-3 bg-[#FFF8F0] rounded-lg">
                    <span className="text-[#6B6B6B]">Subtotal</span>
                    <span className="font-semibold text-[#2C2C2C]">₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#FFF8F0] rounded-lg">
                    <span className="text-[#6B6B6B]">GST (18%)</span>
                    <span className="font-semibold text-[#2C2C2C]">₹{(selectedOrder.taxAmount || selectedOrder.gst || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#FFF8F0] rounded-lg">
                    <span className="text-[#6B6B6B]">Payment</span>
                    <span className="font-semibold text-[#2C2C2C] capitalize">{selectedOrder.paymentMode || '-'}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-gradient-to-r from-[#B8860B]/10 to-[#DAA520]/10 rounded-lg border-2 border-[#B8860B]/30">
                    <span className="text-lg font-bold text-[#2C2C2C]">Grand Total</span>
                    <span className="text-xl font-bold text-[#B8860B]">₹{(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              {(userRole === 'stock-manager' || userRole === 'branch-admin') && selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <div className="border-t border-[#B8860B]/20 pt-6">
                  <h3 className="font-semibold text-[#2C2C2C] mb-3">Update Order Status</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedOrder.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'confirmed')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Confirm Order
                        </Button>
                        <Button
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')}
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Order
                        </Button>
                      </>
                    )}
                    {selectedOrder.status === 'confirmed' && (
                      <Button
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'processing')}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Start Processing
                      </Button>
                    )}
                    {selectedOrder.status === 'processing' && (
                      <Button
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'completed')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Created By */}
              {selectedOrder.createdByName && (
                <div className="text-sm text-[#6B6B6B] border-t border-[#B8860B]/10 pt-4">
                  Created by: <span className="font-semibold text-[#2C2C2C]">{selectedOrder.createdByName}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main Orders List ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#2C2C2C] mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#B8860B]" />
              Purchase Orders
            </h1>
            <p className="text-[#6B6B6B] flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {branchDisplayName} Branch
              <span className="mx-2">&bull;</span>
              <span className="capitalize">{userRole.replace('-', ' ')}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-[#B8860B] text-white px-4 py-2 text-sm">
              {branchOrders.length} Total Orders
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-amber-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Pending Orders</p>
                  <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-emerald-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Completed</p>
                  <p className="text-2xl font-bold text-emerald-700">{completedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-700">{branchOrders.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#B8860B]/30 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-[#B8860B]">₹{totalRevenue.toLocaleString('en-IN')}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#B8860B]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs (Branch Admin gets Purchase History tab) */}
        {userRole === 'branch-admin' && (
          <div className="flex gap-2 border-b border-[#B8860B]/20 pb-0">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 font-semibold text-sm rounded-t-xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-white border-2 border-b-0 border-[#B8860B]/30 text-[#B8860B] shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#B8860B] hover:bg-[#FFF8F0]'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Active Orders
                {pendingCount > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-semibold text-sm rounded-t-xl transition-all ${
                activeTab === 'history'
                  ? 'bg-white border-2 border-b-0 border-[#B8860B]/30 text-[#B8860B] shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#B8860B] hover:bg-[#FFF8F0]'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Customer Purchase History
              </div>
            </button>
          </div>
        )}

        {/* Customer Purchase History (Branch Admin only) */}
        {activeTab === 'history' && userRole === 'branch-admin' ? (
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
              <CardTitle className="text-xl text-[#2C2C2C] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#B8860B]" />
                Customer Purchase History
              </CardTitle>
              <CardDescription>Complete order history for all customers at {branchDisplayName}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {customers.length > 0 ? (
                <div className="divide-y divide-[#B8860B]/10">
                  {customers.map((customer) => (
                    <div key={customer.name} className="p-6 hover:bg-[#FFF8F0]/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center text-white font-bold text-lg">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#2C2C2C] text-lg">{customer.name}</p>
                            <p className="text-sm text-[#6B6B6B] flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {customer.phone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#6B6B6B]">Total Spent</p>
                          <p className="text-xl font-bold text-[#B8860B]">₹{customer.totalSpent.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-[#6B6B6B]">{customer.orders.length} order(s)</p>
                        </div>
                      </div>
                      <div className="space-y-2 ml-15">
                        {customer.orders.map((order) => {
                          const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                          return (
                            <button
                              key={order.id}
                              onClick={() => setSelectedOrder(order)}
                              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-[#B8860B]/10 hover:border-[#B8860B]/30 hover:shadow-md transition-all text-left"
                            >
                              <div className="flex items-center gap-3">
                                <Receipt className="w-4 h-4 text-[#B8860B]" />
                                <div>
                                  <p className="font-medium text-[#2C2C2C] text-sm">{order.poNumber || order.id}</p>
                                  <p className="text-xs text-[#6B6B6B]">
                                    {order.createdAt instanceof Date
                                      ? order.createdAt.toLocaleDateString('en-IN')
                                      : new Date(order.createdAt).toLocaleDateString('en-IN')}
                                    {' '}&bull; {order.items.length} items
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className={`${sc.bgColor} ${sc.color} text-xs`}>{sc.label}</Badge>
                                <span className="font-bold text-[#B8860B]">₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}</span>
                                <Eye className="w-4 h-4 text-[#6B6B6B]" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 text-[#B8860B]/30 mx-auto mb-4" />
                  <p className="text-[#6B6B6B] text-lg">No customer purchase history yet</p>
                  <p className="text-[#6B6B6B]/70 text-sm mt-1">Orders placed from the store will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by customer name, PO number, or order ID..."
                  className="pl-11 bg-white border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] h-12"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#B8860B]" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] border-[#B8860B]/30 h-12">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <Card className="border-[#B8860B]/20">
                <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
                  <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    Active Orders ({activeOrders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#B8860B]/10">
                    {activeOrders.map((order) => {
                      const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                      const StatusIcon = sc.icon;
                      return (
                        <button
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="w-full flex items-center justify-between p-5 hover:bg-[#FFF8F0]/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B8860B]/10 to-[#DAA520]/10 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-[#B8860B]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-[#2C2C2C]">{order.poNumber || order.id}</p>
                                <Badge className={`${sc.bgColor} ${sc.color} text-xs`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {sc.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-[#6B6B6B]">
                                <span className="font-medium">{order.customerName}</span>
                                {order.customerPhone && ` &bull; ${order.customerPhone}`}
                              </p>
                              <p className="text-xs text-[#6B6B6B]">
                                {order.items.length} items &bull; {order.createdAt instanceof Date
                                  ? order.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                  : new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {order.paymentMode && ` \u2022 ${order.paymentMode.toUpperCase()}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xl font-bold text-[#B8860B]">₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <Eye className="w-5 h-5 text-[#6B6B6B]" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed/Cancelled Orders */}
            {completedOrders.length > 0 && (
              <Card className="border-[#B8860B]/20">
                <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
                  <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Completed & Closed ({completedOrders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#B8860B]/10">
                    {completedOrders.map((order) => {
                      const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.completed;
                      return (
                        <button
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="w-full flex items-center justify-between p-5 hover:bg-[#FFF8F0]/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-[#2C2C2C]">{order.poNumber || order.id}</p>
                                <Badge className={`${sc.bgColor} ${sc.color} text-xs`}>{sc.label}</Badge>
                              </div>
                              <p className="text-sm text-[#6B6B6B]">{order.customerName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-bold text-[#2C2C2C]">₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}</p>
                            <Eye className="w-5 h-5 text-[#6B6B6B]" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {filteredOrders.length === 0 && (
              <Card className="border-[#B8860B]/20">
                <CardContent className="py-16 text-center">
                  <FileText className="w-16 h-16 text-[#B8860B]/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">No Purchase Orders Found</h3>
                  <p className="text-[#6B6B6B]">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Orders placed from the store portal will appear here'}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};
