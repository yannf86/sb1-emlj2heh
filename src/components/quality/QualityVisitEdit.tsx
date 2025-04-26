import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { hotels, parameters, users, getAvailableStaff } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface QualityVisitEditProps {
  isOpen: boolean;
  onClose: () => void;
  visit: any;
  onSave: (updatedVisit: any) => void;
}

const QualityVisitEdit: React.FC<QualityVisitEditProps> = ({
  isOpen,
  onClose,
  visit,
  onSave
}) => {
  const [formData, setFormData] = useState({
    ...visit,
    checklist: visit.checklist.map((item: any) => ({ ...item }))
  });
  
  const { toast } = useToast();
  
  // Get parameters by type
  const visitTypeParams = parameters.filter(p => p.type === 'visit_type');
  const qualityCategoryParams = parameters.filter(p => p.type === 'quality_category');
  const qualityItemParams = parameters.filter(p => p.type === 'quality_item');
  
  // Get available staff based on selected hotel
  const availableStaff = getAvailableStaff(formData.hotelId);
  
  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle checklist item changes
  const handleChecklistItemChange = (itemId: string, field: 'result' | 'comment', value: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map((item: any) => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
  };
  
  // Calculate conformity rate
  const calculateConformityRate = () => {
    const applicableItems = formData.checklist.filter((item: any) => item.result !== 'non-applicable');
    const conformeItems = applicableItems.filter((item: any) => item.result === 'conforme');
    return applicableItems.length > 0 
      ? Math.round((conformeItems.length / applicableItems.length) * 100) 
      : 100;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // Calculate new conformity rate
    const conformityRate = calculateConformityRate();
    
    // Update visit with new data
    const updatedVisit = {
      ...formData,
      conformityRate,
      updatedAt: new Date().toISOString()
    };
    
    onSave(updatedVisit);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la visite qualité</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la visite qualité
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
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Heure début</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">Heure fin</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotelId">Hôtel</Label>
              <Select 
                value={formData.hotelId} 
                onValueChange={(value) => handleSelectChange('hotelId', value)}
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
                value={formData.visitTypeId} 
                onValueChange={(value) => handleSelectChange('visitTypeId', value)}
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visitorId">Visiteur</Label>
              <Select 
                value={formData.visitorId} 
                onValueChange={(value) => handleSelectChange('visitorId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un visiteur" />
                </SelectTrigger>
                <SelectContent>
                  {availableStaff.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="localReferentId">Référent local</Label>
              <Select 
                value={formData.localReferentId || "none"} 
                onValueChange={(value) => handleSelectChange('localReferentId', value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un référent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non spécifié</SelectItem>
                  {availableStaff.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Checklist */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-lg font-medium">Liste de contrôle</h3>
            
            {qualityCategoryParams.map(category => {
              const categoryItems = formData.checklist.filter((item: any) => item.categoryId === category.id);
              if (categoryItems.length === 0) return null;
              
              return (
                <div key={category.id} className="space-y-2">
                  <h4 className="font-medium">{category.label}</h4>
                  <div className="border rounded-md divide-y">
                    {categoryItems.map((item: any) => {
                      const itemParamData = qualityItemParams.find(p => p.id === item.itemId);
                      const itemName = itemParamData ? itemParamData.label : item.itemId;
                      
                      return (
                        <div key={item.id} className="p-3 grid grid-cols-12 gap-4 items-start">
                          <div className="col-span-5">
                            <p className="font-medium">{itemName}</p>
                          </div>
                          
                          <div className="col-span-3">
                            <Select 
                              value={item.result} 
                              onValueChange={(value) => handleChecklistItemChange(item.id, 'result', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="conforme">Conforme</SelectItem>
                                <SelectItem value="non-conforme">Non conforme</SelectItem>
                                <SelectItem value="non-applicable">Non applicable</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="col-span-4">
                            <Input
                              placeholder="Commentaire"
                              value={item.comment || ''}
                              onChange={(e) => handleChecklistItemChange(item.id, 'comment', e.target.value)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarques</Label>
            <textarea
              id="remarks"
              name="remarks"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              value={formData.remarks || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="actionPlan">Plan d'action</Label>
            <textarea
              id="actionPlan"
              name="actionPlan"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              value={formData.actionPlan || ''}
              onChange={handleFormChange}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Enregistrer les modifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QualityVisitEdit;