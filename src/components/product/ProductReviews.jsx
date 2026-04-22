// ============================================================
// ProductReviews.jsx
// Usage in Product.jsx — add near bottom before closing </div>:
//
//   import ProductReviews from '../../components/product/ProductReviews';
//   <ProductReviews productId={product.id} />
//
// API endpoints needed:
//   GET  /api/reviews?productId=&status=approved  → approved reviews array
//   POST /api/reviews                              → submit new review
// ============================================================

import { useEffect, useState } from 'react';
import { Star, CheckCircle, Loader2, ThumbsUp, ChevronDown, MessageSquare } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// ── Star Rating Input / Display ───────────────────────────────
function StarRating({ value = 0, onChange, size = 20 }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
          aria-label={`${n} stars`}
        >
          <Star
            size={size}
            className={`transition-colors duration-100 ${
              n <= active ? 'fill-amber-400 text-amber-400' : 'fill-none text-[#8B7355]/25'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Rating summary bar chart ──────────────────────────────────
function RatingSummary({ reviews }) {
  const total = reviews.length;
  const avg   = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;

  return (
    <div className="flex flex-col sm:flex-row gap-6 bg-[#F5F0E8] rounded-2xl p-5 mb-8 border border-[#8B7355]/10">
      <div className="flex flex-col items-center justify-center min-w-[88px]">
        <span className="text-5xl font-black text-[#6B4423] leading-none">{avg.toFixed(1)}</span>
        <StarRating value={Math.round(avg)} size={14} />
        <span className="text-xs text-[#8B7355] mt-1.5 font-medium">
          {total} review{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = reviews.filter((r) => r.rating === n).length;
          const pct   = total ? (count / total) * 100 : 0;
          return (
            <div key={n} className="flex items-center gap-2">
              <span className="text-xs text-[#8B7355] w-2 text-right font-semibold">{n}</span>
              <Star size={10} className="fill-amber-400 text-amber-400 flex-shrink-0" />
              <div className="flex-1 h-2 bg-[#8B7355]/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-[#8B7355]/60 w-4 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Single review card ────────────────────────────────────────
function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(review.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const text   = review.comment || review.body || '';
  const isLong = text.length > 160;

  return (
    <div className="bg-white rounded-2xl border border-[#8B7355]/10 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#2D5A27]/10 flex items-center justify-center text-[#2D5A27] font-black text-sm flex-shrink-0">
            {(review.userName || review.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-[#6B4423] text-sm leading-tight">
              {review.userName || review.name}
            </p>
            <p className="text-[10px] text-[#8B7355]/55">{date}</p>
          </div>
        </div>
        <StarRating value={review.rating} size={13} />
      </div>

      {review.title && (
        <p className="font-semibold text-[#6B4423] text-sm mb-1">{review.title}</p>
      )}

      <p className={`text-sm text-[#5a4535] leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-[#2D5A27] mt-1.5 font-medium hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      {review.verifiedPurchase && (
        <div className="flex items-center gap-1 text-[#2D5A27] text-xs font-semibold mt-3">
          <CheckCircle size={11} className="flex-shrink-0" />
          Verified Purchase
        </div>
      )}
    </div>
  );
}

// ── Review submission form ────────────────────────────────────
function ReviewForm({ productId, onSubmitted }) {
  const [rating,     setRating]     = useState(0);
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [title,      setTitle]      = useState('');
  const [comment,    setComment]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!rating)                    { setError('Please select a star rating.'); return; }
    if (comment.trim().length < 10) { setError('Review must be at least 10 characters.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, name, email, title, comment, rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Submission failed');
      onSubmitted();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F5F0E8] rounded-2xl p-6 border border-[#8B7355]/10">
      <div className="flex items-center gap-2 mb-1">
        <ThumbsUp className="w-4 h-4 text-[#2D5A27]" />
        <h3 className="font-black text-[#6B4423] text-base">Write a Review</h3>
      </div>
      <p className="text-xs text-[#8B7355] mb-5">
        Your review will be visible after our team approves it.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star picker */}
        <div>
          <label className="block text-xs font-bold text-[#6B4423] mb-2">
            Your Rating <span className="text-red-400">*</span>
          </label>
          <StarRating value={rating} onChange={setRating} size={28} />
        </div>

        {/* Name + Email */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#6B4423] mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/25 bg-white text-sm text-[#6B4423] placeholder-[#8B7355]/40 focus:outline-none focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]/20 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#6B4423] mb-1">
              Email{' '}
              <span className="text-[#8B7355]/40 font-normal">(private, not shown)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/25 bg-white text-sm text-[#6B4423] placeholder-[#8B7355]/40 focus:outline-none focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]/20 transition"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-[#6B4423] mb-1">Review Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarise your experience"
            className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/25 bg-white text-sm text-[#6B4423] placeholder-[#8B7355]/40 focus:outline-none focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]/20 transition"
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-xs font-bold text-[#6B4423] mb-1">
            Your Review <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think about this product? How did you use it?"
            className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/25 bg-white text-sm text-[#6B4423] placeholder-[#8B7355]/40 focus:outline-none focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]/20 transition resize-none"
          />
          <p className="text-[10px] text-[#8B7355]/50 mt-1 text-right">{comment.length} chars</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-[#2D5A27] hover:bg-[#3a7232] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {submitting
            ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
            : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────
export default function ProductReviews({ productId }) {
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [showForm,  setShowForm]  = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`${API_BASE}/api/reviews?productId=${productId}&status=approved`)
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : data?.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSubmitted = () => {
    setSubmitted(true);
    setShowForm(false);
  };

  return (
    <section className="mt-16 border-t border-[#8B7355]/20 pt-12">

      {/* Section header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2D5A27]/10 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-[#2D5A27]" />
          </div>
          <h2 className="text-xl font-black text-[#6B4423]">
            Customer Reviews
            {reviews.length > 0 && (
              <span className="ml-2 text-sm font-semibold text-[#8B7355] bg-[#F5F0E8] px-2 py-0.5 rounded-full">
                {reviews.length}
              </span>
            )}
          </h2>
        </div>

        {!submitted && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-bold text-[#2D5A27] border border-[#2D5A27]/30 hover:bg-[#2D5A27] hover:text-white px-4 py-2 rounded-xl transition-colors"
          >
            + Write a Review
          </button>
        )}
      </div>

      {/* Rating summary */}
      {!loading && reviews.length > 0 && <RatingSummary reviews={reviews} />}

      {/* Review cards */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 text-[#8B7355] animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 bg-[#FAFAF8] rounded-2xl border border-[#8B7355]/10 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F0E8] flex items-center justify-center mx-auto mb-3">
            <Star className="w-5 h-5 text-[#8B7355]/30" />
          </div>
          <p className="font-semibold text-[#6B4423] text-sm">No reviews yet</p>
          <p className="text-xs text-[#8B7355] mt-1">Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {/* Success banner */}
      {submitted && (
        <div className="flex items-start gap-3 bg-[#E8F0E8] rounded-2xl px-5 py-4 border border-[#2D5A27]/15 mb-6">
          <CheckCircle className="w-5 h-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#2D5A27] text-sm">Thank you for your review!</p>
            <p className="text-xs text-[#2D5A27]/70 mt-0.5">
              It will appear here once our team approves it — usually within 24 hours.
            </p>
          </div>
        </div>
      )}

      {/* Write review form */}
      {showForm && !submitted && (
        <ReviewForm productId={productId} onSubmitted={handleSubmitted} />
      )}
    </section>
  );
}