import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { useApp } from '@/app/context/AppContext';
import { ArrowLeft, Search, Package, CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

interface ProductBrowsingProps {
  customerId: string;
  onBack: () => void;
  onSelectProduct: (productId: string) => void;
}

export const ProductBrowsing: React.FC<ProductBrowsingProps> = ({ customerId, onBack, onSelectProduct }) => {
  const { products, customers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const customer = customers.find(c => c.id === customerId);

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' };
    if (stock <= 10) return { label: 'Low Stock', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { label: 'Available', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-200' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-[#B8860B] hover:bg-[#FFF8F0]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
            Product Catalog
          </h1>
          {customer && (
            <p className="text-[#6B6B6B]">Browsing for: {customer.name}</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-[#B8860B]/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#B8860B]" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#B8860B]/30 focus:border-[#B8860B]"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="md:w-[200px] border-[#B8860B]/30 focus:border-[#B8860B]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <Card className="col-span-full border-[#B8860B]/20">
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-[#B8860B]/30" />
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No products found</h3>
              <p className="text-[#6B6B6B]">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product, index) => {
            const stockStatus = getStockStatus(product.stock);
            const StatusIcon = stockStatus.icon;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-[#B8860B]/20 hover:border-[#B8860B]/40 hover:shadow-lg transition-all group">
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.images && product.images.length > 0 && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          console.log('Image failed to load:', product.images[0]);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => console.log('Image loaded:', product.name)}
                      />
                    ) : null}
                    {(!product.images || product.images.length === 0 || !product.images[0]) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    {/* Stock Badge - Top Right */}
                    <div className="absolute top-3 right-3">
                      <Badge className={stockStatus.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {stockStatus.label}
                      </Badge>
                    </div>
                    {/* Category Badge - Top Left */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-[#B8860B] text-white">
                        {product.category}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Product Name */}
                    <div>
                      <h3 className="font-semibold text-lg text-[#1A1A1A] mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-[#6B6B6B] line-clamp-2">{product.description}</p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#B8860B]">
                        ₹{product.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-[#6B6B6B]">per sq.ft</span>
                    </div>

                    {/* Measurements & Stock */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {product.specifications?.Size && (
                        <div className="p-2 rounded-lg bg-[#FFF8F0] border border-[#B8860B]/10">
                          <p className="text-[#6B6B6B] text-xs">Size</p>
                          <p className="font-semibold text-[#1A1A1A]">{product.specifications.Size}</p>
                        </div>
                      )}
                      <div className="p-2 rounded-lg bg-[#FFF8F0] border border-[#B8860B]/10">
                        <p className="text-[#6B6B6B] text-xs">Stock</p>
                        <p className="font-semibold text-[#1A1A1A]">{product.stock} units</p>
                      </div>
                    </div>

                    {/* Additional Specs */}
                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                      <div className="pt-2 border-t border-[#B8860B]/10">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(product.specifications).slice(0, 3).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs border-[#B8860B]/30">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => onSelectProduct(product.id)}
                        className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white"
                        size="sm"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Visualization
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};