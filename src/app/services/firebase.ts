// ============================================================================
// OSK Granite — Firebase Firestore Service (Live SDK)
// ============================================================================
// Wraps the official Firebase SDK with the same API surface the rest of the
// codebase uses — no changes needed in any other service file.
// ============================================================================

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  onSnapshot,
  query,
  where as firestoreWhere,
  orderBy as firestoreOrderBy,
  Timestamp as FirestoreTimestamp,
  type Firestore,
  type QueryConstraint as FirestoreQueryConstraint,
} from 'firebase/firestore';

// ── Firebase config (from .env) ───────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ── App + DB singletons ───────────────────────────────────────────────────────

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

function getDB(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface TimestampLike {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

export const Timestamp = {
  now(): TimestampLike {
    return FirestoreTimestamp.now();
  },
  fromDate(date: Date): TimestampLike {
    return FirestoreTimestamp.fromDate(date);
  },
};

type WhereFilterOp =
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'array-contains'
  | 'in'
  | 'not-in';

export interface QueryConstraint {
  _type: 'where' | 'orderBy';
  field: string;
  op?: WhereFilterOp;
  value?: unknown;
  direction?: 'asc' | 'desc';
}

// ── Collection name constants ─────────────────────────────────────────────────
//
// The live Firebase belongs to the CRM system which owns these collections:
//   agents | branches | jobs | location_history | notifications | users
//
// From those, ERP only shares ONE: `leads` (read + write).
//
// To avoid colliding with the CRM's own `branches` and `notifications`,
// the ERP uses prefixed names: erp_branches, erp_notifications.
// All other ERP collections are net-new.

export const COLLECTIONS = {
  // ── Shared with CRM ────────────────────────────────────────────────────────
  leads:           'leads',         // Shared with CRM — ERP reads & creates leads
  // ── ERP users — separate from CRM users ──────────────────────────────────
  users:           'erp_users',     // ERP staff profiles (role, branchId, etc.)
  // ── ERP-only collections (never overlap CRM) ──────────────────────────────
  branches:        'erp_branches',  // OSK store branches (aziz-nagar, sangareddy, vikarabad)
  notifications:   'erp_notifications',
  products:        'products',
  dealers:         'dealers',
  customers:       'customers',
  orders:          'orders',
  bills:           'bills',
  stockMovements:  'stockMovements',
  dayBookEntries:  'dayBookEntries',
  transfers:       'branchTransfers',
  stock:           'branchStock',
  productNames:    'productNames',
  categories:      'categories',
  sizes:           'sizes',
  grades:          'grades',
  itemNames:       'itemNames',
} as const;

// ── Query builders ────────────────────────────────────────────────────────────

export function where(field: string, op: WhereFilterOp, value: unknown): QueryConstraint {
  return { _type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { _type: 'orderBy', field, direction };
}

// Returns an ISO string — compatible with all existing service code which
// stores/reads timestamps as strings. Use FirestoreTimestamp on new code.
export function serverTimestamp(): string {
  return new Date().toISOString();
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function buildConstraints(constraints: QueryConstraint[]): FirestoreQueryConstraint[] {
  return constraints.map((c) => {
    if (c._type === 'where' && c.field && c.op !== undefined) {
      return firestoreWhere(c.field, c.op as Parameters<typeof firestoreWhere>[1], c.value);
    }
    if (c._type === 'orderBy' && c.field) {
      return firestoreOrderBy(c.field, c.direction ?? 'asc');
    }
    throw new Error(`[firebase] Unknown constraint: ${JSON.stringify(c)}`);
  });
}

// Normalise a Firestore document snapshot into a plain object.
// Firestore Timestamps are kept as-is (they implement TimestampLike via .toDate()).
function normalizeDoc(id: string, data: Record<string, unknown>): Record<string, unknown> {
  return { ...data, id };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchCollection<T = Record<string, unknown>>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const colRef = collection(getDB(), collectionName);
  const q = constraints.length > 0
    ? query(colRef, ...buildConstraints(constraints))
    : query(colRef);
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeDoc(d.id, d.data() as Record<string, unknown>) as T);
}

export async function fetchDoc<T = Record<string, unknown>>(
  collectionName: string,
  id: string,
): Promise<T | null> {
  const snap = await getDoc(doc(getDB(), collectionName, id));
  if (!snap.exists()) return null;
  return normalizeDoc(snap.id, snap.data() as Record<string, unknown>) as T;
}

export async function setDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
  merge = true,
): Promise<void> {
  const { id: _id, ...payload } = data;
  await setDoc(doc(getDB(), collectionName, id), payload, { merge });
}

export async function updateDocument(
  collectionName: string,
  id: string,
  updates: Record<string, unknown>,
): Promise<void> {
  const { id: _id, ...payload } = updates;
  await updateDoc(doc(getDB(), collectionName, id), payload);
}

export async function deleteDocument(
  collectionName: string,
  id: string,
): Promise<void> {
  await deleteDoc(doc(getDB(), collectionName, id));
}

export async function createDoc(
  collectionName: string,
  data: Record<string, unknown>,
): Promise<string> {
  const { id: _id, ...payload } = data;
  const ref = await addDoc(collection(getDB(), collectionName), payload);
  // Write the generated id back so documents self-reference their own id
  await updateDoc(ref, { id: ref.id });
  return ref.id;
}

export function subscribeToCollection<T = Record<string, unknown>>(
  collectionName: string,
  callback: (docs: T[]) => void,
  ...constraints: QueryConstraint[]
): () => void {
  const colRef = collection(getDB(), collectionName);
  const q = constraints.length > 0
    ? query(colRef, ...buildConstraints(constraints))
    : query(colRef);

  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map(
        (d) => normalizeDoc(d.id, d.data() as Record<string, unknown>) as T,
      );
      try {
        callback(docs);
      } catch (e) {
        console.error(`[firebase] Subscriber error (${collectionName}):`, e);
      }
    },
    (err) => console.error(`[firebase] onSnapshot error (${collectionName}):`, err),
  );
}
