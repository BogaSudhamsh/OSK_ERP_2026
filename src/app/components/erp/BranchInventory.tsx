import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useApp } from '@/app/context/AppContext';
import {
  Package,
  Search,
  Filter,
  MapPin,
  AlertTriangle,
  Check,
  X,
  Pencil,
  Box,
  Layers,
  TrendingUp,
  Plus,
  ArrowLeftRight,
} from 'lucide-react';

interface BranchInventoryProps {
  branchId: string;
  branchLocation: string;
  userRole?: 'super-admin' | 'branch-admin' | 'stock-manager';
  onNavigate?: (screen: string) => void;
}

export const BranchInventory: React.FC<BranchInventoryProps> = ({
  branchId,
  branchLocation,
  userRole = 'stock-manager',
  onNavigate,
}) => {
  const { branchStock, branches, updateBranchStockRack, splitBranchStock } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [editingRackId, setEditingRackId] = useState<string | null>(null);
  const [editRackValue, setEditRackValue] = useState('');
  
  // Rack Transfer State
  const [transferItem, setTransferItem] = useState<any>(null);
  const [transferQty, setTransferQty] = useState('');
  const [transferTargetRack, setTransferTargetRack] = useState('');

  // Data — only own branch stock
  const ownBranch = branches.find(b => b.id === branchId);
  const ownStock = branchStock.filter(s => s.branchId === branchId);

  // Dynamic filter options from own stock
  const categories = Array.from(new Set(ownStock.map(s => s.category))).sort();
  const grades = Array.from(new Set(ownStock.map(s => s.grade).filter(Boolean))).sort() as string[];
  const productNames = Array.from(new Set(ownStock.map(s => s.productName))).sort();
  const sizes = Array.from(new Set(ownStock.map(s => s.size).filter(Boolean))).sort() as string[];

  // Filtered stock
  const filteredStock = ownStock.filter(s => {
    const matchesSearch = searchQuery.trim() === '' ||
      s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.rackLocation || '').toUpperCase().includes(searchQuery.toUpperCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const matchesGrade = gradeFilter === 'all' || s.grade === gradeFilter;
    const matchesProduct = productFilter === 'all' || s.productName === productFilter;
    const matchesSize = sizeFilter === 'all' || s.size === sizeFilter;
    return matchesSearch && matchesCategory && matchesGrade && matchesProduct && matchesSize;
  });

  // Missing rack items
  const missingRackItems = ownStock.filter(s => !s.rackLocation || s.rackLocation.trim() === '');

  // Stats
  const totalProducts = ownStock.length;
  const totalFreshQty = ownStock.reduce((sum, s) => sum + s.freshQuantity, 0);
  const totalStockValue = ownStock.reduce((sum, s) => sum + s.freshQuantity * s.costPrice, 0);
  const totalBrokenQty = ownStock.reduce((sum, s) => sum + s.brokenQuantity, 0);
  const uniqueRacks = new Set(ownStock.map(s => s.rackLocation).filter(Boolean)).size;

  // Active filter count
  const activeFilterCount = [categoryFilter, gradeFilter, productFilter, sizeFilter].filter(f => f !== 'all').length;

  // Rack helpers
  const validateRack = (rack: string): boolean => /^[A-Za-z0-9]+$/.test(rack.trim());
  const normalizeRack = (rack: string): string => rack.trim().toUpperCase();

  const handleSaveRack = (stockId: string) => {
    const normalized = normalizeRack(editRackValue);
    if (!normalized) { toast.error('Rack location cannot be empty'); return; }
    if (!validateRack(normalized)) { toast.error('Rack code must be alphanumeric (e.g., A1, B12)'); return; }
    updateBranchStockRack(stockId, normalized);
    setEditingRackId(null);
    setEditRackValue('');
    toast.success(`Rack updated to ${normalized}`);
  };

  const handleSplitSubmit = () => {
    if (!transferItem) return;
    const qty = parseInt(transferQty);
    if (isNaN(qty) || qty <= 0 || qty > transferItem.freshQuantity) {
      toast.error('Invalid transfer quantity');
      return;
    }
    const normalizedTarget = normalizeRack(transferTargetRack);
    if (!normalizedTarget || !validateRack(normalizedTarget)) {
      toast.error('Invalid target rack code (e.g. A1, B2)');
      return;
    }
    if (normalizedTarget === transferItem.rackLocation) {
      toast.error('Target rack must be different from current rack');
      return;
    }
    splitBranchStock(transferItem.id, qty, normalizedTarget);
    toast.success(`Successfully moved ${qty} items to rack ${normalizedTarget}`);
    setTransferItem(null);
    setTransferQty('');
    setTransferTargetRack('');
  };

  const clearAllFilters = () => {
    setCategoryFilter('all');
    setGradeFilter('all');
    setProductFilter('all');
    setSizeFilter('all');
    setSearchQuery('');
  };

  const branchDisplayName = ownBranch?.name.replace('OSK Granite - ', '') || branchLocation;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-white to-[#FFF8F0] p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#2C2C2C] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                Branch Inventory
              </h1>
              <p className="text-[#6B6B6B] mt-1 ml-13">
                {ownBranch?.name || 'Branch'} — {userRole === 'stock-manager' ? 'Stock Manager' : 'Admin'} View
              </p>
            </div>

            {/* Add Stock Button */}
            <Button
              onClick={() => onNavigate?.('stock-inward')}
              className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Stock
            </Button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          {[
            { label: 'Products', value: totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            { label: 'Fresh Stock', value: totalFreshQty.toLocaleString(), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
            { label: 'Stock Value', value: `₹${totalStockValue.toLocaleString('en-IN')}`, icon: Layers, color: 'text-[#B8860B]', bg: 'bg-[#FFF8F0]', border: 'border-[#B8860B]/20' },
            { label: 'Broken', value: totalBrokenQty, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
            { label: 'Racks Used', value: uniqueRacks, icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
          ].map((stat) => (
            <Card key={stat.label} className={`border ${stat.border}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-[#6B6B6B]">{stat.label}</p>
                  <p className="text-lg font-bold text-[#2C2C2C]">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Missing Rack Warning */}
        {missingRackItems.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-2 border-orange-400 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900">
                      {missingRackItems.length} product(s) missing rack locations
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      Rack location must be assigned before performing stock operations.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {missingRackItems.map(item => {
                        const isEditing = editingRackId === item.id;
                        return (
                          <div key={item.id} className="flex items-center gap-2 bg-white border border-orange-200 rounded-lg px-3 py-2">
                            <span className="text-sm font-medium text-[#2C2C2C]">{item.productName}</span>
                            {isEditing ? (
                              <>
                                <Input
                                  value={editRackValue}
                                  onChange={(e) => setEditRackValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRack(item.id); }}
                                  placeholder="A1"
                                  className="w-20 h-7 text-sm border-orange-300"
                                  autoFocus
                                />
                                <button onClick={() => handleSaveRack(item.id)} className="text-green-600 hover:text-green-700">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => { setEditingRackId(null); setEditRackValue(''); }} className="text-[#6B6B6B] hover:text-[#2C2C2C]">
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => { setEditingRackId(item.id); setEditRackValue(''); }}
                                className="text-orange-600 hover:text-orange-700 text-xs font-medium underline"
                              >
                                Assign Rack
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {/* Search Row */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8860B]/50" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, SKU, or rack code..."
                className="pl-9 border-[#B8860B]/20 focus:border-[#B8860B]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#2C2C2C]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-[#B8860B] font-medium">
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="bg-[#B8860B] text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className={`w-[150px] border-[#B8860B]/20 text-sm h-9 ${categoryFilter !== 'all' ? 'border-[#B8860B] bg-[#FFF8F0]' : ''}`}>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Grade Filter */}
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className={`w-[140px] border-[#B8860B]/20 text-sm h-9 ${gradeFilter !== 'all' ? 'border-[#B8860B] bg-[#FFF8F0]' : ''}`}>
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Product Filter */}
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className={`w-[200px] border-[#B8860B]/20 text-sm h-9 ${productFilter !== 'all' ? 'border-[#B8860B] bg-[#FFF8F0]' : ''}`}>
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {productNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Size Filter */}
            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className={`w-[150px] border-[#B8860B]/20 text-sm h-9 ${sizeFilter !== 'all' ? 'border-[#B8860B] bg-[#FFF8F0]' : ''}`}>
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                {sizes.map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear All */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-[#B8860B] hover:text-[#DAA520] underline font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </motion.div>

        {/* Inventory Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-[#B8860B]/20">
            <CardHeader className="bg-gradient-to-r from-[#FFF8F0] to-white border-b border-[#B8860B]/10 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-[#2C2C2C] flex items-center gap-2">
                  <Box className="w-5 h-5 text-[#B8860B]" />
                  {branchDisplayName} Stock
                  <Badge className="bg-[#B8860B]/10 text-[#B8860B] border-[#B8860B]/20" variant="outline">
                    {filteredStock.length} items
                  </Badge>
                </CardTitle>
                {filteredStock.length !== ownStock.length && (
                  <p className="text-xs text-[#6B6B6B]">
                    Showing {filteredStock.length} of {ownStock.length} products
                  </p>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#B8860B]/5 to-[#DAA520]/5 border-b border-[#B8860B]/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">Grade</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#B8860B] uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1"><MapPin className="w-3.5 h-3.5" />Rack</div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">Fresh</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">Broken</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">Price Range</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#B8860B]/5">
                    {filteredStock.length > 0 ? (
                      filteredStock.map((item, index) => {
                        const isEditingRack = editingRackId === item.id;
                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className="hover:bg-[#FFF8F0]/50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#2C2C2C] text-sm">{item.productName}</p>
                              {item.dealerName && <p className="text-xs text-[#6B6B6B]">{item.dealerName}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-mono text-[#6B6B6B]">{item.sku}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className="text-xs capitalize">{item.category}</Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.grade ? (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    item.grade === 'Premium'
                                      ? 'bg-[#FFF8F0] text-[#B8860B] border-[#B8860B]/30'
                                      : item.grade === 'Diamond'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  {item.grade}
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs text-[#6B6B6B]">{item.size || '—'}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isEditingRack ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Input
                                    value={editRackValue}
                                    onChange={(e) => setEditRackValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRack(item.id);
                                      if (e.key === 'Escape') { setEditingRackId(null); setEditRackValue(''); }
                                    }}
                                    className="w-16 h-7 text-sm text-center border-[#B8860B]/40"
                                    autoFocus
                                  />
                                  <button onClick={() => handleSaveRack(item.id)} className="text-green-600 hover:text-green-700 p-0.5"><Check className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => { setEditingRackId(null); setEditRackValue(''); }} className="text-[#6B6B6B] hover:text-[#2C2C2C] p-0.5"><X className="w-3.5 h-3.5" /></button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => { setEditingRackId(item.id); setEditRackValue(item.rackLocation || ''); }}
                                    className="group inline-flex items-center gap-1"
                                  >
                                    {item.rackLocation ? (
                                      <Badge className="bg-[#B8860B]/10 text-[#B8860B] border-[#B8860B]/20 font-mono" variant="outline">
                                        <MapPin className="w-3 h-3 mr-1" />{item.rackLocation}
                                        <Pencil className="w-2.5 h-2.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-orange-50 text-orange-600 border-orange-200" variant="outline">
                                        No Rack
                                      </Badge>
                                    )}
                                  </button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-[#6B6B6B] hover:text-[#B8860B] hover:bg-[#FFF8F0]"
                                    title="Move/Split Rack"
                                    onClick={() => {
                                      setTransferItem(item);
                                      setTransferQty(item.freshQuantity.toString());
                                      setTransferTargetRack('');
                                    }}
                                  >
                                    <ArrowLeftRight className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge className={item.freshQuantity < 100 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
                                {item.freshQuantity.toLocaleString()}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className={item.brokenQuantity > 0 ? 'border-orange-300 text-orange-700 bg-orange-50' : 'border-gray-200 text-gray-400'}>
                                {item.brokenQuantity}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm font-semibold text-[#B8860B]">₹{item.sellingPriceMax.toLocaleString('en-IN')}</p>
                              <p className="text-xs text-[#6B6B6B]">Min: ₹{item.sellingPriceMin.toLocaleString('en-IN')}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="font-bold text-[#2C2C2C]">₹{(item.freshQuantity * item.costPrice).toLocaleString('en-IN')}</p>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center">
                          <Package className="w-12 h-12 text-[#B8860B]/20 mx-auto mb-3" />
                          <p className="text-[#6B6B6B]">
                            {searchQuery || activeFilterCount > 0
                              ? 'No products match your filters'
                              : 'No stock in this branch'}
                          </p>
                          {activeFilterCount > 0 && (
                            <button
                              onClick={clearAllFilters}
                              className="mt-2 text-sm text-[#B8860B] hover:text-[#DAA520] underline"
                            >
                              Clear all filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Rack Transfer Modal */}
      <Dialog open={!!transferItem} onOpenChange={(open) => !open && setTransferItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#B8860B]">
              <ArrowLeftRight className="w-5 h-5" />
              Move / Split Rack
            </DialogTitle>
            <DialogDescription>
              Transfer {transferItem?.productName} from <strong>{transferItem?.rackLocation || 'Unassigned'}</strong> to a new rack.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="qty">Quantity to Move (Max: {transferItem?.freshQuantity})</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                max={transferItem?.freshQuantity}
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                className="border-[#B8860B]/20 focus-visible:ring-[#B8860B]"
              />
              {parseInt(transferQty) < transferItem?.freshQuantity && parseInt(transferQty) > 0 && (
                <p className="text-xs text-[#6B6B6B]">
                  This will split the stock: {transferItem.freshQuantity - parseInt(transferQty)} will stay in {transferItem.rackLocation}, {transferQty} will move.
                </p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="newRack">New Rack Location</Label>
              <Input
                id="newRack"
                value={transferTargetRack}
                onChange={(e) => setTransferTargetRack(e.target.value.toUpperCase())}
                placeholder="e.g. B2, RACK-5"
                className="border-[#B8860B]/20 focus-visible:ring-[#B8860B] uppercase font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferItem(null)}>Cancel</Button>
            <Button onClick={handleSplitSubmit} className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white">
              Confirm Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
