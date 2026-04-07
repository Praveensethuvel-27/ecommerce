import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Download } from "lucide-react";

import Button from "../../components/common/Button";
import { formatPrice } from "../../utils/formatPrice";
import { getProducts, getOrders, getProductSales } from "../../utils/api";

function buildMonthlyData(orders) {
  const map = {};
  const monthOrder = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  for (const o of orders) {
    const d = new Date(o.date || o.createdAt);
    const key = d.toLocaleString("en-US", { month: "short" });

    if (!map[key]) map[key] = { month: key, sales: 0, orders: 0 };

    map[key].sales += o.total || 0;
    map[key].orders += 1;
  }

  return Object.values(map).sort(
    (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
  );
}

function AdminReports() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const [prods, ords] = await Promise.all([
          getProducts(),
          getOrders()
        ]);

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

  const selectedMonthOrders = orders.filter((o) => {
    const d = new Date(o.date || o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    return key === month;
  });

  const productReportData = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    rating: p.rating || 0,
    reviews: p.reviewCount || 0,
    featured: p.featured ? "Yes" : "No",
    estimatedRevenue: (p.price || 0) * (p.reviewCount || 0)
  }));

  const topProducts = [...products]
    .sort((a,b)=>(b.reviewCount||0)-(a.reviewCount||0))
    .slice(0,5)
    .map((p)=>({
      name:p.name,
      sales:p.reviewCount||0
    }));

  /* ------------------ EXCEL EXPORT ------------------ */

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    const sheet1 = workbook.addWorksheet("Monthly Sales");

    sheet1.columns = [
      { header:"Month", key:"month", width:15 },
      { header:"Sales", key:"sales", width:15 },
      { header:"Orders", key:"orders", width:10 }
    ];

    monthlyData.forEach((row)=>{
      sheet1.addRow(row);
    });

    const sheet2 = workbook.addWorksheet("Product Report");

    sheet2.columns = [
      { header:"Product", key:"name", width:25 },
      { header:"Price", key:"price", width:15 },
      { header:"Stock", key:"stock", width:10 },
      { header:"Rating", key:"rating", width:10 },
      { header:"Reviews", key:"reviews", width:10 },
      { header:"Revenue", key:"estimatedRevenue", width:15 }
    ];

    productReportData.forEach((row)=>{
      sheet2.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer]);

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report-${month}.xlsx`;
    link.click();
  };

  /* ------------------ PDF EXPORT ------------------ */

  const exportPDF = () => {

    const doc = new jsPDF();

    doc.text("Monthly Sales Report",14,15);

    autoTable(doc,{
      startY:25,
      head:[["Month","Sales","Orders"]],
      body:monthlyData.map((r)=>[
        r.month,
        formatPrice(r.sales),
        r.orders
      ])
    });

    doc.text("Product Report",14,doc.lastAutoTable.finalY+15);

    autoTable(doc,{
      startY:doc.lastAutoTable.finalY+20,
      head:[["Product","Price","Stock","Rating","Reviews"]],
      body:productReportData.map((r)=>[
        r.name,
        formatPrice(r.price),
        r.stock,
        r.rating,
        r.reviews
      ])
    });

    doc.save(`report-${month}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading reports...
      </div>
    );
  }

  return (
    <div>

      <div className="flex justify-between mb-8">

        <h1 className="text-2xl font-bold">
          Reports & Analytics
        </h1>

        <div className="flex gap-2">

          <input
            type="month"
            value={month}
            onChange={(e)=>setMonth(e.target.value)}
          />

          <Button onClick={exportExcel}>
            <Download className="w-4 h-4 mr-1 inline"/>
            Excel
          </Button>

          <Button onClick={exportPDF}>
            <Download className="w-4 h-4 mr-1 inline"/>
            PDF
          </Button>

        </div>

      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">

        <div className="p-4 bg-gray-100 rounded-xl">
          <p>Revenue</p>
          <h2>
            {formatPrice(
              selectedMonthOrders.reduce(
                (s,o)=>s+(o.total||0),0
              )
            )}
          </h2>
        </div>

        <div className="p-4 bg-gray-100 rounded-xl">
          <p>Orders</p>
          <h2>{selectedMonthOrders.length}</h2>
        </div>

        <div className="p-4 bg-gray-100 rounded-xl">
          <p>Total Revenue</p>
          <h2>
            {formatPrice(
              orders.reduce(
                (s,o)=>s+(o.total||0),0
              )
            )}
          </h2>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-8">

        <div className="h-64">

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>

              <CartesianGrid strokeDasharray="3 3"/>

              <XAxis dataKey="month"/>

              <YAxis/>

              <Tooltip/>

              <Line
                type="monotone"
                dataKey="sales"
                stroke="#2D5A27"
              />

            </LineChart>
          </ResponsiveContainer>

        </div>

        <div className="h-64">

          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts}>

              <CartesianGrid strokeDasharray="3 3"/>

              <XAxis dataKey="name"/>

              <YAxis/>

              <Tooltip/>

              <Bar dataKey="sales" fill="#2D5A27"/>

            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}

export default AdminReports;