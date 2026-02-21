import { useState } from 'react';

const ImagePreview = ({ 
  src, 
  alt, 
  className = '', 
  clickable = false,
  onClick,
  size = 'md', // sm, md, lg
  showInitials = true // new prop to control initials display
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24'
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const baseClasses = `object-cover rounded-full border-2 border-primary/20 ${sizes[size]} ${className}`;
  const clickableClasses = clickable ? 'cursor-pointer hover:shadow-medium transition-all duration-200' : '';

  // Generate initials from alt text
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  if (!src || imageError) {
    if (showInitials && alt) {
      return (
        <div 
          className={`${sizes[size]} bg-primary rounded-full border-2 border-primary/20 flex items-center justify-center ${clickableClasses} ${className}`}
          onClick={onClick}
        >
          <span className="text-text-inverse font-bold text-lg">
            {getInitials(alt)}
          </span>
        </div>
      );
    } else {
      return (
        <div className={`${sizes[size]} bg-surface rounded-full border-2 border-border flex items-center justify-center ${clickableClasses} ${className}`} onClick={onClick}>
          <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      );
    }
  }

  return (
    <div className={`relative inline-block ${clickableClasses}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-surface rounded-xl border border-border flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
        </div>
      )}
      
      {imageError ? (
        <div className={`${sizes[size]} bg-surface rounded-xl border border-border flex items-center justify-center`}>
          <svg className="w-6 h-6 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h.013M9.75 17.25v-.006c0-2.448-.952-4.688-2.344-5.752-4.688-5.752 0-2.344 0-4.688 0-5.752 0-2.344m0 9.75v6.25c0 2.448.952 4.688 2.344 5.752 4.688 5.752 2.344 0 4.688 0 5.752 0 2.344" />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={baseClasses}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={onClick}
        />
      )}
    </div>
  );
};

export default ImagePreview;
