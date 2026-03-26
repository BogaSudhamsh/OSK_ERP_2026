import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  ArrowLeftRight,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Layers,
  PieChart as PieChartIcon,
  IndianRupee,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'motion/react';
import { useApp } from '@/app/context/AppContext';

interface BranchComparisonReportsProps {
  onBack?: () => void;
}

const BRANCH_COLORS: Record<string, { primary: string; light: string; label: string }> = {
  'branch-1': { primary: '#3B82F6', light: '#DBEAFE', label: 'Aziz Nagar' },
  'branch-2': { primary: '#8B5CF6', light: '#EDE9FE', label: 'Vikarabad' },
  'branch-3': { primary: '#10B981', light: '#D1FAE5', label: 'Sangareddy' },
};

const PIE_COLORS = ['#B8860B', '#3B82F6', '#10B981', '#F59E0B', '#6B7280'];

const formatCurrency = (val: number) => {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString('en-IN')}`;
};

export const BranchComparisonReports: React.FC<BranchComparisonReportsProps> = ({ onBack }) => {
  const {
    branchStock,
    branches,
    orders,
    branchTransfers,
    pendingBills,
    customers,
    products,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'orders' | 'transfers' | 'financial'>('overview');

  // ── Derived Metrics ──────────────────────────────────────────────────────
  const branchMetrics = useMemo(() => {
    return branches.map(branch => {
      const bStock = branchStock.filter(bs => bs.branchId === branch.id);
      const bOrders = orders.filter(o => o.branchId === branch.id);
      const bTransfersOut = branchTransfers.filter(t => t.fromBranchId === branch.id);
      const bTransfersIn = branchTransfers.filter(t => t.toBranchId === branch.id);
      const bBills = pendingBills.filter(pb => pb.targetBranches.includes(branch.location as any));
      const bCustomers = customers.filter(c => c.branchId === branch.id || c.storeId === branch.id);

      const totalActualStock = bStock.reduce((s, bs) => s + bs.freshQuantity, 0);
      const totalFreshStock = bStock.reduce((s, bs) => s + bs.freshQuantity, 0);
      const totalBrokenStock = bStock.reduce((s, bs) => s + bs.brokenQuantity, 0);
      const inventoryValue = bStock.reduce((s, bs) => s + (bs.freshQuantity * bs.costPrice), 0);
      const retailValue = bStock.reduce((s, bs) => s + (bs.freshQuantity * bs.mrp), 0);

      const totalOrders = bOrders.length;
      const completedOrders = bOrders.filter(o => o.status === 'completed').length;
      const pendingOrders = bOrders.filter(o => o.status === 'pending').length;
      const processingOrders = bOrders.filter(o => o.status === 'processing' || o.status === 'confirmed').length;
      const cancelledOrders = bOrders.filter(o => o.status === 'cancelled').length;
      const revenue = bOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
      const collected = bOrders.reduce((s, o) => s + (o.amountPaid || 0), 0);
      const due = bOrders.reduce((s, o) => s + (o.amountDue || 0), 0);

      const transfersSent = bTransfersOut.length;
      const transfersReceived = bTransfersIn.filter(t => t.status === 'received').length;
      const transfersPending = bTransfersIn.filter(t => t.status !== 'received' && t.status !== 'rejected').length;
      const unitsSent = bTransfersOut.filter(t => t.status === 'received').reduce((s, t) => s + t.quantity, 0);
      const unitsReceived = bTransfersIn.filter(t => t.status === 'received').reduce((s, t) => s + t.quantity, 0);

      const totalBillAmount = bBills.reduce((s, b) => s + b.totalAmount, 0);
      const totalBillPaid = bBills.reduce((s, b) => s + b.totalPaid, 0);
      const totalBillRemaining = bBills.reduce((s, b) => s + b.remainingAmount, 0);

      const uniqueProducts = bStock.length;
      const lowStockItems = bStock.filter(bs => bs.freshQuantity < 20 && bs.freshQuantity > 0).length;
      const outOfStockItems = bStock.filter(bs => bs.freshQuantity === 0).length;

      const categories = bStock.reduce((acc, bs) => {
        if (!acc[bs.category]) acc[bs.category] = { count: 0, qty: 0, value: 0 };
        acc[bs.category].count++;
        acc[bs.category].qty += bs.freshQuantity;
        acc[bs.category].value += bs.freshQuantity * bs.costPrice;
        return acc;
      }, {} as Record<string, { count: number; qty: number; value: number }>);

      return {
        branch,
        stock: {
          totalActualStock, totalFreshStock, totalBrokenStock,
          inventoryValue, retailValue, uniqueProducts, lowStockItems, outOfStockItems,
          categories,
        },
        orders: {
          totalOrders, completedOrders, pendingOrders, processingOrders, cancelledOrders,
          revenue, collected, due,
        },
        transfers: {
          transfersSent, transfersReceived, transfersPending, unitsSent, unitsReceived,
        },
        financial: {
          totalBillAmount, totalBillPaid, totalBillRemaining,
        },
        customerCount: bCustomers.length,
      };
    });
  }, [branchStock, branches, orders, branchTransfers, pendingBills, customers]);

  // Aggregated totals
  const totals = useMemo(() => ({
    totalStock: branchMetrics.reduce((s, m) => s + m.stock.totalActualStock, 0),
    totalInventoryValue: branchMetrics.reduce((s, m) => s + m.stock.inventoryValue, 0),
    totalRevenue: branchMetrics.reduce((s, m) => s + m.orders.revenue, 0),
    totalOrders: branchMetrics.reduce((s, m) => s + m.orders.totalOrders, 0),
    totalTransfers: branchTransfers.length,
    completedTransfers: branchTransfers.filter(t => t.status === 'received').length,
    totalCustomers: customers.length,
    totalProducts: products.length,
  }), [branchMetrics, branchTransfers, customers, products]);

  // ── Chart Data ──────────────────────────────────────────────────────────
  const stockComparisonData = branchMetrics.map(m => ({
    name: BRANCH_COLORS[m.branch.id]?.label || m.branch.name,
    'Actual Stock': m.stock.totalActualStock,
    'Fresh Stock': m.stock.totalFreshStock,
  }));

  const revenueComparisonData = branchMetrics.map(m => ({
    name: BRANCH_COLORS[m.branch.id]?.label || m.branch.name,
    Revenue: m.orders.revenue,
    Collected: m.orders.collected,
    Due: m.orders.due,
  }));

  const orderStatusData = branchMetrics.map(m => ({
    name: BRANCH_COLORS[m.branch.id]?.label || m.branch.name,
    Completed: m.orders.completedOrders,
    Pending: m.orders.pendingOrders,
    Processing: m.orders.processingOrders,
    Cancelled: m.orders.cancelledOrders,
  }));

  const categoryDistribution = useMemo(() => {
    const cats: Record<string, number> = {};
    branchStock.forEach(bs => {
      cats[bs.category] = (cats[bs.category] || 0) + bs.freshQuantity;
    });
    return Object.entries(cats).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [branchStock]);

  const transferFlowData = useMemo(() => {
    const flow: Record<string, { sent: number; received: number; pending: number }> = {};
    branches.forEach(b => {
      flow[b.id] = { sent: 0, received: 0, pending: 0 };
    });
    branchTransfers.forEach(t => {
      if (t.status === 'received') {
        if (flow[t.fromBranchId]) flow[t.fromBranchId].sent += t.quantity;
        if (flow[t.toBranchId]) flow[t.toBranchId].received += t.quantity;
      } else if (t.status !== 'rejected') {
        if (flow[t.fromBranchId]) flow[t.fromBranchId].pending += t.quantity;
      }
    });
    return branches.map(b => ({
      name: BRANCH_COLORS[b.id]?.label || b.name,
      'Units Sent': flow[b.id]?.sent || 0,
      'Units Received': flow[b.id]?.received || 0,
      'In Pipeline': flow[b.id]?.pending || 0,
    }));
  }, [branchTransfers, branches]);

  // Top products across all branches
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; totalQty: number; totalValue: number }> = {};
    branchStock.forEach(bs => {
      if (!productMap[bs.productId]) {
        productMap[bs.productId] = { name: bs.productName, totalQty: 0, totalValue: 0 };
      }
      productMap[bs.productId].totalQty += bs.freshQuantity;
      productMap[bs.productId].totalValue += bs.freshQuantity * bs.costPrice;
    });
    return Object.values(productMap)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 8)
      .map(p => ({ name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name, Quantity: p.totalQty, Value: p.totalValue }));
  }, [branchStock]);

  // ── Tab content ───────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'stock', label: 'Stock Analysis', icon: Package },
    { id: 'orders', label: 'Orders & Revenue', icon: ShoppingCart },
    { id: 'transfers', label: 'Transfer Activity', icon: ArrowLeftRight },
    { id: 'financial', label: 'Financial', icon: IndianRupee },
  ] as const;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white border border-[#B8860B]/20 rounded-xl p-3 shadow-lg">
        <p className="text-xs font-semibold text-[#2C2C2C] mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{typeof p.value === 'number' && p.value > 1000 ? p.value.toLocaleString('en-IN') : p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#B8860B]" />
            Reports & Branch Comparison
          </h1>
          <p className="text-[#6B6B6B] mt-1">
            Comprehensive analytics across all {branches.length} branches
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
          <Clock className="w-3.5 h-3.5" />
          Data as of {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Top-Level KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Inventory', value: totals.totalStock.toLocaleString('en-IN'), sub: formatCurrency(totals.totalInventoryValue) + ' value', icon: Package, gradient: 'from-[#B8860B] to-[#DAA520]' },
          { label: 'Total Orders', value: totals.totalOrders.toString(), sub: formatCurrency(totals.totalRevenue) + ' revenue', icon: ShoppingCart, gradient: 'from-blue-500 to-blue-600' },
          { label: 'Stock Transfers', value: totals.totalTransfers.toString(), sub: `${totals.completedTransfers} completed`, icon: ArrowLeftRight, gradient: 'from-purple-500 to-purple-600' },
          { label: 'Active Products', value: totals.totalProducts.toString(), sub: `${totals.totalCustomers} customers`, icon: Layers, gradient: 'from-emerald-500 to-emerald-600' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="border-[#B8860B]/20 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-[#2C2C2C]">{kpi.value}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{kpi.label}</p>
                  <p className="text-[10px] text-[#B8860B] mt-1">{kpi.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-sm'
                  : 'bg-white text-[#6B6B6B] border border-[#B8860B]/15 hover:bg-[#FFF8F0]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Branch Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branchMetrics.map((m, i) => {
              const color = BRANCH_COLORS[m.branch.id];
              return (
                <motion.div
                  key={m.branch.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-[#B8860B]/20 overflow-hidden">
                    <div className="h-1.5" style={{ background: `linear-gradient(to right, ${color?.primary}, ${color?.primary}88)` }} />
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color?.light }}>
                          <Building2 className="w-4 h-4" style={{ color: color?.primary }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#2C2C2C]">{color?.label}</p>
                          <p className="text-[10px] text-[#6B6B6B]">{m.branch.address?.split(',').slice(0, 2).join(',')}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-[#FFF8F0] rounded-lg">
                          <p className="text-xs text-[#6B6B6B]">Stock Units</p>
                          <p className="text-lg font-bold text-[#2C2C2C]">{m.stock.totalActualStock.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-2.5 bg-[#FFF8F0] rounded-lg">
                          <p className="text-xs text-[#6B6B6B]">Inventory Value</p>
                          <p className="text-lg font-bold text-[#B8860B]">{formatCurrency(m.stock.inventoryValue)}</p>
                        </div>
                        <div className="p-2.5 bg-blue-50 rounded-lg">
                          <p className="text-xs text-[#6B6B6B]">Orders</p>
                          <p className="text-lg font-bold text-blue-700">{m.orders.totalOrders}</p>
                        </div>
                        <div className="p-2.5 bg-emerald-50 rounded-lg">
                          <p className="text-xs text-[#6B6B6B]">Revenue</p>
                          <p className="text-lg font-bold text-emerald-700">{formatCurrency(m.orders.revenue)}</p>
                        </div>
                      </div>

                      {/* Quick health indicators */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#B8860B]/10">
                        <div className="flex items-center gap-1 text-xs">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[#6B6B6B]">{m.stock.uniqueProducts} products</span>
                        </div>
                        {m.stock.lowStockItems > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-amber-700">{m.stock.lowStockItems} low stock</span>
                          </div>
                        )}
                        {m.stock.totalBrokenStock > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-orange-700">{m.stock.totalBrokenStock} broken</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Two-column charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Comparison Bar Chart */}
            <Card className="border-[#B8860B]/20">
              <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-[#B8860B]" />
                  Stock Levels by Branch
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stockComparisonData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#B8860B20" />
                    <XAxis dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6B6B6B', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Actual Stock" fill="#B8860B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Fresh Stock" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution Pie */}
            <Card className="border-[#B8860B]/20">
              <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <PieChartIcon className="w-4 h-4 text-[#B8860B]" />
                  Stock by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryDistribution.map((entry, i) => (
                        <Cell key={`cell-${entry.name}-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* ── STOCK ANALYSIS TAB ───────────────────────────────────────────── */}
      {activeTab === 'stock' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Stock Comparison Table */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-[#B8860B]" />
                Branch Stock Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FFF8F0]/60 border-b border-[#B8860B]/10">
                      <th className="text-left px-5 py-3 text-xs text-[#6B6B6B]">Branch</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Products</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Actual Stock</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Fresh</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Inventory Value</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Retail Value</th>
                      <th className="text-center px-5 py-3 text-xs text-[#6B6B6B]">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchMetrics.map(m => {
                      const color = BRANCH_COLORS[m.branch.id];
                      const healthScore = m.stock.totalActualStock > 0
                        ? Math.round(((m.stock.totalFreshStock) / m.stock.totalActualStock) * 100)
                        : 0;
                      return (
                        <tr key={m.branch.id} className="border-b border-[#B8860B]/5 hover:bg-[#FFF8F0]/30">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color?.primary }} />
                              <span className="font-semibold text-[#2C2C2C]">{color?.label}</span>
                            </div>
                          </td>
                          <td className="text-right px-5 py-3 text-[#2C2C2C]">{m.stock.uniqueProducts}</td>
                          <td className="text-right px-5 py-3 font-bold text-[#2C2C2C]">{m.stock.totalActualStock.toLocaleString('en-IN')}</td>
                          <td className="text-right px-5 py-3 text-emerald-700">{m.stock.totalFreshStock.toLocaleString('en-IN')}</td>
                          <td className="text-right px-5 py-3 font-bold text-[#B8860B]">{formatCurrency(m.stock.inventoryValue)}</td>
                          <td className="text-right px-5 py-3 text-[#6B6B6B]">{formatCurrency(m.stock.retailValue)}</td>
                          <td className="text-center px-5 py-3">
                            <Badge className={`text-xs ${healthScore >= 80 ? 'bg-emerald-50 text-emerald-700' : healthScore >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-orange-50 text-orange-700'} border-none`}>
                              {healthScore}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total Row */}
                    <tr className="bg-[#FFF8F0]/80 font-bold">
                      <td className="px-5 py-3 text-[#B8860B]">Total</td>
                      <td className="text-right px-5 py-3 text-[#2C2C2C]">{branchMetrics.reduce((s, m) => s + m.stock.uniqueProducts, 0)}</td>
                      <td className="text-right px-5 py-3 text-[#2C2C2C]">{totals.totalStock.toLocaleString('en-IN')}</td>
                      <td className="text-right px-5 py-3 text-emerald-700">{branchMetrics.reduce((s, m) => s + m.stock.totalFreshStock, 0).toLocaleString('en-IN')}</td>
                      <td className="text-right px-5 py-3 text-[#B8860B]">{formatCurrency(totals.totalInventoryValue)}</td>
                      <td className="text-right px-5 py-3 text-[#6B6B6B]">{formatCurrency(branchMetrics.reduce((s, m) => s + m.stock.retailValue, 0))}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Category breakdown per branch */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-[#B8860B]" />
                Category Breakdown by Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {branchMetrics.map(m => {
                  const color = BRANCH_COLORS[m.branch.id];
                  return (
                    <div key={m.branch.id} className="p-4 border border-[#B8860B]/10 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color?.primary }} />
                        <span className="text-sm font-semibold text-[#2C2C2C]">{color?.label}</span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(m.stock.categories).map(([cat, data]) => (
                          <div key={cat} className="flex items-center justify-between text-xs">
                            <span className="text-[#6B6B6B] capitalize">{cat}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[#2C2C2C] font-semibold">{data.qty.toLocaleString('en-IN')} units</span>
                              <span className="text-[#B8860B]">{formatCurrency(data.value)}</span>
                            </div>
                          </div>
                        ))}
                        {Object.keys(m.stock.categories).length === 0 && (
                          <p className="text-xs text-[#6B6B6B] italic">No stock data</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Products Chart */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-[#B8860B]" />
                Top Products by Inventory Value
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topProducts} layout="vertical" barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B8860B20" />
                  <XAxis type="number" tick={{ fill: '#6B6B6B', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fill: '#6B6B6B', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Quantity" fill="#B8860B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stock Alerts */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Stock Health Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {branchMetrics.every(m => m.stock.lowStockItems === 0 && m.stock.outOfStockItems === 0 && m.stock.totalBrokenStock === 0) ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-emerald-700 font-semibold">All branches healthy!</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">No stock alerts at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {branchMetrics.map(m => {
                    const color = BRANCH_COLORS[m.branch.id];
                    const alerts = [];
                    if (m.stock.lowStockItems > 0) alerts.push({ type: 'warning', text: `${m.stock.lowStockItems} products running low (<20 units)` });
                    if (m.stock.outOfStockItems > 0) alerts.push({ type: 'danger', text: `${m.stock.outOfStockItems} products out of stock` });
                    if (m.stock.totalBrokenStock > 0) alerts.push({ type: 'info', text: `${m.stock.totalBrokenStock} broken/damaged units in inventory` });
                    if (alerts.length === 0) return null;
                    return (
                      <div key={m.branch.id} className="p-3 border border-[#B8860B]/10 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color?.primary }} />
                          <span className="text-xs font-semibold text-[#2C2C2C]">{color?.label}</span>
                        </div>
                        <div className="space-y-1">
                          {alerts.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <AlertTriangle className={`w-3 h-3 ${a.type === 'danger' ? 'text-[#B8860B]' : a.type === 'warning' ? 'text-amber-500' : 'text-orange-500'}`} />
                              <span className="text-[#6B6B6B]">{a.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── ORDERS & REVENUE TAB ────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Revenue Comparison */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <IndianRupee className="w-4 h-4 text-[#B8860B]" />
                Revenue Comparison by Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueComparisonData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B8860B20" />
                  <XAxis dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6B6B6B', fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Revenue" fill="#B8860B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Due" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status by Branch */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShoppingCart className="w-4 h-4 text-[#B8860B]" />
                Order Status by Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orderStatusData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B8860B20" />
                  <XAxis dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6B6B6B', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Completed" stackId="status" fill="#10B981" />
                  <Bar dataKey="Processing" stackId="status" fill="#3B82F6" />
                  <Bar dataKey="Pending" stackId="status" fill="#F59E0B" />
                  <Bar dataKey="Cancelled" stackId="status" fill="#6B7280" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order details table */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShoppingCart className="w-4 h-4 text-[#B8860B]" />
                Order Metrics Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FFF8F0]/60 border-b border-[#B8860B]/10">
                      <th className="text-left px-5 py-3 text-xs text-[#6B6B6B]">Branch</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Total Orders</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Completed</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Pending</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Revenue</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Collected</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Amount Due</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Avg Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchMetrics.map(m => {
                      const color = BRANCH_COLORS[m.branch.id];
                      const avgOrder = m.orders.totalOrders > 0 ? m.orders.revenue / m.orders.totalOrders : 0;
                      return (
                        <tr key={m.branch.id} className="border-b border-[#B8860B]/5 hover:bg-[#FFF8F0]/30">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color?.primary }} />
                              <span className="font-semibold text-[#2C2C2C]">{color?.label}</span>
                            </div>
                          </td>
                          <td className="text-right px-5 py-3 font-bold text-[#2C2C2C]">{m.orders.totalOrders}</td>
                          <td className="text-right px-5 py-3 text-emerald-700">{m.orders.completedOrders}</td>
                          <td className="text-right px-5 py-3 text-amber-700">{m.orders.pendingOrders}</td>
                          <td className="text-right px-5 py-3 font-bold text-[#B8860B]">{formatCurrency(m.orders.revenue)}</td>
                          <td className="text-right px-5 py-3 text-emerald-700">{formatCurrency(m.orders.collected)}</td>
                          <td className="text-right px-5 py-3 text-amber-700">{formatCurrency(m.orders.due)}</td>
                          <td className="text-right px-5 py-3 text-[#6B6B6B]">{formatCurrency(avgOrder)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── TRANSFERS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'transfers' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Transfer Flow Chart */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ArrowLeftRight className="w-4 h-4 text-[#B8860B]" />
                Transfer Flow by Branch (Units)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transferFlowData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B8860B20" />
                  <XAxis dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6B6B6B', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Units Sent" fill="#B8860B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Units Received" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="In Pipeline" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Transfer Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branchMetrics.map(m => {
              const color = BRANCH_COLORS[m.branch.id];
              return (
                <Card key={m.branch.id} className="border-[#B8860B]/20">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color?.light }}>
                        <ArrowLeftRight className="w-4 h-4" style={{ color: color?.primary }} />
                      </div>
                      <span className="text-sm font-semibold text-[#2C2C2C]">{color?.label}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B6B6B] flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-[#B8860B]" />
                          Transfers Sent
                        </span>
                        <span className="font-bold text-[#2C2C2C]">{m.transfers.transfersSent}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B6B6B] flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-emerald-600" />
                          Transfers Received
                        </span>
                        <span className="font-bold text-emerald-700">{m.transfers.transfersReceived}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6B6B6B] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Pending Inbound
                        </span>
                        <span className="font-bold text-amber-700">{m.transfers.transfersPending}</span>
                      </div>
                      <div className="border-t border-[#B8860B]/10 pt-2 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#6B6B6B]">Units Sent</span>
                          <span className="font-bold text-[#B8860B]">{m.transfers.unitsSent.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-[#6B6B6B]">Units Received</span>
                          <span className="font-bold text-emerald-700">{m.transfers.unitsReceived.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Transfer Status Breakdown */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-[#B8860B]" />
                Overall Transfer Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {[
                  { status: 'Requested', count: branchTransfers.filter(t => t.status === 'requested').length, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50' },
                  { status: 'Approved', count: branchTransfers.filter(t => t.status === 'approved').length, icon: CheckCircle, color: 'text-blue-700', bg: 'bg-blue-50' },
                  { status: 'In Transit', count: branchTransfers.filter(t => t.status === 'in-transit').length, icon: Truck, color: 'text-orange-700', bg: 'bg-orange-50' },
                  { status: 'Received', count: branchTransfers.filter(t => t.status === 'received').length, icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                  { status: 'Rejected', count: branchTransfers.filter(t => t.status === 'rejected').length, icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50' },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.status} className={`p-3 ${s.bg} rounded-xl text-center`}>
                      <Icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                      <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                      <p className="text-xs text-[#6B6B6B]">{s.status}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── FINANCIAL TAB ──────────────────────────────────────────────── */}
      {activeTab === 'financial' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Bill Amount', value: formatCurrency(branchMetrics.reduce((s, m) => s + m.financial.totalBillAmount, 0)), icon: DollarSign, gradient: 'from-[#B8860B] to-[#DAA520]' },
              { label: 'Total Paid', value: formatCurrency(branchMetrics.reduce((s, m) => s + m.financial.totalBillPaid, 0)), icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600' },
              { label: 'Remaining', value: formatCurrency(branchMetrics.reduce((s, m) => s + m.financial.totalBillRemaining, 0)), icon: Clock, gradient: 'from-amber-500 to-amber-600' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="border-[#B8860B]/20">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#2C2C2C]">{kpi.value}</p>
                        <p className="text-xs text-[#6B6B6B]">{kpi.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Dealer Bills by Branch */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
              <CardTitle className="flex items-center gap-2 text-sm">
                <IndianRupee className="w-4 h-4 text-[#B8860B]" />
                Dealer Bill Status by Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#FFF8F0]/60 border-b border-[#B8860B]/10">
                      <th className="text-left px-5 py-3 text-xs text-[#6B6B6B]">Branch</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Bill Amount</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Paid</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">Remaining</th>
                      <th className="text-right px-5 py-3 text-xs text-[#6B6B6B]">% Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchMetrics.map(m => {
                      const color = BRANCH_COLORS[m.branch.id];
                      const pct = m.financial.totalBillAmount > 0
                        ? Math.round((m.financial.totalBillPaid / m.financial.totalBillAmount) * 100)
                        : 0;
                      return (
                        <tr key={m.branch.id} className="border-b border-[#B8860B]/5 hover:bg-[#FFF8F0]/30">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color?.primary }} />
                              <span className="font-semibold text-[#2C2C2C]">{color?.label}</span>
                            </div>
                          </td>
                          <td className="text-right px-5 py-3 font-bold text-[#2C2C2C]">{formatCurrency(m.financial.totalBillAmount)}</td>
                          <td className="text-right px-5 py-3 text-emerald-700">{formatCurrency(m.financial.totalBillPaid)}</td>
                          <td className="text-right px-5 py-3 text-amber-700">{formatCurrency(m.financial.totalBillRemaining)}</td>
                          <td className="text-right px-5 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#B8860B] to-[#DAA520]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#6B6B6B]">{pct}%</span>
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

          {/* Revenue vs Cost */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-[#B8860B]" />
                Revenue vs Inventory Cost by Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={branchMetrics.map(m => ({
                    name: BRANCH_COLORS[m.branch.id]?.label || m.branch.name,
                    Revenue: m.orders.revenue,
                    'Inventory Cost': m.stock.inventoryValue,
                    'Potential Margin': m.stock.retailValue - m.stock.inventoryValue,
                  }))}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#B8860B20" />
                  <XAxis dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6B6B6B', fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Inventory Cost" fill="#B8860B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Potential Margin" fill="#DAA520" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};