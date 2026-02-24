import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-[#8B7355]">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="w-4 h-4 text-[#8B7355]/60" />}
            {item.to ? (
              <Link to={item.to} className="hover:text-[#2D5A27] transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-[#6B4423] font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
