import { useQuery } from '@tanstack/react-query';
import { 
  getUserStats, 
  getUserBadges, 
  getUserLevel, 
  getUserRank, 
  getUserChallenges 
} from '../lib/firebase-gamification';
import { getCurrentUser } from '../lib/auth';

export function useUserGamificationStats(userId?: string) {
  const currentUser = getCurrentUser();
  const targetUserId = userId || currentUser?.id;

  return useQuery({
    queryKey: ['gamification', 'stats', targetUserId],
    queryFn: () => getUserStats(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // Stats are fresh for 5 minutes
  });
}

export function useUserBadges(userId?: string) {
  const currentUser = getCurrentUser();
  const targetUserId = userId || currentUser?.id;

  return useQuery({
    queryKey: ['gamification', 'badges', targetUserId],
    queryFn: () => getUserBadges(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // Badges are fresh for 5 minutes
  });
}

export function useUserLevel(userId?: string) {
  const currentUser = getCurrentUser();
  const targetUserId = userId || currentUser?.id;

  return useQuery({
    queryKey: ['gamification', 'level', targetUserId],
    queryFn: () => getUserLevel(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // Level is fresh for 5 minutes
  });
}

export function useUserRank(userId?: string) {
  const currentUser = getCurrentUser();
  const targetUserId = userId || currentUser?.id;

  return useQuery({
    queryKey: ['gamification', 'rank', targetUserId],
    queryFn: () => getUserRank(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // Rank is fresh for 5 minutes
  });
}

export function useUserChallenges(userId?: string) {
  const currentUser = getCurrentUser();
  const targetUserId = userId || currentUser?.id;

  return useQuery({
    queryKey: ['gamification', 'challenges', targetUserId],
    queryFn: () => getUserChallenges(targetUserId!),
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000, // Challenges are fresh for 5 minutes
  });
}