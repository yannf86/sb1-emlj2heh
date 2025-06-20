import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, BarChart, BadgeCheck, Crown, Target } from 'lucide-react';
import { GamificationProvider, useGamification } from '@/components/gamification/GamificationContext';
import GamificationStats from '@/components/gamification/GamificationStats';
import ProfileSummary from '@/components/gamification/ProfileSummary';
import WeeklyChallenges from '@/components/gamification/WeeklyChallenges';
import Leaderboard from '@/components/gamification/Leaderboard';
import BadgesGallery from '@/components/gamification/BadgesGallery';
import RecentBadgeToast from '@/components/gamification/RecentBadgeToast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

// Wrapper component to use hooks
const GamificationContent = () => {
  const { performAction, loading } = useGamification();
  const [hasTriggeredLogin, setHasTriggeredLogin] = useState(false);
  
  // Déclencher l'action de login une seule fois par session
  useEffect(() => {
    const hasLoggedToday = sessionStorage.getItem('gamification_logged_today');
    
    if (!hasLoggedToday && !hasTriggeredLogin) {
      performAction({ type: 'LOGIN' });
      // Marquer comme connecté aujourd'hui dans la session
      sessionStorage.setItem('gamification_logged_today', new Date().toISOString());
      setHasTriggeredLogin(true);
    }
  }, [performAction, hasTriggeredLogin]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
          <p className="text-lg font-medium">Chargement de vos données de gamification...</p>
          <p className="text-sm text-muted-foreground mt-2">Veuillez patienter pendant que nous récupérons vos statistiques et badges.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Centre de Gamification</h1>
        <p className="text-muted-foreground">Suivez votre progression, débloquez des badges et relevez des défis</p>
      </div>
      
      {/* Overview Stats */}
      <GamificationStats />
      
      {/* Main Content */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="profile" className="flex items-center">
            <Crown className="h-4 w-4 mr-2" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center">
            <Award className="h-4 w-4 mr-2" />
            <span>Badges</span>
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center">
            <Target className="h-4 w-4 mr-2" />
            <span>Défis</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            <span>Classement</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProfileSummary />
            <div className="col-span-1 md:col-span-2">
              <WeeklyChallenges limit={3} />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Leaderboard />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="badges" className="mt-6">
          <BadgesGallery />
        </TabsContent>
        
        <TabsContent value="challenges" className="mt-6">
          <div className="space-y-6">
            <WeeklyChallenges />
          </div>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="mt-6">
          <div className="space-y-6">
            <Leaderboard />
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Toast for badge notifications */}
      <RecentBadgeToast />
    </div>
  );
};

// Main component with provider
const GamificationPage = () => {
  return (
    <GamificationProvider>
      <GamificationContent />
    </GamificationProvider>
  );
};

export default GamificationPage;