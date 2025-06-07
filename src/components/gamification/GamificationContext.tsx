import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  GamificationAction, 
  Badge, 
  Challenge,
  BadgeCategory,
  UserStats
} from '@/lib/gamification';
import { getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
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
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [level, setLevel] = useState<{ level: number; progress: number; levelInfo: any } | null>(null);
  const [rank, setRank] = useState<{ rank: string; points: number; nextRank: string; pointsNeeded: number } | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<{ [id: string]: number }>({});
  const [recentBadges, setRecentBadges] = useState<Badge[]>([]);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  
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
  
  // Initialize user stats when component mounts
  const refreshStats = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get or initialize user stats
      const stats = await initializeOrGetUserStats(currentUser.id);
      setUserStats(stats);
      
      // Get user level
      const userLevel = await getUserLevel(currentUser.id);
      setLevel(userLevel);
      
      // Get user rank
      const userRank = await getUserRank(currentUser.id);
      setRank(userRank);
      
      // Get user badges
      const userBadges = await getUserBadges(currentUser.id);
      setBadges(userBadges);
      
      // Get user challenges
      const { challenges: userChallenges, progress } = await getUserChallenges(currentUser.id);
      setChallenges(userChallenges);
      setChallengeProgress(progress);
    } catch (error) {
      console.error('Error initializing gamification stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    refreshStats();
  }, []);
  
  // Function to perform gamification actions
  const performAction = async (action: GamificationAction) => {
    // If gamification is disabled, do nothing
    if (!enabled) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    try {
      const userId = currentUser.id;
      const { newStats, xpGained, newBadges } = await updateUserStats(userId, action);
      
      // Update the state with new values
      setUserStats(newStats);
      setLevel(await getUserLevel(userId));
      setRank(await getUserRank(userId));
      setBadges(await getUserBadges(userId));
      
      // Update challenges
      const { challenges: userChallenges, progress } = await getUserChallenges(userId);
      setChallenges(userChallenges);
      setChallengeProgress(progress);
      
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
      userChallenges.forEach(challenge => {
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
    } catch (error) {
      console.error('Error performing gamification action:', error);
    }
  };
  
  const clearRecentBadges = () => {
    setRecentBadges([]);
  };
  
  const getBadgesByCategory = (category: BadgeCategory): Badge[] => {
    return badges.filter(badge => badge.category === category);
  };
  
  const contextValue = {
    userStats,
    level,
    rank,
    badges,
    challenges,
    challengeProgress,
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