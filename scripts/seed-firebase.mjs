// ============================================================================
// OSK Granite ERP — Firebase Seed Script
// ============================================================================
// Creates all ERP collections with initial data in your live Firebase.
// Fully respects Firestore security rules — signs in as a real super-admin.
//
// Usage:
//   node scripts/seed-firebase.mjs
//
// You will be prompted for a super-admin email + password.
// If the account does not exist yet it will be created automatically.
// Safe to re-run — skips collections that already have data.
// ============================================================================

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

function loadEnv(path) {
  try {
    const lines = readFileSync(path, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
  } catch {
    console.error('❌  Could not read .env file. Create it from .env.example first.');
    process.exit(1);
  }
}

loadEnv(envPath);

// ── Firebase init ─────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId || firebaseConfig.projectId.includes('your_project')) {
  console.error('❌  Firebase config not set. Fill in your real values in .env first.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);

console.log(`\n🔥  Connected to Firebase project: ${firebaseConfig.projectId}\n`);

// ── Helpers ───────────────────────────────────────────────────────────────────

const now = new Date().toISOString();

/** Prompt for input in terminal */
function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

/** Sign in or create the super-admin Firebase Auth account */
async function signInSuperAdmin() {
  console.log('👤  Super-Admin Login');
  console.log('   This account will be created in Firebase Auth and used to seed the database.\n');

  const email    = await prompt('   Enter super-admin email:    ');
  const password = await prompt('   Enter super-admin password: ');

  let uid;

  // Try sign in first
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
    console.log(`\n✅  Signed in as ${email} (uid: ${uid})\n`);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      // Account doesn't exist — create it
      console.log('\n   Account not found — creating it now...');
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      console.log(`✅  Created Firebase Auth account (uid: ${uid})\n`);
    } else {
      throw err;
    }
  }

  // Write erp_users/{uid} FIRST — allowed by self-create rule (isSignedIn && uid == userId)
  // This is what makes isSuperAdmin() return true for all subsequent writes.
  await setDoc(doc(db, 'erp_users', uid), {
    id:             uid,
    email:          email,
    name:           'Super Admin',
    role:           'super-admin',
    branchId:       'aziz-nagar',
    branchLocation: 'aziz-nagar',
    createdAt:      now,
  }, { merge: true });

  console.log(`  ✅  erp_users  →  super-admin profile created (${email})`);
  console.log('      Rules now recognise this account as super-admin.\n');

  return uid;
}

/** Write many docs in batches of 500 (Firestore limit). */
async function batchWrite(collectionName, docs) {
  let batch  = writeBatch(db);
  let count  = 0;
  let total  = 0;

  for (const docData of docs) {
    const ref = doc(collection(db, collectionName), docData.id);
    batch.set(ref, docData, { merge: true });
    count++;
    total++;
    if (count === 499) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
  console.log(`  ✅  ${collectionName}  →  ${total} docs written`);
}

/** Skip seeding if collection already has data. */
async function seedIfEmpty(collectionName, docs, force = false) {
  if (!force) {
    const snap = await getDocs(collection(db, collectionName));
    if (!snap.empty) {
      console.log(`  ⏭   ${collectionName}  →  already has data, skipped`);
      return;
    }
  }
  await batchWrite(collectionName, docs);
}

// ── Seed data ─────────────────────────────────────────────────────────────────

// 1. erp_branches ─────────────────────────────────────────────────────────────
const ERP_BRANCHES = [
  {
    id:       'aziz-nagar',
    name:     'Aziz Nagar',
    location: 'aziz-nagar',
    address:  'Aziz Nagar, Hyderabad, Telangana',
    phone:    '',
    email:    '',
    manager:  '',
    gstNumber:'',
    createdAt: now,
  },
  {
    id:       'sangareddy',
    name:     'Sangareddy',
    location: 'sangareddy',
    address:  'Sangareddy, Telangana',
    phone:    '',
    email:    '',
    manager:  '',
    gstNumber:'',
    createdAt: now,
  },
  {
    id:       'vikarabad',
    name:     'Vikarabad',
    location: 'vikarabad',
    address:  'Vikarabad, Telangana',
    phone:    '',
    email:    '',
    manager:  '',
    gstNumber:'',
    createdAt: now,
  },
  {
    id:       'central',
    name:     'Central Warehouse',
    location: 'central',
    address:  'Central, Hyderabad, Telangana',
    phone:    '',
    email:    '',
    manager:  '',
    gstNumber:'',
    createdAt: now,
  },
];

// 2. productNames ─────────────────────────────────────────────────────────────
const PRODUCT_NAMES = [
  'CHEMICAL',
  'GRANITE STONE',
  'GVT-PGVT',
  'MARBLE',
  'PORCELAIN',
  'SAND STONE',
  'SGDY GRANITE STONE',
].map((name, i) => ({ id: `pname-${i + 1}`, name, enabled: true, sortOrder: i, createdAt: now }));

// 3. categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Matt',
  'Glossy',
  'DC',
  'MATT (FB)',
  'Glossy (FB)',
  'ELEVATION STRIP',
  'Full Body Glossy',
  'Full Body Matt',
  'POLISH',
].map((name, i) => ({ id: `cat-${i + 1}`, name, enabled: true, sortOrder: i, createdAt: now }));

