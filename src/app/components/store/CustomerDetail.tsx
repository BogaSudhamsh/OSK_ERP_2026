import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useApp } from '@/app/context/AppContext';
import type { Customer, Order } from '@/app/types';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Hash,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Clock,
  Package,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Receipt,
  Wallet,
  ArrowDownCircle,
  CircleDollarSign,
  X,
  Eye,
} from 'lucide-react';
import { OrderReceipt } from './OrderReceipt';

interface CustomerDetailProps {
  customerId: string;
  onBack: () => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId, onBack }) => {
  const { customers, orders, currentUser, updateOrder } = useApp();

  const [collectingOrderId, setCollectingOrderId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const customer = useMemo(() => customers.find(c => c.id === customerId), [customers, customerId]);

  const customerOrders = useMemo(() => {
    return orders
      .filter(o => o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, customerId]);

  const financialSummary = useMemo(() => {
    if (customerOrders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalAmountPaid: 0,
        totalAmountDue: 0,
        averageOrderValue: 0,
        lastPurchaseDate: null,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        paidOrders: 0,
        partialOrders: 0,
        unpaidOrders: 0,
        collectionRate: 0,
      };
    }

    const totalRevenue = customerOrders.reduce((sum, o) => sum + o.total, 0);
    const totalAmountPaid = customerOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
    const totalAmountDue = customerOrders.reduce((sum, o) => sum + (o.amountDue ?? (o.total - (o.amountPaid || 0))), 0);
    const completedOrders = customerOrders.filter(o => o.status === 'completed').length;
    const pendingOrders = customerOrders.filter(o => o.status === 'pending').length;
    const cancelledOrders = customerOrders.filter(o => o.status === 'cancelled').length;
    const paidOrders = customerOrders.filter(o => o.paymentStatus === 'paid').length;
    const partialOrders = customerOrders.filter(o => o.paymentStatus === 'partial').length;
    const unpaidOrders = customerOrders.filter(o => o.paymentStatus === 'pending' || (!o.paymentStatus && o.status !== 'cancelled')).length;
    const collectionRate = totalRevenue > 0 ? (totalAmountPaid / totalRevenue) * 100 : 0;

    return {
      totalOrders: customerOrders.length,
      totalRevenue,
      totalAmountPaid,
      totalAmountDue,
      averageOrderValue: totalRevenue / customerOrders.length,
      lastPurchaseDate: customerOrders[0]?.createdAt || null,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      paidOrders,
      partialOrders,
      unpaidOrders,
      collectionRate,
    };
  }, [customerOrders]);

  // Determine payment status of an order
  const getOrderPaymentStatus = (order: Order) => {
    if (order.paymentStatus === 'paid') return 'paid';
    if (order.paymentStatus === 'partial') return 'partial';
    if (order.amountPaid && order.amountPaid > 0 && order.amountPaid < order.total) return 'partial';
    if (order.amountPaid && order.amountPaid >= order.total) return 'paid';
    return 'pending';
  };

  const getOrderAmountDue = (order: Order) => {
    if (order.amountDue !== undefined) return order.amountDue;
    return order.total - (order.amountPaid || 0);
  };

  // Handle collecting remaining payment
  const handleCollectPayment = (orderId: string) => {
    const order = customerOrders.find(o => o.id === orderId);
    if (!order) return;
    const due = getOrderAmountDue(order);
    const amount = parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    if (amount > due) {
      toast.error(`Amount cannot exceed balance due (${formatCurrency(due)})`);
      return;
    }

    const newPaid = (order.amountPaid || 0) + amount;
    const newDue = order.total - newPaid;
    const newPaymentStatus = newDue <= 0 ? 'paid' : 'partial';

    // Build updated notes
    const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const collectedBy = currentUser?.name || 'Unknown';
    const noteEntry = `[${timestamp}] Collected ${formatCurrency(amount)} via ${getPaymentLabel(paymentMode)} by ${collectedBy}${paymentRef ? ` | Ref: ${paymentRef}` : ''}${paymentNotes ? ` | ${paymentNotes}` : ''}`;
    const existingNotes = order.orderNotes ? `${order.orderNotes}\n` : '';

    updateOrder(orderId, {
      amountPaid: newPaid,
      amountDue: newDue,
      paymentStatus: newPaymentStatus as 'paid' | 'partial' | 'pending',
      paymentReference: paymentRef || order.paymentReference,
      orderNotes: existingNotes + noteEntry,
    });

    toast.success(
      newPaymentStatus === 'paid'
        ? `Full payment collected! Order ${orderId} is now fully paid.`
        : `${formatCurrency(amount)} collected. Remaining: ${formatCurrency(newDue)}`
    );

    // Reset
    setCollectingOrderId(null);
    setPaymentAmount('');
    setPaymentMode('cash');
    setPaymentRef('');
    setPaymentNotes('');
  };

  if (!customer) {
    return (
      <div className="p-8 bg-[#FFF8F0] min-h-screen">
        <div className="flex flex-col items-center justify-center py-24">
          <User className="w-16 h-16 text-[#B8860B]/30 mb-4" />
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Customer Not Found</h2>
          <p className="text-[#6B6B6B] mb-6">The customer you're looking for doesn't exist.</p>
          <Button onClick={onBack} className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white border-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  const location = [customer.address, customer.city, customer.state, customer.pincode]
    .filter(Boolean)
    .join(', ');

  const branchLabel = customer.branchLocation
    ? customer.branchLocation.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'N/A';

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return { label: 'Delivered', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20', icon: CheckCircle2 };
      case 'pending':
        return { label: 'Pending', className: 'bg-amber-500/15 text-amber-700 border-amber-500/20', icon: Clock };
      case 'confirmed':
        return { label: 'Confirmed', className: 'bg-blue-500/15 text-blue-700 border-blue-500/20', icon: CheckCircle2 };
      case 'processing':
        return { label: 'Processing', className: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/20', icon: Package };
      case 'cancelled':
        return { label: 'Cancelled', className: 'bg-zinc-500/15 text-zinc-600 border-zinc-500/20', icon: XCircle };
      default:
        return { label: status, className: 'bg-zinc-100 text-zinc-600 border-zinc-200', icon: AlertCircle };
    }
  };

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Fully Paid', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20', icon: CheckCircle2 };
      case 'partial':
        return { label: 'Partial', className: 'bg-amber-500/15 text-amber-700 border-amber-500/20', icon: ArrowDownCircle };
      case 'pending':
      default:
        return { label: 'Unpaid', className: 'bg-orange-500/15 text-orange-700 border-orange-500/20', icon: AlertCircle };
    }
  };

  const getPaymentIcon = (mode?: string) => {
    switch (mode) {
      case 'cash': return Banknote;
      case 'upi': return Smartphone;
      case 'bank': return Building2;
      case 'cheque': return Receipt;
      case 'credit': return CreditCard;
      default: return CreditCard;
    }
  };

  const getPaymentLabel = (mode?: string) => {
    switch (mode) {
      case 'cash': return 'Cash';
      case 'upi': return 'UPI';
      case 'bank': return 'Bank Transfer';
      case 'cheque': return 'Cheque';
      case 'credit': return 'Credit';
      default: return 'N/A';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  };

  return (
    <div className="p-6 md:p-8 bg-[#FFF8F0] min-h-screen space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="border-[#B8860B]/30 text-[#1A1A1A] hover:bg-[#B8860B]/10 transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>
        <div className="h-6 w-px bg-[#B8860B]/20" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Customer Profile</h1>
          <p className="text-sm text-[#6B6B6B]">Complete customer details, financials and order history</p>
        </div>
      </div>

      {/* Top Section: Basic Info + Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information Card */}
        <Card className="lg:col-span-2 border-2 border-[#B8860B]/15 bg-white shadow-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B]" />
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar + Name block */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#B8860B] to-[#DAA520] rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-white text-2xl md:text-3xl font-bold">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] truncate">{customer.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 flex-shrink-0">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-[#6B6B6B] font-mono">{customer.id}</p>
                  {customer.branchLocation && (
                    <Badge variant="outline" className="mt-1 border-[#B8860B]/30 text-[#B8860B] text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      {branchLabel} Branch
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#B8860B]/10">
              <InfoRow icon={Phone} label="Phone Number" value={customer.phone} accent />
              <InfoRow icon={Mail} label="Email Address" value={customer.email || 'Not provided'} muted={!customer.email} />
              <InfoRow icon={MapPin} label="Location" value={location || 'Not provided'} muted={!location} />
              <InfoRow icon={Calendar} label="Registration Date" value={formatDate(customer.createdAt)} />
              <InfoRow icon={Building2} label="Branch" value={branchLabel} accent />
              <InfoRow icon={User} label="Status" value="Active" accent />
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary Card */}
        <Card className="border-2 border-[#B8860B]/15 bg-white shadow-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#DAA520] via-[#B8860B] to-[#DAA520]" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#B8860B]" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FinancialStat
              label="Total Revenue"
              value={formatCurrency(financialSummary.totalRevenue)}
              icon={IndianRupee}
              highlight
            />
            <FinancialStat
              label="Amount Collected"
              value={formatCurrency(financialSummary.totalAmountPaid)}
              icon={Wallet}
              variant="success"
            />
            <FinancialStat
              label="Outstanding Balance"
              value={formatCurrency(financialSummary.totalAmountDue)}
              icon={CircleDollarSign}
              variant={financialSummary.totalAmountDue > 0 ? 'warning' : 'default'}
            />
            <FinancialStat
              label="Collection Rate"
              value={`${financialSummary.collectionRate.toFixed(1)}%`}
              icon={TrendingUp}
            />
            <FinancialStat
              label="Total Orders"
              value={String(financialSummary.totalOrders)}
              icon={ShoppingBag}
            />
            <FinancialStat
              label="Avg Order Value"
              value={formatCurrency(Math.round(financialSummary.averageOrderValue))}
              icon={TrendingUp}
            />
            <FinancialStat
              label="Last Purchase"
              value={financialSummary.lastPurchaseDate ? formatDate(financialSummary.lastPurchaseDate) : 'No orders yet'}
              icon={Calendar}
            />

            {/* Order Status Breakdown */}
            <div className="pt-3 border-t border-[#B8860B]/10">
              <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-3 font-semibold">Order Status</p>
              <div className="space-y-2">
                <StatusBar label="Completed" count={financialSummary.completedOrders} total={financialSummary.totalOrders} color="bg-emerald-500" />
                <StatusBar label="Pending" count={financialSummary.pendingOrders} total={financialSummary.totalOrders} color="bg-amber-500" />
                <StatusBar label="Cancelled" count={financialSummary.cancelledOrders} total={financialSummary.totalOrders} color="bg-zinc-400" />
              </div>
            </div>

            {/* Payment Status Breakdown */}
            <div className="pt-3 border-t border-[#B8860B]/10">
              <p className="text-xs uppercase tracking-wider text-[#6B6B6B] mb-3 font-semibold">Payment Status</p>
              <div className="space-y-2">
                <StatusBar label="Fully Paid" count={financialSummary.paidOrders} total={financialSummary.totalOrders} color="bg-emerald-500" />
                <StatusBar label="Partial" count={financialSummary.partialOrders} total={financialSummary.totalOrders} color="bg-amber-500" />
                <StatusBar label="Unpaid" count={financialSummary.unpaidOrders} total={financialSummary.totalOrders} color="bg-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Balance Alert */}
      {financialSummary.totalAmountDue > 0 && (
        <Card className="border-2 border-amber-400/40 bg-gradient-to-r from-amber-50 to-amber-50/30 shadow-md overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Wallet className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A1A] text-lg">Outstanding Balance</h3>
                  <p className="text-sm text-[#6B6B6B]">
                    {financialSummary.partialOrders + financialSummary.unpaidOrders} order(s) with pending payments
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(financialSummary.totalAmountDue)}</p>
                <p className="text-xs text-[#6B6B6B]">Total balance due</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order History Section */}
      <Card className="border-2 border-[#B8860B]/15 bg-white shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#B8860B]/40 via-[#DAA520]/60 to-[#B8860B]/40" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#B8860B]" />
              Order History
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-[#B8860B]/10 text-[#B8860B] font-semibold">
                {customerOrders.length}
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {customerOrders.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="w-12 h-12 text-[#B8860B]/20 mx-auto mb-3" />
              <p className="text-[#6B6B6B] font-medium">No orders found for this customer</p>
              <p className="text-sm text-[#6B6B6B]/70 mt-1">Orders will appear here once the customer makes a purchase.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;
                const PaymentIcon = getPaymentIcon(order.paymentMode);
                const paymentStatus = getOrderPaymentStatus(order);
                const paymentStatusConfig = getPaymentStatusConfig(paymentStatus);
                const PaymentStatusIcon = paymentStatusConfig.icon;
                const amountDue = getOrderAmountDue(order);
                const amountPaid = order.amountPaid || 0;
                const isCollecting = collectingOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    className="rounded-xl border-2 border-[#B8860B]/10 hover:border-[#B8860B]/25 bg-[#FEFCF8] hover:bg-white transition-all duration-200 overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="p-4 md:p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#1A1A1A] font-mono text-sm">{order.id}</span>
                          {order.poNumber && (
                            <span className="text-xs text-[#6B6B6B] bg-[#B8860B]/5 px-2 py-0.5 rounded font-mono">
                              {order.poNumber}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.className}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${paymentStatusConfig.className}`}>
                            <PaymentStatusIcon className="w-3 h-3" />
                            {paymentStatusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#6B6B6B]">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(order.createdAt)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <PaymentIcon className="w-3.5 h-3.5" />
                            {getPaymentLabel(order.paymentMode)}
                          </span>
                        </div>
                      </div>

                      {/* Order Items Table */}
                      <div className="rounded-lg overflow-hidden border border-[#B8860B]/10">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[#B8860B]/5">
                              <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Product</th>
                              <th className="text-center px-3 py-2 text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold hidden sm:table-cell">Category</th>
                              <th className="text-center px-3 py-2 text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Qty</th>
                              <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Rate</th>
                              <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx} className="border-t border-[#B8860B]/5">
                                <td className="px-3 py-2.5 text-[#1A1A1A] font-medium">{item.productName}</td>
                                <td className="px-3 py-2.5 text-center text-[#6B6B6B] hidden sm:table-cell">
                                  {item.category && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-[#B8860B]/5 text-[#B8860B]">{item.category}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center text-[#1A1A1A]">{item.quantity}</td>
                                <td className="px-3 py-2.5 text-right text-[#6B6B6B]">{formatCurrency(item.price)}</td>
                                <td className="px-3 py-2.5 text-right font-semibold text-[#1A1A1A]">{formatCurrency(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Order Totals + Payment Summary */}
                      <div className="flex flex-col sm:flex-row justify-between mt-3 gap-4">
                        {/* Payment Breakdown (left) */}
                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs text-[#6B6B6B]">Paid:</span>
                            <span className="text-sm font-semibold text-emerald-700">{formatCurrency(amountPaid)}</span>
                          </div>
                          {amountDue > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500" />
                              <span className="text-xs text-[#6B6B6B]">Due:</span>
                              <span className="text-sm font-semibold text-amber-700">{formatCurrency(amountDue)}</span>
                            </div>
                          )}
                          {order.paymentReference && (
                            <span className="text-xs text-[#6B6B6B] font-mono">Ref: {order.paymentReference}</span>
                          )}
                        </div>

                        {/* Totals (right) */}
                        <div className="w-full sm:w-64 space-y-1 text-sm">
                          <div className="flex justify-between text-[#6B6B6B]">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                          </div>
                          {order.discountAmount && order.discountAmount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                              <span>Discount</span>
                              <span>-{formatCurrency(order.discountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[#6B6B6B]">
                            <span>GST</span>
                            <span>{formatCurrency(order.gst)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-[#1A1A1A] pt-1.5 border-t border-[#B8860B]/15">
                            <span>Grand Total</span>
                            <span className="text-[#B8860B]">{formatCurrency(order.total)}</span>
                          </div>
                          {amountDue > 0 && (
                            <div className="flex justify-between font-bold text-amber-700 pt-1 border-t border-amber-200">
                              <span>Balance Due</span>
                              <span>{formatCurrency(amountDue)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Notes */}
                      {order.orderNotes && (
                        <div className="mt-3 p-3 bg-[#B8860B]/5 rounded-lg border border-[#B8860B]/10">
                          <p className="text-xs uppercase tracking-wider text-[#6B6B6B] font-semibold mb-1">Notes</p>
                          <p className="text-sm text-[#1A1A1A] whitespace-pre-line">{order.orderNotes}</p>
                        </div>
                      )}

                      {/* Collect Payment Action */}
                      {amountDue > 0 && order.status !== 'cancelled' && (
                        <div className="mt-4">
                          {!isCollecting ? (
                            <Button
                              onClick={() => {
                                setCollectingOrderId(order.id);
                                setPaymentAmount('');
                                setPaymentMode('cash');
                                setPaymentRef('');
                                setPaymentNotes('');
                              }}
                              className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 border-0"
                            >
                              <Wallet className="w-4 h-4 mr-2" />
                              Collect Remaining Payment ({formatCurrency(amountDue)})
                            </Button>
                          ) : (
                            <div className="border-2 border-[#B8860B]/25 rounded-xl p-5 bg-gradient-to-br from-[#FFF8F0] to-white space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-[#1A1A1A] flex items-center gap-2">
                                  <Wallet className="w-5 h-5 text-[#B8860B]" />
                                  Collect Payment — {order.id}
                                </h4>
                                <Button
                                  onClick={() => setCollectingOrderId(null)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#6B6B6B] hover:text-[#1A1A1A]"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Due summary */}
                              <div className="flex items-center gap-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div>
                                  <p className="text-xs text-[#6B6B6B]">Order Total</p>
                                  <p className="font-bold text-[#1A1A1A]">{formatCurrency(order.total)}</p>
                                </div>
                                <div className="h-8 w-px bg-amber-300" />
                                <div>
                                  <p className="text-xs text-[#6B6B6B]">Already Paid</p>
                                  <p className="font-bold text-emerald-700">{formatCurrency(amountPaid)}</p>
                                </div>
                                <div className="h-8 w-px bg-amber-300" />
                                <div>
                                  <p className="text-xs text-[#6B6B6B]">Balance Due</p>
                                  <p className="font-bold text-amber-700">{formatCurrency(amountDue)}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Amount */}
                                <div>
                                  <Label className="text-[#1A1A1A] text-sm">Amount Received</Label>
                                  <div className="flex gap-2 mt-1">
                                    <div className="relative flex-1">
                                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                                      <Input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="0"
                                        className="pl-10 bg-white border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => setPaymentAmount(String(amountDue))}
                                      variant="outline"
                                      size="sm"
                                      className="border-[#B8860B]/30 text-[#B8860B] hover:bg-[#B8860B]/10 whitespace-nowrap text-xs h-10"
                                    >
                                      Full Amt
                                    </Button>
                                  </div>
                                </div>

                                {/* Payment Mode */}
                                <div>
                                  <Label className="text-[#1A1A1A] text-sm">Payment Mode</Label>
                                  <div className="flex gap-1.5 mt-1 flex-wrap">
                                    {[
                                      { key: 'cash', label: 'Cash', icon: Banknote },
                                      { key: 'upi', label: 'UPI', icon: Smartphone },
                                      { key: 'bank', label: 'Bank', icon: Building2 },
                                      { key: 'cheque', label: 'Cheque', icon: Receipt },
                                    ].map(m => (
                                      <Button
                                        key={m.key}
                                        onClick={() => setPaymentMode(m.key)}
                                        variant="outline"
                                        size="sm"
                                        className={`text-xs h-10 transition-all ${
                                          paymentMode === m.key
                                            ? 'bg-[#B8860B] text-white border-[#B8860B] hover:bg-[#DAA520]'
                                            : 'border-[#B8860B]/20 text-[#6B6B6B] hover:bg-[#B8860B]/10'
                                        }`}
                                      >
                                        <m.icon className="w-3.5 h-3.5 mr-1" />
                                        {m.label}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* Reference */}
                                <div>
                                  <Label className="text-[#1A1A1A] text-sm">Payment Reference</Label>
                                  <Input
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                    placeholder="Transaction ID / Receipt No."
                                    className="mt-1 bg-white border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                                  />
                                </div>

                                {/* Notes */}
                                <div>
                                  <Label className="text-[#1A1A1A] text-sm">Notes</Label>
                                  <Textarea
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="Collection notes..."
                                    rows={2}
                                    className="mt-1 bg-white border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                                  />
                                </div>
                              </div>

                              {/* Live Preview */}
                              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-emerald-700">After this payment:</span>
                                    <span className="font-bold text-emerald-800">
                                      {amountDue - parseFloat(paymentAmount) <= 0
                                        ? 'Fully Paid'
                                        : `${formatCurrency(amountDue - parseFloat(paymentAmount))} remaining`}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-3">
                                <Button
                                  onClick={() => handleCollectPayment(order.id)}
                                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                                  className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 border-0 disabled:opacity-50 disabled:scale-100"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Confirm Collection
                                  {paymentAmount && parseFloat(paymentAmount) > 0 && (
                                    <span className="ml-1">({formatCurrency(parseFloat(paymentAmount))})</span>
                                  )}
                                </Button>
                                <Button
                                  onClick={() => setCollectingOrderId(null)}
                                  variant="outline"
                                  className="border-[#B8860B]/30 text-[#1A1A1A] hover:bg-[#B8860B]/10"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order Actions */}
                      <div className="mt-4 flex gap-3">
                        <Button
                          onClick={() => setReceiptOrder(order)}
                          variant="outline"
                          size="sm"
                          className="border-[#B8860B]/30 text-[#1A1A1A] hover:bg-[#B8860B]/10"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      {receiptOrder && (
        <OrderReceipt
          order={receiptOrder}
          open={!!receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
};

/* ---------- Sub-components ---------- */

const InfoRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}> = ({ icon: Icon, label, value, accent, muted }) => (
  <div className="flex items-start gap-3">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ? 'bg-[#B8860B]/10' : 'bg-zinc-100'}`}>
      <Icon className={`w-4 h-4 ${accent ? 'text-[#B8860B]' : 'text-[#6B6B6B]'}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-[#6B6B6B] uppercase tracking-wider font-medium mb-0.5">{label}</p>
      <p className={`text-sm font-medium truncate ${muted ? 'text-[#6B6B6B]/50 italic' : 'text-[#1A1A1A]'}`}>{value}</p>
    </div>
  </div>
);

const FinancialStat: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  highlight?: boolean;
  variant?: 'default' | 'success' | 'warning';
}> = ({ label, value, icon: Icon, highlight, variant = 'default' }) => {
  const bgClass = highlight
    ? 'bg-gradient-to-r from-[#B8860B]/10 to-[#DAA520]/5 border border-[#B8860B]/15'
    : variant === 'success'
    ? 'bg-emerald-50 border border-emerald-200/50'
    : variant === 'warning'
    ? 'bg-amber-50 border border-amber-200/50'
    : 'bg-zinc-50';

  const iconBg = highlight
    ? 'bg-[#B8860B]/15'
    : variant === 'success'
    ? 'bg-emerald-100'
    : variant === 'warning'
    ? 'bg-amber-100'
    : 'bg-white border border-zinc-200';

  const iconColor = highlight
    ? 'text-[#B8860B]'
    : variant === 'success'
    ? 'text-emerald-600'
    : variant === 'warning'
    ? 'text-amber-600'
    : 'text-[#6B6B6B]';

  const valueColor = highlight
    ? 'text-[#B8860B]'
    : variant === 'success'
    ? 'text-emerald-700'
    : variant === 'warning'
    ? 'text-amber-700'
    : 'text-[#1A1A1A]';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${bgClass}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-[#6B6B6B] font-medium">{label}</p>
        <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
};

const StatusBar: React.FC<{
  label: string;
  count: number;
  total: number;
  color: string;
}> = ({ label, count, total, color }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#6B6B6B] w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[#1A1A1A] w-6 text-right">{count}</span>
    </div>
  );
};