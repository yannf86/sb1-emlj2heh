import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

interface CompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const CompleteDialog: React.FC<CompleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Valider et passer au jour suivant
          </DialogTitle>
          <DialogDescription>
            Confirmez pour valider cette journée et dupliquer les tâches pour demain
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <p className="text-center font-medium">
            Toutes les tâches sont complétées!
          </p>
          
          <div className="flex justify-center items-center gap-4">
            <div className="p-3 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="h-8 w-8" />
            </div>
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
              <CalendarIcon className="h-8 w-8" />
            </div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            En confirmant, vous allez valider cette journée et créer automatiquement les mêmes tâches pour demain.
          </p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Duplication...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmer et passer à demain
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Custom Calendar icon for dialog
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </svg>
);

export default CompleteDialog;