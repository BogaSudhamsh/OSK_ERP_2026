import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useApp } from '@/app/context/AppContext';
import { ArrowLeft, Printer, Download, Truck, Package } from 'lucide-react';
import { motion } from 'motion/react';
import oskLogo from '@/assets/356d3a3460dadc43b90004f966e6aa635e39adc6.png';

interface TransportInvoiceProps {
  onBack: () => void;
}

export const TransportInvoice: React.FC<TransportInvoiceProps> = ({ onBack }) => {
  const { orders, products, dealers } = useApp();
  const [selectedOrder] = useState(orders.find(o => o.status === 'pending') || orders[0]);

  const generateSerialNumber = (productId: string, index: number) => {
    return `OSK-${productId.slice(0, 4)}-${String(index + 1).padStart(4, '0')}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real app, generate PDF
    alert('Transport Invoice PDF downloaded');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
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
              Transport Invoice
            </h1>
            <p className="text-[#6B6B6B]">Outpass for goods dispatch</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-[#B8860B]/20 rounded-xl shadow-2xl print:shadow-none print:border-0"
      >
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-[#B8860B]/20">
            <div className="flex items-center gap-4">
              <img src={oskLogo} alt="OSK Granite" className="w-20 h-20" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
                  OSK Granite
                </h1>
                <p className="text-sm text-[#6B6B6B] mt-1">Premium Tiles, Marble & Granite</p>
                <p className="text-sm text-[#6B6B6B]">GST: 27AABCU9603R1ZM</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white mb-2">
                <Truck className="w-5 h-5" />
                <span className="font-semibold">TRANSPORT INVOICE</span>
              </div>
              <p className="text-sm text-[#6B6B6B]">Outpass / Gate Pass</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Invoice No:</p>
              <p className="font-bold text-[#B8860B] text-lg">TI-{selectedOrder.id}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Date:</p>
              <p className="font-semibold text-[#1A1A1A]">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B6B6B] mb-1">Reference:</p>
              <p className="font-semibold text-[#1A1A1A]">Order: {selectedOrder.id}</p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mb-8 p-6 rounded-lg bg-gradient-to-r from-[#FFF8F0] to-white border border-[#B8860B]/10">
            <h3 className="font-semibold text-[#B8860B] mb-3">Delivery To:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#6B6B6B]">Customer Name:</p>
                <p className="font-semibold text-[#1A1A1A]">{selectedOrder.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-[#6B6B6B]">Order Date:</p>
                <p className="font-semibold text-[#1A1A1A]">
                  {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="font-semibold text-[#B8860B] mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Items for Transport
            </h3>
            <div className="border border-[#B8860B]/20 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white">
                  <tr>
                    <th className="text-left p-3 font-semibold">Serial No.</th>
                    <th className="text-left p-3 font-semibold">Product Name</th>
                    <th className="text-center p-3 font-semibold">Quantity</th>
                    <th className="text-left p-3 font-semibold">GST No.</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    const dealer = product ? dealers.find(d => d.id === product.dealerId) : null;
                    
                    return (
                      <tr key={index} className="border-b border-[#B8860B]/10 hover:bg-[#FFF8F0]/30">
                        <td className="p-3">
                          <code className="text-sm font-mono bg-[#FFF8F0] px-2 py-1 rounded">
                            {generateSerialNumber(item.productId, index)}
                          </code>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{item.productName}</p>
                            {product && (
                              <p className="text-sm text-[#6B6B6B]">{product.category}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-3 py-1 rounded-full bg-[#FFF8F0] font-semibold text-[#B8860B]">
                            {item.quantity} units
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="text-sm font-mono">{dealer?.gstNumber || 'N/A'}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-8 p-6 rounded-lg bg-gradient-to-r from-[#FFF8F0] to-white border border-[#B8860B]/10">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[#6B6B6B] mb-2">Total Items:</p>
                <p className="text-2xl font-bold text-[#B8860B]">
                  {selectedOrder.items.length} Products
                </p>
              </div>
              <div>
                <p className="text-sm text-[#6B6B6B] mb-2">Total Quantity:</p>
                <p className="text-2xl font-bold text-[#B8860B]">
                  {selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)} Units
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="mb-8 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ <strong>Important:</strong> This is a transport invoice for goods movement only. 
              Pricing information is excluded as per inventory policy. For commercial invoice, 
              please refer to the store billing system.
            </p>
          </div>

          {/* Terms and Signatures */}
          <div className="grid md:grid-cols-2 gap-8 pt-8 border-t-2 border-[#B8860B]/20">
            <div>
              <h4 className="font-semibold text-[#1A1A1A] mb-3">Terms & Conditions:</h4>
              <ul className="text-sm text-[#6B6B6B] space-y-1">
                <li>• Goods are subject to inspection at delivery</li>
                <li>• Any damage must be reported immediately</li>
                <li>• This is not a commercial invoice</li>
                <li>• Valid for single trip only</li>
              </ul>
            </div>
            <div>
              <div className="mb-6">
                <p className="text-sm text-[#6B6B6B] mb-12">Authorized Signatory:</p>
                <div className="border-t-2 border-[#B8860B]/20 pt-2">
                  <p className="font-semibold text-[#1A1A1A]">OSK Granite - Inventory Department</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#B8860B]/10 text-center text-sm text-[#6B6B6B]">
            <p className="font-medium text-[#B8860B]">OSK Granite - Premium Quality, Timeless Elegance</p>
            <p className="mt-1">Contact: +91 98765 43210 | Email: info@oskgranite.com</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
