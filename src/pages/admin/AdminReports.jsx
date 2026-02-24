import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import Button from '../../components/common/Button';

const monthlyData = [
  { month: 'Jan', sales: 12000, orders: 45 },
  { month: 'Feb', sales: 15000, orders: 52 },
  { month: 'Mar', sales: 18000, orders: 61 },
  { month: 'Apr', sales: 14000, orders: 48 },
  { month: 'May', sales: 20000, orders: 70 },
  { month: 'Jun', sales: 22000, orders: 78 },
];

const topProducts = [
  { name: 'Nalangu Maavu', sales: 89 },
  { name: 'Idli Podi', sales: 76 },
  { name: 'Kasturi Manjal', sales: 65 },
  { name: 'Weight Loss Mix', sales: 54 },
  { name: 'Kambu Maavu', sales: 48 },
];

function AdminReports() {
  const [month, setMonth] = useState('2024-02');

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(monthlyData);
    const ws2 = XLSX.utils.json_to_sheet(topProducts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Sales');
    XLSX.utils.book_append_sheet(wb, ws2, 'Top Products');
    XLSX.writeFile(wb, 'monthly-report.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Monthly Sales Report - ' + month, 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [['Month', 'Sales', 'Orders']],
      body: monthlyData.map((r) => [r.month, 'Rs. ' + r.sales, r.orders]),
    });
    doc.text('Top Products', 14, doc.lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Product', 'Sales']],
      body: topProducts.map((r) => [r.name, r.sales]),
    });
    doc.save('monthly-report.pdf');
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-[#6B4423]">Reports & Analytics</h1>
        <div className="flex gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
          <h2 className="font-semibold text-[#6B4423] mb-4">Monthly Sales</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8B7355/20" />
                <XAxis dataKey="month" stroke="#8B7355" />
                <YAxis stroke="#8B7355" />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#2D5A27" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#FAFAF8] rounded-2xl p-6 border border-[#8B7355]/10">
          <h2 className="font-semibold text-[#6B4423] mb-4">Top Selling Products</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8B7355/20" />
                <XAxis dataKey="name" stroke="#8B7355" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8B7355" />
                <Tooltip />
                <Bar dataKey="sales" fill="#2D5A27" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;
