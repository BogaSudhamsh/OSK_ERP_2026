// ============================================================================
// OSK Granite — Lookup Collections Firestore Service
// ============================================================================
//
// Manages 4 separate Firestore collections for dropdown/reference data:
//
//   Collection 10 — productNames  (CHEMICAL, GRANITE STONE, GVT-PGVT, …)
//   Collection 11 — categories    (Matt, Glossy, DC, MATT (FB), …)
//   Collection 12 — sizes         (300x300 mm, 600x600 mm, …)
//   Collection 13 — grades        (Alpha, Diamond, Premium, …)
//
// Each document follows the LookupItem shape:
//   { name, enabled, sortOrder, createdAt, updatedAt }
//
// One generic service handles all 4 — just pass the collection name.
// ============================================================================

import {
  COLLECTIONS,
  fetchCollection,
  createDoc,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  orderBy,
} from './firebase';
import type { LookupItem, LookupCollectionName } from '@/app/types';
import { PRODUCT_CATEGORIES } from '@/app/types';

// ---------------------------------------------------------------------------
// Default seed data (fallback if Firestore collections are empty)
// ---------------------------------------------------------------------------

export const DEFAULT_PRODUCT_NAMES: string[] = [
  'CHEMICAL',
  'GRANITE STONE',
  'GVT-PGVT',
  'MARBLE',
  'PORCELAIN',
  'SAND STONE',
  'SGDY GRANITE STONE',
];

export const DEFAULT_CATEGORIES: string[] = [...PRODUCT_CATEGORIES];

export const DEFAULT_SIZES: string[] = [
  '300x300 mm',
  '300x600 mm',
  '400x400 mm',
  '600x600 mm',
  '600x900 mm',
  '600x1200 mm',
  '800x800 mm',
  '800x1600 mm',
  '1000x1000 mm',
  '1200x1200 mm',
  '1200x1800 mm',
  '200x1200 mm',
  '145x600 mm',
  '200x200 mm',
  '100x300 mm',
];

export const DEFAULT_GRADES: string[] = [
  'Alpha',
  'Diamond',
  'Premium',
];

export const DEFAULT_ITEM_NAMES: string[] = [];

/** Map collection name → its default seed values */
export const LOOKUP_DEFAULTS: Record<LookupCollectionName, string[]> = {
  productNames: DEFAULT_PRODUCT_NAMES,
  categories: DEFAULT_CATEGORIES,
  sizes: DEFAULT_SIZES,
  grades: DEFAULT_GRADES,
  itemNames: DEFAULT_ITEM_NAMES,
};

// ---------------------------------------------------------------------------
// Parse helper
// ---------------------------------------------------------------------------

function parseLookupItem(doc: Record<string, any>): LookupItem {
  return {
    id: doc.id,
    name: doc.name || '',
    enabled: doc.enabled !== false, // default true
    sortOrder: typeof doc.sortOrder === 'number' ? doc.sortOrder : 0,
    createdAt: doc.createdAt || undefined,
    updatedAt: doc.updatedAt || undefined,
  };
}

// ---------------------------------------------------------------------------
// Fetch all items from a lookup collection (one-time read)
// ---------------------------------------------------------------------------

export async function fetchLookupItems(
  collectionName: LookupCollectionName
): Promise<LookupItem[]> {
  try {
    const docs = await fetchCollection(
      COLLECTIONS[collectionName],
      orderBy('sortOrder', 'asc')
    );
    if (docs.length > 0) {
      return docs.map(parseLookupItem);
    }
    // Empty → return defaults as LookupItems (first-time use)
    console.log(`[lookupService] "${collectionName}" empty, using defaults`);
    return defaultsAsLookupItems(collectionName);
  } catch (err) {
    console.warn(`[lookupService] Failed to fetch "${collectionName}", using defaults:`, err);
    return defaultsAsLookupItems(collectionName);
  }
}

/** Convert default string arrays to LookupItem shape for local use */
function defaultsAsLookupItems(collectionName: LookupCollectionName): LookupItem[] {
  return LOOKUP_DEFAULTS[collectionName].map((name, index) => ({
    id: `default-${index}`,
    name,
    enabled: true,
    sortOrder: index,
  }));
}

// ---------------------------------------------------------------------------
// Fetch only enabled items as name strings (convenience for dropdowns)
// ---------------------------------------------------------------------------

