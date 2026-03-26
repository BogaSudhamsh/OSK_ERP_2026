import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useApp } from '@/app/context/AppContext';
import { ArrowLeft, User, Phone, MapPin, Calendar, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface CustomerCreationProps {
  onBack: () => void;
  onSuccess: (customerId: string) => void;
}

export const CustomerCreation: React.FC<CustomerCreationProps> = ({ onBack, onSuccess }) => {
  const { addCustomer, currentUser } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate Customer ID
      const customerId = `CUST-${Date.now().toString(36).toUpperCase()}`;
      
      // Create customer
      const newCustomer = addCustomer({
        name: formData.name,
        phone: formData.phone,
        email: '',
        address: formData.location,
        city: formData.location.split(',')[0]?.trim() || '',
        state: formData.location.split(',')[1]?.trim() || '',
        pincode: '',
        storeId: currentUser?.id || 'store-1',
        branchId: currentUser?.branchId || '',
        branchLocation: currentUser?.branchLocation,
        images: [],
      });

      toast.success(`Customer created successfully!`);
      toast.info(`Customer ID: ${customerId}`);

      // Wait a moment to show success state
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(newCustomer.id);
      }, 1500);

    } catch (error) {
      toast.error('Failed to create customer');
      setIsSubmitting(false);
    }
  };

  const isValid = formData.name && formData.phone;

  if (isSubmitting) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-[#B8860B]/20">
          <CardContent className="py-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center">
                <Check className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">Creating Customer Profile</h3>
                <p className="text-[#6B6B6B]">Generating Customer ID and storing data...</p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-[#B8860B] hover:bg-[#FFF8F0]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
            New Customer
          </h1>
          <p className="text-[#6B6B6B]">Create customer profile for store visit</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-[#B8860B]/20">
          <CardHeader>
            <CardTitle className="text-[#B8860B] flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#B8860B]" />
                Customer Name *
              </Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-[#B8860B]/30 focus:border-[#B8860B]"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#B8860B]" />
                Mobile Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-[#B8860B]/30 focus:border-[#B8860B]"
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#B8860B]" />
                Address / Location
              </Label>
              <Textarea
                id="location"
                placeholder="Enter customer address"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="border-[#B8860B]/30 focus:border-[#B8860B]"
                rows={3}
              />
            </div>

            {/* Visit Date (Auto) */}
            <div className="p-4 rounded-lg bg-[#FFF8F0] border border-[#B8860B]/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#B8860B]" />
                <Label className="text-[#B8860B] mb-0">Visit Date</Label>
              </div>
              <p className="text-lg font-semibold text-[#1A1A1A]">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-sm text-[#6B6B6B] mt-1">
                {new Date().toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> A unique Customer ID will be automatically generated upon creation. 
                This ID will be used to track all interactions, orders, and design visualizations for this customer.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 mr-2" />
            Create Customer Profile
          </Button>
        </div>
      </form>
    </div>
  );
};