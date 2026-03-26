import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useApp } from '@/app/context/AppContext';
import { 
  ShoppingCart as CartIcon,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  AlertCircle,
  Sparkles,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Gift,
  Tag,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  FileText,
  Banknote,
  Smartphone,
  Building2,
  Receipt,
  Hash,
  MessageSquare,
  Percent,
  IndianRupee,
  Clock,
  Wallet,
  Printer,
  Download,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PaymentMode, Order } from '@/app/types';
import { OrderReceipt } from './OrderReceipt';

interface ShoppingCartProps {
  onNavigate?: (page: string) => void;
  selectedOrderCustomerId?: string | null;
}

type CheckoutStep = 'cart' | 'customer-info' | 'payment' | 'confirmation';

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ onNavigate, selectedOrderCustomerId }) => {
  const { cart, updateCartQuantity, removeFromCart, clearCart, createOrder, currentUser, addNotification, customers } = useApp();

  // Look up the selected customer from global state
  const selectedCustomer = selectedOrderCustomerId
    ? customers.find(c => c.id === selectedOrderCustomerId) || null
    : null;

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // New payment tracking state
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('flat');

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const gst = 0;
  const grossTotal = subtotal;

  // Discount calculation
  const discountNum = parseFloat(discountValue) || 0;
  const discountAmount = discountType === 'percentage'
    ? Math.min((grossTotal * discountNum) / 100, grossTotal)
    : Math.min(discountNum, grossTotal);
  const total = Math.max(grossTotal - discountAmount, 0);

  // Payment calculation
  const amountPaid = amountPaidInput === '' ? total : Math.max(0, parseFloat(amountPaidInput) || 0);
  const amountDue = Math.max(total - amountPaid, 0);
  const paymentStatusLabel: 'paid' | 'partial' | 'pending' =
    amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';

  const handleQuantityChange = (productId: string, newQuantity: number, maxStock: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      toast.success('Item removed from cart');
      return;
    }
    
    if (newQuantity > maxStock) {
      toast.error('Quantity exceeds available stock', {
        description: `Only ${maxStock} units available`
      });
      return;
    }

    updateCartQuantity(productId, newQuantity);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
      toast.success('Cart cleared');
    }
  };

  const handleProceedToCheckout = () => {
    // If a customer is already selected from OrderWorkflow, skip customer-info and go to payment
    if (selectedCustomer) {
      setCustomerInfo({
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        address: [selectedCustomer.address, selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(', '),
      });
      setCheckoutStep('payment');
    } else {
      setCheckoutStep('customer-info');
    }
  };

  const handleCustomerInfoNext = () => {
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      toast.error('Please fill in customer name and phone number');
      return;
    }
    setCheckoutStep('payment');
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const branchId = currentUser?.branchId || 'branch-1';
    const branchLocation = currentUser?.branchLocation || 'aziz-nagar';
    const poNumber = `PO-${branchLocation?.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const orderData = {
      poNumber,
      customerId: selectedCustomer ? selectedCustomer.id : `WALK-IN-${Date.now()}`,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerAddress: customerInfo.address,
      storeId: currentUser?.id || 'store-1',
      branchId,
      branchLocation,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity,
      })),
      subtotal,
      gst,
      total,
      status: 'pending' as const,
      paymentMode,
      amountPaid,
      amountDue,
      paymentStatus: paymentStatusLabel,
      paymentReference: paymentReference.trim() || undefined,
      orderNotes: orderNotes.trim() || undefined,
      discount: discountNum || undefined,
      discountType: discountNum > 0 ? discountType : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      createdBy: currentUser?.id || 'system',
      createdByName: currentUser?.name || 'Store',
    };

    const newOrder = createOrder(orderData);
    setCreatedOrder(newOrder);

    // Send notification to stock manager and branch admin
    const branchName = branchLocation
      ? branchLocation.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Branch';

    addNotification({
      type: 'info',
      title: `New Purchase Order - ${branchName}`,
      message: `PO ${newOrder.poNumber || newOrder.id} from ${customerInfo.name} - ₹${total.toLocaleString('en-IN')} (${cart.length} items). Awaiting Stock Manager review.`,
    });

    addNotification({
      type: 'success',
      title: `Order Placed - ${branchName}`,
      message: `Customer ${customerInfo.name} placed order ${newOrder.poNumber || newOrder.id} worth ₹${total.toLocaleString('en-IN')}. Payment: ${paymentMode.toUpperCase()}. ${amountDue > 0 ? `Due: ₹${amountDue.toLocaleString('en-IN')}` : 'Fully Paid'}`,
    });

    clearCart();
    setIsProcessing(false);
    setCheckoutStep('confirmation');
    
    toast.success('Purchase Order Created!', {
      description: `PO ${newOrder.poNumber || newOrder.id} - ₹${total.toLocaleString('en-IN')}`
    });
  };

  // ── Empty Cart ──────────────────────────────────────────────────────────────
  if (cart.length === 0 && checkoutStep === 'cart') {
    return (
      <div className="p-8 bg-gradient-to-br from-[#FFF8F0] via-[#FFF8F0] to-[#FFE4B5]/30 min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-[#B8860B]/10 to-[#DAA520]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-2xl max-w-2xl mx-auto">
            <CardContent className="p-16 text-center">
              <div className="relative inline-block mb-8">
                <CartIcon className="w-24 h-24 text-[#B8860B]" />
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-[#DAA520]" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-[#1A1A1A] mb-3">
                Your cart is empty
              </h3>
              <p className="text-[#6B6B6B] mb-8 text-lg">
                Start shopping and add products to your cart
              </p>
              <Button onClick={() => onNavigate?.('Products')} className="relative overflow-hidden bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-2xl h-14 px-8 text-lg font-bold rounded-xl group border-0">
                <ShoppingBag className="w-6 h-6 mr-2" />
                Browse Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Order Confirmation ──────────────────────────────────────────────────────
  if (checkoutStep === 'confirmation' && createdOrder) {
    const orderPaymentStatus = createdOrder.paymentStatus || 'pending';
    const orderAmountPaid = createdOrder.amountPaid ?? 0;
    const orderAmountDue = createdOrder.amountDue ?? createdOrder.total;

    return (
      <div className="p-8 bg-gradient-to-br from-[#FFF8F0] via-[#FFF8F0] to-[#FFE4B5]/30 min-h-screen relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <Card className="border-0 bg-white/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h2>
              <p className="text-emerald-100 text-lg">Purchase order has been created and sent to branch management</p>
            </div>
            
            <CardContent className="p-8 space-y-6">
              {/* PO Details */}
              <div className="bg-gradient-to-r from-[#B8860B]/10 to-[#DAA520]/10 rounded-xl p-6 border border-[#B8860B]/20">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#6B6B6B]">PO Number</p>
                    <p className="text-xl font-bold text-[#B8860B]">{createdOrder.poNumber || createdOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B6B6B]">Order ID</p>
                    <p className="text-xl font-bold text-[#1A1A1A]">{createdOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B6B6B]">Customer</p>
                    <p className="font-semibold text-[#1A1A1A]">{createdOrder.customerName}</p>
                    {createdOrder.customerId && !createdOrder.customerId.startsWith('WALK-IN') && (
                      <p className="text-xs text-[#6B6B6B]">{createdOrder.customerId}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-[#6B6B6B]">Payment Mode</p>
                    <p className="font-semibold text-[#1A1A1A] capitalize">{createdOrder.paymentMode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B6B6B]">Order Status</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Pending
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-[#6B6B6B]">Payment Status</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                      orderPaymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      orderPaymentStatus === 'partial' ? 'bg-amber-100 text-amber-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {orderPaymentStatus === 'paid' ? 'Fully Paid' : orderPaymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="rounded-xl border-2 border-[#B8860B]/20 overflow-hidden">
                <div className="bg-gradient-to-r from-[#B8860B]/5 to-[#DAA520]/5 px-5 py-3 border-b border-[#B8860B]/15">
                  <h4 className="font-semibold text-[#1A1A1A] flex items-center gap-2 text-sm">
                    <Wallet className="w-4 h-4 text-[#B8860B]" />
                    Payment Summary
                  </h4>
                </div>
                <div className="p-5 space-y-2 text-sm">
                  <div className="flex justify-between text-[#6B6B6B]"><span>Subtotal</span><span className="font-semibold text-[#1A1A1A]">₹{createdOrder.subtotal.toLocaleString('en-IN')}</span></div>
                  {(createdOrder.discountAmount ?? 0) > 0 && (
                    <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="font-semibold">-₹{Math.round(createdOrder.discountAmount!).toLocaleString('en-IN')}</span></div>
                  )}
                  <div className="border-t border-[#B8860B]/15 pt-2 flex justify-between">
                    <span className="font-bold text-[#1A1A1A]">Grand Total</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">₹{createdOrder.total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-emerald-600 font-semibold">Amount Paid</span><span className="font-bold text-emerald-600">₹{Math.round(orderAmountPaid).toLocaleString('en-IN')}</span></div>
                  {orderAmountDue > 0 && (
                    <div className="flex justify-between bg-amber-50 -mx-5 px-5 py-2.5 border-y border-amber-200 mt-2">
                      <span className="text-amber-700 font-bold flex items-center gap-1.5"><Clock className="w-4 h-4" />Balance Due</span>
                      <span className="font-bold text-amber-700 text-lg">₹{Math.round(orderAmountDue).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#B8860B]" />
                  Order Items ({createdOrder.items.length})
                </h3>
                <div className="space-y-2">
                  {createdOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-[#FFF8F0] rounded-lg border border-[#B8860B]/10">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                        <p className="text-sm text-[#6B6B6B]">{item.category} &bull; Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-[#B8860B]">₹{item.total.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes & Reference */}
              {(createdOrder.paymentReference || createdOrder.orderNotes) && (
                <div className="bg-[#FFF8F0] rounded-xl p-4 border border-[#B8860B]/10 space-y-2">
                  {createdOrder.paymentReference && (
                    <div className="flex items-start gap-2 text-sm">
                      <Hash className="w-4 h-4 text-[#B8860B] mt-0.5 flex-shrink-0" />
                      <div><span className="text-[#6B6B6B]">Ref:</span> <span className="font-semibold text-[#1A1A1A]">{createdOrder.paymentReference}</span></div>
                    </div>
                  )}
                  {createdOrder.orderNotes && (
                    <div className="flex items-start gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-[#B8860B] mt-0.5 flex-shrink-0" />
                      <div><span className="text-[#6B6B6B]">Notes:</span> <span className="font-semibold text-[#1A1A1A]">{createdOrder.orderNotes}</span></div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Updates */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-3">Notifications Sent</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="w-4 h-4" /><span className="text-sm">Stock Manager notified for order review</span></div>
                  <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="w-4 h-4" /><span className="text-sm">Branch Admin can view order in Purchase History</span></div>
                  <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="w-4 h-4" /><span className="text-sm">Stock reserved from branch inventory</span></div>
                  <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="w-4 h-4" /><span className="text-sm">Order saved to branch database</span></div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4">
                {/* Receipt Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowReceipt(true)}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white h-11 font-semibold rounded-xl border-0"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Receipt
                  </Button>
                  <Button
                    onClick={() => {
                      setShowReceipt(true);
                      // Auto-trigger print after dialog opens
                      setTimeout(() => {
                        const printBtn = document.querySelector('[data-receipt-print]') as HTMLButtonElement;
                        if (printBtn) printBtn.click();
                      }, 300);
                    }}
                    variant="outline"
                    className="border-2 border-[#B8860B]/30 text-[#B8860B] hover:bg-[#B8860B]/10 h-11 px-4 rounded-xl"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    Print
                  </Button>
                  <Button
                    onClick={() => {
                      setShowReceipt(true);
                      setTimeout(() => {
                        const dlBtn = document.querySelector('[data-receipt-download]') as HTMLButtonElement;
                        if (dlBtn) dlBtn.click();
                      }, 300);
                    }}
                    variant="outline"
                    className="border-2 border-[#B8860B]/30 text-[#B8860B] hover:bg-[#B8860B]/10 h-11 px-4 rounded-xl"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    PDF
                  </Button>
                </div>

                {/* Navigation Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setCheckoutStep('cart');
                      setCreatedOrder(null);
                      setCustomerInfo({ name: '', phone: '', address: '' });
                      setAmountPaidInput('');
                      setPaymentReference('');
                      setOrderNotes('');
                      setDiscountValue('');
                    }}
                    className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white h-12 font-semibold rounded-xl border-0"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    New Order
                  </Button>
                  <Button
                    onClick={() => onNavigate?.('Products')}
                    variant="outline"
                    className="flex-1 border-2 border-[#B8860B]/30 text-[#1A1A1A] hover:bg-[#B8860B]/10 h-12 font-semibold rounded-xl"
                  >
                    Browse Products
                  </Button>
                </div>
              </div>

              {/* Receipt Dialog */}
              <OrderReceipt
                order={createdOrder}
                open={showReceipt}
                onClose={() => setShowReceipt(false)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Customer Info Step ──────────────────────────────────────────────────────
  if (checkoutStep === 'customer-info') {
    return (
      <div className="p-8 bg-gradient-to-br from-[#FFF8F0] via-[#FFF8F0] to-[#FFE4B5]/30 min-h-screen relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-sm text-emerald-600 font-semibold">Cart</span>
            </div>
            <div className="w-12 h-0.5 bg-[#B8860B]" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] flex items-center justify-center text-white text-sm font-bold">2</div>
              <span className="text-sm text-[#B8860B] font-semibold">Customer</span>
            </div>
            <div className="w-12 h-0.5 bg-[#B8860B]/20" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#B8860B]/20 flex items-center justify-center text-[#B8860B] text-sm font-bold">3</div>
              <span className="text-sm text-[#6B6B6B]">Payment</span>
            </div>
          </div>

          <Card className="border-0 bg-white/90 backdrop-blur-xl shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-[#B8860B]/10 to-[#DAA520]/10 border-b border-[#B8860B]/20">
              <CardTitle className="text-xl text-[#1A1A1A] flex items-center gap-2">
                <User className="w-5 h-5 text-[#B8860B]" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cust-name" className="text-[#1A1A1A]">
                    Customer Name <span className="text-orange-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                    <Input
                      id="cust-name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder="Enter customer name"
                      className="pl-10 bg-[#FFF8F0] border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cust-phone" className="text-[#1A1A1A]">
                    Phone Number <span className="text-orange-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                    <Input
                      id="cust-phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="pl-10 bg-[#FFF8F0] border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cust-address" className="text-[#1A1A1A]">
                    Delivery Address
                  </Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#6B6B6B]" />
                    <Input
                      id="cust-address"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      placeholder="City, State"
                      className="pl-10 bg-[#FFF8F0] border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary Mini */}
              <div className="bg-[#FFF8F0] rounded-xl p-4 border border-[#B8860B]/10">
                <p className="text-sm text-[#6B6B6B] mb-2">Order Summary</p>
                <div className="flex justify-between items-center">
                  <span className="text-[#1A1A1A]">{cart.length} items &bull; {cart.reduce((s, i) => s + i.quantity, 0)} units</span>
                  <span className="font-bold text-[#B8860B] text-lg">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setCheckoutStep('cart')}
                  variant="outline"
                  className="border-[#B8860B]/30 text-[#1A1A1A] hover:bg-[#B8860B]/10 h-12 px-6 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cart
                </Button>
                <Button
                  onClick={handleCustomerInfoNext}
                  className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white h-12 font-semibold rounded-xl border-0"
                >
                  Continue to Payment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Payment Step ────────────────────────────────────────────────────────────
  if (checkoutStep === 'payment') {
    const paymentOptions: { mode: PaymentMode; label: string; icon: React.ElementType }[] = [
      { mode: 'cash', label: 'Cash', icon: Banknote },
      { mode: 'upi', label: 'UPI', icon: Smartphone },
      { mode: 'bank', label: 'Bank', icon: Building2 },
      { mode: 'cheque', label: 'Cheque', icon: FileText },
      { mode: 'credit', label: 'Credit', icon: CreditCard },
    ];

    return (
      <div className="p-6 lg:p-8 bg-gradient-to-br from-[#FFF8F0] via-[#FFF8F0] to-[#FFE4B5]/30 min-h-screen relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold"><CheckCircle2 className="w-5 h-5" /></div>
              <span className="text-sm text-emerald-600 font-semibold">Cart</span>
            </div>
            <div className="w-12 h-0.5 bg-emerald-500" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold"><CheckCircle2 className="w-5 h-5" /></div>
              <span className="text-sm text-emerald-600 font-semibold">Customer</span>
            </div>
            <div className="w-12 h-0.5 bg-[#B8860B]" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] flex items-center justify-center text-white text-sm font-bold">3</div>
              <span className="text-sm text-[#B8860B] font-semibold">Payment</span>
            </div>
          </div>

          {/* Customer Banner */}
          <div className="flex items-center gap-3 mb-5 p-3.5 bg-white/80 rounded-xl border border-emerald-200 shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1A1A1A] truncate">{customerInfo.name}</p>
              <p className="text-xs text-[#6B6B6B]">{customerInfo.phone}{customerInfo.address ? ` - ${customerInfo.address}` : ''}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex-shrink-0">
              {selectedCustomer ? selectedCustomer.id : 'Walk-in'}
            </span>
          </div>

          <div className="space-y-5">
            {/* Payment Method */}
            <Card className="border-0 bg-white/90 backdrop-blur-xl shadow-xl">
              <CardHeader className="bg-gradient-to-r from-[#B8860B]/10 to-[#DAA520]/10 border-b border-[#B8860B]/20 pb-3 pt-4 px-5">
                <CardTitle className="text-base text-[#1A1A1A] flex items-center gap-2"><Wallet className="w-4 h-4 text-[#B8860B]" />Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {paymentOptions.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = paymentMode === opt.mode;
                    return (
                      <button key={opt.mode} onClick={() => setPaymentMode(opt.mode)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${isSelected ? 'border-[#B8860B] bg-gradient-to-b from-[#B8860B]/10 to-[#DAA520]/10 shadow-md' : 'border-[#B8860B]/15 hover:border-[#B8860B]/40 hover:bg-[#FFF8F0]'}`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow' : 'bg-[#FFF8F0] text-[#B8860B]'}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className={`text-xs font-semibold ${isSelected ? 'text-[#B8860B]' : 'text-[#6B6B6B]'}`}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Discount */}
            <Card className="border-0 bg-white/90 backdrop-blur-xl shadow-lg">
              <CardContent className="p-4 space-y-2">
                <Label className="text-[#1A1A1A] flex items-center gap-2 text-sm"><Tag className="w-4 h-4 text-[#B8860B]" />Discount</Label>
                <div className="flex gap-2">
                  <div className="flex bg-[#FFF8F0] rounded-lg border border-[#B8860B]/20 overflow-hidden">
                    <button onClick={() => setDiscountType('flat')} className={`px-3 py-2 text-xs font-semibold transition-colors ${discountType === 'flat' ? 'bg-[#B8860B] text-white' : 'text-[#6B6B6B] hover:bg-[#B8860B]/10'}`}>₹</button>
                    <button onClick={() => setDiscountType('percentage')} className={`px-3 py-2 text-xs font-semibold transition-colors ${discountType === 'percentage' ? 'bg-[#B8860B] text-white' : 'text-[#6B6B6B] hover:bg-[#B8860B]/10'}`}>%</button>
                  </div>
                  <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 200'} className="flex-1 bg-[#FFF8F0] border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]" min="0" />
                </div>
                {discountAmount > 0 && <p className="text-xs text-emerald-600 font-semibold">Discount: -₹{Math.round(discountAmount).toLocaleString('en-IN')}</p>}
              </CardContent>
            </Card>

            {/* Amount Received & Due */}
            <Card className="border-0 bg-white/90 backdrop-blur-xl shadow-lg">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-[#1A1A1A] flex items-center gap-2 mb-2 text-sm"><IndianRupee className="w-4 h-4 text-[#B8860B]" />Amount Received</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] font-semibold">₹</span>
                      <Input type="number" value={amountPaidInput} onChange={(e) => setAmountPaidInput(e.target.value)} placeholder={Math.round(total).toString()} className="pl-8 bg-[#FFF8F0] border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A] font-semibold text-lg h-12" min="0" />
                    </div>
                    <Button onClick={() => setAmountPaidInput(Math.round(total).toString())} variant="outline" className="border-[#B8860B]/30 text-[#B8860B] hover:bg-[#B8860B]/10 h-12 px-4 text-xs font-semibold whitespace-nowrap">Full Amt</Button>
                  </div>
                </div>
                {/* Payment Status */}
                <div className={`rounded-xl p-4 border-2 ${paymentStatusLabel === 'paid' ? 'bg-emerald-50 border-emerald-200' : paymentStatusLabel === 'partial' ? 'bg-amber-50 border-amber-200' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${paymentStatusLabel === 'paid' ? 'bg-emerald-100 text-emerald-700' : paymentStatusLabel === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-700'}`}>
                      {paymentStatusLabel === 'paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {paymentStatusLabel === 'partial' && <Clock className="w-3.5 h-3.5" />}
                      {paymentStatusLabel === 'pending' && <AlertCircle className="w-3.5 h-3.5" />}
                      {paymentStatusLabel === 'paid' ? 'Fully Paid' : paymentStatusLabel === 'partial' ? 'Partial Payment' : 'No Payment'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><p className="text-xs text-[#6B6B6B]">Total</p><p className="font-bold text-[#1A1A1A]">₹{Math.round(total).toLocaleString('en-IN')}</p></div>
                    <div><p className="text-xs text-[#6B6B6B]">Paid</p><p className="font-bold text-emerald-600">₹{Math.round(amountPaid).toLocaleString('en-IN')}</p></div>
                    <div><p className="text-xs text-[#6B6B6B]">Due Balance</p><p className={`font-bold text-lg ${amountDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>₹{Math.round(amountDue).toLocaleString('en-IN')}</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reference & Notes */}
            <Card className="border-0 bg-white/90 backdrop-blur-xl shadow-lg">
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-[#1A1A1A] flex items-center gap-2 mb-1 text-sm"><Hash className="w-4 h-4 text-[#B8860B]" />Payment Reference <span className="text-xs text-[#6B6B6B] font-normal">(optional)</span></Label>
                  <Input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Transaction ID, cheque no., UPI ref..." className="bg-[#FFF8F0] border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]" />
                </div>
                <div>
                  <Label className="text-[#1A1A1A] flex items-center gap-2 mb-1 text-sm"><MessageSquare className="w-4 h-4 text-[#B8860B]" />Order Notes <span className="text-xs text-[#6B6B6B] font-normal">(optional)</span></Label>
                  <Input value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Delivery instructions, special requests..." className="bg-[#FFF8F0] border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-[#B8860B] text-[#1A1A1A]" />
                </div>
              </CardContent>
            </Card>

            {/* Bill Summary */}
            <Card className="border-0 bg-white/90 backdrop-blur-xl shadow-lg">
              <CardContent className="p-4 space-y-2">
                <h4 className="font-semibold text-[#1A1A1A] flex items-center gap-2 text-sm"><Receipt className="w-4 h-4 text-[#B8860B]" />Bill Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#6B6B6B]"><span>Subtotal ({cart.length} items)</span><span className="font-semibold text-[#1A1A1A]">₹{Math.round(subtotal).toLocaleString('en-IN')}</span></div>
                  {discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount{discountType === 'percentage' ? ` (${discountNum}%)` : ''}</span><span className="font-semibold">-₹{Math.round(discountAmount).toLocaleString('en-IN')}</span></div>}
                  <div className="border-t border-[#B8860B]/20 pt-2 flex justify-between"><span className="font-bold text-[#1A1A1A]">Grand Total</span><span className="text-xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">₹{Math.round(total).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-emerald-600 font-semibold">Paid</span><span className="font-bold text-emerald-600">₹{Math.round(amountPaid).toLocaleString('en-IN')}</span></div>
                  {amountDue > 0 && (
                    <div className="flex justify-between bg-amber-50 -mx-4 px-4 py-2 border-y border-amber-200">
                      <span className="text-amber-700 font-bold flex items-center gap-1.5"><Clock className="w-4 h-4" />Balance Due</span>
                      <span className="font-bold text-amber-700 text-lg">₹{Math.round(amountDue).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-1 pb-4">
              <Button onClick={() => setCheckoutStep(selectedCustomer ? 'cart' : 'customer-info')} variant="outline" className="border-[#B8860B]/30 text-[#1A1A1A] hover:bg-[#B8860B]/10 h-12 px-6 rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />Back
              </Button>
              <Button onClick={handlePlaceOrder} disabled={isProcessing} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white h-14 text-lg font-bold rounded-xl border-0 shadow-lg">
                {isProcessing ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Processing...</>) : (<><CheckCircle2 className="w-6 h-6 mr-2" />{amountDue > 0 ? `Place Order (Due: ₹${Math.round(amountDue).toLocaleString('en-IN')})` : `Place Order - ₹${Math.round(total).toLocaleString('en-IN')}`}</>)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Cart View ──────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#FFF8F0] via-[#FFF8F0] to-[#FFE4B5]/30 min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#B8860B]/10 to-[#DAA520]/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <CartIcon className="w-10 h-10 text-[#B8860B]" />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] bg-clip-text text-transparent">
              Shopping Cart
            </h1>
            <p className="text-[#6B6B6B] text-lg">
              <span className="font-bold text-[#B8860B]">{cart.length}</span> {cart.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </div>
        <Button
          onClick={handleClearCart}
          variant="outline"
          className="border-2 border-orange-400/30 text-orange-600 hover:bg-orange-500/10 hover:border-orange-500 h-12 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item, index) => (
            <Card key={item.product.id} className="border-0 bg-white/90 backdrop-blur-xl hover:bg-white hover:shadow-2xl hover:shadow-[#B8860B]/20 transition-all duration-300 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="w-32 h-32 bg-gradient-to-br from-[#FFF8F0] to-[#FFE4B5]/30 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-[#B8860B]/10 shadow-lg hover:scale-105 transition-transform duration-300">
                    {item.product.images && item.product.images[0] && (
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-[#1A1A1A] mb-1 text-lg group-hover:text-[#B8860B] transition-colors">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-[#6B6B6B] mb-1">{item.product.category}</p>
                        <p className="text-xs text-[#6B6B6B] flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Dealer: {item.product.dealerName}
                        </p>
                      </div>
                      <Button
                        onClick={() => removeFromCart(item.product.id)}
                        variant="ghost"
                        size="sm"
                        className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 rounded-xl transition-all duration-200 hover:scale-110 hover:rotate-12 active:scale-90"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1, item.product.stock)}
                          variant="outline"
                          size="sm"
                          className="border-2 border-[#B8860B]/30 text-[#B8860B] hover:bg-[#B8860B]/10 hover:border-[#B8860B] h-10 w-10 p-0 rounded-xl font-bold transition-all duration-200 hover:scale-110 active:scale-90"
                        >
                          <Minus className="w-5 h-5" />
                        </Button>
                        
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 1, item.product.stock)}
                          className="w-20 text-center bg-[#FFF8F0] border-2 border-[#B8860B]/20 text-[#1A1A1A] font-bold text-lg rounded-xl px-3 py-2 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 focus:outline-none"
                          min="1"
                          max={item.product.stock}
                        />
                        
                        <Button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1, item.product.stock)}
                          variant="outline"
                          size="sm"
                          className="border-2 border-[#B8860B]/30 text-[#B8860B] hover:bg-[#B8860B]/10 hover:border-[#B8860B] h-10 w-10 p-0 rounded-xl font-bold transition-all duration-200 hover:scale-110 active:scale-90"
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm text-[#6B6B6B] mb-1">Subtotal</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
                          ₹{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Stock Warning */}
                    {item.quantity > item.product.stock && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-orange-600 bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">Quantity exceeds available stock ({item.product.stock} units)</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <Card className="border-0 bg-white/90 backdrop-blur-xl shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#B8860B]/10 to-[#DAA520]/10 border-b-2 border-[#B8860B]/20">
                <CardTitle className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#B8860B]" />
                  Cart Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between text-[#6B6B6B] text-lg">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#1A1A1A]">₹{subtotal.toLocaleString()}</span>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#B8860B]/10 to-[#DAA520]/10 rounded-xl">
                  <span className="text-xl font-bold text-[#1A1A1A]">Grand Total</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
                    ₹{total.toLocaleString()}
                  </span>
                </div>

                {/* Item Count */}
                <div className="text-center bg-[#FFF8F0] py-3 rounded-xl border border-[#B8860B]/10">
                  <p className="text-sm text-[#6B6B6B] font-medium">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'} &bull; {cart.reduce((sum, item) => sum + item.quantity, 0)} total units
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleProceedToCheckout}
                    className="relative overflow-hidden w-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white h-14 text-lg font-bold shadow-2xl hover:shadow-[#B8860B]/50 rounded-xl border-0 group transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <CreditCard className="w-6 h-6 mr-2" />
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    onClick={() => onNavigate?.('Products')}
                    variant="outline"
                    className="w-full border-2 border-[#B8860B]/30 text-[#1A1A1A] hover:bg-[#B8860B]/10 hover:border-[#B8860B] h-12 font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};