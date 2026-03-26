// ============================================================================
// OSK Granite — Mock Authentication Service
// ============================================================================

import { type FirebaseUser } from '@/app/services/firebase';
import type { User } from '@/app/types';

const SESSION_STORAGE_KEY = 'osk-mock-auth-user';
const MOCK_PASSWORDS = new Set(['password', 'admin123', '123456']);
let currentMockUser: User | null = null;
const authListeners = new Set<(user: User | null) => void>();

function cloneUser(user: User): User {
  return {
    ...user,
    createdAt: new Date(user.createdAt),
  };
}

function createMockUser(
  id: string,
  email: string,
  name: string,
  role: User['role'],
  branchId?: string,
  branchLocation?: User['branchLocation'],
): User {
  return {
    id,
    email,
    name,
    role,
    branchId,
    branchLocation,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

const MOCK_USERS: Record<string, User> = {
  'admin@oskgranite.com': createMockUser('mock-super-admin', 'admin@oskgranite.com', 'Super Admin', 'super-admin', 'aziz-nagar', 'aziz-nagar'),
  'inventory@oskgranite.com': createMockUser('mock-inventory', 'inventory@oskgranite.com', 'Inventory Manager', 'inventory-manager'),
  'sales@oskgranite.com': createMockUser('mock-sales', 'sales@oskgranite.com', 'Sales Manager', 'sales-manager', 'aziz-nagar', 'aziz-nagar'),
  'aziz@oskgranite.com': createMockUser('mock-aziz-admin', 'aziz@oskgranite.com', 'Aziz Nagar Branch Admin', 'branch-admin', 'aziz-nagar', 'aziz-nagar'),
  'aziz-stock@oskgranite.com': createMockUser('mock-aziz-stock', 'aziz-stock@oskgranite.com', 'Aziz Nagar Stock Manager', 'stock-manager', 'aziz-nagar', 'aziz-nagar'),
  'aziz-store@oskgranite.com': createMockUser('mock-aziz-store', 'aziz-store@oskgranite.com', 'Aziz Nagar Store', 'store', 'aziz-nagar', 'aziz-nagar'),
  'store@oskgranite.com': createMockUser('mock-store', 'store@oskgranite.com', 'Main Store', 'store', 'aziz-nagar', 'aziz-nagar'),
  'sangareddy@oskgranite.com': createMockUser('mock-sang-admin', 'sangareddy@oskgranite.com', 'Sangareddy Branch Admin', 'branch-admin', 'sangareddy', 'sangareddy'),
  'sangareddy-stock@oskgranite.com': createMockUser('mock-sang-stock', 'sangareddy-stock@oskgranite.com', 'Sangareddy Stock Manager', 'stock-manager', 'sangareddy', 'sangareddy'),
  'sangareddy-store@oskgranite.com': createMockUser('mock-sang-store', 'sangareddy-store@oskgranite.com', 'Sangareddy Store', 'store', 'sangareddy', 'sangareddy'),
  'vikarabad@oskgranite.com': createMockUser('mock-vika-admin', 'vikarabad@oskgranite.com', 'Vikarabad Branch Admin', 'branch-admin', 'vikarabad', 'vikarabad'),
  'vikarabad-stock@oskgranite.com': createMockUser('mock-vika-stock', 'vikarabad-stock@oskgranite.com', 'Vikarabad Stock Manager', 'stock-manager', 'vikarabad', 'vikarabad'),
  'vikarabad-store@oskgranite.com': createMockUser('mock-vika-store', 'vikarabad-store@oskgranite.com', 'Vikarabad Store', 'store', 'vikarabad', 'vikarabad'),
};

export interface AuthResult {
  success: boolean;
  user: User | null;
  error?: string;
}

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/mock-password-required':
      return 'Use one of the demo passwords: password, admin123, or 123456.';
    default:
      return 'Authentication failed. Please try again.';
  }
}

function persistSession(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      ...user,
      createdAt: user.createdAt.toISOString(),
    }),
  );
}

function restoreSession(): User | null {
  if (typeof window === 'undefined') return null;

  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Omit<User, 'createdAt'> & { createdAt: string };
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
    };
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function setCurrentMockUser(user: User | null): void {
  currentMockUser = user ? cloneUser(user) : null;
  persistSession(currentMockUser);
  authListeners.forEach((listener) => listener(currentMockUser ? cloneUser(currentMockUser) : null));
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail.includes('@')) {
    return {
      success: false,
      user: null,
      error: getAuthErrorMessage('auth/invalid-email'),
    };
  }

  if (!MOCK_PASSWORDS.has(password.trim())) {
    return {
      success: false,
      user: null,
      error: getAuthErrorMessage('auth/mock-password-required'),
    };
  }

  const user = MOCK_USERS[normalizedEmail];
  if (!user) {
    return {
      success: false,
      user: null,
      error: getAuthErrorMessage('auth/user-not-found'),
    };
  }

  setCurrentMockUser(user);
  return { success: true, user: cloneUser(user) };
}

export async function signOutUser(): Promise<void> {
  setCurrentMockUser(null);
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!MOCK_USERS[normalizedEmail]) {
    return { success: false, error: getAuthErrorMessage('auth/user-not-found') };
  }
  return { success: true };
}

export function subscribeToAuthState(
  callback: (user: User | null) => void,
  onLoading?: (loading: boolean) => void,
): () => void {
  const restored = restoreSession();
  if (restored) {
    currentMockUser = restored;
  }

  authListeners.add(callback);
  onLoading?.(true);
  queueMicrotask(() => {
    callback(currentMockUser ? cloneUser(currentMockUser) : null);
    onLoading?.(false);
  });

  return () => {
    authListeners.delete(callback);
  };
}

export function getCurrentFirebaseUser(): FirebaseUser | null {
  if (!currentMockUser) return null;
  return {
    uid: currentMockUser.id,
    email: currentMockUser.email,
  };
}
