import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getCurrentTechnician } from '@/lib/technician-auth';
import { updateTechnician, updateTechnicianAvailability } from '@/lib/db/technicians';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Save } from 'lucide-react';

const TechnicianSettings = () => {
  const technician = getCurrentTechnician();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [available, setAvailable] = useState(technician?.available || false);
  const [hourlyRate, setHourlyRate] = useState(technician?.hourlyRate?.toString() || '');
  const [phone, setPhone] = useState(technician?.phone || '');
  
  const { toast } = useToast();
  
  // Initialize form with technician data
  useEffect(() => {
    if (technician) {
      setAvailable(technician.available || false);
      setHourlyRate(technician.hourlyRate?.toString() || '');
      setPhone(technician.phone || '');
    }
  }, [technician]);
  
  // Handle availability toggle
  const handleAvailabilityChange = async (newValue: boolean) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (!technician) {
        throw new Error("Informations technicien non disponibles");
      }
      
      await updateTechnicianAvailability(technician.id, newValue);
      
      setAvailable(newValue);
      technician.available = newValue; // Update local cache
      localStorage.setItem('technicianAuth', JSON.stringify({
        technician,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
      
      toast({
        title: newValue ? "Disponibilité activée" : "Disponibilité désactivée",
        description: newValue 
          ? "Vous êtes maintenant disponible pour recevoir des demandes de devis" 
          : "Vous ne recevrez plus de nouvelles demandes de devis"
      });
      
      setSuccess("Disponibilité mise à jour avec succès");
    } catch (error) {
      console.error('Error updating availability:', error);
      setError("Une erreur est survenue lors de la mise à jour de votre disponibilité");
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre disponibilité",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle save settings
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (!technician) {
        throw new Error("Informations technicien non disponibles");
      }
      
      // Validate hourly rate if provided
      if (hourlyRate && isNaN(parseFloat(hourlyRate))) {
        setError("Le taux horaire doit être un nombre valide");
        return;
      }
      
      // Update technician data
      const updatedTechnician = {
        ...technician,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        phone,
        available
      };
      
      await updateTechnician(technician.id, updatedTechnician);
      
      // Update local storage
      localStorage.setItem('technicianAuth', JSON.stringify({
        technician: updatedTechnician,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));
      
      toast({
        title: "Paramètres enregistrés",
        description: "Vos paramètres ont été mis à jour avec succès",
      });
      
      setSuccess("Paramètres mis à jour avec succès");
    } catch (error) {
      console.error('Error updating settings:', error);
      setError("Une erreur est survenue lors de la mise à jour de vos paramètres");
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos paramètres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">Gérez vos informations et préférences</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Disponibilité</CardTitle>
          <CardDescription>
            Indiquez si vous êtes disponible pour recevoir de nouvelles demandes de devis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">Status de disponibilité</h3>
              <p className="text-sm text-muted-foreground">
                Lorsque vous êtes indisponible, vous ne recevrez pas de nouvelles demandes de devis
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="availability" 
                checked={available} 
                onCheckedChange={handleAvailabilityChange}
                disabled={loading}
              />
              <Label htmlFor="availability">
                {available ? 'Disponible' : 'Indisponible'}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Informations de contact</CardTitle>
          <CardDescription>
            Mettez à jour vos informations et tarifs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-800 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <div className="text-sm">{error}</div>
              </div>
            )}
            
            {success && !error && (
              <div className="p-3 rounded-md bg-green-50 text-green-800 flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <div className="text-sm">{success}</div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Taux horaire (€)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="45.00"
              />
              <p className="text-xs text-muted-foreground">
                Il s'agit de votre taux horaire de référence qui pourra être communiqué aux clients
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
              
              <Button
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianSettings;