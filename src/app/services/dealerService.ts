// ============================================================================
// OSK Granite — Dealer Firestore Service (Live CRUD)
// ============================================================================
// All dealer operations go through Firestore. Local state is kept in sync
// via real-time listener (onSnapshot). No more mock-only dealers.
// ============================================================================

import {
  COLLECTIONS,
  fetchCollection,
  setDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  serverTimestamp,
} from './firebase';
import type { Dealer, DealerPayment } from '@/app/types';

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

/** Parse Firestore doc back into a Dealer with proper Date fields */
function parseDealer(doc: Record<string, any>): Dealer {
  return {
    ...doc,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    payments: (doc.payments || []).map((p: any) => ({
      ...p,
      paymentDate: p.paymentDate ? new Date(p.paymentDate) : new Date(),
      createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
    })),
  } as Dealer;
}

// ---------------------------------------------------------------------------
// Fetch all dealers (one-time read)
// ---------------------------------------------------------------------------

export async function fetchDealers(): Promise<Dealer[]> {
  try {
    const docs = await fetchCollection(COLLECTIONS.dealers);
    return docs.map(parseDealer);
  } catch (err) {
    console.warn('[dealerService] Firestore fetch failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Real-time subscription
// ---------------------------------------------------------------------------

export function subscribeToDealers(
  callback: (dealers: Dealer[]) => void
): () => void {
  return subscribeToCollection(
    COLLECTIONS.dealers,
    (docs) => {
      // Always call the callback, even if docs is empty
      // This ensures the UI properly shows "no dealers" state
      callback(docs.map(parseDealer));
    }
  );
}

// ---------------------------------------------------------------------------
// Create a new dealer
// ---------------------------------------------------------------------------

export async function createDealer(
  dealer: Dealer
): Promise<void> {
  const { id, ...data } = dealer;
  const serialized = serializeForFirestore(data as Record<string, any>);
  await setDocument(COLLECTIONS.dealers, id, serialized, false);
}

// ---------------------------------------------------------------------------
// Update dealer fields
// ---------------------------------------------------------------------------

export async function updateDealerDoc(
  dealerId: string,
  updates: Partial<Dealer>
): Promise<void> {
  const serialized = serializeForFirestore(updates as Record<string, any>);
  await updateDocument(COLLECTIONS.dealers, dealerId, serialized);
}

// ---------------------------------------------------------------------------
// Update dealer after payment (recalc financials + append payment)
// ---------------------------------------------------------------------------

export async function addPaymentToDealer(
  dealerId: string,
  currentDealer: Dealer,
  newPayment: any,
  financials: { totalPurchases: number; totalPaid: number; outstandingPayment: number }
): Promise<void> {
  const updatedPayments = [...(currentDealer.payments || []), newPayment];
  const serialized = serializeForFirestore({
    payments: updatedPayments,
    totalPurchases: financials.totalPurchases,
    totalPaid: financials.totalPaid,
    outstandingPayment: financials.outstandingPayment,
  });
  await updateDocument(COLLECTIONS.dealers, dealerId, serialized);
}

// ---------------------------------------------------------------------------
// Delete a dealer
// ---------------------------------------------------------------------------

export async function deleteDealer(dealerId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.dealers, dealerId);
}