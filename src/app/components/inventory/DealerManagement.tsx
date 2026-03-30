import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Plus, Building2, Phone, Mail, MapPin, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export const DealerManagement: React.FC = () => {
  const { dealers, addDealer } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    state: '',
    district: '',
    paymentTerms: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDealer({
        ...formData,
        totalPurchases: 0,
        totalPaid: 0,
        outstandingPayment: 0,
        payments: [],
      });
      toast.success('Dealer added successfully');
      setIsDialogOpen(false);
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        state: '',
        district: '',
        paymentTerms: '',
      });
    } catch {
      toast.error('Failed to add dealer. Check permissions and try again.');
    }
  };

  const totalOutstanding = dealers.reduce((sum, d) => sum + d.outstandingPayment, 0);
  const totalPurchases = dealers.reduce((sum, d) => sum + d.totalPurchases, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
            Dealer Management
          </h2>
          <p className="text-[#6B6B6B] mt-1">Manage dealer relationships, locations, and payment information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B]">
              <Plus className="h-4 w-4 mr-2" />
              Add Dealer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Dealer</DialogTitle>
              <DialogDescription>
                Add a new dealer to your network with complete location and payment information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g., Maharashtra"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="e.g., Mumbai"
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms *</Label>
                  <Input
                    id="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="e.g., Net 30 days, 50% advance, etc."
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[#B8860B] to-[#DAA520]">
                  Add Dealer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#B8860B]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Dealers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#B8860B]">{dealers.length}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Active partnerships</p>
          </CardContent>
        </Card>
        <Card className="border-[#B8860B]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#B8860B]">₹{(totalPurchases / 100000).toFixed(1)}L</div>
            <p className="text-xs text-[#6B6B6B] mt-1">All time</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-800">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">₹{totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-red-700 mt-1">Pending payments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dealers.map((dealer, index) => (
          <motion.div
            key={dealer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow border-[#B8860B]/20 hover:border-[#B8860B]/40">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#B8860B] to-[#DAA520] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">{dealer.name}</CardTitle>
                    <p className="text-sm text-[#6B6B6B]">{dealer.contactPerson}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{dealer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{dealer.email}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-[#6B6B6B]">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="line-clamp-1">{dealer.address}</p>
                    {dealer.district && dealer.state && (
                      <p className="text-xs mt-1">
                        <span className="font-medium">{dealer.district}</span>, {dealer.state}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="pt-3 border-t border-[#B8860B]/10 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B6B6B]">Payment Terms</span>
                    <Badge variant="secondary" className="bg-[#FFF8F0] text-[#B8860B] border border-[#B8860B]/20">
                      {dealer.paymentTerms}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B6B6B]">Total Purchases</span>
                    <span className="font-semibold text-[#B8860B]">
                      ₹{(dealer.totalPurchases / 100000).toFixed(1)}L
                    </span>
                  </div>
                  {dealer.outstandingPayment > 0 && (
                    <div className="flex items-center justify-between text-sm p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-[#6B6B6B] flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        Outstanding
                      </span>
                      <span className="font-semibold text-red-600">
                        ₹{dealer.outstandingPayment.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                    <Calendar className="h-3 w-3" />
                    <span>Member since {new Date(dealer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {dealers.length === 0 && (
        <Card className="border-dashed border-[#B8860B]/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-[#B8860B]/40 mb-4" />
            <h3 className="font-medium mb-2">No dealers yet</h3>
            <p className="text-sm text-[#6B6B6B] mb-4">Add your first dealer to get started</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-[#B8860B] to-[#DAA520]">
              <Plus className="h-4 w-4 mr-2" />
              Add Dealer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};