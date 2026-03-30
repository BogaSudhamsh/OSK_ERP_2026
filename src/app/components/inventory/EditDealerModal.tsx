import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Building2, MapPin, Phone, Mail, User, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface EditDealerModalProps {
  dealerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EditDealerModal: React.FC<EditDealerModalProps> = ({ dealerId, isOpen, onClose }) => {
  const { updateDealer, dealers } = useApp();
  const dealer = dealers.find(d => d.id === dealerId);
  const isPlaceholderDealer = dealer?.contactPerson === 'Pending Update' || dealer?.phone === '0000000000';

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
    paymentTerms: '',
  });

  // Populate form when dealer changes
  useEffect(() => {
    if (dealer) {
      setFormData({
        name: dealer.name || '',
        contactPerson: dealer.contactPerson || '',
        email: dealer.email || '',
        phone: dealer.phone || '',
        gstNumber: dealer.gstNumber || '',
        address: dealer.address || '',
        city: dealer.city || '',
        state: dealer.state || '',
        district: dealer.district || '',
        pincode: dealer.pincode || '',
        paymentTerms: dealer.paymentTerms || 'Net 30',
      });
    }
  }, [dealer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Dealer name is required');
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

    updateDealer(dealerId, {
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      gstNumber: formData.gstNumber.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      district: formData.district.trim(),
      pincode: formData.pincode.trim(),
      paymentTerms: formData.paymentTerms,
    });

    toast.success(
      <div>
        <p className="font-semibold">Dealer Updated Successfully!</p>
        <p className="text-sm">{formData.name}</p>
      </div>
    );

    onClose();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <p>Edit Dealer</p>
              <p className="text-sm font-normal text-[#6B6B6B]">Update dealer information</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {isPlaceholderDealer && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-900">This dealer still has placeholder import details.</p>
              <p className="text-xs text-amber-800 mt-1">Update the contact person and phone number before using this dealer for regular operations.</p>
            </div>
          )}

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2 border-b border-[#B8860B]/20 pb-2">
              <Building2 className="w-4 h-4 text-[#B8860B]" />
              Business Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                Business Name <span className="text-[#B8860B]">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter business name"
                className="border-[#B8860B]/20 focus:border-[#B8860B]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-gstNumber" className="text-sm font-medium">
                GST Number
              </Label>
              <Input
                id="edit-gstNumber"
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
              <Label htmlFor="edit-contactPerson" className="text-sm font-medium">
                Contact Person
              </Label>
              <Input
                id="edit-contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="Enter contact person name"
                className="border-[#B8860B]/20 focus:border-[#B8860B]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="1234567890"
                    className="pl-10 border-[#B8860B]/20 focus:border-[#B8860B]"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                  <Input
                    id="edit-email"
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
              <Label htmlFor="edit-address" className="text-sm font-medium">
                Address
              </Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter address"
                className="border-[#B8860B]/20 focus:border-[#B8860B]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city" className="text-sm font-medium">
                  City
                </Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Enter city"
                  className="border-[#B8860B]/20 focus:border-[#B8860B]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-district" className="text-sm font-medium">
                  District
                </Label>
                <Input
                  id="edit-district"
                  value={formData.district}
                  onChange={(e) => handleChange('district', e.target.value)}
                  placeholder="Enter district"
                  className="border-[#B8860B]/20 focus:border-[#B8860B]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-state" className="text-sm font-medium">
                  State
                </Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="Enter state"
                  className="border-[#B8860B]/20 focus:border-[#B8860B]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-pincode" className="text-sm font-medium">
                Pincode
              </Label>
              <Input
                id="edit-pincode"
                value={formData.pincode}
                onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="border-[#B8860B]/20 focus:border-[#B8860B]"
                maxLength={6}
              />
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
              <Pencil className="w-4 h-4 mr-2" />
              Update Dealer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};