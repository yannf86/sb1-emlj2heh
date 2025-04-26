import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, FileUp, Clock, Download, Trash2, Save, RefreshCw } from 'lucide-react';
import { createBackup, listBackups } from '@/lib/backup';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { migrateStaticData, generateTestData } from '@/lib/migration';
import { checkMigrationStatus } from '@/lib/db/parameters-migration';

interface DatabaseTabProps {
  onMigrate: () => Promise<void>;
  migrating: boolean;
}

const DatabaseTab: React.FC<DatabaseTabProps> = ({ onMigrate, migrating }) => {
  const [backups, setBackups] = useState<Array<{ filename: string; path: string; timestamp: Date }>>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const { toast } = useToast();

  // Load backups list and check migration status on mount
  useEffect(() => {
    const loadData = async () => {
      const backupsList = await listBackups();
      setBackups(backupsList);

      const status = await checkMigrationStatus();
      setMigrationStatus(status);
    };
    loadData();
  }, []);

  // Handle create backup
  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      const result = await createBackup();
      if (result.success) {
        toast({
          title: "Sauvegarde créée",
          description: `La sauvegarde a été créée avec succès : ${result.filename}`,
        });
        // Reload backups list
        const backupsList = await listBackups();
        setBackups(backupsList);
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Une erreur est survenue lors de la sauvegarde",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Handle migrate static data
  const handleMigrateData = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateStaticData();
      if (result.success) {
        toast({
          title: "Migration réussie",
          description: "Les données statiques ont été migrées avec succès",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la migration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Handle generate test data
  const handleGenerateTestData = async () => {
    setIsGeneratingData(true);
    try {
      const result = await generateTestData();
      if (result.success) {
        toast({
          title: "Données générées",
          description: "Les données de test ont été générées avec succès",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la génération des données",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingData(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Base de Données</CardTitle>
        <CardDescription>
          Gérer la connexion et les sauvegardes de la base de données
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded-md bg-slate-50 dark:bg-slate-800">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-medium">Informations de Connexion</h3>
              <p className="text-xs text-muted-foreground mt-1">État de la connexion à Firebase</p>
            </div>
            <div className="flex items-center">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></span>
              <span className="text-sm font-medium">Connecté</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium">Firebase</p>
            </div>
            <div>
              <p className="text-muted-foreground">Projet</p>
              <p className="font-medium">app-creho-2</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Migration des paramètres</h3>
          
          {migrationStatus && (
            <div className={`p-4 rounded-md ${
              migrationStatus.migrationComplete 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}>
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 mr-2" />
                <h4 className="font-medium">
                  {migrationStatus.migrationComplete 
                    ? 'Migration terminée'
                    : 'Migration en attente'
                  }
                </h4>
              </div>
              <p className="text-sm">
                {migrationStatus.migrationComplete 
                  ? `${migrationStatus.newCollectionsCount} paramètres migrés dans ${migrationStatus.collectionCounts.length} collections`
                  : `${migrationStatus.oldParametersCount} paramètres à migrer`
                }
              </p>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button 
              onClick={onMigrate} 
              disabled={migrating || migrationStatus?.migrationComplete}
            >
              <Save className="mr-2 h-4 w-4" />
              {migrating ? 'Migration en cours...' : 'Migrer les paramètres'}
            </Button>
            
            <Button 
              onClick={handleMigrateData} 
              disabled={isMigrating}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isMigrating ? 'Migration en cours...' : 'Migrer les données statiques'}
            </Button>
            
            <Button 
              onClick={handleGenerateTestData} 
              disabled={isGeneratingData}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {isGeneratingData ? 'Génération en cours...' : 'Générer des données de test'}
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Archive className="h-5 w-5 mr-2 text-slate-500" />
            Sauvegardes
          </h3>
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleCreateBackup} 
              disabled={isBackingUp}
            >
              <Save className="mr-2 h-4 w-4" />
              {isBackingUp ? 'Sauvegarde en cours...' : 'Créer une sauvegarde'}
            </Button>
            <Button variant="outline">
              <FileUp className="mr-2 h-4 w-4" />
              Restaurer
            </Button>
          </div>
          
          <div className="border rounded-md">
            <div className="px-4 py-3 border-b bg-slate-50 dark:bg-slate-800">
              <h4 className="text-sm font-medium">Historique des sauvegardes</h4>
            </div>
            <div className="divide-y">
              {backups.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucune sauvegarde disponible
                </div>
              ) : (
                backups.map((backup, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Archive className="h-4 w-4 mr-2 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium">{backup.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDate(backup.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseTab;