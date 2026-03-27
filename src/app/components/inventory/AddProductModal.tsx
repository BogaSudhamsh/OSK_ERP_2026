import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/app/context/AppContext';
import {
  fetchLookupItems,
  subscribeToLookupItems,
  addLookupItem,
  deleteLookupItem,
} from '@/app/services/lookupService';
import type { LookupItem, LookupCollectionName } from '@/app/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Package, MapPin, Receipt, Check, Plus, X, ChevronDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { BranchLocation } from '@/app/types';

// ── Reusable Custom Dropdown with inline delete ────────────────────
interface DropdownWithDeleteProps {
  label: string;
  placeholder: string;
  items: LookupItem[];
  value: string;
  onSelect: (value: string) => void;
  onDelete: (item: LookupItem) => void;
  onAddNew: () => void;
  addNewLabel: string;
}

const DropdownWithDelete: React.FC<DropdownWithDeleteProps> = ({
  label,
  placeholder,
  items,
  value,
  onSelect,
  onDelete,
  onAddNew,
  addNewLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const enabledItems = items.filter((i) => i.enabled);

  const handleDeleteItem = (e: React.MouseEvent, item: LookupItem) => {
    e.stopPropagation();
    if (enabledItems.length <= 1) {
      toast.error('Cannot delete the last item. Add a new one first.');
      return;
    }
    onDelete(item);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <Label className="text-sm font-medium">{label}</Label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`mt-1 w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors text-left ${
          isOpen
            ? 'border-[#B8860B] ring-1 ring-[#B8860B]/30'
            : 'border-[#B8860B]/20 hover:border-[#B8860B]/40'
        } bg-white`}
      >
        <span className={value ? 'text-[#1A1A1A]' : 'text-[#9CA3AF]'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#6B6B6B] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            {enabledItems.map((item) => (
              <div
                key={item.id}
                className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                  value === item.name
                    ? 'bg-[#B8860B]/10 text-[#B8860B]'
                    : 'hover:bg-gray-50 text-[#1A1A1A]'
                }`}
                onClick={() => {
                  onSelect(item.name);
                  setIsOpen(false);
                }}
              >
                <span className="text-sm flex-1 truncate pr-2">{item.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(e, item)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-amber-100 text-[#B8860B]/50 hover:text-[#B8860B] transition-all shrink-0"
                  title={`Delete "${item.name}"`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add New option */}
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer text-[#B8860B] hover:bg-[#FFF8F0] border-t border-gray-100 font-medium"
              onClick={() => {
                onAddNew();
                setIsOpen(false);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-sm">{addNewLabel}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Modal ─────────────────────────────────────────────────────
interface AddProductModalProps {
  dealerId: string;
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ dealerId, open, isOpen, onClose }) => {
  const { addProduct, dealers, branches, createPendingBill } = useApp();
  const dealer = dealers.find(d => d.id === dealerId);
  const modalOpen = open ?? isOpen ?? false;
  
  const [formData, setFormData] = useState({
    name: '',
    itemName: '',
    category: '',
    size: '',
    grade: '',
    price: '',
    stock: '',
    description: '',
  });

  const [selectedBranches, setSelectedBranches] = useState<string[]>([
    'aziz-nagar',
    'vikarabad', 
    'sangareddy'
  ]);

  // Per-branch rack location mapping
  const [branchRackMap, setBranchRackMap] = useState<Record<string, string>>({});

  const handleRackChange = (branchLocation: string, rack: string) => {
    setBranchRackMap(prev => ({ ...prev, [branchLocation]: rack.toUpperCase() }));
  };

  const validateRack = (rack: string): boolean => /^[A-Za-z0-9]+$/.test(rack.trim());

  // ── Lookup state (LookupItem[] from Firestore) ───────────────────
  const [productNameItems, setProductNameItems] = useState<LookupItem[]>([]);
  const [categoryItems, setCategoryItems] = useState<LookupItem[]>([]);
  const [sizeItems, setSizeItems] = useState<LookupItem[]>([]);
  const [gradeItems, setGradeItems] = useState<LookupItem[]>([]);
  const [itemNameItems, setItemNameItems] = useState<LookupItem[]>([]);

  // ── Inline "add new" input toggles ───────────────────────────────
  const [showNewProductInput, setShowNewProductInput] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewSizeInput, setShowNewSizeInput] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');
  const [showNewGradeInput, setShowNewGradeInput] = useState(false);
  const [newGradeName, setNewGradeName] = useState('');
  const [showNewItemNameInput, setShowNewItemNameInput] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // ── Load all 4 lookup collections from Firestore + real-time sync ─
  useEffect(() => {
    // Initial fetch (parallel)
    fetchLookupItems('productNames').then(setProductNameItems);
    fetchLookupItems('categories').then(setCategoryItems);
    fetchLookupItems('sizes').then(setSizeItems);
    fetchLookupItems('grades').then(setGradeItems);
    fetchLookupItems('itemNames').then(setItemNameItems);

    // Real-time listeners
    const unsub1 = subscribeToLookupItems('productNames', setProductNameItems);
    const unsub2 = subscribeToLookupItems('categories', setCategoryItems);
    const unsub3 = subscribeToLookupItems('sizes', setSizeItems);
    const unsub4 = subscribeToLookupItems('grades', setGradeItems);
    const unsub5 = subscribeToLookupItems('itemNames', setItemNameItems);

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, []);

  // ── Generic add handler ──────────────────────────────────────────
  const handleAddNew = async (
    collectionName: LookupCollectionName,
    rawName: string,
    currentItems: LookupItem[],
    formField: string,
    resetInput: () => void,
    hideInput: () => void,
    uppercase: boolean = false,
  ) => {
    const trimmed = uppercase ? rawName.trim().toUpperCase() : rawName.trim();
    if (!trimmed) { toast.error('Please enter a name'); return; }
    if (currentItems.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('This item already exists'); return;
    }
    try {
      await addLookupItem(collectionName, trimmed, currentItems);
      handleChange(formField, trimmed);
      resetInput();
      hideInput();
      toast.success(`"${trimmed}" added to ${collectionName}`);
    } catch (err) {
      console.error(`[AddProductModal] Failed to add to ${collectionName}:`, err);
      toast.error('Failed to add item. Try again.');
    }
  };

  // ── Generic delete handler ───────────────────────────────────────
  const handleDeleteItem = async (
    collectionName: LookupCollectionName,
    item: LookupItem,
    formField: string,
    currentFormValue: string,
  ) => {
    // Don't delete default-* (not yet in Firestore)
    if (item.id.startsWith('default-')) {
      toast.error('Seed the database first to manage this item.');
      return;
    }
    try {
      await deleteLookupItem(collectionName, item.id);
      if (currentFormValue === item.name) handleChange(formField, '');
      toast.success(`"${item.name}" removed from ${collectionName}`);
    } catch (err) {
      console.error(`[AddProductModal] Failed to delete from ${collectionName}:`, err);
      toast.error('Failed to delete item. Try again.');
    }
  };

  // ── Shorthand wrappers for each collection ───────────────────────
  const handleAddCustomProduct = () =>
    handleAddNew('productNames', newProductName, productNameItems, 'name', () => setNewProductName(''), () => setShowNewProductInput(false), true);
  const handleDeleteProduct = (item: LookupItem) =>
    handleDeleteItem('productNames', item, 'name', formData.name);

  const handleAddCustomCategory = () =>
    handleAddNew('categories', newCategoryName, categoryItems, 'category', () => setNewCategoryName(''), () => setShowNewCategoryInput(false));
  const handleDeleteCategory = (item: LookupItem) =>
    handleDeleteItem('categories', item, 'category', formData.category);

  const handleAddCustomSize = () =>
    handleAddNew('sizes', newSizeName, sizeItems, 'size', () => setNewSizeName(''), () => setShowNewSizeInput(false), true);
  const handleDeleteSize = (item: LookupItem) =>
    handleDeleteItem('sizes', item, 'size', formData.size);

  const handleAddCustomGrade = () =>
    handleAddNew('grades', newGradeName, gradeItems, 'grade', () => setNewGradeName(''), () => setShowNewGradeInput(false));
  const handleDeleteGrade = (item: LookupItem) =>
    handleDeleteItem('grades', item, 'grade', formData.grade);

  const handleAddCustomItemName = () =>
    handleAddNew('itemNames', newItemName, itemNameItems, 'itemName', () => setNewItemName(''), () => setShowNewItemNameInput(false));
  const handleDeleteItemName = (item: LookupItem) =>
    handleDeleteItem('itemNames', item, 'itemName', formData.itemName);

  // ── Form handlers ────────────────────────────────────────────────
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // At least one product detail must be filled
    const hasAnyDetail = formData.name || formData.itemName || formData.category || formData.size || formData.grade;
    if (!hasAnyDetail) {
      toast.error('Please fill at least one field (Product, Item Name, Category, Size, or Grade)');
      return;
    }

    if (selectedBranches.length === 0) {
      toast.error('Please select at least one branch');
      return;
    }

    // Validate rack locations for selected branches (if any rack is filled, must be alphanumeric)
    for (const loc of selectedBranches) {
      const rack = (branchRackMap[loc] || '').trim();
      if (rack && !validateRack(rack)) {
        toast.error(`Rack code for ${loc} must be alphanumeric only (e.g., A1, B12)`);
        return;
      }
    }

    const totalAmount = parseFloat(formData.price || '0') * parseInt(formData.stock || '0');

    const newProduct = addProduct({
      name: formData.name,
      itemName: formData.itemName || undefined,
      category: formData.category,
      size: formData.size,
      price: parseFloat(formData.price || '0'),
      stock: parseInt(formData.stock || '0'),
      description: formData.description,
      dealerId: dealerId,
      dealerName: dealer?.name || '',
      enabled: true,
      image: '',
      specifications: {},
      unit: 'sqft',
      minOrderQuantity: 10,
      lastSuppliedDate: new Date(),
      selectedBranches: selectedBranches,
      branchRackMap: branchRackMap,
    });

    const bill = createPendingBill({
      dealerId: dealerId,
      dealerName: dealer?.name || '',
      productId: newProduct.id,
      productName: formData.name,
      category: formData.category,
      quantity: parseInt(formData.stock || '0'),
      pricePerUnit: parseFloat(formData.price || '0'),
      totalAmount: totalAmount,
      targetBranches: selectedBranches as BranchLocation[],
    });

    const branchNames = selectedBranches.map(loc => 
      loc.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ).join(', ');

    toast.success(
      <div>
        <p className="font-semibold">Product Added & Bill Created!</p>
        <p className="text-sm">{formData.name} from {dealer?.name}</p>
        <p className="text-xs text-[#6B6B6B] mt-1">Dispatched to: {branchNames}</p>
        <p className="text-xs text-blue-600 font-medium mt-1">
          Bill {bill.billNumber} - ₹{totalAmount.toLocaleString('en-IN')} - Awaiting Payment
        </p>
      </div>
    );

    handleCloseModal();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCloseModal = () => {
    setFormData({
      name: '',
      itemName: '',
      category: '',
      size: '',
      grade: '',
      price: '',
      stock: '',
      description: '',
    });
    setSelectedBranches(['aziz-nagar', 'vikarabad', 'sangareddy']);
    setBranchRackMap({});
    onClose();
  };

  const totalAmount = formData.price && formData.stock 
    ? parseFloat(formData.price) * parseInt(formData.stock) 
    : 0;

  return (
    <Dialog open={modalOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xl">Add New Product</p>
              <p className="text-sm font-normal text-[#6B6B6B]">
                to {dealer?.name}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleProductSubmit}
          className="space-y-4 mt-4"
        >
          {/* ── Product Name Dropdown ──────────────────────────────── */}
          <div>
            <DropdownWithDelete
              label="Products"
              placeholder="Select a product"
              items={productNameItems}
              value={formData.name}
              onSelect={(val) => handleChange('name', val)}
              onDelete={handleDeleteProduct}
              onAddNew={() => setShowNewProductInput(true)}
              addNewLabel="Add New Product"
            />
            {showNewProductInput && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomProduct(); } }}
                  placeholder="Enter new product name"
                  className="flex-1 border-[#B8860B]/20 focus:border-[#B8860B]"
                  autoFocus
                />
                <Button type="button" size="sm" onClick={handleAddCustomProduct}
                  className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white px-4">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
                <Button type="button" size="sm" variant="outline"
                  onClick={() => { setShowNewProductInput(false); setNewProductName(''); }}
                  className="border-[#B8860B]/20 text-[#6B6B6B] hover:bg-[#FFF8F0]">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* ── Item Name (free text) ─────────────────────────────── */}
          <div>
            <DropdownWithDelete
              label="Item Name"
              placeholder="Select an item name"
              items={itemNameItems}
              value={formData.itemName}
              onSelect={(val) => handleChange('itemName', val)}
              onDelete={handleDeleteItemName}
              onAddNew={() => setShowNewItemNameInput(true)}
              addNewLabel="Add New Item Name"
            />
            {showNewItemNameInput && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomItemName(); } }}
                  placeholder="Enter new item name"
                  className="flex-1 border-[#B8860B]/20 focus:border-[#B8860B]"
                  autoFocus
                />
                <Button type="button" size="sm" onClick={handleAddCustomItemName}
                  className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white px-4">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
                <Button type="button" size="sm" variant="outline"
                  onClick={() => { setShowNewItemNameInput(false); setNewItemName(''); }}
                  className="border-[#B8860B]/20 text-[#6B6B6B] hover:bg-[#FFF8F0]">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* ── Category Dropdown ──────────────────────────────────── */}
          <div>
            <DropdownWithDelete
              label="Category"
              placeholder="Select a category"
              items={categoryItems}
              value={formData.category}
              onSelect={(val) => handleChange('category', val)}
              onDelete={handleDeleteCategory}
              onAddNew={() => setShowNewCategoryInput(true)}
              addNewLabel="Add New Category"
            />
            {showNewCategoryInput && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCategory(); } }}
                  placeholder="Enter new category name"
                  className="flex-1 border-[#B8860B]/20 focus:border-[#B8860B]"
                  autoFocus
                />
                <Button type="button" size="sm" onClick={handleAddCustomCategory}
                  className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white px-4">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
                <Button type="button" size="sm" variant="outline"
                  onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(''); }}
                  className="border-[#B8860B]/20 text-[#6B6B6B] hover:bg-[#FFF8F0]">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* ── Size Dropdown ──────────────────────────────────────── */}
          <div>
            <DropdownWithDelete
              label="Size"
              placeholder="Select a size"
              items={sizeItems}
              value={formData.size}
              onSelect={(val) => handleChange('size', val)}
              onDelete={handleDeleteSize}
              onAddNew={() => setShowNewSizeInput(true)}
              addNewLabel="Add New Size"
            />
            {showNewSizeInput && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSize(); } }}
                  placeholder="Enter new size"
                  className="flex-1 border-[#B8860B]/20 focus:border-[#B8860B]"
                  autoFocus
                />
                <Button type="button" size="sm" onClick={handleAddCustomSize}
                  className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white px-4">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
                <Button type="button" size="sm" variant="outline"
                  onClick={() => { setShowNewSizeInput(false); setNewSizeName(''); }}
                  className="border-[#B8860B]/20 text-[#6B6B6B] hover:bg-[#FFF8F0]">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* ── Grade Dropdown ──────────────────────────────────────── */}
          <div>
            <DropdownWithDelete
              label="Grade"
              placeholder="Select a grade"
              items={gradeItems}
              value={formData.grade}
              onSelect={(val) => handleChange('grade', val)}
              onDelete={handleDeleteGrade}
              onAddNew={() => setShowNewGradeInput(true)}
              addNewLabel="Add New Grade"
            />
            {showNewGradeInput && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={newGradeName}
                  onChange={(e) => setNewGradeName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomGrade(); } }}
                  placeholder="Enter new grade name"
                  className="flex-1 border-[#B8860B]/20 focus:border-[#B8860B]"
                  autoFocus
                />
                <Button type="button" size="sm" onClick={handleAddCustomGrade}
                  className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white px-4">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
                <Button type="button" size="sm" variant="outline"
                  onClick={() => { setShowNewGradeInput(false); setNewGradeName(''); }}
                  className="border-[#B8860B]/20 text-[#6B6B6B] hover:bg-[#FFF8F0]">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Price and Stock in Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" className="text-sm font-medium">
                Price (₹/sqft)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className="mt-1 border-[#B8860B]/20 focus:border-[#B8860B]"
              />
            </div>

            <div>
              <Label htmlFor="stock" className="text-sm font-medium">
                Stock Quantity
              </Label>
              <Input
                id="stock"
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                className="mt-1 border-[#B8860B]/20 focus:border-[#B8860B]"
              />
            </div>
          </div>

          {/* Total Amount Preview */}
          {totalAmount > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Bill Amount:</span>
                <span className="text-2xl font-bold text-blue-700">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {formData.stock} sqft × ₹{formData.price}/sqft
              </p>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Receipt className="w-4 h-4" />
                  <span>A pending bill will be created for branch payment</span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Input
              id="description"
              placeholder="Product details..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="mt-1 border-[#B8860B]/20 focus:border-[#B8860B]"
            />
          </div>

          {/* Branch Selection */}
          <div className="border-2 border-[#B8860B]/20 rounded-xl p-4 bg-[#FFF8F0]/30">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-[#B8860B]" />
              <Label className="text-sm font-semibold text-[#1A1A1A]">
                Select Branches
              </Label>
            </div>
            <p className="text-xs text-[#6B6B6B] mb-3">
              Choose which branches will receive this product & can pay the bill
            </p>
            <div className="space-y-2">
              {branches.map((branch) => {
                const branchName = branch.location.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                
                return (
                  <div key={branch.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                    <Checkbox
                      id={branch.id}
                      checked={selectedBranches.includes(branch.location)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBranches([...selectedBranches, branch.location]);
                        } else {
                          setSelectedBranches(selectedBranches.filter(b => b !== branch.location));
                        }
                      }}
                      className="border-[#B8860B] data-[state=checked]:bg-[#B8860B] data-[state=checked]:border-[#B8860B]"
                    />
                    <Label
                      htmlFor={branch.id}
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      {branchName}
                    </Label>
                    <Input
                      type="text"
                      placeholder="Rack"
                      value={branchRackMap[branch.location] || ''}
                      onChange={(e) => handleRackChange(branch.location, e.target.value)}
                      className="ml-2 w-16 border-[#B8860B]/20 focus:border-[#B8860B] text-sm"
                      disabled={!selectedBranches.includes(branch.location)}
                      pattern="[A-Za-z0-9]+"
                      title="Rack must be alphanumeric"
                    />
                  </div>
                );
              })}
            </div>
            {selectedBranches.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">
                Please select at least one branch
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border-2 border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-900 font-medium flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              How It Works
            </p>
            <ul className="text-xs text-amber-800 mt-2 space-y-1 ml-6 list-disc">
              <li>Product will be added to selected branches' inventory</li>
              <li>A pending bill will be created in the Bills Dashboard</li>
              <li>Any branch admin can view and pay the bill</li>
              <li>Payments can be split across multiple branches</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Create Bill
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
};