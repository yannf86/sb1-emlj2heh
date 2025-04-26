import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Award, BarChart, BadgeCheck, Crown, Target } from 'lucide-react';
import ProfileSummary from './ProfileSummary';
import WeeklyChallenges from './WeeklyChallenges';
import Leaderboard from './Leaderboard';
import BadgesGallery from './BadgesGallery';

const GamificationPanel: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="profile" className="flex-1 flex flex-col">
        <div className="border-b px-4 py-2">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center">
              <Crown className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center">
              <Award className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center">
              <Target className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Défis</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Classement</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <TabsContent value="profile" className="mt-0 h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProfileSummary />
              <div className="col-span-1 md:col-span-2">
                <WeeklyChallenges limit={3} />
              </div>
              <div className="col-span-1 md:col-span-2">
                <Leaderboard />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="badges" className="mt-0">
            <BadgesGallery />
          </TabsContent>
          
          <TabsContent value="challenges" className="mt-0">
            <div className="space-y-4">
              <WeeklyChallenges />
            </div>
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-0">
            <div className="space-y-4">
              <Leaderboard />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default GamificationPanel;