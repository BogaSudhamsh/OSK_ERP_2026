// ============================================================================
// OSK Granite — Role-Based Access Control (RBAC)
// ============================================================================
// Mirrors the Firestore collections schema:
//
//   Collection 1 — users       (SHARED)      one doc per person
//   Collection 2 — branches    (STATIC)      aziznagar, sangareddy, vikarabad
//   Collection 3 — products    (CENTRAL)     managed by inventory manager
//   Collection 4 — stock       (PER BRANCH)  how many slabs at each branch
//   Collection 5 — orders      (PER BRANCH)  store creates these
//   Collection 6-9 — customers, dealers, transfers, bills  (SUPPORTING)
//
// WHO CAN READ/WRITE WHAT:
//
//   super-admin       Reads & writes everything. No restrictions.
//   inventory         Full access to products, stock, dealers, bills.
//                     Cannot touch orders.
//   branch-admin      Read/Write only where branchId == their branch.
//                     Can see stock & orders for own branch.
//   stock-manager     Read/Write stock for own branch only.
//                     Cannot edit products catalog.
//   store (staff)     Create orders, read products & customers for own
//                     branch only.
// ============================================================================

import type { UserRole, BranchLocation } from '@/app/types';

// ---------------------------------------------------------------------------
// Collection names (matching Firestore schema)
// ---------------------------------------------------------------------------
export type Collection =
  | 'users'
  | 'branches'
  | 'products'
  | 'stock'
  | 'orders'
  | 'customers'
  | 'dealers'
  | 'transfers'
  | 'bills';

export type Action = 'read' | 'write' | 'create' | 'delete';

// ---------------------------------------------------------------------------
// Permission context — passed into every check
// ---------------------------------------------------------------------------
export interface PermissionContext {
  role: UserRole;
  userBranchId?: string;
  userBranchLocation?: BranchLocation;
  /** The branchId of the document being accessed (for scoped checks) */
  targetBranchId?: string;
  targetBranchLocation?: BranchLocation;
}

