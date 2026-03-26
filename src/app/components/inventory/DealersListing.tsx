import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Card, CardContent, CardHeader } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  Package, 
  Calendar, 
  Search, 
  TrendingUp, 
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  Box,
  IndianRupee,
  AlertTriangle,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AddProductModal } from './AddProductModal';
import { AddDealerModal } from './AddDealerModal';
import { EditDealerModal } from './EditDealerModal';

interface DealersListingProps {
  onSelectDealer: (dealerId: string) => void;
  onBack?: () => void;
}

export const DealersListing: React.FC<DealersListingProps> = ({ onSelectDealer, onBack }) => {
  const { dealers, products, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDealers, setExpandedDealers] = useState<Set<string>>(new Set());
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [addDealerModalOpen, setAddDealerModalOpen] = useState(false);
  const [editDealerModalOpen, setEditDealerModalOpen] = useState(false);
  const [editingDealerId, setEditingDealerId] = useState<string | null>(null);

  // Check if current user is branch admin
  const isBranchAdmin = currentUser?.role === 'branch-admin';
  const userBranch = currentUser?.branchLocation;

  // Calculate dealer statistics with branch filtering
  const dealerStats = dealers.map(dealer => {
    const dealerProducts = products.filter(p => p.dealerId === dealer.id);
    const totalStock = dealerProducts.reduce((sum, p) => sum + p.stock, 0);
    const totalBrokenStock = dealerProducts.reduce((sum, p) => sum + (p.brokenQuantity || 0), 0);
    const totalProductsSupplied = dealerProducts.length;
    
    // Get the most recent supply date
    const lastSuppliedDate = dealerProducts.reduce((latest, p) => {
      const productDate = p.lastSuppliedDate || p.createdAt;
      return productDate > latest ? productDate : latest;
    }, new Date(0));

    // Check if dealer has been active in the last 30 days
    const isActive = (new Date().getTime() - lastSuppliedDate.getTime()) < (30 * 24 * 60 * 60 * 1000);

    // Calculate branch-specific financial totals
    let branchSpecificTotalPaid = dealer.totalPaid;
    let branchSpecificOutstanding = dealer.outstandingPayment;
    
    // If user is branch admin, filter payments by their branch
    if (isBranchAdmin && userBranch && dealer.payments) {
      const branchPayments = dealer.payments.filter(p => p.paidByBranch === userBranch);
      branchSpecificTotalPaid = branchPayments.reduce((sum, p) => sum + p.paidAmount, 0);
      
      // Calculate outstanding for this branch (their share)
      const branchPurchases = branchPayments.reduce((sum, p) => sum + p.purchaseAmount, 0);
      branchSpecificOutstanding = branchPurchases - branchSpecificTotalPaid;
    }

    return {
      ...dealer,
      totalProductsSupplied,
      totalStock,
      totalBrokenStock,
      lastSuppliedDate,
      isActive,
      displayTotalPaid: branchSpecificTotalPaid,
      displayOutstanding: branchSpecificOutstanding,
    };
  });

  // Filter dealers based on search
  const filteredDealers = dealerStats.filter(dealer =>
    dealer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dealer.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dealer.district?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDealerExpanded = (dealerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedDealers);
    if (newExpanded.has(dealerId)) {
      newExpanded.delete(dealerId);
    } else {
      newExpanded.add(dealerId);
    }
    setExpandedDealers(newExpanded);
  };

  const handleAddProduct = (dealerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDealerId(dealerId);
    setAddProductModalOpen(true);
  };

  const handleEditDealer = (dealerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDealerId(dealerId);
    setEditDealerModalOpen(true);
  };

  const getDealerProducts = (dealerId: string) => {
    return products.filter(p => p.dealerId === dealerId);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2 text-[#B8860B] hover:text-[#DAA520] hover:bg-[#FFF8F0] -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      )}

      {/* Header with Search */}
      <div>
        {/* Info Banner for Branch Admins */}
        {isBranchAdmin && userBranch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-1">
                  {userBranch.split('-').map((word: string) => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')} Branch Admin View
                </h4>
                <p className="text-sm text-blue-700">
                  You can see <strong>all dealer products</strong> across the company. When you add a product and make a payment, 
                  it will be tracked under your branch. The financial summary shows only payments made by your branch.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
              Dealers Network
            </h2>
            <p className="text-[#6B6B6B] text-sm md:text-base mt-1">
              Select a dealer to view their product catalog
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
              <Building2 className="w-4 h-4" />
              <span>{dealers.length} Active Dealers</span>
            </div>
            <Button
              onClick={() => setAddDealerModalOpen(true)}
              className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Dealer
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <Input
            placeholder="Search dealers by name, state, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-[#B8860B]/20 focus:border-[#B8860B]"
          />
        </div>
      </div>

      {/* Dealers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredDealers.map((dealer, index) => (
          <motion.div
            key={dealer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className="border-[#B8860B]/20 hover:border-[#B8860B]/40 hover:shadow-lg transition-all h-full cursor-pointer group"
              onClick={() => onSelectDealer(dealer.id)}
            >
              <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-[#1A1A1A] line-clamp-1 mb-1 group-hover:text-[#B8860B] transition-colors">
                      {dealer.name}
                    </h3>
                    <p className="text-sm text-[#6B6B6B] line-clamp-1">
                      {dealer.contactPerson}
                    </p>
                  </div>
                  <Badge
                    variant={dealer.isActive ? 'default' : 'secondary'}
                    className={`${
                      dealer.isActive 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-gray-400 hover:bg-gray-500'
                    } text-white`}
                  >
                    {dealer.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#FFF8F0] to-white border border-[#B8860B]/10 group-hover:border-[#B8860B]/30 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Package className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span className="text-[10px] text-[#6B6B6B] font-medium">Products</span>
                    </div>
                    <p className="text-xl font-bold text-[#B8860B]">
                      {dealer.totalProductsSupplied}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-white border border-green-200/50 group-hover:border-green-300 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-[10px] text-[#6B6B6B] font-medium">Good Stock</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      {dealer.totalStock}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#B8860B]/5 to-white border border-[#B8860B]/20 group-hover:border-[#B8860B]/40 transition-colors">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#B8860B]" />
                      <span className="text-[10px] text-[#6B6B6B] font-medium">Broken</span>
                    </div>
                    <p className={`text-xl font-bold ${dealer.totalBrokenStock > 0 ? 'text-[#B8860B]' : 'text-green-600'}`}>
                      {dealer.totalBrokenStock}
                    </p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200/50">
                  <div className="flex items-center gap-2 mb-3">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-emerald-900 font-semibold">
                      Financial Summary
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {isBranchAdmin && userBranch ? (
                      <>
                        {/* Branch Admin View - Shows branch-specific */}
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Total Purchases:</span>
                          <span className="font-semibold text-[#1A1A1A]">₹{(dealer.totalPurchases ?? 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">You Paid:</span>
                          <span className="font-semibold text-emerald-600">₹{(dealer.displayTotalPaid ?? 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-emerald-200">
                          <span className="font-semibold text-[#1A1A1A]">Your Outstanding:</span>
                          <span className={`font-bold ${
                            (dealer.displayOutstanding ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            ₹{(dealer.displayOutstanding ?? 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {dealer.displayTotalPaid === 0 && dealer.totalPurchases > 0 && (
                          <div className="mt-2 p-2 rounded-lg bg-blue-100 border border-blue-300">
                            <p className="text-xs text-blue-800">
                              💡 Your branch hasn't paid for products from this dealer yet. You can make payments when adding products.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Inventory Manager / Super Admin View - Shows company-wide */}
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Total Purchases:</span>
                          <span className="font-semibold text-[#1A1A1A]">₹{(dealer.totalPurchases ?? 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Total Paid:</span>
                          <span className="font-semibold text-emerald-600">₹{(dealer.totalPaid ?? 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-emerald-200">
                          <span className="font-semibold text-[#1A1A1A]">Outstanding:</span>
                          <span className={`font-bold ${
                            (dealer.outstandingPayment ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            ₹{(dealer.outstandingPayment ?? 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Last Supplied */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#FFF8F0]/50">
                  <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                    <Calendar className="w-4 h-4" />
                    <span>Last Supplied</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1A1A1A]">
                    {dealer.lastSuppliedDate.getTime() > 0
                      ? dealer.lastSuppliedDate.toLocaleDateString('en-GB')
                      : 'N/A'}
                  </span>
                </div>

                {/* Products from this Dealer - Expandable */}
                <div 
                  className="border-t border-[#B8860B]/10 pt-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => toggleDealerExpanded(dealer.id, e)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#FFF8F0]/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Box className="w-5 h-5 text-[#B8860B]" />
                      <span className="font-semibold text-[#1A1A1A]">
                        Products from this Dealer
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedDealers.has(dealer.id) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-[#B8860B]" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedDealers.has(dealer.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 space-y-2">
                          {getDealerProducts(dealer.id).length > 0 ? (
                            <>
                              {getDealerProducts(dealer.id).map((product) => (
                                <div
                                  key={product.id}
                                  className="flex items-center justify-between py-3 px-4 rounded-lg border border-[#B8860B]/10 bg-white hover:bg-[#FFF8F0]/30 transition-colors"
                                >
                                  <div className="flex-1 min-w-0 mr-3">
                                    <p className="text-sm font-medium text-[#1A1A1A] line-clamp-1">
                                      {product.name}
                                    </p>
                                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                                      {product.category}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3 text-right">
                                    <div>
                                      <p className="text-[10px] text-[#6B6B6B]">Good</p>
                                      <p className="text-sm font-bold text-green-600">
                                        {product.stock}
                                      </p>
                                    </div>
                                    {(product.brokenQuantity || 0) > 0 && (
                                      <div>
                                        <p className="text-[10px] text-[#B8860B]">Broken</p>
                                        <p className="text-sm font-bold text-[#B8860B]">
                                          {product.brokenQuantity}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Add Product Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleAddProduct(dealer.id, e)}
                                className="w-full mt-2 border-dashed border-[#B8860B] text-[#B8860B] hover:bg-[#FFF8F0] hover:text-[#DAA520] hover:border-[#DAA520]"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Product
                              </Button>
                            </>
                          ) : (
                            <div className="py-6 text-center">
                              <Package className="w-12 h-12 text-[#B8860B]/30 mx-auto mb-3" />
                              <p className="text-sm text-[#6B6B6B] mb-3">
                                No products from this dealer yet
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleAddProduct(dealer.id, e)}
                                className="border-dashed border-[#B8860B] text-[#B8860B] hover:bg-[#FFF8F0] hover:text-[#DAA520]"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Product
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Edit Dealer Button */}
                <div className="text-center pt-2 border-t border-[#B8860B]/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleEditDealer(dealer.id, e)}
                    className="text-[#B8860B] font-medium"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Dealer
                  </Button>
                </div>

                {/* Click to View Indicator */}
                <div className="text-center pt-2 border-t border-[#B8860B]/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-[#B8860B] font-medium">
                    Click to view full dealer details →
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDealers.length === 0 && (
        <Card className="border-dashed border-[#B8860B]/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="w-16 h-16 text-[#B8860B]/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">No dealers found</h3>
            <p className="text-sm text-[#6B6B6B]">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'No dealers available in the system'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Product Modal */}
      {addProductModalOpen && selectedDealerId && (
        <AddProductModal
          dealerId={selectedDealerId}
          isOpen={addProductModalOpen}
          onClose={() => {
            setAddProductModalOpen(false);
            setSelectedDealerId(null);
          }}
        />
      )}

      {/* Add Dealer Modal */}
      {addDealerModalOpen && (
        <AddDealerModal
          isOpen={addDealerModalOpen}
          onClose={() => setAddDealerModalOpen(false)}
        />
      )}

      {/* Edit Dealer Modal */}
      {editDealerModalOpen && editingDealerId && (
        <EditDealerModal
          dealerId={editingDealerId}
          isOpen={editDealerModalOpen}
          onClose={() => {
            setEditDealerModalOpen(false);
            setEditingDealerId(null);
          }}
        />
      )}
    </div>
  );
};