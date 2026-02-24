import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Globe } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../common/Button';
import logo from '../../assets/logo.jpg';

const navLinks = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/shop', labelKey: 'nav.shop' },
  { to: '/about', labelKey: 'nav.about' },
  { to: '/contact', labelKey: 'nav.contact' },
  { to: '/faq', labelKey: 'nav.faq' },
];

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const languageMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    };

    if (languageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [languageMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-md border-b border-[#8B7355]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <img
              src={logo}
              alt="Grand Ma's Care"
              className="h-8 sm:h-10 w-auto rounded-lg object-contain"
            />
            <span className="text-base sm:text-xl font-bold text-[#2D5A27]">
              Grand Ma's Care
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[#6B4423] hover:text-[#2D5A27] font-medium transition-colors"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-[#E8F0E8] text-[#6B4423]"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-[#2D5A27] text-white text-xs font-bold rounded-full">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            <div className="hidden sm:flex items-center relative" ref={languageMenuRef}>
              <button
                type="button"
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                className="p-2 rounded-lg hover:bg-[#E8F0E8] text-[#6B4423] relative"
                aria-label="Change language"
                title={language === 'en' ? 'English' : 'தமிழ்'}
              >
                <Globe className="w-5 h-5" />
              </button>
              {languageMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-lg border border-[#8B7355]/20 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      setLanguageMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm rounded-t-xl ${language === 'en' ? 'bg-[#2D5A27] text-white' : 'text-[#6B4423] hover:bg-[#E8F0E8]'}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('ta');
                      setLanguageMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm rounded-b-xl ${language === 'ta' ? 'bg-[#2D5A27] text-white' : 'text-[#6B4423] hover:bg-[#E8F0E8]'}`}
                  >
                    தமிழ்
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="relative group">
                {user.role === 'admin' && (
                  <Link to="/admin" className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#234420] mr-2">
                    {t('common.admin')}
                  </Link>
                )}
                <Link
                  to="/account"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#E8F0E8] text-[#6B4423]"
                >
                  <User className="w-6 h-6" />
                  <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                </Link>
                <div className="absolute right-0 mt-1 w-48 py-2 bg-white rounded-xl shadow-lg border border-[#8B7355]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    to="/account"
                    className="block px-4 py-2 text-sm text-[#6B4423] hover:bg-[#E8F0E8]"
                  >
                    {t('common.myAccount')}
                  </Link>
                  <Link
                    to="/account/orders"
                    className="block px-4 py-2 text-sm text-[#6B4423] hover:bg-[#E8F0E8]"
                  >
                    {t('common.orders')}
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-[#6B4423] hover:bg-red-600 hover:text-white"
                  >
                    {t('common.logout')}
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" variant="primary">
                  {t('common.login')}
                </Button>
              </Link>
            )}

            <button
              className="md:hidden p-2 rounded-lg hover:bg-[#E8F0E8] text-[#6B4423]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden py-4 border-t border-[#8B7355]/20">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-4 py-2 text-[#6B4423] hover:bg-[#E8F0E8] rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
              <div className="flex items-center gap-2 px-4 pt-2">
                <Globe className="w-4 h-4 text-[#6B4423]" />
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`text-xs px-2 py-1 rounded ${language === 'en' ? 'bg-[#2D5A27] text-white' : 'text-[#6B4423] hover:bg-[#E8F0E8]'}`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ta')}
                  className={`text-xs px-2 py-1 rounded ${language === 'ta' ? 'bg-[#2D5A27] text-white' : 'text-[#6B4423] hover:bg-[#E8F0E8]'}`}
                >
                  தமிழ்
                </button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
