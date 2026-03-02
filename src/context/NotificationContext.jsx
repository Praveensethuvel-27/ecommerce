import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'admin_notifications';
const MAX_NOTIFICATIONS = 100;
const TOAST_DURATION = 6000;
const LOW_STOCK_THRESHOLD = 10;

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  } catch {}
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => loadFromStorage());
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);
  const toastTimers = useRef({});

  useEffect(() => {
    saveToStorage(notifications);
  }, [notifications]);

  const addNotification = useCallback((data, showToast = true) => {
    const notif = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: data.type,
      message: data.message,
      timestamp: data.timestamp || new Date().toISOString(),
      read: false,
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.name && { name: data.name }),
      ...(data.orderId && { orderId: data.orderId }),
      ...(data.customer && { customer: data.customer }),
      ...(data.customerEmail && { customer: data.customerEmail }),
      ...(data.total && { total: data.total }),
      ...(data.reason && { reason: data.reason }),
    };

    setNotifications((prev) => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));

    if (showToast) {
      const toastId = notif.id;
      setToasts((prev) => [...prev, { ...notif, id: toastId }]);
      toastTimers.current[toastId] = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
        delete toastTimers.current[toastId];
      }, TOAST_DURATION);
    }
  }, []);

  // On page load - check existing low stock products from API
  useEffect(() => {
    async function checkLowStockOnLoad() {
      try {
        const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE}/products`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const products = await res.json();

        // Get already notified product ids to avoid duplicate silent notifications
        const existing = loadFromStorage();
        const existingLowStockIds = new Set(
          existing
            .filter((n) => n.type === 'low_stock' && n.name)
            .map((n) => n.name)
        );

        const lowStockProducts = products.filter(
          (p) => p.stock < LOW_STOCK_THRESHOLD && !existingLowStockIds.has(p.name)
        );

        // Add silent notifications (no toast) for existing low stock
        for (const p of lowStockProducts) {
          addNotification(
            {
              type: 'low_stock',
              name: p.name,
              stock: p.stock,
              message: `⚠️ Low Stock: "${p.name}" has only ${p.stock} units left!`,
              timestamp: new Date().toISOString(),
            },
            false // no toast for existing low stock on load
          );
        }
      } catch (e) {
        console.error('[Notifications] Low stock check failed:', e);
      }
    }

    checkLowStockOnLoad();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket connection for real-time notifications
  useEffect(() => {
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const SOCKET_URL = rawUrl.replace(/\/api\/?$/, '');

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Notifications] Socket connected ✅');
    });

    socket.on('connect_error', (err) => {
      console.warn('[Notifications] Socket error:', err.message);
    });

    socket.on('admin:new_order', (data) => {
      addNotification({ ...data, type: 'new_order' }, true);
    });

    socket.on('admin:low_stock', (data) => {
      addNotification({ ...data, type: 'low_stock' }, true);
    });

    socket.on('admin:order_rejected', (data) => {
      addNotification({ ...data, type: 'order_rejected' }, true);
    });

    return () => {
      socket.disconnect();
      Object.values(toastTimers.current).forEach(clearTimeout);
    };
  }, [addNotification]);

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (toastTimers.current[id]) {
      clearTimeout(toastTimers.current[id]);
      delete toastTimers.current[id];
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        markRead,
        markAllRead,
        deleteNotification,
        clearAll,
        dismissToast,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}