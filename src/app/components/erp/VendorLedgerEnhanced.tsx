import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
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
  Search,
  ArrowLeft,
  Package,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  Minus,
  ShoppingCart,
  Box,
  ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';
import type { VendorProduct, Dealer } from '@/app/types';

interface VendorLedgerEnhancedProps {
  onBack?: () => void;
}

export const VendorLedgerEnhanced: React.FC<VendorLedgerEnhancedProps> = ({ onBack }) => {
  const { dealers } = useApp();
  const [selectedVendor, setSelectedVendor] = useState<Dealer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);

  const filteredVendors = dealers.filter(vendor =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.gstNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get products for selected vendor
  const getVendorProducts = (vendorId: string): VendorProduct[] => {
    return [];
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'granite':
        return 'bg-purple-100 text-purple-700';
      case 'tiles':
        return 'bg-blue-100 text-blue-700';
      case 'sanitary':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (selectedVendor) {
    const products = getVendorProducts(selectedVendor.id);
    
    // Calculate totals from products
    const totalQuantity = products.reduce((sum, p) => sum + p.totalQuantityPurchased, 0);
    const totalCurrentStock = products.reduce((sum, p) => sum + p.currentStock, 0);
    const totalSold = products.reduce((sum, p) => sum + p.soldQuantity, 0);
    const totalBroken = products.reduce((sum, p) => sum + p.brokenQuantity, 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedVendor(null)}
                className="border-[#B8860B]/30 hover:bg-[#FFF8F0]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dealers
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
                  {selectedVendor.name}
                </h1>
                <p className="text-[#6B6B6B] mt-1">Dealer Details & Product Portfolio</p>
              </div>
            </div>

            <Button
              onClick={() => setShowAddProduct(true)}
              className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Purchases */}
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Total Purchases</p>
                    <p className="text-2xl font-bold text-[#2C2C2C]">
                      ₹{(selectedVendor.totalPurchases ?? 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
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
                      ₹{(selectedVendor.totalPaid ?? 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Due Amount */}
            <Card className="border-orange-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Due Amount</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{(selectedVendor.outstandingPayment ?? 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Information */}
          <Card className="border-[#B8860B]/20">
            <CardHeader>
              <CardTitle className="text-xl">Dealer Information</CardTitle>
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
                    <FileText className="w-5 h-5 text-[#B8860B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6B6B] mb-1">Payment Terms</p>
                    <p className="font-semibold text-[#2C2C2C]">{selectedVendor.paymentTerms}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-[#B8860B]/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-[#6B6B6B] mb-2">Total Quantity</p>
                  <p className="text-3xl font-bold text-[#2C2C2C]">{totalQuantity.toLocaleString()}</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">boxes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-300 bg-green-50/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-[#6B6B6B] mb-2">Current Stock</p>
                  <p className="text-3xl font-bold text-green-600">{totalCurrentStock.toLocaleString()}</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">boxes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-300 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-[#6B6B6B] mb-2">Sold</p>
                  <p className="text-3xl font-bold text-blue-600">{totalSold.toLocaleString()}</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">boxes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-300 bg-red-50/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-[#6B6B6B] mb-2">Broken</p>
                  <p className="text-3xl font-bold text-red-600">{totalBroken.toLocaleString()}</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">boxes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products from this Vendor */}
          <Card className="border-[#B8860B]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Products from this Dealer</CardTitle>
                  <CardDescription>All products purchased from {selectedVendor.name}</CardDescription>
                </div>
                <Badge className="bg-[#B8860B] text-white">{products.length} Products</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-[#B8860B]/20 hover:border-[#B8860B] transition-all hover:shadow-lg">
                      <CardContent className="p-4">
                        {/* Product Image */}
                        <div className="relative w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.productName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge className={getCategoryBadgeColor(product.category)}>
                              {product.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-bold text-[#2C2C2C] mb-1">{product.productName}</h3>
                            <p className="text-xs text-[#6B6B6B] font-mono">{product.sku}</p>
                          </div>

                          {/* Pricing */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-[#6B6B6B]">Purchase Price</p>
                              <p className="text-sm font-semibold text-[#2C2C2C]">₹{product.purchasePrice}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#6B6B6B]">Selling Price</p>
                              <p className="text-sm font-semibold text-green-600">₹{product.sellingPrice}</p>
                            </div>
                          </div>

                          {/* Stock Information */}
                          <div className="space-y-2 pt-2 border-t border-[#B8860B]/10">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#6B6B6B] flex items-center gap-1">
                                <Plus className="w-3 h-3" />
                                Purchased
                              </span>
                              <span className="text-sm font-semibold text-blue-600">
                                {product.totalQuantityPurchased} boxes
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#6B6B6B] flex items-center gap-1">
                                <Box className="w-3 h-3" />
                                Current Stock
                              </span>
                              <span className="text-sm font-semibold text-green-600">
                                {product.currentStock} boxes
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#6B6B6B] flex items-center gap-1">
                                <Minus className="w-3 h-3" />
                                Sold
                              </span>
                              <span className="text-sm font-semibold text-[#2C2C2C]">
                                {product.soldQuantity} boxes
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#6B6B6B] flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Broken
                              </span>
                              <span className="text-sm font-semibold text-red-600">
                                {product.brokenQuantity} boxes
                              </span>
                            </div>
                          </div>

                          {/* Financial Summary */}
                          <div className="pt-2 border-t border-[#B8860B]/10">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-[#6B6B6B]">Purchase Value</span>
                              <span className="text-sm font-semibold text-[#2C2C2C]">
                                ₹{product.totalPurchaseValue.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#6B6B6B]">Sales Value</span>
                              <span className="text-sm font-semibold text-green-600">
                                ₹{product.totalSalesValue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* Last Purchase Date */}
                          <div className="pt-2 border-t border-[#B8860B]/10">
                            <p className="text-xs text-[#6B6B6B]">
                              Last Purchase: {product.lastPurchaseDate.toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {products.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-[#6B6B6B] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">No Products Yet</h3>
                  <p className="text-[#6B6B6B] mb-4">Start adding products from this dealer</p>
                  <Button
                    onClick={() => setShowAddProduct(true)}
                    className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Product
                  </Button>
                </div>
              )}
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
              Dealer Management
            </h1>
            <p className="text-[#6B6B6B] mt-2">Manage dealers and track product purchases</p>
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
                placeholder="Search dealers by name, contact person, or GST number..."
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
                  <p className="text-sm text-[#6B6B6B] mb-1">Total Dealers</p>
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
                    ₹{dealers.reduce((sum, v) => sum + (v.outstandingPayment ?? 0), 0).toLocaleString('en-IN')}
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
                  <p className="text-sm text-[#6B6B6B] mb-1">Total Products</p>
                  <p className="text-3xl font-bold text-green-600">0</p>
                </div>
                <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
                  <Package className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dealer Cards */}
        <div className="grid grid-cols-1 gap-4">
          {filteredVendors.map((vendor, index) => {
            const products = getVendorProducts(vendor.id);
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
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      {/* Dealer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#B8860B] to-[#DAA520] rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-[#2C2C2C]">{vendor.name}</h3>
                            <p className="text-sm text-[#6B6B6B]">{vendor.contactPerson} • {vendor.phone}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-[#6B6B6B] mb-1">Total Purchases</p>
                            <p className="text-sm font-semibold text-[#2C2C2C]">
                              ₹{(vendor.totalPurchases ?? 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#6B6B6B] mb-1">Total Paid</p>
                            <p className="text-sm font-semibold text-green-600">
                              ₹{(vendor.totalPaid ?? 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#6B6B6B] mb-1">Due Amount</p>
                            <p className={`text-sm font-semibold ${vendor.outstandingPayment > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              ₹{(vendor.outstandingPayment ?? 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#6B6B6B] mb-1">Total Products</p>
                            <p className="text-sm font-semibold text-blue-600">
                              {products.length} items
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant="outline"
                        className="border-[#B8860B]/30 hover:bg-[#FFF8F0]"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
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
              <h3 className="text-xl font-semibold text-[#2C2C2C] mb-2">No dealers found</h3>
              <p className="text-[#6B6B6B]">Try adjusting your search query</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};