// ---------------------------------------------------------------------------
// Core permission check
// ---------------------------------------------------------------------------
export function hasPermission(
  ctx: PermissionContext,
  collection: Collection,
  action: Action
): boolean {
  const { role, userBranchLocation, targetBranchLocation } = ctx;

  // ── Super Admin: full access, no restrictions ──
  if (role === 'super-admin') return true;

  // ── Inventory Manager ──
  // Full access to: products, stock, dealers, bills
  // Cannot touch: orders
  if (role === 'inventory') {
    if (['products', 'stock', 'dealers', 'bills', 'transfers'].includes(collection)) return true;
    if (collection === 'customers') return action === 'read';
    if (collection === 'branches') return action === 'read';
    if (collection === 'orders') return false; // cannot touch orders
    if (collection === 'users') return action === 'read';
    return false;
  }

  // ── Branch Admin ──
  // Read/Write only where branchId == their branch
  // Can see stock & orders for own branch
  if (role === 'branch-admin') {
    if (collection === 'branches') return action === 'read';
    if (collection === 'users') return action === 'read';
    if (collection === 'products') return action === 'read'; // catalog is read-only

    // Branch-scoped collections
    const isSameBranch = !targetBranchLocation || targetBranchLocation === userBranchLocation;
    if (['stock', 'orders', 'customers'].includes(collection)) {
      return isSameBranch; // read + write within own branch
    }
    if (collection === 'dealers') return action === 'read';
    if (collection === 'transfers') return isSameBranch;
    if (collection === 'bills') return action === 'read' && isSameBranch;
    return false;
  }

  // ── Stock Manager ──
  // Read/Write stock for own branch only
  // Cannot edit products catalog
  if (role === 'stock-manager') {
    if (collection === 'branches') return action === 'read';
    if (collection === 'users') return action === 'read';
    if (collection === 'products') return action === 'read'; // read-only catalog

    const isSameBranch = !targetBranchLocation || targetBranchLocation === userBranchLocation;
    if (collection === 'stock') return isSameBranch; // full stock access for own branch
    if (collection === 'orders') return action === 'read' && isSameBranch;
    if (collection === 'customers') return action === 'read' && isSameBranch;
    if (collection === 'dealers') return action === 'read';
    if (collection === 'transfers') return isSameBranch;
    if (collection === 'bills') return false;
    return false;
  }

  // ── Store Manager / Store Staff ──
  // Create orders, read products & customers for own branch only
  if (role === 'store-manager' || role === 'store') {
    if (collection === 'branches') return action === 'read';
    if (collection === 'users') return action === 'read';
    if (collection === 'products') return action === 'read'; // read catalog
    if (collection === 'dealers') return false;
    if (collection === 'bills') return false;
    if (collection === 'transfers') return false;

    const isSameBranch = !targetBranchLocation || targetBranchLocation === userBranchLocation;
    if (collection === 'stock') return action === 'read' && isSameBranch;
    if (collection === 'customers') {
      return isSameBranch && (action === 'read' || action === 'create' || action === 'write');
    }
    if (collection === 'orders') {
      return isSameBranch && (action === 'read' || action === 'create');
    }
    return false;
  }

  // ── Sales ──
  if (role === 'sales') {
    if (['products', 'customers', 'branches', 'users'].includes(collection)) return action === 'read';
    return false;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export function canRead(ctx: PermissionContext, collection: Collection): boolean {
  return hasPermission(ctx, collection, 'read');
}

export function canWrite(ctx: PermissionContext, collection: Collection): boolean {
  return hasPermission(ctx, collection, 'write');
}

export function canCreate(ctx: PermissionContext, collection: Collection): boolean {
  return hasPermission(ctx, collection, 'create');
}

export function canDelete(ctx: PermissionContext, collection: Collection): boolean {
  return hasPermission(ctx, collection, 'delete');
}

/** Check if user can access a specific branch's data */
export function canAccessBranch(ctx: PermissionContext, branchLocation: BranchLocation): boolean {
  if (ctx.role === 'super-admin') return true;
  if (ctx.role === 'inventory') return true; // inventory sees all branches for stock
  return ctx.userBranchLocation === branchLocation;
}

/** Get all collections a role can read */
export function getReadableCollections(role: UserRole): Collection[] {
  const all: Collection[] = ['users', 'branches', 'products', 'stock', 'orders', 'customers', 'dealers', 'transfers', 'bills'];

  const ctx: PermissionContext = { role };
  return all.filter(c => hasPermission(ctx, c, 'read'));
}

/** Get all collections a role can write */
export function getWritableCollections(role: UserRole): Collection[] {
  const all: Collection[] = ['users', 'branches', 'products', 'stock', 'orders', 'customers', 'dealers', 'transfers', 'bills'];

  const ctx: PermissionContext = { role };
  return all.filter(c => hasPermission(ctx, c, 'write'));
}

// ---------------------------------------------------------------------------
// Role display helpers
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<UserRole, string> = {
  'super-admin': 'Super Admin',
  'inventory-manager': 'Inventory Manager',
  'branch-admin': 'Branch Admin',
  'stock-manager': 'Stock Manager',
  'sales-manager': 'Sales Manager',
  'cashier': 'Cashier',
  'store-staff': 'Store Staff',
  'store-manager': 'Store Manager',
  'store': 'Store Staff',
  'inventory': 'Inventory Manager',
  'sales': 'Sales Executive',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  'super-admin': 'Reads & writes everything. No restrictions.',
  'inventory-manager': 'Full access to products, stock, dealers, bills, and cross-branch operations.',
  'branch-admin': 'Read/Write only where branchId matches their branch. Can see stock & orders for own branch.',
  'stock-manager': 'Read/Write stock for own branch only. Cannot edit products catalog.',
  'sales-manager': 'Manages leads, customers, and branch sales workflows.',
  'cashier': 'Creates invoices, records payments, and handles daily POS operations.',
  'store-staff': 'View-focused branch role with limited operational access.',
  'store-manager': 'Create orders, read products & customers for own branch only.',
  'store': 'Create orders, read products & customers for own branch only.',
  'inventory': 'Full access to products, stock, dealers, bills. Cannot touch orders.',
  'sales': 'Read-only access to products and customers.',
};

// ---------------------------------------------------------------------------
// Collection metadata (matching Firestore schema)
// ---------------------------------------------------------------------------
export const COLLECTION_META: Record<Collection, {
  label: string;
  scope: 'shared' | 'static' | 'central' | 'per-branch' | 'supporting';
  description: string;
}> = {
  users: {
    label: 'Users',
    scope: 'shared',
    description: 'One doc per person — name, email, role, branchId',
  },
  branches: {
    label: 'Branches',
    scope: 'static',
    description: 'Aziz Nagar, Sangareddy, Vikarabad — name, location, email, status',
  },
  products: {
    label: 'Products',
    scope: 'central',
    description: 'Central catalog managed by inventory manager — name, size, grade, pricePerUnit, category',
  },
  stock: {
    label: 'Stock',
    scope: 'per-branch',
    description: 'How many slabs at each branch — productId, branchId, quantity, brokenQuantity, minQuantity',
  },
  orders: {
    label: 'Orders',
    scope: 'per-branch',
    description: 'Store creates these — branchId, customerId, items, totalAmount, status',
  },
  customers: {
    label: 'Customers',
    scope: 'supporting',
    description: 'Customer records — branchId, name, phone, contact info',
  },
  dealers: {
    label: 'Dealers',
    scope: 'supporting',
    description: 'Managed by inventory manager — name, balance, ledger info',
  },
  transfers: {
    label: 'Transfers',
    scope: 'supporting',
    description: 'Inter-branch stock transfers — fromBranch, toBranch',
  },
  bills: {
    label: 'Bills',
    scope: 'supporting',
    description: 'Dealer bills — dealerId, linked dealer, status (paid/pending)',
  },
};
