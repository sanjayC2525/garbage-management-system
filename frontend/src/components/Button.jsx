import { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', // primary, secondary, accent, ghost
  size = 'md', // sm, md, lg
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50';
  
  const variants = {
    primary: 'bg-primary text-text-inverse hover:bg-primary/90 active:bg-primary/80 shadow-soft',
    secondary: 'bg-surface text-text-primary hover:bg-surfaceLight border border',
    accent: 'bg-accent text-text-inverse hover:bg-accent/90 active:bg-accent/80 shadow-soft',
    ghost: 'bg-transparent text-primary hover:bg-surface border border'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-medium';
  const loadingClasses = loading ? 'cursor-wait' : '';
  
  const combinedClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${loadingClasses} ${className}`;

  return (
    <button
      ref={ref}
      type={type}
      className={combinedClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
