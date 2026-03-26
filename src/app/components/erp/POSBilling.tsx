import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import {
  Plus,
  Trash2,
  FileText,
  Receipt,
  User,
  Phone,
  MapPin,
  Calculator,
  Printer,
  Save,
  Building2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useApp } from '@/app/context/AppContext';
import type { InvoiceType, PaymentMode, StockStatus } from '@/app/types';

interface LineItem {
  id: string;
  sourceId: string; // Unique ID for the source (stock entry or vendor product)
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
  stockType: StockStatus;
  availableStock: number;
  sourceBranchId: string;
  sourceBranchName: string;
  sourceType: 'branch' | 'vendor';
}

interface POSBillingProps {
  branchId: string;
  branchLocation: string;
}

export const POSBilling: React.FC<POSBillingProps> = ({ branchId, branchLocation }) => {
  const { branchStock, branches, products, createOrder } = useApp();
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('tax-invoice');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    address: '',
    gst: '',
  });
  const [addOns, setAddOns] = useState({
    laborCharges: '',
    transportCharges: '',
  });
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [amountPaid, setAmountPaid] = useState('');

  // Get ALL products from branches and vendors
  const branchProducts = branchStock.map(stock => {
    const branch = branches.find(b => (b.branchId || b.id) === stock.branchId);
    return {
      sourceId: stock.id,
      productId: stock.productId,
      productName: stock.productName,
      availableStock: stock.freshQuantity,
      rate: stock.sellingPriceMax,
      branchId: stock.branchId,
      branchName: branch?.name.replace('OSK Granite - ', '') || stock.branchLocation,
      type: 'branch' as const,
    };
  });

  const vendorItems = products.map(p => ({
    sourceId: p.id,
    productId: p.id,
    productName: p.name,
    availableStock: p.currentStock ?? p.stock,
    rate: p.sellingPriceMax ?? p.price,
    branchId: 'main-catalog',
    branchName: 'Main Catalog',
    type: 'vendor' as const,
  }));

  const availableProducts = [...branchProducts, ...vendorItems];

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      sourceId: '',
      productId: '',
      productName: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      stockType: 'fresh',
      availableStock: 0,
      sourceBranchId: '',
      sourceBranchName: '',
      sourceType: 'branch',
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // If source changed, update product details
        if (field === 'sourceId') {
          const product = availableProducts.find(p => p.sourceId === value);
          if (product) {
            updated.productId = product.productId;
            updated.productName = product.productName;
            updated.rate = product.rate;
            updated.availableStock = product.availableStock;
            updated.sourceBranchId = product.branchId;
            updated.sourceBranchName = product.branchName;
            updated.sourceType = product.type;
          }
        }
        
        // Recalculate amount
        updated.amount = updated.quantity * updated.rate;
        return updated;
      }
      return item;
    }));
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const laborCharges = parseFloat(addOns.laborCharges) || 0;
  const transportCharges = parseFloat(addOns.transportCharges) || 0;
  const totalBeforeTax = subtotal + laborCharges + transportCharges;
  const gstPercentage = 18;
  const gstAmount = (totalBeforeTax * gstPercentage) / 100;
  const grandTotal = totalBeforeTax + gstAmount;
  const paidAmount = parseFloat(amountPaid) || 0;
  const pendingAmount = grandTotal - paidAmount;

  const handleSaveAndPrint = () => {
    if (lineItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (!customerDetails.name || !customerDetails.phone) {
      toast.error('Please enter customer name and phone');
      return;
    }

    // Validate stock availability
    for (const item of lineItems) {
      if (item.quantity > item.availableStock) {
        toast.error(`Insufficient stock for ${item.productName}. Available: ${item.availableStock}`);
        return;
      }
    }

    toast.success(`${invoiceType === 'quotation' ? 'Quotation' : 'Tax Invoice'} created successfully!`);
    
    // Save order via context
    createOrder({
      orderNumber: `${invoiceType === 'quotation' ? 'QUO' : 'INV'}-${Date.now().toString().slice(-6)}`,
      customerId: `walk-in-${customerDetails.phone || Date.now()}`,
      customerName: customerDetails.name,
      customerPhone: customerDetails.phone,
      customerAddress: customerDetails.address,
      storeId: branchId,
      branchId,
      items: lineItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.rate,
        total: item.amount,
        rate: item.rate,
        amount: item.amount,
      })),
      subtotal,
      gst: gstAmount,
      total: grandTotal,
      taxAmount: gstAmount,
      shippingAmount: laborCharges + transportCharges, // Add-ons mapped as shipping
      totalAmount: grandTotal,
      status: invoiceType === 'quotation' ? 'pending' : 'completed',
      paymentStatus: pendingAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending',
    });

    setLineItems([]);
    setCustomerDetails({ name: '', phone: '', address: '', gst: '' });
    setAmountPaid('');
    setAddOns({ laborCharges: '', transportCharges: '' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
            POS Billing System
          </h1>
          <p className="text-[#6B6B6B] mt-1">Create quotations or tax invoices with flexible pricing</p>
        </div>

        {/* Invoice Type Selector */}
        <div className="flex gap-3">
          <Button
            variant={invoiceType === 'quotation' ? 'default' : 'outline'}
            onClick={() => setInvoiceType('quotation')}
            className={
              invoiceType === 'quotation'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                : 'border-blue-300 text-blue-700 hover:bg-blue-50'
            }
          >
            <FileText className="w-4 h-4 mr-2" />
            Quotation
          </Button>
          <Button
            variant={invoiceType === 'tax-invoice' ? 'default' : 'outline'}
            onClick={() => setInvoiceType('tax-invoice')}
            className={
              invoiceType === 'tax-invoice'
                ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white'
                : 'border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]'
            }
          >
            <Receipt className="w-4 h-4 mr-2" />
            Tax Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Billing Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#B8860B]" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                    placeholder="Enter customer name"
                    className="border-[#B8860B]/30"
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerPhone"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    className="border-[#B8860B]/30"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="customerAddress">Address</Label>
                  <Input
                    id="customerAddress"
                    value={customerDetails.address}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                    placeholder="Enter customer address"
                    className="border-[#B8860B]/30"
                  />
                </div>

                <div>
                  <Label htmlFor="customerGST">GST Number (Optional)</Label>
                  <Input
                    id="customerGST"
                    value={customerDetails.gst}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, gst: e.target.value })}
                    placeholder="36XXXXXXXXXXXXX"
                    className="border-[#B8860B]/30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#B8860B]" />
                  Line Items
                </CardTitle>
                <Button
                  onClick={addLineItem}
                  size="sm"
                  className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {lineItems.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-[#B8860B]/30 mx-auto mb-3" />
                  <p className="text-[#6B6B6B]">No items added yet. Click "Add Item" to start.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border border-[#B8860B]/20 rounded-lg bg-white"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                        <div className="md:col-span-2">
                          <Label className="text-xs">Product</Label>
                          <Select
                            value={item.sourceId}
                            onValueChange={(value) => updateLineItem(item.id, 'sourceId', value)}
                          >
                            <SelectTrigger className="border-[#B8860B]/30 text-sm">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProducts.map((product) => (
                                <SelectItem key={product.sourceId} value={product.sourceId}>
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <span>{product.productName}</span>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          product.branchId === branchId && product.type === 'branch'
                                            ? 'border-green-500 text-green-700 bg-green-50' 
                                            : 'border-[#C9A961] text-[#C9A961] bg-[#FFF8F0]'
                                        }`}
                                      >
                                        <Building2 className="w-3 h-3 mr-1" />
                                        {product.type === 'vendor' ? 'Dealer: ' : ''}{product.branchName}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {product.availableStock} in stock
                                      </Badge>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {item.productId && item.sourceBranchId && (
                            <div className="mt-1">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  item.sourceBranchId === branchId 
                                    ? 'border-green-500 text-green-700 bg-green-50' 
                                    : 'border-orange-500 text-orange-700 bg-orange-50'
                                }`}
                              >
                                <Building2 className="w-3 h-3 mr-1" />
                                {item.sourceBranchId === branchId 
                                  ? `Local Stock (${item.sourceBranchName})` 
                                  : item.sourceType === 'vendor'
                                    ? `Direct from Dealer: ${item.sourceBranchName}`
                                    : `From ${item.sourceBranchName} (Inter-branch transfer)`
                                }
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            min="1"
                            max={item.availableStock}
                            className="border-[#B8860B]/30 text-sm"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Rate (₹10-₹300)</Label>
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            min="10"
                            max="300"
                            className="border-[#B8860B]/30 text-sm"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={item.stockType}
                            onValueChange={(value) => updateLineItem(item.id, 'stockType', value)}
                          >
                            <SelectTrigger className="border-[#B8860B]/30 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fresh">Fresh</SelectItem>
                              <SelectItem value="broken">Broken</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-end justify-between gap-2">
                          <div className="flex-1">
                            <Label className="text-xs">Amount</Label>
                            <p className="text-lg font-bold text-[#2C2C2C]">
                              ₹{item.amount.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(item.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add-ons */}
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
              <CardTitle className="text-sm">Additional Charges</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="laborCharges">Labor Charges</Label>
                  <Input
                    id="laborCharges"
                    type="number"
                    value={addOns.laborCharges}
                    onChange={(e) => setAddOns({ ...addOns, laborCharges: e.target.value })}
                    placeholder="0"
                    className="border-[#B8860B]/30"
                  />
                </div>

                <div>
                  <Label htmlFor="transportCharges">Transport Charges</Label>
                  <Input
                    id="transportCharges"
                    type="number"
                    value={addOns.transportCharges}
                    onChange={(e) => setAddOns({ ...addOns, transportCharges: e.target.value })}
                    placeholder="0"
                    className="border-[#B8860B]/30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Summary & Payment */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card className="border-[#B8860B]/20 sticky top-6">
            <CardHeader className="bg-gradient-to-br from-[#B8860B] to-[#DAA520] text-white">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3 pb-4 border-b border-[#B8860B]/20">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B6B]">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>

                {laborCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">Labor Charges</span>
                    <span className="font-semibold">₹{laborCharges.toFixed(2)}</span>
                  </div>
                )}

                {transportCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">Transport</span>
                    <span className="font-semibold">₹{transportCharges.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm pt-2 border-t border-[#B8860B]/10">
                  <span className="text-[#6B6B6B]">Total (before tax)</span>
                  <span className="font-semibold">₹{totalBeforeTax.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3 pb-4 border-b border-[#B8860B]/20">
                <div className="flex justify-between">
                  <span className="text-[#6B6B6B]">GST ({gstPercentage}%)</span>
                  <span className="font-semibold text-[#B8860B]">₹{gstAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 bg-gradient-to-br from-[#FFF8F0] to-white rounded-lg px-4">
                <span className="text-lg font-semibold">Grand Total</span>
                <span className="text-2xl font-bold text-[#B8860B]">₹{grandTotal.toFixed(2)}</span>
              </div>

              {/* Payment Details */}
              <div className="space-y-3 pt-4 border-t border-[#B8860B]/20">
                <div>
                  <Label htmlFor="paymentMode">Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={(value) => setPaymentMode(value as PaymentMode)}>
                    <SelectTrigger className="border-[#B8860B]/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amountPaid">Amount Paid</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0"
                    className="border-[#B8860B]/30"
                  />
                </div>

                {paidAmount > 0 && (
                  <div className={`p-3 rounded-lg ${pendingAmount > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                    <div className="flex justify-between text-sm">
                      <span className={pendingAmount > 0 ? 'text-orange-700' : 'text-green-700'}>
                        {pendingAmount > 0 ? 'Pending' : 'Paid'}
                      </span>
                      <span className={`font-bold ${pendingAmount > 0 ? 'text-orange-900' : 'text-green-900'}`}>
                        ₹{Math.abs(pendingAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleSaveAndPrint}
                  className="w-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Save & Print
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-[#B8860B]/30 hover:bg-[#FFF8F0] text-[#B8860B]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};