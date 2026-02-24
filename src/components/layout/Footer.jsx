import { Link } from 'react-router-dom';
import { Leaf, Phone, Mail } from 'lucide-react';
import logo from '../../assets/logo.jpg';

const footerLinks = {
  Shop: [
    { to: '/shop', label: 'All Products' },
    { to: '/shop/maavus', label: 'Maavus' },
    { to: '/shop/kanji-kali-mixes', label: 'Kanji/Kali Mixes' },
    { to: '/shop/podi-thool', label: 'Podi/Thool' },
  ],
  Company: [
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact' },
    { to: '/faq', label: 'FAQ' },
    { to: '/track-order', label: 'Track Order' },
  ],
};

const trustBadges = [
  { icon: Leaf, label: '100% Organic' },
  { label: 'Traditional Recipes' },
  { label: 'Natural Ingredients' },
];

function Footer() {
  return (
    <footer className="bg-[#2D5A27] text-[#FAFAF8] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img
                src={logo}
                alt="Grand Ma's Care"
                className="h-10 w-auto rounded-lg object-contain"
              />
            </Link>
            <p className="text-[#FAFAF8]/90 text-sm mb-4">
              Traditional Tamil organic products. Handcrafted with love, passed down through generations.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <a href="tel:+919876543210" className="flex items-center gap-2 text-[#FAFAF8]/90 hover:text-white">
                <Phone className="w-4 h-4" />
                +91 98765 43210
              </a>
              <a href="mailto:hello@grandmascare.com" className="flex items-center gap-2 text-[#FAFAF8]/90 hover:text-white">
                <Mail className="w-4 h-4" />
                hello@grandmascare.com
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-[#FAFAF8]/90 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap justify-center gap-6">
              {trustBadges.map((badge) => (
                <span
                  key={badge.label}
                  className="flex items-center gap-2 text-sm text-[#FAFAF8]/90"
                >
                  {badge.icon && <badge.icon className="w-4 h-4 text-[#4A7C59]" />}
                  {badge.label}
                </span>
              ))}
            </div>
            <p className="text-sm text-[#FAFAF8]/70">
              &copy; {new Date().getFullYear()} Grand Ma's Care. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
