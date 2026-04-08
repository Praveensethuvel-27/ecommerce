import { useEffect, useRef, useState } from 'react';
import { Bell, ShoppingCart, AlertTriangle, Trash2, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationIcon({ type }) {
  if (type === 'low_stock') return <AlertTriangle className="w-5 h-5 text-orange-500" />;
  if (type === 'new_order') return <ShoppingCart className="w-5 h-5 text-[#2D5A27]" />;
  if (type === 'order_rejected') return <span className="text-lg leading-none">🚫</span>;

  if (type === 'order_status') return <span className="text-lg leading-none">✅</span>;
  if (type === 'order_shipped') return <span className="text-lg leading-none">🚚</span>;
  return <Bell className="w-5 h-5 text-[#8B7355]" />;
}

function NotificationCard({ notif, onRead, onDelete }) {
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
        notif.read
          ? 'bg-[#FAFAF8] border-[#8B7355]/10 opacity-70'
          : 'bg-white border-[#8B7355]/20 shadow-sm'
      }`}
    >
      <div className={`p-2 rounded-xl flex-shrink-0 ${
        notif.type === 'low_stock' ? 'bg-orange-50' :
        notif.type === 'new_order' ? 'bg-[#E8F0E8]' :
        notif.type === 'order_rejected' ? 'bg-red-50' : 'bg-[#F5F0E8]'
      }`}>
        <NotificationIcon type={notif.type} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notif.read ? 'text-[#8B7355]' : 'text-[#3D2A1A] font-medium'}`}>
          {notif.message}
        </p>
        {notif.type === 'low_stock' && notif.stock !== undefined && (
          <div className="mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              notif.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {notif.stock === 0 ? 'Out of Stock' : `${notif.stock} units left`}
            </span>
          </div>
        )}
        {notif.type === 'new_order' && notif.total && (
          <p className="text-xs text-[#8B7355] mt-0.5">Customer: {notif.customer}</p>
        )}
        {notif.type === 'order_rejected' && notif.reason && (
          <div className="mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">
              Reason: {notif.reason}
            </span>
          </div>
        )}
        <p className="text-xs text-[#8B7355] mt-1">{timeAgo(notif.timestamp)}</p>
      </div>

      <div className="flex gap-1 flex-shrink-0">
        {!notif.read && (
          <button
            onClick={() => onRead(notif.id)}
            className="p-1.5 rounded-lg hover:bg-[#E8F0E8] text-[#2D5A27] transition-colors"
            title="Mark as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(notif.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Floating toast popup component - exported for use in AdminLayout
export function NotificationToast() {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-2xl shadow-lg border animate-slide-in ${
            toast.type === 'low_stock'
              ? 'bg-orange-50 border-orange-200'
              : toast.type === 'order_rejected'
              ? 'bg-red-50 border-red-200'
              : 'bg-[#E8F0E8] border-[#2D5A27]/20'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            <NotificationIcon type={toast.type} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              toast.type === 'low_stock' ? 'text-orange-800' :
              toast.type === 'order_rejected' ? 'text-red-800' : 'text-[#2D5A27]'
            }`}>
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// Main Notifications Page
function AdminNotifications() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification, clearAll } = useNotifications();
  const [filter, setFilter] = useState('all'); // all | unread | low_stock | new_order

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'low_stock') return n.type === 'low_stock';
    if (filter === 'new_order') return n.type === 'new_order';
    if (filter === 'order_rejected') return n.type === 'order_rejected';
    if (filter === 'order_status') return n.type === 'order_status';
    if (filter === 'order_shipped') return n.type === 'order_shipped';
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#6B4423]">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 text-sm rounded-xl border border-[#8B7355]/30 text-[#6B4423] hover:bg-[#F5F0E8] transition-colors flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2 text-sm rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
          { key: 'low_stock', label: '⚠️ Low Stock', count: notifications.filter(n => n.type === 'low_stock').length },
          { key: 'new_order', label: '🛒 Orders', count: notifications.filter(n => n.type === 'new_order').length },
          { key: 'order_status', label: '✅ Accepted', count: notifications.filter(n => n.type === 'order_status').length },
          { key: 'order_shipped', label: '🚚 Shipped', count: notifications.filter(n => n.type === 'order_shipped').length },
          { key: 'order_rejected', label: '🚫 Rejected', count: notifications.filter(n => n.type === 'order_rejected').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
              filter === tab.key
                ? 'bg-[#2D5A27] text-white'
                : 'bg-[#FAFAF8] text-[#6B4423] border border-[#8B7355]/20 hover:bg-[#F5F0E8]'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.key ? 'bg-white/20 text-white' : 'bg-[#8B7355]/10 text-[#8B7355]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#8B7355]">
          <Bell className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">No notifications</p>
          <p className="text-sm mt-1">
            {filter === 'all' ? "You're all caught up!" : `No ${filter.replace('_', ' ')} notifications`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((notif) => (
            <NotificationCard
              key={notif.id}
              notif={notif}
              onRead={markRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;