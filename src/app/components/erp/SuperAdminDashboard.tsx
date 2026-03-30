import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  ShoppingCart,
  IndianRupee,
  ArrowLeftRight,
  Truck,
  XCircle,
  Eye,
  Layers,
  Star,
  Activity,
  CircleDollarSign,
  Wallet,
  UserCheck,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { motion } from 'motion/react';
import { useApp } from '@/app/context/AppContext';


interface SuperAdminDashboardProps {
  onNavigate?: (screen: string, branchId?: string) => void;
}

const BRANCH_COLORS: Record<string, { primary: string; light: string; label: string }> = {
  'branch-1': { primary: '#3B82F6', light: '#DBEAFE', label: 'Aziz Nagar' },
  'branch-2': { primary: '#8B5CF6', light: '#EDE9FE', label: 'Vikarabad' },
  'branch-3': { primary: '#10B981', light: '#D1FAE5', label: 'Sangareddy' },
};

const toTitleCase = (value: string) =>
  value
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getBranchDisplayName = (branch: { id: string; name?: string; location?: string }) =>
  branch.name?.trim() || BRANCH_COLORS[branch.id]?.label || (branch.location ? toTitleCase(branch.location) : branch.id);

const formatCurrency = (val: number) => {
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString('en-IN')}`;
};

const PIE_COLORS = ['#B8860B', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onNavigate }) => {
  const {
    branchStock,
    branches,
    orders,
    branchTransfers,
    pendingBills,
    customers,
    products,
    dealers,
    leads,
    stockMovements,
  } = useApp();



  // ═══════════════════════════════════════════════════════════════════════════
  //  MASTER METRICS — computed from LIVE context data
  // ═══════════════════════════════════════════════════════════════════════════
  const metrics = useMemo(() => {
    // ── Per-branch breakdown ────────────────────────────────────────────────
    const branchData = branches.map(branch => {
      const bStock = branchStock.filter(bs => bs.branchId === branch.id);
      const bOrders = orders.filter(o => o.branchId === branch.id || o.branchLocation === branch.location);
      const bTransfersOut = branchTransfers.filter(t => t.fromBranchId === branch.id);
      const bTransfersIn = branchTransfers.filter(t => t.toBranchId === branch.id);
      const bBills = pendingBills.filter(pb => pb.targetBranches.includes(branch.location as any));
      const bCustomers = customers.filter(c => c.branchId === branch.id || c.storeId === branch.id);
      const bLeads = leads.filter(l => (l as any).branchId === branch.id);

      // Stock
      const totalActualStock = bStock.reduce((s, bs) => s + bs.freshQuantity, 0);
      const totalFreshStock = bStock.reduce((s, bs) => s + bs.freshQuantity, 0);
      const totalBrokenStock = bStock.reduce((s, bs) => s + bs.brokenQuantity, 0);
      const inventoryValue = bStock.reduce((s, bs) => s + (bs.freshQuantity * bs.costPrice), 0);
      const retailValue = bStock.reduce((s, bs) => s + (bs.freshQuantity * bs.mrp), 0);
      const lowStockItems = bStock.filter(bs => bs.freshQuantity > 0 && bs.freshQuantity < 20).length;
      const outOfStockItems = bStock.filter(bs => bs.freshQuantity === 0).length;
      const uniqueProducts = bStock.length;
      const brokenValue = bStock.reduce((s, bs) => s + (bs.brokenQuantity * bs.costPrice), 0);

      // Category breakdown
      const categories = bStock.reduce((acc, bs) => {
        if (!acc[bs.category]) acc[bs.category] = { qty: 0, value: 0 };
        acc[bs.category].qty += bs.freshQuantity;
        acc[bs.category].value += bs.freshQuantity * bs.costPrice;
        return acc;
      }, {} as Record<string, { qty: number; value: number }>);

      // Orders
      const totalOrders = bOrders.length;
      const completedOrders = bOrders.filter(o => o.status === 'completed').length;
      const pendingOrders = bOrders.filter(o => o.status === 'pending').length;
      const processingOrders = bOrders.filter(o => o.status === 'processing' || o.status === 'confirmed').length;
      const cancelledOrders = bOrders.filter(o => o.status === 'cancelled').length;
      const revenue = bOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
      const collected = bOrders.reduce((s, o) => s + (o.amountPaid || 0), 0);
      const due = bOrders.reduce((s, o) => s + (o.amountDue || 0), 0);
      const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
      const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

      // Transfers
      const pendingInbound = bTransfersIn.filter(t => t.status !== 'received' && t.status !== 'rejected').length;
      const pendingOutbound = bTransfersOut.filter(t => t.status !== 'received' && t.status !== 'rejected').length;

      // Bills
      const totalBillAmount = bBills.reduce((s, b) => s + b.totalAmount, 0);
      const totalBillPaid = bBills.reduce((s, b) => s + b.totalPaid, 0);
      const totalBillRemaining = bBills.reduce((s, b) => s + b.remainingAmount, 0);

      return {
        branch,
        stock: { totalActualStock, totalFreshStock, totalBrokenStock, inventoryValue, retailValue, lowStockItems, outOfStockItems, uniqueProducts, brokenValue, categories },
        orders: { totalOrders, completedOrders, pendingOrders, processingOrders, cancelledOrders, revenue, collected, due, completionRate, avgOrderValue },
        transfers: { pendingInbound, pendingOutbound },
        financial: { totalBillAmount, totalBillPaid, totalBillRemaining },
        customerCount: bCustomers.length,
        leadCount: bLeads.length,
      };
    });

    // ── Global aggregates ───────────────────────────────────────────────────
    const totalInventoryValue = branchData.reduce((s, m) => s + m.stock.inventoryValue, 0);
    const totalRetailValue = branchData.reduce((s, m) => s + m.stock.retailValue, 0);
    const totalStock = branchData.reduce((s, m) => s + m.stock.totalActualStock, 0);
    const totalBroken = branchData.reduce((s, m) => s + m.stock.totalBrokenStock, 0);
    const totalBrokenValue = branchData.reduce((s, m) => s + m.stock.brokenValue, 0);
    const totalRevenue = branchData.reduce((s, m) => s + m.orders.revenue, 0);
    const totalCollected = branchData.reduce((s, m) => s + m.orders.collected, 0);
    const totalDue = branchData.reduce((s, m) => s + m.orders.due, 0);
    const totalOrders = branchData.reduce((s, m) => s + m.orders.totalOrders, 0);
    const totalCompleted = branchData.reduce((s, m) => s + m.orders.completedOrders, 0);
    const totalPendingBillAmt = branchData.reduce((s, m) => s + m.financial.totalBillRemaining, 0);
    const totalBillAmt = branchData.reduce((s, m) => s + m.financial.totalBillAmount, 0);
    const totalBillPaid = branchData.reduce((s, m) => s + m.financial.totalBillPaid, 0);
    const collectionEfficiency = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;
    const overallCompletionRate = totalOrders > 0 ? Math.round((totalCompleted / totalOrders) * 100) : 0;
    const potentialMargin = totalRetailValue - totalInventoryValue;
    const totalLowStock = branchData.reduce((s, m) => s + m.stock.lowStockItems, 0);
    const totalOutOfStock = branchData.reduce((s, m) => s + m.stock.outOfStockItems, 0);

    // Transfer stats
    const pendingTransfers = branchTransfers.filter(t => t.status !== 'received' && t.status !== 'rejected').length;
    const completedTransfers = branchTransfers.filter(t => t.status === 'received').length;

    // Top customers by order value
    const customerOrderMap: Record<string, { name: string; total: number; orders: number; branch: string }> = {};
    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      if (!customerOrderMap[o.customerId]) {
        customerOrderMap[o.customerId] = { name: o.customerName, total: 0, orders: 0, branch: o.branchLocation || '' };
      }
      customerOrderMap[o.customerId].total += o.total;
      customerOrderMap[o.customerId].orders += 1;
    });
    const topCustomers = Object.entries(customerOrderMap)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }));

    // Top products by stock value
    const productValueMap: Record<string, { name: string; qty: number; value: number }> = {};
    branchStock.forEach(bs => {
      if (!productValueMap[bs.productId]) productValueMap[bs.productId] = { name: bs.productName, qty: 0, value: 0 };
      productValueMap[bs.productId].qty += bs.freshQuantity;
      productValueMap[bs.productId].value += bs.freshQuantity * bs.costPrice;
    });
    const topProducts = Object.values(productValueMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Outstanding dealer payments
    const dealerMap: Record<string, { name: string; totalPending: number; billCount: number }> = {};
    pendingBills.forEach(bill => {
      if (bill.remainingAmount <= 0) return;
      if (!dealerMap[bill.dealerId]) dealerMap[bill.dealerId] = { name: bill.dealerName, totalPending: 0, billCount: 0 };
      dealerMap[bill.dealerId].totalPending += bill.remainingAmount;
      dealerMap[bill.dealerId].billCount++;
    });
    const outstandingDealers = Object.entries(dealerMap)
      .sort(([, a], [, b]) => b.totalPending - a.totalPending)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }));

    // Action items count
    const actionItems = totalLowStock + totalOutOfStock + pendingTransfers +
      orders.filter(o => o.status === 'pending').length +
      pendingBills.filter(b => b.status === 'pending').length;

    return {
      branchData,
      totals: {
        totalInventoryValue, totalRetailValue, totalStock, totalBroken, totalBrokenValue,
        totalRevenue, totalCollected, totalDue, totalOrders, totalCompleted,
        totalPendingBillAmt, totalBillAmt, totalBillPaid,
        collectionEfficiency, overallCompletionRate, potentialMargin,
        totalLowStock, totalOutOfStock, pendingTransfers, completedTransfers,
        totalCustomers: customers.length, totalDealers: dealers.length,
        totalLeads: leads.length, totalProducts: products.length,
        actionItems,
      },
      topCustomers,
      topProducts,
      outstandingDealers,
    };
  }, [branchStock, branches, orders, branchTransfers, pendingBills, customers, products, dealers, leads, stockMovements]);

  // ── Chart Data ──────────────────────────────────────────────────────────
  const revenueChartData = metrics.branchData.map(m => ({
    name: getBranchDisplayName(m.branch),
    Revenue: m.orders.revenue,
    Collected: m.orders.collected,
    Due: m.orders.due,
  }));

  const stockChartData = metrics.branchData.map(m => ({
    name: getBranchDisplayName(m.branch),
    Fresh: m.stock.totalFreshStock,
    Broken: m.stock.totalBrokenStock,
    Total: m.stock.totalActualStock,
  }));

  const orderStatusPie = [
    { name: 'Completed', value: metrics.totals.totalCompleted },
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
    { name: 'Processing', value: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length },
    { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white border border-[#B8860B]/20 rounded-xl p-3 shadow-lg">
        <p className="text-xs font-semibold text-[#2C2C2C] mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{typeof p.value === 'number' ? (p.value > 999 ? formatCurrency(p.value) : p.value) : p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  const { totals: t } = metrics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0]">
      {/* ═══ Header ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-[#B8860B]/20 shadow-sm">
        <div className="w-full px-4 lg:px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-[#B8860B]" />
                Super Admin Command Center
              </h1>
              <p className="text-[#6B6B6B] mt-1">
                Real-time intelligence across all {branches.length} branches • {t.totalProducts} products • {t.totalCustomers} customers
              </p>
            </div>
            <div className="flex items-center gap-3">
              {t.actionItems > 0 && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  {t.actionItems} Action Items
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-[#6B6B6B]">
                <Clock className="w-3.5 h-3.5" />
                Live Data
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 lg:px-6 py-6 space-y-6">
        {/* ═══ Section 1: GLOBAL FINANCIAL KPIs ═══════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: 'Total Revenue', value: formatCurrency(t.totalRevenue), icon: IndianRupee, gradient: 'from-[#B8860B] to-[#DAA520]', sub: `${t.totalOrders} orders` },
            { label: 'Collected', value: formatCurrency(t.totalCollected), icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', sub: `${t.collectionEfficiency}% efficiency` },
            { label: 'Amount Due', value: formatCurrency(t.totalDue), icon: Clock, gradient: 'from-amber-500 to-amber-600', sub: 'from customers' },
            { label: 'Inventory Value', value: formatCurrency(t.totalInventoryValue), icon: Package, gradient: 'from-blue-500 to-blue-600', sub: `${t.totalStock.toLocaleString('en-IN')} units` },
            { label: 'Dealer Pending', value: formatCurrency(t.totalPendingBillAmt), icon: Wallet, gradient: 'from-purple-500 to-purple-600', sub: `${metrics.outstandingDealers.length} dealers` },
            { label: 'Potential Margin', value: formatCurrency(t.potentialMargin), icon: TrendingUp, gradient: 'from-teal-500 to-teal-600', sub: 'retail - cost' },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-[#B8860B]/20 hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${kpi.gradient} flex items-center justify-center mb-2.5`}>
                      <Icon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <p className="text-xl font-bold text-[#2C2C2C]">{kpi.value}</p>
                    <p className="text-[11px] text-[#6B6B6B] mt-0.5">{kpi.label}</p>
                    <p className="text-[10px] text-[#B8860B] mt-1">{kpi.sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* ═══ Section 2: BRANCH PERFORMANCE CARDS ═══════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#2C2C2C] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#B8860B]" />
              Branch-wise Performance
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="border-[#B8860B]/30 hover:bg-[#FFF8F0] text-[#B8860B] text-xs"
              onClick={() => onNavigate?.('branch-comparison')}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Full Reports
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {metrics.branchData.map((m, i) => {
              const color = BRANCH_COLORS[m.branch.id];
              return (
                <motion.div
                  key={m.branch.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-[#B8860B]/20 hover:shadow-lg transition-all overflow-hidden">
                    <div className="h-1.5" style={{ background: `linear-gradient(to right, ${color?.primary}, ${color?.primary}80)` }} />
                    <CardContent className="p-5 space-y-4">
                      {/* Branch header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color?.light }}>
                            <Building2 className="w-5 h-5" style={{ color: color?.primary }} />
                          </div>
                          <div>
                            <p className="font-bold text-[#2C2C2C]">{getBranchDisplayName(m.branch)}</p>
                            <p className="text-[10px] text-[#6B6B6B]">
                              {toTitleCase(m.branch.location)} • {m.branch.manager} • {m.stock.uniqueProducts} products
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Active</Badge>
                      </div>

                      {/* Key metrics grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#FFF8F0] p-2.5 rounded-lg text-center">
                          <p className="text-[10px] text-[#6B6B6B]">Revenue</p>
                          <p className="text-sm font-bold text-[#B8860B]">{formatCurrency(m.orders.revenue)}</p>
                        </div>
                        <div className="bg-blue-50 p-2.5 rounded-lg text-center">
                          <p className="text-[10px] text-[#6B6B6B]">Stock Units</p>
                          <p className="text-sm font-bold text-blue-700">{m.stock.totalActualStock.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-lg text-center">
                          <p className="text-[10px] text-[#6B6B6B]">Inv. Value</p>
                          <p className="text-sm font-bold text-emerald-700">{formatCurrency(m.stock.inventoryValue)}</p>
                        </div>
                      </div>

                      {/* Orders breakdown */}
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-[#6B6B6B]">Orders:</span>
                        <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] px-1.5">{m.orders.completedOrders} done</Badge>
                        <Badge className="bg-amber-50 text-amber-700 border-none text-[10px] px-1.5">{m.orders.pendingOrders} pending</Badge>
                        <Badge className="bg-blue-50 text-blue-700 border-none text-[10px] px-1.5">{m.orders.processingOrders} active</Badge>
                        {m.orders.cancelledOrders > 0 && (
                          <Badge className="bg-gray-100 text-gray-600 border-none text-[10px] px-1.5">{m.orders.cancelledOrders} cancelled</Badge>
                        )}
                      </div>

                      {/* Financial row */}
                      <div className="grid grid-cols-2 gap-3 text-xs border-t border-[#B8860B]/10 pt-3">
                        <div>
                          <p className="text-[#6B6B6B]">Collected</p>
                          <p className="font-semibold text-emerald-700">{formatCurrency(m.orders.collected)}</p>
                        </div>
                        <div>
                          <p className="text-[#6B6B6B]">Customer Due</p>
                          <p className="font-semibold text-amber-700">{formatCurrency(m.orders.due)}</p>
                        </div>
                        <div>
                          <p className="text-[#6B6B6B]">Dealer Bill Pending</p>
                          <p className="font-semibold text-purple-700">{formatCurrency(m.financial.totalBillRemaining)}</p>
                        </div>
                        <div>
                          <p className="text-[#6B6B6B]">Completion Rate</p>
                          <p className="font-semibold text-[#2C2C2C]">{m.orders.completionRate}%</p>
                        </div>
                      </div>

                      {/* Alerts */}
                      {(m.stock.lowStockItems > 0 || m.stock.totalBrokenStock > 0 || m.stock.outOfStockItems > 0 || m.transfers.pendingInbound > 0) && (
                        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#B8860B]/10 pt-3">
                          {m.stock.lowStockItems > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-2.5 h-2.5" />{m.stock.lowStockItems} low stock
                            </span>
                          )}
                          {m.stock.outOfStockItems > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                              <XCircle className="w-2.5 h-2.5" />{m.stock.outOfStockItems} out of stock
                            </span>
                          )}
                          {m.stock.totalBrokenStock > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-[#FFF8F0] text-[#B8860B] px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-2.5 h-2.5" />{m.stock.totalBrokenStock} broken
                            </span>
                          )}
                          {m.transfers.pendingInbound > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                              <Truck className="w-2.5 h-2.5" />{m.transfers.pendingInbound} transfer incoming
                            </span>
                          )}
                        </div>
                      )}

                      {/* Category chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(m.stock.categories).map(([cat, data]) => (
                          <span key={cat} className="text-[10px] bg-gray-50 text-[#6B6B6B] px-2 py-0.5 rounded-full capitalize">
                            {cat}: {data.qty.toLocaleString('en-IN')} units
                          </span>
                        ))}
                      </div>

                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white text-xs"
                        onClick={() => onNavigate?.('branch-detail', m.branch.id)}
                      >
                        View Full Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ═══ Section 3: CHARTS ROW ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue by Branch */}
          <Card className="border-[#B8860B]/20 lg:col-span-2">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <IndianRupee className="w-4 h-4 text-[#B8860B]" />
                Revenue & Collection by Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueChartData} barGap={2}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#B8860B20" />
                  <XAxis key="xaxis" dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 11 }} />
                  <YAxis key="yaxis" tick={{ fill: '#6B6B6B', fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip key="tooltip" content={<CustomTooltip />} />
                  <Legend key="legend" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar key="bar-revenue" dataKey="Revenue" fill="#B8860B" radius={[4, 4, 0, 0]} />
                  <Bar key="bar-collected" dataKey="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar key="bar-due" dataKey="Due" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status Pie */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShoppingCart className="w-4 h-4 text-[#B8860B]" />
                Order Status ({t.totalOrders})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    key="pie-orders"
                    data={orderStatusPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {orderStatusPie.map((entry, i) => (
                      <Cell key={`cell-${entry.name}`} fill={['#10B981', '#F59E0B', '#3B82F6', '#6B7280'][i]} />
                    ))}
                  </Pie>
                  <Tooltip key="pie-tooltip" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Section 4: STOCK HEALTH + TRANSFERS ═════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Chart */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-[#B8860B]" />
                Stock Health by Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stockChartData} barGap={2}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#B8860B20" />
                  <XAxis key="xaxis" dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 11 }} />
                  <YAxis key="yaxis" tick={{ fill: '#6B6B6B', fontSize: 10 }} />
                  <Tooltip key="tooltip" content={<CustomTooltip />} />
                  <Legend key="legend" wrapperStyle={{ fontSize: '11px' }} />
                  <Bar key="bar-fresh" dataKey="Fresh" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar key="bar-broken" dataKey="Broken" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#B8860B]/10 text-xs">
                <span className="text-[#6B6B6B]">
                  Total: <span className="font-bold text-[#2C2C2C]">{t.totalStock.toLocaleString('en-IN')} units</span>
                </span>
                {t.totalBroken > 0 && (
                  <span className="text-amber-700">
                    Broken: {t.totalBroken.toLocaleString('en-IN')} ({formatCurrency(t.totalBrokenValue)})
                  </span>
                )}
                {t.totalLowStock > 0 && (
                  <span className="text-orange-700">
                    {t.totalLowStock} products low stock
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transfer Activity */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ArrowLeftRight className="w-4 h-4 text-[#B8860B]" />
                  Inter-Branch Transfers
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#B8860B] text-xs"
                  onClick={() => onNavigate?.('stock-transfer')}
                >
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-amber-50 rounded-xl text-center">
                  <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-amber-700">{t.pendingTransfers}</p>
                  <p className="text-[10px] text-[#6B6B6B]">In Progress</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-emerald-700">{t.completedTransfers}</p>
                  <p className="text-[10px] text-[#6B6B6B]">Completed</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <ArrowLeftRight className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xl font-bold text-blue-700">{branchTransfers.length}</p>
                  <p className="text-[10px] text-[#6B6B6B]">Total</p>
                </div>
              </div>

              {/* Per-branch transfer status */}
              <div className="space-y-2">
                {metrics.branchData.map(m => {
                  const color = BRANCH_COLORS[m.branch.id];
                  return (
                    <div key={m.branch.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color?.primary }} />
                        <span className="font-semibold text-[#2C2C2C]">{getBranchDisplayName(m.branch)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {m.transfers.pendingOutbound > 0 && (
                          <span className="text-amber-700">{m.transfers.pendingOutbound} outbound</span>
                        )}
                        {m.transfers.pendingInbound > 0 && (
                          <span className="text-blue-700">{m.transfers.pendingInbound} inbound</span>
                        )}
                        {m.transfers.pendingOutbound === 0 && m.transfers.pendingInbound === 0 && (
                          <span className="text-[#6B6B6B]">No pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Section 5: TOP CUSTOMERS + TOP PRODUCTS + DEALER OUTSTANDING ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Customers */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-[#B8860B]" />
                  Top Customers
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#B8860B] text-xs"
                  onClick={() => onNavigate?.('customers')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {metrics.topCustomers.length === 0 ? (
                <p className="text-sm text-[#6B6B6B] text-center py-6">No order data yet</p>
              ) : (
                <div className="space-y-2.5">
                  {metrics.topCustomers.map((c, i) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center text-white text-[10px] font-bold">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#2C2C2C]">{c.name}</p>
                          <p className="text-[10px] text-[#6B6B6B]">{c.orders} orders • {c.branch ? c.branch.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'N/A'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#B8860B]">{formatCurrency(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-[#B8860B]" />
                Top Products (by value)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {metrics.topProducts.length === 0 ? (
                <p className="text-sm text-[#6B6B6B] text-center py-6">No stock data</p>
              ) : (
                <div className="space-y-2.5">
                  {metrics.topProducts.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 text-[10px] font-bold">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#2C2C2C]">{p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name}</p>
                          <p className="text-[10px] text-[#6B6B6B]">{p.qty.toLocaleString('en-IN')} units across all branches</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-700">{formatCurrency(p.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outstanding Dealer Payments */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CircleDollarSign className="w-4 h-4 text-[#B8860B]" />
                  Outstanding Dealer Payments
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#B8860B] text-xs"
                  onClick={() => onNavigate?.('dealer-bills')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {metrics.outstandingDealers.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-emerald-700 font-semibold">All Clear!</p>
                  <p className="text-xs text-[#6B6B6B]">No pending dealer payments</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {metrics.outstandingDealers.map((d, i) => (
                    <div key={d.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs font-semibold text-[#2C2C2C]">{d.name}</p>
                        <p className="text-[10px] text-[#6B6B6B]">{d.billCount} pending bill{d.billCount !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-xs font-bold text-amber-700">{formatCurrency(d.totalPending)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#B8860B]/10 flex items-center justify-between text-xs">
                    <span className="text-[#6B6B6B]">Total Outstanding</span>
                    <span className="font-bold text-[#B8860B]">{formatCurrency(t.totalPendingBillAmt)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ═══ Section 6: BUSINESS SCORECARD ═══════════════════════════════ */}
        <Card className="border-[#B8860B]/20">
          <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-[#B8860B]" />
              Business Scorecard — What You Should Know Right Now
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Collection Health */}
              <div className="p-4 border border-[#B8860B]/10 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4 text-emerald-700" />
                  </div>
                  <span className="text-xs font-semibold text-[#2C2C2C]">Collection Health</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B6B6B]">Efficiency</span>
                    <span className={`font-bold ${t.collectionEfficiency >= 70 ? 'text-emerald-700' : 'text-amber-700'}`}>{t.collectionEfficiency}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${Math.min(100, t.collectionEfficiency)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#6B6B6B]">
                    <span>Collected: {formatCurrency(t.totalCollected)}</span>
                    <span>Due: {formatCurrency(t.totalDue)}</span>
                  </div>
                </div>
              </div>

              {/* Order Fulfillment */}
              <div className="p-4 border border-[#B8860B]/10 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-blue-700" />
                  </div>
                  <span className="text-xs font-semibold text-[#2C2C2C]">Order Fulfillment</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6B6B6B]">Completion Rate</span>
                    <span className={`font-bold ${t.overallCompletionRate >= 70 ? 'text-emerald-700' : 'text-amber-700'}`}>{t.overallCompletionRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: `${Math.min(100, t.overallCompletionRate)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#6B6B6B]">
                    <span>Completed: {t.totalCompleted}</span>
                    <span>Total: {t.totalOrders}</span>
                  </div>
                </div>
              </div>

              {/* Dealer Payment Status */}
              <div className="p-4 border border-[#B8860B]/10 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-purple-700" />
                  </div>
                  <span className="text-xs font-semibold text-[#2C2C2C]">Dealer Bills</span>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const paidPct = t.totalBillAmt > 0 ? Math.round((t.totalBillPaid / t.totalBillAmt) * 100) : 0;
                    return (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#6B6B6B]">Paid</span>
                          <span className="font-bold text-purple-700">{paidPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600" style={{ width: `${paidPct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#6B6B6B]">
                          <span>Paid: {formatCurrency(t.totalBillPaid)}</span>
                          <span>Pending: {formatCurrency(t.totalPendingBillAmt)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Stock Utilization */}
              <div className="p-4 border border-[#B8860B]/10 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF8F0] flex items-center justify-center">
                    <Package className="w-4 h-4 text-[#B8860B]" />
                  </div>
                  <span className="text-xs font-semibold text-[#2C2C2C]">Stock Health</span>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const healthPct = t.totalStock > 0 ? Math.round(((t.totalStock - t.totalBroken) / t.totalStock) * 100) : 100;
                    return (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#6B6B6B]">Healthy Stock</span>
                          <span className={`font-bold ${healthPct >= 90 ? 'text-emerald-700' : 'text-amber-700'}`}>{healthPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#B8860B] to-[#DAA520]" style={{ width: `${healthPct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#6B6B6B]">
                          <span>{t.totalLowStock} low stock items</span>
                          <span>{t.totalOutOfStock} out of stock</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ Section 7: QUICK ACTIONS ═══════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Reports', icon: BarChart3, screen: 'branch-comparison', color: 'from-[#B8860B] to-[#DAA520]' },
            { label: 'Stock Inward', icon: TrendingUp, screen: 'stock-inward', color: 'from-blue-500 to-blue-600' },
            { label: 'Transfers', icon: ArrowLeftRight, screen: 'stock-transfer', color: 'from-purple-500 to-purple-600' },
            { label: 'Dealer Bills', icon: FileText, screen: 'dealer-bills', color: 'from-emerald-500 to-emerald-600' },
            { label: 'Customers', icon: Users, screen: 'customers', color: 'from-amber-500 to-amber-600' },
          ].map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => onNavigate?.(action.screen)}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-[#B8860B]/15 rounded-xl hover:shadow-md hover:border-[#B8860B]/30 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-[#2C2C2C]">{action.label}</span>
              </button>
            );
          })}
        </div>


      </div>
    </div>
  );
};