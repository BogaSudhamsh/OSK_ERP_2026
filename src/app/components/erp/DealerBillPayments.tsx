import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Wallet,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  CalendarDays,
  User,
  Package,
  Filter,
  CreditCard,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useApp } from '@/app/context/AppContext';

import type { BranchLocation, DealerPayment } from '@/app/types';
import { PaymentReceiptModal } from '@/app/components/inventory/PaymentReceiptModal';

const BRANCH_LABELS: Record<BranchLocation, string> = {
  'aziz-nagar': 'Aziz Nagar',
  vikarabad: 'Vikarabad',
  sangareddy: 'Sangareddy',
  central: 'Central',
};

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    barClass: 'bg-red-200',
    fillClass: 'bg-red-500',
  },
  partial: {
    label: 'Partial',
    icon: AlertCircle,
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    barClass: 'bg-orange-100',
    fillClass: 'bg-orange-500',
  },
  paid: {
    label: 'Paid',
    icon: CheckCircle,
    badgeClass: 'bg-green-50 text-green-700 border-green-200',
    barClass: 'bg-green-100',
    fillClass: 'bg-green-500',
  },
};


const BRANCH_BADGE_COLORS: Record<string, string> = {
  'aziz-nagar': 'bg-blue-100 text-blue-800 border-blue-200',
  'vikarabad':  'bg-purple-100 text-purple-800 border-purple-200',
  'sangareddy': 'bg-rose-100 text-rose-800 border-rose-200',
};

interface PaymentModalState {
  billId: string;
  billNumber: string;
  dealerName: string;
  productName: string;
  totalAmount: number;
  remainingAmount: number;
}

