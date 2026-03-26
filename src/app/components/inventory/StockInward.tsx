import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useApp } from '@/app/context/AppContext';
import {
  ArrowLeft,
  Truck,
  Package,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  ClipboardCheck,
  ShieldAlert,
  BoxSelect,
  FileText,
  Camera,
  Upload,
  X,
  ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface StockInwardProps {
  onBack: () => void;
}

interface InwardLineItem {
  id: string;
  productId: string;
  productName: string;
  quantityReceived: number;
  brokenQuantity: number;
  goodQuantity: number;
  breakageReason: string;
  breakagePhotos: string[];
}

type InwardStep = 'details' | 'counting' | 'review';

export const StockInward: React.FC<StockInwardProps> = ({ onBack }) => {
  const { dealers, products, updateProduct, addStockMovement } = useApp();

  const [step, setStep] = useState<InwardStep>('details');
  const [dealerId, setDealerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [lineItems, setLineItems] = useState<InwardLineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const selectedDealer = dealers.find(d => d.id === dealerId);

  // Products from selected dealer
  const dealerProducts = useMemo(() => {
    if (!dealerId) return [];
    return products.filter(p => p.dealerId === dealerId);
  }, [dealerId, products]);

  // Products not yet added to line items
  const availableProducts = useMemo(() => {
    const addedIds = new Set(lineItems.map(li => li.productId));
    return dealerProducts.filter(p => !addedIds.has(p.id));
  }, [dealerProducts, lineItems]);

  // Summary calculations
  const totalReceived = lineItems.reduce((sum, li) => sum + li.quantityReceived, 0);
  const totalBroken = lineItems.reduce((sum, li) => sum + li.brokenQuantity, 0);
  const totalGood = lineItems.reduce((sum, li) => sum + li.goodQuantity, 0);
  const breakagePercentage = totalReceived > 0 ? ((totalBroken / totalReceived) * 100).toFixed(1) : '0';

  const addLineItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setLineItems(prev => [
      ...prev,
      {
        id: `inward-line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        productName: product.name,
        quantityReceived: 0,
        brokenQuantity: 0,
        goodQuantity: 0,
        breakageReason: '',
        breakagePhotos: [],
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(li => li.id !== id));
  };

  const updateLineItem = (id: string, field: keyof InwardLineItem, value: any) => {
    setLineItems(prev =>
      prev.map(li => {
        if (li.id !== id) return li;
        const updated = { ...li, [field]: value };
        // Auto-calculate good quantity
        if (field === 'quantityReceived' || field === 'brokenQuantity') {
          const received = field === 'quantityReceived' ? (value as number) : updated.quantityReceived;
          const broken = field === 'brokenQuantity' ? (value as number) : updated.brokenQuantity;
          updated.goodQuantity = Math.max(0, received - broken);
        }
        return updated;
      })
    );
  };

  const canProceedToCount = dealerId && invoiceNumber && lineItems.length > 0;
  const canProceedToReview = lineItems.every(li => li.quantityReceived > 0) && lineItems.length > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1200));

    try {
      // Update each product's stock and record movements
      for (const item of lineItems) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;

        // Add only good stock to inventory, persist broken quantity & total received
        updateProduct(item.productId, {
          stock: product.stock + item.goodQuantity,
          brokenQuantity: (product.brokenQuantity || 0) + item.brokenQuantity,
          totalReceived: (product.totalReceived || 0) + item.quantityReceived,
        });

        // Record stock inward movement for good stock
        addStockMovement({
          productId: item.productId,
          productName: item.productName,
          type: 'in',
          quantity: item.goodQuantity,
          price: product.price,
          dealerId: dealerId,
          dealerName: selectedDealer?.name || '',
          userId: 'inventory-manager',
          userName: 'Inventory Manager',
          notes: `Stock inward from ${selectedDealer?.name}. Invoice: ${invoiceNumber}. Received: ${item.quantityReceived}, Broken: ${item.brokenQuantity}, Good: ${item.goodQuantity}${item.breakageReason ? `. Breakage: ${item.breakageReason}` : ''}`,
          invoiceReference: invoiceNumber,
        });

        // Record breakage as separate movement if any
        if (item.brokenQuantity > 0) {
          addStockMovement({
            productId: item.productId,
            productName: item.productName,
            type: 'out',
            quantity: item.brokenQuantity,
            price: 0,
            dealerId: dealerId,
            dealerName: selectedDealer?.name || '',
            userId: 'inventory-manager',
            userName: 'Inventory Manager',
            notes: `Breakage/Damage on arrival. Invoice: ${invoiceNumber}. Reason: ${item.breakageReason || 'Transit damage'}`,
            invoiceReference: invoiceNumber,
          });
        }
      }

      setIsSubmitting(false);
      setIsComplete(true);

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div>
            <p className="font-medium">Stock Inward Complete</p>
            <p className="text-sm text-gray-600">
              {totalGood} good units added, {totalBroken} broken recorded
            </p>
          </div>
        </div>,
        { duration: 5000 }
      );
    } catch {
      setIsSubmitting(false);
      toast.error('Failed to process stock inward. Please try again.');
    }
  };

  // Completion Screen
  if (isComplete) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-2">Stock Inward Completed!</h2>
          <p className="text-[#6B6B6B] mb-8">
            All stock has been counted, breakages recorded, and inventory updated.
          </p>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-[#6B6B6B] mb-1">Dealer</p>
                <p className="font-bold text-[#B8860B]">{selectedDealer?.name}</p>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-[#6B6B6B] mb-1">Good Stock Added</p>
                <p className="text-2xl font-bold text-green-600">{totalGood}</p>
              </CardContent>
            </Card>
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-[#6B6B6B] mb-1">Broken/Damaged</p>
                <p className="text-2xl font-bold text-[#B8860B]">{totalBroken}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-[#6B6B6B] mb-1">Total Received</p>
                <p className="text-2xl font-bold text-blue-600">{totalReceived}</p>
              </CardContent>
            </Card>
          </div>

          {/* Per-Product Breakdown */}
          <Card className="border-[#B8860B]/20 mb-8 text-left">
            <CardHeader>
              <CardTitle className="text-[#B8860B] text-lg">Product Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lineItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-[#FFF8F0] rounded-lg">
                    <div>
                      <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                      {item.breakageReason && (
                        <p className="text-xs text-[#6B6B6B] mt-0.5">Breakage: {item.breakageReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-[#6B6B6B] text-xs">Received</p>
                        <p className="font-bold">{item.quantityReceived}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#6B6B6B] text-xs">Broken</p>
                        <p className="font-bold text-[#B8860B]">{item.brokenQuantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[#6B6B6B] text-xs">Good</p>
                        <p className="font-bold text-green-600">{item.goodQuantity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Broken / Damaged Stock Report */}
          {lineItems.some(li => li.brokenQuantity > 0) && (
            <Card className="border-2 border-[#B8860B]/30 mb-8 text-left">
              <CardHeader className="bg-gradient-to-br from-[#B8860B]/5 to-[#FFF8F0] border-b border-[#B8860B]/20">
                <CardTitle className="text-[#B8860B] flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5" />
                  Broken / Damaged Stock Report
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {lineItems.filter(li => li.brokenQuantity > 0).map((item) => (
                  <div
                    key={`complete-broken-${item.id}`}
                    className="p-4 rounded-lg bg-[#B8860B]/5 border border-[#B8860B]/20 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#B8860B]/10 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-[#B8860B]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                          <p className="text-xs text-[#6B6B6B]">
                            {item.brokenQuantity} of {item.quantityReceived} items damaged
                            ({item.quantityReceived > 0
                              ? ((item.brokenQuantity / item.quantityReceived) * 100).toFixed(1)
                              : '0'}%)
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/30 text-lg px-3 py-1">
                        {item.brokenQuantity}
                      </Badge>
                    </div>

                    {item.breakageReason && (
                      <div className="pl-11">
                        <p className="text-xs text-[#6B6B6B] mb-0.5">Reason</p>
                        <p className="text-sm text-[#1A1A1A] bg-white p-2 rounded border border-[#B8860B]/10">
                          {item.breakageReason}
                        </p>
                      </div>
                    )}

                    {item.breakagePhotos.length > 0 && (
                      <div className="pl-11">
                        <p className="text-xs text-[#6B6B6B] mb-1.5 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          Evidence Photos ({item.breakagePhotos.length})
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                          {item.breakagePhotos.map((photo, photoIdx) => (
                            <div
                              key={`complete-photo-${item.id}-${photoIdx}`}
                              className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#B8860B]/20 bg-gray-100"
                            >
                              <img
                                src={photo}
                                alt={`Breakage evidence ${photoIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                                <p className="text-[10px] text-white text-center">{photoIdx + 1}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 justify-center">
            <Button
              onClick={onBack}
              variant="outline"
              className="border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => {
                setIsComplete(false);
                setStep('details');
                setDealerId('');
                setInvoiceNumber('');
                setVehicleNumber('');
                setRemarks('');
                setLineItems([]);
              }}
              className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Stock Inward
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-[#B8860B] hover:bg-[#FFF8F0]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent flex items-center gap-3">
            <Truck className="w-8 h-8 text-[#B8860B]" />
            Stock Inward
          </h1>
          <p className="text-[#6B6B6B] mt-1">
            Receive stock from dealer, count breakages & update inventory
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[
          { key: 'details', label: 'Dealer & Products', icon: FileText },
          { key: 'counting', label: 'Count & Breakage', icon: ClipboardCheck },
          { key: 'review', label: 'Review & Submit', icon: CheckCircle2 },
        ].map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.key;
          const isPast =
            (step === 'counting' && s.key === 'details') ||
            (step === 'review' && (s.key === 'details' || s.key === 'counting'));
          return (
            <div key={s.key} className="contents">
              {i > 0 && (
                <div className={`flex-1 h-0.5 ${isPast || isActive ? 'bg-[#B8860B]' : 'bg-gray-200'}`} />
              )}
              <button
                onClick={() => {
                  if (isPast) setStep(s.key as InwardStep);
                }}
                disabled={!isPast && !isActive}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-md'
                    : isPast
                    ? 'bg-[#FFF8F0] text-[#B8860B] border border-[#B8860B]/30 cursor-pointer hover:bg-[#B8860B]/10'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Step 1: Dealer & Product Selection */}
      <AnimatePresence mode="wait">
        {step === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Dealer & Invoice */}
            <Card className="border-[#B8860B]/20 shadow-lg">
              <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
                <CardTitle className="text-[#B8860B] flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dealer / Vendor <span className="text-[#B8860B]">*</span></Label>
                    <Select value={dealerId} onValueChange={(v) => { setDealerId(v); setLineItems([]); }}>
                      <SelectTrigger className="border-[#B8860B]/30 focus:border-[#B8860B]">
                        <SelectValue placeholder="Select dealer" />
                      </SelectTrigger>
                      <SelectContent>
                        {dealers.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name} — {d.contactPerson}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice / Challan No. <span className="text-[#B8860B]">*</span></Label>
                    <Input
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g., INV-2026-0045"
                      className="border-[#B8860B]/30 focus:border-[#B8860B]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vehicle Number</Label>
                    <Input
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g., TS 09 AB 1234"
                      className="border-[#B8860B]/30 focus:border-[#B8860B]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Received Date</Label>
                    <Input
                      type="date"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      className="border-[#B8860B]/30 focus:border-[#B8860B]"
                    />
                  </div>
                </div>

                {selectedDealer && (
                  <div className="p-4 rounded-lg bg-[#FFF8F0] border border-[#B8860B]/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-[#6B6B6B]">Dealer</p>
                        <p className="font-medium text-[#1A1A1A]">{selectedDealer.name}</p>
                      </div>
                      <div>
                        <p className="text-[#6B6B6B]">Contact</p>
                        <p className="font-medium text-[#1A1A1A]">{selectedDealer.phone}</p>
                      </div>
                      <div>
                        <p className="text-[#6B6B6B]">Contact Person</p>
                        <p className="font-medium text-[#1A1A1A]">{selectedDealer.contactPerson}</p>
                      </div>
                      <div>
                        <p className="text-[#6B6B6B]">Address</p>
                        <p className="font-medium text-[#1A1A1A]">{selectedDealer.address}</p>
                      </div>
                      <div>
                        <p className="text-[#6B6B6B]">Products Available</p>
                        <p className="font-medium text-[#1A1A1A]">{dealerProducts.length} items</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Line Items */}
            {dealerId && (
              <Card className="border-[#B8860B]/20 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#B8860B] flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Products Received ({lineItems.length})
                    </CardTitle>
                    {availableProducts.length > 0 && (
                      <Select onValueChange={(v) => addLineItem(v)}>
                        <SelectTrigger className="w-auto border-[#B8860B]/30 bg-white">
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-[#B8860B]" />
                            <span className="text-sm text-[#B8860B]">Add Product</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} (Stock: {p.stock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {lineItems.length === 0 ? (
                    <div className="text-center py-12">
                      <BoxSelect className="w-16 h-16 text-[#B8860B]/30 mx-auto mb-4" />
                      <p className="text-[#6B6B6B]">No products added yet. Select products from this dealer.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lineItems.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-lg bg-[#FFF8F0] border border-[#B8860B]/10 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center text-white font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                              <p className="text-xs text-[#6B6B6B]">
                                Current stock: {products.find(p => p.id === item.productId)?.stock || 0} units
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(item.id)}
                            className="text-[#B8860B] hover:bg-[#B8860B]/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Next Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setStep('counting')}
                disabled={!canProceedToCount}
                className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white px-8"
              >
                Next: Count & Record Breakage
                <ClipboardCheck className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Counting & Breakage Recording */}
        {step === 'counting' && (
          <motion.div
            key="counting"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Info Banner */}
            <div className="p-4 bg-[#FFF8F0] border border-[#B8860B]/20 rounded-lg flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#B8860B] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#1A1A1A]">Count each product carefully</p>
                <p className="text-sm text-[#6B6B6B] mt-1">
                  Enter the total quantity received and any broken/damaged items. Only good stock will be added to inventory.
                </p>
              </div>
            </div>

            {/* Line Item Counting Cards */}
            {lineItems.map((item, idx) => {
              const hasBreakage = item.brokenQuantity > 0;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`border-2 shadow-lg ${hasBreakage ? 'border-[#B8860B]/40' : 'border-[#B8860B]/20'}`}>
                    <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center text-white text-sm font-bold">
                            {idx + 1}
                          </div>
                          {item.productName}
                        </CardTitle>
                        {hasBreakage && (
                          <Badge className="bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/30">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Breakage Detected
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Received */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            Total Received <span className="text-[#B8860B]">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.quantityReceived || ''}
                            onChange={(e) => updateLineItem(item.id, 'quantityReceived', parseInt(e.target.value) || 0)}
                            placeholder="e.g., 200"
                            className="border-blue-300 focus:border-blue-500 text-lg font-semibold"
                          />
                          <p className="text-xs text-[#6B6B6B]">Total physical count from truck</p>
                        </div>

                        {/* Broken Quantity */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#B8860B]" />
                            Broken / Damaged
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max={item.quantityReceived}
                            value={item.brokenQuantity || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              if (val > item.quantityReceived) {
                                toast.error('Broken quantity cannot exceed total received');
                                return;
                              }
                              updateLineItem(item.id, 'brokenQuantity', val);
                            }}
                            placeholder="e.g., 15"
                            className="border-[#B8860B]/40 focus:border-[#B8860B] text-lg font-semibold"
                          />
                          <p className="text-xs text-[#6B6B6B]">Chipped, cracked, broken items</p>
                        </div>

                        {/* Good Stock (Auto-calculated) */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Good Stock (Auto)
                          </Label>
                          <div className="h-10 px-3 rounded-md border border-green-300 bg-green-50 flex items-center text-lg font-bold text-green-700">
                            {item.goodQuantity}
                          </div>
                          <p className="text-xs text-green-700">Will be added to inventory</p>
                        </div>
                      </div>

                      {/* Breakage Details (shown if broken > 0) */}
                      <AnimatePresence>
                        {hasBreakage && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-[#B8860B]/10"
                          >
                            <div className="p-4 rounded-lg bg-[#B8860B]/5 border border-[#B8860B]/20 space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Camera className="w-4 h-4 text-[#B8860B]" />
                                <p className="font-medium text-[#B8860B] text-sm">Breakage Report</p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[#6B6B6B] text-sm">Reason for breakage</Label>
                                <Textarea
                                  value={item.breakageReason}
                                  onChange={(e) => updateLineItem(item.id, 'breakageReason', e.target.value)}
                                  placeholder="e.g., 15 tiles cracked during transit, packaging was insufficient, corners chipped..."
                                  className="border-[#B8860B]/30 resize-none h-20"
                                />
                              </div>

                              {/* Upload Image & Camera Section */}
                              <div className="space-y-3">
                                <Label className="text-[#6B6B6B] text-sm flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  Breakage Evidence Photos
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {/* Upload Image Button */}
                                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[#B8860B]/30 bg-white hover:bg-[#FFF8F0] hover:border-[#B8860B]/50 cursor-pointer transition-all">
                                    <Upload className="w-4 h-4 text-[#B8860B]" />
                                    <span className="text-sm font-medium text-[#B8860B]">Upload Image</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={(e) => {
                                        const files = e.target.files;
                                        if (files && files.length > 0) {
                                          const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
                                          updateLineItem(item.id, 'breakagePhotos', [...item.breakagePhotos, ...newPhotos]);
                                          toast.success(`${files.length} photo(s) uploaded`);
                                        }
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>

                                  {/* Camera Capture Button */}
                                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[#B8860B]/30 bg-white hover:bg-[#FFF8F0] hover:border-[#B8860B]/50 cursor-pointer transition-all">
                                    <Camera className="w-4 h-4 text-[#B8860B]" />
                                    <span className="text-sm font-medium text-[#B8860B]">Take Photo</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      onChange={(e) => {
                                        const files = e.target.files;
                                        if (files && files.length > 0) {
                                          const newPhoto = URL.createObjectURL(files[0]);
                                          updateLineItem(item.id, 'breakagePhotos', [...item.breakagePhotos, newPhoto]);
                                          toast.success('Photo captured');
                                        }
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>

                                  {item.breakagePhotos.length > 0 && (
                                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#B8860B]/10 text-[#B8860B]">
                                      <ImageIcon className="w-3.5 h-3.5" />
                                      <span className="text-xs font-medium">{item.breakagePhotos.length} photo{item.breakagePhotos.length !== 1 ? 's' : ''}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Photo Preview Gallery */}
                                {item.breakagePhotos.length > 0 && (
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                                    {item.breakagePhotos.map((photo, photoIdx) => (
                                      <motion.div
                                        key={`${item.id}-photo-${photoIdx}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative group aspect-square rounded-lg overflow-hidden border-2 border-[#B8860B]/20 bg-gray-100"
                                      >
                                        <img
                                          src={photo}
                                          alt={`Breakage evidence ${photoIdx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                          <button
                                            onClick={() => {
                                              const updated = item.breakagePhotos.filter((_, i) => i !== photoIdx);
                                              updateLineItem(item.id, 'breakagePhotos', updated);
                                              toast('Photo removed');
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:bg-white"
                                          >
                                            <X className="w-3.5 h-3.5 text-[#B8860B]" />
                                          </button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                                          <p className="text-[10px] text-white text-center">{photoIdx + 1}</p>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-dashed border-[#B8860B]/30">
                                <AlertTriangle className="w-5 h-5 text-[#B8860B]" />
                                <div className="text-sm">
                                  <p className="font-medium text-[#1A1A1A]">
                                    {item.brokenQuantity} items damaged ({item.quantityReceived > 0
                                      ? ((item.brokenQuantity / item.quantityReceived) * 100).toFixed(1)
                                      : '0'}%)
                                  </p>
                                  <p className="text-[#6B6B6B]">These will NOT be added to sellable inventory</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('details')}
                className="border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Details
              </Button>
              <Button
                onClick={() => setStep('review')}
                disabled={!canProceedToReview}
                className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white px-8"
              >
                Next: Review & Submit
                <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-blue-200">
                <CardContent className="p-4 text-center">
                  <Truck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-[#6B6B6B] mb-1">Total Received</p>
                  <p className="text-3xl font-bold text-blue-600">{totalReceived}</p>
                </CardContent>
              </Card>
              <Card className="border-[#B8860B]/30">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-[#B8860B] mx-auto mb-2" />
                  <p className="text-xs text-[#6B6B6B] mb-1">Broken / Damaged</p>
                  <p className="text-3xl font-bold text-[#B8860B]">{totalBroken}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-xs text-[#6B6B6B] mb-1">Good Stock</p>
                  <p className="text-3xl font-bold text-green-600">{totalGood}</p>
                </CardContent>
              </Card>
              <Card className={`border-2 ${parseFloat(breakagePercentage) > 5 ? 'border-[#B8860B]/50 bg-[#B8860B]/5' : 'border-green-200 bg-green-50'}`}>
                <CardContent className="p-4 text-center">
                  <ShieldAlert className={`w-6 h-6 mx-auto mb-2 ${parseFloat(breakagePercentage) > 5 ? 'text-[#B8860B]' : 'text-green-600'}`} />
                  <p className="text-xs text-[#6B6B6B] mb-1">Breakage Rate</p>
                  <p className={`text-3xl font-bold ${parseFloat(breakagePercentage) > 5 ? 'text-[#B8860B]' : 'text-green-600'}`}>
                    {breakagePercentage}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Shipment Details */}
            <Card className="border-[#B8860B]/20 shadow-lg">
              <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
                <CardTitle className="text-[#B8860B]">Shipment Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-[#6B6B6B]">Dealer</p>
                    <p className="font-medium text-[#1A1A1A]">{selectedDealer?.name}</p>
                  </div>
                  <div>
                    <p className="text-[#6B6B6B]">Invoice No.</p>
                    <p className="font-medium text-[#1A1A1A]">{invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-[#6B6B6B]">Vehicle</p>
                    <p className="font-medium text-[#1A1A1A]">{vehicleNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[#6B6B6B]">Date</p>
                    <p className="font-medium text-[#1A1A1A]">{receivedDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Line Items Review */}
            <Card className="border-[#B8860B]/20 shadow-lg">
              <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
                <CardTitle className="text-[#B8860B]">Product Details</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#B8860B]/10 bg-[#FFF8F0]/50">
                        <th className="text-left p-4 text-[#6B6B6B] font-medium">#</th>
                        <th className="text-left p-4 text-[#6B6B6B] font-medium">Product</th>
                        <th className="text-center p-4 text-[#6B6B6B] font-medium">Received</th>
                        <th className="text-center p-4 text-[#6B6B6B] font-medium">Broken</th>
                        <th className="text-center p-4 text-[#6B6B6B] font-medium">Good Stock</th>
                        <th className="text-left p-4 text-[#6B6B6B] font-medium">Breakage Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, idx) => (
                        <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-[#FFF8F0]/30">
                          <td className="p-4 font-medium text-[#B8860B]">{idx + 1}</td>
                          <td className="p-4">
                            <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                            <p className="text-xs text-[#6B6B6B]">
                              Current: {products.find(p => p.id === item.productId)?.stock || 0} → After: {(products.find(p => p.id === item.productId)?.stock || 0) + item.goodQuantity}
                            </p>
                          </td>
                          <td className="p-4 text-center font-semibold text-blue-600">{item.quantityReceived}</td>
                          <td className="p-4 text-center">
                            {item.brokenQuantity > 0 ? (
                              <Badge className="bg-[#B8860B]/10 text-[#B8860B]">{item.brokenQuantity}</Badge>
                            ) : (
                              <span className="text-green-600">0</span>
                            )}
                          </td>
                          <td className="p-4 text-center font-bold text-green-600">{item.goodQuantity}</td>
                          <td className="p-4 text-[#6B6B6B] text-xs max-w-[200px] truncate">
                            {item.breakageReason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#FFF8F0] border-t-2 border-[#B8860B]/20">
                        <td className="p-4" colSpan={2}>
                          <p className="font-bold text-[#1A1A1A]">Totals</p>
                        </td>
                        <td className="p-4 text-center font-bold text-blue-600">{totalReceived}</td>
                        <td className="p-4 text-center font-bold text-[#B8860B]">{totalBroken}</td>
                        <td className="p-4 text-center font-bold text-green-600">{totalGood}</td>
                        <td className="p-4"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Broken / Damaged Stock Details */}
            {lineItems.some(li => li.brokenQuantity > 0) && (
              <Card className="border-2 border-[#B8860B]/30 shadow-lg">
                <CardHeader className="bg-gradient-to-br from-[#B8860B]/5 to-[#FFF8F0] border-b border-[#B8860B]/20">
                  <CardTitle className="text-[#B8860B] flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Broken / Damaged Stock ({totalBroken} items)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {lineItems.filter(li => li.brokenQuantity > 0).map((item) => (
                    <div
                      key={`broken-${item.id}`}
                      className="p-4 rounded-lg bg-[#B8860B]/5 border border-[#B8860B]/20 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#B8860B]/10 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-[#B8860B]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                            <p className="text-xs text-[#6B6B6B]">
                              {item.brokenQuantity} of {item.quantityReceived} items damaged
                              ({item.quantityReceived > 0
                                ? ((item.brokenQuantity / item.quantityReceived) * 100).toFixed(1)
                                : '0'}%)
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/30 text-lg px-3 py-1">
                          {item.brokenQuantity}
                        </Badge>
                      </div>

                      {item.breakageReason && (
                        <div className="pl-11">
                          <p className="text-xs text-[#6B6B6B] mb-0.5">Reason</p>
                          <p className="text-sm text-[#1A1A1A] bg-white p-2 rounded border border-[#B8860B]/10">
                            {item.breakageReason}
                          </p>
                        </div>
                      )}

                      {item.breakagePhotos.length > 0 && (
                        <div className="pl-11">
                          <p className="text-xs text-[#6B6B6B] mb-1.5 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            Evidence Photos ({item.breakagePhotos.length})
                          </p>
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                            {item.breakagePhotos.map((photo, photoIdx) => (
                              <div
                                key={`review-photo-${item.id}-${photoIdx}`}
                                className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#B8860B]/20 bg-gray-100"
                              >
                                <img
                                  src={photo}
                                  alt={`Breakage evidence ${photoIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                                  <p className="text-[10px] text-white text-center">{photoIdx + 1}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* General Remarks */}
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-6 space-y-2">
                <Label>General Remarks (Optional)</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional notes about this shipment..."
                  className="border-[#B8860B]/30 resize-none h-20"
                />
              </CardContent>
            </Card>

            {/* High Breakage Warning */}
            {parseFloat(breakagePercentage) > 5 && (
              <div className="p-4 bg-[#B8860B]/5 border-2 border-[#B8860B]/30 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-[#B8860B] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#B8860B]">High Breakage Alert</p>
                  <p className="text-sm text-[#6B6B6B] mt-1">
                    Breakage rate is {breakagePercentage}% which exceeds the 5% threshold.
                    Consider raising a complaint with the dealer ({selectedDealer?.name}).
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('counting')}
                className="border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Counting
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white px-8 min-w-[200px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm & Update Stock
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};