import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Plus, TrendingUp, TrendingDown, Package, DollarSign, FileText, CheckCircle2, Clock, AlertCircle, ArrowLeft, Menu, Home, Zap, Building2, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import type { PaymentStatus } from '@/app/types';

interface StockTrackingProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

export const StockTracking: React.FC<StockTrackingProps> = ({ onBack, onNavigate }) => {
  const { stockMovements, products, dealers, updateProduct, addStockMovement, currentUser } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'in' as 'in' | 'out',
    quantity: '',
    price: '',
    dealerId: '',
    notes: '',
    invoiceReference: '',
    paymentStatus: 'pending' as PaymentStatus,
    amountPaid: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === formData.productId);
    const dealer = dealers.find(d => d.id === formData.dealerId);
    if (!product || !currentUser) return;

    const quantity = parseInt(formData.quantity);
    const newStock = formData.type === 'in'
      ? product.stock + quantity
      : product.stock - quantity;

    if (newStock < 0) {
      toast.error('Insufficient stock for this operation');
      return;
    }

    updateProduct(product.id, { stock: newStock });
    addStockMovement({
      productId: product.id,
      productName: product.name,
      type: formData.type,
      quantity,
      price: parseFloat(formData.price),
      dealerId: formData.type === 'in' ? formData.dealerId : undefined,
      dealerName: formData.type === 'in' && dealer ? dealer.name : undefined,
      userId: currentUser.id,
      userName: currentUser.name,
      notes: formData.notes,
      invoiceReference: formData.invoiceReference || undefined,
      paymentStatus: formData.type === 'in' ? formData.paymentStatus : undefined,
      amountPaid: formData.amountPaid ? parseFloat(formData.amountPaid) : undefined,
    });

    toast.success(`Stock ${formData.type === 'in' ? 'added' : 'removed'} successfully`);
    setIsDialogOpen(false);
    setFormData({
      productId: '',
      type: 'in',
      quantity: '',
      price: '',
      dealerId: '',
      notes: '',
      invoiceReference: '',
      paymentStatus: 'pending',
      amountPaid: '',
    });
  };

  const stockInMovements = stockMovements.filter(m => m.type === 'in');
  const stockOutMovements = stockMovements.filter(m => m.type === 'out');
  
  // Payment tracking stats
  const paidMovements = stockInMovements.filter(m => m.paymentStatus === 'paid');
  const pendingMovements = stockInMovements.filter(m => m.paymentStatus === 'pending');
  const partialMovements = stockInMovements.filter(m => m.paymentStatus === 'partial');

  const totalPurchaseValue = stockInMovements.reduce((sum, m) => sum + (m.quantity * m.price), 0);
  const totalPaid = stockInMovements.reduce((sum, m) => sum + (m.amountPaid || 0), 0);
  const totalPending = totalPurchaseValue - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="border-[#B8860B]/30 hover:bg-[#FFF8F0] hover:border-[#B8860B]"
            >
              <ArrowLeft className="w-5 h-5 text-[#B8860B]" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
              Stock In & Stock Out Tracking
            </h2>
            <p className="text-[#6B6B6B] mt-1">Track inventory movements with dealer payment tracking</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B]">
              <Plus className="h-4 w-4 mr-2" />
              Record Movement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Stock Movement</DialogTitle>
              <DialogDescription>
                Add or remove stock for a product with payment tracking
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Movement Type</Label>
                <Select value={formData.type} onValueChange={(value: 'in' | 'out') => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In (Purchase from Dealer)</SelectItem>
                    <SelectItem value="out">Stock Out (Sale/Order)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product *</Label>
                <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Current Stock: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price per Unit (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              {formData.quantity && formData.price && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Total Value:</strong> ₹{(parseInt(formData.quantity || '0') * parseFloat(formData.price || '0')).toLocaleString()}
                  </p>
                </div>
              )}

              {formData.type === 'in' && (
                <>
                  <div className="space-y-2">
                    <Label>Dealer *</Label>
                    <Select value={formData.dealerId} onValueChange={(value) => setFormData({ ...formData, dealerId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dealer" />
                      </SelectTrigger>
                      <SelectContent>
                        {dealers.map(dealer => (
                          <SelectItem key={dealer.id} value={dealer.id}>
                            {dealer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Invoice Reference</Label>
                    <Input
                      value={formData.invoiceReference}
                      onChange={(e) => setFormData({ ...formData, invoiceReference: e.target.value })}
                      placeholder="e.g., INV-2025-001"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Status *</Label>
                      <Select 
                        value={formData.paymentStatus} 
                        onValueChange={(value: PaymentStatus) => setFormData({ ...formData, paymentStatus: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">✅ Paid (Fully paid)</SelectItem>
                          <SelectItem value="partial">⚠️ Partial (Partially paid)</SelectItem>
                          <SelectItem value="pending">⏳ Pending (Not paid)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount Paid (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amountPaid}
                        onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {formData.paymentStatus && formData.quantity && formData.price && (
                    <div className={`p-3 border rounded-lg ${
                      formData.paymentStatus === 'paid' ? 'bg-green-50 border-green-200' :
                      formData.paymentStatus === 'partial' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="text-sm space-y-1">
                        <p className="font-semibold">
                          {formData.paymentStatus === 'paid' && '✅ Fully Paid'}
                          {formData.paymentStatus === 'partial' && '⚠️ Partial Payment'}
                          {formData.paymentStatus === 'pending' && '⏳ Payment Pending'}
                        </p>
                        <p>Total Amount: ₹{(parseInt(formData.quantity || '0') * parseFloat(formData.price || '0')).toLocaleString()}</p>
                        {formData.amountPaid && (
                          <p>
                            Amount Paid: ₹{parseFloat(formData.amountPaid).toLocaleString()}
                            {' • '}
                            Outstanding: ₹{((parseInt(formData.quantity || '0') * parseFloat(formData.price || '0')) - parseFloat(formData.amountPaid)).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional notes about this movement"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[#B8860B] to-[#DAA520]">
                  Record Movement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#B8860B]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#B8860B]">{stockMovements.length}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">All time transactions</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800">Stock In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{stockInMovements.length}</div>
            <p className="text-xs text-green-700 mt-1">Purchase transactions</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800">Stock Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{stockOutMovements.length}</div>
            <p className="text-xs text-blue-700 mt-1">Sale transactions</p>
          </CardContent>
        </Card>
        <Card className="border-[#B8860B]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Purchase Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#B8860B]">₹{(totalPurchaseValue / 100000).toFixed(2)}L</div>
            <p className="text-xs text-[#6B6B6B] mt-1">Total stock in value</p>
          </CardContent>
        </Card>
      </div>

      {/* Dealer Payment Tracking */}
      <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
        <CardHeader>
          <CardTitle className="text-[#B8860B] flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Dealer Payment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-[#B8860B]/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-[#6B6B6B] mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Paid</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{paidMovements.length}</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Fully settled</p>
            </div>
            <div className="p-4 bg-white border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-yellow-700 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>Partial</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{partialMovements.length}</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Partially paid</p>
            </div>
            <div className="p-4 bg-white border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-red-700 mb-2">
                <Clock className="w-4 h-4" />
                <span>Pending</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{pendingMovements.length}</p>
              <p className="text-xs text-[#6B6B6B] mt-1">Awaiting payment</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-[#B8860B] to-[#DAA520] text-white rounded-lg">
              <div className="flex items-center gap-2 text-sm mb-2 opacity-90">
                <DollarSign className="w-4 h-4" />
                <span>Outstanding</span>
              </div>
              <p className="text-2xl font-bold">₹{(totalPending / 100000).toFixed(2)}L</p>
              <p className="text-xs opacity-90 mt-1">Pending payments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Movements ({stockMovements.length})</TabsTrigger>
          <TabsTrigger value="in">Stock In ({stockInMovements.length})</TabsTrigger>
          <TabsTrigger value="out">Stock Out ({stockOutMovements.length})</TabsTrigger>
          <TabsTrigger value="pending-payment">Pending Payment ({pendingMovements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {stockMovements.map((movement, index) => (
            <MovementCard key={movement.id} movement={movement} index={index} />
          ))}
        </TabsContent>

        <TabsContent value="in" className="space-y-3">
          {stockInMovements.map((movement, index) => (
            <MovementCard key={movement.id} movement={movement} index={index} />
          ))}
        </TabsContent>

        <TabsContent value="out" className="space-y-3">
          {stockOutMovements.map((movement, index) => (
            <MovementCard key={movement.id} movement={movement} index={index} />
          ))}
        </TabsContent>

        <TabsContent value="pending-payment" className="space-y-3">
          {pendingMovements.map((movement, index) => (
            <MovementCard key={movement.id} movement={movement} index={index} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const MovementCard: React.FC<{ movement: any; index: number }> = ({ movement, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <Card className={movement.type === 'in' && movement.paymentStatus === 'pending' ? 'border-red-200' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
            movement.type === 'in'
              ? 'bg-gradient-to-br from-[#B8860B] to-[#DAA520]'
              : 'bg-gradient-to-br from-blue-500 to-cyan-500'
          }`}>
            {movement.type === 'in' ? (
              <TrendingUp className="h-6 w-6 text-white" />
            ) : (
              <TrendingDown className="h-6 w-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{movement.productName}</h3>
                  <Badge variant={movement.type === 'in' ? 'default' : 'secondary'} className={
                    movement.type === 'in' ? 'bg-[#B8860B]' : 'bg-blue-500'
                  }>
                    {movement.type === 'in' ? 'Stock In' : 'Stock Out'}
                  </Badge>
                </div>
                {movement.type === 'in' && movement.dealerName && (
                  <p className="text-sm text-[#6B6B6B]">
                    Dealer: <span className="font-medium">{movement.dealerName}</span>
                  </p>
                )}
                {movement.notes && <p className="text-sm text-[#6B6B6B] mt-1">{movement.notes}</p>}
              </div>
              
              {movement.type === 'in' && movement.paymentStatus && (
                <Badge 
                  variant="secondary"
                  className={
                    movement.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : movement.paymentStatus === 'partial'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {movement.paymentStatus === 'paid' && <><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</>}
                  {movement.paymentStatus === 'partial' && <><AlertCircle className="w-3 h-3 mr-1" /> Partial</>}
                  {movement.paymentStatus === 'pending' && <><Clock className="w-3 h-3 mr-1" /> Pending</>}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
              <div>
                <span className="text-[#6B6B6B] text-xs">Quantity</span>
                <p className="font-semibold">{movement.quantity} units</p>
              </div>
              <div>
                <span className="text-[#6B6B6B] text-xs">Price/Unit</span>
                <p className="font-semibold">₹{movement.price.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[#6B6B6B] text-xs">Total Value</span>
                <p className="font-semibold text-[#B8860B]">
                  ₹{(movement.quantity * movement.price).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[#6B6B6B] text-xs">Date</span>
                <p className="font-medium">{new Date(movement.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {movement.type === 'in' && (movement.invoiceReference || movement.amountPaid !== undefined) && (
              <div className="mt-3 pt-3 border-t border-[#B8860B]/10">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {movement.invoiceReference && (
                    <div>
                      <span className="text-[#6B6B6B] text-xs flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Invoice
                      </span>
                      <p className="font-medium">{movement.invoiceReference}</p>
                    </div>
                  )}
                  {movement.amountPaid !== undefined && (
                    <>
                      <div>
                        <span className="text-[#6B6B6B] text-xs">Amount Paid</span>
                        <p className="font-semibold text-green-600">₹{movement.amountPaid.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] text-xs">Outstanding</span>
                        <p className="font-semibold text-red-600">
                          ₹{((movement.quantity * movement.price) - movement.amountPaid).toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-2 text-xs text-[#6B6B6B]">
              Recorded by {movement.userName} • {new Date(movement.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);