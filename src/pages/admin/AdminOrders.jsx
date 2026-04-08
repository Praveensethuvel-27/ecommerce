import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download, FileText, Package, Eye, RefreshCw,
  ChevronLeft, ChevronRight, Bell, CheckCircle,
  Loader2, X, ArrowDownToLine, Truck, UserCheck,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { getOrders, updateOrderStatus, rejectOrder, listDrivers, assignDriver } from '../../utils/api';
import { subscribeOrdersNew, subscribeOrdersUpdated } from '../../utils/realtime';

const COMPANY = {
  name:    "Grand Ma's Care",
  tagline: 'Pure Nature, Delivered Fresh',
  address: '123, Organic Park, Koramangala, Bengaluru – 560034',
  gstin:   '29ABCDE1234F1Z5',
  pan:     'ABCDE1234F',
  email:   'support@grandmascare.in',
  phone:   '+91 98765 43210',
};

const formatPrice = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(val) || 0);

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const STATUSES    = ['pending', 'confirmed', 'shipped', 'delivered', 'rejected'];
const ALL_FILTERS = ['all', ...STATUSES];

const STATUS_META = {
  pending:   { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316', label: 'Pending' },
  confirmed: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', label: 'Confirmed' },
  shipped:   { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', label: 'Shipped' },
  delivered: { bg: '#F0FDF4', text: '#166534', dot: '#22C55E', label: 'Delivered' },
  rejected:  { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Rejected' },
};

async function drawMiniQR(doc, text, x, y, size = 28) {
  const payload = String(text);
  const qrPngDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: Math.round(size * 4),
    color: { dark: '#000000', light: '#ffffff' },
  });

  // Ensure consistent white background for scannability
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, 'F');
  doc.addImage(qrPngDataUrl, 'PNG', x, y, size, size);
}

function drawBarcode(doc, text, x, y, w, h) {
  const bars = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    for (let b = 0; b < 7; b++) bars.push((code >> b) & 1);
  }
  const barW = w / bars.length;
  doc.setFillColor(0,0,0);
  bars.forEach((on, i) => { if (on) doc.rect(x + i * barW, y, barW, h, 'F'); });
  doc.setDrawColor(0); doc.setLineWidth(0.3);
  doc.rect(x, y, w, h, 'S');
}

function numberToWords(n) {
  if (!n) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const conv = (num) => {
    if (num < 20)       return ones[num];
    if (num < 100)      return tens[Math.floor(num/10)] + (num%10 ? ' '+ones[num%10] : '');
    if (num < 1000)     return ones[Math.floor(num/100)] + ' Hundred' + (num%100 ? ' '+conv(num%100) : '');
    if (num < 100000)   return conv(Math.floor(num/1000)) + ' Thousand' + (num%1000 ? ' '+conv(num%1000) : '');
    if (num < 10000000) return conv(Math.floor(num/100000)) + ' Lakh' + (num%100000 ? ' '+conv(num%100000) : '');
    return conv(Math.floor(num/10000000)) + ' Crore' + (num%10000000 ? ' '+conv(num%10000000) : '');
  };
  return conv(Math.round(n));
}

