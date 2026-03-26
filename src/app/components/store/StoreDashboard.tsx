import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useApp } from '@/app/context/AppContext';
import { 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Clock,
  Plus,
  ShoppingCart,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';

interface StoreDashboardProps {
  onNavigate: (page: string) => void;
  branchId?: string;
  branchLocation?: string;
}

export const StoreDashboard: React.FC<StoreDashboardProps> = ({ onNavigate, branchId, branchLocation }) => {
  const { currentUser, orders, customers } = useApp();

  // Derive stats from live Firebase data
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const branchOrders = useMemo(
    () => orders.filter(o => !branchId || o.branchId === branchId),
    [orders, branchId]
  );

  const todayOrders = useMemo(
    () => branchOrders.filter(o => new Date(o.createdAt) >= today),
    [branchOrders, today]
  );

  const stats = useMemo(() => ({
    todaySales: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    activeCustomers: customers.filter(c => !branchId || c.branchId === branchId).length,
    todayOrders: todayOrders.length,
    pendingOrders: branchOrders.filter(o => o.status === 'pending').length,
  }), [todayOrders, branchOrders, customers, branchId]);

  const recentOrders = useMemo(() => {
    return [...branchOrders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(o => {
        const customer = customers.find(c => c.id === o.customerId);
        const createdAt = new Date(o.createdAt);
        const diffMs = Date.now() - createdAt.getTime();
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor(diffMs / 60000);
        const timeAgo = diffHrs > 0 ? `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`
          : diffMins > 0 ? `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
          : 'Just now';
        return {
          id: o.id,
          customer: customer?.name || o.customerId || 'Unknown',
          amount: o.total || 0,
          items: o.items?.length || 0,
          status: o.status ? (o.status.charAt(0).toUpperCase() + o.status.slice(1)) : 'Pending',
          time: timeAgo,
        };
      });
  }, [branchOrders, customers]);

  const statCards = [
    {
      title: "Today's Sales",
      value: `₹${stats.todaySales.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-[#8B6914] via-[#B8860B] to-[#8B6914]',
      iconBg: 'from-[#8B6914]/30 to-[#B8860B]/30',
      change: '+12%',
      trend: 'up',
      sparkle: true
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers,
      icon: Users,
      gradient: 'from-emerald-500 via-emerald-600 to-emerald-500',
      iconBg: 'from-emerald-500/30 to-emerald-600/30',
      change: '+8%',
      trend: 'up'
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: ShoppingBag,
      gradient: 'from-[#8B6914] via-[#B8860B] to-[#8B6914]',
      iconBg: 'from-[#8B6914]/30 to-[#B8860B]/30',
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      gradient: 'from-orange-500 via-orange-600 to-orange-500',
      iconBg: 'from-orange-500/30 to-orange-600/30',
      change: '-5%',
      trend: 'down'
    }
  ];

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#FFF8F0] via-[#FFF8F0] to-[#FFE4B5]/30 min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#B8860B]/10 to-[#DAA520]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-[#8B6914]/10 to-[#B8860B]/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] bg-clip-text text-transparent mb-2">
              Store Dashboard
            </h1>
            <p className="text-[#6B6B6B] text-lg">
              Welcome back, <span className="font-semibold text-[#1A1A1A]">{currentUser?.name}</span> - {branchLocation?.replace('-', ' ').toUpperCase()}
            </p>
          </div>
          <Sparkles className="w-8 h-8 text-[#B8860B]" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {statCards.map((stat, index) => (
          <div key={stat.title}>
            <Card className="border-0 bg-white/80 backdrop-blur-xl hover:bg-white hover:shadow-2xl transition-all duration-300 overflow-hidden relative group">
              {/* Animated gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-[#6B6B6B] mb-2 font-medium">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-[#1A1A1A] mb-2">
                      {stat.value}
                    </h3>
                    <div className="flex items-center gap-1">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-amber-600" />
                      )}
                      <span className={`text-xs font-semibold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {stat.change}
                      </span>
                      <span className="text-xs text-[#6B6B6B]">vs yesterday</span>
                    </div>
                  </div>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.iconBg} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-8 h-8 text-[#B8860B]" />
                  </div>
                </div>
                {stat.sparkle && (
                  <div className="absolute top-4 right-4">
                    <Sparkles className="w-4 h-4 text-[#DAA520]" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="relative z-10">
        <Card className="border-0 bg-white/80 backdrop-blur-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#1A1A1A] to-[#6B6B6B] bg-clip-text text-transparent">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Button
                  onClick={() => onNavigate('New Order')}
                  className="relative overflow-hidden bg-gradient-to-br from-[#B8860B] via-[#DAA520] to-[#B8860B] hover:shadow-2xl hover:shadow-[#B8860B]/50 text-white h-28 flex flex-col gap-3 w-full border-0 group"
                >
                  <div>
                    <Plus className="w-10 h-10" />
                  </div>
                  <span className="font-semibold text-base">New Order</span>
                </Button>
              </div>

              <div>
                <Button
                  onClick={() => onNavigate('Customers')}
                  className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-600 hover:shadow-2xl hover:shadow-emerald-600/50 text-white h-28 flex flex-col gap-3 w-full border-0 group"
                >
                  <div>
                    <Users className="w-10 h-10" />
                  </div>
                  <span className="font-semibold text-base">Manage Customers</span>
                </Button>
              </div>

              <div>
                <Button
                  onClick={() => onNavigate('Products')}
                  className="relative overflow-hidden bg-gradient-to-br from-[#8B6914] via-[#B8860B] to-[#8B6914] hover:shadow-2xl hover:shadow-[#B8860B]/50 text-white h-28 flex flex-col gap-3 w-full border-0 group"
                >
                  <div>
                    <Package className="w-10 h-10" />
                  </div>
                  <span className="font-semibold text-base">Browse Products</span>
                </Button>
              </div>

              <div>
                <Button
                  onClick={() => onNavigate('Cart')}
                  className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-700 to-orange-600 hover:shadow-2xl hover:shadow-orange-600/50 text-white h-28 flex flex-col gap-3 w-full border-0 group"
                >
                  <div>
                    <ShoppingCart className="w-10 h-10" />
                  </div>
                  <span className="font-semibold text-base">View Cart</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <div className="relative z-10">
        <Card className="border-0 bg-white/80 backdrop-blur-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#1A1A1A] to-[#6B6B6B] bg-clip-text text-transparent">
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-[#B8860B]/30" />
                  <p className="text-[#6B6B6B]">No orders yet. Create your first order!</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border-2 border-[#B8860B]/10 hover:border-[#B8860B]/30 transition-all cursor-pointer hover:bg-[#B8860B]/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-[#1A1A1A]">{order.id}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-700' :
                            order.status === 'Pending' ? 'bg-orange-500/20 text-orange-700' :
                            order.status === 'Cancelled' ? 'bg-red-500/20 text-red-700' :
                            'bg-blue-500/20 text-blue-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-[#6B6B6B]">{order.customer} • {order.items} item{order.items !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-[#6B6B6B] mt-1">{order.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#B8860B]">₹{order.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};