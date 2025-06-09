import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp, addDoc, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { 
  UserStats, 
  GamificationAction, 
  Badge, 
  Challenge, 
  BadgeCategory, 
  BADGES, 
  calculateLevel, 
  calculateLevelProgress, 
  EXPERIENCE_LEVELS,
  ACTION_POINTS,
  initializeUserStats
} from './gamification';
import { getCurrentUser } from './auth';

// Collection names for Firebase
const COLLECTIONS = {
  USER_STATS: 'user_gamification_stats',
  ACTION_HISTORY: 'gamification_action_history',
  RATE_LIMITS: 'gamification_rate_limits'
};

// Rate limiting configuration
const RATE_LIMITS = {
  LOGIN: { maxPerDay: 1, pointsPerDay: ACTION_POINTS.FIRST_LOGIN_OF_DAY },
  CREATE_INCIDENT: { maxPerHour: 20, maxPerDay: 50 },
  RESOLVE_INCIDENT: { maxPerHour: 20, maxPerDay: 50 },
  READ_PROCEDURE: { maxPerHour: 30, maxPerDay: 100 },
  DEFAULT: { maxPerHour: 20, maxPerDay: 100 }
};

/**
 * Check if user is authenticated and get current user
 * @returns Current user or null
 */
const ensureAuthenticated = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.warn('User not authenticated for gamification operations');
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return null;
  }
};

/**
 * Retrieves user's gamification stats from Firebase
 * @param userId User ID to retrieve stats for
 * @returns UserStats object or null if not found
 */
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();
    if (!currentUser) {
      console.warn('Cannot retrieve stats: User not authenticated');
      return null;
    }

    // Ensure user can only access their own stats
    if (currentUser.uid !== userId) {
      console.warn('Cannot retrieve stats: User can only access their own data');
      return null;
    }

    const userStatsRef = doc(db, COLLECTIONS.USER_STATS, userId);
    const docSnap = await getDoc(userStatsRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserStats;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving user stats from Firebase:', error);
    
    // Check if it's a permission error
    if (error instanceof Error && error.message.includes('permission')) {
      console.error('Firebase permission error. Please check your Firestore security rules.');
      console.error('Required rule: allow read, write: if request.auth != null && request.auth.uid == userId;');
    }
    
    return null;
  }
};

/**
 * Initializes or retrieves user stats
 * @param userId User ID to initialize
 * @returns UserStats object
 */
export const initializeOrGetUserStats = async (userId: string): Promise<UserStats> => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();
    if (!currentUser) {
      console.warn('Cannot initialize stats: User not authenticated, returning default stats');
      return initializeUserStats(userId);
    }

    // Ensure user can only access their own stats
    if (currentUser.uid !== userId) {
      console.warn('Cannot initialize stats: User can only access their own data, returning default stats');
      return initializeUserStats(userId);
    }

    // Try to get existing stats
    const stats = await getUserStats(userId);
    
    if (stats) {
      return stats;
    }
    
    // If not found, initialize new stats
    const newStats = initializeUserStats(userId);
    
    try {
      // Save to Firebase
      const userStatsRef = doc(db, COLLECTIONS.USER_STATS, userId);
      await setDoc(userStatsRef, newStats);
      console.log('Successfully initialized user stats in Firebase');
    } catch (saveError) {
      console.error('Error saving new stats to Firebase:', saveError);
      // Continue with local stats even if save fails
    }
    
    return newStats;
  } catch (error) {
    console.error('Error initializing user stats:', error);
    // Return a default stats object even in case of error
    return initializeUserStats(userId);
  }
};

/**
 * Records action history in Firebase
 * @param userId User ID performing the action
 * @param action The gamification action performed
 * @param xpGained XP gained from the action
 * @param details Additional details about the action
 */
