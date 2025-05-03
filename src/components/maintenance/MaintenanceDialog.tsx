import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { 
  Building, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  User, 
  Image, 
  FileUp, 
  Clock, 
  Euro, 
  CalendarRange,
  Check,
  X,
  FileText,
  Edit,
  Trash2,
  History,
  Clock8,
  PlusCircle,
  CheckCircle,
  Star
} from 'lucide-react';
import { Maintenance } from './types/maintenance.types';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';
import { deleteMaintenanceRequest } from '@/lib/db/maintenance';
import { addQuoteToMaintenance, updateQuoteStatus } from '@/lib/db/quotes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import MaintenanceEdit from './MaintenanceEdit';
import QuoteFileDisplay from './QuoteFileDisplay';
import PhotoDisplay from './PhotoDisplay';
import QuoteForm from './QuoteForm';
import QuoteAcceptDialog from './QuoteAcceptDialog';
import { getTechnician } from '@/lib/db/technicians';

// Import DB helper functions
import { getHotelName } from '@/lib/db/hotels';
import { getLocationLabel } from '@/lib/db/parameters-locations';
import { getInterventionTypeLabel } from '@/lib/db/parameters-intervention-type';
import { getStatusLabel } from '@/lib/db/parameters-status';
import { getUserName } from '@/lib/db/users';

