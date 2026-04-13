const API_BASE = import.meta.env.VITE_API_BASE || '';

function getToken() {
  /* c8 ignore next */
  return localStorage.getItem('grandmascare_token') || '';
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  /* c8 ignore next */
  if (!res.ok) {
    const msg = typeof data === 'object' && data && data.error ? data.error : `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function getProducts() {
  return request('/api/products');
}

export async function getProductBySlug(slug) {
  return request(`/api/products/${encodeURIComponent(slug)}`);
}

export async function login(email, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export async function register(name, email, phone, password) {
  void name;
  void phone;
  const data = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export async function adminCreateProduct(formData) {
  return request('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
}

export async function adminUpdateProduct(id, formData) {
  return request(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
}

export async function adminDeleteProduct(id) {
  return request(`/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

export async function createOrder(orderData) {
  return request('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(orderData),
  });
}

export async function getMyOrders() {
  return request('/api/orders/my', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

export async function getProductSales(productId) {
  return request(`/api/orders/product/${encodeURIComponent(productId)}/sales`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

// Admin: fetch all orders — supports ?status=shipped&page=1&limit=20
// Returns { orders: [...], pagination: { total, page, limit, pages } }
export async function getOrders({ status = 'all', page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status && status !== 'all') params.set('status', status);
  return request(`/api/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

export async function getOrderSummary() {
  return request('/api/orders/summary', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

// Admin: update a single order's status
export async function updateOrderStatus(orderId, status) {
  return request(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ status }),
  });
}

// Admin: reject an order with a reason (also restores stock)
export async function rejectOrder(orderId, reason) {
  return request(`/api/orders/${encodeURIComponent(orderId)}/reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ reason }),
  });
}

export async function getCustomers() {
  return request('/api/customers', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

export async function getBlockedCustomers() {
  return request('/api/customers/blocked', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

export async function blockCustomer(id, blockType, reason) {
  return request(`/api/customers/${encodeURIComponent(id)}/block`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ blockType, reason }),
  });
}

export async function unblockCustomer(id) {
  return request(`/api/customers/${encodeURIComponent(id)}/unblock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}
// ─── Driver API ───────────────────────────────────────────────────────────────

// Admin: list all drivers
export async function listDrivers() {
  return request('/api/driver/list', {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

// Admin: assign a driver to a confirmed order
export async function assignDriver(orderId, driverId) {
  return request(`/api/driver/assign/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ driverId }),
  });
}

// Admin: create a new driver account
export async function createDriver(data) {
  return request('/api/driver/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
}