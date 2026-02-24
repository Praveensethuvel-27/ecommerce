import { Outlet, Link, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/account', label: 'Dashboard', end: true },
  { to: '/account/orders', label: 'Order History', end: false },
  { to: '/account/profile', label: 'Profile', end: false },
  { to: '/account/addresses', label: 'Addresses', end: false },
  { to: '/account/tracking', label: 'Delivery Tracking', end: false },
];

function AccountLayout() {
  const location = useLocation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <nav className="bg-[#FAFAF8] rounded-2xl p-4 border border-[#8B7355]/10">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`block px-4 py-2 rounded-xl font-medium transition-colors ${
                      (item.end ? location.pathname === '/account' : location.pathname.startsWith(item.to))
                        ? 'bg-[#E8F0E8] text-[#2D5A27]'
                        : 'text-[#6B4423] hover:bg-[#E8F0E8]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AccountLayout;
