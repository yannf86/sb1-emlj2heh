import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Trophy, RefreshCw, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const GamificationTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for gamification settings
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [showPopup, setShowPopup] = useState(true);
  const [showBadges, setShowBadges] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [xpRate, setXpRate] = useState("1");
  
  // Load settings from local storage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('gamificationSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setGamificationEnabled(settings.enabled !== false);
        setShowPopup(settings.showPopup !== false);
        setShowBadges(settings.showBadges !== false);
        setShowLeaderboard(settings.showLeaderboard !== false);
        setXpRate(settings.xpRate || "1");
      }
    } catch (error) {
      console.error("Error loading gamification settings:", error);
    }
  }, []);
  
  // Save settings
  const saveSettings = () => {
    try {
      // Save to localStorage
      const settings = {
        enabled: gamificationEnabled,
        showPopup,
        showBadges,
        showLeaderboard,
        xpRate
      };
      localStorage.setItem('gamificationSettings', JSON.stringify(settings));
      
      // Show success toast
      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres de gamification ont été mis à jour avec succès",
      });
    } catch (error) {
      console.error("Error saving gamification settings:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement des paramètres",
        variant: "destructive",
      });
    }
  };
  
  // Reset settings to defaults
  const resetSettings = () => {
    setGamificationEnabled(true);
    setShowPopup(true);
    setShowBadges(true);
    setShowLeaderboard(true);
    setXpRate("1");
    
    // Remove from localStorage
    localStorage.removeItem('gamificationSettings');
    
    toast({
      title: "Paramètres réinitialisés",
      description: "Les paramètres de gamification ont été réinitialisés aux valeurs par défaut",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres de Gamification</CardTitle>
        <CardDescription>
          Configurer le système de points, badges et récompenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200">Configuration avancée</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Le module de configuration de gamification est disponible dans une section dédiée pour une gestion plus précise des paramètres.
              </p>
            </div>
          </div>
        </div>
        
        <Button size="lg" onClick={() => navigate('/settings/gamification-config')}>
          <Trophy className="mr-2 h-5 w-5" />
          Accéder à la configuration de la gamification
        </Button>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="xp-rate">Taux d'XP global</Label>
            <div className="flex items-center space-x-2">
              <Input 
                id="xp-rate" 
                type="number" 
                value={xpRate}
                onChange={(e) => setXpRate(e.target.value)}
                min="0.1" 
                max="5.0" 
                step="0.1" 
              />
              <span className="text-sm text-muted-foreground">×</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Multiplicateur appliqué à tous les gains d'XP
            </p>
          </div>
          
          <div className="space-y-6">
            <Label className="block mb-2">Système de gamification</Label>
            <div className="flex items-center space-x-2">
              <Switch 
                id="gamification-active" 
                checked={gamificationEnabled}
                onCheckedChange={setGamificationEnabled}
              />
              <Label htmlFor="gamification-active">
                Activer la gamification
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch 
                id="show-popup" 
                checked={showPopup}
                onCheckedChange={setShowPopup} 
                disabled={!gamificationEnabled}
              />
              <Label htmlFor="show-popup" className={!gamificationEnabled ? "text-muted-foreground" : ""}>
                Afficher les notifications de points XP
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="show-badges" 
                checked={showBadges}
                onCheckedChange={setShowBadges}
                disabled={!gamificationEnabled}
              />
              <Label htmlFor="show-badges" className={!gamificationEnabled ? "text-muted-foreground" : ""}>
                Afficher les notifications de badges
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="show-leaderboard" 
                checked={showLeaderboard}
                onCheckedChange={setShowLeaderboard}
                disabled={!gamificationEnabled}
              />
              <Label htmlFor="show-leaderboard" className={!gamificationEnabled ? "text-muted-foreground" : ""}>
                Activer le classement
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <Button variant="outline" onClick={resetSettings}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Réinitialiser les paramètres
        </Button>
        <Button onClick={saveSettings}>
          <Save className="mr-2 h-4 w-4" />
          Enregistrer
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GamificationTab;