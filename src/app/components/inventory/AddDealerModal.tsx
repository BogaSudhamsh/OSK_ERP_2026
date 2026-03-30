import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Building2, MapPin, Phone, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

interface AddDealerModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
}

export const AddDealerModal: React.FC<AddDealerModalProps> = ({ open, isOpen, onClose }) => {
  const { addDealer } = useApp();
  const modalOpen = open ?? isOpen ?? false;
  
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    district: '',
    pincode: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.contactPerson || !formData.phone) {
      toast.error('Please fill in all required fields (Name, Contact Person, Phone)');
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    try {
      const newDealer = await addDealer({
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        gstNumber: formData.gstNumber,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        district: formData.district,
        pincode: formData.pincode,
        paymentTerms: 'Net 30',
        totalPurchases: 0,
        totalPaid: 0,
        outstandingPayment: 0,
        payments: [],
      });

      toast.success(
        <div>
          <p className="font-semibold">Dealer Added Successfully!</p>
          <p className="text-sm">{newDealer.name} - {newDealer.city}</p>
        </div>
      );

      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        gstNumber: '',
        address: '',
        city: '',
        state: '',
        district: '',
        pincode: '',
      });

      onClose();
    } catch {
      toast.error('Failed to add dealer. Check permissions and try again.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={modalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p>Add New Dealer</p>
              <p className="text-sm font-normal text-[#6B6B6B]">Register a new dealer in the system</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2 border-b border-[#B8860B]/20 pb-2">
              <Building2 className="w-4 h-4 text-[#B8860B]" />
              Business Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Business Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter business name"
                className="border-[#B8860B]/20 focus:border-[#B8860B]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstNumber" className="text-sm font-medium">
                GST Number
              </Label>
              <Input
                id="gstNumber"
                value={formData.gstNumber}
                onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                className="border-[#B8860B]/20 focus:border-[#B8860B]"
                maxLength={15}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2 border-b border-[#B8860B]/20 pb-2">
              <User className="w-4 h-4 text-[#B8860B]" />
              Contact Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="contactPerson" className="text-sm font-medium">
                Contact Person <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="Enter contact person name"
                className="border-[#B8860B]/20 focus:border-[#B8860B]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="1234567890"
                    className="pl-10 border-[#B8860B]/20 focus:border-[#B8860B]"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="dealer@example.com"
                    className="pl-10 border-[#B8860B]/20 focus:border-[#B8860B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2 border-b border-[#B8860B]/20 pb-2">
              <MapPin className="w-4 h-4 text-[#B8860B]" />
              Address Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Street Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter street address"
                className="border-[#B8860B]/20 focus:border-[#B8860B]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  City
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Enter city"
                  className="border-[#B8860B]/20 focus:border-[#B8860B]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-medium">
                  District
                </Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                  placeholder="Enter district"
                  className="border-[#B8860B]/20 focus:border-[#B8860B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">
                  State
                </Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="Enter state"
                  className="border-[#B8860B]/20 focus:border-[#B8860B]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-sm font-medium">
                  Pincode
                </Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="border-[#B8860B]/20 focus:border-[#B8860B]"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#B8860B]/20">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#B8860B]/20 text-[#6B6B6B] hover:bg-[#FFF8F0]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Add Dealer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};