import React from 'react';
import { Badge as BadgeType, BadgeCategory } from '@/lib/gamification';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BadgeDisplayProps {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ 
  badge, 
  size = 'md', 
  showTooltip = true 
}) => {
  const tierColors = {
    1: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
    2: 'bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300',
    3: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-300',
  };

  const tierNames = {
    1: 'Bronze',
    2: 'Argent',
    3: 'Or',
  };

  const sizeClasses = {
    sm: 'text-xs h-6',
    md: 'text-sm h-8',
    lg: 'text-base h-10',
  };

  const BadgeContent = (
    <Badge 
      className={`
        ${tierColors[badge.tier]} 
        ${sizeClasses[size]} 
        font-semibold border shadow-sm
        transition-all duration-200 ease-in-out
        ${size === 'lg' ? 'px-3 py-1' : ''}
      `}
    >
      <span className="mr-1">{badge.icon}</span>
      {size !== 'sm' && badge.name}
    </Badge>
  );

  if (!showTooltip) {
    return BadgeContent;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {BadgeContent}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="text-sm font-semibold">{badge.icon} {badge.name}</div>
          <div className="text-xs text-muted-foreground mt-1">{badge.description}</div>
          <div className="text-xs mt-2 font-medium text-slate-400">{tierNames[badge.tier]}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BadgeDisplay;