import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Progress } from '@/app/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  ArrowLeft,
  Building2,
  Package,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Calendar,
  Ruler,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface ProductDetailScreenProps {
  productId: string;
  onBack: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  productId,
  onBack,
}) => {
  const { products, dealers, updateProduct } = useApp();
  const [selectedImage, setSelectedImage] = useState(0);

  const product = products.find(p => p.id === productId);
  const dealer = product ? dealers.find(d => d.id === product.dealerId) : null;

  if (!product || !dealer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#6B6B6B]">Product not found</p>
      </div>
    );
  }

  // Calculate stats
  const totalReceived = product.totalReceived || product.stock;
  const availableStock = product.stock;
  const soldQuantity = product.soldQuantity || 0;
  const stockPercentage = totalReceived > 0 ? (availableStock / totalReceived) * 100 : 0;

  const handleToggleEnabled = (enabled: boolean) => {
    updateProduct(product.id, { enabled });
    if (enabled) {
      toast.success(`${product.name} enabled and available for purchase`);
    } else {
      toast.info(`${product.name} disabled`);
    }
  };

  const handleDisableReason = (reason: string) => {
    updateProduct(product.id, {
      enabled: false,
      disableReason: reason as any,
    });
    toast.info(`Product disabled: ${reason.replace('-', ' ')}`);
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
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <div className="lg:col-span-1 space-y-4">
          {/* Main Image */}
          <Card className="border-[#B8860B]/20 overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square bg-gradient-to-br from-[#B8860B]/10 to-[#DAA520]/10 flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImage] || product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-24 h-24 text-[#B8860B]/40" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-[#B8860B] shadow-lg scale-105'
                      : 'border-[#B8860B]/20 hover:border-[#B8860B]/40'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Dealer Info Card */}
          <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
            <CardHeader>
              <CardTitle className="text-sm text-[#6B6B6B]">Supplied By</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A1A]">{dealer.name}</p>
                  <p className="text-sm text-[#6B6B6B]">
                    {dealer.district && dealer.state
                      ? `${dealer.district}, ${dealer.state}`
                      : dealer.address}
                  </p>
                </div>
              </div>
              {product.lastSuppliedDate && (
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B] pt-2 border-t border-[#B8860B]/10">
                  <Calendar className="w-4 h-4" />
                  <span>Last Supplied: {new Date(product.lastSuppliedDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Header */}
          <Card className="border-[#B8860B]/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2">
                    {product.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-[#FFF8F0] text-[#B8860B] border border-[#B8860B]/20">
                      {product.category}
                    </Badge>
                    {product.size && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200">
                        {product.size}
                      </Badge>
                    )}
                    <Badge
                      variant={availableStock > 0 ? 'default' : 'destructive'}
                      className={availableStock > 0 ? 'bg-green-500' : ''}
                    >
                      {availableStock > 0 ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                    {!product.enabled && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#6B6B6B] mb-1">Selling Price</p>
                  <p className="text-3xl font-bold text-[#B8860B]">
                    ₹{product.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    Purchase: ₹{(product.purchasePrice || product.price * 0.7).toLocaleString()}
                  </p>
                </div>
              </div>

              {product.description && (
                <p className="text-[#6B6B6B] leading-relaxed">{product.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Stock Statistics */}
          <Card className="border-[#B8860B]/20">
            <CardHeader>
              <CardTitle className="text-[#B8860B]">Stock Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-center gap-2 text-green-700 text-sm mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Total Received</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{totalReceived}</p>
                </div>
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-2 text-blue-700 text-sm mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Available</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{availableStock}</p>
                </div>
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-center gap-2 text-red-700 text-sm mb-2">
                    <TrendingDown className="w-4 h-4" />
                    <span>Sold</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">{soldQuantity}</p>
                </div>
              </div>

              {/* Stock Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B6B6B]">Live Available Stock</span>
                  <span className="font-semibold text-[#1A1A1A]">
                    {availableStock} / {totalReceived} ({stockPercentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  value={stockPercentage}
                  className="h-3"
                />
                <div className="flex justify-between text-xs text-[#6B6B6B]">
                  <span>0</span>
                  <span>{totalReceived}</span>
                </div>
              </div>

              {/* Stock Status Alert */}
              {availableStock === 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Out of Stock</p>
                    <p className="text-sm text-red-700">
                      This product is currently unavailable. Contact the dealer to restock.
                    </p>
                  </div>
                </div>
              )}

              {availableStock > 0 && availableStock <= 10 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900">Low Stock Warning</p>
                    <p className="text-sm text-yellow-700">
                      Only {availableStock} units remaining. Consider restocking soon.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <Card className="border-[#B8860B]/20">
              <CardHeader>
                <CardTitle className="text-[#B8860B] flex items-center gap-2">
                  <Ruler className="w-5 h-5" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#FFF8F0] border border-[#B8860B]/10"
                    >
                      <span className="text-sm text-[#6B6B6B] capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-semibold text-[#1A1A1A]">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enable/Disable Controls */}
          <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
            <CardHeader>
              <CardTitle className="text-[#B8860B]">Product Availability Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-white border border-[#B8860B]/20 rounded-lg">
                <div>
                  <Label className="text-base font-semibold text-[#1A1A1A]">
                    {product.enabled ? 'Product Enabled' : 'Product Disabled'}
                  </Label>
                  <p className="text-sm text-[#6B6B6B] mt-1">
                    {product.enabled
                      ? 'This product is visible and available for purchase in the Store App'
                      : 'This product is marked as unavailable in the Store App'}
                  </p>
                </div>
                <Switch
                  checked={product.enabled}
                  onCheckedChange={handleToggleEnabled}
                  className="data-[state=checked]:bg-[#B8860B]"
                />
              </div>

              {/* Disable Reason Selector */}
              {!product.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="disable-reason">Reason for Disabling</Label>
                  <Select
                    value={product.disableReason || 'out-of-stock'}
                    onValueChange={handleDisableReason}
                  >
                    <SelectTrigger id="disable-reason">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              )}

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 space-y-1">
                    <p className="font-semibold">Enable / Disable Logic:</p>
                    <p>✅ <strong>Enabled:</strong> Product is visible and purchasable</p>
                    <p>❌ <strong>Disabled:</strong> Product remains visible but shows as "Out of Stock"</p>
                    <p className="text-xs text-blue-600 mt-2">
                      This ensures transparency and prevents customer confusion
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};