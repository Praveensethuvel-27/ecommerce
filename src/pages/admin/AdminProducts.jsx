import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { categories } from '../../data/categories';
import { formatPrice } from '../../utils/formatPrice';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { adminCreateProduct, adminDeleteProduct, adminUpdateProduct, getProducts, getProductSales } from '../../utils/api';
import { subscribeProductsChanged } from '../../utils/realtime';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function AdminProducts() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const initialCategoryId = useMemo(() => categories[0]?.id || '', []);
  const [form, setForm] = useState({
    name: '',
    categoryId: initialCategoryId,
    stock: '',
    description: '',
    featured: false,
    image: null,
    weightOptions: [{ weight: '', price: '' }],
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getProducts();
      setProductList(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const unsub = subscribeProductsChanged(() => {
      loadProducts();
    });
    return unsub;
  }, [loadProducts]);

  const getCategoryName = (catId) => categories.find((c) => c.id === catId)?.name || '-';

  const resetForm = (product = null) => {
    let wopts;
    if (Array.isArray(product?.weightOptions) && product.weightOptions.length > 0) {
      wopts = product.weightOptions.map((w) => ({ weight: w.weight || '', price: w.price ?? '' }));
    } else if (product?.price != null && product.price > 0) {
      wopts = [{ weight: 'Default', price: product.price }];
    } else {
      wopts = [{ weight: '', price: '' }];
    }
    setForm({
      name: product?.name || '',
      categoryId: product?.categoryId || initialCategoryId,
      stock: product?.stock ?? '',
      description: product?.description || '',
      featured: !!product?.featured,
      image: null,
      weightOptions: wopts,
    });
  };

  const handleAddWeightOption = () => {
    setForm((f) => ({ ...f, weightOptions: [...(f.weightOptions || []), { weight: '', price: '' }] }));
  };

  const handleWeightOptionChange = (index, field, value) => {
    setForm((f) => {
      const arr = [...(f.weightOptions || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...f, weightOptions: arr };
    });
  };

  const handleRemoveWeightOption = (index) => {
    setForm((f) => ({
      ...f,
      weightOptions: (f.weightOptions || []).filter((_, i) => i !== index),
    }));
  };

  const handleDownloadReport = async (product) => {
    let sales = null;
    try {
      sales = await getProductSales(product.id);
    } catch {
      // Use empty sales if API fails
    }

    const doc = new jsPDF();
    doc.text(`Product Report - ${product.name}`, 14, 15);

    const baseBody = [
      ['Name', product.name],
      ['Category', getCategoryName(product.categoryId)],
      ['Weight / Price', product.weightOptions?.length > 0
        ? product.weightOptions.map((w) => `${w.weight}: ${formatPrice(w.price)}`).join(', ')
        : formatPrice(product.price)],
      ['Stock', String(product.stock)],
      ['Featured', product.featured ? 'Yes' : 'No'],
      ['ID', product.id],
    ];

    autoTable(doc, {
      startY: 25,
      head: [['Field', 'Value']],
      body: baseBody,
    });

    let y = doc.lastAutoTable.finalY + 15;
    if (sales && (sales.totalQuantitySold > 0 || sales.totalRevenue > 0)) {
      doc.text('Sales Report', 14, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
          ['Total Quantity Sold', String(sales.totalQuantitySold)],
          ['Total Revenue', formatPrice(sales.totalRevenue)],
          ['Orders Containing Product', String(sales.orderCount)],
          ...(sales.byWeight?.length
            ? sales.byWeight.map((b) => [`Sold (${b.weight})`, String(b.quantity)])
            : []),
        ],
      });
    }

    doc.save(`${product.slug || product.id}-report.pdf`);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await adminDeleteProduct(id);
      await loadProducts();
    } catch (err) {
      alert(err?.message || 'Delete failed');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    resetForm(product);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    resetForm(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const validWeightOptions = (form.weightOptions || []).filter(
      (wo) => wo.weight && wo.weight.trim() && (wo.price !== '' && wo.price !== null && wo.price !== undefined)
    );
    if (validWeightOptions.length === 0) {
      alert('Please add at least one weight option (e.g., 250g with price)');
      return;
    }

    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('categoryId', form.categoryId);
    fd.append('stock', String(form.stock));
    fd.append('description', form.description);
    fd.append('featured', String(form.featured));
    fd.append('weightOptions', JSON.stringify(validWeightOptions));
    if (form.image) fd.append('image', form.image);

    try {
      if (editingProduct) {
        await adminUpdateProduct(editingProduct.id, fd);
      } else {
        await adminCreateProduct(fd);
      }
      setModalOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (err) {
      alert(err?.message || 'Save failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#6B4423]">Products</h1>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Add Product
        </Button>
      </div>

      <div className="bg-[#FAFAF8] rounded-2xl overflow-hidden border border-[#8B7355]/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#E8F0E8]/50 border-b border-[#8B7355]/20">
                <th className="text-left p-4 font-medium text-[#6B4423]">Image</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Name</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Category</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Weight / Price</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Stock</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Status</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[#8B7355]">Loading…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-red-600">{error}</td>
                </tr>
              ) : productList.map((product) => (
                <tr key={product.id} className="border-b border-[#8B7355]/10 last:border-b-0">
                  <td className="p-4">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-[#E8F0E8]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#E8F0E8] flex items-center justify-center text-[#8B7355] font-serif text-xl">
                        {product.name.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-[#6B4423]">{product.name}</td>
                  <td className="p-4 text-[#8B7355]">{getCategoryName(product.categoryId)}</td>
                  <td className="p-4 font-medium text-[#2D5A27] text-sm">
                    {product.weightOptions?.length > 0
                      ? product.weightOptions.map((w) => `${w.weight}: ${formatPrice(w.price)}`).join(', ')
                      : formatPrice(product.price)}
                  </td>
                  <td className="p-4 text-[#6B4423]">{product.stock}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock > 0 ? 'bg-[#E8F0E8] text-[#2D5A27]' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => handleEdit(product)} className="p-2 rounded-lg hover:bg-[#E8F0E8] text-[#6B4423]">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadReport(product)}
                      className="p-2 rounded-lg hover:bg-[#E8F0E8] text-[#6B4423]"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Product Name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-[#6B4423] mb-1">Category</label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423]"
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B4423] mb-1">Weight Options <span className="text-red-500">*</span></label>
            <p className="text-xs text-[#8B7355] mb-2">Add weight and price for each variant (e.g., 250g - ₹100, 500g - ₹180)</p>
            {(form.weightOptions || []).map((wo, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Weight (e.g., 250g)"
                  value={wo.weight}
                  onChange={(e) => handleWeightOptionChange(i, 'weight', e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423]"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={wo.price}
                  onChange={(e) => handleWeightOptionChange(i, 'price', e.target.value)}
                  className="w-28 px-4 py-2 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveWeightOption(i)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  disabled={(form.weightOptions || []).length <= 1}
                  title="At least one weight option required"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={handleAddWeightOption} className="mt-1">
              + Add Weight Option
            </Button>
          </div>
          <Input
            label="Stock"
            type="number"
            required
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-[#6B4423] mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423]"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="featured"
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            />
            <label htmlFor="featured" className="text-sm font-medium text-[#6B4423]">Featured</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B4423] mb-1">Product Image</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.files?.[0] || null }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminProducts;
