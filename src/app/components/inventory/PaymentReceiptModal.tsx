import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { DealerPayment } from '@/app/types';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Download, 
  Printer, 
  Building2, 
  Calendar, 
  CreditCard,
  Package,
  MapPin,
  Hash,
  FileText,
  IndianRupee
} from 'lucide-react';

interface PaymentReceiptModalProps {
  open: boolean;
  onClose: () => void;
  payment: DealerPayment | null;
  dealerName: string;
  dealerPhone: string;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  open,
  onClose,
  payment,
  dealerName,
  dealerPhone,
}) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real app, this would generate a PDF
    alert('PDF download functionality would be implemented here');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const branchNames = payment.branches.map(loc => 
    loc.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  ).join(', ');

  const paymentMethodLabels = {
    'cash': 'Cash Payment',
    'upi': 'UPI Payment',
    'bank-transfer': 'Bank Transfer',
    'cheque': 'Cheque Payment',
    'credit': 'Credit (Pay Later)',
  };

  const paymentStatus = payment.paymentMethod === 'credit' 
    ? 'Credit Account' 
    : payment.balanceAmount > 0 
      ? 'Partial Payment' 
      : 'Paid in Full';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto print:shadow-none">
        {/* Success Header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-6 border-b border-[#B8860B]/20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 mb-4 shadow-lg"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>
          <DialogTitle className="text-2xl font-bold text-[#1A1A1A] mb-2">
            Payment Recorded Successfully!
          </DialogTitle>
          <p className="text-[#6B6B6B]">
            Receipt ID: <span className="font-mono font-semibold text-[#B8860B]">{payment.id}</span>
          </p>
        </motion.div>

        {/* Receipt Content */}
        <div className="py-6 space-y-6 print:p-8">
          {/* Company Header */}
          <div className="text-center pb-4 border-b-2 border-[#B8860B]/20">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent mb-2">
              OSK Granite
            </h1>
            <p className="text-sm text-[#6B6B6B]">Payment Receipt</p>
          </div>

          {/* Receipt Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date & Time</span>
              </div>
              <p className="font-semibold text-sm text-[#1A1A1A]">
                {formatDate(payment.paymentDate)}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                <Hash className="w-3.5 h-3.5" />
                <span>Receipt No.</span>
              </div>
              <p className="font-semibold text-sm text-[#1A1A1A] font-mono">
                {payment.id}
              </p>
            </div>
          </div>

          {/* Dealer Information */}
          <div className="bg-gradient-to-br from-[#FFF8F0] to-white border-2 border-[#B8860B]/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-[#B8860B]" />
              <h3 className="font-semibold text-[#1A1A1A]">Dealer Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Dealer Name:</span>
                <span className="font-semibold text-[#1A1A1A]">{dealerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Contact:</span>
                <span className="font-semibold text-[#1A1A1A]">{dealerPhone}</span>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white border-2 border-[#B8860B]/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-[#B8860B]" />
              <h3 className="font-semibold text-[#1A1A1A]">Product Details</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Product:</span>
                <span className="font-semibold text-[#1A1A1A]">{payment.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Quantity:</span>
                <span className="font-semibold text-[#1A1A1A]">{payment.quantity} sqft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Rate per sqft:</span>
                <span className="font-semibold text-[#1A1A1A]">₹{payment.pricePerUnit.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-[#B8860B]/20">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-[#B8860B]" />
                  <span className="text-xs text-[#6B6B6B]">Delivered to Branches:</span>
                </div>
                <p className="font-semibold text-sm text-[#1A1A1A]">{branchNames}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-900">Payment Details</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-700">Payment Method:</span>
                <span className="font-semibold text-emerald-900">
                  {paymentMethodLabels[payment.paymentMethod]}
                </span>
              </div>
              {payment.paidByBranch && (
                <div className="flex justify-between">
                  <span className="text-emerald-700">Paid by Branch:</span>
                  <span className="font-semibold text-emerald-900">
                    {payment.paidByBranch.split('-').map((word: string) => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                </div>
              )}
              {payment.paidByUserName && (
                <div className="flex justify-between">
                  <span className="text-emerald-700">Recorded by:</span>
                  <span className="font-semibold text-emerald-900">
                    {payment.paidByUserName}
                  </span>
                </div>
              )}
              {payment.transactionRef && (
                <div className="flex justify-between">
                  <span className="text-emerald-700">Transaction Ref:</span>
                  <span className="font-mono font-semibold text-emerald-900">
                    {payment.transactionRef}
                  </span>
                </div>
              )}
              {payment.notes && (
                <div className="pt-2 border-t border-emerald-200">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs text-emerald-700 block mb-1">Notes:</span>
                      <span className="text-emerald-900">{payment.notes}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amount Summary */}
          <div className="bg-gradient-to-br from-[#B8860B]/10 to-[#DAA520]/10 border-2 border-[#B8860B]/30 rounded-xl p-5">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">Purchase Amount:</span>
                <span className="font-semibold text-[#1A1A1A]">
                  ₹{payment.purchaseAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">Amount Paid:</span>
                <span className="font-semibold text-emerald-600">
                  ₹{payment.paidAmount.toFixed(2)}
                </span>
              </div>
              {payment.balanceAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B6B]">Balance Amount:</span>
                  <span className="font-semibold text-red-600">
                    ₹{payment.balanceAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="pt-3 border-t-2 border-[#B8860B]/30">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#1A1A1A]">Payment Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    payment.paymentMethod === 'credit' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : payment.balanceAmount > 0
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-[#B8860B]/20">
            <p className="text-xs text-[#6B6B6B]">
              This is a computer-generated receipt and does not require a signature.
            </p>
            <p className="text-xs text-[#6B6B6B] mt-1">
              For any queries, please contact OSK Granite support team.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-[#B8860B]/20 print:hidden">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex-1 border-[#B8860B] text-[#B8860B] hover:bg-[#FFF8F0]"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex-1 border-[#B8860B] text-[#B8860B] hover:bg-[#FFF8F0]"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};