import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HotelParameterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  hotelId: string;
  hotelName: string;
  parameters: any[];
  selectedParams: string[];
  onSave: (selectedParams: string[]) => void;
  saving?: boolean;
}

const HotelParameterDialog: React.FC<HotelParameterDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  hotelId,
  hotelName,
  parameters,
  selectedParams,
  onSave,
  saving = false
}) => {
  const [localSelectedParams, setLocalSelectedParams] = React.useState<string[]>(selectedParams);
  const { toast } = useToast();
  
  // Handle parameter toggle
  const handleToggleParam = (paramId: string) => {
    setLocalSelectedParams(prev => {
      if (prev.includes(paramId)) {
        return prev.filter(id => id !== paramId);
      } else {
        return [...prev, paramId];
      }
    });
  };
  
  // Handle save
  const handleSave = () => {
    onSave(localSelectedParams);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center mb-4 bg-brand-50 dark:bg-brand-900 rounded-lg px-3 py-2">
            <Building className="h-5 w-5 mr-2 text-brand-500" />
            <span className="font-medium">{hotelName}</span>
          </div>
          
          <div className="space-y-4">
            {parameters.map(param => (
              <div key={param.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <Label htmlFor={param.id} className="cursor-pointer">
                    {param.label}
                  </Label>
                </div>
                <Switch
                  id={param.id}
                  checked={localSelectedParams.includes(param.id)}
                  onCheckedChange={() => handleToggleParam(param.id)}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HotelParameterDialog;