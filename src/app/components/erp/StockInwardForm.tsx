import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  Package,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useApp } from '@/app/context/AppContext';
import type { BranchLocation } from '@/app/types';

interface StockInwardFormProps {
  userRole: 'super-admin' | 'branch-admin' | 'stock-manager';
  currentBranchId?: string;
  onSubmit?: (data: any) => void;
}

export const StockInwardForm: React.FC<StockInwardFormProps> = ({
  userRole,
  currentBranchId,
  onSubmit,
}) => {
  const { dealers, branches, addBranchStockEntry, addStockMovement, addNotification, currentUser } = useApp();
  const [formData, setFormData] = useState({
    poNumber: '',
    vendorId: '',
    branchId: currentBranchId || '',
    productName: '',
    category: 'granite' as 'granite' | 'tiles' | 'sanitary',
    sku: '',
    rackLocation: '',
    quantity: '',
    brokenQuantity: '',
    qcRemarks: '',
    totalAmount: '',
    inwardDate: new Date().toISOString().split('T')[0],
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const qty = parseInt(formData.quantity) || 0;
  const brokenQty = parseInt(formData.brokenQuantity) || 0;
  const freshStock = qty - brokenQty;
  const totalAmt = parseFloat(formData.totalAmount) || 0;
  const costPerUnit = qty > 0 ? totalAmt / qty : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.poNumber || !formData.vendorId || !formData.branchId) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!formData.productName.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (qty <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }

    if (brokenQty > qty) {
      toast.error('Broken quantity cannot exceed total quantity');
      return;
    }

    const rackTrimmed = formData.rackLocation.trim().toUpperCase();
    if (!rackTrimmed) {
      toast.error('Rack location is required for stock inward');
      return;
    }
    if (!/^[A-Za-z0-9]+$/.test(rackTrimmed)) {
      toast.error('Rack code must be alphanumeric only (e.g., A1, B12, R3)');
      return;
    }

    // Resolve dealer and branch names
    const selectedDealer = dealers.find(d => d.id === formData.vendorId);
    const selectedBranch = branches.find(b => b.id === formData.branchId);
    const skuGenerated = formData.sku || `${formData.productName.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // 1. Create/update branch stock entry in Firebase (rack location is per-branch)
    const stockEntry = addBranchStockEntry({
      productId: `PROD-INWARD-${Date.now()}`,
      productName: formData.productName.trim(),
      branchId: formData.branchId,
      branchLocation: (selectedBranch?.location || 'aziz-nagar') as BranchLocation,
      category: formData.category,
      sku: skuGenerated,
      dealerId: formData.vendorId,
      dealerName: selectedDealer?.name || '',
      freshQuantity: freshStock,
      brokenQuantity: brokenQty,
      mrp: costPerUnit * 1.3,
      sellingPriceMin: costPerUnit,
      sellingPriceMax: costPerUnit * 1.3,
      costPrice: costPerUnit,
      rackLocation: rackTrimmed,
      grade: undefined,
      size: undefined,
    });

    // 2. Log stock movement for the inventory ledger
    addStockMovement({
      productId: stockEntry.productId,
      productName: formData.productName.trim(),
      type: 'in',
      quantity: qty,
      price: costPerUnit,
      invoiceReference: formData.poNumber,
      userId: currentUser?.id || '',
      userName: currentUser?.name || '',
      notes: `Stock Inward: ${qty} units received (${brokenQty} broken, ${freshStock} fresh) from ${selectedDealer?.name || 'Unknown Dealer'} at rack ${rackTrimmed}. ${formData.qcRemarks ? 'QC: ' + formData.qcRemarks : ''}`,
    });

    // 3. Send notification (branch-scoped so only relevant branch sees it)
    addNotification({
      type: 'success',
      title: 'Stock Inward Recorded',
      message: `${formData.productName} — ${freshStock} fresh units added to ${selectedBranch?.name || 'Branch'} at rack ${rackTrimmed}`,
      branchLocation: selectedBranch?.location || 'central',
    });

    toast.success('Stock inward entry created and saved to database!');
    onSubmit?.({
      ...formData,
      rackLocation: rackTrimmed,
      quantity: qty,
      brokenQuantity: brokenQty,
      totalAmount: totalAmt,
      freshStock,
      costPerUnit,
    });

    setFormData({
      poNumber: '',
      vendorId: '',
      branchId: currentBranchId || '',
      productName: '',
      category: 'granite',
      sku: '',
      rackLocation: '',
      quantity: '',
      brokenQuantity: '',
      qcRemarks: '',
      totalAmount: '',
      inwardDate: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="border-[#B8860B]/20 shadow-lg">
        <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
          <div>
            <CardTitle className="text-2xl bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
              Stock Inward Entry
            </CardTitle>
            <CardDescription className="mt-2">
              Record new stock received from dealers with quantity, pricing, and quality details
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="poNumber">
                  PO Number <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="poNumber"
                  value={formData.poNumber}
                  onChange={(e) => handleInputChange('poNumber', e.target.value)}
                  placeholder="PO-2024-XXX"
                  required
                  className="border-[#B8860B]/30"
                />
              </div>

              <div>
                <Label htmlFor="vendorId">
                  Dealer <span className="text-orange-500">*</span>
                </Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={(value) => handleInputChange('vendorId', value)}
                >
                  <SelectTrigger className="border-[#B8860B]/30">
                    <SelectValue placeholder="Select dealer" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealers.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-[#D4AF37]/60">
                        No dealers available. Please add dealers first.
                      </div>
                    ) : (
                      dealers.map((dealer) => (
                        <SelectItem key={dealer.id} value={dealer.id}>
                          {dealer.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="branchId">
                  Branch <span className="text-orange-500">*</span>
                </Label>
                {userRole !== 'super-admin' ? (
                  <Input
                    id="branchId"
                    value={branches.find(b => b.id === formData.branchId)?.name || 'Loading...'}
                    readOnly
                    disabled
                    className="border-[#B8860B]/30 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                ) : (
                  <Select
                    value={formData.branchId || undefined}
                    onValueChange={(value) => handleInputChange('branchId', value)}
                  >
                    <SelectTrigger className="border-[#B8860B]/30">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="productName">
                  Product Name <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                  placeholder="e.g., Italian Marble White"
                  required
                  className="border-[#B8860B]/30"
                />
              </div>

              <div>
                <Label htmlFor="category">
                  Category <span className="text-orange-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className="border-[#B8860B]/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="granite">Granite</SelectItem>
                    <SelectItem value="tiles">Tiles</SelectItem>
                    <SelectItem value="sanitary">Sanitary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="e.g., IMW-001"
                  className="border-[#B8860B]/30"
                />
              </div>

              <div>
                <Label htmlFor="rackLocation">Rack Location <span className="text-orange-500">*</span></Label>
                <Input
                  id="rackLocation"
                  value={formData.rackLocation}
                  onChange={(e) => handleInputChange('rackLocation', e.target.value)}
                  placeholder="e.g., A1"
                  className="border-[#B8860B]/30"
                />
              </div>
            </div>

            {/* Stock & Pricing */}
            <div className="border-2 border-[#B8860B]/30 rounded-lg p-6 bg-gradient-to-br from-[#FFF8F0] to-white">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#B8860B]" />
                <h3 className="text-lg font-semibold text-[#2C2C2C]">
                  Stock & Pricing
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="quantity" className="text-[#2C2C2C]">
                    Quantity Received <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="e.g., 1500"
                    required
                    className="border-[#B8860B]/40 bg-white text-lg font-semibold"
                  />
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    Total units received at the warehouse
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="totalAmount" className="text-[#2C2C2C]">
                      Total Amount <span className="text-orange-500">*</span>
                    </Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      value={formData.totalAmount}
                      onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                      placeholder="e.g., 195000"
                      required
                      className="border-[#B8860B]/40 bg-white"
                    />
                  </div>

                  {totalAmt > 0 && qty > 0 && (
                    <div className="p-3 bg-white rounded border border-[#B8860B]/20">
                      <p className="text-sm text-[#B8860B] font-semibold">
                        Cost per unit: ₹{costPerUnit.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quality Check */}
            <div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-900">Quality Check</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brokenQuantity" className="text-orange-900">
                    Broken/Damaged Quantity
                  </Label>
                  <Input
                    id="brokenQuantity"
                    type="number"
                    value={formData.brokenQuantity}
                    onChange={(e) => handleInputChange('brokenQuantity', e.target.value)}
                    placeholder="e.g., 50"
                    className="border-orange-400 bg-white"
                  />
                  {brokenQty > 0 && qty > 0 && (
                    <p className="text-xs text-orange-700 mt-1">
                      Fresh stock available: <span className="font-semibold">{freshStock} units</span>
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="qcRemarks" className="text-orange-900">QC Remarks</Label>
                  <Textarea
                    id="qcRemarks"
                    value={formData.qcRemarks}
                    onChange={(e) => handleInputChange('qcRemarks', e.target.value)}
                    placeholder="e.g., 50 boxes damaged during transit, corners chipped"
                    className="border-orange-400 bg-white resize-none h-20"
                  />
                </div>
              </div>
            </div>

            {/* Inward Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inwardDate">Inward Date</Label>
                <Input
                  id="inwardDate"
                  type="date"
                  value={formData.inwardDate}
                  onChange={(e) => handleInputChange('inwardDate', e.target.value)}
                  className="border-[#B8860B]/30"
                />
              </div>
            </div>

            {/* Summary Card */}
            {qty > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-gradient-to-br from-[#FFF8F0] to-white border-2 border-[#B8860B]/30 rounded-lg"
              >
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Entry Summary
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">Total Quantity</p>
                    <p className="text-2xl font-bold text-blue-900">{qty}</p>
                  </div>

                  {brokenQty > 0 && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs text-orange-700 mb-1">Broken Stock</p>
                      <p className="text-2xl font-bold text-orange-900">{brokenQty}</p>
                    </div>
                  )}

                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 mb-1">Fresh Stock</p>
                    <p className="text-2xl font-bold text-green-900">{freshStock}</p>
                  </div>

                  {totalAmt > 0 && (
                    <div className="p-3 bg-[#FFF8F0] rounded-lg border border-[#B8860B]/20">
                      <p className="text-xs text-[#B8860B] mb-1">Total Value</p>
                      <p className="text-2xl font-bold text-[#B8860B]">₹{totalAmt.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#B8860B]/20">
              <Button
                type="button"
                variant="outline"
                className="border-[#B8860B]/30 hover:bg-[#FFF8F0]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white px-8"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Create Stock Inward Entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