// 4. sizes ────────────────────────────────────────────────────────────────────
const SIZES = [
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
].map((name, i) => ({ id: `size-${i + 1}`, name, enabled: true, sortOrder: i, createdAt: now }));

// 5. grades ───────────────────────────────────────────────────────────────────
const GRADES = [
  'Alpha',
  'Diamond',
  'Premium',
].map((name, i) => ({ id: `grade-${i + 1}`, name, enabled: true, sortOrder: i, createdAt: now }));

// 6. itemNames — starts empty, filled by inventory manager
const ITEM_NAMES = [];

// ── Run all seeds ─────────────────────────────────────────────────────────────

async function main() {
  // Step 1 — Sign in as super-admin (creates account + erp_users doc if needed)
  await signInSuperAdmin();

  console.log('📦  Seeding ERP collections...\n');

  // erp_branches — always seed (4 fixed branches)
  await seedIfEmpty('erp_branches',      ERP_BRANCHES);

  // Lookup collections — skip if already populated
  await seedIfEmpty('productNames',      PRODUCT_NAMES);
  await seedIfEmpty('categories',        CATEGORIES);
  await seedIfEmpty('sizes',             SIZES);
  await seedIfEmpty('grades',            GRADES);
  await seedIfEmpty('itemNames',         ITEM_NAMES);

  // These collections are empty on purpose — data is created by users:
  //   erp_users, products, dealers, customers, orders, bills,
  //   stockMovements, dayBookEntries, branchTransfers,
  //   branchStock, erp_notifications
  console.log('\n📋  The following collections start empty (created when users add data):');
  console.log('   products | dealers | customers | orders | bills');
  console.log('   stockMovements | dayBookEntries | branchTransfers | branchStock | erp_notifications\n');

  console.log('✅  Seeding complete!\n');
  console.log('👉  Next steps:');
  console.log('   1. Go to Firebase Console → Authentication → Users');
  console.log('   2. Create user accounts for your ERP staff (email + password)');
  console.log('   3. For each user, create a Firestore doc at  erp_users/{uid}  with:');
  console.log('      { email, name, role, branchId, branchLocation }\n');
  console.log('   Roles: super-admin | inventory-manager | branch-admin | stock-manager | sales-manager | store\n');
  console.log('   ⚠️   Do NOT add ERP staff to the CRM users collection — use erp_users only\n');

  // Self-delete after successful seed
  import('fs').then(({ unlinkSync }) => {
    try {
      unlinkSync(resolve(__dirname, 'seed-firebase.mjs'));
      console.log('🗑️   Seed script deleted (no longer needed)\n');
    } catch {
      console.log('ℹ️   Could not auto-delete seed script — you can delete scripts/seed-firebase.mjs manually\n');
    }
  });

  process.exit(0);
}

main().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
