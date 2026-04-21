import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Tag, Clock, Globe, Smartphone } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import {
  adminGetOffers,
  adminCreateOffer,
  adminUpdateOffer,
  adminToggleOffer,
  adminDeleteOffer,
} from '../../utils/api';

// ---------- helpers ----------
function getDaysRemaining(endDate) {
  if (!endDate) return null;
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return 0;
  return Math.floor(diff / 86400000);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function toInputDate(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

// ---------- Live Preview ----------
function OfferPreview({ form }) {
  const disc = form.discountPercent || '30';
  const title = form.title || 'Summer Sale!';
  const product = form.productName || 'Product Name';
  const desc = form.description || 'Limited time offer on selected products';
  const days = getDaysRemaining(form.endDate);
  const dStr = days === null ? '05' : String(days).padStart(2, '0');

  return (
    <div className="space-y-4">
      {/* Website banner */}
      <div>
        <p className="text-xs text-[#8B7355] mb-2 font-medium uppercase tracking-wide">Website banner</p>
        <div className="relative rounded-2xl overflow-hidden bg-[#2D5A27] text-white p-5 flex items-center justify-between">
          <div className="z-10">
            <p className="text-xs text-white/70 mb-1">Limited Offer</p>
            <h3 className="text-xl font-bold leading-tight mb-1">{title}</h3>
            <p className="text-sm text-white/80 mb-3">{product}</p>
            <div className="flex gap-2 items-center">
              <div className="bg-black/30 rounded-lg px-3 py-1.5 text-center min-w-[44px]">
                <span className="block text-lg font-bold leading-none">{dStr}</span>
                <span className="text-[9px] text-white/60">days</span>
              </div>
              <span className="text-white/40 text-lg">:</span>
              <div className="bg-black/30 rounded-lg px-3 py-1.5 text-center min-w-[44px]">
                <span className="block text-lg font-bold leading-none">12</span>
                <span className="text-[9px] text-white/60">hrs</span>
              </div>
              <span className="text-white/40 text-lg">:</span>
              <div className="bg-black/30 rounded-lg px-3 py-1.5 text-center min-w-[44px]">
                <span className="block text-lg font-bold leading-none">30</span>
                <span className="text-[9px] text-white/60">min</span>
              </div>
            </div>
          </div>
          <div className="text-right z-10">
            <span className="text-6xl font-black text-white/20 absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none">
              {disc}%
            </span>
            <span className="relative inline-block bg-white/20 rounded-xl px-4 py-2 text-sm font-bold">
              {disc}% OFF
            </span>
          </div>
        </div>
      </div>

      {/* Mobile app card */}
      <div>
        <p className="text-xs text-[#8B7355] mb-2 font-medium uppercase tracking-wide">Mobile app card</p>
        <div className="max-w-[220px] relative rounded-2xl overflow-hidden bg-[#6B4423] text-white p-4">
          <span className="inline-block bg-white/20 rounded-full px-3 py-0.5 text-xs font-semibold mb-2">
            {disc}% OFF
          </span>
          <h4 className="text-base font-bold mb-1">{title}</h4>
          <p className="text-xs text-white/75 mb-3 line-clamp-2">{desc}</p>
          <div className="flex gap-2">
            <div className="bg-black/25 rounded-lg px-2 py-1 text-center">
              <span className="block text-sm font-bold leading-none">{dStr}</span>
              <span className="text-[8px] text-white/60">days</span>
            </div>
            <div className="bg-black/25 rounded-lg px-2 py-1 text-center">
              <span className="block text-sm font-bold leading-none">12</span>
              <span className="text-[8px] text-white/60">hrs</span>
            </div>
            <div className="bg-black/25 rounded-lg px-2 py-1 text-center">
              <span className="block text-sm font-bold leading-none">30</span>
              <span className="text-[8px] text-white/60">min</span>
            </div>
          </div>
          <div className="absolute right-3 bottom-3 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
            🛒
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Component ----------
const EMPTY_FORM = {
  title: '',
  productName: '',
  discountPercent: '',
  description: '',
  startDate: '',
  endDate: '',
  showOn: ['website', 'app'],
  active: true,
};

function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [previewOffer, setPreviewOffer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminGetOffers();
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const resetForm = (offer = null) => {
    if (offer) {
      setForm({
        title: offer.title || '',
        productName: offer.productName || '',
        discountPercent: offer.discountPercent || '',
        description: offer.description || '',
        startDate: toInputDate(offer.startDate),
        endDate: toInputDate(offer.endDate),
        showOn: offer.showOn || ['website', 'app'],
        active: offer.active !== false,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  };

  const handleAdd = () => {
    setEditingOffer(null);
    resetForm(null);
    setModalOpen(true);
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    resetForm(offer);
    setModalOpen(true);
  };

  const handlePreview = (offer) => {
    setPreviewOffer(offer);
    setPreviewOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this offer?')) return;
    try {
      await adminDeleteOffer(id);
      await loadOffers();
    } catch (err) {
      alert(err?.message || 'Delete failed');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await adminToggleOffer(id);
      await loadOffers();
    } catch (err) {
      alert(err?.message || 'Toggle failed');
    }
  };

  const toggleShowOn = (platform) => {
    setForm((f) => {
      const current = f.showOn || [];
      const updated = current.includes(platform)
        ? current.filter((p) => p !== platform)
        : [...current, platform];
      return { ...f, showOn: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { alert('Offer title enter pannunga!'); return; }
    if (!form.discountPercent) { alert('Discount % enter pannunga!'); return; }
    if (!form.endDate) { alert('End date select pannunga!'); return; }
    if ((form.showOn || []).length === 0) { alert('Least one platform select pannunga!'); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        productName: form.productName.trim(),
        discountPercent: Number(form.discountPercent),
        description: form.description.trim(),
        startDate: form.startDate || null,
        endDate: form.endDate,
        showOn: form.showOn,
        active: form.active,
      };

      if (editingOffer) {
        await adminUpdateOffer(editingOffer.id, payload);
      } else {
        await adminCreateOffer(payload);
      }
      setModalOpen(false);
      setEditingOffer(null);
      await loadOffers();
    } catch (err) {
      alert(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const getOfferStatus = (offer) => {
    if (!offer.active) return { label: 'Inactive', className: 'bg-gray-100 text-gray-600' };
    const days = getDaysRemaining(offer.endDate);
    if (days === null) return { label: 'Active', className: 'bg-[#E8F0E8] text-[#2D5A27]' };
    if (days === 0) return { label: 'Expired', className: 'bg-red-100 text-red-700' };
    if (days <= 3) return { label: `${days}d left`, className: 'bg-amber-100 text-amber-700' };
    return { label: 'Active', className: 'bg-[#E8F0E8] text-[#2D5A27]' };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#6B4423]">Offers</h1>
          <p className="text-sm text-[#8B7355] mt-1">
            Create offers — appear on website banner &amp; mobile app
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2 inline" />
          New Offer
        </Button>
      </div>

      {/* Table */}
      <div className="bg-[#FAFAF8] rounded-2xl overflow-hidden border border-[#8B7355]/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#E8F0E8]/50 border-b border-[#8B7355]/20">
                <th className="text-left p-4 font-medium text-[#6B4423]">Offer Title</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Product</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Discount</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Duration</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Show On</th>
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
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Tag className="w-10 h-10 text-[#8B7355]/30 mx-auto mb-3" />
                    <p className="text-[#8B7355]">No offers yet. Create your first offer!</p>
                  </td>
                </tr>
              ) : (
                offers.map((offer) => {
                  const status = getOfferStatus(offer);
                  return (
                    <tr
                      key={offer.id}
                      className="border-b border-[#8B7355]/10 last:border-b-0 hover:bg-[#F5F0E8]/30 transition-colors"
                    >
                      <td className="p-4 font-medium text-[#6B4423]">{offer.title}</td>
                      <td className="p-4 text-[#8B7355] text-sm">{offer.productName || '—'}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 bg-[#E8F0E8] text-[#2D5A27] px-2.5 py-1 rounded-full text-sm font-bold">
                          <Tag className="w-3 h-3" />
                          {offer.discountPercent}% OFF
                        </span>
                      </td>
                      <td className="p-4 text-sm text-[#8B7355]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(offer.startDate)} – {formatDate(offer.endDate)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1.5">
                          {(offer.showOn || []).includes('website') && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                              <Globe className="w-3 h-3" />
                              Web
                            </span>
                          )}
                          {(offer.showOn || []).includes('app') && (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                              <Smartphone className="w-3 h-3" />
                              App
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handlePreview(offer)}
                            className="p-2 rounded-lg hover:bg-[#E8F0E8] text-[#6B4423]"
                            title="Preview"
                          >
                            <span className="text-sm">👁</span>
                          </button>
                          <button
                            onClick={() => handleEdit(offer)}
                            className="p-2 rounded-lg hover:bg-[#E8F0E8] text-[#6B4423]"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(offer.id)}
                            className={`p-2 rounded-lg text-xs font-medium ${
                              offer.active !== false
                                ? 'hover:bg-amber-50 text-amber-600'
                                : 'hover:bg-[#E8F0E8] text-[#2D5A27]'
                            }`}
                            title={offer.active !== false ? 'Deactivate' : 'Activate'}
                          >
                            {offer.active !== false ? '⏸' : '▶'}
                          </button>
                          <button
                            onClick={() => handleDelete(offer.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOffer ? 'Edit Offer' : 'Create New Offer'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Offer Title"
            required
            placeholder="e.g. Summer Sale — Big Discount!"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />

          <Input
            label="Product Name"
            placeholder="e.g. Kasturi Manjal 100g"
            value={form.productName}
            onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
          />

          <Input
            label="Discount Percentage (%)"
            type="number"
            required
            min="1"
            max="99"
            placeholder="e.g. 30"
            value={form.discountPercent}
            onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-[#6B4423] mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423] resize-none"
              rows={3}
              placeholder="Short banner description..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#6B4423] mb-1">Start Date</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423]"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B4423] mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423]"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#6B4423] mb-2">Show On</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => toggleShowOn('website')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  (form.showOn || []).includes('website')
                    ? 'bg-[#E8F0E8] border-[#2D5A27] text-[#2D5A27]'
                    : 'bg-white border-[#8B7355]/30 text-[#8B7355]'
                }`}
              >
                <Globe className="w-4 h-4" />
                Website
              </button>
              <button
                type="button"
                onClick={() => toggleShowOn('app')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  (form.showOn || []).includes('app')
                    ? 'bg-[#E8F0E8] border-[#2D5A27] text-[#2D5A27]'
                    : 'bg-white border-[#8B7355]/30 text-[#8B7355]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile App
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="border border-[#8B7355]/20 rounded-2xl p-4 bg-[#FAFAF8]">
            <p className="text-xs font-medium text-[#8B7355] uppercase tracking-wide mb-3">Live Preview</p>
            <OfferPreview form={form} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : editingOffer ? 'Save Changes' : 'Publish Offer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview — ${previewOffer?.title || ''}`}
      >
        {previewOffer && (
          <div className="space-y-2">
            <OfferPreview form={previewOffer} />
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[#FAFAF8] rounded-xl p-3">
                <p className="text-xs text-[#8B7355] mb-1">Duration</p>
                <p className="font-medium text-[#6B4423]">
                  {formatDate(previewOffer.startDate)} → {formatDate(previewOffer.endDate)}
                </p>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-3">
                <p className="text-xs text-[#8B7355] mb-1">Showing on</p>
                <p className="font-medium text-[#6B4423]">
                  {(previewOffer.showOn || []).join(' + ') || '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminOffers;