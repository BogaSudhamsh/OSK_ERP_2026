// ============================================================================
// OSK Granite ERP — Cloud Functions
// ============================================================================
// Runs on Firebase's server — has full Admin SDK access to manage Auth users.
// ============================================================================

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const PDFDocument = require("pdfkit");

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

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDisplayDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString("en-IN");
  return date.toLocaleString("en-IN");
}

function toCurrency(value) {
  return `Rs. ${toSafeNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function dataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!match || !match[2]) return null;
  try {
    return Buffer.from(match[2], "base64");
  } catch {
    return null;
  }
}

// ── Generate Purchase Order PDF (authenticated ERP users) ───────────────────
// Called from frontend via httpsCallable("generatePurchaseOrderPdf")
exports.generatePurchaseOrderPdf = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const order = request.data?.order;
  if (!order || typeof order !== "object") {
    throw new HttpsError("invalid-argument", "Order payload is required.");
  }
  if (!order.id || !order.customer || !Array.isArray(order.items)) {
    throw new HttpsError("invalid-argument", "Invalid order data.");
  }
  // Guard: cap items to prevent abuse / memory exhaustion
  if (order.items.length > 500) {
    throw new HttpsError("invalid-argument", "Too many items (max 500).");
  }
  // Guard: cap logoDataUrl to ~2 MB (base64) to prevent memory issues
  if (
    order.logoDataUrl &&
    typeof order.logoDataUrl === "string" &&
    order.logoDataUrl.length > 2_097_152
  ) {
    console.warn("[generatePurchaseOrderPdf] Logo too large, skipping.");
    order.logoDataUrl = null;
  }

  const doc = new PDFDocument({ size: "A4", margin: 42 });

  const chunks = [];
  const pdfComplete = new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));
  });

  const poNumber     = String(order.id || "PO-UNKNOWN");
  const orderDate    = toDisplayDate(order.createdAt);
  const logoBuffer   = dataUrlToBuffer(order.logoDataUrl);
  const signatureName = String(order.signatureName || "Authorized Signatory").slice(0, 120);

  const margin      = 42;
  const pageWidth   = doc.page.width;          // 595.28 pt for A4
  const usableRight = pageWidth - margin;

  // ── HEADER — two-column layout ─────────────────────────────────────────────
  const headerY     = 36;
  const rightColW   = 210;
  const rightColX   = usableRight - rightColW; // ~343

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, margin, headerY, { fit: [68, 68] });
    } catch (err) {
      console.warn("[generatePurchaseOrderPdf] Logo render failed:", err);
    }
  }

  // Left: company name
  const leftTextX = logoBuffer ? margin + 78 : margin;
  doc.font("Helvetica-Bold").fontSize(20).fillColor("#1A1A1A");
  doc.text("OSK GRANITE", leftTextX, headerY + 8, { lineBreak: false });
  doc.font("Helvetica").fontSize(10).fillColor("#666666");
  doc.text("Premium Granite & Marble", leftTextX, headerY + 36, { lineBreak: false });
  doc.fillColor("#000000");

  // Right: PO details
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#7C1D1D");
  doc.text("PURCHASE ORDER", rightColX, headerY + 8, { width: rightColW, align: "right", lineBreak: false });
  doc.font("Helvetica").fontSize(9).fillColor("#444444");
  doc.text(`PO Number: ${poNumber}`, rightColX, headerY + 36, { width: rightColW, align: "right", lineBreak: false });
  doc.text(`Date: ${orderDate}`,     rightColX, headerY + 50, { width: rightColW, align: "right", lineBreak: false });
  doc.fillColor("#000000");

  // Advance cursor past the header block (logo = 68 px tall from headerY)
  doc.y = headerY + 80;

  // Gold separator line under header
  doc.strokeColor("#C9A961").lineWidth(1.5)
    .moveTo(margin, doc.y)
    .lineTo(usableRight, doc.y)
    .stroke();
  doc.y += 14;

  // ── CUSTOMER DETAILS ────────────────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#7C1D1D");
  doc.text("Customer Details", margin, doc.y, { lineBreak: false });
  doc.y += 18;

  const custFields = [
    ["Customer Name", order.customer.name],
    ["Customer ID",   order.customer.id],
    ["Phone",         order.customer.phone],
    ["Location",      order.customer.location],
  ];
  custFields.forEach(([label, value]) => {
    doc.font("Helvetica").fontSize(10).fillColor("#888888");
    doc.text(`${label}:`, margin, doc.y, { width: 105, lineBreak: false });
    doc.font("Helvetica-Bold").fillColor("#1A1A1A");
    doc.text(String(value || "-"), margin + 110, doc.y, { lineBreak: false });
    doc.y += 16;
  });

  doc.y += 6;
  doc.strokeColor("#EEEEEE").lineWidth(0.5)
    .moveTo(margin, doc.y).lineTo(usableRight, doc.y).stroke();
  doc.y += 12;

  // ── ORDER ITEMS TABLE ───────────────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#7C1D1D");
  doc.text("Order Items", margin, doc.y, { lineBreak: false });
  doc.y += 14;

  const cols = { sno: 38, product: 222, qty: 52, rate: 96, amount: 97 };
  const tableLeft   = margin;
  const tableWidth  = cols.sno + cols.product + cols.qty + cols.rate + cols.amount; // 505
  let y = doc.y;
  const pageBottom  = doc.page.height - doc.page.margins.bottom;
  const rowH        = 17;

  // Table header row
  doc.rect(tableLeft, y, tableWidth, 18).fill("#B8860B");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#FFFFFF");
  doc.text("S.No",    tableLeft + 4,                                                       y + 4, { width: cols.sno - 4,     lineBreak: false });
  doc.text("Product", tableLeft + cols.sno,                                                y + 4, { width: cols.product - 4,  lineBreak: false });
  doc.text("Qty",     tableLeft + cols.sno + cols.product,                                 y + 4, { width: cols.qty,     align: "right", lineBreak: false });
  doc.text("Rate",    tableLeft + cols.sno + cols.product + cols.qty,                      y + 4, { width: cols.rate,    align: "right", lineBreak: false });
  doc.text("Amount",  tableLeft + cols.sno + cols.product + cols.qty + cols.rate,          y + 4, { width: cols.amount,  align: "right", lineBreak: false });
  y += 18;

  // Table rows
  order.items.forEach((item, idx) => {
    if (!item) return;                        // null/undefined guard
    if (y + rowH > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    const qty    = toSafeNumber(item.quantity);
    const rate   = toSafeNumber(item.price || item.rate);
    const amount = toSafeNumber(item.total || item.amount || qty * rate);

    doc.rect(tableLeft, y, tableWidth, rowH).fill(idx % 2 === 0 ? "#FFFFFF" : "#FFF8F0");
    doc.font("Helvetica").fontSize(9).fillColor("#333333");
    doc.text(String(idx + 1), tableLeft + 4,                                                     y + 3, { width: cols.sno - 4,     lineBreak: false });
    doc.text(String(item.productName || "-"), tableLeft + cols.sno,                              y + 3, { width: cols.product - 6,  lineBreak: false });
    doc.text(String(qty), tableLeft + cols.sno + cols.product,                                   y + 3, { width: cols.qty,     align: "right", lineBreak: false });
    doc.text(toCurrency(rate), tableLeft + cols.sno + cols.product + cols.qty,                   y + 3, { width: cols.rate,    align: "right", lineBreak: false });
    doc.font("Helvetica-Bold").fillColor("#B8860B");
    doc.text(toCurrency(amount), tableLeft + cols.sno + cols.product + cols.qty + cols.rate,     y + 3, { width: cols.amount,  align: "right", lineBreak: false });
    y += rowH;
  });

  // Bottom border of table
  doc.strokeColor("#B8860B").lineWidth(0.8)
    .moveTo(tableLeft, y).lineTo(tableLeft + tableWidth, y).stroke();
  y += 14;

  // ── TOTALS ──────────────────────────────────────────────────────────────────
  const summaryX = tableLeft + 295;
  const labelW   = 110;
  const valueW   = 100;

  doc.font("Helvetica").fontSize(10).fillColor("#333333");
  doc.text("Subtotal", summaryX, y, { width: labelW, lineBreak: false });
  doc.text(toCurrency(order.subtotal), summaryX + labelW, y, { width: valueW, align: "right", lineBreak: false });
  y += 16;

  doc.rect(summaryX - 4, y - 2, labelW + valueW + 8, 22).fill("#FFF3E0");
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#B8860B");
  doc.text("Grand Total", summaryX, y + 3, { width: labelW, lineBreak: false });
  doc.text(toCurrency(order.total), summaryX + labelW, y + 3, { width: valueW, align: "right", lineBreak: false });
  y += 26;

  // ── SIGNATURE ───────────────────────────────────────────────────────────────
  let signatureY = y + 48;
  // If signature would overflow the current page, start a new page
  if (signatureY + 35 > pageBottom) {
    doc.addPage();
    signatureY = doc.page.margins.top + 40;
  }

  const sigLineX1 = usableRight - 190;
  const sigLineX2 = usableRight;
  doc.strokeColor("#666666").lineWidth(1)
    .moveTo(sigLineX1, signatureY)
    .lineTo(sigLineX2, signatureY)
    .stroke();
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333");
  doc.text(signatureName, sigLineX1, signatureY + 6, { width: 190, align: "center", lineBreak: false });
  doc.font("Helvetica").fontSize(9).fillColor("#888888");
  doc.text("Authorized Signature", sigLineX1, signatureY + 21, { width: 190, align: "center", lineBreak: false });

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  doc.font("Helvetica").fontSize(8).fillColor("#BBBBBB");
  doc.text(
    "Generated by OSK Granite ERP",
    margin,
    doc.page.height - 28,
    { width: pageWidth - margin * 2, align: "center", lineBreak: false },
  );

  doc.end();

  let pdfBuffer;
  try {
    pdfBuffer = await pdfComplete;
  } catch (error) {
    console.error("[generatePurchaseOrderPdf] Failed to render PDF:", error);
    throw new HttpsError("internal", "Failed to generate purchase order PDF.");
  }

  const safeFileName = poNumber.replace(/[^A-Za-z0-9_-]/g, "_");
  return {
    fileName: `${safeFileName}.pdf`,
    mimeType: "application/pdf",
    base64: pdfBuffer.toString("base64"),
  };
});