interface MaintenanceDialogProps {
  maintenance: Maintenance | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedMaintenance: Maintenance) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const MaintenanceDialog: React.FC<MaintenanceDialogProps> = ({ 
  maintenance, 
  isOpen, 
  onClose,
  onUpdate,
  onEdit,
  onDelete
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [quoteAcceptDialogOpen, setQuoteAcceptDialogOpen] = useState(false);
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});
  const [resolvedLabels, setResolvedLabels] = useState<{[key: string]: string}>({});
  const [technicianData, setTechnicianData] = useState<any>(null);
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // Load user names for history entries
  useEffect(() => {
    if (!maintenance || !maintenance.history) return;

    const loadUserNames = async () => {
      const names: {[key: string]: string} = {};
      const userIds = new Set<string>();

      // Collect all user IDs from history entries
      maintenance.history.forEach((entry: any) => {
        if (entry.userId && !userNames[entry.userId]) {
          userIds.add(entry.userId);
        }
      });

      // Load names for all user IDs
      for (const userId of userIds) {
        try {
          names[userId] = await getUserName(userId);
        } catch (error) {
          console.error(`Error loading user name for ID ${userId}:`, error);
          names[userId] = 'Utilisateur inconnu';
        }
      }

      setUserNames(prev => ({ ...prev, ...names }));
    };

    loadUserNames();
  }, [maintenance, userNames]);

  // Load labels when maintenance changes
  useEffect(() => {
    if (!maintenance) return;

    const loadLabels = async () => {
      try {
        const labels: {[key: string]: string} = {};

        // Load hotel name
        if (maintenance.hotelId) {
          labels.hotelName = await getHotelName(maintenance.hotelId);
        }

        // Load location label
        if (maintenance.locationId) {
          labels.locationLabel = await getLocationLabel(maintenance.locationId);
        }

        // Load intervention type label
        if (maintenance.interventionTypeId) {
          labels.interventionTypeLabel = await getInterventionTypeLabel(maintenance.interventionTypeId);
        }

        // Load status label
        if (maintenance.statusId) {
          labels.statusLabel = await getStatusLabel(maintenance.statusId);
        }

        // Load received by name
        if (maintenance.receivedById) {
          labels.receivedByName = await getUserName(maintenance.receivedById);
        }

        // Load technician name
        if (maintenance.technicianId) {
          labels.technicianName = await getUserName(maintenance.technicianId);
        }

        setResolvedLabels(labels);
      } catch (error) {
        console.error('Error loading labels:', error);
      }
    };

    loadLabels();
  }, [maintenance]);

  // Load technician data if available
  useEffect(() => {
    const loadTechnicianData = async () => {
      if (!maintenance?.technicianId) {
        setTechnicianData(null);
        return;
      }

      try {
        const data = await getTechnician(maintenance.technicianId);
        setTechnicianData(data);
      } catch (error) {
        console.error('Error loading technician data:', error);
        setTechnicianData(null);
      }
    };

    loadTechnicianData();
  }, [maintenance?.technicianId]);

  if (!maintenance) return null;

  // Add quote
  const handleAddQuote = async (quoteData: any) => {
    try {
      setIsProcessing(true);
      await addQuoteToMaintenance(maintenance.id, quoteData);
      
      toast({
        title: "Devis ajouté",
        description: "Le devis a été ajouté avec succès",
      });
      
      // Refresh maintenance data
      if (onUpdate) {
        const updatedMaintenance = {
          ...maintenance,
          quoteAmount: quoteData.quoteAmount ? parseFloat(quoteData.quoteAmount) : null,
          quoteUrl: quoteData.quoteUrl,
          quoteStatus: quoteData.quoteStatus || 'pending',
          technicianId: quoteData.technicianId || maintenance.technicianId,
          updatedAt: new Date().toISOString()
        };
        onUpdate(updatedMaintenance);
      }
      
      setQuoteFormOpen(false);
    } catch (error) {
      console.error('Error adding quote:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du devis",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle quote status update (accept/reject)
  const handleQuoteStatusUpdate = async (status: 'accepted' | 'rejected', comments?: string) => {
    try {
      setIsProcessing(true);
      
      // Use the first quote for now (legacy support)
      await updateQuoteStatus(maintenance.id, 0, status, comments);
      
      toast({
        title: status === 'accepted' ? "Devis accepté" : "Devis refusé",
        description: status === 'accepted' 
          ? "Le devis a été accepté et l'intervention peut commencer" 
          : "Le devis a été refusé"
      });
      
      // Refresh maintenance data
      if (onUpdate) {
        const updatedMaintenance = {
          ...maintenance,
          quoteStatus: status,
          quoteAccepted: status === 'accepted',
          quoteAcceptedDate: status === 'accepted' ? new Date().toISOString() : null,
          quoteAcceptedById: status === 'accepted' ? currentUser?.id : null,
          updatedAt: new Date().toISOString()
        };
        
        // If accepted, also update the status to 'in progress'
        if (status === 'accepted') {
          updatedMaintenance.statusId = 'stat2';  // In progress
        }
        
        onUpdate(updatedMaintenance);
      }
      
      setQuoteAcceptDialogOpen(false);
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut du devis",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle delete maintenance
  const handleDelete = async () => {
    if (!isAdmin) return;
    
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible.');
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await deleteMaintenanceRequest(maintenance!.id);
      toast({
        title: "Intervention supprimée",
        description: "L'intervention technique a été supprimée avec succès",
      });
      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'intervention",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Format history entries for display
  const formatHistoryEntry = (entry: any) => {
    const userName = userNames[entry.userId] || 'Utilisateur inconnu';
    const date = formatDate(new Date(entry.timestamp));
    const time = new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    let actionText = '';
    switch (entry.action) {
      case 'create':
        actionText = 'a créé l\'intervention';
        break;
      case 'update':
        actionText = 'a modifié l\'intervention';
        break;
      case 'delete':
        actionText = 'a supprimé l\'intervention';
        break;
      case 'rate_technician':
        actionText = 'a évalué le technicien';
        break;
      default:
        actionText = 'a effectué une action';
    }
    
    return (
      <div className="space-y-2 border-b pb-2 last:border-0">
        <div className="flex items-center text-sm">
          <User className="h-3.5 w-3.5 mr-1 text-slate-500" />
          <span className="font-medium">{userName}</span>
          <span className="mx-1">{actionText}</span>
          <Clock className="h-3.5 w-3.5 mx-1 text-slate-500" />
          <span className="text-muted-foreground">{date} à {time}</span>
        </div>
        
        {entry.action === 'update' && entry.changes && Object.keys(entry.changes).length > 0 && (
          <div className="text-xs space-y-1 ml-5">
            {Object.entries(entry.changes).map(([field, change]: [string, any], i) => {
              let fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
              
              // Format specific fields
              switch (field) {
                case 'statusId':
                  fieldLabel = 'Statut';
                  break;
                case 'interventionTypeId':
                  fieldLabel = 'Type d\'intervention';
                  break;
                case 'hotelId':
                  fieldLabel = 'Hôtel';
                  break;
                case 'locationId':
                  fieldLabel = 'Lieu';
                  break;
                case 'receivedById':
                  fieldLabel = 'Reçu par';
                  break;
                case 'technicianId':
                  fieldLabel = 'Technicien';
                  break;
                case 'description':
                  fieldLabel = 'Description';
                  break;
                case 'comments':
                  fieldLabel = 'Commentaires';
                  break;
                case 'photoBefore':
                  fieldLabel = 'Photo avant';
                  break;
                case 'photoAfter':
                  fieldLabel = 'Photo après';
                  break;
                case 'quoteUrl':
                  fieldLabel = 'Devis';
                  break;
                case 'quoteStatus':
                  fieldLabel = 'Statut du devis';
                  break;
              }
              
              return (
                <div key={i} className="flex items-start">
                  <span className="font-medium mr-1">{fieldLabel}:</span>
                  <span className="text-red-500 line-through mr-1">
                    {typeof change.old === 'object' ? JSON.stringify(change.old) : 
                     change.old === null || change.old === undefined ? '(vide)' : change.old.toString()}
                  </span>
                  <span className="text-green-500">
                    {typeof change.new === 'object' ? JSON.stringify(change.new) : 
                     change.new === null || change.new === undefined ? '(vide)' : change.new.toString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        
        {entry.action === 'rate_technician' && entry.details && (
          <div className="text-xs space-y-1 ml-5 bg-blue-50 p-2 rounded">
            <div>Évaluation: {entry.details.rating}/5</div>
            {entry.details.comments && <div>"{entry.details.comments}"</div>}
          </div>
        )}
      </div>
    );
  };

  // If in edit mode, show the edit form
  if (editMode) {
    return (
      <MaintenanceEdit 
        isOpen={isOpen}
        onClose={() => setEditMode(false)}
        maintenance={maintenance}
        onSave={(updatedMaintenance) => {
          if (onUpdate) onUpdate(updatedMaintenance);
          setEditMode(false);
        }}
      />
    );
  }

  // Helper function to render quote status badge
  const renderQuoteStatusBadge = () => {
    if (maintenance.quoteStatus === 'accepted' || (maintenance.quoteAccepted === true)) {
      return (
        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-green-50 text-green-600 border-green-200">
          <Check className="h-3 w-3 mr-1" /> Devis accepté
        </div>
      );
    } else if (maintenance.quoteStatus === 'rejected') {
      return (
        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 border-red-200">
          <X className="h-3 w-3 mr-1" /> Devis refusé
        </div>
      );
    } else if (maintenance.quoteAccepted === false) {
      return (
        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 border-red-200">
          <X className="h-3 w-3 mr-1" /> Devis refusé
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-600 border-orange-200">
          <Clock8 className="h-3 w-3 mr-1" /> Devis en attente
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de l'intervention</DialogTitle>
          <DialogDescription>
            Consultation des informations de l'intervention technique
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic maintenance information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">ID de l'intervention</p>
              <p className="font-medium">{maintenance.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Statut</p>
              <div>
                <span className={
                  maintenance.statusId === 'stat1' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-50 text-yellow-600 border-yellow-300" :
                  maintenance.statusId === 'stat2' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600 border-blue-300" :
                  maintenance.statusId === 'stat3' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-300" :
                  maintenance.statusId === 'stat4' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-50 text-gray-600 border-gray-300" :
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-300"
                }>
                  {resolvedLabels.statusLabel || 'Chargement...'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Date de l'intervention</p>
                <div className="flex items-center">
                  <CalendarRange className="h-4 w-4 mr-1 text-muted-foreground" />
                  <p className="font-medium">{formatDate(maintenance.date)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Heure</p>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <p className="font-medium">{maintenance.time}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Hôtel</p>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1 text-muted-foreground" />
                  <p className="font-medium">{resolvedLabels.hotelName || 'Chargement...'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Lieu</p>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                  <p className="font-medium">{resolvedLabels.locationLabel || 'Chargement...'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Type d'intervention</p>
              <p className="font-medium">{resolvedLabels.interventionTypeLabel || 'Chargement...'}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4">
                <p className="font-medium whitespace-pre-wrap">{maintenance.description}</p>
              </div>
            </div>
          </div>
          
          {/* Photos */}
          {(maintenance.photoBefore || maintenance.photoAfter) && (
            <div className="space-y-4 pt-2 border-t">
              <h3 className="text-lg font-medium flex items-center">
                <Image className="h-5 w-5 mr-2 text-slate-500" />
                Photos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {maintenance.photoBefore && (
                  <PhotoDisplay 
                    photoUrl={maintenance.photoBefore}
                    type="before"
                    altText="Photo du problème"
                    isEditable={false}
                  />
                )}
                
                {maintenance.photoAfter && (
                  <PhotoDisplay 
                    photoUrl={maintenance.photoAfter}
                    type="after"
                    altText="Photo après résolution"
                    isEditable={false}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Technician Details */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center">
                <User className="h-5 w-5 mr-2 text-slate-500" />
                Technicien
              </h3>
              
              {!maintenance.technicianId && !maintenance.quoteStatus && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setQuoteFormOpen(true)}
                  disabled={isProcessing}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter un devis
                </Button>
              )}
            </div>
            
            {technicianData ? (
              <div className="bg-slate-50 border rounded-md p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium">{technicianData.name}</h4>
                      {technicianData.company && (
                        <p className="text-sm text-muted-foreground">{technicianData.company}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      {technicianData.rating > 0 && (
                        <div className="flex items-center mr-3">
                          <Star className="h-4 w-4 text-amber-500 mr-1" />
                          <span>{technicianData.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {technicianData.available ? (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-green-50 text-green-600 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-600 border-amber-200">
                          Occupé
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-slate-400" />
                        <span>{technicianData.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-slate-400" />
                        <span>{technicianData.phone}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {technicianData.hourlyRate && (
                        <div className="flex items-center">
                          <Euro className="h-4 w-4 mr-1 text-slate-400" />
                          <span>{technicianData.hourlyRate}€/heure</span>
                        </div>
                      )}
                      {technicianData.completedJobs > 0 && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1 text-slate-400" />
                          <span>{technicianData.completedJobs} intervention{technicianData.completedJobs > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {technicianData.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {technicianData.specialties.map((specialty: string) => (
                        <span 
                          key={specialty}
                          className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : maintenance.technicianId ? (
              <div className="flex items-center">
                <p className="font-medium">{resolvedLabels.technicianName || 'Chargement...'}</p>
              </div>
            ) : (
              <div className="text-muted-foreground italic">Aucun technicien assigné</div>
            )}
          </div>
          
          {/* Quotes and financial information */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center">
                <Euro className="h-5 w-5 mr-2 text-slate-500" />
                Informations financières
              </h3>
              
              {/* Only show Add Quote button if there's no quote yet or it was rejected */}
              {(!maintenance.quoteUrl && maintenance.quoteStatus !== 'pending') && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setQuoteFormOpen(true)}
                  disabled={isProcessing}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter un devis
                </Button>
              )}
            </div>
            
            {(maintenance.quoteUrl || maintenance.estimatedAmount || maintenance.finalAmount) && (
              <div className="space-y-4">
                {maintenance.quoteUrl && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Devis</h4>
                          <p className="text-sm text-amber-800">
                            Un devis a été fourni pour cette intervention
                          </p>
                        </div>
                        <QuoteFileDisplay 
                          quoteUrl={maintenance.quoteUrl} 
                          isEditable={false} 
                        />
                      </div>
                      
                      {maintenance.quoteAmount && (
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-amber-800">Montant du devis:</p>
                          <p className="text-sm font-bold text-amber-800">{maintenance.quoteAmount} €</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-amber-800">Statut:</p>
                        {renderQuoteStatusBadge()}
                      </div>

                      {!['accepted', 'rejected'].includes(maintenance.quoteStatus || '') && 
                       maintenance.quoteAccepted !== true && 
                       maintenance.quoteAccepted !== false && (
                        <div className="flex justify-end">
                          <Button 
                            size="sm"
                            onClick={() => setQuoteAcceptDialogOpen(true)}
                            variant="outline"
                            className="mr-2"
                          >
                            Examiner le devis
                          </Button>
                        </div>
                      )}
                      
                      {(maintenance.quoteStatus === 'accepted' || maintenance.quoteAccepted === true) && maintenance.quoteAcceptedDate && (
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-amber-800">Date d'acceptation:</p>
                          <p className="text-sm text-amber-800">{formatDate(maintenance.quoteAcceptedDate)}</p>
                        </div>
                      )}
                      
                      {(maintenance.quoteStatus === 'accepted' || maintenance.quoteAccepted === true) && maintenance.quoteAcceptedById && (
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-amber-800">Accepté par:</p>
                          <p className="text-sm text-amber-800">{maintenance.quoteAcceptedById ? (resolvedLabels.quoteAcceptedByName || 'Chargement...') : '-'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {maintenance.estimatedAmount && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Montant estimé</p>
                      <p className="font-medium">{maintenance.estimatedAmount} €</p>
                    </div>
                  )}
                  {maintenance.finalAmount && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Montant final</p>
                      <p className="font-medium">{maintenance.finalAmount} €</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Assignation and timeline */}
          <div className="space-y-4 pt-2 border-t">
            <h3 className="text-lg font-medium flex items-center">
              <Clock className="h-5 w-5 mr-2 text-slate-500" />
              Suivi et assignation
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Reçu par</p>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1 text-slate-400" />
                  <p className="font-medium">{resolvedLabels.receivedByName || 'Chargement...'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Technicien</p>
                <p className="font-medium">
                  {maintenance.technicianId 
                    ? <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-slate-400" />
                        <span>{resolvedLabels.technicianName || 'Chargement...'}</span>
                      </div>
                    : "Non assigné"}
                </p>
              </div>
            </div>
            
            {(maintenance.startDate || maintenance.endDate) && (
              <div className="grid grid-cols-2 gap-4">
                {maintenance.startDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Date de début</p>
                    <div className="flex items-center">
                      <CalendarRange className="h-4 w-4 mr-1 text-slate-400" />
                      <p className="font-medium">{formatDate(maintenance.startDate)}</p>
                    </div>
                  </div>
                )}
                {maintenance.endDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Date de fin</p>
                    <div className="flex items-center">
                      <CalendarRange className="h-4 w-4 mr-1 text-slate-400" />
                      <p className="font-medium">{formatDate(maintenance.endDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Comments section */}
            {maintenance.comments && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Commentaires</p>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4">
                  <p className="whitespace-pre-wrap">{maintenance.comments}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Metadata */}
          <div className="space-y-4 pt-2 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                <p className="font-medium">{formatDate(maintenance.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Dernière mise à jour</p>
                <p className="font-medium">{formatDate(maintenance.updatedAt)}</p>
              </div>
            </div>
          </div>
          
          {/* Historique des modifications */}
          {maintenance.history && maintenance.history.length > 0 && (
            <div className="space-y-4 pt-2 border-t">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="history">
                  <AccordionTrigger className="flex items-center">
                    <div className="flex items-center">
                      <History className="h-5 w-5 mr-2 text-slate-500" />
                      <h3 className="text-lg font-medium">Historique</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 mt-2">
                      {maintenance.history
                        .slice()
                        .reverse()
                        .map((entry: any, index: number) => (
                          <div key={index} className="text-sm">
                            {formatHistoryEntry(entry)}
                          </div>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
        
        <DialogFooter className="space-x-2 pt-4 border-t">
          {isAdmin && (
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
              {isDeleting && '...'}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Fermer
          </Button>
          
          <Button 
            onClick={() => setEditMode(true)}
            className="flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Quote Form Dialog */}
      {maintenance && (
        <QuoteForm 
          isOpen={quoteFormOpen}
          onClose={() => setQuoteFormOpen(false)}
          maintenance={maintenance}
          onSave={handleAddQuote}
        />
      )}

      {/* Quote Accept/Reject Dialog */}
      {maintenance && (
        <QuoteAcceptDialog
          isOpen={quoteAcceptDialogOpen}
          onClose={() => setQuoteAcceptDialogOpen(false)}
          maintenance={maintenance}
          onUpdateQuoteStatus={handleQuoteStatusUpdate}
        />
      )}
    </Dialog>
  );
};

export default MaintenanceDialog;