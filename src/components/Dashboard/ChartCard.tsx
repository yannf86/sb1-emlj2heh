import React, { ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function ChartCard({ title, subtitle, children, actions }: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-warm-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-warm-600 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {actions}
          <button className="p-2 hover:bg-warm-100 rounded-lg">
            <MoreHorizontal className="w-4 h-4 text-warm-400" />
          </button>
        </div>
      </div>
      <div className="h-64">
        {children}
      </div>
    </div>
  );
}