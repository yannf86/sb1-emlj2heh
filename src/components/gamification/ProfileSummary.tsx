import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, BadgeCheck, Crown, Medal } from 'lucide-react';
import { useGamification } from './GamificationContext';
import LevelProgressBar from './LevelProgressBar';
import BadgeDisplay from './BadgeDisplay';

const ProfileSummary: React.FC = () => {
  const { userStats, level, rank, badges } = useGamification();
  
  if (!userStats || !level || !rank) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Chargement des données...
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Récupérer les 5 derniers badges obtenus pour affichage
  const recentBadges = badges.slice(0, 5);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Award className="h-5 w-5 mr-2 text-brand-500" /> Profil & Progression
        </CardTitle>
        <CardDescription>
          Ton niveau, tes récompenses et ton classement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Niveau et Progression */}
          <div>
            <h3 className="text-sm font-medium mb-2">Niveau & Progression</h3>
            <LevelProgressBar 
              level={level.level} 
              progress={level.progress} 
            />
          </div>
          
          {/* Classement */}
          <div>
            <h3 className="text-sm font-medium mb-2">Classement</h3>
            <div className="flex items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
              <Crown className="h-5 w-5 text-brand-500 mr-2" />
              <div className="flex-1">
                <div className="font-medium">{rank.rank}</div>
                <div className="text-xs text-muted-foreground">
                  {rank.nextRank !== "Max" ? `${rank.pointsNeeded.toLocaleString()} points pour ${rank.nextRank}` : "Niveau maximum atteint"}
                </div>
              </div>
              <div className="font-bold text-brand-600">
                {rank.points.toLocaleString()} pts
              </div>
            </div>
          </div>
          
          {/* Badges Récents */}
          <div>
            <h3 className="text-sm font-medium mb-2">Badges Récents</h3>
            {recentBadges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recentBadges.map(badge => (
                  <BadgeDisplay key={badge.id} badge={badge} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
                Aucun badge débloqué pour le moment.
              </div>
            )}
          </div>
          
          {/* Statistiques */}
          <div>
            <h3 className="text-sm font-medium mb-2">Statistiques Clés</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <StatCard 
                label="Incidents Résolus" 
                value={userStats.incidentsResolved.toString()} 
                icon={<BadgeCheck className="h-4 w-4 text-green-500" />} 
              />
              <StatCard 
                label="Maintenances" 
                value={userStats.maintenanceCompleted.toString()} 
                icon={<BadgeCheck className="h-4 w-4 text-blue-500" />} 
              />
              <StatCard 
                label="Score Qualité" 
                value={`${userStats.avgQualityScore.toFixed(0)}%`} 
                icon={<BadgeCheck className="h-4 w-4 text-yellow-500" />} 
              />
              <StatCard 
                label="Objets Rendus" 
                value={userStats.lostItemsReturned.toString()} 
                icon={<BadgeCheck className="h-4 w-4 text-purple-500" />} 
              />
              <StatCard 
                label="Jours Consécutifs" 
                value={userStats.currentStreak.toString()} 
                icon={<BadgeCheck className="h-4 w-4 text-orange-500" />} 
              />
              <StatCard 
                label="Badges" 
                value={badges.length.toString()} 
                icon={<Medal className="h-4 w-4 text-brand-500" />} 
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-md text-center">
      <div className="flex justify-center mb-1">
        {icon}
      </div>
      <div className="font-semibold text-sm">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
};

export default ProfileSummary;