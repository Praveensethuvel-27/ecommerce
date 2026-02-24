import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, FolderTree, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.jpg';

const navItems = [
  { to: '/admin',                  label: 'Dashboard', icon: LayoutDashboard, end: true  },
  { to: '/admin/products',         label: 'Products',  icon: Package,         end: false },
  { to: '/admin/orders',           label: 'Orders',    icon: ShoppingCart,    end: false },
  { to: '/admin/customers',        label: 'Customers', icon: Users,           end: false },
  { to: '/admin/categories',       label: 'Categories',icon: FolderTree,      end: false },
  { to: '/admin/reports',          label: 'Reports',   icon: BarChart3,       end: false },
  { to: '/admin/settings',         label: 'Settings',  icon: Settings,        end: false },
];

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    navigate('/login', { replace: true });
    logout();
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-[#2D5A27] text-white min-h-screen flex flex-col">
      {/* Logo header */}
      <Link to="/admin" className="flex items-center gap-3 px-5 py-4 border-b border-white/20 hover:bg-white/5 transition-colors">
        <img
          src={logo}
          alt="Grand Ma's Care"
          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30 flex-shrink-0"
        />
        <div>
          <span className="font-bold text-base leading-tight block">Grand Ma&apos;s Care</span>
          <p className="text-xs text-white/70 mt-0.5">Admin Panel</p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-white/20">
        <p className="text-sm text-white/70 px-4 mb-2 truncate">{user?.email}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;