async function generateInvoicePDF(order) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw  = 210;
  const ref = order.orderId || order.id;
  const invoiceNo = `INV-${ref.slice(-10).toUpperCase()}`;
  const isCod = order.paymentMethod === 'cod';

  doc.setFillColor(43,90,39); doc.rect(0,0,pw,42,'F');
  doc.setFillColor(107,68,35); doc.rect(0,42,pw,4,'F');

  doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(255,255,255);
  doc.text(COMPANY.name, 14, 15);
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(180,220,170);
  doc.text(COMPANY.tagline,  14, 21);
  doc.text(COMPANY.address,  14, 26);
  doc.text(`GSTIN: ${COMPANY.gstin}  |  PAN: ${COMPANY.pan}  |  ${COMPANY.email}  |  ${COMPANY.phone}`, 14, 31);

  doc.setFont('helvetica','bold'); doc.setFontSize(17); doc.setTextColor(255,220,100);
  doc.text('TAX INVOICE', pw-14, 15, { align:'right' });
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(200,240,190);
  doc.text(`Invoice No: ${invoiceNo}`,                        pw-14, 23, { align:'right' });
  doc.text(`Invoice Date: ${formatDate(order.createdAt)}`,    pw-14, 28, { align:'right' });
  doc.text(`Order Ref: ${order.orderId || ref}`,              pw-14, 33, { align:'right' });
  doc.text(`Order Status: ${(order.status || 'pending')}`,    pw-14, 38, { align:'right' });

  doc.setFillColor(34,197,94); doc.roundedRect(pw-58,47,46,10,2,2,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(255,255,255);
  doc.text('✓  ORDER CONFIRMED', pw-35, 53.5, { align:'center' });

  const addr = order.shippingAddress || {};
  doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(43,90,39);
  doc.text('BILL TO / SHIP TO', 14, 58);
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(20,20,20);
  doc.text(addr.name || order.customerName || 'Customer', 14, 65);
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(60,60,60);
  [
    addr.line1,
    addr.line2,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.pincode  ? `Pincode: ${addr.pincode}` : '',
    addr.phone    ? `Phone: ${addr.phone}` : '',
    order.customerEmail ? `Email: ${order.customerEmail}` : '',
  ].filter(Boolean).forEach((l, i) => doc.text(l, 14, 72 + i*5));

  const qrSize = 28;
  const qrX = pw - 44;
  const qrY = 55;
  const trackingUrl = `${window.location.origin}/track-order?orderId=${encodeURIComponent(ref)}`;
  await drawMiniQR(doc, trackingUrl, qrX, qrY, qrSize);
  doc.setFontSize(6); doc.setTextColor(100,100,100);
  doc.text('Scan to track', qrX + qrSize / 2, qrY + qrSize + 3, { align:'center' });

  doc.setDrawColor(200); doc.setLineWidth(0.3); doc.line(14,100,pw-14,100);

  const items = order.items || [];
  autoTable(doc, {
    startY: 104,
    head: [['#','Product','Weight','Qty','Unit Price','Tax%','Tax Amt','Total']],
    body: items.map((item, idx) => {
      const up  = Number(item.price)    || 0;
      const qty = Number(item.quantity) || 1;
      const sub = up * qty;
      const tax = sub * 0.05;
      return [idx+1, item.name||'Product', item.weight||'—', qty,
        formatPrice(up), '5%', formatPrice(tax), formatPrice(sub+tax)];
    }),
    styles: { fontSize:8, cellPadding:3 },
    headStyles: { fillColor:[43,90,39], textColor:255, fontStyle:'bold', fontSize:8 },
    alternateRowStyles: { fillColor:[245,250,245] },
    columnStyles: { 0:{cellWidth:8}, 3:{halign:'center'}, 4:{halign:'right'}, 6:{halign:'right'}, 7:{halign:'right'} },
    margin: { left:14, right:14 },
  });

  const fy = doc.lastAutoTable.finalY + 8;

  const subtotalAmt = Number(order.subtotal) || items.reduce((s,i) => s+(Number(i.price)||0)*(Number(i.quantity)||1), 0);
  const taxTotal    = subtotalAmt * 0.05;
  const ship        = Number(order.shippingCost) || 0;
  const disc        = Number(order.discount)     || 0;
  const grand       = Number(order.total) || (subtotalAmt + taxTotal + ship - disc);

  doc.setFillColor(245,250,245); doc.roundedRect(pw-88,fy,74,52,2,2,'F');
  doc.setDrawColor(43,90,39); doc.setLineWidth(0.4); doc.roundedRect(pw-88,fy,74,52,2,2,'S');
  [
    ['Subtotal',    formatPrice(subtotalAmt)],
    ['CGST (2.5%)', formatPrice(taxTotal/2)],
    ['SGST (2.5%)', formatPrice(taxTotal/2)],
    ['Shipping',    ship > 0 ? formatPrice(ship) : 'FREE'],
    ['Discount',    disc > 0 ? `-${formatPrice(disc)}` : '—'],
  ].forEach(([label, val], i) => {
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(60,60,60);
    doc.text(label, pw-84, fy+8+i*7);
    doc.text(val,   pw-16, fy+8+i*7, { align:'right' });
  });

  doc.setFillColor(43,90,39); doc.roundedRect(pw-88,fy+38,74,14,2,2,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(255,255,255);
  doc.text('GRAND TOTAL', pw-84, fy+47);
  doc.text(formatPrice(grand), pw-16, fy+47, { align:'right' });

  doc.setFont('helvetica','italic'); doc.setFontSize(8); doc.setTextColor(80,80,80);
  doc.text(`Amount in words: ${numberToWords(grand)} Rupees Only`, 14, fy+10);
  doc.setFont('helvetica','normal');
  doc.text(`Payment Mode: ${isCod ? 'Cash on Delivery (COD)' : 'Online Payment'}`, 14, fy+18);
  doc.text(`Payment Status: ${isCod ? 'Pending (to be collected)' : 'PAID ✓'}`, 14, fy+24);
  doc.text(`Transaction Ref: ${order.paymentId || (isCod ? 'COD' : 'N/A')}`, 14, fy+30);

  const bcY = fy+60;
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(43,90,39);
  doc.text('ORDER BARCODE', 14, bcY-2);
  drawBarcode(doc, ref, 14, bcY, 80, 12);
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(80,80,80);
  doc.text(ref, 14, bcY+15);

  doc.setFillColor(43,90,39); doc.rect(0,282,pw,15,'F');
  doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(180,230,170);
  doc.text(`Thank you for choosing ${COMPANY.name}! Queries: ${COMPANY.email}`, pw/2, 288, { align:'center' });
  doc.text('Computer-generated invoice — no physical signature required.', pw/2, 293, { align:'center' });

  doc.save(`Invoice-${invoiceNo}.pdf`);
}

async function generateShippingLabel(order) {
  const doc = new jsPDF({ unit:'mm', format:'a5' });
  const pw  = 148;
  const addr   = order.shippingAddress || {};
  const ref    = order.orderId || order.id;
  const dispId = order.orderId || `#${order.id.slice(-8).toUpperCase()}`;
  const invNo  = `INV-${ref.slice(-10).toUpperCase()}`;
  const isCod  = order.paymentMethod === 'cod';

  doc.setDrawColor(0); doc.setLineWidth(1);
  doc.rect(4,4,pw-8,202,'S');

  doc.setFillColor(43,90,39); doc.rect(4,4,pw-8,16,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(255,255,255);
  doc.text(COMPANY.name, 10, 14);

  doc.setFillColor(isCod ? 250 : 255, isCod ? 200 : 220, isCod ? 200 : 50);
  doc.roundedRect(pw-52,7,42,10,2,2,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.setTextColor(isCod ? 153 : 30, isCod ? 27 : 30, isCod ? 27 : 30);
  doc.text(isCod ? 'CASH ON DELIVERY' : 'PREPAID', pw-31, 13.5, { align:'center' });

  doc.setLineWidth(0.3); doc.setDrawColor(150);
  doc.line(4,20,pw-4,20);

  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(43,90,39);
  doc.text('DELIVER TO:', 10, 28);
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(0,0,0);
  doc.text(addr.name || order.customerName || 'Customer', 10, 37);

  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(30,30,30);
  const addrLines = [
    addr.line1,
    addr.line2,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.pincode ? `PIN: ${addr.pincode}` : '',
  ].filter(Boolean);
  addrLines.forEach((l, i) => doc.text(l, 10, 45+i*7));

  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(0,0,0);
  doc.text(`Mob: ${addr.phone || order.customerPhone || '—'}`, 10, 45+addrLines.length*7);

  doc.line(4,92,pw-4,92);
  doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(43,90,39);
  doc.text('BARCODE', 10, 98);
  drawBarcode(doc, ref, 10, 100, pw-20, 18);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(0,0,0);
  doc.text(ref, pw/2, 122, { align:'center' });

  doc.setFillColor(240,248,240); doc.rect(4,128,pw-8,28,'F');
  doc.setDrawColor(150); doc.rect(4,128,pw-8,28,'S');
  doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(30,30,30);
  doc.text(`Order: ${dispId}`,                     10,       137);
  doc.text(`Invoice: ${invNo}`,                     10,       145);
  doc.text(`Date: ${formatDate(order.createdAt)}`,  10,       153);
  doc.text(`Payment: ${isCod ? 'COD (Collect on delivery)' : 'Prepaid'}`, pw/2+4, 137);
  doc.text(`Items: ${(order.items||[]).length}`,    pw/2+4,   145);
  doc.text(`Amount: ${formatPrice(order.total)}`,   pw/2+4,   153);

  doc.setLineWidth(0.3); doc.line(4,160,pw-4,160);
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(43,90,39);
  doc.text('COURIER PARTNER', 10, 167);
  doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(0,0,0);
  doc.text(order.courierPartner || 'To be assigned', 10, 175);
  doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(80,80,80);
  doc.text(`AWB: ${order.awbNumber || 'Pending Assignment'}`, 10, 182);

  const qrSize = 26;
  const qrX = pw - qrSize - 12;
  const qrY = 162;
  const trackingUrl = `${window.location.origin}/track-order?orderId=${encodeURIComponent(ref)}`;
  await drawMiniQR(doc, trackingUrl, qrX, qrY, qrSize);
  doc.setFontSize(6.5); doc.setTextColor(100,100,100);
  doc.text('Track', qrX + qrSize / 2, qrY + qrSize + 7, { align:'center' });

  doc.setFillColor(230,240,230); doc.rect(4,193,pw-8,13,'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(6.5); doc.setTextColor(43,90,39);
  doc.text('RETURN TO (SELLER):', 10, 199);
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(40,40,40);
  doc.text(`${COMPANY.name}, ${COMPANY.address} | ${COMPANY.phone}`, 10, 205, { maxWidth:pw-20 });

  doc.save(`ShippingLabel-${dispId}.pdf`);
}

// ─── Assign Driver Modal ──────────────────────────────────────────────────────
function AssignDriverModal({ order, onClose, onAssigned }) {
  const [drivers, setDrivers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    listDrivers()
      .then((data) => setDrivers(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load drivers'))
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await assignDriver(order.id, selected);
      const drv = drivers.find((d) => d.id === selected);
      onAssigned(order.id, drv);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign driver');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'fadeScaleIn 0.2s ease' }}>
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,#2B5A27,#3D7A38)' }}>
          <div>
            <p className="text-white font-bold text-base flex items-center gap-2">
              <Truck className="w-4 h-4" /> Assign Driver
            </p>
            <p className="text-green-200 text-xs mt-0.5">{order.orderId || order.id}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">✕</button>
        </div>

        <div className="p-6">
          {order.assignedDriverName && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
              <UserCheck className="w-4 h-4 flex-shrink-0" />
              <span>Currently assigned: <strong>{order.assignedDriverName}</strong></span>
            </div>
          )}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-700">{error}</div>
          )}
          {loading ? (
            <div className="py-8 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading drivers…</p>
            </div>
          ) : drivers.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No drivers available.</p>
              <p className="text-xs mt-1">Add drivers from Admin Settings.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-sm font-semibold text-gray-700 mb-3">Select a driver:</p>
              {drivers.map((drv) => (
                <label key={drv.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all"
                  style={{
                    borderColor: selected === drv.id ? '#2B5A27' : '#E5E7EB',
                    background: selected === drv.id ? '#F0FDF4' : 'white',
                  }}>
                  <input type="radio" name="driver" value={drv.id}
                    checked={selected === drv.id}
                    onChange={() => setSelected(drv.id)}
                    className="sr-only" />
                  <span className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: selected === drv.id ? '#2B5A27' : '#D1D5DB' }}>
                    {selected === drv.id && <span className="w-2 h-2 rounded-full bg-green-700" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800">{drv.name}</p>
                    <p className="text-xs text-gray-500">{drv.phone} · {drv.email}</p>
                  </div>
                  {!drv.active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inactive</span>
                  )}
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-3 mt-5">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium text-gray-500"
              style={{ borderColor: '#D1D5DB' }}>
              Cancel
            </button>
            <button onClick={handleAssign}
              disabled={!selected || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#2B5A27,#3D7A38)' }}>
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning…</>
                : <><Truck className="w-4 h-4" /> Assign Driver</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reject Order Modal ───────────────────────────────────────────────────────
const REJECT_REASONS = [
  'Out of stock / Product unavailable',
  'Delivery not available in this area',
  'Suspicious / Fraudulent order',
  'Customer requested cancellation',
  'Incorrect pricing or product details',
  'Other (type below)',
];

function RejectModal({ order, onConfirm, onClose, loading }) {
  const [selected, setSelected] = useState('');
  const [custom, setCustom]     = useState('');

  const finalReason = selected === 'Other (type below)' ? custom.trim() : selected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'fadeScaleIn 0.2s ease' }}>
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,#7F1D1D,#991B1B)' }}>
          <div>
            <p className="text-white font-bold text-base">Reject Order</p>
            <p className="text-red-200 text-xs mt-0.5">{order.orderId || order.id}</p>
          </div>
          <button onClick={onClose} disabled={loading}
            className="text-white/70 hover:text-white text-2xl leading-none">✕</button>
        </div>
        <div className="p-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Select a reason for rejection:</p>
          <div className="flex flex-col gap-2 mb-4">
            {REJECT_REASONS.map((r) => (
              <label key={r}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all text-sm"
                style={{
                  borderColor: selected === r ? '#EF4444' : '#E5E7EB',
                  background: selected === r ? '#FEF2F2' : 'white',
                  color: selected === r ? '#991B1B' : '#374151',
                  fontWeight: selected === r ? 600 : 400,
                }}>
                <input type="radio" name="reason" value={r}
                  checked={selected === r}
                  onChange={() => setSelected(r)}
                  className="sr-only" />
                <span className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                  style={{ borderColor: selected === r ? '#EF4444' : '#D1D5DB' }}>
                  {selected === r && <span className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />}
                </span>
                {r}
              </label>
            ))}
          </div>
          {selected === 'Other (type below)' && (
            <textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Type your reason here…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none transition-colors"
              style={{ borderColor: custom.trim() ? '#EF4444' : '#E5E7EB', color: '#374151' }}
            />
          )}
          {finalReason && (
            <div className="mt-3 px-4 py-3 rounded-xl text-xs flex gap-2"
              style={{ background: '#FEF2F2', color: '#991B1B' }}>
              <span>⚠️</span>
              <span>Stock will be <strong>restored</strong> automatically. Customer will be notified.</span>
            </div>
          )}
          <div className="flex gap-3 mt-5">
            <button onClick={onClose} disabled={loading}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors"
              style={{ borderColor: '#D1D5DB', color: '#6B7280' }}>
              Cancel
            </button>
            <button
              disabled={!finalReason || loading}
              onClick={() => onConfirm(finalReason)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: loading ? '#EF4444AA' : 'linear-gradient(135deg,#DC2626,#EF4444)' }}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Rejecting…</>
                : '🚫 Confirm Reject'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeScaleIn {
          from { opacity:0; transform:scale(0.92); }
          to   { opacity:1; transform:scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Accept Loading Overlay ───────────────────────────────────────────────────
function AcceptLoadingOverlay({ order }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl px-10 py-10 flex flex-col items-center gap-5 w-full max-w-sm mx-4"
        style={{ animation: 'fadeScaleIn 0.2s ease' }}>
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-green-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-green-700 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle className="w-8 h-8" style={{ color: '#2B5A27' }} />
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold text-lg" style={{ color: '#2B5A27' }}>Accepting Order…</p>
          <p className="text-sm mt-1" style={{ color: '#8B7355' }}>{order.orderId || order.id}</p>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#E8F0E8' }}>
          <div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#2B5A27,#6B4423)', animation: 'progressBar 2s ease-in-out forwards' }} />
        </div>
        <p className="text-xs" style={{ color: '#8B7355' }}>Updating order status in database…</p>
      </div>
      <style>{`
        @keyframes fadeScaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        @keyframes progressBar { 0% { width:0%; } 60% { width:75%; } 100% { width:100%; } }
      `}</style>
    </div>
  );
}

// ─── Download Ready Bar ───────────────────────────────────────────────────────
function DownloadReadyBar({ order, onDismiss }) {
  const [visible, setVisible]     = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); onDismiss(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDismiss]);

  const handleDismiss = () => { setVisible(false); setTimeout(onDismiss, 350); };

  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:9999,
      transform: visible ? 'translateY(0)' : 'translateY(110%)',
      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <div style={{ margin:'0 auto 20px', maxWidth:600, borderRadius:'1.25rem',
        boxShadow:'0 8px 40px rgba(0,0,0,0.22)', overflow:'hidden', border:'1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ height:4, background:'#E8F0E8' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg,#2B5A27,#22C55E)', animation:'shrinkBar 30s linear forwards' }} />
        </div>
        <div style={{ background:'linear-gradient(135deg,#1a3d18 0%,#2B5A27 50%,#3d6b23 100%)', padding:'16px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <CheckCircle style={{ width:20, height:20, color:'#86EFAC' }} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:'#fff', fontWeight:700, fontSize:14, margin:0 }}>✅ Order Accepted!</p>
              <p style={{ color:'#86EFAC', fontSize:12, margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {order.orderId || order.id} · {order.shippingAddress?.name || order.customerName || ''}
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>closes in {countdown}s</span>
              <button onClick={handleDismiss}
                style={{ background:'rgba(255,255,255,0.12)', border:'none', borderRadius:8, padding:'4px 6px', cursor:'pointer', display:'flex', alignItems:'center' }}>
                <X style={{ width:14, height:14, color:'rgba(255,255,255,0.7)' }} />
              </button>
            </div>
          </div>
          <p style={{ color:'rgba(255,255,255,0.65)', fontSize:11, marginBottom:10, fontWeight:500, letterSpacing:'0.05em', textTransform:'uppercase' }}>
            Now you can download:
          </p>
          <div style={{ display:'flex', gap:10 }}>
            {[
              {
                label: 'Shipping Label',
                icon: <Package style={{ width: 16, height: 16, color: '#FDE68A' }} />,
                action: () =>
                  generateShippingLabel(order).catch((err) => {
                    alert(err?.message || 'Failed to generate shipping label');
                  }),
              },
              {
                label: 'Invoice PDF',
                icon: <FileText style={{ width: 16, height: 16, color: '#FDE68A' }} />,
                action: () =>
                  generateInvoicePDF(order).catch((err) => {
                    alert(err?.message || 'Failed to generate invoice');
                  }),
              },
            ].map(({ label, icon, action }) => (
              <button key={label} onClick={action}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'11px 16px', borderRadius:'0.85rem', background:'rgba(255,255,255,0.12)',
                  border:'1.5px solid rgba(255,255,255,0.2)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                {icon} {label} <ArrowDownToLine style={{ width:13, height:13, color:'#86EFAC' }} />
              </button>
            ))}
            <button
              onClick={() => {
                Promise.all([generateShippingLabel(order), generateInvoicePDF(order)]).catch((err) => {
                  alert(err?.message || 'Failed to generate PDFs');
                });
              }}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'11px 14px', borderRadius:'0.85rem', background:'linear-gradient(135deg,#F59E0B,#D97706)',
                border:'none', color:'#1a1a1a', fontWeight:700, fontSize:12, cursor:'pointer', whiteSpace:'nowrap',
                boxShadow:'0 2px 12px rgba(245,158,11,0.4)' }}>
              <Download style={{ width:14, height:14 }} /> Both
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes shrinkBar { from { width:100%; } to { width:0%; } }`}</style>
    </div>
  );
}

// ─── New Order Toast ──────────────────────────────────────────────────────────
function NewOrderToast({ orders, onDismiss }) {
  if (orders.length === 0) return null;
  return (
    <div className="fixed top-6 right-6 z-50 space-y-2 max-w-sm">
      {orders.map((o) => (
        <div key={o.id}
          className="flex items-start gap-3 p-4 rounded-2xl shadow-2xl border border-green-200"
          style={{ background: 'linear-gradient(135deg,#2B5A27,#3D7A38)' }}>
          <Bell className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">New Order Received!</p>
            <p className="text-green-200 text-xs mt-0.5 truncate">{o.orderId} — {o.customerName || o.customerEmail}</p>
            <p className="text-yellow-300 text-xs font-semibold">{formatPrice(o.total)}</p>
          </div>
          <button onClick={() => onDismiss(o.id)} className="text-white/60 hover:text-white text-lg leading-none">✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderModal({ order, onClose, onStatusChange }) {
  const [updating, setUpdating] = useState(false);
  const addr  = order.shippingAddress || {};
  const items = order.items || [];

  const applyStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, newStatus);
      onStatusChange(order.id, newStatus);
    } catch (err) {
      alert(err?.message || 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5"
          style={{ background:'linear-gradient(135deg,#2B5A27,#6B4423)', borderRadius:'1rem 1rem 0 0' }}>
          <div>
            <div className="text-white font-bold text-lg">{order.orderId || `#${order.id.slice(-8).toUpperCase()}`}</div>
            <div className="text-green-200 text-xs mt-0.5">{formatDate(order.createdAt)}</div>
          </div>
          <button onClick={onClose} className="text-white hover:text-green-200 text-2xl leading-none">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <section>
            <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">Order Status</h3>
            {order.status === 'rejected' ? (
              <div className="rounded-xl px-4 py-3 text-sm" style={{ background:'#FEF2F2', border:'1px solid #FECACA' }}>
                <div className="flex items-center gap-2 font-bold" style={{ color:'#991B1B' }}>🚫 Order Rejected</div>
                {order.rejectionReason && (
                  <p className="mt-1 text-xs" style={{ color:'#DC2626' }}>Reason: {order.rejectionReason}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter(s => s !== 'rejected').map((s) => {
                  const sm     = STATUS_META[s];
                  const active = order.status === s;
                  return (
                    <button key={s} disabled={updating || active} onClick={() => applyStatus(s)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all disabled:opacity-60"
                      style={active ? { background:sm.bg, color:sm.text, borderColor:sm.dot } : { background:'white', color:'#888', borderColor:'#ddd' }}>
                      {updating && !active ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : active ? '✓ ' : ''}
                      {sm.label}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {order.assignedDriverName && (
            <section>
              <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">Assigned Driver</h3>
              <div className="bg-blue-50 rounded-xl p-3 text-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-blue-800">{order.assignedDriverName}</div>
                  {order.assignedDriverPhone && (
                    <a href={`tel:${order.assignedDriverPhone}`} className="text-xs text-blue-600 underline">
                      {order.assignedDriverPhone}
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">Customer Details</h3>
            <div className="bg-green-50 rounded-xl p-3 text-sm space-y-1 text-gray-700">
              <div><span className="font-semibold">Name:</span> {addr.name || order.customerName || '—'}</div>
              <div><span className="font-semibold">Phone:</span> {addr.phone || order.customerPhone || '—'}</div>
              <div><span className="font-semibold">Email:</span> {order.customerEmail || '—'}</div>
              <div><span className="font-semibold">Address:</span> {[addr.line1,addr.line2,addr.city,addr.state,addr.pincode].filter(Boolean).join(', ')||'—'}</div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">Payment</h3>
            <div className="bg-green-50 rounded-xl p-3 text-sm space-y-1 text-gray-700">
              <div><span className="font-semibold">Method:</span> {order.paymentMethod==='cod'?'Cash on Delivery':'Online (Prepaid)'}</div>
              <div><span className="font-semibold">Subtotal:</span> {formatPrice(order.subtotal)}</div>
              <div><span className="font-semibold">Shipping:</span> {order.shippingCost>0?formatPrice(order.shippingCost):'FREE'}</div>
              <div><span className="font-semibold">Total:</span> <span className="font-bold text-green-800">{formatPrice(order.total)}</span></div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">Items ({items.length})</h3>
            <div className="rounded-xl overflow-hidden border border-green-100">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background:'#2B5A27' }}>
                    {['Product','Weight','Qty','Price','Total'].map(h => (
                      <th key={h} className="p-2 text-left text-white font-semibold text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={{ background:i%2===0?'#F0FDF4':'white' }}>
                      <td className="p-2 font-medium text-gray-800">{item.name||'—'}</td>
                      <td className="p-2 text-gray-500 text-xs">{item.weight||'—'}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2">{formatPrice(item.price)}</td>
                      <td className="p-2 font-semibold text-green-800">{formatPrice((item.price||0)*(item.quantity||1))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {order.status !== 'pending' && order.status !== 'rejected' && (
            <div className="flex gap-3 pt-1">
              <button onClick={() => generateInvoicePDF(order)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-semibold text-sm"
                style={{ background:'linear-gradient(135deg,#2B5A27,#3D7A38)' }}>
                <FileText className="w-4 h-4" /> Download Invoice
              </button>
              <button onClick={() => generateShippingLabel(order)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-semibold text-sm"
                style={{ background:'linear-gradient(135deg,#6B4423,#8B5E2E)' }}>
                <Package className="w-4 h-4" /> Shipping Label
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders]          = useState([]);
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState('');
  const [selectedOrder, setSelected] = useState(null);
  const [statusFilter, setFilter]    = useState('all');
  const [pagination, setPagination]  = useState({ page:1, pages:1, total:0 });

  const [acceptingOrder, setAcceptingOrder]         = useState(null);
  const [downloadReadyOrder, setDownloadReadyOrder] = useState(null);
  const [rejectTarget, setRejectTarget]             = useState(null);
  const [rejectLoading, setRejectLoading]           = useState(false);
  const [assignTarget, setAssignTarget]             = useState(null);
  const [newOrderToasts, setNewOrderToasts]         = useState([]);
  const audioRef = useRef(null);

  const loadOrders = useCallback(async (page = 1) => {
    setLoading(true); setError('');
    try {
      const data = await getOrders({ status: statusFilter, page, limit: 20 });
      const list = Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : [];
      setOrders(list);
      if (data?.pagination) setPagination(data.pagination);
    } catch (err) {
      setError(err?.message || 'Failed to load orders');
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { loadOrders(1); }, [loadOrders]);

  useEffect(() => {
    const unsub = subscribeOrdersNew((newOrder) => {
      setOrders((prev) => prev.some((o) => o.id === newOrder.id) ? prev : [newOrder, ...prev]);
      setPagination((p) => ({ ...p, total: p.total + 1 }));
      setNewOrderToasts((prev) => [...prev, newOrder]);
      try { audioRef.current?.play(); } catch {}
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeOrdersUpdated((updated) => {
      setOrders((prev) => prev.map((o) => o.id === updated.id ? { ...o, status: updated.status } : o));
      setSelected((prev) => prev?.id === updated.id ? { ...prev, status: updated.status } : prev);
    });
    return unsub;
  }, []);

  const handleStatusChange = (orderId, newStatus) => {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    setSelected((prev) => prev?.id === orderId ? { ...prev, status: newStatus } : prev);
  };

  const handleAcceptOrder = async (order) => {
    setAcceptingOrder(order);
    try {
      await updateOrderStatus(order.id, 'confirmed');
      handleStatusChange(order.id, 'confirmed');
      await new Promise((r) => setTimeout(r, 2000));
      setAcceptingOrder(null);
      setDownloadReadyOrder({ ...order, status: 'confirmed' });
    } catch (err) {
      setAcceptingOrder(null);
      alert(err?.message || 'Failed to accept order.');
    }
  };

  const dismissToast = (id) => setNewOrderToasts((prev) => prev.filter((o) => o.id !== id));

  const handleRejectOrder = async (reason) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await rejectOrder(rejectTarget.id, reason);
      handleStatusChange(rejectTarget.id, 'rejected');
      setRejectTarget(null);
    } catch (err) {
      alert(err?.message || 'Failed to reject order.');
    } finally { setRejectLoading(false); }
  };

  const handleDriverAssigned = (orderId, driver) => {
    setOrders((prev) => prev.map((o) =>
      o.id === orderId ? { ...o, assignedDriverName: driver?.name || '', assignedDriverPhone: driver?.phone || '' } : o
    ));
    setSelected((prev) =>
      prev?.id === orderId ? { ...prev, assignedDriverName: driver?.name || '', assignedDriverPhone: driver?.phone || '' } : prev
    );
  };

  // ── FIX 1: stats object was missing `const stats =` declaration ──────────
  const stats = {
    total:   pagination.total || orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    revenue: orders.reduce((s, o) => s + (Number(o.total)||0), 0),
  };

  return (
    <div>
      <audio ref={audioRef} src="/notification.mp3" preload="none" />

      {assignTarget && (
        <AssignDriverModal order={assignTarget} onClose={() => setAssignTarget(null)} onAssigned={handleDriverAssigned} />
      )}
      {rejectTarget && (
        <RejectModal order={rejectTarget} onConfirm={handleRejectOrder} onClose={() => setRejectTarget(null)} loading={rejectLoading} />
      )}
      {acceptingOrder && <AcceptLoadingOverlay order={acceptingOrder} />}
      {downloadReadyOrder && (
        <DownloadReadyBar order={downloadReadyOrder} onDismiss={() => setDownloadReadyOrder(null)} />
      )}
      <NewOrderToast orders={newOrderToasts} onDismiss={dismissToast} />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'#6B4423' }}>Orders</h1>
          <p className="text-sm mt-0.5" style={{ color:'#8B7355' }}>{pagination.total || 0} total · live updates active</p>
        </div>
        <div className="flex items-center gap-3">
          {newOrderToasts.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white animate-pulse"
              style={{ background:'#F97316' }}>
              <Bell className="w-3.5 h-3.5" /> {newOrderToasts.length} new
            </span>
          )}
          <select value={statusFilter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm focus:outline-none"
            style={{ borderColor:'#8B7355', color:'#6B4423' }}>
            {ALL_FILTERS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
            ))}
          </select>
          <button onClick={() => loadOrders(pagination.page)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background:'linear-gradient(135deg,#2B5A27,#6B4423)' }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Total Orders', value:stats.total,                color:'#2B5A27' },
          { label:'Pending',      value:stats.pending,              color:'#F97316' },
          { label:'Shipped',      value:stats.shipped,              color:'#3B82F6' },
          { label:'Revenue',      value:formatPrice(stats.revenue), color:'#8B5CF6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4 border" style={{ background:'#FAFAF8', borderColor:`${color}22` }}>
            <div className="text-xs font-medium mb-1" style={{ color:'#8B7355' }}>{label}</div>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden border" style={{ background:'#FAFAF8', borderColor:'#8B735522' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background:'#E8F0E850', borderBottom:'1px solid #8B735530' }}>
                {['Order ID','Date','Customer','Items','Amount','Status','Actions'].map((h) => (
                  <th key={h} className="text-left p-4 text-sm font-semibold" style={{ color:'#6B4423' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center" style={{ color:'#8B7355' }}>
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full mr-2" />
                  Loading orders…
                </td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="p-6 text-center">
                  <p className="text-red-600 font-medium">{error}</p>
                  <button onClick={() => loadOrders(1)} className="mt-2 text-sm text-green-700 underline">Retry</button>
                </td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center" style={{ color:'#8B7355' }}>No orders found.</td></tr>
              ) : orders.map((order) => {
                const sm    = STATUS_META[order.status] || STATUS_META.pending;
                const isNew = newOrderToasts.some((t) => t.id === order.id);
                return (
                  <tr key={order.id} style={{ borderBottom:'1px solid #8B735512', background: isNew ? '#FFFBEB' : 'transparent' }}>
                    <td className="p-4 font-mono text-xs font-bold" style={{ color:'#6B4423' }}>
                      {isNew && <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1.5 animate-pulse" />}
                      {order.orderId || `#${order.id.slice(-8).toUpperCase()}`}
                    </td>
                    <td className="p-4 text-xs whitespace-nowrap" style={{ color:'#8B7355' }}>{formatDate(order.createdAt)}</td>
                    <td className="p-4">
                      <div className="font-medium text-sm" style={{ color:'#6B4423' }}>
                        {order.shippingAddress?.name || order.customerName || '—'}
                      </div>
                      <div className="text-xs" style={{ color:'#8B7355' }}>{order.customerEmail}</div>
                      {order.assignedDriverName && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-blue-600">
                          <Truck className="w-3 h-3" /> {order.assignedDriverName}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm" style={{ color:'#6B4423' }}>
                      {(order.items||[]).length} item{(order.items||[]).length!==1?'s':''}
                    </td>
                    <td className="p-4 font-bold text-sm" style={{ color:'#2D5A27' }}>{formatPrice(order.total)}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit"
                        style={{ background:sm.bg, color:sm.text }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background:sm.dot }} />
                        {sm.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button title="View & Manage" onClick={() => setSelected(order)}
                          className="p-2 rounded-lg hover:bg-green-50 transition-colors" style={{ color:'#2B5A27' }}>
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status !== 'pending' && (
                          <>
                            <button
                              title="Invoice PDF"
                              onClick={() => {
                                generateInvoicePDF(order).catch((err) => {
                                  alert(err?.message || 'Failed to generate invoice');
                                });
                              }}
                              className="p-2 rounded-lg hover:bg-green-50 transition-colors" style={{ color:'#2B5A27' }}>
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              title="Shipping Label"
                              onClick={() => {
                                generateShippingLabel(order).catch((err) => {
                                  alert(err?.message || 'Failed to generate shipping label');
                                });
                              }}
                              className="p-2 rounded-lg hover:bg-amber-50 transition-colors" style={{ color:'#6B4423' }}>
                              <Package className="w-4 h-4" />
                            </button>
                            <button
                              title="Download Both"
                              onClick={() => {
                                Promise.all([generateInvoicePDF(order), generateShippingLabel(order)]).catch((err) => {
                                  alert(err?.message || 'Failed to generate PDFs');
                                });
                              }}
                              className="p-2 rounded-lg hover:bg-gray-50 transition-colors" style={{ color:'#999' }}>
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button title="Assign Driver" onClick={() => setAssignTarget(order)}
                            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            style={{ color: order.assignedDriverName ? '#1D4ED8' : '#6B7280' }}>
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <>
                            <button title="Accept Order" onClick={() => handleAcceptOrder(order)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                              style={{ background:'linear-gradient(135deg,#2B5A27,#3D7A38)' }}>
                              Accept
                            </button>
                            <button title="Reject Order" onClick={() => setRejectTarget(order)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                              style={{ background:'linear-gradient(135deg,#DC2626,#EF4444)' }}>
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor:'#8B735520' }}>
            <span className="text-xs" style={{ color:'#8B7355' }}>
              Page {pagination.page} of {pagination.pages} · {pagination.total} orders
            </span>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => loadOrders(pagination.page - 1)}
                className="p-1.5 rounded-lg border disabled:opacity-40 hover:bg-green-50"
                style={{ borderColor:'#8B735540', color:'#6B4423' }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={pagination.page >= pagination.pages} onClick={() => loadOrders(pagination.page + 1)}
                className="p-1.5 rounded-lg border disabled:opacity-40 hover:bg-green-50"
                style={{ borderColor:'#8B735540', color:'#6B4423' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}