export const recordActionHistory = async (
  userId: string, 
  action: GamificationAction, 
  xpGained: number,
  details?: any
) => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();
    if (!currentUser || currentUser.uid !== userId) {
      console.warn('Cannot record action history: Authentication failed');
      return;
    }

    const historyCollection = collection(db, COLLECTIONS.ACTION_HISTORY);
    
    await addDoc(historyCollection, {
      userId,
      action: action.type,
      actionDetails: { ...action },
      xpGained,
      details,
      timestamp: serverTimestamp()
    });
    
    console.log(`Recorded action history: ${action.type} for user ${userId}`);
  } catch (error) {
    console.error('Error recording action history:', error);
    // Don't throw error to prevent breaking the main flow
  }
};

/**
 * Checks if an action is rate-limited
 * @param userId User ID performing the action
 * @param action The gamification action to check
 * @returns Boolean indicating if the action is rate-limited
 */
export const isActionRateLimited = async (
  userId: string,
  action: GamificationAction
): Promise<boolean> => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();
    if (!currentUser || currentUser.uid !== userId) {
      console.warn('Cannot check rate limits: Authentication failed');
      return false; // Allow action if we can't check
    }

    const actionType = action.type;
    const limits = RATE_LIMITS[actionType as keyof typeof RATE_LIMITS] || RATE_LIMITS.DEFAULT;
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();
    
    // Check daily limit
    if (limits.maxPerDay) {
      const dailyQuery = query(
        collection(db, COLLECTIONS.ACTION_HISTORY),
        where('userId', '==', userId),
        where('action', '==', actionType),
        where('timestamp', '>=', Timestamp.fromMillis(todayStart))
      );
      
      const dailySnapshot = await getDocs(dailyQuery);
      if (dailySnapshot.size >= limits.maxPerDay) {
        console.warn(`User ${userId} has reached daily limit for action ${actionType}`);
        return true;
      }
    }
    
    // Check hourly limit
    if (limits.maxPerHour) {
      const hourlyQuery = query(
        collection(db, COLLECTIONS.ACTION_HISTORY),
        where('userId', '==', userId),
        where('action', '==', actionType),
        where('timestamp', '>=', Timestamp.fromMillis(hourStart))
      );
      
      const hourlySnapshot = await getDocs(hourlyQuery);
      if (hourlySnapshot.size >= limits.maxPerHour) {
        console.warn(`User ${userId} has reached hourly limit for action ${actionType}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking rate limits:', error);
    // In case of error, assume not rate-limited to prevent blocking legitimate actions
    return false;
  }
};

/**
 * Checks if user has already received login points today
 * @param userId User ID to check
 * @returns Boolean indicating if login points were already received today
 */
export const hasReceivedLoginPointsToday = async (userId: string): Promise<boolean> => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();
    if (!currentUser || currentUser.uid !== userId) {
      console.warn('Cannot check login points: Authentication failed');
      return false;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Look for LOGIN action today
    const loginQuery = query(
      collection(db, COLLECTIONS.ACTION_HISTORY),
      where('userId', '==', userId),
      where('action', '==', 'LOGIN'),
      where('timestamp', '>=', Timestamp.fromMillis(todayStart))
    );
    
    const snapshot = await getDocs(loginQuery);
    return snapshot.size > 0;
  } catch (error) {
    console.error('Error checking login points:', error);
    return false;
  }
};

/**
 * Get the user's current streak (days of consecutive logins)
 * @param userId User ID to check
 * @returns Number of consecutive days logged in
 */
export const getCurrentStreak = async (userId: string): Promise<number> => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();
    if (!currentUser || currentUser.uid !== userId) {
      console.warn('Cannot get streak: Authentication failed');
      return 0;
    }

    const stats = await getUserStats(userId);
    if (!stats) return 0;
    
    // Get the last login date from the history
    const loginHistoryQuery = query(
      collection(db, COLLECTIONS.ACTION_HISTORY),
      where('userId', '==', userId),
      where('action', '==', 'LOGIN'),
      orderBy('timestamp', 'desc'),
      limit(2) // Get the last 2 logins to check if they're consecutive days
    );
    
    const snapshot = await getDocs(loginHistoryQuery);
    if (snapshot.empty) return 0;
    
    // If there's only one login, the streak is 1
    if (snapshot.size === 1) {
      // Check if it's today
      const login = snapshot.docs[0].data();
      const loginDate = login.timestamp?.toDate() || new Date();
      const today = new Date();
      
      if (
        loginDate.getDate() === today.getDate() &&
        loginDate.getMonth() === today.getMonth() &&
        loginDate.getFullYear() === today.getFullYear()
      ) {
        return stats.currentStreak || 1;
      }
      
      return 0; // Not today, streak broken
    }
    
    return stats.currentStreak || 0;
  } catch (error) {
    console.error('Error getting current streak:', error);
    return 0;
  }
};

/**
 * Update user stats with a gamification action
 * @param userId User ID to update
 * @param action The gamification action performed
 * @returns Object with new stats, XP gained, and new badges
 */
export const updateUserStats = async (
  userId: string, 
  action: GamificationAction
): Promise<{ 
  newStats: UserStats, 
  xpGained: number, 
  newBadges: Badge[] 
}> => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();
    if (!currentUser || currentUser.uid !== userId) {
      console.warn('Cannot update stats: Authentication failed');
      const fallbackStats = await initializeOrGetUserStats(userId);
      return { newStats: fallbackStats, xpGained: 0, newBadges: [] };
    }

    // Rate limiting check
    const isRateLimited = await isActionRateLimited(userId, action);
    if (isRateLimited) {
      console.warn(`Action ${action.type} rate-limited for user ${userId}`);
      return { newStats: await initializeOrGetUserStats(userId), xpGained: 0, newBadges: [] };
    }
    
    // For LOGIN action, check if user already received points today
    if (action.type === 'LOGIN') {
      const alreadyReceived = await hasReceivedLoginPointsToday(userId);
      if (alreadyReceived) {
        console.log(`User ${userId} already received login points today`);
        const stats = await initializeOrGetUserStats(userId);
        return { newStats: stats, xpGained: 0, newBadges: [] };
      }
    }
    
    // Get current stats or initialize
    let stats = await initializeOrGetUserStats(userId);
    
    // Initialize default values
    let xpGained = 0;
    const newBadges: Badge[] = [];
    
    // Apply action changes
    switch (action.type) {
      case 'CREATE_INCIDENT':
        stats.incidentsCreated += 1;
        xpGained = ACTION_POINTS.CREATE_INCIDENT;
        if (action.severity === 'critical') {
          xpGained *= 1.5; // Plus de points pour incidents critiques
        }
        break;
        
      case 'RESOLVE_INCIDENT':
        stats.incidentsResolved += 1;
        if (action.severity === 'critical') {
          stats.criticalIncidentsResolved += 1;
          xpGained = ACTION_POINTS.RESOLVE_CRITICAL_INCIDENT;
        } else {
          xpGained = ACTION_POINTS.RESOLVE_INCIDENT;
        }
        
        // Mettre à jour le temps moyen de résolution
        if (action.resolutionTime) {
          const totalResolutionTime = stats.avgResolutionTime * (stats.incidentsResolved - 1) + action.resolutionTime;
          stats.avgResolutionTime = totalResolutionTime / stats.incidentsResolved;
        }
        break;
        
      case 'CREATE_MAINTENANCE':
        stats.maintenanceCreated += 1;
        xpGained = ACTION_POINTS.CREATE_MAINTENANCE;
        break;
        
      case 'COMPLETE_MAINTENANCE':
        stats.maintenanceCompleted += 1;
        xpGained = ACTION_POINTS.COMPLETE_MAINTENANCE;
        if (action.beforeSchedule) {
          stats.quickMaintenanceCompleted += 1;
          xpGained += ACTION_POINTS.EXPEDITE_MAINTENANCE;
        }
        break;
        
      case 'COMPLETE_QUALITY_CHECK':
        stats.qualityChecksCompleted += 1;
        xpGained = ACTION_POINTS.COMPLETE_QUALITY_CHECK;
        
        // Mettre à jour le score moyen de qualité
        const totalQualityScore = stats.avgQualityScore * (stats.qualityChecksCompleted - 1) + action.score;
        stats.avgQualityScore = totalQualityScore / stats.qualityChecksCompleted;
        
        if (action.score > 90) {
          stats.highQualityChecks += 1;
          xpGained += ACTION_POINTS.HIGH_QUALITY_SCORE;
        }
        break;
        
      case 'REGISTER_LOST_ITEM':
        stats.lostItemsRegistered += 1;
        xpGained = ACTION_POINTS.REGISTER_LOST_ITEM;
        break;
        
      case 'RETURN_LOST_ITEM':
        stats.lostItemsReturned += 1;
        xpGained = ACTION_POINTS.RETURN_LOST_ITEM;
        break;
        
      case 'CREATE_PROCEDURE':
        stats.proceduresCreated += 1;
        xpGained = ACTION_POINTS.CREATE_PROCEDURE;
        break;
        
      case 'READ_PROCEDURE':
        stats.proceduresRead += 1;
        xpGained = ACTION_POINTS.READ_PROCEDURE;
        break;
        
      case 'VALIDATE_PROCEDURE':
        stats.proceduresValidated += 1;
        xpGained = ACTION_POINTS.VALIDATE_PROCEDURE;
        break;
        
      case 'LOGIN':
        stats.totalLogins += 1;
        xpGained = ACTION_POINTS.FIRST_LOGIN_OF_DAY;
        
        // Vérifier les connexions consécutives
        const today = new Date();
        
        // If no last login date, or it's the first login, set it to today and streak to 1
        if (!stats.lastLoginDate) {
          stats.lastLoginDate = today.toISOString();
          stats.currentStreak = 1;
          stats.consecutiveLogins = 1;
        } else {
          const lastLogin = new Date(stats.lastLoginDate);
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          
          if (lastLogin.toDateString() === yesterday.toDateString()) {
            // Consecutive login (yesterday)
            stats.consecutiveLogins += 1;
            stats.currentStreak += 1;
            xpGained += ACTION_POINTS.CONSECUTIVE_DAY_LOGIN;
            
            if (stats.currentStreak > stats.longestStreak) {
              stats.longestStreak = stats.currentStreak;
            }
          } else if (lastLogin.toDateString() === today.toDateString()) {
            // Already logged in today, no additional streak
            // Don't increment streak or award points
            xpGained = 0;
          } else {
            // Not consecutive, reset streak
            stats.consecutiveLogins = 1;
            stats.currentStreak = 1;
          }
          
          stats.lastLoginDate = today.toISOString();
        }
        break;
        
      case 'HELP_COLLEAGUE':
        stats.helpProvided += 1;
        xpGained = ACTION_POINTS.HELP_COLLEAGUE;
        break;
        
      case 'RECEIVE_THANKS':
        stats.thanksReceived += 1;
        xpGained = ACTION_POINTS.RECEIVE_THANKS;
        break;
        
      case 'COMPLETE_WEEKLY_GOAL':
        stats.weeklyGoalsCompleted += 1;
        xpGained = ACTION_POINTS.WEEKLY_GOAL_COMPLETION;
        break;
    }
    
    // Add XP gained
    stats.xp += xpGained;
    
    // Update level
    stats.level = calculateLevel(stats.xp);
    
    // Update last updated timestamp
    stats.lastUpdated = new Date().toISOString();
    
    // Check for newly unlocked badges
    const currentBadges = new Set(stats.badges);
    
    BADGES.forEach(badge => {
      if (!currentBadges.has(badge.id) && badge.condition(stats)) {
        currentBadges.add(badge.id);
        newBadges.push(badge);
      }
    });
    
    // Update badges
    stats.badges = Array.from(currentBadges);
    
    try {
      // Save updated stats to Firebase
      const userStatsRef = doc(db, COLLECTIONS.USER_STATS, userId);
      await setDoc(userStatsRef, stats, { merge: true });
      
      // Record action in history
      await recordActionHistory(userId, action, xpGained, {
        newLevel: stats.level,
        newBadges: newBadges.map(b => b.id),
        totalXp: stats.xp
      });
      
      console.log(`Successfully updated stats for user ${userId}`);
    } catch (saveError) {
      console.error('Error saving updated stats to Firebase:', saveError);
      // Continue with local stats even if save fails
    }
    
    return { newStats: stats, xpGained, newBadges };
  } catch (error) {
    console.error('Error updating user stats:', error);
    
    // Fallback to returning the original stats to avoid breaking the application
    const fallbackStats = await initializeOrGetUserStats(userId);
    return { newStats: fallbackStats, xpGained: 0, newBadges: [] };
  }
};

/**
 * Get user badges from Firebase
 * @param userId User ID to get badges for
 * @returns Array of Badge objects
 */
export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();
    if (!currentUser || currentUser.uid !== userId) {
      console.warn('Cannot get badges: Authentication failed');
      return [];
    }

    const stats = await getUserStats(userId);
    if (!stats) return [];
    
    return BADGES.filter(badge => 
      stats.badges.includes(badge.id) || 
      (!badge.hidden && badge.condition(stats))
    );
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
};

/**
 * Get user level and progress
 * @param userId User ID to get level for
 * @returns Object with level, progress percentage, and level info
 */
export const getUserLevel = async (userId: string) => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();
    if (!currentUser || currentUser.uid !== userId) {
      console.warn('Cannot get level: Authentication failed');
      return { level: 1, progress: 0, levelInfo: EXPERIENCE_LEVELS[0] };
    }

    const stats = await getUserStats(userId);
    if (!stats) return { level: 1, progress: 0, levelInfo: EXPERIENCE_LEVELS[0] };
    
    const level = stats.level;
    const progress = calculateLevelProgress(stats.xp);
    const levelInfo = EXPERIENCE_LEVELS.find(l => l.level === level) || EXPERIENCE_LEVELS[0];
    
    return { level, progress, levelInfo };
  } catch (error) {
    console.error('Error getting user level:', error);
    return { level: 1, progress: 0, levelInfo: EXPERIENCE_LEVELS[0] };
  }
};

/**
 * Calculate user rank among all users
 * @param userId User ID to get rank for
 * @returns Object with rank information
 */
export const getUserRank = async (userId: string) => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();
    if (!currentUser || currentUser.uid !== userId) {
      console.warn('Cannot get rank: Authentication failed');
      return { rank: "Bronze", points: 0, nextRank: "Argent", pointsNeeded: 1000 };
    }

    const stats = await getUserStats(userId);
    if (!stats) return { rank: "Bronze", points: 0, nextRank: "Argent", pointsNeeded: 1000 };
    
    const ranks = [
      { name: "Bronze", minPoints: 0, maxPoints: 999 },
      { name: "Argent", minPoints: 1000, maxPoints: 2999 },
      { name: "Or", minPoints: 3000, maxPoints: 7999 },
      { name: "Platine", minPoints: 8000, maxPoints: 14999 },
      { name: "Diamant", minPoints: 15000, maxPoints: 29999 },
      { name: "Champion", minPoints: 30000, maxPoints: Infinity },
    ];
    
    // Points based on XP, badges and contributions
    const points = stats.xp + (stats.badges.length * 100) + 
      (stats.incidentsResolved * 10) + (stats.maintenanceCompleted * 10) + 
      (stats.qualityChecksCompleted * 15) + (stats.lostItemsReturned * 5) + 
      (stats.proceduresCreated * 20);
    
    // Find the current rank
    let currentRank = ranks[0];
    let nextRank = ranks[1];
    
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (points >= ranks[i].minPoints) {
        currentRank = ranks[i];
        nextRank = i < ranks.length - 1 ? ranks[i + 1] : ranks[i];
        break;
      }
    }
    
    const pointsNeeded = nextRank.minPoints - points;
    
    return {
      rank: currentRank.name,
      points,
      nextRank: nextRank.name === currentRank.name ? "Max" : nextRank.name,
      pointsNeeded: pointsNeeded <= 0 ? 0 : pointsNeeded
    };
  } catch (error) {
    console.error('Error getting user rank:', error);
    return { rank: "Bronze", points: 0, nextRank: "Argent", pointsNeeded: 1000 };
  }
};

/**
 * Get user challenges and progress
 * @param userId User ID to get challenges for
 * @returns Object with challenges array and progress map
 */
export const getUserChallenges = async (userId: string) => {
  try {
    // Ensure user is authenticated
    const currentUser = await ensureAuthenticated();
    if (!currentUser || currentUser.uid !== userId) {
      console.warn('Cannot get challenges: Authentication failed');
      return { challenges: [], progress: {} };
    }

    const stats = await getUserStats(userId);
    if (!stats) return { challenges: [], progress: {} };
    
    // Using the existing function to generate challenges
    // This would ideally be replaced with challenges from a database
    const challenges = generateWeeklyChallenges();
    
    const progress = challenges.reduce((acc, challenge) => {
      acc[challenge.id] = challenge.progress(stats);
      return acc;
    }, {} as { [id: string]: number });
    
    return { challenges, progress };
  } catch (error) {
    console.error('Error getting user challenges:', error);
    return { challenges: [], progress: {} };
  }
};

// Temp function to simulate weekly challenges - would be replaced with DB logic
const generateWeeklyChallenges = (): Challenge[] => {
  const currentDate = new Date();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return [
    {
      id: 'weekly_incidents',
      title: 'Résolution Efficace',
      description: 'Résoudre 5 incidents cette semaine',
      icon: '🚨',
      xpReward: 100,
      startDate: startOfWeek,
      endDate: endOfWeek,
      condition: (stats) => stats.incidentsResolved >= 5,
      progress: (stats) => Math.min(Math.floor((stats.incidentsResolved / 5) * 100), 100),
      target: 5,
      moduleId: 'mod2'
    },
    {
      id: 'weekly_maintenance',
      title: 'Technicien de la Semaine',
      description: 'Compléter 3 maintenances cette semaine',
      icon: '🔧',
      xpReward: 80,
      startDate: startOfWeek,
      endDate: endOfWeek,
      condition: (stats) => stats.maintenanceCompleted >= 3,
      progress: (stats) => Math.min(Math.floor((stats.maintenanceCompleted / 3) * 100), 100),
      target: 3,
      moduleId: 'mod3'
    },
    {
      id: 'weekly_quality',
      title: 'Excellence Qualité',
      description: 'Effectuer 2 contrôles qualité avec un score > 90%',
      icon: '📋',
      xpReward: 120,
      startDate: startOfWeek,
      endDate: endOfWeek,
      condition: (stats) => stats.highQualityChecks >= 2,
      progress: (stats) => Math.min(Math.floor((stats.highQualityChecks / 2) * 100), 100),
      target: 2,
      moduleId: 'mod4'
    },
    {
      id: 'weekly_login',
      title: 'Présence Assidue',
      description: 'Se connecter 5 jours cette semaine',
      icon: '📆',
      xpReward: 50,
      startDate: startOfWeek,
      endDate: endOfWeek,
      condition: (stats) => stats.consecutiveLogins >= 5,
      progress: (stats) => Math.min(Math.floor((stats.consecutiveLogins / 5) * 100), 100),
      target: 5
    },
    {
      id: 'weekly_procedures',
      title: 'Lecteur Informé',
      description: 'Lire et valider 3 procédures cette semaine',
      icon: '📚',
      xpReward: 75,
      startDate: startOfWeek,
      endDate: endOfWeek,
      condition: (stats) => stats.proceduresValidated >= 3,
      progress: (stats) => Math.min(Math.floor((stats.proceduresValidated / 3) * 100), 100),
      target: 3,
      moduleId: 'mod6'
    }
  ];
};

// Export a service object with all the functions
export const FirebaseGamificationService = {
  getUserStats,
  initializeOrGetUserStats,
  updateUserStats,
  getUserBadges,
  getUserLevel,
  getUserRank,
  getUserChallenges,
  recordActionHistory,
  hasReceivedLoginPointsToday,
  isActionRateLimited
};