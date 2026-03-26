// Type definitions for OSK Granite App - Multi-Branch ERP & POS System
//
// ============================================================================
// FIRESTORE COLLECTIONS SCHEMA
// ============================================================================
//
//  Collection 1  — users          [SHARED]       → User
//  Collection 2  — branches       [STATIC]       → Branch
//  Collection 3  — products       [CENTRAL]      → Product        (inventory mgr)
//  Collection 4  — stock          [PER BRANCH]   → BranchStock    (per branch)
//  Collection 5  — orders         [PER BRANCH]   → Order          (store creates)
//  Collection 6  — customers      [SUPPORTING]   → Customer
//  Collection 7  — dealers        [SUPPORTING]   → Dealer
//  Collection 8  — transfers      [SUPPORTING]   → BranchTransfer
//  Collection 9  — bills          [SUPPORTING]   → PendingBill
//  Collection 10 — productNames   [LOOKUP]       → LookupItem     (dropdown entries)
//  Collection 11 — categories     [LOOKUP]       → LookupItem     (dropdown entries)
//  Collection 12 — sizes          [LOOKUP]       → LookupItem     (dropdown entries)
//  Collection 13 — grades         [LOOKUP]       → LookupItem     (dropdown entries)
//  Collection 14 — itemNames      [LOOKUP]       → LookupItem     (dropdown entries)
//
// ============================================================================

export type UserRole =
  | 'super-admin'
  | 'inventory-manager'
  | 'branch-admin'
  | 'stock-manager'
  | 'sales-manager'
  | 'cashier'
  | 'store-staff'
  | 'store-manager'
  | 'store'
  | 'inventory'
  | 'sales';

export type BranchLocation = 'aziz-nagar' | 'vikarabad' | 'sangareddy' | 'central';

// ── Product Categories ──────────────────────────────────────────────────────
export type ProductCategory =
  | 'Matt'
  | 'Glossy'
  | 'DC'
  | 'MATT (FB)'
  | 'Glossy (FB)'
  | 'ELEVATION STRIP'
  | 'Full Body Glossy'
  | 'Full Body Matt'
  | 'POLISH';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Matt',
  'Glossy',
  'DC',
  'MATT (FB)',
  'Glossy (FB)',
  'ELEVATION STRIP',
  'Full Body Glossy',
  'Full Body Matt',
  'POLISH',
];

export type PaymentMode = 'cash' | 'upi' | 'bank' | 'cheque' | 'credit';

export type InvoiceType = 'quotation' | 'tax-invoice';

export type StockStatus = 'fresh' | 'broken' | 'damaged';

// Grade classification for products (maps to schema grade: "A" | "B" | "C")
export type ProductGrade = 'Alpha' | 'Diamond' | 'Premium';
export const GRADE_MAP: Record<ProductGrade, string> = {
  'Alpha': 'A',
  'Diamond': 'B',
  'Premium': 'C',
};

// ── Collections 10–14: Lookup Items [LOOKUP] — dropdown entries ──
// Each document in productNames, categories, sizes, grades collections
export interface LookupItem {
  id: string;          // Firestore auto-generated or slug
  name: string;        // Display name (e.g. "CHEMICAL", "Matt", "600x600 mm", "Alpha")
  enabled: boolean;    // Soft-delete: false hides from dropdowns
  sortOrder: number;   // Controls display order in dropdowns
  createdAt?: string;  // ISO date
  updatedAt?: any;     // Firestore serverTimestamp
}

// Lookup collection names (for type safety in service layer)
export type LookupCollectionName = 'productNames' | 'categories' | 'sizes' | 'grades' | 'itemNames';

// ── Collection 2: branches [STATIC] — aziznagar, sangareddy, vikarabad ──
export interface Branch {
  id: string;
  branchId?: string;
  name: string;
  location: BranchLocation;
  address?: string;
  phone?: string;
  email?: string;
  contact?: string;
  gstNumber?: string;
  manager?: string;
  createdAt?: Date;
}

// ── Collection 1: users [SHARED] — one doc per person ──
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId?: string; // Branch admins are tied to specific branches
  branchLocation?: BranchLocation;
  avatar?: string;
  createdAt: Date;
}

// ── Collection 6: customers [SUPPORTING] — branchId, name, phone ──
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location?: string;
  storeId?: string;
  branchId?: string;
  branchLocation?: BranchLocation;
  images?: CustomerImage[];
  selectedProducts?: SelectedProduct[];
  aiDesignImages?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SelectedProduct {
  productId: string;
  name: string;
  quantity: number;
  room?: string;
}

export interface CustomerImage {
  id: string;
  url: string;
  type: 'house' | 'room' | 'space';
  uploadedAt: Date;
}

