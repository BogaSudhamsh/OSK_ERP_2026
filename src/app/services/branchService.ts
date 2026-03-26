/**
 * Branch Service
 * 
 * Handles branch data operations with Firestore
 * Collection: branches
 */

import {
  COLLECTIONS,
  fetchCollection,
  fetchDoc,
  createDoc,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  where,
  orderBy,
  Timestamp,
} from './firebase';
import type { Branch } from '@/app/types';

const COLLECTION_NAME = COLLECTIONS.branches;

function parseBranch(raw: Record<string, any>): Branch {
  return {
    ...raw,
    createdAt: raw.createdAt?.toDate?.() || new Date(raw.createdAt || Date.now()),
  } as Branch;
}

/**
 * Fetches all branches from Firestore
 */
export async function fetchBranches(): Promise<Branch[]> {
  try {
    const docs = await fetchCollection<Branch>(COLLECTION_NAME, orderBy('createdAt', 'asc'));
    return docs.map(parseBranch);
  } catch (error) {
    console.error('[BranchService] Error fetching branches:', error);
    throw error;
  }
}

/**
 * Fetches a single branch by ID
 */
export async function fetchBranchById(branchId: string): Promise<Branch | null> {
  try {
    const branch = await fetchDoc<Branch>(COLLECTION_NAME, branchId);
    return branch ? parseBranch(branch as Record<string, any>) : null;
  } catch (error) {
    console.error('[BranchService] Error fetching branch:', error);
    throw error;
  }
}

/**
 * Subscribes to real-time branch updates
 */
export function subscribeToBranches(
  callback: (branches: Branch[]) => void
): () => void {
  const unsubscribe = subscribeToCollection<Branch>(
    COLLECTION_NAME,
    (branches) => {
      callback(branches.map((branch) => parseBranch(branch as Record<string, any>)));
    },
    orderBy('createdAt', 'asc'),
  );

  return unsubscribe;
}

/**
 * Creates a new branch
 */
export async function createBranch(
  branchData: Omit<Branch, 'id' | 'createdAt'>
): Promise<string> {
  try {
    return await createDoc(COLLECTION_NAME, {
      ...branchData,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('[BranchService] Error creating branch:', error);
    throw error;
  }
}

/**
 * Updates an existing branch
 */
export async function updateBranch(
  branchId: string,
  updates: Partial<Omit<Branch, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    await updateDocument(COLLECTION_NAME, branchId, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('[BranchService] Error updating branch:', error);
    throw error;
  }
}

/**
 * Deletes a branch
 */
export async function deleteBranch(branchId: string): Promise<void> {
  try {
    await deleteDocument(COLLECTION_NAME, branchId);
  } catch (error) {
    console.error('[BranchService] Error deleting branch:', error);
    throw error;
  }
}

/**
 * Fetches branch by location
 */
export async function fetchBranchByLocation(location: string): Promise<Branch | null> {
  try {
    const branches = await fetchCollection<Branch>(COLLECTION_NAME, where('location', '==', location));
    return branches[0] ? parseBranch(branches[0] as Record<string, any>) : null;
  } catch (error) {
    console.error('[BranchService] Error fetching branch by location:', error);
    throw error;
  }
}
