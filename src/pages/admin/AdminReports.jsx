import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import Button from '../../components/common/Button';
import { formatPrice } from '../../utils/formatPrice';
import { getProducts, getOrders, getProductSales } from '../../utils/api';

function buildMonthlyData(orders) {
  const map = {};
  const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (const o of orders) {
    const d = new Date(o.date || o.createdAt);
    const key = d.toLocaleString('en-US', { month: 'short' });
    if (!map[key]) map[key] = { month: key, sales: 0, orders: 0 };
    map[key].sales += o.total || 0;
    map[key].orders += 1;
  }
  return Object.values(map).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
}

function AdminReports() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prods, ords] = await Promise.all([getProducts(), getOrders()]);
        setProducts(Array.isArray(prods) ? prods : []);
        setOrders(Array.isArray(ords) ? ords : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const monthlyData = buildMonthlyData(orders);

  // Filter orders for selected month
  const selectedMonthOrders = orders.filter((o) => {
    const d = new Date(o.date || o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return key === month;
  });

  const productReportData = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.weightOptions?.length > 0 ? p.weightOptions[0].price : p.price,
    stock: p.stock,
    rating: p.rating || 0,
    reviews: p.reviewCount || 0,
    featured: p.featured ? 'Yes' : 'No',
    estimatedRevenue: (p.weightOptions?.length > 0 ? p.weightOptions[0].price : p.price) * (p.reviewCount || 0),
    weightOptions: p.weightOptions,
  }));

  const topProducts = [...products]
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 5)
    .map((p) => ({ name: p.name, sales: p.reviewCount || 0 }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(monthlyData);
    const ws2 = XLSX.utils.json_to_sheet(productReportData.map(p => ({
      Name: p.name,
      Price: formatPrice(p.price),
      Stock: p.stock,
      Rating: p.rating,
      Reviews: p.reviews,
      Featured: p.featured,
      'Est. Revenue': formatPrice(p.estimatedRevenue),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Sales');
    XLSX.utils.book_append_sheet(wb, ws2, 'Product Report');
    XLSX.writeFile(wb, `report-${month}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Monthly Sales Report - ' + month, 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [['Month', 'Sales', 'Orders']],
      body: monthlyData.map((r) => [r.month, formatPrice(r.sales), r.orders]),
    });
    doc.text('Product Report', 14, doc.lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Product', 'Price', 'Stock', 'Rating', 'Reviews']],
      body: productReportData.map((r) => [r.name, formatPrice(r.price), r.stock, r.rating, r.reviews]),
    });
    doc.save(`report-${month}.pdf`);
  };

  const downloadProductExcel = async (product) => {
    let salesData = null;
    try { salesData = await getProductSales(product.id); } catch {}

    const data = [{
      Name: product.name,
      Price: formatPrice(product.price),
      Stock: product.stock,
      Rating: product.rating,
      Reviews: product.reviews,
      Featured: product.featured,
      'Est. Revenue': formatPrice(product.estimatedRevenue),
      ...(salesData ? {
        'Total Qty Sold': salesData.totalQuantitySold,
        'Total Revenue': formatPrice(salesData.totalRevenue),
        'Order Count': salesData.orderCount,
      } : {}),
    }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, product.name.slice(0, 31));
    XLSX.writeFile(wb, `product-${product.name.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
  };

  const downloadProductPDF = async (product) => {
    let salesData = null;
    try { salesData = await getProductSales(product.id); } catch {}

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Product Report: ${product.name}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);
    autoTable(doc, {
      startY: 40,
      head: [['Field', 'Value']],
      body: [
        ['Product Name', product.name],
        ['Price', formatPrice(product.price)],
        ['Stock', product.stock.toString()],
        ['Rating', product.rating ? `${product.rating} / 5` : 'N/A'],
        ['Total Reviews', product.reviews.toString()],
        ['Featured', product.featured],
        ['Est. Revenue', formatPrice(product.estimatedRevenue)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [45, 90, 39] },
    });

    if (salesData) {
      let y = doc.lastAutoTable.finalY + 15;
      doc.text('Actual Sales Data', 14, y);
      autoTable(doc, {
        startY: y + 5,
        head: [['Metric', 'Value']],
        body: [
          ['Total Qty Sold', String(salesData.totalQuantitySold)],
          ['Total Revenue', formatPrice(salesData.totalRevenue)],
          ['Orders Count', String(salesData.orderCount)],
          ...(salesData.byWeight?.map((b) => [`Sold (${b.weight})`, String(b.quantity)]) || []),
        ],
        theme: 'striped',
        headStyles: { fillColor: [45, 90, 39] },
      });
    }

    doc.save(`product-${product.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8B7355]">
        Loading reports...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-[#6B4423]">Reports & Analytics</h1>
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423]"
          />
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <Download className="w-4 h-4 mr-1 inline" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="w-4 h-4 mr-1 inline" /> PDF
          </Button>
        </div>
      </div>

      {/* Summary cards for selected month */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#FAFAF8] rounded-2xl p-5 border border-[#8B7355]/10">
          <p className="text-sm text-[#8B7355] mb-1">Revenue ({month})</p>
          <p className="text-2xl font-bold text-[#2D5A27]">
            {formatPrice(selectedMonthOrders.reduce((s, o) => s + (o.total || 0), 0))}
          </p>
        </div>
        <div className="bg-[#FAFAF8] rounded-2xl p-5 border border-[#8B7355]/10">
          <p className="text-sm text-[#8B7355] mb-1">Orders ({month})</p>
          <p className="text-2xl font-bold text-[#2D5A27]">{selectedMonthOrders.length}</p>
        </div>
        <div className="bg-[#FAFAF8] rounded-2xl p-5 border border-[#8B7355]/10">
          <p className="text-sm text-[#8B7355] mb-1">Total Revenue (All time)</p>
          <p className="text-2xl font-bold text-[#2D5A27]">
            {formatPrice(orders.reduce((s, o) => s + (o.total || 0), 0))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
          <h2 className="font-semibold text-[#6B4423] mb-4">
            Monthly Sales
            {monthlyData.length === 0 && <span className="text-xs text-[#8B7355] font-normal ml-2">(No orders yet)</span>}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData.length > 0 ? monthlyData : [{ month: '-', sales: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8B735520" />
                <XAxis dataKey="month" stroke="#8B7355" />
                <YAxis stroke="#8B7355" />
                <Tooltip formatter={(v) => formatPrice(v)} />
                <Line type="monotone" dataKey="sales" stroke="#2D5A27" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
          <h2 className="font-semibold text-[#6B4423] mb-4">Top Products (by Reviews)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8B735520" />
                <XAxis dataKey="name" stroke="#8B7355" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8B7355" />
                <Tooltip />
                <Bar dataKey="sales" fill="#2D5A27" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-Product Report Table */}
      <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
        <h2 className="font-semibold text-[#6B4423] mb-4">Product-wise Report</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#8B7355]/20">
                <th className="text-left p-3 font-medium text-[#6B4423]">Product</th>
                <th className="text-left p-3 font-medium text-[#6B4423]">Price</th>
                <th className="text-left p-3 font-medium text-[#6B4423]">Stock</th>
                <th className="text-left p-3 font-medium text-[#6B4423]">Rating</th>
                <th className="text-left p-3 font-medium text-[#6B4423]">Reviews</th>
                <th className="text-left p-3 font-medium text-[#6B4423]">Est. Revenue</th>
                <th className="text-left p-3 font-medium text-[#6B4423]">Download</th>
              </tr>
            </thead>
            <tbody>
              {productReportData.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-[#8B7355]">No products found</td></tr>
              ) : productReportData.map((product) => (
                <tr key={product.id} className="border-b border-[#8B7355]/10 last:border-b-0 hover:bg-[#F5F0E8] transition-colors">
                  <td className="p-3 font-medium text-[#2D5A27]">{product.name}</td>
                  <td className="p-3 text-[#6B4423]">{formatPrice(product.price)}</td>
                  <td className="p-3 text-[#6B4423]">
                    <span className={product.stock < 40 ? 'text-orange-500 font-semibold' : ''}>{product.stock}</span>
                  </td>
                  <td className="p-3 text-[#6B4423]">{product.rating ? `⭐ ${product.rating}` : '—'}</td>
                  <td className="p-3 text-[#6B4423]">{product.reviews}</td>
                  <td className="p-3 text-[#2D5A27] font-medium">{formatPrice(product.estimatedRevenue)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => downloadProductExcel(product)}
                        title="Download Excel"
                        className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> XLS
                      </button>
                      <button
                        onClick={() => downloadProductPDF(product)}
                        title="Download PDF"
                        className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;