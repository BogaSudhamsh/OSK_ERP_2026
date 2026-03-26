// ============================================================================
// OSK Granite — Backend Stub (Firebase disconnected)
// ============================================================================

export type DocumentData = any;

export type QueryConstraint =
  | { type: 'where'; field: string; operator: string; value: unknown }
  | { type: 'orderBy'; field: string; direction: 'asc' | 'desc' }
  | { type: 'limit'; count: number };

export interface FirebaseUser {
  uid: string;
  email: string | null;
}

export const COLLECTIONS = {
  users: 'users',
  branches: 'branches',
  products: 'products',
  stock: 'branchStock',
  orders: 'orders',
  customers: 'customers',
  dealers: 'dealers',
  transfers: 'branchTransfers',
  bills: 'bills',
  productNames: 'productNames',
  categories: 'categories',
  sizes: 'sizes',
  grades: 'grades',
  itemNames: 'itemNames',
  notifications: 'notifications',
  config: 'config',
  settings: 'settings',
  leads: 'leads',
  stockMovements: 'stockMovements',
  dayBookEntries: 'dayBookEntries',
} as const;

type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
type Subscriber = () => void;
type AuthStateListener = (user: FirebaseUser | null) => void;
type StoredDocument = Record<string, unknown> & { id: string };
type CollectionRef = { kind: 'collection'; collectionName: string };
type DocRef = { kind: 'doc'; collectionName: string; docId: string };
type QueryRef = { kind: 'query'; collectionName: string; constraints: QueryConstraint[] };
type QueryLike = CollectionRef | QueryRef;
type QueryDocSnapshot = { id: string; data: () => Record<string, unknown> };
type QuerySnapshot = {
  docs: QueryDocSnapshot[];
  empty: boolean;
  size: number;
  forEach: (callback: (doc: QueryDocSnapshot) => void) => void;
};
type SingleDocSnapshot = {
  id: string;
  exists: () => boolean;
  data: () => Record<string, unknown> | undefined;
};

const DISCONNECTED_MESSAGE = 'Firebase connection has been removed. Configure a new backend before using auth, Firestore, or storage features.';

function createDisconnectedError(code: string, message: string = DISCONNECTED_MESSAGE) {
  const error = new Error(message) as Error & { code?: string };
  error.code = code;
  return error;
}

export class Timestamp {
  private readonly value: Date;

  private constructor(value: Date) {
    this.value = value;
  }

  static now(): Timestamp {
    return new Timestamp(new Date());
  }

  static fromDate(date: Date): Timestamp {
    return new Timestamp(date);
  }

  toDate(): Date {
    return new Date(this.value);
  }

  get seconds(): number {
    return Math.floor(this.value.getTime() / 1000);
  }

  get nanoseconds(): number {
    return (this.value.getTime() % 1000) * 1_000_000;
  }
}

const store = new Map<string, Map<string, StoredDocument>>();
const collectionSubscribers = new Map<string, Set<(snapshot: QuerySnapshot) => void>>();
const authSubscribers = new Set<AuthStateListener>();

const app = { backend: 'disconnected' } as const;
const db = { backend: 'disconnected' } as const;
const storage = { backend: 'disconnected' } as const;
const analytics = null;
const auth: { currentUser: FirebaseUser | null } = { currentUser: null };

function ensureCollection(name: string): Map<string, StoredDocument> {
  const existing = store.get(name);
  if (existing) return existing;
  const created = new Map<string, StoredDocument>();
  store.set(name, created);
  return created;
}

function cloneValue<T>(value: T): T {
  if (value instanceof Date) return new Date(value) as T;
  if (value instanceof Timestamp) return Timestamp.fromDate(value.toDate()) as T;
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, cloneValue(nested)])
    ) as T;
  }
  return value;
}

function normalizeComparable(value: unknown): string | number | boolean | null | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return value as string | number | boolean | null | undefined;
  }
  return JSON.stringify(value);
}

function applyConstraints(docs: StoredDocument[], constraints: QueryConstraint[]): StoredDocument[] {
  let result = [...docs];

  for (const constraint of constraints) {
    if (constraint.type === 'where' && constraint.operator === '==') {
      result = result.filter((doc) => normalizeComparable(doc[constraint.field]) === normalizeComparable(constraint.value));
    }

    if (constraint.type === 'orderBy') {
      result.sort((left, right) => {
        const a = normalizeComparable(left[constraint.field]);
        const b = normalizeComparable(right[constraint.field]);
        if (a === b) return 0;
        if (a == null) return constraint.direction === 'asc' ? -1 : 1;
        if (b == null) return constraint.direction === 'asc' ? 1 : -1;
        if (a < b) return constraint.direction === 'asc' ? -1 : 1;
        return constraint.direction === 'asc' ? 1 : -1;
      });
    }

    if (constraint.type === 'limit') {
      result = result.slice(0, constraint.count);
    }
  }

  return result;
}

