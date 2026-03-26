// ============================================================================
// OSK Granite — Firebase Authentication Service (Live SDK)
// ============================================================================
// Uses Firebase Auth for sign-in / sign-out, then reads the user profile
// document from the `erp_users` Firestore collection (keyed by auth UID).
// ERP has its own user profiles — completely separate from the CRM `users` collection.
// ============================================================================

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type Auth,
} from 'firebase/auth';
import { getFirebaseApp, fetchDoc, COLLECTIONS, type FirebaseUser } from '@/app/services/firebase';
import type { User } from '@/app/types';

// ── Auth singleton ────────────────────────────────────────────────────────────

function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

// ── User profile helpers ──────────────────────────────────────────────────────

/** Map a raw Firestore `erp_users` doc to the app's User type. */
function buildUser(uid: string, doc: Record<string, any>): User {
  return {
    id:             uid,
    email:          doc.email          ?? '',
    name:           doc.name           ?? doc.displayName ?? (doc.email as string | undefined)?.split('@')[0] ?? uid,
    role:           doc.role           ?? 'store-staff',
    branchId:       doc.branchId,
    branchLocation: doc.branchLocation,
    createdAt:      doc.createdAt ? new Date(doc.createdAt) : new Date(),
  };
}

async function fetchUserProfile(uid: string): Promise<User | null> {
  const raw = await fetchDoc<Record<string, any>>(COLLECTIONS.users, uid);
  if (raw) return buildUser(uid, raw);
  return null;
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  user: User | null;
  error?: string;
}

// ── Error messages ────────────────────────────────────────────────────────────

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'No account found with this email or the password is incorrect.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact your administrator.';
    default:
      return 'Authentication failed. Please try again.';
  }
}

// ── Sign in ───────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim().toLowerCase(),
      password,
    );

    const { uid } = credential.user;
    const profile = await fetchUserProfile(uid);

    // If no profile doc exists yet, build a minimal one from Auth data
    const user: User = profile ?? {
      id:        uid,
      email:     credential.user.email ?? email.trim().toLowerCase(),
      name:      credential.user.displayName ?? email.split('@')[0],
      role:      'store-staff',
      createdAt: new Date(),
    };

    return { success: true, user };
  } catch (err: any) {
    return { success: false, user: null, error: getAuthErrorMessage(err?.code ?? '') };
  }
}

// ── Sign out ──────────────────────────────────────────────────────────────────

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim().toLowerCase());
    return { success: true };
  } catch (err: any) {
    return { success: false, error: getAuthErrorMessage(err?.code ?? '') };
  }
}

// ── Auth state subscription ───────────────────────────────────────────────────

export function subscribeToAuthState(
  callback: (user: User | null) => void,
  onLoading?: (loading: boolean) => void,
): () => void {
  onLoading?.(true);

  const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
    if (!firebaseUser) {
      onLoading?.(false);
      callback(null);
      return;
    }

    const profile = await fetchUserProfile(firebaseUser.uid);
    const user: User = profile ?? {
      id:        firebaseUser.uid,
      email:     firebaseUser.email ?? '',
      name:      firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
      role:      'store-staff',
      createdAt: new Date(),
    };

    onLoading?.(false);
    callback(user);
  });

  return unsubscribe;
}

// ── Current user helper ───────────────────────────────────────────────────────

export function getCurrentFirebaseUser(): FirebaseUser | null {
  const u = getFirebaseAuth().currentUser;
  if (!u) return null;
  return { uid: u.uid, email: u.email, displayName: u.displayName };
}


