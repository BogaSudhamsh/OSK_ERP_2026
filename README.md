
# OSK Granite ERP 2026

Frontend ERP application for OSK Granite built with Vite, React, and TypeScript.

## Requirements

- Node.js 20+
- npm 10+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and set the values you want to use.

3. Start the development server:

```bash
npm run dev
```

## Available Scripts

- `npm run dev` starts the Vite development server
- `npm run build` builds the production bundle
- `npm run typecheck` runs the TypeScript checker

## Backend Status

- Firebase integration is active for Auth, Firestore, and callable Functions.
- `src/app/services/firebase.ts` wraps the live Firebase SDK used by the app services.
- Cloud Functions are defined under `functions/index.js`.

## Firebase Environment

- Configure Firebase values in `.env` using `.env.example` as reference.
- Required variables are `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID`.
- `VITE_FIREBASE_MEASUREMENT_ID` is optional and only needed when analytics is enabled.

## Firebase Setup Checklist

Before going live, verify each item end-to-end in the Firebase Console and the running app:

### 1. Authentication
- [ ] Firebase Auth is enabled (Email/Password provider).
- [ ] At least one `erp_users` document exists with the logged-in user's UID as the document ID.
- [ ] `erp_users` doc has `email`, `name`, `role`, and (for branch roles) `branchId` + `branchLocation` fields.
- [ ] Logging in with a valid account redirects to the correct portal (ERP / Inventory / Store).
- [ ] Logging in with an unknown account shows a clear error (no profile).
- [ ] Changing password from the header works and prompts re-auth.

### 2. Firestore Collections
- [ ] `erp_branches` has one doc per branch (`aziz-nagar`, `sangareddy`, `vikarabad`).
- [ ] `products` collection is readable after login.
- [ ] `dealers` collection is readable after login.
- [ ] `customers`, `orders`, `bills`, `stockMovements`, `dayBookEntries`, `branchTransfers`, `branchStock` are empty but exist (or seed test data).
- [ ] `productNames`, `categories`, `sizes`, `grades` lookup collections are seeded (use `seedAllLookups()` from `lookupService.ts` once if empty).

### 3. Firestore Rules
- [ ] An unauthenticated request to any ERP collection is rejected.
- [ ] A `branch-admin` user cannot read another branch's orders.
- [ ] A `super-admin` can read/write all collections.
- [ ] Deploy rules: `firebase deploy --only firestore:rules`.

### 4. Cloud Functions
- [ ] `functions/` dependencies are installed: `cd functions && npm install`.
- [ ] `resetUserPassword` callable function is deployed: `firebase deploy --only functions`.
- [ ] Super-admin can reset a user password from the admin panel without errors.

### 5. End-to-End Flows
- [ ] Inventory: Add product → Bill created → visible in Dealer Bills.
- [ ] Store: Create customer → Place order → Ledger entry auto-created.
- [ ] Branch: Stock inward → Branch stock quantity updated.
- [ ] Transfer: Request stock transfer → Receive → Source qty decremented, destination incremented.
- [ ] Notifications appear for the correct branch scope.
  