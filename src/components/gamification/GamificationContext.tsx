import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GamificationAction, 
  Badge, 
  Challenge,
  BadgeCategory,
  UserStats
} from '@/lib/gamification';
import { getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useUserGamificationStats, useUserBadges, useUserLevel, useUserRank, useUserChallenges } from '@/hooks/useGamification';
import { 
  FirebaseGamificationService,
  getUserStats,
  initializeOrGetUserStats,
  updateUserStats,
  getUserBadges,
  getUserLevel,
  getUserRank,
  getUserChallenges
} from '@/lib/firebase-gamification';

type GamificationContextType = {
  userStats: UserStats | null;
  level: { level: number; progress: number; levelInfo: any } | null;
  rank: { rank: string; points: number; nextRank: string; pointsNeeded: number } | null;
  badges: Badge[];
  challenges: Challenge[];
  challengeProgress: { [id: string]: number };
  recentBadges: Badge[];
  enabled: boolean;
  loading: boolean;
  
  performAction: (action: GamificationAction) => Promise<void>;
  clearRecentBadges: () => void;
  getBadgesByCategory: (category: BadgeCategory) => Badge[];
  refreshStats: () => Promise<void>;
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const userId = currentUser?.id || '';
  
  // Use React Query hooks
  const { 
    data: userStats, 
    isLoading: statsLoading, 
    refetch: refetchStats 
  } = useUserGamificationStats(userId);
  
  const { 
    data: userLevel, 
    isLoading: levelLoading,
    refetch: refetchLevel 
  } = useUserLevel(userId);
  
  const { 
    data: userRank, 
    isLoading: rankLoading,
    refetch: refetchRank 
  } = useUserRank(userId);
  
  const { 
    data: userBadges = [], 
    isLoading: badgesLoading,
    refetch: refetchBadges 
  } = useUserBadges(userId);
  
  const { 
    data: userChallengesData, 
    isLoading: challengesLoading,
    refetch: refetchChallenges 
  } = useUserChallenges(userId);

  // Local state for UI elements that don't need to be queried
  const [recentBadges, setRecentBadges] = useState<Badge[]>([]);
  const [enabled, setEnabled] = useState<boolean>(true);
  
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
  
  // Function to perform gamification action
  const performAction = async (action: GamificationAction) => {
    if (!enabled || !currentUser?.id) return;
    
    try {
      const { newStats, xpGained, newBadges } = await updateUserStats(currentUser.id, action);
      
      // Update all gamification data
      await refreshStats();
      
      // Handle new badges
      if (newBadges.length > 0) {
        setRecentBadges(newBadges);
        
        // Show toast for each new badge
        newBadges.forEach(badge => {
          toast({
            title: `Nouveau badge débloqué: ${badge.icon} ${badge.name}`,
            description: badge.description,
            variant: "default",
          });
        });
      }
      
      // Show XP gained toast if there are points earned
      if (xpGained > 0) {
        toast({
          title: `+${xpGained} points XP`,
          description: `Tu as gagné ${xpGained} points d'expérience !`,
          variant: "default",
        });
      }
      
      // Check for completed challenges
      if (userChallengesData?.challenges) {
        userChallengesData.challenges.forEach(challenge => {
          if (challenge.condition(newStats) && 
              (!userStats || !challenge.condition(userStats))) {
            toast({
              title: `Défi complété: ${challenge.icon} ${challenge.title}`,
              description: `Tu as gagné ${challenge.xpReward} points XP !`,
              variant: "default",
            });
            
            // Add the points from the challenge
            performAction({ type: 'COMPLETE_WEEKLY_GOAL' });
          }
        });
      }
    } catch (error) {
      console.error('Error performing gamification action:', error);
    }
  };
  
  // Function to refresh all stats
  const refreshStats = async () => {
    if (!currentUser?.id) return;
    
    await Promise.all([
      refetchStats(),
      refetchLevel(),
      refetchRank(),
      refetchBadges(),
      refetchChallenges()
    ]);
  };
  
  const clearRecentBadges = () => {
    setRecentBadges([]);
  };
  
  const getBadgesByCategory = (category: BadgeCategory): Badge[] => {
    return userBadges.filter(badge => badge.category === category);
  };
  
  // Loading state
  const loading = statsLoading || levelLoading || rankLoading || badgesLoading || challengesLoading;

  const contextValue = {
    userStats: userStats || null,
    level: userLevel || null,
    rank: userRank || null,
    badges: userBadges,
    challenges: userChallengesData?.challenges || [],
    challengeProgress: userChallengesData?.progress || {},
    recentBadges,
    enabled,
    loading,
    
    performAction,
    clearRecentBadges,
    getBadgesByCategory,
    refreshStats
  };
  
  return (
    <GamificationContext.Provider value={contextValue}>
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