import React from 'react';
import { EXPERIENCE_LEVELS, getLevelInfo } from '@/lib/gamification';

interface LevelProgressBarProps {
  level: number;
  progress: number;
}

const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ level, progress }) => {
  const levelInfo = getLevelInfo(level);
  const nextLevelInfo = level < EXPERIENCE_LEVELS.length 
    ? getLevelInfo(level + 1) 
    : null;
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <span className={`text-sm font-medium ${levelInfo.color}`}>
            Niveau {levelInfo.level} - {levelInfo.name}
          </span>
          <span className="ml-2 text-2xl">{levelInfo.badge}</span>
        </div>
        {nextLevelInfo && (
          <span className="text-xs text-muted-foreground">
            {progress}% vers Niveau {nextLevelInfo.level}
          </span>
        )}
      </div>
      
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
        <div 
          className="bg-brand-500 dark:bg-brand-400 h-2.5 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {nextLevelInfo && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            XP {levelInfo.minXP}
          </span>
          <span className="text-xs text-muted-foreground">
            XP {nextLevelInfo.minXP}
          </span>
        </div>
      )}
    </div>
  );
};

export default LevelProgressBar;