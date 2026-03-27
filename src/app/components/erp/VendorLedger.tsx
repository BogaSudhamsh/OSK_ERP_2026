import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar,
  Search,
  ArrowLeft,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';
import type { Dealer, PaymentMode } from '@/app/types';

interface VendorLedgerProps {
  onBack?: () => void;
}

interface VendorTransaction {
  id: string;
  date: Date;
  type: 'purchase' | 'payment' | 'return' | 'debit-note' | 'credit-note';
  description: string;
  poNumber?: string;
  invoiceNumber?: string;
  debit: number;  // Purchases (increases outstanding)
  credit: number; // Payments (reduces outstanding)
  balance: number;
  paymentMode?: PaymentMode;
  remarks?: string;
}

export const VendorLedger: React.FC<VendorLedgerProps> = ({ onBack }) => {
  const { dealers, addDealerPayment } = useApp();
  const [selectedVendor, setSelectedVendor] = useState<Dealer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('bank');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  const getVendorTransactions = (vendorId: string): VendorTransaction[] => {
    const dealer = dealers.find((d) => d.id === vendorId);
    if (!dealer || !dealer.payments?.length) return [];

    let runningBalance = dealer.outstandingPayment || 0;
    const sortedPayments = [...dealer.payments].sort(
      (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime(),
    );

    return sortedPayments.map((payment) => {
      const paymentMode: PaymentMode = payment.paymentMethod === 'bank-transfer'
        ? 'bank'
        : payment.paymentMethod;

      const transaction: VendorTransaction = {
        id: payment.id,
        date: payment.paymentDate,
        type: 'payment',
        description: `Payment Made - ${payment.paymentMethod.toUpperCase()}`,
        debit: 0,
        credit: payment.paidAmount,
        balance: Math.max(0, runningBalance),
        paymentMode,
        remarks: payment.transactionRef || payment.notes,
      };
      runningBalance += payment.purchaseAmount - payment.paidAmount;
      return transaction;
    });
  };

  const filteredVendors = dealers.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.gstNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMakePayment = () => {
    if (!selectedVendor || !paymentAmount) return;
    
    addDealerPayment({
      dealerId: selectedVendor.id,
      productId: 'payment',
      productName: 'Ledger Payment',
      totalAmount: 0,
      paidAmount: parseFloat(paymentAmount),
      balanceAmount: Math.max(0, selectedVendor.outstandingPayment - parseFloat(paymentAmount)),
      paymentMethod: paymentMode,
      transactionRef: paymentRemarks,
      paymentDate: new Date(),
    });

    setShowPaymentForm(false);
    setPaymentAmount('');
    setPaymentRemarks('');
  };

  const getTransactionIcon = (type: VendorTransaction['type']) => {
    switch (type) {
      case 'purchase':
        return <Package className="w-4 h-4" />;
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      case 'return':
        return <TrendingDown className="w-4 h-4" />;
      case 'debit-note':
        return <AlertCircle className="w-4 h-4" />;
      case 'credit-note':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: VendorTransaction['type']) => {
    switch (type) {
      case 'purchase':
        return 'text-blue-600 bg-blue-50';
      case 'payment':
        return 'text-green-600 bg-green-50';
      case 'return':
        return 'text-orange-600 bg-orange-50';
      case 'debit-note':
        return 'text-red-600 bg-red-50';
      case 'credit-note':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (selectedVendor) {
    const transactions = getVendorTransactions(selectedVendor.id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedVendor(null)}
                className="border-[#B8860B]/30 hover:bg-[#FFF8F0]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Vendors
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
                  {selectedVendor.name}
                </h1>
                <p className="text-[#6B6B6B] mt-1">Vendor Ledger & Transaction History</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-[#B8860B]/30 hover:bg-[#FFF8F0]"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button
                onClick={() => setShowPaymentForm(true)}
                className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Make Payment
              </Button>
            </div>
          </div>

          {/* Vendor Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Purchases */}
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Total Purchases (Billed)</p>
                    <p className="text-2xl font-bold text-[#2C2C2C]">
                      ₹{selectedVendor.totalPurchases.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Paid */}
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{selectedVendor.totalPaid.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Outstanding */}
            <Card className="border-orange-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Outstanding Amount</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{selectedVendor.outstandingPayment.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Details */}
          <Card className="border-[#B8860B]/20">
            <CardHeader>
              <CardTitle className="text-xl">Vendor Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F0] rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#B8860B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Contact Person</p>
                    <p className="font-semibold text-[#2C2C2C]">{selectedVendor.contactPerson}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F0] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#B8860B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Phone</p>
                    <p className="font-semibold text-[#2C2C2C]">{selectedVendor.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F0] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#B8860B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Email</p>
                    <p className="font-semibold text-[#2C2C2C]">{selectedVendor.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F0] rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#B8860B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Address</p>
                    <p className="font-semibold text-[#2C2C2C]">{selectedVendor.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F0] rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#B8860B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">GST Number</p>
                    <p className="font-semibold text-[#2C2C2C] font-mono">{selectedVendor.gstNumber}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FFF8F0] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#B8860B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Payment Terms</p>
                    <p className="font-semibold text-[#2C2C2C]">{selectedVendor.paymentTerms}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <AnimatePresence>
            {showPaymentForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-green-300 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-xl text-green-900">Make Payment</CardTitle>
                    <CardDescription>Record a new payment to this vendor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="paymentAmount">Payment Amount</Label>
                        <Input
                          id="paymentAmount"
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="border-green-300 bg-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="paymentMode">Payment Mode</Label>
                        <Select value={paymentMode} onValueChange={(value: PaymentMode) => setPaymentMode(value)}>
                          <SelectTrigger className="border-green-300 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="paymentRemarks">Reference/Remarks</Label>
                        <Input
                          id="paymentRemarks"
                          value={paymentRemarks}
                          onChange={(e) => setPaymentRemarks(e.target.value)}
                          placeholder="e.g., UTR/Cheque No."
                          className="border-green-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={handleMakePayment}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Record Payment
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowPaymentForm(false)}
                        className="border-green-300"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transaction History */}
          <Card className="border-[#B8860B]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Transaction History</CardTitle>
                  <CardDescription>Complete ledger of all transactions</CardDescription>
                </div>
                <Badge className="bg-[#B8860B] text-white">{transactions.length} Transactions</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-[#B8860B]/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B6B6B]">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B6B6B]">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B6B6B]">Description</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B6B6B]">Reference</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B6B6B]">Debit (₹)</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B6B6B]">Credit (₹)</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B6B6B]">Balance (₹)</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-[#6B6B6B]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn, index) => (
                      <motion.tr
                        key={txn.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-[#B8860B]/10 hover:bg-[#FFF8F0]/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#6B6B6B]" />
                            <span className="text-sm text-[#2C2C2C]">
                              {txn.date.toLocaleDateString('en-IN', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`${getTransactionColor(txn.type)} border-0`}>
                            <span className="flex items-center gap-1">
                              {getTransactionIcon(txn.type)}
                              {txn.type.replace('-', ' ').toUpperCase()}
                            </span>
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-medium text-[#2C2C2C]">{txn.description}</p>
                          {txn.remarks && (
                            <p className="text-xs text-[#6B6B6B] mt-1">{txn.remarks}</p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            {txn.poNumber && (
                              <p className="text-[#2C2C2C] font-mono">{txn.poNumber}</p>
                            )}
                            {txn.invoiceNumber && (
                              <p className="text-[#6B6B6B] text-xs font-mono">{txn.invoiceNumber}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {txn.debit > 0 ? (
                            <span className="text-red-600 font-semibold">
                              {txn.debit.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-[#6B6B6B]">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {txn.credit > 0 ? (
                            <span className="text-green-600 font-semibold">
                              {txn.credit.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-[#6B6B6B]">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-bold text-[#2C2C2C]">
                            {txn.balance.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-[#FFF8F0]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Vendor List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
              Vendor Ledger
            </h1>
            <p className="text-[#6B6B6B] mt-2">Manage vendor accounts and track payments</p>
          </div>
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="border-[#B8860B]/30 hover:bg-[#FFF8F0]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="border-[#B8860B]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-[#6B6B6B]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors by name, contact person, or GST number..."
                className="border-0 focus-visible:ring-0 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-[#B8860B]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Total Vendors</p>
                  <p className="text-3xl font-bold text-[#2C2C2C]">{dealers.length}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#B8860B]/10 to-[#DAA520]/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-[#B8860B]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Total Outstanding</p>
                  <p className="text-3xl font-bold text-red-600">
                    ₹{dealers.reduce((sum, v) => sum + v.outstandingPayment, 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Total Paid This Year</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{dealers.reduce((sum, v) => sum + v.totalPaid, 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendor List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredVendors.map((vendor, index) => {
            const paymentStatus = vendor.outstandingPayment === 0 
              ? 'paid' 
              : vendor.outstandingPayment > 100000 
              ? 'high' 
              : 'normal';

            return (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`border-[#B8860B]/20 hover:border-[#B8860B] transition-all cursor-pointer hover:shadow-lg ${
                    paymentStatus === 'high' ? 'border-l-4 border-l-red-500' : ''
                  }`}
                  onClick={() => setSelectedVendor(vendor)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Vendor Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#B8860B] to-[#DAA520] rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#2C2C2C]">{vendor.name}</h3>
                            <p className="text-sm text-[#6B6B6B]">{vendor.contactPerson} • {vendor.phone}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-[#6B6B6B] mb-1">Total Purchases</p>
                            <p className="text-sm font-semibold text-[#2C2C2C]">
                              ₹{vendor.totalPurchases.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#6B6B6B] mb-1">Total Paid</p>
                            <p className="text-sm font-semibold text-green-600">
                              ₹{vendor.totalPaid.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#6B6B6B] mb-1">Outstanding</p>
                            <p className={`text-sm font-semibold ${vendor.outstandingPayment > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              ₹{vendor.outstandingPayment.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant="outline"
                        className="border-[#B8860B]/30 hover:bg-[#FFF8F0] ml-4"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Ledger
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredVendors.length === 0 && (
          <Card className="border-[#B8860B]/20">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-[#6B6B6B] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">No vendors found</h3>
              <p className="text-[#6B6B6B]">Try adjusting your search query</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};