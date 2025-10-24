import React from 'react';
import { Loader2 } from 'lucide-react';

const CenteredLoader = ({ message = "Loading...", size = "large", fullScreen = false }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-8 w-8", 
    large: "h-12 w-12",
    xlarge: "h-16 w-16"
  };

  const containerClasses = {
    small: "h-32",
    medium: "h-48",
    large: "h-64",
    xlarge: "h-96"
  };

  const wrapperClasses = fullScreen 
    ? "fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50"
    : `flex flex-col items-center justify-center ${containerClasses[size]} w-full`;

  return (
    <div className={wrapperClasses}>
      <div className="flex flex-col items-center justify-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-500 mb-4`} />
        <p className="text-gray-600 font-medium text-lg">{message}</p>
      </div>
    </div>
  );
};

export default CenteredLoader;
