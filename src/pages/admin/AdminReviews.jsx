import { useCallback, useEffect, useState } from 'react';
import { Check, X, Trash2, Star, Clock, ChevronDown, MessageSquare, RefreshCw, ShieldCheck, ShieldX, Hourglass } from 'lucide-react';
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
          className={`w-3.5 h-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];

const STATUS_CONFIG = {
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400',   bar: 'bg-amber-400',   label: 'Pending'  },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400', bar: 'bg-emerald-400', label: 'Approved' },
  rejected: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-400',     bar: 'bg-red-400',     label: 'Rejected' },
};

const TAB_CONFIG = {
  all:      { activeClass: 'bg-[#6B4423] text-white shadow-sm',       inactiveClass: 'text-[#8B7355] hover:bg-[#F5F0E8]'  },
  pending:  { activeClass: 'bg-amber-500 text-white shadow-sm',        inactiveClass: 'text-[#8B7355] hover:bg-amber-50'   },
  approved: { activeClass: 'bg-emerald-600 text-white shadow-sm',      inactiveClass: 'text-[#8B7355] hover:bg-emerald-50' },
  rejected: { activeClass: 'bg-red-500 text-white shadow-sm',          inactiveClass: 'text-[#8B7355] hover:bg-red-50'     },
};

function StatCard({ icon: Icon, label, value, colorClass, bgClass }) {
  return (
    <div className={`${bgClass} rounded-2xl p-4 border border-white/60 flex items-center gap-3`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass} bg-white/70`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-2xl font-black text-[#3a2a1a] leading-none">{value}</p>
        <p className="text-xs text-[#8B7355] mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [tab, setTab]                   = useState('pending');
  const [rejectId, setRejectId]         = useState(null);
  const [rejectNote, setRejectNote]     = useState('');
  const [expandedId, setExpandedId]     = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const pending  = reviews.filter(r => r.status === 'pending').length;
  const approved = reviews.filter(r => r.status === 'approved').length;
  const rejected = reviews.filter(r => r.status === 'rejected').length;

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
    setActionLoading(id + '_approve');
    try {
      await request(`/api/reviews/admin/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      load();
    } catch (e) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  const reject = async (id) => {
    setActionLoading(id + '_reject');
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
    finally { setActionLoading(null); }
  };

  const del = async (id) => {
    if (!confirm('Delete this review permanently?')) return;
    setActionLoading(id + '_delete');
    try {
      await request(`/api/reviews/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      load();
    } catch (e) { alert(e.message); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#2D5A27]/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#2D5A27]" />
            </div>
            <h1 className="text-2xl font-black text-[#6B4423] tracking-tight">Customer Reviews</h1>
          </div>
          <p className="text-sm text-[#8B7355] ml-10">Approve or reject before going live on product pages</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#8B7355] hover:text-[#2D5A27] bg-white border border-[#8B7355]/20 px-3 py-2 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Stats (tab = all) ──────────────────────────────── */}
      {tab === 'all' && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Hourglass}   label="Pending"  value={pending}  colorClass="text-amber-500"   bgClass="bg-amber-50/80"   />
          <StatCard icon={ShieldCheck} label="Approved" value={approved} colorClass="text-emerald-600" bgClass="bg-emerald-50/80" />
          <StatCard icon={ShieldX}     label="Rejected" value={rejected} colorClass="text-red-500"     bgClass="bg-red-50/80"     />
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="flex gap-1.5 bg-[#F5F0E8] p-1 rounded-2xl w-fit">
        {STATUS_TABS.map((t) => {
          const cfg = TAB_CONFIG[t];
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2 text-sm font-semibold capitalize rounded-xl transition-all duration-200 ${
                isActive ? cfg.activeClass : cfg.inactiveClass
              }`}
            >
              {t}
              {t === 'pending' && pending > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center
                  ${isActive ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'}`}>
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── List ───────────────────────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-[#2D5A27]/20 border-t-[#2D5A27] rounded-full animate-spin" />
            <p className="text-sm text-[#8B7355]">Loading reviews…</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-red-600 font-medium text-sm">{error}</p>
            <button onClick={load} className="mt-2 text-xs text-red-500 underline">Try again</button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-[#FAFAF8] rounded-2xl border border-[#8B7355]/10">
            <div className="w-14 h-14 rounded-2xl bg-[#F5F0E8] flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-[#8B7355]/30" />
            </div>
            <p className="font-semibold text-[#6B4423] text-sm">No {tab === 'all' ? '' : tab} reviews</p>
            <p className="text-xs text-[#8B7355] mt-1">Check back later</p>
          </div>
        ) : (
          reviews.map((r, i) => {
            const statusCfg  = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === r.id;
            const isRejectOpen = rejectId === r.id;

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-[#8B7355]/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* coloured top bar */}
                <div className={`h-0.5 w-full ${statusCfg.bar}`} />

                <div className="p-4 flex gap-4 items-start">
                  {/* Product thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-[#E8F0E8] flex-shrink-0 overflow-hidden ring-1 ring-[#2D5A27]/10">
                    {r.productImage ? (
                      <img src={r.productImage} alt={r.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#2D5A27] text-lg font-black">
                        {r.productName?.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                      <div>
                        <p className="font-bold text-[#6B4423] text-sm leading-tight">{r.productName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <StarDisplay rating={r.rating} />
                          <span className="text-xs text-[#8B7355] font-medium">by {r.userName}</span>
                          <span className="text-[10px] text-[#8B7355]/50">
                            {new Date(r.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Status pill */}
                      <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </div>
                    </div>

                    {/* Comment bubble */}
                    <div className={`text-sm text-[#5a4535] leading-relaxed bg-[#FAFAF8] rounded-xl px-3 py-2.5 border border-[#8B7355]/8 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                      "{r.comment}"
                    </div>

                    {r.comment.length > 120 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        className="text-xs text-[#2D5A27] mt-1.5 flex items-center gap-1 font-medium hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {r.adminNote && (
                      <div className="mt-2 flex items-start gap-1.5 bg-red-50 rounded-lg px-2.5 py-1.5 border border-red-100">
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-wide mt-px">Note:</span>
                        <p className="text-xs text-red-600 italic">{r.adminNote}</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {r.status !== 'approved' && (
                      <button
                        onClick={() => approve(r.id)}
                        disabled={actionLoading === r.id + '_approve'}
                        title="Approve"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors disabled:opacity-50 border border-emerald-100"
                      >
                        {actionLoading === r.id + '_approve'
                          ? <span className="w-3 h-3 border border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          : <Check className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button
                        onClick={() => { setRejectId(r.id); setRejectNote(''); }}
                        title="Reject"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors border border-red-100"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => del(r.id)}
                      disabled={actionLoading === r.id + '_delete'}
                      title="Delete"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 text-gray-400 text-xs font-semibold transition-colors border border-gray-100"
                    >
                      {actionLoading === r.id + '_delete'
                        ? <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                      Delete
                    </button>
                  </div>
                </div>

                {/* ── Reject reason drawer ──────────────────── */}
                {isRejectOpen && (
                  <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50/60 p-3.5">
                    <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1.5">
                      <X className="w-3 h-3" />
                      Rejection reason
                      <span className="font-normal opacity-60">(optional)</span>
                    </p>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 px-3 py-2 rounded-xl border border-red-200 bg-white text-sm text-[#6B4423] focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 transition"
                        placeholder="e.g. Inappropriate language, spam…"
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && reject(r.id)}
                      />
                      <button
                        onClick={() => setRejectId(null)}
                        className="px-3 py-2 text-xs font-semibold text-[#8B7355] bg-white border border-[#8B7355]/20 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => reject(r.id)}
                        disabled={actionLoading === r.id + '_reject'}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {actionLoading === r.id + '_reject'
                          ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                          : <ShieldX className="w-3.5 h-3.5" />}
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}