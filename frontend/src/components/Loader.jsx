import React from 'react';

const Loader = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className={`animate-spin rounded-full border-t-brand-500 border-r-transparent border-b-brand-500 border-l-transparent ${sizeClasses[size] || sizeClasses.md}`}></div>
    </div>
  );
};

export default Loader;
