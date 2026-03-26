// ============================================================================
// OSK Granite — Mock Firestore Service
// ============================================================================
// localStorage-backed Firestore-like API.
// Supports where / orderBy query constraints and real-time subscriptions.
// All other service files import from here instead of the real firebase SDK.
// ============================================================================

const STORAGE_PREFIX = 'osk_firestore_';

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
    const now = new Date();
    return {
      toDate: () => now,
      seconds: Math.floor(now.getTime() / 1000),
      nanoseconds: (now.getTime() % 1000) * 1_000_000,
    };
  },
  fromDate(date: Date): TimestampLike {
    return {
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1_000_000,
    };
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

export const COLLECTIONS = {
  products: 'products',
  dealers: 'dealers',
  customers: 'customers',
  orders: 'orders',
  leads: 'leads',
  bills: 'bills',
  stockMovements: 'stockMovements',
  dayBookEntries: 'dayBookEntries',
  notifications: 'notifications',
  transfers: 'branchTransfers',
  stock: 'branchStock',
  branches: 'branches',
  productNames: 'productNames',
  categories: 'categories',
  sizes: 'sizes',
  grades: 'grades',
  itemNames: 'itemNames',
} as const;

// ── Query builders ────────────────────────────────────────────────────────────

export function where(field: string, op: WhereFilterOp, value: unknown): QueryConstraint {
  return { _type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { _type: 'orderBy', field, direction };
}

export function serverTimestamp(): string {
  return new Date().toISOString();
}

// ── localStorage helpers ──────────────────────────────────────────────────────

type DocMap = Record<string, Record<string, unknown>>;

function storageKey(collection: string): string {
  return `${STORAGE_PREFIX}${collection}`;
}

function loadCollection(collection: string): DocMap {
  try {
    const raw = localStorage.getItem(storageKey(collection));
    return raw ? (JSON.parse(raw) as DocMap) : {};
  } catch {
    return {};
  }
}

function saveCollection(collection: string, docs: DocMap): void {
  try {
    localStorage.setItem(storageKey(collection), JSON.stringify(docs));
  } catch (e) {
    console.error(`[firebase] Failed to persist collection "${collection}":`, e);
  }
}

// ── Subscription registry ─────────────────────────────────────────────────────

type Subscriber = {
  callback: (docs: unknown[]) => void;
  constraints: QueryConstraint[];
};

const subscribers = new Map<string, Set<Subscriber>>();

function notifySubscribers(collection: string): void {
  const subs = subscribers.get(collection);
  if (!subs || subs.size === 0) return;
  const docs = loadCollection(collection);
  for (const sub of subs) {
    const results = applyConstraints(Object.values(docs), sub.constraints);
    try {
      sub.callback(results);
    } catch (e) {
      console.error('[firebase] Subscriber callback error:', e);
    }
  }
}

// ── Query application ─────────────────────────────────────────────────────────

function applyConstraints(
  docs: Record<string, unknown>[],
  constraints: QueryConstraint[],
): Record<string, unknown>[] {
  let result = [...docs];

  // Apply all where constraints first
  for (const c of constraints) {
    if (c._type === 'where' && c.field && c.op !== undefined) {
      result = result.filter((doc) => matchesWhere(doc, c.field, c.op!, c.value));
    }
  }

  // Apply orderBy constraints
  for (const c of constraints) {
    if (c._type === 'orderBy' && c.field) {
      const dir = c.direction === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const av = a[c.field];
        const bv = b[c.field];
        if (av === bv) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return av < bv ? -dir : dir;
      });
    }
  }

  return result;
}

function matchesWhere(
  doc: Record<string, unknown>,
  field: string,
  op: WhereFilterOp,
  value: unknown,
): boolean {
  const docVal = doc[field];
  switch (op) {
    case '==': return docVal === value;
    case '!=': return docVal !== value;
    case '<': return (docVal as number) < (value as number);
    case '<=': return (docVal as number) <= (value as number);
    case '>': return (docVal as number) > (value as number);
    case '>=': return (docVal as number) >= (value as number);
    case 'array-contains': return Array.isArray(docVal) && docVal.includes(value);
    case 'in': return Array.isArray(value) && (value as unknown[]).includes(docVal);
    case 'not-in': return Array.isArray(value) && !(value as unknown[]).includes(docVal);
    default: return true;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchCollection<T = Record<string, unknown>>(
  collection: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const docs = loadCollection(collection);
  return applyConstraints(Object.values(docs), constraints) as T[];
}

export async function fetchDoc<T = Record<string, unknown>>(
  collection: string,
  id: string,
): Promise<T | null> {
  const docs = loadCollection(collection);
  return (docs[id] as T) ?? null;
}

export async function setDocument(
  collection: string,
  id: string,
  data: Record<string, unknown>,
  merge = true,
): Promise<void> {
  const docs = loadCollection(collection);
  const existing = merge ? (docs[id] ?? {}) : {};
  docs[id] = { ...existing, ...data, id };
  saveCollection(collection, docs);
  notifySubscribers(collection);
}

export async function updateDocument(
  collection: string,
  id: string,
  updates: Record<string, unknown>,
): Promise<void> {
  const docs = loadCollection(collection);
  if (docs[id]) {
    docs[id] = { ...docs[id], ...updates, id };
    saveCollection(collection, docs);
    notifySubscribers(collection);
  }
}

export async function deleteDocument(
  collection: string,
  id: string,
): Promise<void> {
  const docs = loadCollection(collection);
  if (docs[id]) {
    delete docs[id];
    saveCollection(collection, docs);
    notifySubscribers(collection);
  }
}

export async function createDoc(
  collection: string,
  data: Record<string, unknown>,
): Promise<string> {
  const id = generateId();
  await setDocument(collection, id, { ...data, id }, false);
  return id;
}

export function subscribeToCollection<T = Record<string, unknown>>(
  collection: string,
  callback: (docs: T[]) => void,
  ...constraints: QueryConstraint[]
): () => void {
  const sub: Subscriber = {
    callback: callback as (docs: unknown[]) => void,
    constraints,
  };

  if (!subscribers.has(collection)) {
    subscribers.set(collection, new Set());
  }
  subscribers.get(collection)!.add(sub);

  // Immediately invoke with current data
  const docs = loadCollection(collection);
  const results = applyConstraints(Object.values(docs), constraints) as T[];
  try {
    callback(results);
  } catch (e) {
    console.error('[firebase] Initial subscription error:', e);
  }

  return () => {
    subscribers.get(collection)?.delete(sub);
  };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
