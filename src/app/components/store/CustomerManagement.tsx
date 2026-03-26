import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useApp } from '@/app/context/AppContext';
import type { Customer } from '@/app/types';
import { 
  User, 
  Phone, 
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export const CustomerManagement: React.FC<{ onViewCustomer?: (customerId: string) => void }> = ({ onViewCustomer }) => {
  const { currentUser, customers, addCustomer, orders } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    notes: ''
  });

  // Helper to derive display location from the global Customer type
  const getCustomerLocation = (c: Customer) => {
    return [c.city, c.state].filter(Boolean).join(', ') || c.address || '';
  };

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

  const handleAddCustomer = () => {
    if (!formData.name || !formData.phone) {
      toast.error('Please fill in required fields', {
        description: 'Name and phone are required'
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

    setFormData({ name: '', phone: '', location: '', notes: '' });
    setShowAddForm(false);
    
    toast.success('Customer registered successfully!', {
      description: `${newCustomer.name} has been added to the system`
    });
  };

  const filteredCustomers = useMemo(() =>
    customers.filter(customer => {
      // Branch-level isolation: only show customers belonging to this branch
      // Super-admin sees all customers
      const isSuperAdmin = currentUser?.role === 'super-admin';
      const matchesBranch = isSuperAdmin || !currentUser?.branchId || customer.branchId === currentUser.branchId;
      if (!matchesBranch) return false;

      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.phone.includes(searchTerm) ||
                           customer.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }),
    [customers, searchTerm, currentUser]
  );

  return (
    <div className="p-8 space-y-8 bg-[#FFF8F0] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Customer Management</h1>
          <p className="text-[#6B6B6B]">
            Manage and track all your customers
          </p>
        </div>
        <div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Customer
          </Button>
        </div>
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <Card className="border-2 border-[#B8860B]/30 bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-[#1A1A1A]">Register New Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cm-name" className="text-[#1A1A1A]">
                  Customer Name <span className="text-orange-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                  <Input
                    id="cm-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="pl-10 border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cm-phone" className="text-[#1A1A1A]">
                  Phone Number <span className="text-orange-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                  <Input
                    id="cm-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="pl-10 border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cm-location" className="text-[#1A1A1A]">
                  Location (Optional)
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                  <Input
                    id="cm-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State"
                    className="pl-10 border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cm-notes" className="text-[#1A1A1A]">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="cm-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional information about customer"
                  className="border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddCustomer}
                className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 border-0"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Register Customer
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="border-[#B8860B]/30 text-[#1A1A1A] hover:bg-[#B8860B]/10 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="border-2 border-[#B8860B]/20 bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, or ID..."
                className="pl-10 border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => {
          const location = getCustomerLocation(customer);
          const orderCount = customerOrderCounts[customer.id] || 0;
          return (
            <div key={customer.id} className="transition-transform duration-200 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer" onClick={() => onViewCustomer?.(customer.id)}>
              <Card className="border-2 border-[#B8860B]/20 bg-white hover:border-[#B8860B] hover:shadow-xl hover:shadow-[#B8860B]/20 transition-all">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Customer Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#B8860B] to-[#DAA520] rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#1A1A1A]">{customer.name}</h3>
                          <p className="text-xs text-[#6B6B6B]">{customer.id}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-700">
                        Active
                      </span>
                    </div>

                    {/* Branch Badge (visible to super-admin) */}
                    {currentUser?.role === 'super-admin' && customer.branchLocation && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#B8860B]" />
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFF8F0] text-[#B8860B] border border-[#B8860B]/20">
                          {customer.branchLocation.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </div>
                    )}

                    {/* Contact Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                        <Phone className="w-4 h-4 text-[#B8860B]" />
                        <span>{customer.phone}</span>
                      </div>
                      {location && (
                        <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                          <MapPin className="w-4 h-4 text-[#B8860B]" />
                          <span>{location}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                          <span className="text-[#B8860B] text-xs">@</span>
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t-2 border-[#B8860B]/10">
                      <div>
                        <p className="text-xs text-[#6B6B6B]">Orders</p>
                        <p className="text-lg font-semibold text-[#1A1A1A]">{orderCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#6B6B6B]">Registered</p>
                        <p className="text-xs text-[#1A1A1A]">{customer.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 py-3 bg-[#FEFCF8] border-t-2 border-[#B8860B]/10 flex items-center justify-between">
                  <span className="text-xs text-[#B8860B] font-medium flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    View Profile
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#B8860B]" />
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <Card className="border-2 border-[#B8860B]/20 bg-white">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 text-[#6B6B6B] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No customers found</h3>
            <p className="text-[#6B6B6B]">
              {searchTerm
                ? 'Try adjusting your search' 
                : 'Start by adding your first customer'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};