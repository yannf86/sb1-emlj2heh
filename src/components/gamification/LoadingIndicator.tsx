import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = "Chargement...", 
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-brand-500 mb-4" />
      <p className="text-md font-medium text-center">{message}</p>
    </div>
  );
};

export default LoadingIndicator;