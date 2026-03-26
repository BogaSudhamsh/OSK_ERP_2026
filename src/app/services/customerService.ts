// ============================================================================
// OSK Granite — Customer Firestore Service (Live CRUD)
// ============================================================================

import {
  COLLECTIONS,
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  type QueryConstraint,
} from './firebase';
import type { Customer } from '@/app/types';

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

function serializeForFirestore(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        item instanceof Date ? item.toISOString() :
        (typeof item === 'object' && item !== null) ? serializeForFirestore(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = serializeForFirestore(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function deserializeCustomer(raw: any): Customer {
  return {
    ...raw,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
  } as Customer;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createCustomerDoc(customer: Customer): Promise<void> {
  const { id, ...data } = customer;
  await setDocument(COLLECTIONS.customers, id, serializeForFirestore(data));
}

export async function updateCustomerDoc(id: string, updates: Partial<Customer>): Promise<void> {
  await updateDocument(COLLECTIONS.customers, id, serializeForFirestore({
    ...updates,
    updatedAt: new Date(),
  }));
}

export async function deleteCustomerDoc(id: string): Promise<void> {
  await deleteDocument(COLLECTIONS.customers, id);
}

// ---------------------------------------------------------------------------
// Real-time listener
// ---------------------------------------------------------------------------

export function subscribeToCustomers(
  callback: (customers: Customer[]) => void,
  ...constraints: QueryConstraint[]
): () => void {
  return subscribeToCollection<Customer>(
    COLLECTIONS.customers,
    (docs) => callback(docs.map(deserializeCustomer)),
    ...constraints,
  );
}
