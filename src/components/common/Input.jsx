function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#6B4423] mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423] placeholder:text-[#8B7355]/60 focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default Input;
