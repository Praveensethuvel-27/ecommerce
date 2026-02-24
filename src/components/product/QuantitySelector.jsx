import { Minus, Plus } from 'lucide-react';

function QuantitySelector({ value, onChange, min = 1, max = 99 }) {
  const handleDecrease = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrease = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="inline-flex items-center border border-[#8B7355]/30 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={handleDecrease}
        disabled={value <= min}
        className="p-2.5 bg-[#E8F0E8] text-[#2D5A27] hover:bg-[#d4e4d4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-12 text-center font-medium text-[#6B4423]" aria-label="Quantity">
        {value}
      </span>
      <button
        type="button"
        onClick={handleIncrease}
        disabled={value >= max}
        className="p-2.5 bg-[#E8F0E8] text-[#2D5A27] hover:bg-[#d4e4d4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export default QuantitySelector;
