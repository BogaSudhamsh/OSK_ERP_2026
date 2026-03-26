import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/app/context/AppContext';
import { ArrowLeft, ShoppingCart, User, Package, Check, Printer, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';

interface IncomingOrdersProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export const IncomingOrders: React.FC<IncomingOrdersProps> = ({ onBack, onNavigate }) => {
  const { orders, products, updateProduct, addStockMovement } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null);
  const [showPackingList, setShowPackingList] = useState(false);

  const pendingOrders = orders.filter(o => o.status === 'pending');

  const handleAcceptOrder = (order: typeof orders[0]) => {
    try {
      // Deduct stock for each item
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          updateProduct(product.id, { stock: newStock });

          // Add stock movement record
          addStockMovement({
            productId: product.id,
            productName: product.name,
            type: 'out',
            quantity: item.quantity,
            reference: `Order: ${order.id}`,
            price: item.price || item.rate || 0,
            userId: 'system',
            userName: 'Inventory Manager',
            notes: `Inventory deducted for order ${order.id}`,
      });
        }
      });

      setSelectedOrder(order);
      setShowPackingList(true);
      toast.success('Order accepted successfully');
      toast.info('Stock deducted automatically');
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  const generateTransportInvoice = () => {
    toast.success('Transport invoice generated');
    toast.info('Invoice ready for download');
    onNavigate('Transport Invoice');
  };

  return (
    <div className="space-y-6">
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
            Incoming Store Orders
          </h1>
          <p className="text-[#6B6B6B]">{pendingOrders.length} pending orders to process</p>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <Card className="border-[#B8860B]/20">
          <CardContent className="py-16 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-[#B8860B]/30" />
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No Pending Orders</h3>
            <p className="text-[#6B6B6B]">All orders have been processed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-[#B8860B]/20 hover:border-[#B8860B]/40 transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-[#B8860B] mb-1">Order {order.id}</CardTitle>
                      <p className="text-sm text-[#6B6B6B]">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white">
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Info (Limited) */}
                  <div className="p-4 rounded-lg bg-[#FFF8F0] border border-[#B8860B]/10">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="w-5 h-5 text-[#B8860B]" />
                      <h4 className="font-semibold text-[#1A1A1A]">Customer Information</h4>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[#6B6B6B]">Name:</p>
                        <p className="font-medium text-[#1A1A1A]">{order.customerName}</p>
                      </div>
                      <div>
                        <p className="text-[#6B6B6B]">Order Date:</p>
                        <p className="font-medium text-[#1A1A1A]">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-[#B8860B]" />
                      <h4 className="font-semibold text-[#1A1A1A]">Order Items</h4>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => {
                        const product = products.find(p => p.id === item.productId);
                        const hasStock = product && product.stock >= item.quantity;
                        
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border flex items-center justify-between ${
                              hasStock
                                ? 'border-[#B8860B]/20 bg-white'
                                : 'border-red-200 bg-red-50'
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                              <p className="text-sm text-[#6B6B6B]">Quantity: {item.quantity} units</p>
                              {product && (
                                <p className="text-xs text-[#6B6B6B] mt-1">
                                  Available Stock: {product.stock} units
                                </p>
                              )}
                            </div>
                            {!hasStock && (
                              <Badge variant="destructive" className="ml-2">
                                Insufficient Stock
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-[#B8860B]/10">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept Order
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="border-[#B8860B]/20">
                        <DialogHeader>
                          <DialogTitle className="text-[#B8860B]">Confirm Order Acceptance</DialogTitle>
                          <DialogDescription>
                            This will deduct stock and generate packing list. Are you sure?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="p-4 rounded-lg bg-[#FFF8F0] border border-[#B8860B]/10">
                            <h4 className="font-semibold mb-2 text-[#1A1A1A]">Order Summary</h4>
                            <div className="space-y-1 text-sm">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span className="text-[#6B6B6B]">{item.productName}</span>
                                  <span className="font-medium text-[#1A1A1A]">{item.quantity} units</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAcceptOrder(order)}
                            className="w-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white"
                          >
                            Confirm & Generate Packing List
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Packing List Dialog */}
      <Dialog open={showPackingList} onOpenChange={setShowPackingList}>
        <DialogContent className="border-[#B8860B]/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#B8860B] flex items-center gap-2">
              <Check className="w-5 h-5" />
              Order Accepted - Packing List Generated
            </DialogTitle>
            <DialogDescription>
              Stock has been deducted. Generate transport invoice to proceed.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* Packing List Content */}
              <div className="border border-[#B8860B]/20 rounded-lg p-6 bg-white">
                <div className="text-center mb-6 pb-4 border-b border-[#B8860B]/10">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
                    OSK Granite
                  </h3>
                  <p className="text-sm text-[#6B6B6B] mt-1">Packing List</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <p className="text-[#6B6B6B]">Order ID:</p>
                    <p className="font-semibold text-[#1A1A1A]">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-[#6B6B6B]">Date:</p>
                    <p className="font-semibold text-[#1A1A1A]">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6B6B6B]">Customer:</p>
                    <p className="font-semibold text-[#1A1A1A]">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[#6B6B6B]">Status:</p>
                    <p className="font-semibold text-green-600">Ready for Packing</p>
                  </div>
                </div>

                <div className="border-t border-[#B8860B]/10 pt-4">
                  <h4 className="font-semibold mb-3 text-[#1A1A1A]">Items to Pack:</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between p-2 rounded bg-[#FFF8F0]">
                        <span className="text-[#1A1A1A]">{item.productName}</span>
                        <span className="font-semibold text-[#B8860B]">{item.quantity} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPackingList(false)}
                  className="flex-1 border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Packing List
                </Button>
                <Button
                  onClick={generateTransportInvoice}
                  className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Generate Transport Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
