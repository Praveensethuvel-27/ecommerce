function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-[#E8F0E8] border-t-[#2D5A27] ${sizes[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export default Spinner;
