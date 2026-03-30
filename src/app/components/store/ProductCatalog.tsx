import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useApp } from '@/app/context/AppContext';
import { 
  Search,
  Filter,
  ShoppingCart,
  Package,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProductVisualizerAI } from './ProductVisualizerAI';

// Helper: convert kebab-case branch location to Title Case display name
const formatBranch = (loc: string) =>
  loc.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export const ProductCatalog: React.FC = () => {
  const { currentUser, addToCart, branchStock, products, branches: branchMaster } = useApp();

  // Default branch filter to the logged-in user's store (if available)
  const userBranch = currentUser?.branchLocation ? formatBranch(currentUser.branchLocation) : '';

  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>(userBranch || 'All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<string>('All');
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [selectedProductForAI, setSelectedProductForAI] = useState<any | null>(null);

  useEffect(() => {
    const nextBranchFilter = userBranch || 'All';
    setBranchFilter(nextBranchFilter);
    setCategoryFilter('All');
    setProductFilter('All');
    setGradeFilter('All');
  }, [userBranch]);

  // Get all products from branch stock (exclude central inventory)
  const allProducts = branchStock
    .filter(stock => stock.branchLocation !== 'central')
    .map(stock => {
      // Resolve dealer name: branchStock.dealerName → product lookup → fallback
      const matchedProduct = products.find(p => p.id === stock.productId);
      const dealerName = stock.dealerName || matchedProduct?.dealerName || 'Unknown Dealer';
      const dealerId = stock.dealerId || matchedProduct?.dealerId || '';

      return {
        id: stock.id,
        productId: stock.productId,
        name: stock.productName,
        category: stock.category,
        grade: (stock.grade || matchedProduct?.grade || '') as string,
        price: stock.sellingPriceMax,
        stock: stock.freshQuantity,
        image: matchedProduct?.images?.[0] || '',
        dealer: dealerName,
        dealerId: dealerId,
        branchLocation: stock.branchLocation,
        sku: stock.sku,
      };
    });

  // ── Cascade 1: Branch → all others
  const stockBranchOptions = Array.from(new Set<string>(allProducts.map(p => formatBranch(p.branchLocation as string))));
  const masterBranchOptions = branchMaster
    .filter(b => b.location !== 'central')
    .map(b => formatBranch(b.location));
  const branchOptions: string[] = ['All', ...Array.from(new Set<string>([...masterBranchOptions, ...stockBranchOptions]))];

  // ── Cascade 2: Category options filtered by branch
  const afterBranch = branchFilter === 'All'
    ? allProducts
    : allProducts.filter(p => formatBranch(p.branchLocation as string) === branchFilter);
  const categories: string[] = ['All', ...Array.from(new Set<string>(afterBranch.map(p => p.category as string)))];

  // ── Cascade 3: Product options filtered by branch + category
  const afterCategory = categoryFilter === 'All' ? afterBranch : afterBranch.filter(p => (p.category as string).toLowerCase() === categoryFilter.toLowerCase());
  const productNames: string[] = ['All', ...Array.from(new Set<string>(afterCategory.map(p => p.name as string)))];

  // ── Cascade 4: Grade options filtered by branch + category + product
  const afterProduct = productFilter === 'All' ? afterCategory : afterCategory.filter(p => (p.name as string) === productFilter);
  const grades: string[] = ['All', ...Array.from(new Set<string>(afterProduct.map(p => p.grade as string).filter(g => !!g)))];

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      description: '',
      price: product.price,
      stock: product.stock,
      dealerId: product.dealerId || 'dealer-1',
      dealerName: product.dealer,
      enabled: true,
      images: [product.image],
      specifications: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }, 1);

    toast.success('Added to cart!', {
      description: `${product.name} has been added to your cart`
    });
  };

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = branchFilter === 'All' || formatBranch(product.branchLocation as string) === branchFilter;
    const matchesCategory = categoryFilter === 'All' || (product.category as string).toLowerCase() === categoryFilter.toLowerCase();
    const matchesProduct = productFilter === 'All' || (product.name as string) === productFilter;
    const matchesGrade = gradeFilter === 'All' || (product.grade as string) === gradeFilter;
    const matchesStock = stockFilter === 'All' ||
      (stockFilter === 'in-stock' && (product.stock as number) > 10) ||
      (stockFilter === 'low-stock' && (product.stock as number) > 0 && (product.stock as number) <= 10) ||
      (stockFilter === 'out-of-stock' && (product.stock as number) === 0);
    return matchesSearch && matchesBranch && matchesCategory && matchesProduct && matchesGrade && matchesStock;
  }).sort((a, b) => (a.name as string).localeCompare(b.name as string));

  const getStockStatus = (stock: number) => {
    if (stock > 10) return { color: 'text-emerald-700', bg: 'bg-emerald-500/20', text: 'In Stock', pulse: false };
    if (stock > 0) return { color: 'text-yellow-700', bg: 'bg-yellow-500/20', text: 'Low Stock', pulse: true };
    return { color: 'text-red-700', bg: 'bg-red-500/20', text: 'Out of Stock', pulse: false };
  };

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#FFF8F0] via-[#FFF8F0] to-[#FFE4B5]/30 min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#B8860B]/10 to-[#DAA520]/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-10 h-10 text-[#B8860B]" />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] bg-clip-text text-transparent">
              Product Catalog
            </h1>
            <p className="text-[#6B6B6B] text-lg">
              Discover our premium granite & marble collection
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative z-10">
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-6 space-y-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B6B] group-hover:text-[#B8860B] transition-colors" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="pl-12 h-14 bg-[#FFF8F0] border-2 border-[#B8860B]/20 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 text-[#1A1A1A] placeholder:text-[#6B6B6B] text-lg rounded-xl"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Sparkles className="w-5 h-5 text-[#DAA520]" />
              </div>
            </div>

            {/* Filters — full cascade: Branch → Category → Product → Grade → Stock */}
            <div className="flex flex-wrap gap-4">

              {/* Branch */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm text-[#6B6B6B] mb-2 block font-semibold">Branch</label>
                <select
                  value={branchFilter}
                  onChange={(e) => { setBranchFilter(e.target.value); setCategoryFilter('All'); setProductFilter('All'); setGradeFilter('All'); }}
                  className="w-full h-12 bg-[#FFF8F0] border-2 border-[#B8860B]/20 text-[#1A1A1A] rounded-xl px-4 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 focus:outline-none font-medium cursor-pointer"
                >
                  {branchOptions.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Category — dynamic based on branch */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm text-[#6B6B6B] mb-2 block font-semibold">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setProductFilter('All'); setGradeFilter('All'); }}
                  className="w-full h-12 bg-[#FFF8F0] border-2 border-[#B8860B]/20 text-[#1A1A1A] rounded-xl px-4 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 focus:outline-none font-medium cursor-pointer"
                >
                  {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              {/* Product — dynamic based on branch + category */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm text-[#6B6B6B] mb-2 block font-semibold">Product</label>
                <select
                  value={productFilter}
                  onChange={(e) => { setProductFilter(e.target.value); setGradeFilter('All'); }}
                  className="w-full h-12 bg-[#FFF8F0] border-2 border-[#B8860B]/20 text-[#1A1A1A] rounded-xl px-4 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 focus:outline-none font-medium cursor-pointer"
                >
                  {productNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Grade — dynamic based on branch + category + product */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm text-[#6B6B6B] mb-2 block font-semibold">Grade</label>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full h-12 bg-[#FFF8F0] border-2 border-[#B8860B]/20 text-[#1A1A1A] rounded-xl px-4 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 focus:outline-none font-medium cursor-pointer"
                >
                  {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Stock Status */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-sm text-[#6B6B6B] mb-2 block font-semibold">Stock Status</label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full h-12 bg-[#FFF8F0] border-2 border-[#B8860B]/20 text-[#1A1A1A] rounded-xl px-4 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 focus:outline-none font-medium cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between relative z-10">
        <p className="text-[#6B6B6B] font-medium">
          Showing <span className="text-[#B8860B] font-bold">{filteredProducts.length}</span> products
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
        {filteredProducts.map((product, index) => {
          const stockStatus = getStockStatus(product.stock);
          
          return (
            <div
              key={product.id}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
              className="transition-transform duration-300 hover:-translate-y-3"
            >
              <Card className="border-0 bg-white/90 backdrop-blur-xl hover:bg-white hover:shadow-2xl hover:shadow-[#B8860B]/20 transition-all duration-300 h-full flex flex-col overflow-hidden group relative">
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Product Image */}
                  <div className="relative h-56 bg-gradient-to-br from-[#FFF8F0] to-[#FFE4B5]/30 rounded-t-xl overflow-hidden">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-[#B8860B]/40" />
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Stock Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md ${stockStatus.bg} ${stockStatus.color} shadow-lg`}>
                        {stockStatus.text}
                      </span>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-[#B8860B] shadow-lg hover:scale-110 transition-transform duration-200">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-5 flex-1 flex flex-col bg-white">
                    <h3 className="font-bold text-[#1A1A1A] mb-2 line-clamp-2 text-lg group-hover:text-[#B8860B] transition-colors">
                      {product.name}
                    </h3>

                    <div className="space-y-2 text-sm text-[#6B6B6B] mb-4">
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-[#1A1A1A]">Dealer:</span> {product.dealer}
                      </p>
                      <p className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span className="font-medium">{product.stock} units</span>
                      </p>
                      <p className="text-xs">SKU: <span className="font-mono">{product.sku}</span></p>
                      <p className="text-xs capitalize">
                        Branch: <span className="font-semibold">{product.branchLocation.replace('-', ' ')}</span>
                      </p>
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <p className="text-xs text-[#6B6B6B] mb-1">Price</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
                            ₹{product.price.toLocaleString()}
                          </p>
                        </div>
                        {hoveredProduct === product.id && (
                          <div>
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                          </div>
                        )}
                      </div>

                      {/* AI Visualizer Button */}
                      <div className="mb-3">
                        <Button
                          onClick={() => setSelectedProductForAI(product)}
                          className="relative overflow-hidden w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 text-white font-bold shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 border-0 rounded-xl group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Wand2 className="w-5 h-5 mr-2" />
                          AI Visualizer
                        </Button>
                      </div>

                      {/* Add to Cart Button */}
                      <div>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className="relative overflow-hidden w-full h-12 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white font-bold shadow-lg hover:shadow-2xl hover:shadow-[#B8860B]/50 disabled:opacity-50 disabled:cursor-not-allowed border-0 rounded-xl group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="relative z-10">
          <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-16 text-center">
              <div>
                <Package className="w-20 h-20 text-[#6B6B6B] mx-auto mb-6" />
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1A] mb-3">No products found</h3>
              <p className="text-[#6B6B6B] text-lg">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Visualizer Modal */}
      {selectedProductForAI && (
        <ProductVisualizerAI
          product={selectedProductForAI}
          onClose={() => setSelectedProductForAI(null)}
        />
      )}
    </div>
  );
};