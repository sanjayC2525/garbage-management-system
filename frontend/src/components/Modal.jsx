import React from 'react';
import Timeline from './Timeline';
import { getStatusBadge, formatDate } from '../utils/statusHelpers';

const Modal = ({ isOpen, onClose, title, children, wide = false, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-4xl'
  };

  return (
    <>
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className={`bg-background rounded-2xl shadow-large border border-border ${sizeClasses[size]} w-full mx-4 relative max-h-[90vh] overflow-hidden`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-text-muted hover:text-text-primary hover:bg-surface rounded-full transition-all duration-200"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          {title && (
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-text-primary pr-8">
                {title}
              </h2>
            </div>
          )}

          {/* Body */}
          <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
