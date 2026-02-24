import { Outlet } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Package, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';
import { subscribeOrderConfirmed } from '../../utils/realtime';
import { formatPrice } from '../../utils/formatPrice';

// ─── Single notification card ─────────────────────────────────────────────────
function OrderConfirmedCard({ notification, onDismiss }) {
  const [visible, setVisible] = useState(false);

  // Slide in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss after 8s
  useEffect(() => {
    const t = setTimeout(() => handleDismiss(), 8000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 400);
  };

  return (
    <div
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.45s cubic-bezier(0.34,1.4,0.64,1), opacity 0.3s ease',
        background: 'linear-gradient(135deg,#1a3d18,#2B5A27)',
        borderRadius: '1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.12)',
        overflow: 'hidden',
        width: 340,
        maxWidth: 'calc(100vw - 2rem)',
      }}
    >
      {/* Progress bar — shrinks over 8s */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.15)' }}>
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg,#86EFAC,#22C55E)',
            animation: 'shrinkProgress 8s linear forwards',
          }}
        />
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Icon */}
          <div
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(134,239,172,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle style={{ width: 20, height: 20, color: '#86EFAC' }} />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>
              🎉 Your order is confirmed!
            </p>
            <p style={{ color: '#86EFAC', fontSize: 12, margin: '3px 0 0' }}>
              Order <span style={{ fontWeight: 700 }}>{notification.orderId}</span>
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: 8,
              width: 26, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <X style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.7)' }} />
          </button>
        </div>

        {/* Order detail pill */}
        <div
          style={{
            marginTop: 12,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '0.65rem',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Package style={{ width: 14, height: 14, color: '#FDE68A', flexShrink: 0 }} />
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, margin: 0, flex: 1 }}>
            Grand Ma&apos;s Care is preparing your package
          </p>
          <span style={{ color: '#FDE68A', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {formatPrice(notification.total)}
          </span>
        </div>

        {/* View orders link */}
        <Link
          to="/account/orders"
          onClick={handleDismiss}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 10,
            padding: '8px 0',
            borderRadius: '0.65rem',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 12,
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          View My Orders
          <ArrowRight style={{ width: 13, height: 13 }} />
        </Link>
      </div>

      <style>{`
        @keyframes shrinkProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ─── Notification stack — fixed top-right ────────────────────────────────────
function CustomerOrderNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    // Only subscribe when a customer is logged in (not admin)
    if (!user || user.role !== 'customer') return;

    const unsub = subscribeOrderConfirmed((data) => {
      setNotifications((prev) => [
        ...prev,
        { ...data, id: `${data.orderId}-${Date.now()}` },
      ]);
    });

    return unsub;
  }, [user]);

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 80, // below header
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none', // let clicks pass through the container
      }}
    >
      {notifications.map((n) => (
        <div key={n.id} style={{ pointerEvents: 'all' }}>
          <OrderConfirmedCard notification={n} onDismiss={() => dismiss(n.id)} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Customer order confirmed notification — shown globally on all pages */}
      <CustomerOrderNotifications />

      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;