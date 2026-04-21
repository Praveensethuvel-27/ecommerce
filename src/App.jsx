import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OffersProvider } from './context/OffersContext';
import MainLayout from './components/layout/MainLayout';

import Home from './pages/customer/Home';
import Shop from './pages/customer/Shop';
import Category from './pages/customer/Category';
import Product from './pages/customer/Product';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';

import AccountLayout from './pages/account/AccountLayout';
import AccountDashboard from './pages/account/AccountDashboard';
import AccountOrders from './pages/account/AccountOrders';
import AccountProfile from './pages/account/AccountProfile';
import AccountAddresses from './pages/account/AccountAddresses';
import AccountTracking from './pages/account/AccountTracking';

import About from './pages/content/About';
import Contact from './pages/content/Contact';
import FAQ from './pages/content/FAQ';
import OrderTracking from './pages/content/OrderTracking';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminBlockedUsers from './pages/admin/AdminBlockedUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLogin from './pages/admin/AdminLogin';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminOffers from './pages/admin/AdminOffers';
import DriverLogin from './pages/driver/DriverLogin';
import DriverApp from './pages/driver/DriverApp';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!user && requireAdmin) return <Navigate to="/admin/login" replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <OffersProvider>
            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route path="/driver/login" element={<DriverLogin />} />
              <Route path="/driver/scan" element={<DriverApp />} />

              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="customers/blocked" element={<AdminBlockedUsers />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="drivers" element={<AdminDrivers />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="offers" element={<AdminOffers />} />
              </Route>

              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="shop/:categorySlug" element={<Category />} />
                <Route path="product/:productSlug" element={<Product />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="faq" element={<FAQ />} />
                <Route path="track-order" element={<OrderTracking />} />

                <Route path="account" element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}>
                  <Route index element={<AccountDashboard />} />
                  <Route path="orders" element={<AccountOrders />} />
                  <Route path="profile" element={<AccountProfile />} />
                  <Route path="addresses" element={<AccountAddresses />} />
                  <Route path="tracking" element={<AccountTracking />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </OffersProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;