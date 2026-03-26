import React, { useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { 
  Download, 
  Send, 
  Printer, 
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Mail,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import oskLogo from '@/assets/356d3a3460dadc43b90004f966e6aa635e39adc6.png';

interface PurchaseOrderProps {
  order: {
    id: string;
    customer: {
      id: string;
      name: string;
      phone: string;
      location: string;
    };
    items: any[];
    subtotal: number;
    gst: number;
    total: number;
    createdAt: Date;
  };
  onBack: () => void;
}

export const PurchaseOrder: React.FC<PurchaseOrderProps> = ({ order, onBack }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleDownloadPDF = () => {
    toast.success('PDF Download Started', {
      description: 'Purchase order is being downloaded'
    });
    // In real app, generate and download PDF
  };

  const handleSendToCustomer = async () => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Sent to Customer!', {
      description: `PO sent via WhatsApp to ${order.customer.phone}`
    });
    setIsSending(false);
  };

  const handleSendToInventory = async () => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Sent to Inventory!', {
      description: 'Order notification sent to inventory system'
    });
    setIsSending(false);
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleConfirmOrder = async () => {
    setIsSending(true);
    
    // Simulate sending to customer
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('✅ Sent to Customer', {
      description: 'WhatsApp message sent'
    });
    
    // Simulate sending to inventory
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('✅ Sent to Inventory', {
      description: 'Stock reservation completed'
    });
    
    // Simulate order confirmation
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsConfirmed(true);
    setIsSending(false);
    
    toast.success('Order Confirmed!', {
      description: `PO ${order.id} has been processed successfully`
    });

    // Auto redirect after 2 seconds
    setTimeout(() => {
      onBack();
    }, 2000);
  };

  if (isConfirmed) {
    return (
      <div className="p-8">
        <Card className="border-emerald-500/30 bg-[#1F1F1F] max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-16 h-16 text-white" />
              </div>
            </motion.div>
            
            <h2 className="text-3xl font-bold text-emerald-500 mb-3">Order Confirmed!</h2>
            <p className="text-xl text-[#C9A961] mb-2">PO Number: {order.id}</p>
            <p className="text-[#C9A961]/70 mb-8">
              All actions completed successfully
            </p>

            <div className="space-y-2 text-left max-w-sm mx-auto mb-8">
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
                <span>PO sent to customer (WhatsApp)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
                <span>PO sent to inventory system</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
                <span>Stock reserved in inventory</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
                <span>Order saved to database</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
                <span>Cart cleared</span>
              </div>
            </div>

            <p className="text-sm text-[#C9A961]/60">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-[#C9A961]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex gap-3">
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="border-[#C9A961]/30 text-[#C9A961]"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-[#C9A961]/30 text-[#C9A961]"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={handleConfirmOrder}
            disabled={isSending}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {isSending ? 'Processing...' : 'Confirm Order'}
          </Button>
        </div>
      </div>

      {/* Purchase Order */}
      <Card className="border-[#C9A961]/30 bg-white max-w-4xl mx-auto">
        <CardContent className="p-12">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-[#C9A961]/20">
            <div className="flex items-center gap-4">
              <img src={oskLogo} alt="OSK Granite" className="w-16 h-16" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#C9A961] to-[#D4AF37] bg-clip-text text-transparent">
                  OSK GRANITE
                </h1>
                <p className="text-sm text-gray-600">Premium Granite & Marble</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-[#7C1D1D] mb-2">PURCHASE ORDER</h2>
              <p className="text-sm text-gray-600">PO Number: <span className="font-semibold">{order.id}</span></p>
              <p className="text-sm text-gray-600">
                Date: {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-8 p-6 bg-[#C9A961]/5 rounded-lg">
            <h3 className="text-lg font-bold text-[#7C1D1D] mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#C9A961]" />
                <div>
                  <p className="text-xs text-gray-600">Customer Name</p>
                  <p className="font-semibold text-gray-900">{order.customer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Customer ID: {order.customer.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C9A961]" />
                <div>
                  <p className="text-xs text-gray-600">Phone Number</p>
                  <p className="font-semibold text-gray-900">{order.customer.phone}</p>
                </div>
              </div>
              {order.customer.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C9A961]" />
                  <div>
                    <p className="text-xs text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{order.customer.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Details Table */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-[#7C1D1D] mb-4">Order Details</h3>
            <table className="w-full">
              <thead>
                <tr className="bg-[#C9A961]/10 border-b-2 border-[#C9A961]">
                  <th className="text-left p-3 text-sm font-bold text-gray-900">S.No.</th>
                  <th className="text-left p-3 text-sm font-bold text-gray-900">Product Name</th>
                  <th className="text-left p-3 text-sm font-bold text-gray-900">Category</th>
                  <th className="text-right p-3 text-sm font-bold text-gray-900">Quantity</th>
                  <th className="text-right p-3 text-sm font-bold text-gray-900">Unit Price (₹)</th>
                  <th className="text-right p-3 text-sm font-bold text-gray-900">Subtotal (₹)</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="p-3 text-gray-900">{index + 1}</td>
                    <td className="p-3 text-gray-900">{item.name || 'Sample Product'}</td>
                    <td className="p-3 text-gray-600">{item.category || 'Granite'}</td>
                    <td className="text-right p-3 text-gray-900">{item.quantity || 1}</td>
                    <td className="text-right p-3 text-gray-900">{(item.price || 1000).toLocaleString()}</td>
                    <td className="text-right p-3 font-semibold text-gray-900">
                      {((item.price || 1000) * (item.quantity || 1)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-80 space-y-2">
              <div className="flex justify-between p-3 bg-gray-50">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold text-gray-900">₹{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50">
                <span className="text-gray-700">CGST (9%):</span>
                <span className="font-semibold text-gray-900">₹{(order.gst / 2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50">
                <span className="text-gray-700">SGST (9%):</span>
                <span className="font-semibold text-gray-900">₹{(order.gst / 2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-4 bg-[#C9A961]/10 border-2 border-[#C9A961]">
                <span className="text-lg font-bold text-gray-900">Grand Total:</span>
                <span className="text-2xl font-bold text-[#7C1D1D]">₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-[#C9A961]/20 pt-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Terms & Conditions:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Payment terms: As per agreement</li>
                  <li>• Delivery within 7-10 working days</li>
                  <li>• Installation charges may apply</li>
                  <li>• Goods once sold will not be taken back</li>
                </ul>
              </div>
              <div className="text-right">
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">For OSK Granite</p>
                  <div className="border-t border-gray-400 w-48 ml-auto pt-2">
                    <p className="text-xs font-semibold text-gray-900">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600">
                Thank you for your business!
              </p>
              <p className="text-xs text-[#C9A961] mt-1">
                OSK Granite - Your Trusted Partner in Premium Stones
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
