import React from 'react';

interface LoadingShimmerProps {
  className?: string;
  rows?: number;
  type?: 'card' | 'table' | 'chart' | 'text' | 'modal';
}

const LoadingShimmer: React.FC<LoadingShimmerProps> = ({ 
  className = '', 
  rows = 3, 
  type = 'card' 
}) => {
  const shimmerClass = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded";

  if (type === 'card') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="space-y-4">
          <div className={`h-6 w-3/4 ${shimmerClass}`}></div>
          <div className={`h-4 w-1/2 ${shimmerClass}`}></div>
          <div className="space-y-2">
            {[...Array(rows)].map((_, i) => (
              <div key={i} className={`h-3 w-full ${shimmerClass}`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <div className={`h-6 w-1/3 ${shimmerClass}`}></div>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className={`h-4 w-1/4 ${shimmerClass}`}></div>
              <div className={`h-4 w-1/4 ${shimmerClass}`}></div>
              <div className={`h-4 w-1/4 ${shimmerClass}`}></div>
              <div className={`h-4 w-1/4 ${shimmerClass}`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className={`h-6 w-1/3 mb-4 ${shimmerClass}`}></div>
        <div className={`h-64 w-full ${shimmerClass}`}></div>
      </div>
    );
  }

  if (type === 'modal') {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className={`h-8 w-2/3 ${shimmerClass}`}></div>
          <div className={`h-4 w-1/2 ${shimmerClass}`}></div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className={`h-4 w-3/4 mb-2 ${shimmerClass}`}></div>
              <div className={`h-6 w-1/2 ${shimmerClass}`}></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className={`h-5 w-1/3 mb-4 ${shimmerClass}`}></div>
              <div className={`h-48 w-full ${shimmerClass}`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className={`h-4 w-full ${shimmerClass}`}></div>
      ))}
    </div>
  );
};

export default LoadingShimmer;