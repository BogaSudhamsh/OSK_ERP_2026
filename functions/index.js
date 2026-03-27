// ============================================================================
// OSK Granite ERP — Cloud Functions
// ============================================================================
// Runs on Firebase's server — has full Admin SDK access to manage Auth users.
// ============================================================================

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

// ── Reset any user's password (super-admin only) ──────────────────────────────
// Called from the frontend via httpsCallable("resetUserPassword")

exports.resetUserPassword = onCall(async (request) => {
  // 1. Must be authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const callerUid = request.auth.uid;
  const { targetEmail, newPassword } = request.data;

  // 2. Validate input
  if (!targetEmail || typeof targetEmail !== "string") {
    throw new HttpsError("invalid-argument", "User email is required.");
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    throw new HttpsError(
      "invalid-argument",
      "New password must be at least 6 characters."
    );
  }

  // 3. Verify caller is super-admin (check erp_users doc)
  const db = getFirestore();
  const callerDoc = await db.collection("erp_users").doc(callerUid).get();

  if (!callerDoc.exists || callerDoc.data().role !== "super-admin") {
    throw new HttpsError(
      "permission-denied",
      "Only super-admin can reset user passwords."
    );
  }

  // 4. Find the target user by email
  const auth = getAuth();
  let targetUser;
  try {
    targetUser = await auth.getUserByEmail(targetEmail.trim().toLowerCase());
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      throw new HttpsError(
        "not-found",
        `No account found for ${targetEmail}.`
      );
    }
    throw new HttpsError("internal", "Failed to look up user.");
  }

  // 5. Update their password
  try {
    await auth.updateUser(targetUser.uid, { password: newPassword });
  } catch (err) {
    throw new HttpsError("internal", "Failed to update password.");
  }

  return { success: true, message: `Password reset for ${targetEmail}` };
});
