import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  ArrowLeftRight,
  Building2,
  Package,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Send,
  ChevronRight,
  Eye,
  Shield,
  Wrench,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';
import { toast } from 'sonner';
import type { BranchTransfer } from '@/app/types';

interface BranchStockTransferProps {
  userRole: 'super-admin' | 'branch-admin' | 'stock-manager';
  currentBranchId?: string;
  currentBranchLocation?: string;
}

const BRANCH_THEME: Record<string, { label: string; bg: string; text: string; border: string }> = {
  'aziz-nagar':  { label: 'Aziz Nagar',  bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
  'vikarabad':   { label: 'Vikarabad',    bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200' },
  'sangareddy':  { label: 'Sangareddy',   bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

const STATUS_CONFIG: Record<BranchTransfer['status'], { icon: React.ElementType; label: string; bg: string; text: string }> = {
  requested:    { icon: Clock,       label: 'Requested',  bg: 'bg-amber-50',   text: 'text-amber-700' },
  approved:     { icon: CheckCircle, label: 'Approved',   bg: 'bg-blue-50',    text: 'text-blue-700' },
  'in-transit': { icon: Truck,       label: 'In Transit', bg: 'bg-orange-50',  text: 'text-orange-700' },
  received:     { icon: CheckCircle, label: 'Received',   bg: 'bg-emerald-50', text: 'text-emerald-700' },
  rejected:     { icon: XCircle,     label: 'Rejected',   bg: 'bg-gray-50',    text: 'text-gray-500' },
};

// ── Role permission config ─────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; description: string; badge: string; badgeBg: string; badgeText: string }> = {
  'super-admin':   { label: 'Super Admin',   icon: Shield,  description: 'Full access — view, create, approve, ship, receive & reject all transfers across branches',                badge: 'Full Control', badgeBg: 'bg-[#B8860B]/10', badgeText: 'text-[#B8860B]' },
  'stock-manager': { label: 'Stock Manager',  icon: Wrench,  description: 'Operational access — create transfer requests, approve, ship, receive & reject for your branch',            badge: 'Operational',  badgeBg: 'bg-blue-50',      badgeText: 'text-blue-700' },
  'branch-admin':  { label: 'Branch Admin',   icon: Eye,     description: 'View-only — monitor transfer status and history for your branch. Stock Managers handle the operations.', badge: 'View Only',    badgeBg: 'bg-amber-50',     badgeText: 'text-amber-700' },
};

export const BranchStockTransfer: React.FC<BranchStockTransferProps> = ({
  userRole,
  currentBranchId,
  currentBranchLocation,
}) => {
  const {
    branchTransfers,
    createBranchTransfer,
    updateBranchTransfer,
    branchStock,
    branches,
    currentUser,
  } = useApp();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ── New Transfer Form State ────────────────────────────────────────────────
  // For stock-manager: fromBranchId is fixed to their branch
  // For super-admin: they can select any branch as source
  const [fromBranchId, setFromBranchId] = useState(
    userRole === 'stock-manager' ? currentBranchId || '' : ''
  );
  const [toBranchId, setToBranchId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');

  // ── Role flags ─────────────────────────────────────────────────────────────
  const isSuperAdmin   = userRole === 'super-admin';
  const isStockManager = userRole === 'stock-manager';
  const isBranchAdmin  = userRole === 'branch-admin';

  // Branch Admin = view-only, cannot create or act on transfers
  const canCreateTransfer = isSuperAdmin || isStockManager;

  const roleInfo = ROLE_CONFIG[userRole] || ROLE_CONFIG['branch-admin'];
  const RoleIcon = roleInfo.icon;

  // Derive branch choices based on role
  // For stock-manager: from branch is always their own branch (fixed, not selectable)
  // For super-admin: they can select any branch as source
  const fromBranches = isSuperAdmin ? branches : branches.filter(b => b.id === currentBranchId);
  
  // To branches: all branches except the selected from branch
  const toBranches = useMemo(() => {
    return branches.filter(b => b.id !== fromBranchId);
  }, [fromBranchId, branches]);

  // Products available at selected source branch
  const sourceProducts = useMemo(() => {
    if (!fromBranchId) return [];
    return branchStock.filter(bs => bs.branchId === fromBranchId && bs.freshQuantity > 0);
  }, [fromBranchId, branchStock]);

  const selectedSourceProduct = sourceProducts.find(p => p.productId === selectedProductId);

  // Target branch existing stock for visualization
  const targetBranchStock = useMemo(() => {
    if (!toBranchId || !selectedProductId) return null;
    return branchStock.find(bs => bs.branchId === toBranchId && bs.productId === selectedProductId);
  }, [toBranchId, selectedProductId, branchStock]);

  // Filtered transfers
  const filteredTransfers = useMemo(() => {
    let list = [...branchTransfers];
    if (!isSuperAdmin) {
      list = list.filter(
        t => t.fromBranchId === currentBranchId || t.toBranchId === currentBranchId
      );
    }
    if (filterStatus !== 'all') {
      list = list.filter(t => t.status === filterStatus);
    }
    return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [branchTransfers, isSuperAdmin, currentBranchId, filterStatus]);

  // Summary counts
  const summaryStats = useMemo(() => {
    const relevant = isSuperAdmin
      ? branchTransfers
      : branchTransfers.filter(t => t.fromBranchId === currentBranchId || t.toBranchId === currentBranchId);
    return {
      total: relevant.length,
      requested: relevant.filter(t => t.status === 'requested').length,
      inTransit: relevant.filter(t => t.status === 'in-transit' || t.status === 'approved').length,
      received: relevant.filter(t => t.status === 'received').length,
      totalUnitsTransferred: relevant.filter(t => t.status === 'received').reduce((s, t) => s + t.quantity, 0),
    };
  }, [branchTransfers, isSuperAdmin, currentBranchId]);

  // ── Reset form ─────────────────────────────────────────────────────────────
  const resetForm = () => {
    // For stock-manager, fromBranchId should remain their branch (fixed)
    // For super-admin, reset everything
    if (!isStockManager) {
      setFromBranchId('');
    }
    setToBranchId('');
    setSelectedProductId('');
    setQuantity('');
    setRemarks('');
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateTransfer = () => {
    if (!fromBranchId || !toBranchId || !selectedProductId || !quantity) {
      toast.error('Please fill all required fields');
      return;
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (selectedSourceProduct && qty > selectedSourceProduct.freshQuantity) {
      toast.error(`Insufficient stock. Available: ${selectedSourceProduct.freshQuantity}`);
      return;
    }
    if (fromBranchId === toBranchId) {
      toast.error('Source and target branches must be different');
      return;
    }

    const fromBranch = branches.find(b => b.id === fromBranchId);
    const toBranch = branches.find(b => b.id === toBranchId);

    createBranchTransfer({
      fromBranchId,
      fromBranchLocation: fromBranch?.location || '',
      toBranchId,
      toBranchLocation: toBranch?.location || '',
      productId: selectedProductId,
      productName: selectedSourceProduct?.productName || '',
      quantity: qty,
      remarks: remarks || `Transfer request from ${fromBranch?.name} to ${toBranch?.name}`,
    });

    toast.success('Transfer request created successfully!');
    resetForm();
    setIsCreateOpen(false);
  };

  const handleApprove = (transfer: BranchTransfer) => {
    updateBranchTransfer(transfer.id, {
      status: 'approved',
      approvedBy: currentUser?.id,
      approvedAt: new Date(),
    });
    toast.success(`Transfer ${transfer.transferNumber} approved`);
  };

  const handleMarkInTransit = (transfer: BranchTransfer) => {
    updateBranchTransfer(transfer.id, { status: 'in-transit' });
    toast.success(`Transfer ${transfer.transferNumber} marked as in-transit`);
  };

  const handleReceive = (transfer: BranchTransfer) => {
    updateBranchTransfer(transfer.id, {
      status: 'received',
      receivedBy: currentUser?.id,
      receivedAt: new Date(),
    });
    toast.success(`Transfer ${transfer.transferNumber} received! Stock updated.`);
  };

  const handleReject = (transfer: BranchTransfer) => {
    updateBranchTransfer(transfer.id, { status: 'rejected' });
    toast.success(`Transfer ${transfer.transferNumber} rejected`);
  };

  const getUserName = (userId?: string) => {
    if (!userId) return '\u2014';
    return currentUser?.id === userId ? currentUser.name : userId;
  };

  const getBranchLabel = (location: string) => BRANCH_THEME[location]?.label || location;

  // ── Role-based action permissions ──────────────────────────────────────────
  // Branch Admin: NO actions (view-only)
  // Stock Manager: Can act on transfers involving their branch
  // Super Admin: Can act on any transfer
  const canApprove = (t: BranchTransfer) => {
    if (isBranchAdmin) return false;
    return t.status === 'requested' && (isSuperAdmin || t.fromBranchId === currentBranchId);
  };

  const canMarkInTransit = (t: BranchTransfer) => {
    if (isBranchAdmin) return false;
    return t.status === 'approved' && (isSuperAdmin || t.fromBranchId === currentBranchId);
  };

  const canReceive = (t: BranchTransfer) => {
    if (isBranchAdmin) return false;
    return t.status === 'in-transit' && (isSuperAdmin || t.toBranchId === currentBranchId);
  };

  const canReject = (t: BranchTransfer) => {
    if (isBranchAdmin) return false;
    return t.status === 'requested' && (isSuperAdmin || t.fromBranchId === currentBranchId);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent flex items-center gap-3">
            <ArrowLeftRight className="w-8 h-8 text-[#B8860B]" />
            Inter-Branch Stock Transfer
          </h1>
          <p className="text-[#6B6B6B] mt-1">
            {isBranchAdmin
              ? 'Monitor stock transfer status and history for your branch'
              : 'Request, approve, and track stock transfers between branches'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${roleInfo.badgeBg} border-current/10`}>
            <RoleIcon className={`w-4 h-4 ${roleInfo.badgeText}`} />
            <span className={`text-xs font-semibold ${roleInfo.badgeText}`}>{roleInfo.badge}</span>
          </div>

          {/* New Transfer Button — only for super-admin & stock-manager */}
          {canCreateTransfer && (
            <Dialog open={isCreateOpen} onOpenChange={v => { setIsCreateOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  New Transfer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white p-0 border-none">
                <DialogTitle className="sr-only">New Transfer Request</DialogTitle>
                {/* ── Create Form ──────────────────────────────────── */}
                <Card className="border-[#B8860B]/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
                    <CardTitle className="flex items-center gap-2 text-[#B8860B]">
                      <Send className="w-5 h-5" />
                      Request Stock Transfer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {/* From / To branches */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Branch (Source){isStockManager && <span className="text-[#B8860B] text-xs ml-2">(Your Branch)</span>}</Label>
                        <Select
                          value={fromBranchId}
                          onValueChange={v => { setFromBranchId(v); setSelectedProductId(''); }}
                          disabled={isStockManager}
                        >
                          <SelectTrigger className={`${isStockManager ? 'bg-[#FFF8F0] cursor-not-allowed' : ''} border-[#B8860B]/30 h-12`}>
                            <SelectValue placeholder="Select source..." />
                          </SelectTrigger>
                          <SelectContent>
                            {fromBranches.map(b => (
                              <SelectItem key={b.id} value={b.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-[#B8860B]" />
                                  {b.name.replace('OSK Granite - ', '')}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isStockManager && (
                          <p className="text-xs text-[#6B6B6B] italic">
                            As a Stock Manager, you can only transfer from your assigned branch
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>To Branch (Destination)</Label>
                        <Select value={toBranchId} onValueChange={setToBranchId}>
                          <SelectTrigger className="border-[#B8860B]/30 h-12">
                            <SelectValue placeholder="Select destination..." />
                          </SelectTrigger>
                          <SelectContent>
                            {toBranches.map(b => (
                              <SelectItem key={b.id} value={b.id} disabled={b.id === fromBranchId}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-[#B8860B]" />
                                  {b.name.replace('OSK Granite - ', '')}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Product */}
                    <div className="space-y-2">
                      <Label>Product</Label>
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger className="border-[#B8860B]/30 h-12">
                          <SelectValue placeholder={fromBranchId ? 'Select product...' : 'Select source branch first'} />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceProducts.map(sp => (
                            <SelectItem key={sp.productId} value={sp.productId}>
                              <div className="flex items-center justify-between w-full gap-4">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-[#B8860B]" />
                                  <span>{sp.productName}</span>
                                </div>
                                <Badge variant="outline" className="border-[#B8860B]/30 text-[#B8860B]">
                                  {sp.freshQuantity} units
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                          {fromBranchId && sourceProducts.length === 0 && (
                            <div className="px-4 py-3 text-sm text-[#6B6B6B]">No products with stock at this branch</div>
                          )}
                        </SelectContent>
                      </Select>
                      {selectedSourceProduct && (
                        <div className="flex items-center gap-2 text-xs text-[#6B6B6B] bg-[#FFF8F0] p-2 rounded border border-[#B8860B]/10">
                          <Package className="w-3 h-3 text-[#B8860B]" />
                          Available: <span className="font-bold text-[#2C2C2C]">{selectedSourceProduct.freshQuantity}</span> units
                          {selectedSourceProduct.brokenQuantity > 0 && (
                            <span className="text-orange-600 ml-2">({selectedSourceProduct.brokenQuantity} broken)</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label>Quantity to Transfer</Label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        placeholder="0"
                        className="border-[#B8860B]/30 h-12 text-lg"
                        min="1"
                        max={selectedSourceProduct?.freshQuantity}
                      />
                    </div>

                    {/* Transfer Preview */}
                    <AnimatePresence>
                      {fromBranchId && toBranchId && selectedProductId && quantity && parseInt(quantity) > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 bg-[#FFF8F0] border border-[#B8860B]/20 rounded-xl"
                        >
                          <p className="text-xs text-[#6B6B6B] mb-3">Transfer Preview</p>
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-center flex-1">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center mx-auto mb-1">
                                <Building2 className="w-5 h-5 text-white" />
                              </div>
                              <p className="text-xs text-[#6B6B6B]">
                                {getBranchLabel(branches.find(b => b.id === fromBranchId)?.location || '')}
                              </p>
                              <p className="font-bold text-[#2C2C2C]">
                                {selectedSourceProduct
                                  ? (selectedSourceProduct.freshQuantity - parseInt(quantity)).toLocaleString('en-IN')
                                  : '\u2014'}
                              </p>
                              <p className="text-xs text-[#6B6B6B]">After</p>
                            </div>

                            <div className="flex flex-col items-center gap-1">
                              <div className="bg-[#B8860B]/10 text-[#B8860B] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                {parseInt(quantity)} units
                                <ArrowRight className="w-3 h-3" />
                              </div>
                            </div>

                            <div className="text-center flex-1">
                              <div className="w-10 h-10 rounded-lg bg-white border-2 border-[#B8860B]/30 flex items-center justify-center mx-auto mb-1">
                                <Building2 className="w-5 h-5 text-[#B8860B]" />
                              </div>
                              <p className="text-xs text-[#6B6B6B]">
                                {getBranchLabel(branches.find(b => b.id === toBranchId)?.location || '')}
                              </p>
                              <p className="font-bold text-emerald-700">
                                +{parseInt(quantity).toLocaleString('en-IN')}
                                {targetBranchStock && (
                                  <span className="text-xs text-[#6B6B6B] font-normal ml-1">
                                    (was {targetBranchStock.freshQuantity})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Remarks */}
                    <div className="space-y-2">
                      <Label>Remarks (Optional)</Label>
                      <Input
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        placeholder="e.g. Customer order #123 needs this product"
                        className="border-[#B8860B]/30"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { resetForm(); setIsCreateOpen(false); }}
                        className="flex-1 border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateTransfer}
                        disabled={!fromBranchId || !toBranchId || !selectedProductId || !quantity}
                        className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Submit Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Branch Admin: View-Only Banner */}
      {isBranchAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">View-Only Access</p>
            <p className="text-xs text-amber-700">
              As a Branch Admin, you can monitor all transfer activity for your branch.
              Stock Managers handle the operational side — creating, approving, shipping, and receiving transfers.
            </p>
          </div>
        </motion.div>
      )}

      {/* Flow Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#FFF8F0] to-white border border-[#B8860B]/20 rounded-xl overflow-x-auto"
      >
        {['Request', 'Approve', 'In Transit', 'Received'].map((step, i) => {
          const icons = [Clock, CheckCircle, Truck, CheckCircle];
          const Icon = icons[i];
          return (
            <div key={step} className="flex items-center gap-3 shrink-0">
              {i > 0 && <ChevronRight className="w-4 h-4 text-[#C9A961] shrink-0" />}
              <div className="flex items-center gap-2 shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-blue-100 text-blue-700' :
                  i === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-[#2C2C2C]">{step}</span>
              </div>
            </div>
          );
        })}
        <div className="ml-auto shrink-0 text-xs text-[#6B6B6B] bg-[#FFF8F0] px-3 py-1.5 rounded-lg border border-[#B8860B]/10">
          Stock moves on <span className="font-bold text-[#B8860B]">Received</span>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Transfers', value: summaryStats.total, color: 'from-[#B8860B] to-[#DAA520]', icon: ArrowLeftRight },
          { label: 'Pending Approval', value: summaryStats.requested, color: 'from-amber-500 to-amber-600', icon: Clock },
          { label: 'In Transit / Approved', value: summaryStats.inTransit, color: 'from-orange-400 to-orange-500', icon: Truck },
          { label: 'Completed', value: summaryStats.received, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className="border-[#B8860B]/20">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-[#2C2C2C]">{card.value}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'requested', 'approved', 'in-transit', 'received', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 text-xs rounded-full transition-all ${
              filterStatus === status
                ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-sm'
                : 'bg-white text-[#6B6B6B] border border-[#B8860B]/15 hover:bg-[#FFF8F0]'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Transfer List */}
      <Card className="border-[#B8860B]/20">
        <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-[#B8860B]" />
            Transfer History
            <Badge variant="outline" className="ml-2 border-[#B8860B]/30 text-[#B8860B]">
              {filteredTransfers.length}
            </Badge>
            {isBranchAdmin && (
              <Badge className="ml-auto bg-amber-50 text-amber-700 border-amber-200 text-xs">
                <Eye className="w-3 h-3 mr-1" />
                View Only
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTransfers.length === 0 ? (
            <div className="p-12 text-center">
              <ArrowLeftRight className="w-12 h-12 text-[#B8860B]/30 mx-auto mb-3" />
              <p className="text-[#6B6B6B]">No transfers found</p>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {canCreateTransfer
                  ? 'Create a new transfer request to get started'
                  : 'Transfer requests will appear here once Stock Managers create them'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#B8860B]/10">
              {filteredTransfers.map((transfer, idx) => {
                const statusCfg = STATUS_CONFIG[transfer.status];
                const StatusIcon = statusCfg.icon;
                const fromTheme = BRANCH_THEME[transfer.fromBranchLocation] || { label: transfer.fromBranchLocation, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                const toTheme = BRANCH_THEME[transfer.toBranchLocation] || { label: transfer.toBranchLocation, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

                const hasActions = canApprove(transfer) || canMarkInTransit(transfer) || canReceive(transfer) || canReject(transfer);

                return (
                  <motion.div
                    key={transfer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="p-5 hover:bg-[#FFF8F0]/40 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Transfer info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-sm font-bold text-[#2C2C2C]">{transfer.transferNumber}</span>
                          <Badge className={`${statusCfg.bg} ${statusCfg.text} border-none text-xs`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </div>

                        {/* From -> To visual */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={`${fromTheme.bg} ${fromTheme.text} ${fromTheme.border}`}>
                            <Building2 className="w-3 h-3 mr-1" />
                            {fromTheme.label}
                          </Badge>
                          <ArrowRight className="w-4 h-4 text-[#C9A961]" />
                          <Badge variant="outline" className={`${toTheme.bg} ${toTheme.text} ${toTheme.border}`}>
                            <Building2 className="w-3 h-3 mr-1" />
                            {toTheme.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-[#6B6B6B]">
                            <Package className="w-3.5 h-3.5" />
                            {transfer.productName}
                          </span>
                          <span className="font-bold text-[#B8860B]">{transfer.quantity} units</span>
                        </div>

                        {transfer.remarks && (
                          <p className="text-xs text-[#6B6B6B] mt-1 italic">"{transfer.remarks}"</p>
                        )}

                        {/* Timeline info */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#6B6B6B]">
                          <span>Requested: {new Date(transfer.requestedAt).toLocaleDateString('en-IN')} by {getUserName(transfer.requestedBy)}</span>
                          {transfer.approvedBy && (
                            <span>| Approved: {transfer.approvedAt ? new Date(transfer.approvedAt).toLocaleDateString('en-IN') : '\u2014'} by {getUserName(transfer.approvedBy)}</span>
                          )}
                          {transfer.receivedBy && (
                            <span>| Received: {transfer.receivedAt ? new Date(transfer.receivedAt).toLocaleDateString('en-IN') : '\u2014'} by {getUserName(transfer.receivedBy)}</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons — only for super-admin & stock-manager */}
                      {hasActions && (
                        <div className="flex items-center gap-2 shrink-0">
                          {canApprove(transfer) && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(transfer)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Approve
                            </Button>
                          )}
                          {canMarkInTransit(transfer) && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkInTransit(transfer)}
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              <Truck className="w-3.5 h-3.5 mr-1" />
                              Ship
                            </Button>
                          )}
                          {canReceive(transfer) && (
                            <Button
                              size="sm"
                              onClick={() => handleReceive(transfer)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Receive
                            </Button>
                          )}
                          {canReject(transfer) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(transfer)}
                              className="border-[#B8860B]/30 text-[#6B6B6B] hover:bg-gray-50"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Reject
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions Info Banner */}
      <div className="p-4 bg-[#FFF8F0] border border-[#B8860B]/20 rounded-xl text-sm text-[#2C2C2C]">
        <p className="font-semibold mb-2 flex items-center gap-2 text-[#B8860B]">
          <Shield className="w-4 h-4" />
          Role Permissions for Stock Transfers
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Super Admin */}
          <div className={`p-3 rounded-lg border ${userRole === 'super-admin' ? 'bg-[#B8860B]/5 border-[#B8860B]/30 ring-1 ring-[#B8860B]/20' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-3.5 h-3.5 text-[#B8860B]" />
              <span className="text-xs font-semibold text-[#B8860B]">Super Admin</span>
              {userRole === 'super-admin' && <Badge className="bg-[#B8860B]/10 text-[#B8860B] border-none text-[10px] px-1.5 py-0">You</Badge>}
            </div>
            <p className="text-xs text-[#6B6B6B]">Full control over all transfers across all branches</p>
          </div>
          {/* Stock Manager */}
          <div className={`p-3 rounded-lg border ${userRole === 'stock-manager' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-3.5 h-3.5 text-blue-700" />
              <span className="text-xs font-semibold text-blue-700">Stock Manager</span>
              {userRole === 'stock-manager' && <Badge className="bg-blue-100 text-blue-700 border-none text-[10px] px-1.5 py-0">You</Badge>}
            </div>
            <p className="text-xs text-[#6B6B6B]">Create, approve, ship, receive & reject transfers for their branch</p>
          </div>
          {/* Branch Admin */}
          <div className={`p-3 rounded-lg border ${userRole === 'branch-admin' ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-200' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-3.5 h-3.5 text-amber-700" />
              <span className="text-xs font-semibold text-amber-700">Branch Admin</span>
              {userRole === 'branch-admin' && <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] px-1.5 py-0">You</Badge>}
            </div>
            <p className="text-xs text-[#6B6B6B]">View-only access to monitor transfer status & history</p>
          </div>
        </div>
      </div>
    </div>
  );
};