import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function AccordionItem({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#8B7355]/20 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-left font-medium text-[#6B4423] hover:text-[#2D5A27] transition-colors"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={`w-5 h-5 text-[#8B7355] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="pb-4 text-[#8B7355] text-sm leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

function Accordion({ items }) {
  return (
    <div className="divide-y divide-[#8B7355]/20">
      {items.map((item, index) => (
        <AccordionItem key={index} title={item.title} defaultOpen={index === 0}>
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}

export { Accordion, AccordionItem };
