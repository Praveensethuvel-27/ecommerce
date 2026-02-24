import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { categories } from '../../data/categories';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { getProducts } from '../../utils/api';

function AdminCategories() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [categoryList, setCategoryList] = useState(categories);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let active = true;
    getProducts()
      .then((list) => {
        if (active) setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const getProductCount = (catId) => products.filter((p) => p.categoryId === catId).length;

  const handleDelete = (id) => {
    if (confirm('Delete this category?')) setCategoryList(categoryList.filter((c) => c.id !== id));
  };

  const handleAdd = () => {
    setEditingCat(null);
    setModalOpen(true);
  };

  const handleEdit = (cat) => {
    setEditingCat(cat);
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setModalOpen(false);
    setEditingCat(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#6B4423]">Categories</h1>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2 inline" />
          Add Category
        </Button>
      </div>

      <div className="bg-[#FAFAF8] rounded-2xl overflow-hidden border border-[#8B7355]/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#E8F0E8]/50 border-b border-[#8B7355]/20">
                <th className="text-left p-4 font-medium text-[#6B4423]">Name</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Slug</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Products</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categoryList.map((cat) => (
                <tr key={cat.id} className="border-b border-[#8B7355]/10 last:border-b-0">
                  <td className="p-4 font-medium text-[#6B4423]">{cat.name}</td>
                  <td className="p-4 text-[#8B7355]">{cat.slug}</td>
                  <td className="p-4">{getProductCount(cat.id)}</td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => handleEdit(cat)} className="p-2 rounded-lg hover:bg-[#E8F0E8] text-[#6B4423]">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCat ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name" required defaultValue={editingCat?.name} />
          <Input label="Slug" required defaultValue={editingCat?.slug} placeholder="category-slug" />
          <Input label="Description" defaultValue={editingCat?.description} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminCategories;