// ── Collection 3: products [CENTRAL] — managed by inventory manager ──
// Fields: name, size, grade, pricePerUnit, category
export interface Product {
  id: string;
  name: string;
  itemName?: string;                // Individual item/variant name
  category: string;                // "Matt" | "Glossy" | "DC" | "MATT (FB)" | "Glossy (FB)" | "ELEVATION STRIP" | "Full Body Glossy" | "Full Body Matt" | "POLISH"
  size?: string;                   // e.g. "2ft x 2ft"
  grade?: string;                  // "Alpha" | "Diamond" | "Premium" (maps to A/B/C)
  description: string;
  price: number;                   // pricePerUnit
  currentStock?: number;
  purchasePrice?: number;
  sellingPriceMin?: number;
  sellingPriceMax?: number;
  stock: number;
  brokenQuantity?: number;
  totalReceived?: number;
  soldQuantity?: number;
  dealerId: string;
  dealerName: string;
  enabled: boolean;
  disableReason?: 'out-of-stock' | 'damaged' | 'discontinued' | null;
  image?: string;
  images?: string[];
  unit?: string;
  minOrderQuantity?: number;
  specifications: Record<string, string>;
  lastSuppliedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  poNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  storeId: string;
  branchId?: string;
  branchLocation?: BranchLocation;
  items: OrderItem[];
  subtotal: number;
  gst: number;
  total: number;
  taxAmount?: number;
  shippingAmount?: number;
  totalAmount?: number;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'delivered';
  paymentMode?: PaymentMode;
  // Payment tracking
  amountPaid?: number;
  amountDue?: number;
  paymentStatus?: 'paid' | 'partial' | 'pending';
  paymentReference?: string;
  orderNotes?: string;
  discount?: number;
  discountType?: 'percentage' | 'flat';
  discountAmount?: number;
  // Metadata
  createdBy?: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  category?: string;
  quantity: number;
  price: number;
  total: number;
  rate?: number;
  amount?: number;
}

export interface Lead {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'converted' | 'interested' | 'lost';
  assignedTo?: string;
  notes: Note[];
  callLogs: CallLog[];
  orderId?: string;
  estimatedValue: number;
  nextFollowUp?: string | Date;
  lastContact?: string | Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
}

export interface CallLog {
  id: string;
  type: 'incoming' | 'outgoing';
  duration: number;
  status: 'completed' | 'missed' | 'rejected';
  notes: string;
  createdBy: string;
  createdAt: Date;
}

// ── Collection 7: dealers [SUPPORTING] — managed by inventory mgr ──
// Fields: name, balance, ledger info
export interface Dealer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  district?: string;
  gstNumber?: string;
  pincode?: string;
  paymentTerms: string;
  totalPurchases: number;
  totalPaid: number;
  outstandingPayment: number;
  payments: DealerPayment[];
  createdAt: Date;
}

export interface DealerPayment {
  id: string;
  dealerId: string;
  productId: string;
  productName: string;
  purchaseAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: 'cash' | 'upi' | 'bank-transfer' | 'cheque' | 'credit';
  transactionRef?: string;
  paymentDate: Date;
  notes?: string;
  branches: string[]; // Branches where product was delivered
  paidByBranch: BranchLocation; // Which branch made the payment
  paidByUser: string; // User who recorded the payment
  paidByUserName: string; // User name who recorded the payment
  quantity: number;
  pricePerUnit: number;
  createdAt: Date;
}

// Pending Bill System - Bills awaiting payment from branches
export interface PendingBill {
  id: string;
  billNumber: string;
  dealerId: string;
  dealerName: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  targetBranches: BranchLocation[]; // Branches that received the product
  branchPayments: BranchBillPayment[]; // Payments made by each branch
  totalPaid: number;
  remainingAmount: number;
  status: 'pending' | 'partial' | 'paid';
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  paidAt?: Date;
}

export interface BranchBillPayment {
  id: string;
  billId: string;
  branchLocation: BranchLocation;
  branchName: string;
  paidAmount: number;
  paymentMethod: 'cash' | 'upi' | 'bank-transfer' | 'cheque' | 'credit';
  transactionRef?: string;
  paymentDate: Date;
  notes?: string;
  paidByUser: string;
  paidByUserName: string;
  createdAt: Date;
}

export type PaymentStatus = 'paid' | 'pending' | 'partial';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: number;
  price: number;
  reference?: string;
  dealerId?: string;
  dealerName?: string;
  orderId?: string;
  userId: string;
  userName: string;
  notes: string;
  invoiceReference?: string;
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  read: boolean;
  branchId?: string;
  branchLocation?: string;
  userId?: string;
  global?: boolean; // true = visible to all users/branches
  createdAt: Date;
}

// ============ NEW ERP TYPES ============

// Multi-Branch Inventory
export interface BranchStock {
  id: string;
  productId: string;
  productName: string;
  branchId: string;
  branchLocation: BranchLocation;
  category: string;
  sku: string;
  
  // Dealer Info
  dealerId?: string;
  dealerName?: string;
  
  // Stock quantities (maps to schema: quantity = freshQuantity, brokenQuantity, minQuantity)
  freshQuantity: number;        // Sellable stock (schema: "quantity")
  brokenQuantity: number;       // Damaged/Clearance stock
  minQuantity?: number;         // Alert threshold (schema: "10 (alert threshold)")
  