export async function fetchLookupNames(
  collectionName: LookupCollectionName
): Promise<string[]> {
  const items = await fetchLookupItems(collectionName);
  return items
    .filter((item) => item.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => item.name);
}

// ---------------------------------------------------------------------------
// Real-time subscription — returns LookupItem[]
// ---------------------------------------------------------------------------

export function subscribeToLookupItems(
  collectionName: LookupCollectionName,
  callback: (items: LookupItem[]) => void
): () => void {
  return subscribeToCollection<LookupItem>(
    COLLECTIONS[collectionName],
    (docs) => {
      if (docs.length > 0) {
        const items = docs.map(parseLookupItem).sort((a, b) => a.sortOrder - b.sortOrder);
        callback(items);
      }
      // If empty, don't overwrite — keep existing defaults
    },
    orderBy('sortOrder', 'asc')
  );
}

/** Convenience: subscribe and receive just the enabled name strings */
export function subscribeToLookupNames(
  collectionName: LookupCollectionName,
  callback: (names: string[]) => void
): () => void {
  return subscribeToLookupItems(collectionName, (items) => {
    callback(
      items
        .filter((item) => item.enabled)
        .map((item) => item.name)
    );
  });
}

// ---------------------------------------------------------------------------
// Add a new lookup item
// ---------------------------------------------------------------------------

export async function addLookupItem(
  collectionName: LookupCollectionName,
  name: string,
  currentItems: LookupItem[] = []
): Promise<string> {
  const nextOrder = currentItems.length > 0
    ? Math.max(...currentItems.map((i) => i.sortOrder)) + 1
    : 0;

  const docId = await createDoc(COLLECTIONS[collectionName], {
    name,
    enabled: true,
    sortOrder: nextOrder,
    createdAt: new Date().toISOString(),
  });

  return docId;
}

// ---------------------------------------------------------------------------
// Update a lookup item (rename, reorder, enable/disable)
// ---------------------------------------------------------------------------

export async function updateLookupItem(
  collectionName: LookupCollectionName,
  itemId: string,
  updates: Partial<Pick<LookupItem, 'name' | 'enabled' | 'sortOrder'>>
): Promise<void> {
  await updateDocument(COLLECTIONS[collectionName], itemId, updates);
}

// ---------------------------------------------------------------------------
// Soft-delete (disable) a lookup item
// ---------------------------------------------------------------------------

export async function disableLookupItem(
  collectionName: LookupCollectionName,
  itemId: string
): Promise<void> {
  await updateDocument(COLLECTIONS[collectionName], itemId, { enabled: false });
}

// ---------------------------------------------------------------------------
// Hard-delete a lookup item
// ---------------------------------------------------------------------------

export async function deleteLookupItem(
  collectionName: LookupCollectionName,
  itemId: string
): Promise<void> {
  await deleteDocument(COLLECTIONS[collectionName], itemId);
}

// ---------------------------------------------------------------------------
// Seed a single lookup collection from defaults
// ---------------------------------------------------------------------------

export async function seedLookupCollection(
  collectionName: LookupCollectionName,
  force: boolean = false
): Promise<{ seeded: number; skipped: number; errors: string[] }> {
  const result = { seeded: 0, skipped: 0, errors: [] as string[] };

  // Check if collection already has data
  if (!force) {
    try {
      const existing = await fetchCollection(COLLECTIONS[collectionName]);
      if (existing.length > 0) {
        result.skipped = LOOKUP_DEFAULTS[collectionName].length;
        return result;
      }
    } catch (e) {
      // Collection doesn't exist yet — proceed
    }
  }

  const defaults = LOOKUP_DEFAULTS[collectionName];
  for (let i = 0; i < defaults.length; i++) {
    try {
      await createDoc(COLLECTIONS[collectionName], {
        name: defaults[i],
        enabled: true,
        sortOrder: i,
        createdAt: new Date().toISOString(),
      });
      result.seeded++;
    } catch (err: any) {
      result.errors.push(`${defaults[i]}: ${err.message}`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Seed all 4 lookup collections
// ---------------------------------------------------------------------------

export async function seedAllLookups(force: boolean = false): Promise<
  Record<LookupCollectionName, { seeded: number; skipped: number; errors: string[] }>
> {
  const collections: LookupCollectionName[] = ['productNames', 'categories', 'sizes', 'grades'];
  const results = {} as Record<LookupCollectionName, { seeded: number; skipped: number; errors: string[] }>;

  for (const col of collections) {
    results[col] = await seedLookupCollection(col, force);
  }

  return results;
}