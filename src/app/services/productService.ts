// ============================================================================
// OSK Granite — Product Firestore Service (Live CRUD)
// ============================================================================
// All product operations go through Firestore. Local state is kept in sync
// via real-time listener (onSnapshot). No more mock-only products.
//
// NOTE: Product names, categories, sizes, and grades are now in their own
//       lookup collections — see lookupService.ts
// ============================================================================

import {
  COLLECTIONS,
  fetchCollection,
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
} from './firebase';
import type { Product } from '@/app/types';

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

function serializeForFirestore(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? serializeForFirestore(item)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = serializeForFirestore(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Parse Firestore doc back into a Product with proper Date fields */
function parseProduct(doc: Record<string, any>): Product {
  return {
    ...doc,
    price: Number(doc.price) || 0,
    stock: Number(doc.stock) || 0,
    purchasePrice: doc.purchasePrice ? Number(doc.purchasePrice) : undefined,
    brokenQuantity: doc.brokenQuantity ? Number(doc.brokenQuantity) : 0,
    totalReceived: doc.totalReceived ? Number(doc.totalReceived) : 0,
    soldQuantity: doc.soldQuantity ? Number(doc.soldQuantity) : 0,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    lastSuppliedDate: doc.lastSuppliedDate ? new Date(doc.lastSuppliedDate) : undefined,
    images: doc.images || [],
    specifications: doc.specifications || {},
    enabled: doc.enabled !== false, // default true
  } as Product;
}

// ---------------------------------------------------------------------------
// Fetch all products (one-time read)
// ---------------------------------------------------------------------------

export async function fetchProducts(): Promise<Product[]> {
  try {
    const docs = await fetchCollection(COLLECTIONS.products);
    return docs.map(parseProduct);
  } catch (err) {
    console.warn('[productService] Firestore fetch failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Real-time subscription
// ---------------------------------------------------------------------------

export function subscribeToProducts(
  callback: (products: Product[]) => void
): () => void {
  return subscribeToCollection(
    COLLECTIONS.products,
    (docs) => {
      callback(docs.map(parseProduct));
    }
  );
}

// ---------------------------------------------------------------------------
// Create a new product
// ---------------------------------------------------------------------------

export async function createProduct(product: Product): Promise<void> {
  const { id, ...data } = product;
  const serialized = serializeForFirestore(data as Record<string, any>);
  await setDocument(COLLECTIONS.products, id, serialized, false);
}

// ---------------------------------------------------------------------------
// Update product fields
// ---------------------------------------------------------------------------

export async function updateProductDoc(
  productId: string,
  updates: Partial<Product>
): Promise<void> {
  const serialized = serializeForFirestore(updates as Record<string, any>);
  await updateDocument(COLLECTIONS.products, productId, serialized);
}

// ---------------------------------------------------------------------------
// Delete a product
// ---------------------------------------------------------------------------

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.products, productId);
}