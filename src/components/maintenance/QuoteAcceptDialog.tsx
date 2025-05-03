import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Maintenance } from './types/maintenance.types';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface QuoteAcceptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance: Maintenance;
  onUpdateQuoteStatus: (status: 'accepted' | 'rejected', comments?: string) => void;
}

const QuoteAcceptDialog: React.FC<QuoteAcceptDialogProps> = ({
  isOpen,
  onClose,
  maintenance,
  onUpdateQuoteStatus
}) => {
  const [decision, setDecision] = useState<'accepted' | 'rejected' | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDecision(null);
      setComments('');
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!decision) {
      toast({
        title: "Décision requise",
        description: "Veuillez sélectionner une décision (accepter ou refuser)",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await onUpdateQuoteStatus(decision, comments);
      
      toast({
        title: decision === 'accepted' ? "Devis accepté" : "Devis refusé",
        description: decision === 'accepted' 
          ? "Le devis a été accepté et l'intervention peut commencer" 
          : "Le devis a été refusé"
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut du devis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Décision sur le devis</DialogTitle>
          <DialogDescription>
            Acceptez ou refusez le devis pour l'intervention technique
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Quote Details */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Montant:</span>
                <span className="font-bold">{maintenance.quoteAmount} €</span>
              </div>
              {maintenance.technicianId && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Technicien:</span>
                  <span>{maintenance.technicianName || 'Non spécifié'}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Date du devis:</span>
                <span>{formatDate(maintenance.updatedAt)}</span>
              </div>
            </div>
          </div>
          
          {/* Decision Selection */}
          <div className="space-y-2">
            <Label>Décision</Label>
            <RadioGroup value={decision || ''} onValueChange={(value) => setDecision(value as 'accepted' | 'rejected')}>
              <div className="flex items-center space-x-2 p-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <RadioGroupItem value="accepted" id="accept" />
                <Label htmlFor="accept" className="flex items-center cursor-pointer">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  Accepter le devis
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <RadioGroupItem value="rejected" id="reject" />
                <Label htmlFor="reject" className="flex items-center cursor-pointer">
                  <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  Refuser le devis
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Commentaires</Label>
            <textarea
              id="comments"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Commentaires optionnels sur votre décision..."
            />
          </div>
          
          {decision === 'accepted' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Confirmation requise</AlertTitle>
              <AlertDescription>
                En acceptant ce devis, vous autorisez le technicien à commencer les travaux pour un montant de {maintenance.quoteAmount} €.
              </AlertDescription>
            </Alert>
          )}
          
          {decision === 'rejected' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Confirmation de refus</AlertTitle>
              <AlertDescription>
                En refusant ce devis, vous annulez la proposition actuelle. Vous pourrez demander un nouveau devis ultérieurement.
              </AlertDescription>
            </Alert>
          )}
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
            onClick={handleSubmit}
            disabled={!decision || loading}
            variant={decision === 'accepted' ? 'default' : 'destructive'}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Traitement...
              </>
            ) : decision === 'accepted' ? "Accepter le devis" : "Refuser le devis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteAcceptDialog;