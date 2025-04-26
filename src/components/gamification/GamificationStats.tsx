import React from 'react';
import { BadgeCheck, Medal, Trophy } from 'lucide-react';
import { useGamification } from './GamificationContext';
import { Progress } from '@/components/ui/progress';

// Composant pour afficher un résumé des statistiques de gamification dans le dashboard
const GamificationStats: React.FC = () => {
  const { userStats, level, rank, badges, challenges, challengeProgress, enabled } = useGamification();
  
  if (!enabled || !userStats || !level || !rank) {
    return null;
  }
  
  // Trouver un défi en cours pour afficher
  const currentChallenge = challenges.find(c => challengeProgress[c.id] < 100) || challenges[0];
  const currentChallengeProgress = currentChallenge ? challengeProgress[currentChallenge.id] : 0;
  
  return (
    <div className="bg-white dark:bg-charcoal-900 rounded-lg border border-cream-200 dark:border-charcoal-700 shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center">
        <Trophy className="mr-2 h-5 w-5 text-brand-500" />
        Votre Progression
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Niveau */}
        <div className="p-3 bg-slate-50 dark:bg-charcoal-800 rounded-md">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Niveau {level.level}</span>
            <span className="text-xs text-muted-foreground">{level.progress}%</span>
          </div>
          <Progress value={level.progress} className="h-2 mb-2" />
          <div className="text-xs text-muted-foreground">
            {level.levelInfo.badge} {level.levelInfo.name}
          </div>
        </div>
        
        {/* Badges */}
        <div className="p-3 bg-slate-50 dark:bg-charcoal-800 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Badges</span>
            <span className="text-lg font-bold text-brand-500 flex items-center">
              <Medal className="h-4 w-4 mr-1" />
              {badges.length}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {badges.slice(0, 4).map(badge => (
              <span key={badge.id} className="text-lg" title={badge.name}>
                {badge.icon}
              </span>
            ))}
            {badges.length > 4 && (
              <span className="text-xs bg-slate-200 dark:bg-charcoal-700 px-1.5 py-0.5 rounded-full">
                +{badges.length - 4}
              </span>
            )}
          </div>
        </div>
        
        {/* Défi en cours */}
        {currentChallenge && (
          <div className="p-3 bg-slate-50 dark:bg-charcoal-800 rounded-md">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium flex items-center">
                <span className="mr-1">{currentChallenge.icon}</span>
                Défi en cours
              </span>
              <span className="text-xs text-muted-foreground">{currentChallengeProgress}%</span>
            </div>
            <Progress value={currentChallengeProgress} className="h-2 mb-2" />
            <div className="text-xs text-muted-foreground truncate">
              {currentChallenge.title}
            </div>
          </div>
        )}
        
        {/* Rank */}
        <div className="p-3 bg-slate-50 dark:bg-charcoal-800 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Classement</span>
            <span className="text-brand-500 font-semibold">{rank.rank}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {rank.nextRank !== "Max" ? (
              <>{rank.pointsNeeded.toLocaleString()} points pour {rank.nextRank}</>
            ) : (
              <>Rang maximum atteint</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationStats;