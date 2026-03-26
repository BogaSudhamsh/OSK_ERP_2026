import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { 
  CreditCard, 
  IndianRupee, 
  Calendar, 
  FileText, 
  CheckCircle2,
  Building2,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import type { PendingBill, BranchLocation } from '@/app/types';

interface PayBillModalProps {
  bill: PendingBill;
  isOpen: boolean;
  onClose: () => void;
}

export const PayBillModal: React.FC<PayBillModalProps> = ({ bill, isOpen, onClose }) => {
  const { payBill, currentUser, branches } = useApp();
  
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'cash' as 'cash' | 'upi' | 'bank-transfer' | 'cheque' | 'credit',
    paidAmount: bill.remainingAmount.toString(),
    transactionRef: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    branchLocation: currentUser?.branchLocation || 'aziz-nagar' as BranchLocation,
  });

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'upi', label: 'UPI', icon: '📱' },
    { value: 'bank-transfer', label: 'Bank Transfer', icon: '🏦' },
    { value: 'cheque', label: 'Cheque', icon: '📝' },
  ];

  const handleChange = (field: string, value: string) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const paidAmount = parseFloat(paymentData.paidAmount);

    if (!paidAmount || paidAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (paidAmount > bill.remainingAmount) {
      toast.error(`Payment amount cannot exceed remaining balance of ₹${bill.remainingAmount.toLocaleString('en-IN')}`);
      return;
    }

    const branchName = paymentData.branchLocation.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    payBill(bill.id, {
      billId: bill.id,
      branchLocation: paymentData.branchLocation,
      branchName: branchName,
      paidAmount: paidAmount,
      paymentMethod: paymentData.paymentMethod,
      transactionRef: paymentData.transactionRef,
      paymentDate: new Date(paymentData.paymentDate),
      notes: paymentData.notes,
      paidByUser: currentUser?.id || 'system',
      paidByUserName: currentUser?.name || 'System',
    });

    const newRemainingAmount = bill.remainingAmount - paidAmount;

    toast.success(
      <div>
        <p className="font-semibold">✅ Payment Recorded Successfully!</p>
        <p className="text-sm mt-1">Bill: {bill.billNumber}</p>
        <p className="text-sm">Branch: {branchName}</p>
        <p className="text-sm font-medium text-emerald-600 mt-1">
          Paid: ₹{paidAmount.toLocaleString('en-IN')}
        </p>
        {newRemainingAmount > 0 && (
          <p className="text-xs text-amber-600 mt-1">
            Remaining: ₹{newRemainingAmount.toLocaleString('en-IN')}
          </p>
        )}
      </div>,
      { duration: 5000 }
    );

    handleClose();
  };

  const handleClose = () => {
    setPaymentData({
      paymentMethod: 'cash',
      paidAmount: bill.remainingAmount.toString(),
      transactionRef: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
      branchLocation: currentUser?.branchLocation || 'aziz-nagar',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold">Pay Bill</p>
              <p className="text-sm font-normal text-[#6B6B6B]">
                {bill.billNumber}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Bill Summary */}
        <div className="bg-gradient-to-r from-[#FFF8F0] to-[#FFE4B5]/30 border-2 border-[#B8860B]/20 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="w-5 h-5 text-[#B8860B]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Bill Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Product:</span>
              <span className="font-medium text-[#1A1A1A]">{bill.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Dealer:</span>
              <span className="font-medium text-[#1A1A1A]">{bill.dealerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Quantity:</span>
              <span className="font-medium text-[#1A1A1A]">{bill.quantity} sqft</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#B8860B]/20">
              <span className="font-semibold text-[#1A1A1A]">Total Bill Amount:</span>
              <span className="font-bold text-lg text-[#B8860B]">
                ₹{bill.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700 font-medium">Already Paid:</span>
              <span className="font-semibold text-emerald-600">
                ₹{bill.totalPaid.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-[#B8860B]/20">
              <span className="text-red-700 font-medium">Remaining Balance:</span>
              <span className="font-bold text-xl text-red-600">
                ₹{bill.remainingAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Previous Payments */}
          {bill.branchPayments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#B8860B]/20">
              <p className="text-xs font-semibold text-[#1A1A1A] mb-2">Previous Payments:</p>
              <div className="space-y-1">
                {bill.branchPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between text-xs">
                    <span className="text-[#6B6B6B]">
                      <CheckCircle2 className="w-3 h-3 inline mr-1 text-emerald-600" />
                      {payment.branchName}
                    </span>
                    <span className="font-medium text-emerald-700">
                      ₹{payment.paidAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Which Branch is Paying */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <Label className="text-sm font-semibold text-blue-900">
                Which Branch is Making This Payment? *
              </Label>
            </div>
            <Select 
              value={paymentData.branchLocation} 
              onValueChange={(value) => handleChange('branchLocation', value)}
            >
              <SelectTrigger className="border-blue-300 bg-white focus:border-blue-500">
                <SelectValue placeholder="Select paying branch" />
              </SelectTrigger>
              <SelectContent>
                {branches
                  .filter(branch => bill.targetBranches.includes(branch.location as any))
                  .map((branch) => {
                    const branchName = branch.location.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                    
                    // Check if this branch has already paid
                    const hasPaid = bill.branchPayments.some(p => p.branchLocation === branch.location);
                    
                    return (
                      <SelectItem key={branch.id} value={branch.location}>
                        {branchName}
                        {hasPaid && ' ✓ (Already Paid)'}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            <div className="mt-3 p-3 rounded-lg bg-blue-100 border border-blue-300">
              <p className="text-xs text-blue-800">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                <strong>Multi-Branch Payment:</strong> Any branch can pay for this bill. Payments are tracked separately for each branch.
              </p>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <Label htmlFor="paidAmount" className="text-sm font-medium">
              Payment Amount (₹) *
            </Label>
            <div className="relative mt-1">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentData.paidAmount}
                onChange={(e) => handleChange('paidAmount', e.target.value)}
                className="pl-10 border-[#B8860B]/20 focus:border-[#B8860B]"
                required
              />
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <button
                type="button"
                onClick={() => handleChange('paidAmount', bill.remainingAmount.toString())}
                className="text-blue-600 hover:underline"
              >
                Pay Full Amount
              </button>
              <span className="text-[#6B6B6B]">
                Max: ₹{bill.remainingAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Payment Method *
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => handleChange('paymentMethod', method.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    paymentData.paymentMethod === method.value
                      ? 'border-[#B8860B] bg-[#B8860B]/10'
                      : 'border-[#B8860B]/20 hover:border-[#B8860B]/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{method.icon}</span>
                    <span className="text-sm font-medium">{method.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Reference */}
          {paymentData.paymentMethod !== 'cash' && (
            <div>
              <Label htmlFor="transactionRef" className="text-sm font-medium">
                Transaction Reference {paymentData.paymentMethod === 'cheque' ? '(Cheque No.)' : ''}
              </Label>
              <Input
                id="transactionRef"
                placeholder={
                  paymentData.paymentMethod === 'upi' ? 'UPI Transaction ID' :
                  paymentData.paymentMethod === 'bank-transfer' ? 'Reference Number' :
                  'Cheque Number'
                }
                value={paymentData.transactionRef}
                onChange={(e) => handleChange('transactionRef', e.target.value)}
                className="mt-1 border-[#B8860B]/20 focus:border-[#B8860B]"
              />
            </div>
          )}

          {/* Payment Date */}
          <div>
            <Label htmlFor="paymentDate" className="text-sm font-medium">
              Payment Date *
            </Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
              <Input
                id="paymentDate"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => handleChange('paymentDate', e.target.value)}
                className="pl-10 border-[#B8860B]/20 focus:border-[#B8860B]"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <div className="relative mt-1">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-[#6B6B6B]" />
              <textarea
                id="notes"
                placeholder="Additional payment notes..."
                value={paymentData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full pl-10 p-3 border-2 border-[#B8860B]/20 focus:border-[#B8860B] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20 min-h-[80px]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};