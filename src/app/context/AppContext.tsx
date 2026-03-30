import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Customer, Product, Order, Lead, Dealer, StockMovement, Notification, CartItem, BranchStock, PendingBill, BranchBillPayment, BranchTransfer, DayBookEntry, Branch } from '@/app/types';
import { signIn, signOutUser, subscribeToAuthState, changePassword as changePasswordService } from '@/app/services/authService';
import {
  fetchDealers as fetchDealersFromFirestore,
  subscribeToDealers,
  createDealer as createDealerInFirestore,
  updateDealerDoc,
  addPaymentToDealer,
} from '@/app/services/dealerService';
import {
  subscribeToProducts,
  createProduct as createProductInFirestore,
  updateProductDoc,
  deleteProduct as deleteProductFromFirestore,
  fetchProducts as fetchProductsFromFirestore,
} from '@/app/services/productService';
import {
  createCustomerDoc,
  updateCustomerDoc,
  subscribeToCustomers,
} from '@/app/services/customerService';
import {
  subscribeToBranches,
  fetchBranches,
} from '@/app/services/branchService';
import {
  setupSessionTimeout,
  clearSessionTimeout,
  updateActivity,
  createAuditLog,
} from '@/app/services/securityService';
import { toast } from 'sonner';
import { COLLECTIONS, subscribeToCollection, createDoc, updateDocument, setDocument, where, type QueryConstraint } from '@/app/services/firebase';

interface AppContextType {
  // Auth
  currentUser: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  
  // Products
  products: Product[];
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { selectedBranches?: string[]; branchRackMap?: Record<string, string> }) => Product;
  deleteProduct: (id: string) => void;
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Orders
  orders: Order[];
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Order;
  addOrder: (order: any) => Order;
  getOrdersForBranch: (branchId: string) => Order[];
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  
  // Leads
  leads: Lead[];
  updateLead: (id: string, updates: Partial<Lead>) => void;
  addLead: (lead: any) => Lead;
  addNoteToLead: (leadId: string, content: string) => void;
  addCallLogToLead: (leadId: string, callLog: Omit<import('@/app/types').CallLog, 'id' | 'createdAt'>) => void;
  
  // Dealers
  dealers: Dealer[];
  addDealer: (dealer: Omit<Dealer, 'id' | 'createdAt'>) => Promise<Dealer>;
  updateDealer: (dealerId: string, updates: Partial<Dealer>) => void;
  addDealerPayment: (payment: any) => void;
  
  // Pending Bills
  pendingBills: PendingBill[];
  createPendingBill: (billData: any) => PendingBill;
  payBill: (billId: string, payment: Omit<BranchBillPayment, 'id' | 'createdAt'>) => BranchBillPayment;
  getBillsForBranch: (branchLocation: string) => PendingBill[];
  
  // Stock Movements
  stockMovements: StockMovement[];
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => void;
  
  // Notifications
  notifications: Notification[];
  getFilteredNotifications: () => Notification[];
  markNotificationAsRead: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  
  // Branch Stock
  branchStock: BranchStock[];
  updateBranchStock: (branchId: string, productId: string, quantity: number) => void;
  updateBranchStockQtyById: (stockId: string, quantity: number) => void;
  updateBranchStockRack: (stockId: string, rackLocation: string) => void;
  addBranchStockEntry: (entry: Omit<BranchStock, 'id' | 'lastUpdated' | 'updatedBy'>) => BranchStock;
  splitBranchStock: (sourceStockId: string, moveQuantity: number, targetRack: string) => void;
  
  // Branches
  branches: Branch[];
  
  // Branch Transfers
  branchTransfers: BranchTransfer[];
  createBranchTransfer: (data: {
    fromBranchId: string;
    fromBranchLocation: string;
    toBranchId: string;
    toBranchLocation: string;
    productId: string;
    productName: string;
    quantity: number;
    remarks: string;
  }) => BranchTransfer;
  updateBranchTransfer: (id: string, updates: Partial<BranchTransfer>) => void;
  
  // Day Book Entries
  dayBookEntries: DayBookEntry[];
  addDayBookEntry: (entry: Omit<DayBookEntry, 'id' | 'createdAt'>) => DayBookEntry;
  
  // Settings
  autoStockReductionEnabled: boolean;
  setAutoStockReductionEnabled: (enabled: boolean) => void;
}

// Persist the context across HMR re-evaluations so Provider ↔ Consumer always match
const _global = globalThis as any;
if (!_global.__OSK_APP_CONTEXT__) {
  _global.__OSK_APP_CONTEXT__ = createContext<AppContextType | undefined>(undefined);
}
const AppContext = _global.__OSK_APP_CONTEXT__ as React.Context<AppContextType | undefined>;

let notifCounter = 0;

