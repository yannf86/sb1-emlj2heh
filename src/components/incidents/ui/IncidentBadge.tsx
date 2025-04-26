import React from 'react';
import { cn } from '@/lib/utils';

interface IncidentBadgeProps {
  type: 'status' | 'impact';
  value: string;
  label: string;
  className?: string;
}

const IncidentBadge: React.FC<IncidentBadgeProps> = ({ type, value, label, className }) => {
  const getStatusStyles = () => {
    switch (value) {
      case 'stat1':
        return 'bg-yellow-50 text-yellow-600 border-yellow-300';
      case 'stat2':
        return 'bg-blue-50 text-blue-600 border-blue-300';
      case 'stat3':
        return 'bg-green-50 text-green-600 border-green-300';
      case 'stat4':
        return 'bg-gray-50 text-gray-600 border-gray-300';
      default:
        return 'bg-red-50 text-red-600 border-red-300';
    }
  };

  const getImpactStyles = () => {
    switch (value) {
      case 'imp1':
        return 'bg-green-50 text-green-600 border-green-300';
      case 'imp2':
        return 'bg-blue-50 text-blue-600 border-blue-300';
      case 'imp3':
        return 'bg-amber-50 text-amber-600 border-amber-300';
      case 'imp4':
        return 'bg-red-50 text-red-600 border-red-300';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-300';
    }
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      type === 'status' ? getStatusStyles() : getImpactStyles(),
      className
    )}>
      {label}
    </span>
  );
};

export default IncidentBadge;