export const DealerBillPayments: React.FC = () => {
  const { currentUser, pendingBills, payBill, dealers, branches } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null);
  const [receiptData, setReceiptData] = useState<{ payment: DealerPayment, dealerName: string, dealerPhone: string } | null>(null);

  const handleViewReceipt = (bill: typeof pendingBills[0], payment: typeof pendingBills[0]['branchPayments'][0]) => {
    try {
      // Find dealer details
      const dealer = dealers.find(d => d.id === bill.dealerId);
      
      const dealerPayment: DealerPayment = {
        id: payment.id,
        dealerId: bill.dealerId,
        productId: bill.productId,
        productName: bill.productName,
        purchaseAmount: bill.totalAmount,
        paidAmount: payment.paidAmount,
        balanceAmount: bill.remainingAmount, 
        paymentMethod: payment.paymentMethod,
        transactionRef: payment.transactionRef,
        paymentDate: payment.paymentDate,
        notes: payment.notes,
        branches: bill.targetBranches || [],
        paidByBranch: payment.branchLocation,
        paidByUser: payment.paidByUser,
        paidByUserName: payment.paidByUserName,
        quantity: bill.quantity,
        pricePerUnit: bill.pricePerUnit,
        createdAt: payment.createdAt
      };
      
      setReceiptData({
        payment: dealerPayment,
        dealerName: bill.dealerName,
        dealerPhone: dealer?.phone || 'N/A'
      });
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast.error("Failed to generate receipt");
    }
  };

  // Payment form state
  const [payingBranch, setPayingBranch] = useState<BranchLocation>(
    (currentUser?.branchLocation as BranchLocation) || 'aziz-nagar'
  );
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank-transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const isSuperAdmin = currentUser?.role === 'super-admin';

  // Filter bills
  const filteredBills = pendingBills.filter(b =>
    activeTab === 'all' ? true : b.status === activeTab
  );

  // Summary stats
  const totalBills     = pendingBills.length;
  const totalPending   = pendingBills.filter(b => b.status === 'pending').length;
  const totalPartial   = pendingBills.filter(b => b.status === 'partial').length;
  const totalOutstanding = pendingBills.reduce((s, b) => s + b.remainingAmount, 0);
  const totalPaidThisMonth = pendingBills
    .flatMap(b => b.branchPayments)
    .filter(p => {
      const d = new Date(p.paymentDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + p.paidAmount, 0);

  // All payments (for super admin view)
  const allPayments = pendingBills
    .flatMap(b =>
      b.branchPayments.map(p => ({
        ...p,
        billNumber: b.billNumber,
        dealerName: b.dealerName,
        productName: b.productName,
      }))
    )
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  const openPayModal = (bill: typeof pendingBills[0]) => {
    if (bill.status === 'paid') return;
    setPaymentModal({
      billId: bill.id,
      billNumber: bill.billNumber,
      dealerName: bill.dealerName,
      productName: bill.productName,
      totalAmount: bill.totalAmount,
      remainingAmount: bill.remainingAmount,
    });
    setPayAmount(String(bill.remainingAmount));
    setPayingBranch((currentUser?.branchLocation as BranchLocation) || 'aziz-nagar');
    setPayRef('');
    setPayNotes('');
  };

  const handleSubmitPayment = () => {
    if (!paymentModal) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > paymentModal.remainingAmount) {
      toast.error(`Amount exceeds remaining ₹${paymentModal.remainingAmount.toLocaleString('en-IN')}`);
      return;
    }

    const branchName = branches.find(b => b.location === payingBranch)?.name?.replace('OSK Granite - ', '') || payingBranch;
    const newPayment = payBill(paymentModal.billId, {
      billId: paymentModal.billId,
      branchLocation: payingBranch,
      branchName,
      paidAmount: amt,
      paymentMethod: payMethod as any,
      transactionRef: payRef || undefined,
      paymentDate: new Date(),
      notes: payNotes || undefined,
      paidByUser: currentUser?.id || 'unknown',
      paidByUserName: currentUser?.name || 'Unknown',
    });

    toast.success(`₹${amt.toLocaleString('en-IN')} recorded from ${branchName}`);
    setPaymentModal(null);

    // Auto-open receipt
    // We need to find the bill to pass to handleViewReceipt
    // Note: pendingBills state might not be updated yet, so we use the current state
    const currentBill = pendingBills.find(b => b.id === paymentModal.billId);
    if (currentBill && newPayment) {
      // Create an updated bill object with the new remaining amount for the receipt
      const updatedBill = {
        ...currentBill,
        remainingAmount: currentBill.remainingAmount - amt
      };
      handleViewReceipt(updatedBill, newPayment);
    } else if (currentBill) {
        // Fallback if payBill returns void (stale context) or undefined
        // We can construct a temporary payment object for receipt display if needed
        // But better to just log or not open receipt to avoid crash
        console.warn("Could not auto-open receipt: payment object missing");
    }
  };

  const tabs: Array<{ key: typeof activeTab; label: string; count: number }> = [
    { key: 'all',     label: 'All Bills',  count: totalBills },
    { key: 'pending', label: 'Pending',    count: pendingBills.filter(b => b.status === 'pending').length },
    { key: 'partial', label: 'Partial',    count: pendingBills.filter(b => b.status === 'partial').length },
    { key: 'paid',    label: 'Paid',       count: pendingBills.filter(b => b.status === 'paid').length },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
          Dealer Bill Payments
        </h1>
        <p className="text-[#6B6B6B] mt-1">
          Dealer supplies → Central Inventory · Any branch can pay the bill · All payments visible to Super Admin
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bills',       value: totalBills,                               icon: Package,     color: 'from-[#B8860B] to-[#DAA520]' },
          { label: 'Pending Bills',     value: totalPending + ' bills',                  icon: Clock,       color: 'from-red-500 to-red-600' },
          { label: 'Partial Bills',     value: totalPartial + ' bills',                  icon: AlertCircle, color: 'from-orange-400 to-orange-500' },
          { label: 'Outstanding Total', value: '₹' + totalOutstanding.toLocaleString('en-IN'), icon: Wallet, color: 'from-blue-500 to-blue-600' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card className="border-[#B8860B]/20">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl font-bold text-[#2C2C2C]">{card.value}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow'
                : 'bg-white border border-[#B8860B]/20 text-[#6B6B6B] hover:bg-[#FFF8F0] hover:text-[#B8860B]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-white/30 text-white' : 'bg-[#FFF8F0] text-[#B8860B]'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        {filteredBills.length === 0 && (
          <div className="text-center py-12 text-[#6B6B6B]">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-[#C9A961]/40" />
            <p>No bills found for this filter.</p>
          </div>
        )}

        {filteredBills.map((bill, idx) => {
          const cfg = STATUS_CONFIG[bill.status];
          const StatusIcon = cfg.icon;
          const isExpanded = expandedBill === bill.id;
          const paidPct = bill.totalAmount > 0
            ? Math.round((bill.totalPaid / bill.totalAmount) * 100)
            : 0;

          return (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border ${bill.status === 'pending' ? 'border-red-200' : bill.status === 'partial' ? 'border-orange-200' : 'border-green-200'}`}>
                <CardContent className="p-5">
                  {/* Bill Header Row */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        bill.status === 'pending' ? 'bg-red-100' : bill.status === 'partial' ? 'bg-orange-100' : 'bg-green-100'
                      }`}>
                        <StatusIcon className={`w-5 h-5 ${
                          bill.status === 'pending' ? 'text-red-600' : bill.status === 'partial' ? 'text-orange-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#2C2C2C]">{bill.billNumber}</span>
                          <Badge variant="outline" className={`text-xs ${cfg.badgeClass}`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#6B6B6B] mt-0.5">
                          <span className="font-medium text-[#2C2C2C]">{bill.dealerName}</span>
                          <span className="mx-1">·</span>
                          {bill.productName}
                          <span className="mx-1">·</span>
                          {bill.quantity} units @ ₹{bill.pricePerUnit}
                        </p>
                        <p className="text-xs text-[#6B6B6B] mt-0.5 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          Created: {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Amounts */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-right">
                        <p className="text-xs text-[#6B6B6B]">Total Bill</p>
                        <p className="font-bold text-[#2C2C2C]">₹{bill.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#6B6B6B]">Paid</p>
                        <p className="font-bold text-green-700">₹{bill.totalPaid.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#6B6B6B]">Remaining</p>
                        <p className={`font-bold ${bill.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{bill.remainingAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      {bill.status !== 'paid' && (
                        <Button
                          size="sm"
                          onClick={() => openPayModal(bill)}
                          className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shrink-0"
                        >
                          <CreditCard className="w-4 h-4 mr-1.5" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-[#6B6B6B] mb-1">
                      <span>Payment progress</span>
                      <span className="font-medium">{paidPct}% paid</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${cfg.barClass}`}>
                      <div
                        className={`h-full rounded-full transition-all ${cfg.fillClass}`}
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Branch Payments Summary (compact) */}
                  {bill.branchPayments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {bill.branchPayments.map(payment => (
                        <div
                          key={payment.id}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
                            BRANCH_BADGE_COLORS[payment.branchLocation] || 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                          <span className="font-medium">{payment.branchName}</span>
                          <span>₹{payment.paidAmount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expand/Collapse */}
                  <button
                    onClick={() => setExpandedBill(isExpanded ? null : bill.id)}
                    className="flex items-center gap-1 text-xs text-[#B8860B] hover:text-[#DAA520] mt-3 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? 'Hide' : 'View'} payment history ({bill.branchPayments.length})
                  </button>

                  {/* Expanded Payment History */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 border-t border-[#B8860B]/10 pt-3 space-y-2">
                          {bill.branchPayments.length === 0 && (
                            <p className="text-xs text-[#6B6B6B]">No payments recorded yet.</p>
                          )}
                          {bill.branchPayments.map(payment => (
                            <div
                              key={payment.id}
                              onClick={() => handleViewReceipt(bill, payment)}
                              className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#FFF8F0]/70 rounded-lg cursor-pointer hover:bg-[#FFF8F0] border border-transparent hover:border-[#B8860B]/20 transition-all group"
                              title="Click to view receipt"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                  payment.branchLocation === 'aziz-nagar' ? 'bg-blue-500' :
                                  payment.branchLocation === 'vikarabad' ? 'bg-purple-500' : 'bg-rose-500'
                                }`}>
                                  {payment.branchName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-[#2C2C2C]">{payment.branchName}</p>
                                  <p className="text-xs text-[#6B6B6B]">
                                    {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                                    {payment.transactionRef && <span> · Ref: {payment.transactionRef}</span>}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs capitalize border-[#B8860B]/20 text-[#B8860B]">
                                  {payment.paymentMethod.replace('-', ' ')}
                                </Badge>
                                <p className="font-bold text-green-700 text-sm">
                                  ₹{payment.paidAmount.toLocaleString('en-IN')}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-[#6B6B6B]">
                                  <User className="w-3 h-3" />
                                  {payment.paidByUserName}
                                </div>
                                <div className="w-6 h-6 rounded-full bg-[#B8860B]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-1" title="View Receipt">
                                  <FileText className="w-3.5 h-3.5 text-[#B8860B]" />
                                </div>
                              </div>
                              {payment.notes && (
                                <p className="w-full text-xs text-[#6B6B6B] pl-9">{payment.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Super Admin: All Payments Overview */}
      {isSuperAdmin && allPayments.length > 0 && (
        <Card className="border-[#B8860B]/20">
          <CardHeader className="bg-gradient-to-br from-[#B8860B] to-[#DAA520] text-white">
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              All Branch Payments — Super Admin View
            </CardTitle>
            <p className="text-sm text-white/80 mt-1">
              Every payment made by every branch across all dealer bills
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {/* Per-branch totals */}
            <div className="grid grid-cols-3 divide-x divide-[#B8860B]/20 border-b border-[#B8860B]/20">
              {(['aziz-nagar', 'vikarabad', 'sangareddy'] as BranchLocation[]).map(loc => {
                const total = allPayments
                  .filter(p => p.branchLocation === loc)
                  .reduce((s, p) => s + p.paidAmount, 0);
                return (
                  <div key={loc} className="p-4 text-center">
                    <p className="text-sm font-medium text-[#6B6B6B]">{BRANCH_LABELS[loc]}</p>
                    <p className="text-xl font-bold text-[#B8860B] mt-1">
                      ₹{total.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-[#6B6B6B]">total paid</p>
                  </div>
                );
              })}
            </div>

            {/* Payment rows */}
            <div className="divide-y divide-[#B8860B]/10">
              {allPayments.map(p => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 hover:bg-[#FFF8F0]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                      p.branchLocation === 'aziz-nagar' ? 'bg-blue-500' :
                      p.branchLocation === 'vikarabad'  ? 'bg-purple-500' : 'bg-rose-500'
                    }`}>
                      {p.branchName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#2C2C2C]">
                        {p.branchName}
                        <span className="text-[#6B6B6B] font-normal ml-1.5">paid for</span>
                        <span className="ml-1.5">{p.billNumber}</span>
                      </p>
                      <p className="text-xs text-[#6B6B6B]">
                        {p.dealerName} · {p.productName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-green-700">₹{p.paidAmount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-[#6B6B6B]">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize border-[#B8860B]/20 text-[#B8860B]">
                      {p.paymentMethod.replace('-', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-[#6B6B6B]">
                      <User className="w-3 h-3" />
                      {p.paidByUserName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal */}
      <Dialog open={!!paymentModal} onOpenChange={() => setPaymentModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#B8860B]">
              <CreditCard className="w-5 h-5" />
              Record Payment
            </DialogTitle>
          </DialogHeader>

          {paymentModal && (
            <div className="space-y-4">
              {/* Bill Summary */}
              <div className="p-3 bg-[#FFF8F0] border border-[#B8860B]/20 rounded-lg text-sm">
                <p className="font-semibold text-[#2C2C2C]">{paymentModal.billNumber}</p>
                <p className="text-[#6B6B6B]">{paymentModal.dealerName} · {paymentModal.productName}</p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <span className="text-[#6B6B6B]">Total: </span>
                    <span className="font-bold text-[#2C2C2C]">₹{paymentModal.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B]">Remaining: </span>
                    <span className="font-bold text-red-600">₹{paymentModal.remainingAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Branch selector — All branches can pay */}
              <div>
                <Label>Paying Branch <span className="text-red-500">*</span></Label>
                <Select
                  value={payingBranch}
                  onValueChange={v => setPayingBranch(v as BranchLocation)}
                  disabled={!isSuperAdmin && !!currentUser?.branchLocation}
                >
                  <SelectTrigger className="border-[#B8860B]/30 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.location}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-[#B8860B]" />
                          {b.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isSuperAdmin && (
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    💡 Any branch can pay this dealer bill
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <Label>Amount (₹) <span className="text-red-500">*</span></Label>
                <div className="relative mt-1">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                  <Input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="pl-9 border-[#B8860B]/30"
                    max={paymentModal.remainingAmount}
                  />
                </div>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Max: ₹{paymentModal.remainingAmount.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <Label>Payment Method</Label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger className="border-[#B8860B]/30 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reference */}
              <div>
                <Label>Transaction Reference (Optional)</Label>
                <Input
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  placeholder="UPI/TXN/Cheque number"
                  className="border-[#B8860B]/30 mt-1"
                />
              </div>

              {/* Notes */}
              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="Add a note about this payment"
                  className="border-[#B8860B]/30 mt-1"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setPaymentModal(null)}
                  className="flex-1 border-[#B8860B]/30 text-[#B8860B]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitPayment}
                  className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Receipt Modal */}
      {receiptData && (
        <PaymentReceiptModal
          open={!!receiptData}
          onClose={() => setReceiptData(null)}
          payment={receiptData.payment}
          dealerName={receiptData.dealerName}
          dealerPhone={receiptData.dealerPhone}
        />
      )}
    </div>
  );
};
