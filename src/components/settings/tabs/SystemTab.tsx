import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const SystemTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres Système</CardTitle>
        <CardDescription>
          Configurer les paramètres généraux de l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="app-name">Nom de l'Application</Label>
          <Input id="app-name" defaultValue="Creho" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company-name">Nom de l'Entreprise</Label>
          <Input id="company-name" defaultValue="Groupe Hôtelier" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="default-language">Langue par Défaut</Label>
          <Select defaultValue="fr">
            <SelectTrigger id="default-language">
              <SelectValue placeholder="Sélectionner une langue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="timezone">Fuseau Horaire</Label>
          <Select defaultValue="europe-paris">
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Sélectionner un fuseau horaire" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="europe-paris">Europe/Paris (GMT+1)</SelectItem>
              <SelectItem value="utc">UTC</SelectItem>
              <SelectItem value="america-new_york">America/New_York (GMT-5)</SelectItem>
              <SelectItem value="asia-tokyo">Asia/Tokyo (GMT+9)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch id="maintenance-mode" />
          <Label htmlFor="maintenance-mode">Mode Maintenance</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch id="debug-mode" />
          <Label htmlFor="debug-mode">Mode Debug</Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline">Annuler</Button>
        <Button>Enregistrer</Button>
      </CardFooter>
    </Card>
  );
};

export default SystemTab;