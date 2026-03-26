import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building2,
  Package,
  IndianRupee,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PendingBill } from '@/app/types';
import { PayBillModal } from './PayBillModal';

interface BillsDashboardProps {
  onBack?: () => void;
}

export const BillsDashboard: React.FC<BillsDashboardProps> = ({ onBack }) => {
  const { pendingBills, currentUser, getBillsForBranch } = useApp();
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<PendingBill | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');

  // Get bills based on user role
  const userBills = currentUser?.role === 'branch-admin' && currentUser?.branchLocation
    ? getBillsForBranch(currentUser.branchLocation)
    : pendingBills;

  // Filter bills by status
  const filteredBills = filterStatus === 'all' 
    ? userBills 
    : userBills.filter(bill => bill.status === filterStatus);

  // Calculate statistics
  const stats = {
    totalBills: userBills.length,
    pendingBills: userBills.filter(b => b.status === 'pending').length,
    partialBills: userBills.filter(b => b.status === 'partial').length,
    paidBills: userBills.filter(b => b.status === 'paid').length,
    totalAmount: userBills.reduce((sum, b) => sum + b.totalAmount, 0),
    totalPaid: userBills.reduce((sum, b) => sum + b.totalPaid, 0),
    totalRemaining: userBills.reduce((sum, b) => sum + b.remainingAmount, 0),
  };

  const handlePayBill = (bill: PendingBill) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
  };

  const toggleBillExpansion = (billId: string) => {
    setExpandedBillId(expandedBillId === billId ? null : billId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'partial':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'pending':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'partial':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center shadow-lg">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            Bills Dashboard
          </h1>
          <p className="text-[#6B6B6B] mt-2">
            {currentUser?.role === 'branch-admin' 
              ? `Manage bills for ${currentUser?.branchLocation?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} branch`
              : 'Manage all dealer bills across branches'
            }
          </p>
        </div>
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="border-[#B8860B]/20 hover:border-[#B8860B]"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Bills</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalBills}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Pending</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{stats.pendingBills}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 font-medium">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  ₹{stats.totalPaid.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 font-medium">Remaining</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  ₹{stats.totalRemaining.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'partial', 'paid'] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
            className={filterStatus === status 
              ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white' 
              : 'border-[#B8860B]/20 hover:border-[#B8860B]'
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <Badge className="ml-2 bg-white/20">
              {status === 'all' ? stats.totalBills : 
               status === 'pending' ? stats.pendingBills :
               status === 'partial' ? stats.partialBills :
               stats.paidBills}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Bills List */}
      <div className="space-y-4">
        {filteredBills.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-[#B8860B]/20">
            <Receipt className="w-16 h-16 text-[#B8860B]/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">No Bills Found</h3>
            <p className="text-sm text-[#6B6B6B]">
              {filterStatus === 'all' 
                ? 'No bills have been created yet. Add products from dealers to create bills.'
                : `No ${filterStatus} bills found.`
              }
            </p>
          </Card>
        ) : (
          filteredBills.map((bill, index) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden border-2 hover:shadow-lg transition-all">
                {/* Bill Header */}
                <div className="p-4 bg-gradient-to-r from-[#FFF8F0] to-[#FFE4B5]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center shadow-md">
                        <Receipt className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-[#1A1A1A]">{bill.billNumber}</h3>
                          <Badge className={`${getStatusColor(bill.status)} border`}>
                            {getStatusIcon(bill.status)}
                            <span className="ml-1">{bill.status.toUpperCase()}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-[#6B6B6B] mt-1">
                          <strong>{bill.productName}</strong> from {bill.dealerName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#B8860B]">
                        ₹{bill.totalAmount.toLocaleString('en-IN')}
                      </p>
                      {bill.remainingAmount > 0 && (
                        <p className="text-sm text-red-600 font-medium">
                          ₹{bill.remainingAmount.toLocaleString('en-IN')} due
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bill Details */}
                <div className="p-4 border-t border-[#B8860B]/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-[#6B6B6B] mb-1">Quantity</p>
                      <p className="text-sm font-semibold text-[#1A1A1A]">{bill.quantity} sqft</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B6B6B] mb-1">Price/Unit</p>
                      <p className="text-sm font-semibold text-[#1A1A1A]">₹{bill.pricePerUnit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B6B6B] mb-1">Total Paid</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        ₹{bill.totalPaid.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B6B6B] mb-1">Created Date</p>
                      <p className="text-sm font-semibold text-[#1A1A1A]">
                        {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Target Branches */}
                  <div className="mb-4">
                    <p className="text-xs text-[#6B6B6B] mb-2">Dispatched To:</p>
                    <div className="flex flex-wrap gap-2">
                      {bill.targetBranches.map((branch) => (
                        <Badge key={branch} variant="outline" className="border-[#B8860B] text-[#B8860B]">
                          <Building2 className="w-3 h-3 mr-1" />
                          {branch.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {bill.status !== 'paid' && (
                      <Button
                        onClick={() => handlePayBill(bill)}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Bill
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => toggleBillExpansion(bill.id)}
                      className="border-[#B8860B]/20 hover:border-[#B8860B]"
                    >
                      {expandedBillId === bill.id ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          View Payment History
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Payment History (Expandable) */}
                <AnimatePresence>
                  {expandedBillId === bill.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-[#FFF8F0]/50 border-t border-[#B8860B]/10">
                        <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Payment History</h4>
                        
                        {bill.branchPayments.length === 0 ? (
                          <p className="text-sm text-[#6B6B6B] italic">No payments recorded yet</p>
                        ) : (
                          <div className="space-y-3">
                            {bill.branchPayments.map((payment) => (
                              <div
                                key={payment.id}
                                className="bg-white rounded-lg p-3 border border-[#B8860B]/10"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="font-semibold text-[#1A1A1A]">
                                      {payment.branchName}
                                    </span>
                                  </div>
                                  <span className="text-lg font-bold text-emerald-600">
                                    ₹{payment.paidAmount.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-[#6B6B6B]">
                                  <div>
                                    <span className="font-medium">Method:</span> {payment.paymentMethod.toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-medium">Date:</span> {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                                  </div>
                                  <div>
                                    <span className="font-medium">Paid By:</span> {payment.paidByUserName}
                                  </div>
                                  {payment.transactionRef && (
                                    <div>
                                      <span className="font-medium">Ref:</span> {payment.transactionRef}
                                    </div>
                                  )}
                                </div>
                                {payment.notes && (
                                  <p className="text-xs text-[#6B6B6B] mt-2 italic">
                                    Note: {payment.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Payment Modal */}
      {selectedBill && (
        <PayBillModal
          bill={selectedBill}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedBill(null);
          }}
        />
      )}
    </div>
  );
};