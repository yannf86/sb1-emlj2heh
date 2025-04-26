import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { hotels, parameters, users, getAvailableStaff } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface QualityVisitFormData {
  visitDate: string;
  startTime: string;
  endTime: string;
  hotelId: string;
  visitorId: string;
  visitTypeId: string;
  remarks?: string;
  actionPlan?: string;
}

interface QualityVisitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QualityVisitFormData) => void;
}

const QualityVisitForm: React.FC<QualityVisitFormProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<QualityVisitFormData>({
    visitDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    endTime: '',
    hotelId: '',
    visitorId: '',
    visitTypeId: '',
    remarks: '',
    actionPlan: ''
  });

  // Get visit type parameters
  const visitTypeParams = parameters.filter(p => p.type === 'visit_type');

  // Get available staff based on selected hotel
  const availableStaff = formData.hotelId ? getAvailableStaff(formData.hotelId) : [];

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate required fields
    if (!formData.visitDate || !formData.hotelId || !formData.visitorId || !formData.visitTypeId) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData);
    onClose();

    // Reset form
    setFormData({
      visitDate: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: '',
      hotelId: '',
      visitorId: '',
      visitTypeId: '',
      remarks: '',
      actionPlan: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle Visite Qualité</DialogTitle>
          <DialogDescription>
            Planifiez une nouvelle visite de contrôle qualité
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visitDate">Date de visite</Label>
              <Input
                id="visitDate"
                name="visitDate"
                type="date"
                value={formData.visitDate}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startTime">Heure de début</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleFormChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotelId">Hôtel</Label>
              <Select 
                name="hotelId" 
                value={formData.hotelId} 
                onValueChange={(value) => handleFormChange({ 
                  target: { name: 'hotelId', value } 
                } as React.ChangeEvent<HTMLSelectElement>)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un hôtel" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="visitTypeId">Type de visite</Label>
              <Select 
                name="visitTypeId" 
                value={formData.visitTypeId} 
                onValueChange={(value) => handleFormChange({ 
                  target: { name: 'visitTypeId', value } 
                } as React.ChangeEvent<HTMLSelectElement>)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {visitTypeParams.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="visitorId">Visiteur</Label>
            <Select 
              name="visitorId" 
              value={formData.visitorId} 
              onValueChange={(value) => handleFormChange({ 
                target: { name: 'visitorId', value } 
              } as React.ChangeEvent<HTMLSelectElement>)}
              disabled={!formData.hotelId}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.hotelId ? "Sélectionnez un visiteur" : "Sélectionnez d'abord un hôtel"} />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarques</Label>
            <textarea
              id="remarks"
              name="remarks"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="Remarques ou notes additionnelles..."
              value={formData.remarks}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="actionPlan">Plan d'action</Label>
            <textarea
              id="actionPlan"
              name="actionPlan"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="Plan d'action à mettre en place..."
              value={formData.actionPlan}
              onChange={handleFormChange}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Créer la visite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QualityVisitForm;