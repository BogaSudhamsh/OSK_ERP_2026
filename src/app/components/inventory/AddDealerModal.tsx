import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Building2, MapPin, Phone, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

interface AddDealerModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
}

export const AddDealerModal: React.FC<AddDealerModalProps> = ({ open, isOpen, onClose }) => {
  const { addDealer, dealers } = useApp();
  const modalOpen = open ?? isOpen ?? false;
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  const [bulkDealerNames, setBulkDealerNames] = useState('');
  const [bulkContactPerson, setBulkContactPerson] = useState('Pending Update');
  const [bulkPhone, setBulkPhone] = useState('0000000000');

  const resetSingleForm = () => {
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
  };

  const resetBulkForm = () => {
    setBulkDealerNames('');
    setBulkContactPerson('Pending Update');
    setBulkPhone('0000000000');
  };

  const normalizeDealerName = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedNames = bulkDealerNames
      .split(/\r?\n/)
      .map((name) => name.trim())
      .filter(Boolean);

    if (parsedNames.length === 0) {
      toast.error('Paste at least one dealer name to import');
      return;
    }

    if (!bulkContactPerson.trim()) {
      toast.error('Enter a default contact person for imported dealers');
      return;
    }

    if (!/^\d{10}$/.test(bulkPhone)) {
      toast.error('Enter a valid 10-digit default phone number');
      return;
    }

    const existingNames = new Set(dealers.map((dealer) => normalizeDealerName(dealer.name)));
    const seenNames = new Set<string>();
    const uniqueNames = parsedNames.filter((name) => {
      const normalized = normalizeDealerName(name);
      if (seenNames.has(normalized)) {
        return false;
      }
      seenNames.add(normalized);
      return true;
    });

    const dealersToCreate = uniqueNames.filter((name) => !existingNames.has(normalizeDealerName(name)));

    if (dealersToCreate.length === 0) {
      toast.error('All pasted dealers already exist in Firestore');
      return;
    }

    setIsSubmitting(true);

    try {
      for (const name of dealersToCreate) {
        await addDealer({
          name,
          contactPerson: bulkContactPerson.trim(),
          phone: bulkPhone,
          email: '',
          gstNumber: '',
          address: '',
          city: '',
          state: '',
          district: '',
          pincode: '',
          paymentTerms: 'Net 30',
          totalPurchases: 0,
          totalPaid: 0,
          outstandingPayment: 0,
          payments: [],
        });
      }

      const skippedCount = uniqueNames.length - dealersToCreate.length;
      toast.success(
        skippedCount > 0
          ? `Imported ${dealersToCreate.length} dealers. Skipped ${skippedCount} existing dealer${skippedCount > 1 ? 's' : ''}.`
          : `Imported ${dealersToCreate.length} dealers successfully.`
      );

      resetBulkForm();
      onClose();
    } catch {
      toast.error('Bulk import failed. Check permissions and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      setIsSubmitting(true);
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

      resetSingleForm();

      onClose();
    } catch {
      toast.error('Failed to add dealer. Check permissions and try again.');
    } finally {
      setIsSubmitting(false);
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

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#FFF8F0] p-1">
          <Button
            type="button"
            variant={mode === 'single' ? 'default' : 'ghost'}
            onClick={() => setMode('single')}
            className={mode === 'single' ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white hover:from-[#DAA520] hover:to-[#B8860B]' : 'text-[#6B6B6B]'}
          >
            Single Dealer
          </Button>
          <Button
            type="button"
            variant={mode === 'bulk' ? 'default' : 'ghost'}
            onClick={() => setMode('bulk')}
            className={mode === 'bulk' ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white hover:from-[#DAA520] hover:to-[#B8860B]' : 'text-[#6B6B6B]'}
          >
            Bulk Import
          </Button>
        </div>

        {mode === 'single' ? (
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
              disabled={isSubmitting}
              className="flex-1 border-[#B8860B]/20 text-[#6B6B6B] hover:bg-[#FFF8F0]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
            >
              <Building2 className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Add Dealer'}
            </Button>
          </div>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-6 mt-4">
            <div className="space-y-4 rounded-2xl border border-[#B8860B]/20 bg-[#FFFDF8] p-4">
              <div className="space-y-2">
                <Label htmlFor="bulkDealerNames" className="text-sm font-medium">
                  Dealer Names
                </Label>
                <Textarea
                  id="bulkDealerNames"
                  value={bulkDealerNames}
                  onChange={(e) => setBulkDealerNames(e.target.value)}
                  placeholder={'Somany Tiles Dealer\nAGL Dealer\nMYK LETE GRATED DEALER'}
                  className="min-h-[220px] border-[#B8860B]/20 focus-visible:border-[#B8860B]"
                />
                <p className="text-xs text-[#6B6B6B]">
                  Paste one dealer name per line. Existing dealer names are skipped automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkContactPerson" className="text-sm font-medium">
                    Default Contact Person
                  </Label>
                  <Input
                    id="bulkContactPerson"
                    value={bulkContactPerson}
                    onChange={(e) => setBulkContactPerson(e.target.value)}
                    placeholder="Pending Update"
                    className="border-[#B8860B]/20 focus:border-[#B8860B]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulkPhone" className="text-sm font-medium">
                    Default Phone Number
                  </Label>
                  <Input
                    id="bulkPhone"
                    value={bulkPhone}
                    onChange={(e) => setBulkPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="0000000000"
                    className="border-[#B8860B]/20 focus:border-[#B8860B]"
                    maxLength={10}
                  />
                </div>
              </div>

              <p className="text-xs text-[#8A6D3B]">
                Use placeholder contact details now and update each dealer later if you do not have real phone numbers yet.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#B8860B]/20">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 border-[#B8860B]/20 text-[#6B6B6B] hover:bg-[#FFF8F0]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
              >
                <Building2 className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Importing...' : 'Import Dealers'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};