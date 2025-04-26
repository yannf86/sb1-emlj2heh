import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GamificationService } from '@/lib/gamification';
import { users } from '@/lib/data';
import { useGamification } from './GamificationContext';
import { Crown, Medal, Trophy } from 'lucide-react';

type LeaderboardEntry = {
  userId: string;
  name: string;
  points: number;
  rank: string;
  level: number;
  badgeCount: number;
};

// Types de période
type Period = 'weekly' | 'monthly' | 'allTime';

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<Period>('weekly');
  const { userStats } = useGamification();
  
  useEffect(() => {
    // Simuler une récupération du leaderboard
    const entries: LeaderboardEntry[] = users.map(user => {
      // Initialiser les stats pour l'utilisateur s'ils n'existent pas
      const stats = GamificationService.getStats(user.id);
      const rankInfo = GamificationService.getRank(user.id);
      const levelInfo = GamificationService.getLevel(user.id);
      
      return {
        userId: user.id,
        name: user.name,
        points: rankInfo.points,
        rank: rankInfo.rank,
        level: levelInfo.level,
        badgeCount: stats.badges.length
      };
    });
    
    // Trier par points
    entries.sort((a, b) => b.points - a.points);
    
    setLeaderboard(entries);
  }, [period]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-brand-500" /> Classement
        </CardTitle>
        <Tabs defaultValue="weekly" onValueChange={(value) => setPeriod(value as Period)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Cette semaine</TabsTrigger>
            <TabsTrigger value="monthly">Ce mois</TabsTrigger>
            <TabsTrigger value="allTime">Tout temps</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.map((entry, index) => {
            // Déterminer si cette entrée correspond à l'utilisateur actuel
            const isCurrentUser = userStats && entry.userId === userStats.userId;
            
            // Déterminer l'icône et les styles en fonction du rang
            let rankElement;
            if (index === 0) {
              rankElement = <Crown className="h-5 w-5 text-yellow-500" />;
            } else if (index === 1) {
              rankElement = <Medal className="h-5 w-5 text-slate-400" />;
            } else if (index === 2) {
              rankElement = <Medal className="h-5 w-5 text-amber-700" />;
            } else {
              rankElement = <span className="text-sm font-medium w-5 text-center">{index + 1}</span>;
            }
            
            return (
              <div 
                key={entry.userId}
                className={`flex items-center p-2 rounded-md ${
                  isCurrentUser ? 'bg-brand-50 border border-brand-200 dark:bg-brand-950 dark:border-brand-900' : 
                  index < 3 ? 'bg-slate-50 dark:bg-slate-900' : ''
                }`}
              >
                <div className="w-8 flex justify-center">
                  {rankElement}
                </div>
                <div className="flex-1 ml-2">
                  <div className="font-medium">
                    {entry.name}
                    {isCurrentUser && <span className="ml-2 text-xs text-brand-600">(Vous)</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Niveau {entry.level} · {entry.rank} · {entry.badgeCount} badges
                  </div>
                </div>
                <div className="font-bold text-brand-600">
                  {entry.points.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;