function materializeDocs(ref: QueryLike): StoredDocument[] {
  const docs = [...ensureCollection(ref.collectionName).values()].map((doc) => cloneValue(doc));
  return ref.kind === 'query' ? applyConstraints(docs, ref.constraints) : docs;
}

function toQuerySnapshot(docs: StoredDocument[]): QuerySnapshot {
  const snapshots = docs.map((doc) => ({
    id: doc.id,
    data: () => {
      const { id: _id, ...data } = doc;
      return cloneValue(data);
    },
  }));

  return {
    docs: snapshots,
    empty: snapshots.length === 0,
    size: snapshots.length,
    forEach: (callback) => {
      snapshots.forEach(callback);
    },
  };
}

function notifyCollection(collectionName: string): void {
  const subscribers = collectionSubscribers.get(collectionName);
  if (!subscribers) return;
  subscribers.forEach((listener) => listener(toQuerySnapshot(materializeDocs({ kind: 'collection', collectionName }))));
}

function notifyAuth(): void {
  authSubscribers.forEach((listener) => listener(auth.currentUser));
}

export function getCollectionRef(name: CollectionName): CollectionRef {
  return collection(db, name);
}

export function getDocRef(collectionName: CollectionName, docId: string): DocRef {
  return doc(db, collectionName, docId);
}

export function collection(_db: unknown, collectionName: string): CollectionRef {
  return { kind: 'collection', collectionName };
}

export function doc(_db: unknown, collectionName: string, docId: string): DocRef {
  return { kind: 'doc', collectionName, docId };
}

export function query(ref: CollectionRef, ...constraints: QueryConstraint[]): QueryRef {
  return { kind: 'query', collectionName: ref.collectionName, constraints };
}

export function where(field: string, operator: string, value: unknown): QueryConstraint {
  return { type: 'where', field, operator, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { type: 'orderBy', field, direction };
}

export function limit(count: number): QueryConstraint {
  return { type: 'limit', count };
}

export async function getDocs(ref: QueryLike): Promise<QuerySnapshot> {
  return toQuerySnapshot(materializeDocs(ref));
}

export async function getDoc(ref: DocRef): Promise<SingleDocSnapshot> {
  const value = ensureCollection(ref.collectionName).get(ref.docId);
  return {
    id: ref.docId,
    exists: () => Boolean(value),
    data: () => {
      if (!value) return undefined;
      const { id: _id, ...data } = value;
      return cloneValue(data);
    },
  };
}

export async function addDoc(ref: CollectionRef, data: Record<string, unknown>): Promise<{ id: string }> {
  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await setDoc(doc(db, ref.collectionName, id), data, { merge: false });
  return { id };
}

export async function setDoc(ref: DocRef, data: Record<string, unknown>, options?: { merge?: boolean }): Promise<void> {
  const collectionStore = ensureCollection(ref.collectionName);
  const existing = collectionStore.get(ref.docId);
  const next = options?.merge && existing
    ? { ...existing, ...cloneValue(data), id: ref.docId }
    : { ...cloneValue(data), id: ref.docId };
  collectionStore.set(ref.docId, next);
  notifyCollection(ref.collectionName);
}

export async function updateDoc(ref: DocRef, updates: Record<string, unknown>): Promise<void> {
  const collectionStore = ensureCollection(ref.collectionName);
  const existing = collectionStore.get(ref.docId) ?? { id: ref.docId };
  collectionStore.set(ref.docId, { ...existing, ...cloneValue(updates), id: ref.docId });
  notifyCollection(ref.collectionName);
}

export async function deleteDoc(ref: DocRef): Promise<void> {
  ensureCollection(ref.collectionName).delete(ref.docId);
  notifyCollection(ref.collectionName);
}

export function onSnapshot(
  ref: QueryLike,
  onNext: (snapshot: QuerySnapshot) => void,
  onError?: (error: unknown) => void,
): Subscriber {
  try {
    const listeners = collectionSubscribers.get(ref.collectionName) ?? new Set<(snapshot: QuerySnapshot) => void>();
    collectionSubscribers.set(ref.collectionName, listeners);

    const listener = (snapshot: QuerySnapshot) => {
      if (ref.kind === 'query') {
        onNext(toQuerySnapshot(materializeDocs(ref)));
        return;
      }
      onNext(snapshot);
    };

    listeners.add(listener);
    listener(toQuerySnapshot(materializeDocs(ref)));

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        collectionSubscribers.delete(ref.collectionName);
      }
    };
  } catch (error) {
    onError?.(error);
    return () => {};
  }
}

export function serverTimestamp(): string {
  return new Date().toISOString();
}

export async function fetchCollection<T = DocumentData>(
  collectionName: CollectionName,
  ...constraints: QueryConstraint[]
): Promise<(T & { id: string })[]> {
  const ref = getCollectionRef(collectionName);
  const scoped = constraints.length > 0 ? query(ref, ...constraints) : ref;
  const snapshot = await getDocs(scoped);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as (T & { id: string })[];
}

export async function fetchDoc<T = DocumentData>(
  collectionName: CollectionName,
  docId: string,
): Promise<(T & { id: string }) | null> {
  const snapshot = await getDoc(getDocRef(collectionName, docId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T & { id: string };
}

export async function createDoc<T extends DocumentData>(
  collectionName: CollectionName,
  data: T,
): Promise<string> {
  const created = await addDoc(getCollectionRef(collectionName), {
    ...(data as Record<string, unknown>),
    createdAt: serverTimestamp(),
  });
  return created.id;
}

export async function setDocument<T extends DocumentData>(
  collectionName: CollectionName,
  docId: string,
  data: T,
  merge: boolean = true,
): Promise<void> {
  await setDoc(getDocRef(collectionName, docId), {
    ...(data as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  }, { merge });
}

export async function updateDocument(
  collectionName: CollectionName,
  docId: string,
  updates: Record<string, unknown>,
): Promise<void> {
  await updateDoc(getDocRef(collectionName, docId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(collectionName: CollectionName, docId: string): Promise<void> {
  await deleteDoc(getDocRef(collectionName, docId));
}

export function subscribeToCollection<T = DocumentData>(
  collectionName: CollectionName,
  callback: (docs: (T & { id: string })[]) => void,
  ...constraints: QueryConstraint[]
): Subscriber {
  const ref = constraints.length > 0 ? query(getCollectionRef(collectionName), ...constraints) : getCollectionRef(collectionName);
  return onSnapshot(ref, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as (T & { id: string })[]);
  }, () => callback([]));
}

export async function fetchBranchStock(branchId: string) {
  return fetchCollection(COLLECTIONS.stock, where('branchId', '==', branchId));
}

export async function fetchBranchOrders(branchId: string) {
  return fetchCollection(COLLECTIONS.orders, where('branchId', '==', branchId));
}

export async function fetchBranchCustomers(branchId: string) {
  return fetchCollection(COLLECTIONS.customers, where('branchId', '==', branchId));
}

export async function fetchBranchTransfersFrom(branchId: string) {
  return fetchCollection(COLLECTIONS.transfers, where('fromBranchId', '==', branchId));
}

export async function fetchBranchTransfersTo(branchId: string) {
  return fetchCollection(COLLECTIONS.transfers, where('toBranchId', '==', branchId));
}

export async function fetchDealerBills(dealerId: string) {
  return fetchCollection(COLLECTIONS.bills, where('dealerId', '==', dealerId));
}

export async function fetchLowStockItems(branchId: string) {
  const allStock = await fetchBranchStock(branchId);
  return allStock.filter((item: any) => {
    const min = item.minQuantity ?? 10;
    return item.freshQuantity <= min;
  });
}

export const storageService = {
  uploadFile: async (_file: File, _path: string): Promise<string> => {
    throw createDisconnectedError('backend/disconnected-storage');
  },
  uploadCustomerImage: async (_customerId: string, _file: File): Promise<string> => {
    throw createDisconnectedError('backend/disconnected-storage');
  },
  uploadProductImage: async (_productId: string, _file: File): Promise<string> => {
    throw createDisconnectedError('backend/disconnected-storage');
  },
  uploadDocument: async (_type: string, _docId: string, _file: File): Promise<string> => {
    throw createDisconnectedError('backend/disconnected-storage');
  },
};

export const leadsService = {
  update: async (leadId: string, data: unknown): Promise<void> => {
    await updateDocument(COLLECTIONS.leads, leadId, data as Record<string, unknown>);
  },
};

export function toDate(timestamp: Timestamp | Date | { seconds?: number } | string | number): Date {
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'object' && timestamp && typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp as string | number);
}

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export async function signInWithEmailAndPassword(
  _auth: unknown,
  _email: string,
  _password: string,
): Promise<{ user: FirebaseUser }> {
  throw createDisconnectedError('backend/disconnected-auth');
}

export async function firebaseSignOut(_auth: unknown): Promise<void> {
  auth.currentUser = null;
  notifyAuth();
}

export function onAuthStateChanged(_auth: unknown, callback: AuthStateListener): Subscriber {
  authSubscribers.add(callback);
  queueMicrotask(() => callback(auth.currentUser));
  return () => {
    authSubscribers.delete(callback);
  };
}

export async function sendPasswordResetEmail(_auth: unknown, _email: string): Promise<void> {
  throw createDisconnectedError('backend/disconnected-auth');
}

export function ref(_storage: unknown, path: string): { path: string } {
  return { path };
}

export async function uploadBytes(_ref: unknown, _file: File): Promise<{ ref: unknown }> {
  throw createDisconnectedError('backend/disconnected-storage');
}

export async function getDownloadURL(_ref: unknown): Promise<string> {
  throw createDisconnectedError('backend/disconnected-storage');
}

export {
  app,
  db,
  auth,
  analytics,
  storage,
};

export default app;
