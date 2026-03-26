import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { useApp } from '@/app/context/AppContext';
import { ArrowLeft, Upload, Box, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface AddStockProps {
  onBack: () => void;
}

export const AddStock: React.FC<AddStockProps> = ({ onBack }) => {
  const { dealers, products, updateProduct, addProduct } = useApp();
  const [formData, setFormData] = useState({
    dealerId: '',
    productType: 'existing',
    existingProductId: '',
    newProductName: '',
    newProductCategory: '',
    newProductDescription: '',
    quantity: 0,
    destinationBranch: '', // Branch allocation
    measurements: '',
    purchasePrice: 0,
    sellingPrice: 0,
    specifications: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In a real app, upload to server and get URLs
      const imageUrls = Array.from(files).map((file) => URL.createObjectURL(file));
      setImages([...images, ...imageUrls]);
      toast.success(`${files.length} image(s) uploaded`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedDealer = dealers.find(d => d.id === formData.dealerId);
      if (!selectedDealer) {
        toast.error('Please select a dealer');
        setIsSubmitting(false);
        return;
      }

      if (formData.productType === 'existing') {
        // Update existing product stock
        const product = products.find(p => p.id === formData.existingProductId);
        if (product) {
          updateProduct(product.id, {
            stock: product.stock + formData.quantity,
          });
          toast.success(`Added ${formData.quantity} units to ${product.name}`);
        }
      } else {
        // Add new product
        const specs: Record<string, string> = {};
        if (formData.specifications) {
          formData.specifications.split(',').forEach(spec => {
            const [key, value] = spec.split(':').map(s => s.trim());
            if (key && value) specs[key] = value;
          });
        }

        addProduct({
          name: formData.newProductName,
          category: formData.newProductCategory,
          description: formData.newProductDescription,
          price: formData.sellingPrice,
          stock: formData.quantity,
          dealerId: selectedDealer.id,
          dealerName: selectedDealer.name,
          enabled: true,
          specifications: specs,
        });

        toast.success('New product added to inventory');
      }

      // Show success state
      setTimeout(() => {
        setIsSubmitting(false);
        toast.success('Stock has been added successfully');
        setTimeout(() => onBack(), 1500);
      }, 1000);

    } catch (error) {
      toast.error('Failed to add stock');
      setIsSubmitting(false);
    }
  };

  const selectedDealer = dealers.find(d => d.id === formData.dealerId);

  if (isSubmitting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-[#1A1A1A] mb-2">Adding Stock...</h3>
          <p className="text-[#6B6B6B]">Please wait while we update the inventory</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            Add Stock
          </h1>
          <p className="text-[#6B6B6B]">Add new inventory to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dealer Selection */}
        <Card className="border-[#B8860B]/20">
          <CardHeader>
            <CardTitle className="text-[#B8860B]">Dealer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dealer">Select Dealer *</Label>
              <Select
                value={formData.dealerId}
                onValueChange={(value) => setFormData({ ...formData, dealerId: value })}
                required
              >
                <SelectTrigger className="border-[#B8860B]/30 focus:border-[#B8860B]">
                  <SelectValue placeholder="Choose a dealer" />
                </SelectTrigger>
                <SelectContent>
                  {dealers.map((dealer) => (
                    <SelectItem key={dealer.id} value={dealer.id}>
                      {dealer.name} - {dealer.gstNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDealer && (
              <div className="p-4 rounded-lg bg-[#FFF8F0] border border-[#B8860B]/20">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[#6B6B6B]">Contact:</p>
                    <p className="font-medium text-[#1A1A1A]">{selectedDealer.phone}</p>
                  </div>
                  <div>
                    <p className="text-[#6B6B6B]">GST:</p>
                    <p className="font-medium text-[#1A1A1A]">{selectedDealer.gstNumber}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card className="border-[#B8860B]/20">
          <CardHeader>
            <CardTitle className="text-[#B8860B]">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Type *</Label>
              <Select
                value={formData.productType}
                onValueChange={(value) => setFormData({ ...formData, productType: value })}
              >
                <SelectTrigger className="border-[#B8860B]/30 focus:border-[#B8860B]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Add to Existing Product</SelectItem>
                  <SelectItem value="new">Create New Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.productType === 'existing' ? (
              <div className="space-y-2">
                <Label htmlFor="product">Select Product *</Label>
                <Select
                  value={formData.existingProductId}
                  onValueChange={(value) => setFormData({ ...formData, existingProductId: value })}
                  required
                >
                  <SelectTrigger className="border-[#B8860B]/30 focus:border-[#B8860B]">
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter(p => p.dealerId === formData.dealerId)
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - Current Stock: {product.stock}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newProductName">Product Name *</Label>
                    <Input
                      id="newProductName"
                      placeholder="e.g., Italian Marble White"
                      value={formData.newProductName}
                      onChange={(e) => setFormData({ ...formData, newProductName: e.target.value })}
                      className="border-[#B8860B]/30 focus:border-[#B8860B]"
                      required={formData.productType === 'new'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.newProductCategory}
                      onValueChange={(value) => setFormData({ ...formData, newProductCategory: value })}
                      required={formData.productType === 'new'}
                    >
                      <SelectTrigger className="border-[#B8860B]/30 focus:border-[#B8860B]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tiles">Tiles</SelectItem>
                        <SelectItem value="Marble">Marble</SelectItem>
                        <SelectItem value="Granite">Granite</SelectItem>
                        <SelectItem value="Quartz">Quartz</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Product description..."
                    value={formData.newProductDescription}
                    onChange={(e) => setFormData({ ...formData, newProductDescription: e.target.value })}
                    className="border-[#B8860B]/30 focus:border-[#B8860B]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specifications">Specifications (Format: Size: 2x2 ft, Finish: Glossy)</Label>
                  <Input
                    id="specifications"
                    placeholder="Size: 2x2 ft, Finish: Glossy, Material: Ceramic"
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    className="border-[#B8860B]/30 focus:border-[#B8860B]"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* OSK Purchase & Branch Allocation */}
        <Card className="border-[#C9A961]/30 bg-gradient-to-br from-[#C9A961]/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-[#C9A961] flex items-center gap-2">
              <Box className="w-5 h-5" />
              OSK Purchase & Branch Allocation
            </CardTitle>
            <p className="text-sm text-[#6B6B6B] mt-1">
              Stock is purchased under <span className="font-bold text-[#C9A961]">OSK Granite</span> and allocated to branches
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Purchasing Entity */}
            <div className="p-4 rounded-lg bg-[#C9A961]/10 border-2 border-[#C9A961]/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Purchasing Entity</p>
                  <p className="text-2xl font-bold text-[#C9A961]">OSK Granite</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">All dealer purchases are made under OSK company</p>
                </div>
                <div className="w-16 h-16 bg-[#C9A961] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">OSK</span>
                </div>
              </div>
            </div>

            {/* Quantity & Branch */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity (Physical Stock) *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  placeholder="e.g., 1500 boxes"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="border-[#C9A961]/30 focus:border-[#C9A961]"
                  required
                />
                <p className="text-xs text-[#6B6B6B]">Total physical stock received</p>
              </div>
            </div>

            {/* Branch Allocation */}
            <div className="space-y-2">
              <Label htmlFor="destinationBranch">
                Allocate to Branch *
              </Label>
              <Select
                value={formData.destinationBranch}
                onValueChange={(value) => setFormData({ ...formData, destinationBranch: value })}
                required
              >
                <SelectTrigger className="border-[#C9A961]/30 focus:border-[#C9A961]">
                  <SelectValue placeholder="Select destination branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aziz-nagar">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#C9A961]" />
                      Aziz Nagar
                    </div>
                  </SelectItem>
                  <SelectItem value="vikarabad">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#7C1D1D]" />
                      Vikarabad
                    </div>
                  </SelectItem>
                  <SelectItem value="sangareddy">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                      Sangareddy
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[#6B6B6B]">Stock will be allocated to the selected branch inventory</p>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
          <CardHeader>
            <CardTitle className="text-[#B8860B]">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#6B6B6B]">Total Quantity:</p>
                <p className="text-xl font-bold text-[#B8860B]">{formData.quantity} units</p>
              </div>
              <div>
                <p className="text-[#6B6B6B]">Total Investment:</p>
                <p className="text-xl font-bold text-[#B8860B]">
                  ₹{(formData.quantity * formData.purchasePrice).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white"
            disabled={!formData.dealerId || formData.quantity === 0}
          >
            <Box className="w-4 h-4 mr-2" />
            Add Stock to Inventory
          </Button>
        </div>
      </form>
    </div>
  );
};