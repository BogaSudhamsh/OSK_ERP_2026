import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Package,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { AddProductModal } from './AddProductModal';

interface DealerDetailsProps {
  dealerId: string;
  onBack: () => void;
  onViewProduct: (productId: string) => void;
}

export const DealerDetails: React.FC<DealerDetailsProps> = ({
  dealerId,
  onBack,
  onViewProduct,
}) => {
  const { dealers, products, updateProduct, deleteProduct } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'available' | 'out-of-stock' | 'damaged'>('all');
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);

  const dealer = dealers.find(d => d.id === dealerId);
  const dealerProducts = products.filter(p => p.dealerId === dealerId);

  if (!dealer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#6B6B6B]">Dealer not found</p>
      </div>
    );
  }

  // Calculate stats
  const totalQuantityReceived = dealerProducts.reduce((sum, p) => sum + (p.totalReceived || p.stock || 0), 0);
  const availableQuantity = dealerProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
  const soldQuantity = dealerProducts.reduce((sum, p) => sum + (p.soldQuantity || 0), 0);
  const totalBroken = dealerProducts.reduce((sum, p) => sum + (p.brokenQuantity || 0), 0);
  const totalValue = dealerProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);

  // Filter products
  let filteredProducts = dealerProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filterStock === 'available') {
    filteredProducts = filteredProducts.filter(p => p.stock > 0);
  } else if (filterStock === 'out-of-stock') {
    filteredProducts = filteredProducts.filter(p => p.stock === 0);
  } else if (filterStock === 'damaged') {
    filteredProducts = filteredProducts.filter(p => (p.brokenQuantity || 0) > 0);
  }

  const handleToggleEnabled = (productId: string, enabled: boolean) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    updateProduct(productId, { enabled });

    if (enabled) {
      toast.success(`${product.name} enabled - Now available for purchase`);
    } else {
      toast.info(`${product.name} disabled - Marked as unavailable`, {
        duration: 3000,
      });
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    deleteProduct(productId);

    toast.success(`${product.name} deleted`);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="gap-2 text-[#B8860B] hover:text-[#DAA520] hover:bg-[#FFF8F0]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dealers
      </Button>

      {/* Dealer Profile Section */}
      <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center flex-shrink-0 shadow-xl">
              <Building2 className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl md:text-3xl text-[#1A1A1A] mb-2">
                {dealer.name}
              </CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-[#6B6B6B]">
                  <Phone className="w-4 h-4 text-[#B8860B]" />
                  <span>{dealer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[#6B6B6B]">
                  <Mail className="w-4 h-4 text-[#B8860B]" />
                  <span className="truncate">{dealer.email}</span>
                </div>
                {dealer.state && dealer.district && (
                  <div className="flex items-center gap-2 text-[#6B6B6B]">
                    <MapPin className="w-4 h-4 text-[#B8860B]" />
                    <span>
                      {dealer.district}, {dealer.state}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
            <div className="p-3 md:p-4 rounded-lg bg-white border border-[#B8860B]/20">
              <div className="flex items-center gap-2 text-[#6B6B6B] text-xs mb-2">
                <Package className="w-4 h-4" />
                <span>Total Products</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-[#B8860B]">
                {dealerProducts.length}
              </p>
            </div>
            <div className="p-3 md:p-4 rounded-lg bg-white border border-green-200">
              <div className="flex items-center gap-2 text-green-700 text-xs mb-2">
                <TrendingUp className="w-4 h-4" />
                <span>Total Received</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-green-700">
                {totalQuantityReceived}
              </p>
            </div>
            <div className="p-3 md:p-4 rounded-lg bg-white border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 text-xs mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Good Stock</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-blue-700">
                {availableQuantity}
              </p>
            </div>
            <div className="p-3 md:p-4 rounded-lg bg-white border border-[#B8860B]/30">
              <div className="flex items-center gap-2 text-[#B8860B] text-xs mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Broken / Damaged</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-[#B8860B]">
                {totalBroken}
              </p>
            </div>
            <div className="p-3 md:p-4 rounded-lg bg-white border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 text-xs mb-2">
                <TrendingDown className="w-4 h-4" />
                <span>Sold</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-purple-700">
                {soldQuantity}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-[#B8860B]/20"
          />
        </div>
        <Tabs value={filterStock} onValueChange={(v) => setFilterStock(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="available" className="text-xs sm:text-sm">Available</TabsTrigger>
            <TabsTrigger value="damaged" className="text-xs sm:text-sm">Damaged</TabsTrigger>
            <TabsTrigger value="out-of-stock" className="text-xs sm:text-sm">Out of Stock</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Products from this Dealer Header + Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#B8860B]" />
            Products from this Dealer
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
          </p>
        </div>
        <Button
          onClick={() => setAddProductModalOpen(true)}
          className="gap-2 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </Button>
      </div>

      {/* Add Product Modal */}
      {addProductModalOpen && (
        <AddProductModal
          open={addProductModalOpen}
          onClose={() => setAddProductModalOpen(false)}
          dealerId={dealerId}
        />
      )}

      {/* Products List */}
      <div className="space-y-3">
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card
              className="border-[#B8860B]/20 hover:border-[#B8860B]/40 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => onViewProduct(product.id)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Product Image */}
                  <div className="w-full md:w-24 h-40 md:h-24 rounded-lg bg-gradient-to-br from-[#B8860B]/10 to-[#DAA520]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 md:w-10 md:h-10 text-[#B8860B]/40" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-[#1A1A1A] line-clamp-1">
                          {product.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge variant="secondary">
                            {product.category}
                          </Badge>
                          {product.size && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200">
                              {product.size}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={product.enabled}
                          onCheckedChange={(checked) => handleToggleEnabled(product.id, checked)}
                        />
                        <span className="text-sm text-[#6B6B6B]">
                          {product.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 rounded-lg hover:bg-amber-100 text-[#B8860B]/50 hover:text-[#B8860B] transition-all ml-1"
                          title={`Delete "${product.name}"`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2 text-sm">
                      <div>
                        <span className="text-[#6B6B6B] text-xs">Total Received</span>
                        <p className="font-semibold text-[#1A1A1A]">
                          {product.totalReceived || product.stock || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] text-xs">Good Stock</span>
                        <p className={`font-semibold ${
                          product.stock === 0
                            ? 'text-[#B8860B]'
                            : product.stock <= 10
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}>
                          {product.stock || 0}
                          {(product.stock || 0) === 0 && (
                            <AlertTriangle className="inline w-3 h-3 ml-1" />
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] text-xs">Broken / Damaged</span>
                        <p className={`font-semibold ${(product.brokenQuantity || 0) > 0 ? 'text-[#B8860B]' : 'text-green-600'}`}>
                          {product.brokenQuantity || 0}
                          {(product.brokenQuantity || 0) > 0 && (
                            <AlertTriangle className="inline w-3 h-3 ml-1 text-[#B8860B]" />
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] text-xs">Sold</span>
                        <p className="font-semibold text-purple-600">
                          {product.soldQuantity || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] text-xs">Purchase Price</span>
                        <p className="font-semibold text-blue-600">
                          ₹{(product.purchasePrice || (product.price || 0) * 0.7).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] text-xs">Selling Price</span>
                        <p className="font-semibold text-[#B8860B]">
                          ₹{(product.price || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] text-xs">Status</span>
                        <Badge
                          variant={(product.stock || 0) > 0 ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {(product.stock || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card className="border-dashed border-[#B8860B]/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-[#B8860B]/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-sm text-[#6B6B6B]">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'This dealer has no products yet'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};