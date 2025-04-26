import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  GamificationService, 
  UserStats, 
  GamificationAction, 
  Badge, 
  Challenge,
  BadgeCategory
} from '@/lib/gamification';
import { getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

type GamificationContextType = {
  userStats: UserStats | null;
  level: { level: number; progress: number; levelInfo: any } | null;
  rank: { rank: string; points: number; nextRank: string; pointsNeeded: number } | null;
  badges: Badge[];
  challenges: Challenge[];
  challengeProgress: { [id: string]: number };
  recentBadges: Badge[];
  enabled: boolean;
  
  performAction: (action: GamificationAction) => void;
  clearRecentBadges: () => void;
  getBadgesByCategory: (category: BadgeCategory) => Badge[];
  refreshStats: () => void;
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [level, setLevel] = useState<{ level: number; progress: number; levelInfo: any } | null>(null);
  const [rank, setRank] = useState<{ rank: string; points: number; nextRank: string; pointsNeeded: number } | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<{ [id: string]: number }>({});
  const [recentBadges, setRecentBadges] = useState<Badge[]>([]);
  const [enabled, setEnabled] = useState<boolean>(true);
  
  const { toast } = useToast();
  
  // Check if gamification is enabled from settings
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('gamificationSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setEnabled(settings.enabled !== false);
      }
    } catch (error) {
      console.error("Error loading gamification settings:", error);
    }
  }, []);
  
  // Initialise les statistiques de l'utilisateur
  const refreshStats = () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const stats = GamificationService.getStats(currentUser.id);
      const userLevel = GamificationService.getLevel(currentUser.id);
      const userRank = GamificationService.getRank(currentUser.id);
      const userBadges = GamificationService.getBadges(currentUser.id);
      const { challenges: userChallenges, progress } = GamificationService.getChallenges(currentUser.id);
      
      setUserStats(stats);
      setLevel(userLevel);
      setRank(userRank);
      setBadges(userBadges);
      setChallenges(userChallenges);
      setChallengeProgress(progress);
    }
  };
  
  useEffect(() => {
    refreshStats();
  }, []);
  
  const performAction = (action: GamificationAction) => {
    // If gamification is disabled, do nothing
    if (!enabled) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const userId = currentUser.id;
    const { newStats, xpGained, newBadges } = GamificationService.updateStats(userId, action);
    
    // Mettre à jour l'état
    setUserStats(newStats);
    setLevel(GamificationService.getLevel(userId));
    setRank(GamificationService.getRank(userId));
    setBadges(GamificationService.getBadges(userId));
    
    const { challenges: userChallenges, progress } = GamificationService.getChallenges(userId);
    setChallenges(userChallenges);
    setChallengeProgress(progress);
    
    // Gérer les nouveaux badges
    if (newBadges.length > 0) {
      setRecentBadges(newBadges);
      
      // Afficher un toast pour chaque nouveau badge
      newBadges.forEach(badge => {
        toast({
          title: `Nouveau badge débloqué: ${badge.icon} ${badge.name}`,
          description: badge.description,
          variant: "default",
        });
      });
    }
    
    // Afficher les points XP gagnés
    if (xpGained > 0) {
      toast({
        title: `+${xpGained} points XP`,
        description: `Tu as gagné ${xpGained} points d'expérience !`,
        variant: "default",
      });
    }
    
    // Vérifier les défis complétés
    userChallenges.forEach(challenge => {
      if (challenge.condition(newStats) && !challenge.condition(userStats!)) {
        toast({
          title: `Défi complété: ${challenge.icon} ${challenge.title}`,
          description: `Tu as gagné ${challenge.xpReward} points XP !`,
          variant: "default",
        });
        
        // Ajouter les points XP du défi
        performAction({ type: 'COMPLETE_WEEKLY_GOAL' });
      }
    });
  };
  
  const clearRecentBadges = () => {
    setRecentBadges([]);
  };
  
  const getBadgesByCategory = (category: BadgeCategory): Badge[] => {
    return badges.filter(badge => badge.category === category);
  };
  
  return (
    <GamificationContext.Provider
      value={{
        userStats,
        level,
        rank,
        badges,
        challenges,
        challengeProgress,
        recentBadges,
        enabled,
        performAction,
        clearRecentBadges,
        getBadgesByCategory,
        refreshStats
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};