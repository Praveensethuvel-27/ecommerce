import { io } from 'socket.io-client';

let socket;

// Pass the stored JWT so the server can place this socket in `user:<id>` room
function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('grandmascare_token') || '';
    socket = io({
      auth: { token },          // server reads socket.handshake.auth.token
      reconnectionAttempts: 5,
    });
  }
  return socket;
}

// ─── Products ─────────────────────────────────────────────────────────────────
export function subscribeProductsChanged(handler) {
  const s = getSocket();
  s.on('products:changed', handler);
  return () => s.off('products:changed', handler);
}

// ─── Orders (admin) ───────────────────────────────────────────────────────────

// Fires when a customer places a NEW order — admin panel listens to this
export function subscribeOrdersNew(handler) {
  const s = getSocket();
  s.on('orders:new', handler);
  return () => s.off('orders:new', handler);
}

// Fires when admin updates an order's status — admin panel listens to this
export function subscribeOrdersUpdated(handler) {
  const s = getSocket();
  s.on('orders:updated', handler);
  return () => s.off('orders:updated', handler);
}

// ─── Order confirmed (customer) ───────────────────────────────────────────────
// Fires only for the specific customer whose order was just confirmed.
// Payload: { orderId, customerName, total, status }
export function subscribeOrderConfirmed(handler) {
  const s = getSocket();
  s.on('orders:confirmed', handler);
  return () => s.off('orders:confirmed', handler);
}