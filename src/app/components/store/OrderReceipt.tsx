import React, { useRef, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Printer,
  Download,
  X,
  Phone,
  MapPin,
  Mail,
  FileText,
} from 'lucide-react';
import type { Order } from '@/app/types';
import { useApp } from '@/app/context/AppContext';

interface OrderReceiptProps {
  order: Order;
  open: boolean;
  onClose: () => void;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order, open, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { branches } = useApp();

  const branch = branches.find(b => b.id === order.branchId || b.location === order.branchLocation);

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatDateTime = (date: Date) =>
    new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getPaymentLabel = (mode?: string) => {
    switch (mode) {
      case 'cash': return 'Cash';
      case 'upi': return 'UPI';
      case 'bank': return 'Bank Transfer';
      case 'cheque': return 'Cheque';
      case 'credit': return 'Credit';
      default: return 'N/A';
    }
  };

  const getPaymentStatusLabel = (status?: string) => {
    switch (status) {
      case 'paid': return 'PAID';
      case 'partial': return 'PARTIAL';
      default: return 'UNPAID';
    }
  };

  const amountPaid = order.amountPaid ?? 0;
  const amountDue = order.amountDue ?? (order.totalAmount - amountPaid);

  const handlePrint = useCallback(() => {
    if (!receiptRef.current) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Please allow pop-ups to print the receipt.');
      return;
    }

    const content = receiptRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${order.poNumber || order.id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1A1A1A; padding: 20px; background: white; }
          .receipt-container { max-width: 700px; margin: 0 auto; }
          .company-header { text-align: center; padding-bottom: 16px; border-bottom: 3px solid #B8860B; margin-bottom: 16px; }
          .company-name { font-size: 28px; font-weight: 800; color: #B8860B; letter-spacing: 1px; }
          .company-subtitle { font-size: 11px; color: #6B6B6B; margin-top: 2px; letter-spacing: 2px; text-transform: uppercase; }
          .branch-info { font-size: 12px; color: #444; margin-top: 8px; line-height: 1.6; }
          .branch-info span { display: inline-flex; align-items: center; margin-right: 12px; }
          .receipt-title { text-align: center; margin: 16px 0; }
          .receipt-title h2 { font-size: 18px; text-transform: uppercase; letter-spacing: 3px; color: #B8860B; font-weight: 700; }
          .receipt-title .receipt-number { font-size: 13px; color: #6B6B6B; margin-top: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; padding: 14px; background: #FEFCF8; border: 1px solid #E8D5A8; border-radius: 8px; }
          .info-group label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6B6B6B; font-weight: 600; display: block; margin-bottom: 3px; }
          .info-group p { font-size: 13px; font-weight: 600; color: #1A1A1A; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          thead th { background: #B8860B; color: white; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
          thead th:first-child { border-radius: 6px 0 0 0; }
          thead th:last-child { border-radius: 0 6px 0 0; }
          tbody td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #f0e6d0; }
          tbody tr:last-child td { border-bottom: none; }
          tbody tr:nth-child(even) { background: #FEFCF8; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals-section { display: flex; justify-content: flex-end; margin-bottom: 16px; }
          .totals-box { width: 280px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #444; }
          .total-row.highlight { border-top: 2px solid #B8860B; padding-top: 10px; margin-top: 6px; font-size: 16px; font-weight: 800; color: #B8860B; }
          .total-row.discount { color: #059669; }
          .total-row.paid { color: #059669; font-weight: 600; }
          .total-row.due { color: #D97706; font-weight: 700; background: #FFFBEB; margin: 4px -8px; padding: 8px; border-radius: 6px; }
          .payment-info { padding: 14px; background: #FEFCF8; border: 1px solid #E8D5A8; border-radius: 8px; margin-bottom: 16px; }
          .payment-info h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #B8860B; font-weight: 700; margin-bottom: 8px; }
          .payment-info .detail { font-size: 12px; color: #444; margin-bottom: 4px; }
          .payment-info .detail strong { color: #1A1A1A; }
          .payment-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
          .badge-paid { background: #D1FAE5; color: #065F46; }
          .badge-partial { background: #FEF3C7; color: #92400E; }
          .badge-unpaid { background: #FFF7ED; color: #9A3412; }
          .notes-section { padding: 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 16px; }
          .notes-section h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6B6B6B; font-weight: 600; margin-bottom: 6px; }
          .notes-section p { font-size: 12px; color: #444; white-space: pre-line; }
          .footer { text-align: center; padding-top: 16px; border-top: 2px solid #E8D5A8; }
          .footer p { font-size: 11px; color: #6B6B6B; margin-bottom: 3px; }
          .footer .thank-you { font-size: 14px; font-weight: 700; color: #B8860B; margin-bottom: 6px; }
          .stamp-area { display: flex; justify-content: space-between; margin: 24px 0 16px; padding-top: 16px; }
          .stamp-box { text-align: center; width: 180px; }
          .stamp-box .line { border-top: 1px solid #999; margin-bottom: 6px; }
          .stamp-box p { font-size: 11px; color: #6B6B6B; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">${content}</div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  }, [order]);

  const handleDownloadPDF = useCallback(() => {
    // Same as print but user can choose "Save as PDF" in print dialog
    handlePrint();
  }, [handlePrint]);

  const paymentStatusBadgeClass = order.paymentStatus === 'paid' ? 'badge-paid'
    : order.paymentStatus === 'partial' ? 'badge-partial' : 'badge-unpaid';

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-white">
        {/* Action Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#B8860B]/20 px-6 py-4 flex items-center justify-between">
          <DialogHeader className="p-0">
            <DialogTitle className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#B8860B]" />
              Order Receipt
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white border-0 h-9 px-4 text-sm"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="border-[#B8860B]/30 text-[#B8860B] hover:bg-[#B8860B]/10 h-9 px-4 text-sm"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download PDF
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-[#6B6B6B] hover:text-[#1A1A1A] h-9 w-9 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Receipt Content (used for print) */}
        <div className="px-6 py-6" ref={receiptRef}>
          {/* Company Header */}
          <div className="company-header" style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '3px solid #B8860B', marginBottom: 16 }}>
            <div className="company-name" style={{ fontSize: 28, fontWeight: 800, color: '#B8860B', letterSpacing: 1 }}>
              OSK GRANITE
            </div>
            <div className="company-subtitle" style={{ fontSize: 11, color: '#6B6B6B', marginTop: 2, letterSpacing: 2, textTransform: 'uppercase' as const }}>
              Premium Granite, Marble & Tiles
            </div>
            {branch && (
              <div className="branch-info" style={{ fontSize: 12, color: '#444', marginTop: 8, lineHeight: 1.6 }}>
                <div>{branch.name}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' as const, marginTop: 4 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {branch.address}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' as const, marginTop: 4, fontSize: 11 }}>
                  <span>Tel: {branch.phone}</span>
                  {branch.email && <span>Email: {branch.email}</span>}
                  <span>GST: {branch.gstNumber}</span>
                </div>
              </div>
            )}
          </div>

          {/* Receipt Title */}
          <div className="receipt-title" style={{ textAlign: 'center', margin: '16px 0' }}>
            <h2 style={{ fontSize: 18, textTransform: 'uppercase' as const, letterSpacing: 3, color: '#B8860B', fontWeight: 700 }}>
              Purchase Order Receipt
            </h2>
            <div style={{ fontSize: 13, color: '#6B6B6B', marginTop: 4 }}>
              {order.poNumber || order.id}
            </div>
          </div>

          {/* Customer & Order Info Grid */}
          <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, padding: 14, background: '#FEFCF8', border: '1px solid #E8D5A8', borderRadius: 8 }}>
            <div className="info-group">
              <label style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#6B6B6B', fontWeight: 600, display: 'block', marginBottom: 3 }}>Customer</label>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{order.customerName}</p>
            </div>
            <div className="info-group">
              <label style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#6B6B6B', fontWeight: 600, display: 'block', marginBottom: 3 }}>Date</label>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{formatDateTime(order.createdAt)}</p>
            </div>
            {order.customerPhone && (
              <div className="info-group">
                <label style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#6B6B6B', fontWeight: 600, display: 'block', marginBottom: 3 }}>Phone</label>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{order.customerPhone}</p>
              </div>
            )}
            <div className="info-group">
              <label style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#6B6B6B', fontWeight: 600, display: 'block', marginBottom: 3 }}>Order ID</label>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: 'monospace' }}>{order.id}</p>
            </div>
            {order.customerAddress && (
              <div className="info-group">
                <label style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#6B6B6B', fontWeight: 600, display: 'block', marginBottom: 3 }}>Address</label>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{order.customerAddress}</p>
              </div>
            )}
            <div className="info-group">
              <label style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#6B6B6B', fontWeight: 600, display: 'block', marginBottom: 3 }}>Payment Mode</label>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{getPaymentLabel(order.paymentMode)}</p>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={{ background: '#B8860B', color: 'white', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 700, textAlign: 'left', borderRadius: '6px 0 0 0' }}>#</th>
                <th style={{ background: '#B8860B', color: 'white', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 700, textAlign: 'left' }}>Product</th>
                <th style={{ background: '#B8860B', color: 'white', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 700, textAlign: 'center' }}>Qty</th>
                <th style={{ background: '#B8860B', color: 'white', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 700, textAlign: 'right' }}>Rate</th>
                <th style={{ background: '#B8860B', color: 'white', padding: '10px 12px', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 700, textAlign: 'right', borderRadius: '0 6px 0 0' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#FEFCF8' }}>
                  <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f0e6d0' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f0e6d0', fontWeight: 500 }}>
                    {item.productName}
                    {item.category && <span style={{ display: 'block', fontSize: 10, color: '#6B6B6B' }}>{item.category}</span>}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f0e6d0', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f0e6d0', textAlign: 'right' }}>{formatCurrency(item.rate || item.price || 0)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid #f0e6d0', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount || item.total || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals-section" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <div className="totals-box" style={{ width: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#444' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(order.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#444' }}>
                <span>GST (18%)</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(order.taxAmount || order.gst || 0)}</span>
              </div>
              {(order.discountAmount ?? 0) > 0 && (
                <div className="discount" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#059669' }}>
                  <span>Discount {order.discount ? `(${order.discountType === 'percentage' ? `${order.discount}%` : 'Flat'})` : ''}</span>
                  <span style={{ fontWeight: 600 }}>-{formatCurrency(order.discountAmount!)}</span>
                </div>
              )}
              <div className="highlight" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #B8860B', paddingTop: 10, marginTop: 6, fontSize: 16, fontWeight: 800, color: '#B8860B' }}>
                <span>Grand Total</span>
                <span>{formatCurrency(order.totalAmount || order.total || 0)}</span>
              </div>
              <div className="paid" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#059669', fontWeight: 600 }}>
                <span>Amount Paid</span>
                <span>{formatCurrency(amountPaid)}</span>
              </div>
              {amountDue > 0 && (
                <div className="due" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontSize: 14, color: '#D97706', fontWeight: 700, background: '#FFFBEB', margin: '4px -8px', borderRadius: 6 }}>
                  <span>Balance Due</span>
                  <span>{formatCurrency(amountDue)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="payment-info" style={{ padding: 14, background: '#FEFCF8', border: '1px solid #E8D5A8', borderRadius: 8, marginBottom: 16 }}>
            <h4 style={{ fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#B8860B', fontWeight: 700, marginBottom: 8 }}>Payment Details</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 16, fontSize: 12, color: '#444' }}>
              <div>
                <span style={{ color: '#6B6B6B' }}>Mode: </span>
                <strong style={{ color: '#1A1A1A' }}>{getPaymentLabel(order.paymentMode)}</strong>
              </div>
              <div>
                <span style={{ color: '#6B6B6B' }}>Status: </span>
                <span
                  className={`payment-badge ${paymentStatusBadgeClass}`}
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    background: order.paymentStatus === 'paid' ? '#D1FAE5' : order.paymentStatus === 'partial' ? '#FEF3C7' : '#FFF7ED',
                    color: order.paymentStatus === 'paid' ? '#065F46' : order.paymentStatus === 'partial' ? '#92400E' : '#9A3412',
                  }}
                >
                  {getPaymentStatusLabel(order.paymentStatus)}
                </span>
              </div>
              {order.paymentReference && (
                <div>
                  <span style={{ color: '#6B6B6B' }}>Ref: </span>
                  <strong style={{ color: '#1A1A1A', fontFamily: 'monospace' }}>{order.paymentReference}</strong>
                </div>
              )}
              {order.createdByName && (
                <div>
                  <span style={{ color: '#6B6B6B' }}>Created by: </span>
                  <strong style={{ color: '#1A1A1A' }}>{order.createdByName}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.orderNotes && (
            <div className="notes-section" style={{ padding: 12, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 16 }}>
              <h4 style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#6B6B6B', fontWeight: 600, marginBottom: 6 }}>Notes</h4>
              <p style={{ fontSize: 12, color: '#444', whiteSpace: 'pre-line' }}>{order.orderNotes}</p>
            </div>
          )}

          {/* Signature Area */}
          <div className="stamp-area" style={{ display: 'flex', justifyContent: 'space-between', margin: '24px 0 16px', paddingTop: 16 }}>
            <div className="stamp-box" style={{ textAlign: 'center', width: 180 }}>
              <div className="line" style={{ borderTop: '1px solid #999', marginBottom: 6 }} />
              <p style={{ fontSize: 11, color: '#6B6B6B' }}>Customer Signature</p>
            </div>
            <div className="stamp-box" style={{ textAlign: 'center', width: 180 }}>
              <div className="line" style={{ borderTop: '1px solid #999', marginBottom: 6 }} />
              <p style={{ fontSize: 11, color: '#6B6B6B' }}>Authorized Signature</p>
            </div>
          </div>

          {/* Footer */}
          <div className="footer" style={{ textAlign: 'center', paddingTop: 16, borderTop: '2px solid #E8D5A8' }}>
            <p className="thank-you" style={{ fontSize: 14, fontWeight: 700, color: '#B8860B', marginBottom: 6 }}>
              Thank you for choosing OSK Granite!
            </p>
            <p style={{ fontSize: 11, color: '#6B6B6B', marginBottom: 3 }}>
              This is a computer-generated receipt and does not require a physical signature.
            </p>
            <p style={{ fontSize: 11, color: '#6B6B6B', marginBottom: 3 }}>
              For queries, please contact the branch directly.
            </p>
            <p style={{ fontSize: 10, color: '#999', marginTop: 8 }}>
              Generated on {new Date().toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
