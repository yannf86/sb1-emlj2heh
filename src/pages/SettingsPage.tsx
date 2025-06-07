import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, ListChecks, Building, Trophy } from 'lucide-react';
import { 
  ParametersTab, 
  HotelsTab, 
  GamificationTab 
} from '@/components/settings/tabs';
import { getCurrentUser } from '@/lib/auth';

const SettingsPage = () => {
  const currentUser = getCurrentUser();
  
  // Pour déboguer: log du rôle de l'utilisateur actuel
  React.useEffect(() => {
    console.log("Rôle de l'utilisateur actuel:", currentUser?.role);
  }, [currentUser]);
  
  // Check if user is a system administrator (specifically admin role)
  // IMPORTANT: This must check EXACTLY for the 'admin' role
  const isSystemAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">Configuration générale et paramétrages système</p>
        </div>
      </div>
      
      <Tabs defaultValue="parameters">
        <TabsList className={`grid ${isSystemAdmin ? "grid-cols-3" : "grid-cols-1"} lg:w-[600px]`}>
          <TabsTrigger value="parameters">
            <ListChecks className="mr-2 h-4 w-4" />
            Paramètres
          </TabsTrigger>
          
          {/* Les onglets suivants ne sont visibles que pour les admin système */}
          {isSystemAdmin && (
            <>
              <TabsTrigger value="hotels">
                <Building className="mr-2 h-4 w-4" />
                Hôtels
              </TabsTrigger>
              
              <TabsTrigger value="gamification">
                <Trophy className="mr-2 h-4 w-4" />
                Gamification
              </TabsTrigger>
            </>
          )}
        </TabsList>
        
        <TabsContent value="parameters">
          <ParametersTab />
        </TabsContent>
        
        {isSystemAdmin && (
          <>
            <TabsContent value="hotels">
              <HotelsTab />
            </TabsContent>
            
            <TabsContent value="gamification">
              <GamificationTab />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default SettingsPage;