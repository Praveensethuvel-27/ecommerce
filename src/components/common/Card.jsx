function Card({ children, className = '', padding = true, ...props }) {
  return (
    <div
      className={`rounded-2xl bg-[#FAFAF8] shadow-sm border border-[#8B7355]/10 ${padding ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
