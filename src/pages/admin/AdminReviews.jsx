import { useCallback, useEffect, useState } from 'react';
import { Check, X, Trash2, Star, Clock, ChevronDown } from 'lucide-react';
import Button from '../../components/common/Button';

const API_BASE = import.meta.env.VITE_API_BASE || '';

function getToken() {
  return localStorage.getItem('grandmascare_token') || '';
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const data = res.headers.get('content-type')?.includes('application/json')
    ? await res.json() : await res.text();
  if (!res.ok) throw new Error(typeof data === 'object' ? data.error : `Error ${res.status}`);
  return data;
}

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];

const STATUS_STYLE = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-[#E8F0E8] text-[#2D5A27]',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('pending');
  const [rejectId, setRejectId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await request(
        `/api/reviews/admin/all?status=${tab}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    try {
      await request(`/api/reviews/admin/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      load();
    } catch (e) { alert(e.message); }
  };

  const reject = async (id) => {
    try {
      await request(`/api/reviews/admin/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ adminNote: rejectNote }),
      });
      setRejectId(null); setRejectNote('');
      load();
    } catch (e) { alert(e.message); }
  };

  const del = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await request(`/api/reviews/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      load();
    } catch (e) { alert(e.message); }
  };

  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#6B4423]">Reviews</h1>
          <p className="text-sm text-[#8B7355] mt-1">
            Customer reviews — approve or reject before going live
          </p>
        </div>
        {tab === 'pending' && pendingCount > 0 && (
          <span className="bg-amber-100 text-amber-700 text-sm font-bold px-3 py-1.5 rounded-full">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#8B7355]/20 pb-0">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg border-b-2 transition-colors ${
              tab === t
                ? 'border-[#2D5A27] text-[#2D5A27]'
                : 'border-transparent text-[#8B7355] hover:text-[#6B4423]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-[#8B7355] py-12">Loading…</p>
        ) : error ? (
          <p className="text-center text-red-600 py-12">{error}</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-10 h-10 text-[#8B7355]/20 mx-auto mb-3" />
            <p className="text-[#8B7355]">No {tab === 'all' ? '' : tab} reviews</p>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="bg-[#FAFAF8] border border-[#8B7355]/10 rounded-2xl overflow-hidden"
            >
              {/* Main row */}
              <div className="p-4 flex gap-4 items-start">
                {/* Product image */}
                <div className="w-12 h-12 rounded-xl bg-[#E8F0E8] flex-shrink-0 overflow-hidden">
                  {r.productImage ? (
                    <img src={r.productImage} alt={r.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#2D5A27] text-xl font-bold">
                      {r.productName?.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-[#6B4423] text-sm">{r.productName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarDisplay rating={r.rating} />
                        <span className="text-xs text-[#8B7355]">by {r.userName}</span>
                        <span className="text-xs text-[#8B7355]">
                          · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLE[r.status]}`}>
                      {r.status === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                      {r.status}
                    </span>
                  </div>

                  {/* Comment preview */}
                  <p
                    className={`text-sm text-[#8B7355] mt-2 ${expandedId === r.id ? '' : 'line-clamp-2'}`}
                  >
                    "{r.comment}"
                  </p>
                  {r.comment.length > 120 && (
                    <button
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="text-xs text-[#2D5A27] mt-1 flex items-center gap-1"
                    >
                      {expandedId === r.id ? 'Show less' : 'Read more'}
                      <ChevronDown className={`w-3 h-3 transition-transform ${expandedId === r.id ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  {r.adminNote && (
                    <p className="text-xs text-red-600 mt-1 italic">Note: {r.adminNote}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => approve(r.id)}
                      title="Approve"
                      className="p-2 rounded-xl hover:bg-[#E8F0E8] text-[#2D5A27] transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      onClick={() => { setRejectId(r.id); setRejectNote(''); }}
                      title="Reject"
                      className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => del(r.id)}
                    title="Delete"
                    className="p-2 rounded-xl hover:bg-red-50 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Reject reason input */}
              {rejectId === r.id && (
                <div className="px-4 pb-4 border-t border-[#8B7355]/10 pt-3 bg-red-50/40">
                  <p className="text-xs font-medium text-red-700 mb-2">Rejection reason (optional)</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 rounded-xl border border-red-200 bg-white text-sm text-[#6B4423] focus:outline-none focus:border-red-400"
                      placeholder="e.g. Inappropriate language..."
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      autoFocus
                    />
                    <Button variant="ghost" size="sm" onClick={() => setRejectId(null)}>Cancel</Button>
                    <button
                      onClick={() => reject(r.id)}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}