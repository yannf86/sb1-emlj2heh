import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Check, RefreshCw, AlertCircle, Clock, Calendar, Loader2 } from 'lucide-react';
import { getCurrentTechnician } from '@/lib/technician-auth';
import { useToast } from '@/hooks/use-toast';

// In a real application, this would be linked to a backend email system
// For now, we'll mock the email notification preferences
interface EmailPreferences {
  newQuoteRequests: boolean;
  quoteAccepted: boolean;
  quoteRejected: boolean;
  reminderBeforeIntervention: boolean;
  weeklyDigest: boolean;
}

const TechnicianEmailNotifications = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<EmailPreferences>({
    newQuoteRequests: true,
    quoteAccepted: true,
    quoteRejected: true,
    reminderBeforeIntervention: true,
    weeklyDigest: false
  });
  
  const technician = getCurrentTechnician();
  const { toast } = useToast();
  
  // Load preferences from localStorage to simulate persistence
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const savedPrefs = localStorage.getItem('technicianEmailPreferences');
        if (savedPrefs) {
          setPreferences(JSON.parse(savedPrefs));
        }
      } catch (e) {
        console.error('Error loading email preferences', e);
      } finally {
        setLoading(false);
      }
    };
    
    // Simulate API delay
    const timer = setTimeout(() => {
      loadPreferences();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle preference change
  const handlePreferenceChange = (key: keyof EmailPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Save preferences
  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage
      localStorage.setItem('technicianEmailPreferences', JSON.stringify(preferences));
      
      setSuccess("Préférences d'email enregistrées avec succès");
      toast({
        title: "Préférences enregistrées",
        description: "Vos préférences de notification ont été mises à jour",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setError("Une erreur est survenue lors de l'enregistrement de vos préférences");
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Reset to defaults
  const handleResetPreferences = () => {
    setPreferences({
      newQuoteRequests: true,
      quoteAccepted: true,
      quoteRejected: true,
      reminderBeforeIntervention: true,
      weeklyDigest: false
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand-500" />
          <p className="text-lg font-medium">Chargement de vos préférences...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications Email</h1>
        <p className="text-muted-foreground">Gérez les emails que vous recevez concernant vos demandes de devis</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-brand-500" />
            Préférences d'emails
          </CardTitle>
          <CardDescription>
            Configurez quand et pourquoi vous souhaitez être notifié par email
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-800 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <div className="text-sm">{error}</div>
            </div>
          )}
          
          {success && !error && (
            <div className="p-3 rounded-md bg-green-50 text-green-800 flex items-start">
              <Check className="h-5 w-5 mr-2 flex-shrink-0" />
              <div className="text-sm">{success}</div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Nouvelles demandes de devis</div>
                <div className="text-sm text-muted-foreground">
                  Soyez notifié lorsqu'une nouvelle demande de devis vous est envoyée
                </div>
              </div>
              <Switch 
                checked={preferences.newQuoteRequests} 
                onCheckedChange={value => handlePreferenceChange('newQuoteRequests', value)} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Devis acceptés</div>
                <div className="text-sm text-muted-foreground">
                  Recevez une notification quand un client accepte votre devis
                </div>
              </div>
              <Switch 
                checked={preferences.quoteAccepted} 
                onCheckedChange={value => handlePreferenceChange('quoteAccepted', value)} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Devis refusés</div>
                <div className="text-sm text-muted-foreground">
                  Recevez une notification quand un client refuse votre devis
                </div>
              </div>
              <Switch 
                checked={preferences.quoteRejected} 
                onCheckedChange={value => handlePreferenceChange('quoteRejected', value)} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Rappel d'intervention</div>
                <div className="text-sm text-muted-foreground">
                  Recevez un rappel 24h avant vos interventions planifiées
                </div>
              </div>
              <Switch 
                checked={preferences.reminderBeforeIntervention} 
                onCheckedChange={value => handlePreferenceChange('reminderBeforeIntervention', value)} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Résumé hebdomadaire</div>
                <div className="text-sm text-muted-foreground">
                  Recevez un résumé hebdomadaire de vos demandes et interventions
                </div>
              </div>
              <Switch 
                checked={preferences.weeklyDigest} 
                onCheckedChange={value => handlePreferenceChange('weeklyDigest', value)} 
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-4">
          <Button 
            variant="outline" 
            onClick={handleResetPreferences}
            disabled={saving}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
          
          <Button 
            onClick={handleSavePreferences}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-brand-500" />
            Fréquence des notifications
          </CardTitle>
          <CardDescription>
            Contrôlez quand vous recevez des emails pour éviter de surcharger votre boîte mail
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <Label>Regrouper les notifications</Label>
            <select className="w-full border border-gray-300 rounded-md p-2">
              <option value="immediate">Immédiatement</option>
              <option value="hourly">Toutes les heures</option>
              <option value="daily">Résumé quotidien</option>
            </select>
            <p className="text-sm text-muted-foreground">
              Les notifications seront regroupées selon cette fréquence
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianEmailNotifications;