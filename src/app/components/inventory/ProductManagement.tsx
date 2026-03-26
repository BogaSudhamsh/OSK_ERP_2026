import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Plus, Edit, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export const ProductManagement: React.FC = () => {
  const { products, dealers, updateProduct, addProduct } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    stock: '',
    dealerId: '',
    enabled: true,
  });

  const categories = ['Marble', 'Granite', 'Tiles', 'Quartz'];
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 10);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const disabledProducts = products.filter(p => !p.enabled);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dealer = dealers.find(d => d.id === formData.dealerId);
    if (!dealer) return;

    if (editingProduct) {
      updateProduct(editingProduct, {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        dealerName: dealer.name,
      });
      toast.success('Product updated successfully');
    } else {
      addProduct({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        dealerName: dealer.name,
        enabled: formData.enabled,
        images: [],
        specifications: {},
      });
      toast.success('Product added successfully');
    }

    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      price: '',
      stock: '',
      dealerId: '',
      enabled: true,
    });
  };

  const handleEdit = (product: typeof products[0]) => {
    setEditingProduct(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      dealerId: product.dealerId,
      enabled: product.enabled,
    });
    setIsDialogOpen(true);
  };

  const handleToggleEnabled = (productId: string, enabled: boolean) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    updateProduct(productId, { enabled });
    
    if (enabled) {
      toast.success(`${product.name} enabled - Now visible and purchasable in Store App`);
    } else {
      toast.info(`${product.name} disabled - Will show as "Out of Stock" in Store App but remains visible`, {
        duration: 4000,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
            Product & Dealer Management
          </h2>
          <p className="text-[#6B6B6B] mt-1">Manage product catalog, stock availability, and dealer information</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setFormData({
              name: '',
              category: '',
              description: '',
              price: '',
              stock: '',
              dealerId: '',
              enabled: true,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B]">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information' : 'Add a new product to the catalog'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dealer">Dealer *</Label>
                  <Select value={formData.dealerId} onValueChange={(value) => setFormData({ ...formData, dealerId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dealer" />
                    </SelectTrigger>
                    <SelectContent>
                      {dealers.map(dealer => (
                        <SelectItem key={dealer.id} value={dealer.id}>{dealer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                    <div>
                      <Label className="cursor-pointer">Enable product for sale</Label>
                      <p className="text-xs text-[#6B6B6B] mt-1">
                        ✅ <strong>Enabled:</strong> Product is visible and purchasable in Store App
                        <br />
                        ❌ <strong>Disabled:</strong> Product shows as "Out of Stock" but remains visible
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-[#B8860B] to-[#DAA520]">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#B8860B]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#B8860B]">{products.length}</div>
            <p className="text-xs text-[#6B6B6B] mt-1">
              {products.filter(p => p.enabled).length} enabled • {disabledProducts.length} disabled
            </p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-800">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">{lowStockProducts.length}</div>
            <p className="text-xs text-yellow-700 mt-1">Products need restocking</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-800">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{outOfStockProducts.length}</div>
            <p className="text-xs text-red-700 mt-1">Products unavailable</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800">Disabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{disabledProducts.length}</div>
            <p className="text-xs text-blue-700 mt-1">Shown as "Out of Stock"</p>
          </CardContent>
        </Card>
      </div>

      {/* Important Note about Enable/Disable Logic */}
      <Card className="border-blue-300 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-900">Enable / Disable Logic (Important ✔)</p>
              <div className="space-y-1 text-blue-800">
                <p>❌ <strong>Disable product:</strong> Stock = 0 → Product still visible in Store App → Shows "Out of Stock"</p>
                <p>✅ <strong>Enable product:</strong> New stock received → Product becomes purchasable again</p>
                <p className="text-xs text-blue-700 mt-2">This ensures: No confusion • No hidden products • Transparent availability</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Products ({products.length})</TabsTrigger>
          <TabsTrigger value="enabled">Enabled ({products.filter(p => p.enabled).length})</TabsTrigger>
          <TabsTrigger value="disabled">Disabled ({disabledProducts.length})</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock ({lowStockProducts.length})</TabsTrigger>
          <TabsTrigger value="out-of-stock">Out of Stock ({outOfStockProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onEdit={handleEdit}
              onToggleEnabled={handleToggleEnabled}
            />
          ))}
        </TabsContent>

        <TabsContent value="enabled" className="space-y-4">
          {products.filter(p => p.enabled).map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onEdit={handleEdit}
              onToggleEnabled={handleToggleEnabled}
            />
          ))}
        </TabsContent>

        <TabsContent value="disabled" className="space-y-4">
          {disabledProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onEdit={handleEdit}
              onToggleEnabled={handleToggleEnabled}
            />
          ))}
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          {lowStockProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onEdit={handleEdit}
              onToggleEnabled={handleToggleEnabled}
            />
          ))}
        </TabsContent>

        <TabsContent value="out-of-stock" className="space-y-4">
          {outOfStockProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onEdit={handleEdit}
              onToggleEnabled={handleToggleEnabled}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ProductCard: React.FC<{
  product: any;
  index: number;
  onEdit: (product: any) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
}> = ({ product, index, onEdit, onToggleEnabled }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <Card className="border-[#B8860B]/20 hover:border-[#B8860B]/40 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FFF8F0] to-[#DAA520]/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#B8860B]/20">
            <Package className="h-8 w-8 text-[#B8860B]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-[#6B6B6B]">{product.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={product.enabled}
                  onCheckedChange={(checked) => onToggleEnabled(product.id, checked)}
                />
                <Button size="icon" variant="outline" onClick={() => onEdit(product)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <Badge className="bg-[#B8860B] hover:bg-[#DAA520]">{product.category}</Badge>
              <div className="flex items-center gap-1">
                <span className="text-[#6B6B6B]">Good Stock:</span>
                {product.stock === 0 ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Out of Stock
                  </Badge>
                ) : product.stock <= 10 ? (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {product.stock} units
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3" />
                    {product.stock} units
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#6B6B6B]">Broken / Damaged:</span>
                {(product.brokenQuantity || 0) > 0 ? (
                  <Badge className="flex items-center gap-1 bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/30">
                    <AlertTriangle className="h-3 w-3" />
                    {product.brokenQuantity} units
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3" />
                    0
                  </Badge>
                )}
              </div>
              <div>
                <span className="text-[#6B6B6B]">Price:</span>
                <span className="ml-2 font-semibold text-[#B8860B]">
                  ₹{product.price.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[#6B6B6B]">Dealer:</span>
                <span className="ml-2 font-medium">{product.dealerName}</span>
              </div>
              <div>
                <span className="text-[#6B6B6B]">Status:</span>
                <Badge variant={product.enabled ? 'default' : 'secondary'} className={product.enabled ? 'ml-2 bg-green-600' : 'ml-2'}>
                  {product.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);