  // Pricing
  mrp: number;                  // Maximum Retail Price
  sellingPriceMin: number;      // Minimum selling price
  sellingPriceMax: number;      // Maximum selling price
  costPrice: number;            // Actual cost per unit
  
  // Rack Location (Branch-specific)
  rackLocation?: string;        // e.g., A1, B3, C2 — unique per branch
  
  // Product Details
  grade?: string;               // e.g., Alpha, Diamond, Premium (from central product)
  size?: string;                // e.g., 600x600 mm
  
  // Metadata
  lastUpdated: Date;
  updatedBy: string;
}

// Stock Entry (Purchase Order)
export interface StockInward {
  id: string;
  poNumber: string;             // Purchase Order Number
  vendorId: string;
  vendorName: string;
  branchId: string;
  branchLocation: BranchLocation;
  
  // Quantities
  quantity: number;             // Total quantity received
  
  // Quality Check
  brokenQuantity: number;       // Damaged during QC
  qcRemarks: string;
  
  productId: string;
  productName: string;
  category: string;
  
  // Financial
  totalAmount: number;          // Total purchase amount
  
  inwardDate: Date;
  enteredBy: string;
  createdAt: Date;
}

// Inter-Branch Transfer
export interface BranchTransfer {
  id: string;
  transferNumber: string;
  
  fromBranchId: string;
  fromBranchLocation: BranchLocation;
  
  toBranchId: string;
  toBranchLocation: BranchLocation;
  
  productId: string;
  productName: string;
  quantity: number;
  
  status: 'requested' | 'approved' | 'in-transit' | 'received' | 'rejected';
  
  requestedBy: string;
  requestedAt: Date;
  
  approvedBy?: string;
  approvedAt?: Date;
  
  receivedBy?: string;
  receivedAt?: Date;
  
  remarks: string;
}

// POS Invoice (Quotation or Tax Invoice)
export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;     // 'quotation' or 'tax-invoice'
  
  branchId: string;
  branchLocation: BranchLocation;
  
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerGST?: string;
  
  // Line Items
  items: InvoiceItem[];
  
  // Add-ons
  laborCharges: number;
  transportCharges: number;
  
  // Amounts
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  grandTotal: number;
  
  // Payment
  paymentMode: PaymentMode;
  paymentStatus: 'paid' | 'partial' | 'pending';
  amountPaid: number;
  amountPending: number;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  rate: number;               // Editable rate (₹10 to ₹300 range)
  amount: number;             // quantity * rate
  stockType: StockStatus;     // fresh or broken (different pricing)
}

// Daily Ledger (Day Book)
export interface DayBookEntry {
  id: string;
  branchId: string;
  branchLocation: BranchLocation;
  
  date: Date;
  description: string;
  
  type: 'credit' | 'debit';   // Money In or Money Out
  amount: number;
  paymentMode: PaymentMode;
  
  category: 'sales' | 'purchase' | 'expense' | 'branch-contribution' | 'vendor-payment' | 'refreshments' | 'other';
  subcategory?: 'hospitality' | 'tea' | 'coffee' | 'snacks' | 'water' | 'lunch' | 'auto-travel' | 'stationery' | 'cleaning' | 'tips' | 'miscellaneous';
  
  // References
  invoiceId?: string;
  orderId?: string;
  
  // Balance tracking
  runningBalance: number;
  
  enteredBy: string;
  createdAt: Date;
}

// Vendor/Supplier Management
export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  
  // Financial
  totalPurchases: number;       // Total purchases
  totalPaid: number;
  outstandingAmount: number;
  
  paymentTerms: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Vendor Payment
export interface VendorPayment {
  id: string;
  vendorId: string;
  vendorName: string;
  
  amount: number;
  paymentMode: PaymentMode;
  paymentDate: Date;
  
  // Branch Contributions
  branchContributions: BranchContribution[];
  
  referenceNumber: string;
  remarks: string;
  
  paidBy: string;              // Super admin or authorized person
  createdAt: Date;
}

// Branch Contribution to Central Vendor Fund
export interface BranchContribution {
  id: string;
  branchId: string;
  branchLocation: BranchLocation;
  amount: number;
  date: Date;
  paymentMode: PaymentMode;
  remarks: string;
}

// Branch Performance (For Super Admin Dashboard)
export interface BranchPerformance {
  branchId: string;
  branchLocation: BranchLocation;
  branchName: string;
  
  // Daily Stats
  dailySales: number;
  dailyProfit: number;
  dailyExpenses: number;
  
  // Stock Stats
  totalStock: number;
  lowStockItems: number;
  brokenStockValue: number;
  
  // Financial
  cashInHand: number;
  pendingReceivables: number;
  
  date: Date;
}

export interface VendorProduct {
  id: string;
  vendorId: string;
  category: string;
  productName: string;
  sku: string;
  image?: string;
  purchasePrice: number;
  sellingPrice: number;
  totalQuantityPurchased: number;
  currentStock: number;
  soldQuantity: number;
  brokenQuantity: number;
  totalPurchaseValue: number;
  totalSalesValue: number;
  lastPurchaseDate: Date;
}