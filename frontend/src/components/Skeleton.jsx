const Skeleton = ({ 
  className = '', 
  variant = 'default', // default, text, avatar, card
  lines = 1 
}) => {
  const variants = {
    default: 'bg-surface rounded',
    text: 'h-4 bg-surface rounded animate-pulse-slow',
    avatar: 'w-10 h-10 bg-surface rounded-full animate-pulse-slow',
    card: 'bg-surface rounded-2xl animate-pulse-slow h-24'
  };
  
  const lineElements = Array.from({ length: lines }, (_, index) => (
    <div 
      key={index}
      className="h-2 bg-surfaceLight rounded animate-pulse-slow mb-2"
      style={{ width: `${Math.random() * 60 + 40}%` }}
    ></div>
  ));

  if (variant === 'text') {
    return <div className={`${variants[variant]} ${className}`}></div>;
  }
  
  if (variant === 'lines') {
    return (
      <div className={`space-y-2 ${className}`}>
        {lineElements}
      </div>
    );
  }

  return (
    <div className={`${variants[variant]} ${className}`}></div>
  );
};

export default Skeleton;
