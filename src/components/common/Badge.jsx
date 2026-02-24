function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-[#E8F0E8] text-[#2D5A27]',
    primary: 'bg-[#2D5A27] text-white',
    accent: 'bg-[#4A7C59] text-white',
    outline: 'border border-[#2D5A27] text-[#2D5A27]',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
