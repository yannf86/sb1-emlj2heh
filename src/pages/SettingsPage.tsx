import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Database, ListChecks, Building, Trophy } from 'lucide-react';
import { 
  ParametersTab, 
  HotelsTab, 
  GamificationTab, 
  SystemTab, 
  DatabaseTab 
} from '@/components/settings/tabs';
import { migrateParameters, checkMigrationStatus } from '@/lib/db/parameters-migration';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const [migrating, setMigrating] = useState(false);
  const { toast } = useToast();

  // Handle migration
  const handleMigration = async () => {
    try {
      setMigrating(true);
      
      // Check current status
      const status = await checkMigrationStatus();
      if (status.success && status.migrationComplete) {
        toast({
          title: "Migration déjà effectuée",
          description: "Les paramètres ont déjà été migrés vers leurs collections respectives.",
        });
        return;
      }

      // Perform migration
      const result = await migrateParameters();
      
      if (result.success) {
        toast({
          title: "Migration réussie",
          description: "Les paramètres ont été migrés avec succès vers leurs collections respectives.",
        });
      } else {
        throw new Error(result.error || "Une erreur est survenue pendant la migration");
      }
    } catch (error) {
      console.error('Error during migration:', error);
      toast({
        title: "Erreur de migration",
        description: error instanceof Error ? error.message : "Une erreur est survenue pendant la migration",
        variant: "destructive",
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">Configuration générale et paramétrages système</p>
        </div>
      </div>
      
      <Tabs defaultValue="parameters">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:w-[800px]">
          <TabsTrigger value="parameters">
            <ListChecks className="mr-2 h-4 w-4" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="hotels">
            <Building className="mr-2 h-4 w-4" />
            Hôtels
          </TabsTrigger>
          <TabsTrigger value="gamification">
            <Trophy className="mr-2 h-4 w-4" />
            Gamification
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="mr-2 h-4 w-4" />
            Système
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="mr-2 h-4 w-4" />
            Base de Données
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="parameters">
          <ParametersTab />
        </TabsContent>
        
        <TabsContent value="hotels">
          <HotelsTab />
        </TabsContent>
        
        <TabsContent value="gamification">
          <GamificationTab />
        </TabsContent>
        
        <TabsContent value="system">
          <SystemTab />
        </TabsContent>
        
        <TabsContent value="database">
          <DatabaseTab onMigrate={handleMigration} migrating={migrating} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;