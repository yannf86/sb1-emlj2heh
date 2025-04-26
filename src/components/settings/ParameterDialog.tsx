import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface ParameterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  data: any;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  type: string;
  additionalFields?: React.ReactNode;
}

const ParameterDialog: React.FC<ParameterDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  data,
  onChange,
  onSave,
  type,
  additionalFields
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={data.label}
              onChange={(e) => onChange('label', e.target.value)}
              placeholder="Label du paramètre"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={data.code}
              onChange={(e) => onChange('code', e.target.value)}
              placeholder="Code unique"
            />
          </div>
          
          {additionalFields}
          
          <div className="space-y-2">
            <Label htmlFor="order">Ordre</Label>
            <Input
              id="order"
              type="number"
              min="1"
              value={data.order}
              onChange={(e) => onChange('order', parseInt(e.target.value))}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={data.active}
              onCheckedChange={(checked) => onChange('active', checked)}
            />
            <Label htmlFor="active">Actif</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ParameterDialog;