// Helper to extract the numeric part from IDs like "CUST-006", "ORD-003", etc.
const getMaxIdNumber = (ids: string[], prefix: string): number => {
  let max = 0;
  ids.forEach(id => {
    const match = id.match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  });
  return max;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure provider renders
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [branchStock, setBranchStock] = useState<BranchStock[]>([]);
  const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
  const [branchTransfers, setBranchTransfers] = useState<BranchTransfer[]>([]);
  const [dayBookEntries, setDayBookEntries] = useState<DayBookEntry[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [autoStockReductionEnabled, setAutoStockReductionEnabled] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (user) {
        console.log(`[AUTH] Logged in: ${user.email} | role: ${user.role} | branchId: ${user.branchId} | branchLocation: ${user.branchLocation}`);
      } else {
        console.log('[AUTH] No user / logged out');
      }
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Setup session timeout monitoring ──────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      // Setup automatic logout after 30 minutes of inactivity
      setupSessionTimeout(() => {
        console.warn('[SECURITY] Session expired due to inactivity');
        toast.warning('Session expired due to inactivity. Please login again.');
        logout();
      });

      // Track user activity to reset session timer
      const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      const handleActivity = () => updateActivity();
      
      activityEvents.forEach(event => {
        window.addEventListener(event, handleActivity);
      });

      return () => {
        clearSessionTimeout();
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleActivity);
        });
      };
    } else {
      clearSessionTimeout();
    }
  }, [currentUser]);

  // ── Helper: check if user is a global role (can read all branches) ────────
  const isGlobalRole = (user: User | null): boolean => {
    if (!user) return false;
    return ['super-admin', 'inventory-manager', 'inventory'].includes(user.role);
  };

  // ── Load dealers from Firestore + real-time sync ──────────────────────────
  useEffect(() => {
    if (!currentUser) return;           // Wait for auth
    let unsubscribe: (() => void) | null = null;

    fetchDealersFromFirestore().then((firestoreDealers) => {
      console.log(`[DATA] dealers fetched: ${firestoreDealers.length}`);
      setDealers(firestoreDealers);
    });

    unsubscribe = subscribeToDealers((liveDealers) => {
      console.log(`[DATA] dealers subscription: ${liveDealers.length}`);
      setDealers(liveDealers);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // ── Load products from Firestore + real-time sync ──────────────────────────
  useEffect(() => {
    if (!currentUser) return;           // Wait for auth
    let unsubscribe: (() => void) | null = null;

    fetchProductsFromFirestore().then((firestoreProducts) => {
      console.log(`[DATA] products fetched: ${firestoreProducts.length}`);
      setProducts(firestoreProducts);
    });

    unsubscribe = subscribeToProducts((liveProducts) => {
      console.log(`[DATA] products subscription: ${liveProducts.length}`);
      setProducts(liveProducts);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // ── Load customers from Firestore + real-time sync ──────────────────────────
  useEffect(() => {
    if (!currentUser) return;           // Wait for auth
    const globalUser = isGlobalRole(currentUser);
    const branchId = currentUser.branchId;
    const constraints: QueryConstraint[] =
      !globalUser && branchId ? [where('branchId', '==', branchId)] : [];
    console.log(`[DATA] subscribing customers with branchFilter=${!globalUser && branchId ? branchId : 'none (global)'}`);
    const unsubscribe = subscribeToCustomers((liveCustomers) => {
      console.log(`[DATA] customers subscription: ${liveCustomers.length}`);
      setCustomers(liveCustomers);
    }, ...constraints);

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // ── Load branches from Firestore + real-time sync ──────────────────────────
  useEffect(() => {
    if (!currentUser) return;           // Wait for auth
    let unsubscribe: (() => void) | null = null;

    fetchBranches().then((firestoreBranches) => {
      console.log(`[DATA] branches fetched: ${firestoreBranches.length}`);
      setBranches(firestoreBranches);
    });

    unsubscribe = subscribeToBranches((liveBranches) => {
      console.log(`[DATA] branches subscription: ${liveBranches.length}`);
      setBranches(liveBranches);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // ── Load remaining collections and keep local state in sync ────────────────
  // Branch-scoped collections still use a branchId filter for non-global users.
  useEffect(() => {
    if (!currentUser) return;           // Wait for auth

    const globalUser = isGlobalRole(currentUser);
    const branchId  = currentUser.branchId;
    const branchLocation = currentUser.branchLocation;

    // Build a branch filter for non-global users
    const branchFilter: QueryConstraint[] =
      !globalUser && branchId ? [where('branchId', '==', branchId)] : [];

    // branchTransfers uses fromBranchId / toBranchId, not branchId
    const transferFromFilter: QueryConstraint[] =
      !globalUser && branchId ? [where('fromBranchId', '==', branchId)] : [];

    console.log(`[DATA] Loading collections for user: ${currentUser.email} | role: ${currentUser.role} | branch: ${branchId} | isGlobal: ${globalUser}`);

    const unsubStock     = subscribeToCollection<BranchStock>(COLLECTIONS.stock, (data) => { console.log(`[DATA] branchStock: ${data.length}`); setBranchStock(data); }, ...branchFilter);
    const unsubOrders    = subscribeToCollection<Order>(COLLECTIONS.orders, (data) => { console.log(`[DATA] orders: ${data.length}`); setOrders(data); }, ...branchFilter);
    const unsubLeads     = subscribeToCollection<Lead>(COLLECTIONS.leads, (data) => { console.log(`[DATA] leads: ${data.length}`); setLeads(data); }, ...branchFilter);
    // Bills are cross-branch: any branch can pay a dealer bill, so all authenticated users
    // must see all bills regardless of which branch created them.
    const unsubBills     = subscribeToCollection<PendingBill>(COLLECTIONS.bills, (data) => { console.log(`[DATA] bills: ${data.length}`); setPendingBills(data); });
    const unsubMovements = subscribeToCollection<StockMovement>(COLLECTIONS.stockMovements, (data) => { console.log(`[DATA] stockMovements: ${data.length}`); setStockMovements(data); }, ...branchFilter);
    const normalizeDayBookEntries = (data: DayBookEntry[]): DayBookEntry[] => {
      return data.map((entry: any) => {
        try {
          // Handle Firestore Timestamp objects
          let normalizedDate = entry?.date;
          if (normalizedDate && typeof normalizedDate === 'object' && 'toDate' in normalizedDate) {
            normalizedDate = (normalizedDate as any).toDate();
          } else if (typeof normalizedDate === 'string') {
            normalizedDate = new Date(normalizedDate);
          } else if (!(normalizedDate instanceof Date)) {
            normalizedDate = new Date();
          }
          
          let normalizedCreatedAt = entry?.createdAt;
          if (normalizedCreatedAt && typeof normalizedCreatedAt === 'object' && 'toDate' in normalizedCreatedAt) {
            normalizedCreatedAt = (normalizedCreatedAt as any).toDate();
          } else if (typeof normalizedCreatedAt === 'string') {
            normalizedCreatedAt = new Date(normalizedCreatedAt);
          } else if (!(normalizedCreatedAt instanceof Date)) {
            normalizedCreatedAt = new Date();
          }
          
          return {
            ...entry,
            date: normalizedDate,
            createdAt: normalizedCreatedAt,
          };
        } catch (e) {
          console.error('[AppContext] Error normalizing dayBook entry:', e, entry);
          return {
            ...entry,
            date: new Date(),
            createdAt: new Date(),
          };
        }
      });
    };

    const setMergedDayBookEntries = (incoming: DayBookEntry[], merge = false) => {
      const normalized = normalizeDayBookEntries(incoming);
      if (!merge) {
        setDayBookEntries(normalized);
        return;
      }
      setDayBookEntries((prev) => {
        const byId = new Map<string, DayBookEntry>();
        [...prev, ...normalized].forEach((entry) => byId.set(entry.id, entry));
        return Array.from(byId.values());
      });
    };

    const unsubDayBook = subscribeToCollection<DayBookEntry>(
      COLLECTIONS.dayBookEntries,
      (data) => {
        console.log(`[DATA] dayBookEntries by branchId: ${data.length}`);
        setMergedDayBookEntries(data, false);
      },
      ...branchFilter,
    );

    let unsubDayBookByLocation: (() => void) | null = null;
    if (!globalUser && branchLocation) {
      unsubDayBookByLocation = subscribeToCollection<DayBookEntry>(
        COLLECTIONS.dayBookEntries,
        (data) => {
          console.log(`[DATA] dayBookEntries by branchLocation: ${data.length}`);
          setMergedDayBookEntries(data, true);
        },
        where('branchLocation', '==', branchLocation),
      );
    }
    // Notifications: non-global users filter by branchId
    const notifFilter: QueryConstraint[] =
      !globalUser && branchId ? [where('branchId', '==', branchId)] : [];
    const unsubNotifs    = subscribeToCollection<Notification>(COLLECTIONS.notifications, (data) => { console.log(`[DATA] notifications: ${data.length}`); setNotifications(data); }, ...notifFilter);

    // For transfers, non-global users subscribe by fromBranchId;
    // also subscribe by toBranchId and merge results.
    const unsubTransfersFrom = subscribeToCollection<BranchTransfer>(COLLECTIONS.transfers,
      (data) => {
        if (globalUser) {
          setBranchTransfers(data);
        } else {
          setBranchTransfers((prev) => {
            const fromIds = new Set(data.map(d => d.id));
            const toOnly = prev.filter(p => !fromIds.has(p.id));
            return [...data, ...toOnly];
          });
        }
      },
      ...transferFromFilter,
    );

    let unsubTransfersTo: (() => void) | null = null;
    if (!globalUser && branchId) {
      unsubTransfersTo = subscribeToCollection<BranchTransfer>(COLLECTIONS.transfers,
        (data) => {
          setBranchTransfers((prev) => {
            const toIds = new Set(data.map(d => d.id));
            const fromOnly = prev.filter(p => !toIds.has(p.id));
            return [...fromOnly, ...data];
          });
        },
        where('toBranchId', '==', branchId),
      );
    }

    return () => {
      unsubStock();
      unsubOrders();
      unsubLeads();
      unsubBills();
      unsubMovements();
      unsubTransfersFrom();
      if (unsubTransfersTo) unsubTransfersTo();
      unsubDayBook();
      if (unsubDayBookByLocation) unsubDayBookByLocation();
      unsubNotifs();
    };
  }, [currentUser]);


  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await signIn(email, password);
    if (result.success && result.user) {
      setCurrentUser(result.user);
    }
    return { success: result.success, error: result.error };
  };

  const logout = () => {
    signOutUser();
    setCurrentUser(null);
    setCart([]);
    // Clear all Firestore data so stale data doesn't linger
    setCustomers([]);
    setProducts([]);
    setOrders([]);
    setLeads([]);
    setDealers([]);
    setStockMovements([]);
    setNotifications([]);
    setBranchStock([]);
    setPendingBills([]);
    setBranchTransfers([]);
    setDayBookEntries([]);
    setBranches([]);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return changePasswordService(currentPassword, newPassword);
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
    // Collect all customer IDs from customers AND from orders (to avoid collisions)
    const allCustomerIds = [
      ...customers.map(c => c.id),
      ...orders.map(o => o.customerId),
    ];
    const nextNum = getMaxIdNumber(allCustomerIds, 'CUST-') + 1;
    const newCustomer: Customer = {
      ...customerData,
      id: `CUST-${String(nextNum).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCustomers([...customers, newCustomer]);

    // Persist to Firestore
    createCustomerDoc(newCustomer).catch((err) =>
      console.error('[AppContext] Failed to write customer to Firestore:', err)
    );
    
    // Auto-create lead for sales team
    const allLeadIds = leads.map(l => l.id);
    const nextLeadNum = getMaxIdNumber(allLeadIds, 'LEAD-') + 1;
    const newLead: Lead = {
      id: `LEAD-${String(nextLeadNum).padStart(3, '0')}`,
      customerId: newCustomer.id,
      customerName: newCustomer.name,
      customerPhone: newCustomer.phone,
      customerEmail: newCustomer.email,
      customerAddress: `${newCustomer.address}, ${newCustomer.city}, ${newCustomer.state} - ${newCustomer.pincode}`,
      branchId: currentUser?.branchId || '',
      branchLocation: currentUser?.branchLocation,
      status: 'new',
      notes: [],
      callLogs: [],
      estimatedValue: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLeads([...leads, newLead]);
    // Persist auto-created lead to Firestore
    setDocument(COLLECTIONS.leads, newLead.id, newLead, false).catch((err) =>
      console.error('[AppContext] Failed to write auto-lead to Firestore:', err)
    );
    
    addNotification({
      type: 'info',
      title: 'New Lead Created',
      message: `Lead ${newLead.id} auto-created from store activity`,
    });
    
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c));

    // Persist to Firestore
    updateCustomerDoc(id, updates).catch((err) =>
      console.error('[AppContext] Failed to update customer in Firestore:', err)
    );
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p));

    // Persist to Firestore
    updateProductDoc(id, updates).catch((err) =>
      console.error('[AppContext] Failed to update product in Firestore:', err)
    );
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { selectedBranches?: string[]; branchRackMap?: Record<string, string> }): Product => {
    const nextProdNum = getMaxIdNumber(products.map(p => p.id), 'PROD-') + 1;
    const newProduct: Product = {
      ...productData,
      id: `PROD-${String(nextProdNum).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts([...products, newProduct]);

    // Persist to Firestore (fire-and-forget, real-time listener will sync)
    createProductInFirestore(newProduct).catch((err) =>
      console.error('[AppContext] Failed to write product to Firestore:', err)
    );
    
    // Create branch stock entries only for selected branches
    // If no branches selected, default to all branches
    const targetBranches = productData.selectedBranches && productData.selectedBranches.length > 0
      ? branches.filter(branch => productData.selectedBranches!.includes(branch.location))
      : branches;
    
    const newBranchStockEntries: BranchStock[] = targetBranches.map((branch, index) => ({
      id: `stock-${branchStock.length + index + 1}`,
      productId: newProduct.id,
      productName: newProduct.name,
      branchId: branch.id,
      branchLocation: branch.location,
      category: newProduct.category || 'Granite Stone',
      sku: `${newProduct.name.substring(0, 3).toUpperCase()}-${newProduct.id.substring(5)}`,
      dealerId: newProduct.dealerId,
      dealerName: newProduct.dealerName,
      freshQuantity: productData.stock || 0,
      brokenQuantity: 0,
      mrp: productData.price,
      sellingPriceMin: productData.purchasePrice || productData.price * 0.8,
      sellingPriceMax: productData.price,
      costPrice: productData.purchasePrice || productData.price * 0.7,
      rackLocation: productData.branchRackMap?.[branch.location] || '',
      lastUpdated: new Date(),
      updatedBy: currentUser?.id || 'system',
    }));
    
    setBranchStock([...branchStock, ...newBranchStockEntries]);

    // Persist branch stock entries to Firestore
    newBranchStockEntries.forEach((entry) => {
      setDocument(COLLECTIONS.stock, entry.id, entry, false).catch((err) =>
        console.error('[AppContext] Failed to write branch stock to Firestore:', err)
      );
    });
    
    return newProduct;
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));

    // Persist to Firestore
    deleteProductFromFirestore(id).catch((err) =>
      console.error('[AppContext] Failed to delete product from Firestore:', err)
    );
  };

  const addToCart = (product: Product, quantity: number) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const createOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order => {
    const nextOrdNum = getMaxIdNumber(orders.map(o => o.id), 'ORD-') + 1;
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${String(nextOrdNum).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setOrders([...orders, newOrder]);

    // Persist to Firestore
    setDocument(COLLECTIONS.orders, newOrder.id, newOrder, false).catch((err) =>
      console.error('[AppContext] Failed to write order to Firestore:', err)
    );
    
    // Update stock if auto-reduction is enabled
    if (autoStockReductionEnabled) {
      orderData.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          updateProduct(product.id, { stock: Math.max(0, product.stock - item.quantity) });
          
          // Add stock movement
          addStockMovement({
            productId: item.productId,
            productName: item.productName,
            type: 'out',
            quantity: item.quantity,
            price: item.price,
            orderId: newOrder.id,
            userId: currentUser?.id || '',
            userName: currentUser?.name || '',
            branchId: orderData.branchId || currentUser?.branchId || '',
            branchLocation: orderData.branchLocation || currentUser?.branchLocation,
            notes: `Auto-reduced from Order ${newOrder.id}`,
          });
        }
      });
    }
    
    // Update lead if exists
    const lead = leads.find(l => l.customerId === orderData.customerId);
    if (lead) {
      updateLead(lead.id, {
        status: 'won',
        orderId: newOrder.id,
        estimatedValue: orderData.total,
      });
    }
    
    addNotification({
      type: 'success',
      title: 'New Order',
      message: `Order ${newOrder.id} created successfully`,
      branchLocation: orderData.branchLocation,
    });

    // Auto-add day book entry for order (credit = money coming in)
    const branchLoc = (orderData.branchLocation || 'aziz-nagar') as any;
    const orderAmountPaid = orderData.amountPaid ?? orderData.total;
    const orderAmountDue = orderData.amountDue ?? 0;
    const orderTotal = orderData.total;

    // Always create a single ledger entry per order — the daily cash book
    const paidLabel = `Received: ₹${orderAmountPaid.toLocaleString('en-IN')}`;
    const dueLabel = orderAmountDue > 0 ? ` | Due: ₹${orderAmountDue.toLocaleString('en-IN')}` : '';
    const paymentStatusLabel = orderAmountDue > 0 ? ' [PARTIAL]' : ' [PAID]';

    addDayBookEntry({
      branchId: orderData.branchId || 'branch-1',
      branchLocation: branchLoc,
      date: new Date(),
      description: `Order ${newOrder.poNumber || newOrder.id} — ${orderData.customerName} (${orderData.items.length} items) • Total: ${orderTotal.toLocaleString('en-IN')} • ${paidLabel}${dueLabel}${paymentStatusLabel}`,
      type: 'credit',
      amount: orderTotal,
      paymentMode: orderData.paymentMode || 'cash',
      category: 'sales',
      orderId: newOrder.id,
      runningBalance: 0,
      enteredBy: orderData.createdByName || 'Store',
    });
    
    return newOrder;
  };

  const addOrder = (order: any): Order => {
    const nextOrdNum = getMaxIdNumber(orders.map(o => o.id), 'ORD-') + 1;
    const newOrder: Order = {
      ...order,
      id: `ORD-${String(nextOrdNum).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setOrders([...orders, newOrder]);
    setDocument(COLLECTIONS.orders, newOrder.id, newOrder, false).catch(console.error);
    
    // Update stock if auto-reduction is enabled
    if (autoStockReductionEnabled) {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          updateProduct(product.id, { stock: Math.max(0, product.stock - item.quantity) });
          
          // Add stock movement
          addStockMovement({
            productId: item.productId,
            productName: item.productName,
            type: 'out',
            quantity: item.quantity,
            price: item.price,
            orderId: newOrder.id,
            userId: currentUser?.id || '',
            userName: currentUser?.name || '',
            branchId: order.branchId || currentUser?.branchId || '',
            branchLocation: order.branchLocation || currentUser?.branchLocation || '',
            notes: `Auto-reduced from Order ${newOrder.id}`,
          });
        }
      });
    }
    
    // Update lead if exists
    const lead = leads.find(l => l.customerId === order.customerId);
    if (lead) {
      updateLead(lead.id, {
        status: 'won',
        orderId: newOrder.id,
        estimatedValue: order.total,
      });
    }
    
    addNotification({
      type: 'success',
      title: 'New Order',
      message: `Order ${newOrder.id} created successfully`,
      branchLocation: order.branchLocation,
    });
    
    return newOrder;
  };

  const getOrdersForBranch = (branchId: string): Order[] => {
    // Branch admins see orders that target their branch
    // Inventory managers and super admins see all orders
    if (currentUser?.role === 'branch-admin') {
      return orders.filter(order => 
        order.branchId === branchId
      );
    }
    return orders;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (orderToUpdate) {
      updateDocument(COLLECTIONS.orders, orderId, { status }).catch(console.error);
    }
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, ...updates, updatedAt: new Date() } : order
    ));
    updateDocument(COLLECTIONS.orders, orderId, { ...updates, updatedAt: new Date() }).catch(console.error);
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(leads.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l));

    // Persist to Firestore
    updateDocument(COLLECTIONS.leads, id, { ...updates, updatedAt: new Date() }).catch((err) =>
      console.error('[AppContext] Failed to update lead in Firestore:', err)
    );
  };

  const addLead = (lead: any): Lead => {
    const nextLeadNum = getMaxIdNumber(leads.map(l => l.id), 'LEAD-') + 1;
    const newLead: Lead = {
      ...lead,
      id: `LEAD-${String(nextLeadNum).padStart(3, '0')}`,
      branchId: lead.branchId || currentUser?.branchId || '',
      branchLocation: lead.branchLocation || currentUser?.branchLocation || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLeads([...leads, newLead]);
    // Persist to Firestore
    setDocument(COLLECTIONS.leads, newLead.id, newLead, false).catch((err) =>
      console.error('[AppContext] Failed to write lead to Firestore:', err)
    );
    return newLead;
  };

  const addNoteToLead = (leadId: string, content: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead && currentUser) {
      const newNote = {
        id: `note-${Date.now()}`,
        content,
        createdBy: currentUser.id,
        createdAt: new Date(),
      };
      updateLead(leadId, {
        notes: [...lead.notes, newNote],
      });
    }
  };

  const addCallLogToLead = (leadId: string, callLogData: Omit<import('@/app/types').CallLog, 'id' | 'createdAt'>) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      const newCallLog = {
        ...callLogData,
        id: `call-${Date.now()}`,
        createdAt: new Date(),
      };
      updateLead(leadId, {
        callLogs: [...lead.callLogs, newCallLog],
      });
    }
  };

  const addDealer = async (dealerData: Omit<Dealer, 'id' | 'createdAt'>): Promise<Dealer> => {
    const nextDealNum = getMaxIdNumber(dealers.map(d => d.id), 'DEAL-') + 1;
    const newDealer: Dealer = {
      ...dealerData,
      id: `DEAL-${String(nextDealNum).padStart(3, '0')}`,
      createdAt: new Date(),
    };
    setDealers((prev) => [...prev, newDealer]);

    try {
      // Persist to Firestore; keep optimistic UI but rollback if write is denied/failed.
      await createDealerInFirestore(newDealer);
    } catch (err) {
      setDealers((prev) => prev.filter((d) => d.id !== newDealer.id));
      console.error('[AppContext] Failed to write dealer to Firestore:', err);
      throw err;
    }

    return newDealer;
  };

  const updateDealer = (dealerId: string, updates: Partial<Dealer>) => {
    setDealers(dealers.map(d => d.id === dealerId ? { ...d, ...updates } : d));

    // Persist to Firestore
    updateDealerDoc(dealerId, updates).catch((err) =>
      console.error('[AppContext] Failed to update dealer in Firestore:', err)
    );
  };

  const addDealerPayment = (payment: any) => {
    // Create payment record
    const newPayment = {
      id: `PAY-${Date.now()}`,
      dealerId: payment.dealerId,
      productId: payment.productId,
      productName: payment.productName,
      purchaseAmount: payment.totalAmount,
      paidAmount: payment.paidAmount,
      balanceAmount: payment.balanceAmount,
      paymentMethod: payment.paymentMethod,
      transactionRef: payment.transactionRef,
      paymentDate: payment.paymentDate,
      notes: payment.notes,
      branches: payment.branches,
      paidByBranch: payment.paidByBranch || currentUser?.branchLocation || 'aziz-nagar',
      paidByUser: currentUser?.id || 'system',
      paidByUserName: currentUser?.name || 'System',
      quantity: payment.quantity || 0,
      pricePerUnit: payment.pricePerUnit || 0,
      createdAt: new Date(),
    };

    // Update dealer's financial records
    setDealers(dealers.map(d => {
      if (d.id === payment.dealerId) {
        const updatedPayments = [...(d.payments || []), newPayment];
        const totalPurchases = (d.totalPurchases || 0) + payment.totalAmount;
        const totalPaid = (d.totalPaid || 0) + payment.paidAmount;
        const outstandingPayment = totalPurchases - totalPaid;

        // Persist payment to Firestore
        addPaymentToDealer(payment.dealerId, d, newPayment, {
          totalPurchases,
          totalPaid,
          outstandingPayment,
        }).catch((err) =>
          console.error('[AppContext] Failed to persist dealer payment to Firestore:', err)
        );

        return {
          ...d,
          payments: updatedPayments,
          totalPurchases,
          totalPaid,
          outstandingPayment,
        };
      }
      return d;
    }));

    // Create a stock movement record for the purchase
    addStockMovement({
      productId: payment.productId,
      productName: payment.productName,
      type: 'in',
      quantity: payment.quantity || 0,
      price: payment.totalAmount,
      dealerId: payment.dealerId,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      notes: `Purchase from dealer - ${payment.paymentMethod} - Paid by: ${newPayment.paidByBranch} - ${payment.notes || ''}`,
    });

    // Add notification
    const dealer = dealers.find(d => d.id === payment.dealerId);
    const payingBranchName = newPayment.paidByBranch.split('-').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    const paymentStatus = payment.paymentMethod === 'credit' 
      ? `₹${payment.totalAmount.toFixed(2)} added to credit`
      : payment.balanceAmount > 0
        ? `₹${payment.paidAmount.toFixed(2)} paid, ₹${payment.balanceAmount.toFixed(2)} pending`
        : `₹${payment.paidAmount.toFixed(2)} paid in full`;

    addNotification({
      type: 'success',
      title: 'Dealer Payment Recorded',
      message: `${payment.productName} from ${dealer?.name} - ${paymentStatus} - Paid by: ${payingBranchName}`,
      branchLocation: newPayment.paidByBranch as any, // Convert branch name to BranchLocation
    });

    // Return the payment record for the receipt
    return newPayment;
  };

  const addStockMovement = (movementData: Omit<StockMovement, 'id' | 'createdAt'>) => {
    const newMovement: StockMovement = {
      ...movementData,
      branchId: movementData.branchId || currentUser?.branchId || '',
      branchLocation: movementData.branchLocation || currentUser?.branchLocation,
      id: `STOCK-${String(stockMovements.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
    };
    setStockMovements([...stockMovements, newMovement]);
    setDocument(COLLECTIONS.stockMovements, newMovement.id, newMovement, false).catch(console.error);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    notifCounter++;
    const newNotification: Notification = {
      ...notificationData,
      id: `notif-${Date.now()}-${notifCounter}`,
      read: false,
      // Auto-stamp branch/user info from currentUser if not explicitly provided
      branchId: notificationData.branchId || currentUser?.branchId,
      branchLocation: notificationData.branchLocation || currentUser?.branchLocation,
      userId: notificationData.userId || currentUser?.id,
      global: notificationData.global ?? false,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const getFilteredNotifications = (): Notification[] => {
    if (!currentUser) return [];
    
    // Super-admins, inventory, and sales roles see ALL notifications
    if (['super-admin', 'inventory', 'sales'].includes(currentUser.role)) {
      return notifications;
    }
    
    // Branch-scoped roles only see:
    // 1. Global notifications (global: true)
    // 2. Notifications with no branch set (legacy/system-wide)
    // 3. Notifications matching their own branchLocation
    const userBranch = currentUser.branchLocation;
    return notifications.filter(n => {
      if (n.global) return true;
      if (!n.branchLocation) return true; // legacy notifications without branch scope
      return n.branchLocation === userBranch;
    });
  };

  // Check for low stock
  useEffect(() => {
    products.forEach(product => {
      if (product.enabled && product.stock > 0 && product.stock <= 10) {
        const existingAlert = notifications.find(
          n => n.title === 'Low Stock Alert' && n.message.includes(product.name)
        );
        if (!existingAlert) {
          notifCounter++;
          const newNotification: Notification = {
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${product.name} has only ${product.stock} units remaining`,
            id: `notif-${Date.now()}-${notifCounter}`,
            read: false,
            global: true, // Low stock alerts visible to inventory/sales/super-admin roles
            createdAt: new Date(),
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      }
    });
  }, [products, notifications]);

  const updateBranchStock = (branchId: string, productId: string, quantity: number) => {
    setBranchStock(prevStock => {
      const updated = prevStock.map(bs =>
        bs.branchId === branchId && bs.productId === productId
          ? { ...bs, freshQuantity: quantity, lastUpdated: new Date() }
          : bs
      );
      // Persist to Firestore
      const target = updated.find(bs => bs.branchId === branchId && bs.productId === productId);
      if (target) {
        updateDocument(COLLECTIONS.stock, target.id, { freshQuantity: quantity, lastUpdated: new Date() }).catch((err) =>
          console.error('[AppContext] Failed to update branch stock in Firestore:', err)
        );
      }
      return updated;
    });
  };

  const updateBranchStockQtyById = (stockId: string, quantity: number) => {
    setBranchStock(prevStock => prevStock.map(bs =>
      bs.id === stockId
        ? { ...bs, freshQuantity: quantity, lastUpdated: new Date() }
        : bs
    ));

    // Persist to Firestore
    updateDocument(COLLECTIONS.stock, stockId, { freshQuantity: quantity, lastUpdated: new Date() }).catch((err) =>
      console.error('[AppContext] Failed to update branch stock quantity in Firestore:', err)
    );
  };

  const updateBranchStockRack = (stockId: string, rackLocation: string) => {
    setBranchStock(prevStock => prevStock.map(bs =>
      bs.id === stockId
        ? { ...bs, rackLocation, lastUpdated: new Date() }
        : bs
    ));

    // Persist to Firestore
    updateDocument(COLLECTIONS.stock, stockId, { rackLocation, lastUpdated: new Date() }).catch((err) =>
      console.error('[AppContext] Failed to update rack location in Firestore:', err)
    );
  };

  const addBranchStockEntry = (entryData: Omit<BranchStock, 'id' | 'lastUpdated' | 'updatedBy'>): BranchStock => {
    // Check if stock entry already exists for this branch + product + rack
    const existing = branchStock.find(
      bs => bs.branchId === entryData.branchId && bs.productName.toLowerCase() === entryData.productName.toLowerCase() && bs.category === entryData.category && bs.rackLocation?.trim()?.toUpperCase() === entryData.rackLocation?.trim()?.toUpperCase()
    );

    if (existing) {
      // Update existing entry: add quantities, update rack if provided
      const updatedEntry: BranchStock = {
        ...existing,
        freshQuantity: existing.freshQuantity + entryData.freshQuantity,
        brokenQuantity: existing.brokenQuantity + entryData.brokenQuantity,
        rackLocation: entryData.rackLocation || existing.rackLocation,
        costPrice: entryData.costPrice || existing.costPrice,
        lastUpdated: new Date(),
        updatedBy: currentUser?.id || 'system',
      };
      setBranchStock(prev => prev.map(bs => bs.id === existing.id ? updatedEntry : bs));

      // Persist to Firestore
      setDocument(COLLECTIONS.stock, existing.id, updatedEntry, false).catch((err) =>
        console.error('[AppContext] Failed to update branch stock in Firestore:', err)
      );
      return updatedEntry;
    } else {
      // Create brand-new entry
      const stockId = `stock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newEntry: BranchStock = {
        ...entryData,
        id: stockId,
        lastUpdated: new Date(),
        updatedBy: currentUser?.id || 'system',
      };
      setBranchStock(prev => [...prev, newEntry]);

      // Persist to Firestore
      setDocument(COLLECTIONS.stock, stockId, newEntry, false).catch((err) =>
        console.error('[AppContext] Failed to create branch stock in Firestore:', err)
      );
      return newEntry;
    }
  };

  const splitBranchStock = (sourceStockId: string, moveQuantity: number, targetRack: string) => {
    const sourceStock = branchStock.find(bs => bs.id === sourceStockId);
    if (!sourceStock) return;

    if (moveQuantity >= sourceStock.freshQuantity) {
      // Move all
      updateBranchStockRack(sourceStockId, targetRack);
      addNotification({
        type: 'info',
        title: 'Rack Transfer',
        message: `Moved all ${sourceStock.freshQuantity} of ${sourceStock.productName} to Rack ${targetRack}`,
        branchLocation: sourceStock.branchLocation,
      });
    } else {
      // Split
      updateBranchStockQtyById(sourceStockId, sourceStock.freshQuantity - moveQuantity);
      
      const newEntryData: Omit<BranchStock, 'id' | 'lastUpdated' | 'updatedBy'> = {
        ...sourceStock,
        freshQuantity: moveQuantity,
        brokenQuantity: 0, // Assume transferring fresh stock only
        rackLocation: targetRack,
      };
      
      addBranchStockEntry(newEntryData);

      addNotification({
        type: 'info',
        title: 'Stock Split',
        message: `Split ${moveQuantity} of ${sourceStock.productName} into Rack ${targetRack}`,
        branchLocation: sourceStock.branchLocation,
      });
    }
  };

  // Pending Bills Management
  const createPendingBill = (billData: any): PendingBill => {
    // Use timestamp + random suffix to avoid duplicate IDs when Firestore state hasn't synced yet
    const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const newBill: PendingBill = {
      id: billNumber,
      billNumber: billNumber,
      dealerId: billData.dealerId,
      dealerName: billData.dealerName,
      productId: billData.productId,
      productName: billData.productName,
      category: billData.category,
      quantity: billData.quantity,
      pricePerUnit: billData.pricePerUnit,
      totalAmount: billData.totalAmount,
      amount: billData.totalAmount,
      targetBranches: billData.targetBranches || [],
      branchPayments: [],
      totalPaid: 0,
      remainingAmount: billData.totalAmount,
      status: 'pending',
      branchId: billData.branchId || currentUser?.branchId || '',
      branchLocation: billData.branchLocation || currentUser?.branchLocation || '',
      createdBy: currentUser?.id || 'system',
      createdByName: currentUser?.name || 'System',
      createdAt: new Date(),
    };
    
    setPendingBills([...pendingBills, newBill]);
    setDocument(COLLECTIONS.bills, newBill.id, newBill, false).catch(console.error);
    
    // Add notification
    addNotification({
      type: 'info',
      title: 'New Bill Created',
      message: `Bill ${billNumber} for ${billData.productName} - ₹${billData.totalAmount.toLocaleString('en-IN')}`,
    });
    
    return newBill;
  };

  const payBill = (billId: string, paymentData: Omit<BranchBillPayment, 'id' | 'createdAt'>): BranchBillPayment => {
    const newPayment: BranchBillPayment = {
      ...paymentData,
      id: `BPAY-${Date.now()}`,
      billId: billId,
      createdAt: new Date(),
    };
    
    setPendingBills(pendingBills.map(bill => {
      if (bill.id === billId) {
        const updatedPayments = [...bill.branchPayments, newPayment];
        const newTotalPaid = bill.totalPaid + paymentData.paidAmount;
        const newRemainingAmount = bill.totalAmount - newTotalPaid;
        const newStatus = newRemainingAmount === 0 ? 'paid' : newRemainingAmount < bill.totalAmount ? 'partial' : 'pending';
        
        return {
          ...bill,
          branchPayments: updatedPayments,
          totalPaid: newTotalPaid,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          paidAt: newStatus === 'paid' ? new Date() : bill.paidAt,
        };
      }
      return bill;
    }));
    
    // Persist payment to the bill in Firebase (we update the entire bill document)
    const updatedBill = pendingBills.find(b => b.id === billId);
    if (updatedBill) {
      const newTotalPaid = updatedBill.totalPaid + paymentData.paidAmount;
      const newRemainingAmount = updatedBill.totalAmount - newTotalPaid;
      const newStatus = newRemainingAmount === 0 ? 'paid' : newRemainingAmount < updatedBill.totalAmount ? 'partial' : 'pending';
      const billToSave = {
        ...updatedBill,
        branchPayments: [...updatedBill.branchPayments, newPayment],
        totalPaid: newTotalPaid,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date() : updatedBill.paidAt,
      };
      setDocument(COLLECTIONS.bills, billToSave.id, billToSave, false).catch(console.error);
    }
    
    // Add notification
    addNotification({
      type: 'success',
      title: 'Bill Payment Recorded',
      message: `${paymentData.branchName} paid ₹${paymentData.paidAmount.toLocaleString('en-IN')} for Bill ${billId}`,
    });
    
    return newPayment;
  };

  const getBillsForBranch = (branchLocation: string): PendingBill[] => {
    // Branch admins see bills that target their branch
    // Inventory managers and super admins see all bills
    if (currentUser?.role === 'branch-admin') {
      return pendingBills.filter(bill => 
        bill.targetBranches.includes(branchLocation as any)
      );
    }
    return pendingBills;
  };

  const createBranchTransfer = (data: {
    fromBranchId: string;
    fromBranchLocation: string;
    toBranchId: string;
    toBranchLocation: string;
    productId: string;
    productName: string;
    quantity: number;
    remarks: string;
  }): BranchTransfer => {
    const nextNum = branchTransfers.length + 1;
    const transferNumber = `TRF-2024-${String(nextNum).padStart(3, '0')}`;
    const newTransfer: BranchTransfer = {
      id: `transfer-${nextNum}`,
      transferNumber,
      fromBranchId: data.fromBranchId,
      fromBranchLocation: data.fromBranchLocation as any,
      toBranchId: data.toBranchId,
      toBranchLocation: data.toBranchLocation as any,
      productId: data.productId,
      productName: data.productName,
      quantity: data.quantity,
      status: 'requested',
      requestedBy: currentUser?.id || 'system',
      requestedAt: new Date(),
      remarks: data.remarks,
    };
    setBranchTransfers(prev => [newTransfer, ...prev]);

    // Persist to Firestore
    setDocument(COLLECTIONS.transfers, newTransfer.id, newTransfer, false).catch((err) =>
      console.error('[AppContext] Failed to create branch transfer in Firestore:', err)
    );

    // Notify both source and destination branches
    const fromBranchName = branches.find(b => b.id === data.fromBranchId)?.name || data.fromBranchLocation;
    const toBranchName = branches.find(b => b.id === data.toBranchId)?.name || data.toBranchLocation;
    
    // Notify source branch (branch that is sending stock)
    addNotification({
      type: 'info',
      title: 'Stock Transfer Requested',
      message: `${data.quantity} × ${data.productName} requested from ${fromBranchName} → ${toBranchName}`,
      branchLocation: data.fromBranchLocation,
    });
    
    // Also notify destination branch (branch receiving stock)
    addNotification({
      type: 'info',
      title: 'Stock Transfer Incoming',
      message: `${data.quantity} × ${data.productName} incoming from ${fromBranchName} to ${toBranchName}`,
      branchLocation: data.toBranchLocation,
    });

    return newTransfer;
  };

  const updateBranchTransfer = (id: string, updates: Partial<BranchTransfer>) => {
    setBranchTransfers(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };

      // Persist status/field changes to Firestore
      updateDocument(COLLECTIONS.transfers, id, { ...updates }).catch((err) =>
        console.error('[AppContext] Failed to update branch transfer in Firestore:', err)
      );

      // When status changes to 'received', move the actual stock
      if (updates.status === 'received' && t.status !== 'received') {
        // Deduct from source branch
        const sourceStock = branchStock.find(
          bs => bs.branchId === t.fromBranchId && bs.productId === t.productId
        );
        if (sourceStock) {
          updateBranchStock(t.fromBranchId, t.productId, Math.max(0, sourceStock.freshQuantity - t.quantity));
        }
        // Add to target branch
        const targetStock = branchStock.find(
          bs => bs.branchId === t.toBranchId && bs.productId === t.productId
        );
        if (targetStock) {
          updateBranchStock(t.toBranchId, t.productId, targetStock.freshQuantity + t.quantity);
        }

        addNotification({
          type: 'success',
          title: 'Transfer Received',
          message: `${t.quantity} × ${t.productName} received at ${t.toBranchLocation}. Stock updated.`,
          global: true,
        });
      }

      return updated;
    }));
  };

  const addDayBookEntry = (entryData: Omit<DayBookEntry, 'id' | 'createdAt'>): DayBookEntry => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newEntry: DayBookEntry = {
      ...entryData,
      id: `DBE-${uniqueSuffix}`,
      createdAt: new Date(),
    };
    setDayBookEntries(prev => [...prev, newEntry]);
    
    // Persist to Firestore with proper error handling
    setDocument(COLLECTIONS.dayBookEntries, newEntry.id, newEntry, false).catch((err: any) => {
      console.error('[AppContext] Failed to write dayBookEntry to Firestore:', err);
      // Remove from state if write fails
      setDayBookEntries(prev => prev.filter(e => e.id !== newEntry.id));
      // Notify user of the failure
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: `Failed to save ₹${newEntry.amount} entry. ${err?.code === 'permission-denied' ? 'Permission denied.' : 'Please try again.'}`,
        branchLocation: newEntry.branchLocation,
      });
    });
    
    return newEntry;
  };

  const value: AppContextType = {
    currentUser,
    authLoading,
    login,
    logout,
    changePassword,
    customers,
    addCustomer,
    updateCustomer,
    products,
    updateProduct,
    addProduct,
    deleteProduct,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    orders,
    createOrder,
    addOrder,
    getOrdersForBranch,
    updateOrderStatus,
    updateOrder,
    leads,
    updateLead,
    addLead,
    addNoteToLead,
    addCallLogToLead,
    dealers,
    addDealer,
    updateDealer,
    addDealerPayment,
    pendingBills,
    createPendingBill,
    payBill,
    getBillsForBranch,
    stockMovements,
    addStockMovement,
    notifications,
    getFilteredNotifications,
    markNotificationAsRead,
    addNotification,
    branchStock,
    updateBranchStock,
    updateBranchStockQtyById,
    updateBranchStockRack,
    addBranchStockEntry,
    splitBranchStock,
    branches,
    branchTransfers,
    createBranchTransfer,
    updateBranchTransfer,
    dayBookEntries,
    addDayBookEntry,
    autoStockReductionEnabled,
    setAutoStockReductionEnabled,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    console.error('useApp must be used within AppProvider. Make sure your component is wrapped in <AppProvider>');
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};