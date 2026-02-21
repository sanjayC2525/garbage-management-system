import { forwardRef } from 'react';

const Card = forwardRef(({ 
  children, 
  className = '', 
  padding = 'p-6',
  hover = false,
  interactive = false 
}, ref) => {
  const baseClasses = 'bg-surface rounded-2xl shadow-soft border transition-all duration-200';
  const hoverClasses = hover ? 'hover:shadow-medium hover:bg-surfaceLight' : '';
  const interactiveClasses = interactive ? 'cursor-pointer hover:shadow-medium' : '';
  
  const combinedClasses = `${baseClasses} ${padding} ${hoverClasses} ${interactiveClasses} ${className}`;

  return (
    <div 
      ref={ref}
      className={combinedClasses}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
