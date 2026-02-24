import { forwardRef } from 'react';

const Button = forwardRef(function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  type = 'button',
  ...props 
}, ref) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[#2D5A27] text-white hover:bg-[#234420] focus:ring-[#2D5A27]',
    accent: 'bg-[#4A7C59] text-white hover:bg-[#3d6a4a] focus:ring-[#4A7C59]',
    outline: 'border-2 border-[#2D5A27] text-[#2D5A27] hover:bg-[#E8F0E8] focus:ring-[#2D5A27]',
    ghost: 'text-[#6B4423] hover:bg-[#E8F0E8] focus:ring-[#8B7355]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
