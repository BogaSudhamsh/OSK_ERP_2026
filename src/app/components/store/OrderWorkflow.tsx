import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/app/context/AppContext';
import {
  User,
  Phone,
  MapPin,
  Search,
  CheckCircle2,
  Package,
  ShoppingCart,
  UserPlus,
  Clock,
  ArrowRight,
  XCircle,
  Users,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Customer } from '@/app/types';

interface OrderWorkflowProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  selectedOrderCustomerId?: string | null;
  onSelectOrderCustomer?: (customerId: string | null) => void;
}

export const OrderWorkflow: React.FC<OrderWorkflowProps> = ({ onBack, onNavigate, selectedOrderCustomerId, onSelectOrderCustomer }) => {
  const { cart, orders, currentUser, customers, addCustomer } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Use external state if provided, otherwise fallback to local state
  const [localSelectedCustomerId, setLocalSelectedCustomerId] = useState<string | null>(null);
  
  const selectedCustomerId = selectedOrderCustomerId !== undefined ? selectedOrderCustomerId : localSelectedCustomerId;
  const setSelectedCustomerId = (id: string | null) => {
    if (onSelectOrderCustomer) {
      onSelectOrderCustomer(id);
    }
    setLocalSelectedCustomerId(id);
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    notes: '',
  });

  // Helper to derive display location from the global Customer type
  const getCustomerLocation = (c: Customer) => {
    return [c.city, c.state].filter(Boolean).join(', ') || c.address || '';
  };

  // Derive selected customer from global list
  const selectedCustomer = useMemo(
    () => selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) || null : null,
    [selectedCustomerId, customers]
  );

  // Count orders per customer
  const customerOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.customerId) {
        counts[o.customerId] = (counts[o.customerId] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  // Filter customers by search
  const filteredCustomers = useMemo(() =>
    customers.filter(c => {
      // Branch-level isolation: only show customers belonging to this branch
      // Super-admin sees all customers
      const isSuperAdmin = currentUser?.role === 'super-admin';
      const matchesBranch = isSuperAdmin || !currentUser?.branchId || c.branchId === currentUser.branchId;
      if (!matchesBranch) return false;

      return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase());
    }),
    [customers, searchTerm, currentUser]
  );

  // Branch orders count for this session
  const branchId = currentUser?.branchId || '';
  const branchOrders = orders.filter(o => o.branchId === branchId);
  const pendingOrders = branchOrders.filter(o => o.status === 'pending');

  const handleRegisterCustomer = () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Please fill in required fields', {
        description: 'Customer name and phone are mandatory',
      });
      return;
    }

    // Parse location into city/state
    const locationParts = formData.location.trim().split(',').map(s => s.trim());
    const city = locationParts[0] || '';
    const state = locationParts[1] || '';

    const newCustomer = addCustomer({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: '',
      address: city || formData.location.trim(),
      city,
      state,
      pincode: '',
      storeId: currentUser?.id || 'store-1',
      branchId: currentUser?.branchId || '',
      branchLocation: currentUser?.branchLocation,
      images: [],
    });

    setSelectedCustomerId(newCustomer.id);
    setFormData({ name: '', phone: '', location: '', notes: '' });
    setShowAddForm(false);

    toast.success('Customer registered!', {
      description: `${newCustomer.name} - ${newCustomer.id}`,
    });
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    toast.success(`Selected: ${customer.name}`, {
      description: 'You can now browse products for this customer',
    });
  };

  const handleDeselectCustomer = () => {
    setSelectedCustomerId(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-[#FFF8F0] via-[#FFF8F0] to-[#FFE4B5]/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-1">New Order</h1>
          <p className="text-[#6B6B6B]">
            Register or select a customer, then browse products to build their order
          </p>
        </div>
        <div className="flex items-center gap-3">
          {cart.length > 0 && (
            <Button
              onClick={() => onNavigate?.('Cart')}
              className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 border-0"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart ({cart.length})
            </Button>
          )}
          {pendingOrders.length > 0 && (
            <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50 px-3 py-2">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {pendingOrders.length} pending
            </Badge>
          )}
        </div>
      </div>

      {/* Active Customer Banner */}
      {selectedCustomer && (
        <Card className="border-2 border-emerald-400/50 bg-gradient-to-r from-emerald-50 to-white shadow-lg overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-[#1A1A1A] text-lg">{selectedCustomer.name}</h3>
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">Active Customer</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#6B6B6B]">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#B8860B]" />
                      {selectedCustomer.phone}
                    </span>
                    {getCustomerLocation(selectedCustomer) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#B8860B]" />
                        {getCustomerLocation(selectedCustomer)}
                      </span>
                    )}
                    <span className="text-xs text-[#6B6B6B]">ID: {selectedCustomer.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => onNavigate?.('Products')}
                  className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 border-0"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Browse Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={handleDeselectCustomer}
                  variant="outline"
                  size="sm"
                  className="border-[#B8860B]/30 text-[#6B6B6B] hover:bg-[#B8860B]/10 transition-all duration-200"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-[#B8860B]/20 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B6B6B]">Customers</p>
              <p className="text-xl font-bold text-[#1A1A1A]">{filteredCustomers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#B8860B]/20 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-[#B8860B]" />
            </div>
            <div>
              <p className="text-xs text-[#6B6B6B]">Cart Items</p>
              <p className="text-xl font-bold text-[#1A1A1A]">{cart.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#B8860B]/20 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B6B6B]">Pending POs</p>
              <p className="text-xl font-bold text-[#1A1A1A]">{pendingOrders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#B8860B]/20 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B6B6B]">Total Orders</p>
              <p className="text-xl font-bold text-[#1A1A1A]">{branchOrders.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Register / Search Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer List & Search */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search + Add */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, or ID..."
                className="pl-10 bg-white border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A] h-11"
              />
            </div>
            <Button
              onClick={() => { setShowAddForm(true); setSelectedCustomerId(null); }}
              className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg h-11 transition-all duration-200 hover:scale-105 active:scale-95 border-0"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              New Customer
            </Button>
          </div>

          {/* Register Form */}
          {showAddForm && (
            <Card className="border-2 border-[#B8860B]/30 bg-white shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#B8860B]" />
                  Register New Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reg-name" className="text-[#1A1A1A]">
                      Customer Name <span className="text-orange-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                      <Input
                        id="reg-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        className="pl-10 bg-[#FFF8F0] border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reg-phone" className="text-[#1A1A1A]">
                      Phone Number <span className="text-orange-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                      <Input
                        id="reg-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="pl-10 bg-[#FFF8F0] border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reg-location" className="text-[#1A1A1A]">
                      Location
                    </Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                      <Input
                        id="reg-location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, State"
                        className="pl-10 bg-[#FFF8F0] border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reg-notes" className="text-[#1A1A1A]">
                      Notes
                    </Label>
                    <Textarea
                      id="reg-notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Requirements, preferences..."
                      className="bg-[#FFF8F0] border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A] mt-1"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleRegisterCustomer}
                    className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 border-0"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Register & Select
                  </Button>
                  <Button
                    onClick={() => { setShowAddForm(false); setFormData({ name: '', phone: '', location: '', notes: '' }); }}
                    variant="outline"
                    className="border-[#B8860B]/30 text-[#1A1A1A] hover:bg-[#B8860B]/10 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer List */}
          <Card className="border-[#B8860B]/20 bg-white">
            <CardHeader className="pb-3 border-b border-[#B8860B]/10">
              <CardTitle className="text-lg text-[#1A1A1A] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#B8860B]" />
                Customers
                <Badge variant="outline" className="border-[#B8860B]/30 text-[#B8860B] ml-2">
                  {filteredCustomers.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredCustomers.length > 0 ? (
                <div className="divide-y divide-[#B8860B]/10">
                  {filteredCustomers.map((customer) => {
                    const isSelected = selectedCustomerId === customer.id;
                    const location = getCustomerLocation(customer);
                    const orderCount = customerOrderCounts[customer.id] || 0;
                    return (
                      <div
                        key={customer.id}
                        className={`flex items-center justify-between p-4 hover:bg-[#FFF8F0]/60 transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50/80 border-l-4 border-l-emerald-500' : ''
                        }`}
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                              : 'bg-gradient-to-br from-[#B8860B] to-[#DAA520]'
                          }`}>
                            <span className="text-white font-bold text-sm">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#1A1A1A] truncate">{customer.name}</p>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                              </span>
                              {location && (
                                <span className="flex items-center gap-1 hidden md:flex">
                                  <MapPin className="w-3 h-3" />
                                  {location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-[#6B6B6B]">{orderCount} orders</p>
                            <p className="text-xs text-[#6B6B6B]">{customer.id}</p>
                          </div>
                          {isSelected ? (
                            <Button
                              onClick={(e) => { e.stopPropagation(); onNavigate?.('Products'); }}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs border-0 transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                              <Package className="w-3.5 h-3.5 mr-1" />
                              Products
                            </Button>
                          ) : (
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleSelectCustomer(customer); }}
                              size="sm"
                              variant="outline"
                              className="border-[#B8860B]/30 text-[#B8860B] hover:bg-[#B8860B]/10 text-xs transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                              Select
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-[#B8860B]/30 mx-auto mb-3" />
                  <p className="text-[#6B6B6B] font-medium">
                    {searchTerm ? 'No customers match your search' : 'No customers yet'}
                  </p>
                  <p className="text-[#6B6B6B]/70 text-sm mt-1">
                    {searchTerm ? 'Try a different search term' : 'Register a new customer to get started'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick Actions & Info */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card className="border-[#B8860B]/20 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[#1A1A1A]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => { setShowAddForm(true); setSelectedCustomerId(null); }}
                variant="outline"
                className="w-full justify-start border-[#B8860B]/20 text-[#1A1A1A] hover:bg-[#B8860B]/10 hover:border-[#B8860B]/40 h-12 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-[#B8860B]/10 flex items-center justify-center mr-3">
                  <UserPlus className="w-4 h-4 text-[#B8860B]" />
                </div>
                Register New Customer
              </Button>
              <Button
                onClick={() => onNavigate?.('Products')}
                variant="outline"
                className="w-full justify-start border-[#B8860B]/20 text-[#1A1A1A] hover:bg-[#B8860B]/10 hover:border-[#B8860B]/40 h-12 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                Browse Products
              </Button>
              <Button
                onClick={() => onNavigate?.('Cart')}
                variant="outline"
                className="w-full justify-start border-[#B8860B]/20 text-[#1A1A1A] hover:bg-[#B8860B]/10 hover:border-[#B8860B]/40 h-12 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                </div>
                View Cart
                {cart.length > 0 && (
                  <Badge className="ml-auto bg-[#B8860B] text-white">{cart.length}</Badge>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[#1A1A1A]">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#B8860B] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-[#1A1A1A] text-sm">Register Customer</p>
                  <p className="text-xs text-[#6B6B6B]">Register a new walk-in or select an existing customer</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#B8860B] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-[#1A1A1A] text-sm">Browse & Add Products</p>
                  <p className="text-xs text-[#6B6B6B]">Navigate to Products and add items to cart while assisting the customer in-store</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#B8860B] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-[#1A1A1A] text-sm">Checkout</p>
                  <p className="text-xs text-[#6B6B6B]">Proceed to checkout from Cart to generate the purchase order</p>
                </div>
              </div>
              <div className="border-t border-[#B8860B]/10 pt-3">
                <p className="text-xs text-[#6B6B6B] italic">
                  You can handle multiple customers at once — each customer's products are added independently to their cart.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          {branchOrders.length > 0 && (
            <Card className="border-[#B8860B]/20 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-[#1A1A1A] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#B8860B]" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[#B8860B]/10">
                  {branchOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{order.customerName}</p>
                        <p className="text-xs text-[#6B6B6B]">{order.poNumber || order.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#B8860B]">
                          ₹{order.total.toLocaleString('en-IN')}
                        </p>
                        <Badge
                          className={`text-xs ${
                            order.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : order.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};