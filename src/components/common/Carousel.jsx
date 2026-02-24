import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function Carousel({
  items = [],
  renderItem,
  autoPlay = true,
  interval = 5000,
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, interval);

    return () => clearInterval(id);
  }, [autoPlay, interval, items.length]);

  if (!items.length || !renderItem) return null;

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + items.length) % items.length);
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % items.length);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="transition-transform duration-500 ease-out flex"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {items.map((item, idx) => (
            <div key={idx} className="min-w-full">
              {renderItem(item, idx === current)}
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 text-[#2D5A27] shadow hover:bg-white transition-colors p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 text-[#2D5A27] shadow hover:bg-white transition-colors p-2"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex justify-center gap-2 mt-4">
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrent(idx)}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === current ? 'bg-[#2D5A27] w-4' : 'bg-[#8B7355]/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Carousel;

