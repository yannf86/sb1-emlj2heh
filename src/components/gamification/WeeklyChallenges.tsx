import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Challenge } from '@/lib/gamification';
import { useGamification } from './GamificationContext';

interface WeeklyChallengesProps {
  limit?: number;
}

const WeeklyChallenges: React.FC<WeeklyChallengesProps> = ({ limit }) => {
  const { challenges, challengeProgress } = useGamification();
  
  const displayedChallenges = limit ? challenges.slice(0, limit) : challenges;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <span className="text-xl mr-2">🎯</span> Défis hebdomadaires
        </CardTitle>
        <CardDescription>
          Complète ces défis pour gagner des points XP supplémentaires
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedChallenges.map((challenge) => (
            <div key={challenge.id} className="border rounded-md p-3 bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium flex items-center">
                    <span className="mr-2">{challenge.icon}</span>
                    {challenge.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                </div>
                <div className="bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  +{challenge.xpReward} XP
                </div>
              </div>
              
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>{Math.min(Math.round(challengeProgress[challenge.id] * challenge.target / 100), challenge.target)} / {challenge.target}</span>
                  <span>{challengeProgress[challenge.id]}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className={`${
                      challengeProgress[challenge.id] === 100 
                        ? 'bg-green-500 dark:bg-green-600' 
                        : 'bg-brand-400 dark:bg-brand-500'
                    } h-2 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${challengeProgress[challenge.id]}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
          
          {limit && challenges.length > limit && (
            <div className="text-center">
              <button className="text-brand-600 hover:text-brand-700 text-sm font-medium">
                Voir tous les défis ({challenges.length})
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyChallenges;