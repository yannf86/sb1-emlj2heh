import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadToSupabase, deleteFromSupabase } from '@/lib/supabase';
import { Maintenance } from './types/maintenance.types';
import { getTechniciansByHotel } from '@/lib/db/technicians';

interface QuoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance: Maintenance;
  onSave: (quoteData: any) => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({
  isOpen,
  onClose,
  maintenance,
  onSave
}) => {
  const [quoteAmount, setQuoteAmount] = useState<string>('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  
  const { toast } = useToast();

  // Load technicians for this hotel
  useEffect(() => {
    const loadTechnicians = async () => {
      if (!maintenance.hotelId) return;
      
      try {
        setLoading(true);
        const technicianData = await getTechniciansByHotel(maintenance.hotelId);
        setTechnicians(technicianData);
      } catch (error) {
        console.error('Error loading technicians:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des techniciens",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadTechnicians();
  }, [maintenance.hotelId, toast]);

  // Initialize form with existing data if available
  useEffect(() => {
    if (maintenance) {
      setQuoteAmount(maintenance.quoteAmount?.toString() || '');
      setComments('');
      setQuoteFile(null);
    }
  }, [maintenance]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max for quote documents)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille du fichier ne doit pas dépasser 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setQuoteFile(file);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setQuoteFile(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setUploading(true);
      
      // Validate amount if provided
      if (quoteAmount && isNaN(parseFloat(quoteAmount))) {
        toast({
          title: "Montant invalide",
          description: "Veuillez entrer un montant valide",
          variant: "destructive"
        });
        return;
      }

      let quoteUrl = maintenance.quoteUrl;
      
      // Upload new quote file if provided
      if (quoteFile) {
        // Delete existing quote file if any
        if (maintenance.quoteUrl) {
          await deleteFromSupabase(maintenance.quoteUrl);
        }
        
        // Upload new file to Supabase
        quoteUrl = await uploadToSupabase(quoteFile, 'devis');
      }
      
      // Prepare quote data
      const quoteData = {
        quoteAmount: quoteAmount ? parseFloat(quoteAmount) : null,
        quoteUrl: quoteUrl,
        quoteStatus: 'pending',
        technicianId: selectedTechnicianId || null,
        comments: comments || null,
        updatedAt: new Date().toISOString()
      };
      
      // Save quote data
      await onSave(quoteData);
      
      toast({
        title: "Devis ajouté",
        description: "Le devis a été ajouté avec succès",
      });
      
      // Close the form
      onClose();
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du devis",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un devis</DialogTitle>
          <DialogDescription>
            Ajoutez un devis pour l'intervention technique
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Quote Amount */}
          <div className="space-y-2">
            <Label htmlFor="quoteAmount">Montant du devis (€)</Label>
            <Input
              id="quoteAmount"
              type="number"
              step="0.01"
              min="0"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          
          {/* Technician Selection */}
          <div className="space-y-2">
            <Label htmlFor="technicianId">Technicien</Label>
            <Select
              value={selectedTechnicianId}
              onValueChange={setSelectedTechnicianId}
              disabled={loading}
            >
              <SelectTrigger id="technicianId">
                <SelectValue placeholder={loading ? "Chargement..." : "Sélectionnez un technicien"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun technicien assigné</SelectItem>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name} {tech.company ? `(${tech.company})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="quoteFile">Document du devis</Label>
            {quoteFile ? (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md border">
                <div>
                  <p className="text-sm font-medium">{quoteFile.name}</p>
                  <p className="text-xs text-slate-500">{(quoteFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-red-500"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="h-8 w-8 mb-2 text-gray-400" />
                    <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOC, DOCX (MAX. 5MB)</p>
                  </div>
                  <input
                    id="quoteFile"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
          </div>
          
          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Commentaires sur le devis</Label>
            <textarea
              id="comments"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Informations supplémentaires sur le devis..."
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer le devis"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteForm;