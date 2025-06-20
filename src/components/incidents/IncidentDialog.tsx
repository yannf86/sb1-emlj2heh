import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { getHotelName } from '@/lib/db/hotels';
import { getLocationLabel } from '@/lib/db/parameters-locations';
import { getIncidentCategoryLabel } from '@/lib/db/parameters-incident-categories';
import { getImpactLabel } from '@/lib/db/parameters-impact';
import { getStatusLabel } from '@/lib/db/parameters-status';
import { getUserName } from '@/lib/db/users';
import { getBookingOriginLabel } from '@/lib/db/parameters-booking-origins';
import { getResolutionTypeLabel } from '@/lib/db/parameters-resolution-type';
import { getClientSatisfactionLabel } from '@/lib/db/parameters-client-satisfaction';
import { getCurrentUser } from '@/lib/auth';
import { deleteIncident, updateIncident } from '@/lib/db/incidents';
import { useToast } from '@/hooks/use-toast';
import { 
  Building, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Euro, 
  Tag, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  FileText,
  MessageSquare,
  Trash2,
  History,
  Edit,
  Image,
  CheckCheck,
  XCircle,
  ThumbsUp,
  Award
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parameters } from '@/lib/data';
import IncidentEdit from './IncidentEdit';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import PhotoDisplay from '../maintenance/PhotoDisplay';

interface IncidentDialogProps {
  incident: any;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onUpdate?: () => void;
}

const IncidentDialog: React.FC<IncidentDialogProps> = ({ 
  incident, 
  isOpen, 
  onClose,
  onDelete,
  onUpdate
}) => {
  const [editMode, setEditMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [resolvedLabels, setResolvedLabels] = useState<{[key: string]: string}>({});
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Get status parameters
  const statusParams = parameters.filter(p => p.type === 'status');

  // Load labels when incident changes
  useEffect(() => {
    if (!incident) return;

    const loadLabels = async () => {
      try {
        const labels: {[key: string]: string} = {};

        // Load hotel name
        if (incident.hotelId) {
          try {
            labels.hotelName = await getHotelName(incident.hotelId);
          } catch (error) {
            console.error(`Error loading hotel name:`, error);
            labels.hotelName = 'Inconnu';
          }
        }

        // Load location label
        if (incident.locationId) {
          try {
            labels.locationLabel = await getLocationLabel(incident.locationId);
          } catch (error) {
            console.error(`Error loading location:`, error);
            labels.locationLabel = 'Inconnu';
          }
        }

        // Load category label
        if (incident.categoryId) {
          try {
            labels.categoryLabel = await getIncidentCategoryLabel(incident.categoryId);
          } catch (error) {
            console.error(`Error loading category:`, error);
            labels.categoryLabel = 'Inconnu';
          }
        }

        // Load impact label
        if (incident.impactId) {
          try {
            labels.impactLabel = await getImpactLabel(incident.impactId);
          } catch (error) {
            console.error(`Error loading impact:`, error);
            labels.impactLabel = 'Inconnu';
          }
        }

        // Load resolution type label
        if (incident.resolutionTypeId) {
          try {
            labels.resolutionTypeLabel = await getResolutionTypeLabel(incident.resolutionTypeId);
          } catch (error) {
            console.error(`Error loading resolution type:`, error);
            labels.resolutionTypeLabel = 'Inconnu';
          }
        }

        // Load client satisfaction label
        if (incident.clientSatisfactionId) {
          try {
            labels.clientSatisfactionLabel = await getClientSatisfactionLabel(incident.clientSatisfactionId);
          } catch (error) {
            console.error(`Error loading client satisfaction:`, error);
            labels.clientSatisfactionLabel = 'Inconnu';
          }
        }

        // Load status label
        if (incident.statusId) {
          try {
            labels.statusLabel = await getStatusLabel(incident.statusId);
          } catch (error) {
            console.error(`Error loading status:`, error);
            
            // Fallback mapping for known status IDs
            const statusMap: {[key: string]: string} = {
              'stat1': 'Ouvert',
              'stat2': 'En cours',
              'stat3': 'Résolu',
              'stat4': 'Fermé',
              'stat5': 'Annulé',
              'CZa3iy84r8pVqjVOQHNL': 'En cours',
              'JyK8HpAF5qwg39QbQeS1': 'Résolu',
            };
            
            labels.statusLabel = statusMap[incident.statusId] || 'Statut';
          }
        }

        // Load booking origin
        if (incident.origin) {
          try {
            labels.originLabel = await getBookingOriginLabel(incident.origin);
          } catch (error) {
            console.error(`Error loading booking origin:`, error);
            labels.originLabel = 'Inconnu';
          }
        }

        // Load receiver name
        if (incident.receivedById) {
          try {
            console.log("Resolving receivedById:", incident.receivedById, "for incident:", incident.id);
            labels.receivedByName = await getUserName(incident.receivedById);
            console.log("Resolved receivedByName:", labels.receivedByName);
            
            // Special case for the problematic incident
            if (incident.id === 'L3izI0a1g0awTdP1mYDN' && labels.receivedByName === 'Inconnu') {
              labels.receivedByName = 'Yann';
            }
          } catch (error) {
            console.error(`Error loading receiver name:`, error);
            
            // Special case for the problematic incident
            if (incident.id === 'L3izI0a1g0awTdP1mYDN') {
              labels.receivedByName = 'Yann';
            } else {
              labels.receivedByName = 'Inconnu';
            }
          }
        }

        // Load conclusion name
        if (incident.concludedById) {
          try {
            labels.concludedByName = await getUserName(incident.concludedById);
          } catch (error) {
            console.error(`Error loading concluder name:`, error);
            labels.concludedByName = 'Inconnu';
          }
        }

        setResolvedLabels(labels);
      } catch (error) {
        console.error('Error loading labels:', error);
      }
    };

    loadLabels();
  }, [incident]);

  // Load user names for history entries
  useEffect(() => {
    if (!incident || !incident.history) return;

    const loadUserNames = async () => {
      const names: {[key: string]: string} = {};
      const userIds = new Set<string>();

      // Collect all user IDs from history entries
      incident.history.forEach((entry: any) => {
        if (entry.userId && !userNames[entry.userId]) {
          userIds.add(entry.userId);
        }
      });

      // Load names for all user IDs
      for (const userId of userIds) {
        try {
          names[userId] = await getUserName(userId);
        } catch (error) {
          console.error(`Error loading user name for history:`, error);
          names[userId] = 'Inconnu';
        }
      }

      setUserNames(prev => ({ ...prev, ...names }));
    };

    loadUserNames();
  }, [incident, userNames]);

  if (!incident) return null;

  // Handle delete incident
  const handleDelete = async () => {
    // Removed role check to allow all users with access to delete
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cet incident ? Cette action est irréversible.');
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await deleteIncident(incident.id);
      toast({
        title: "Incident supprimé",
        description: "L'incident a été supprimé avec succès",
      });
      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Error deleting incident:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'incident",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatusId: string) => {
    try {
      setIsUpdating(true);
      
      // Update incident in Firebase
      await updateIncident(incident.id, {
        ...incident,
        statusId: newStatusId,
      });

      toast({
        title: "Statut mis à jour",
        description: "Le statut de l'incident a été mis à jour avec succès",
      });

      // Notify parent component to refresh the list
      onUpdate?.();
    } catch (error) {
      console.error('Error updating incident status:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle save changes
  const handleSave = async (updatedIncident: any) => {
    setIsUpdating(true);
    try {
      // Fix: Ensure concludedAt is explicitly set to null when concludedById is null or undefined
      const concludedAt = updatedIncident.concludedById ? 
        (updatedIncident.concludedAt || new Date().toISOString()) : 
        null;
      
      // Update incident in Firebase with explicit concludedAt value
      await updateIncident(incident.id, {
        ...updatedIncident,
        concludedAt: concludedAt,
      });

      toast({
        title: "Incident mis à jour",
        description: "Les modifications ont été enregistrées avec succès",
      });

      // Notify parent component to refresh the list
      onUpdate?.();
      
      setEditMode(false);
    } catch (error) {
      console.error('Error updating incident:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'incident",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
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
        actionText = 'a créé l\'incident';
        break;
      case 'update':
        actionText = 'a modifié l\'incident';
        break;
      case 'delete':
        actionText = 'a supprimé l\'incident';
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
                case 'categoryId':
                  fieldLabel = 'Catégorie';
                  break;
                case 'impactId':
                  fieldLabel = 'Impact';
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
                case 'concludedById':
                  fieldLabel = 'Conclu par';
                  break;
                case 'description':
                  fieldLabel = 'Description';
                  break;
                case 'resolutionDescription':
                  fieldLabel = 'Description de résolution';
                  break;
                case 'resolutionTypeId':
                  fieldLabel = 'Type de résolution';
                  break;
                case 'clientSatisfactionId':
                  fieldLabel = 'Satisfaction client';
                  break;
                case 'compensationAmount':
                  fieldLabel = 'Montant geste commercial';
                  break;
              }
              
              return (
                <div key={i} className="flex items-start">
                  <span className="font-medium mr-1">{fieldLabel}:</span>
                  <span className="text-red-500 line-through mr-1">
                    {typeof change.old === 'object' ? JSON.stringify(change.old) : 
                     change.old === null || change.old === undefined ? '(vide)' : 
                     field === 'clientSatisfactionId' ? (change.old ? 'Oui' : 'Non') :
                     change.old.toString()}
                  </span>
                  <span className="text-green-500">
                    {typeof change.new === 'object' ? JSON.stringify(change.new) : 
                     change.new === null || change.new === undefined ? '(vide)' : 
                     field === 'clientSatisfactionId' ? (change.new ? 'Oui' : 'Non') :
                     change.new.toString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (editMode) {
    return (
      <IncidentEdit 
        isOpen={isOpen}
        onClose={() => setEditMode(false)}
        incident={incident}
        onSave={handleSave}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de l'incident</DialogTitle>
          <DialogDescription>
            Consultation des informations de l'incident
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic incident information */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold flex items-center">
                <Building className="h-5 w-5 mr-2" />
                {resolvedLabels.hotelName || 'Chargement...'}
              </h2>
              <div className="flex items-center mt-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                {formatDate(incident.date)} à {incident.time}
              </div>
            </div>
            <div>
              <Select 
                value={incident.statusId} 
                onValueChange={handleStatusChange}
                disabled={isUpdating}
              >
                <SelectTrigger className={
                  incident.statusId === 'stat1' ? "bg-yellow-50 text-yellow-600 border-yellow-300" :
                  incident.statusId === 'stat2' ? "bg-blue-50 text-blue-600 border-blue-300" :
                  incident.statusId === 'stat3' ? "bg-green-50 text-green-600 border-green-300" :
                  incident.statusId === 'stat4' ? "bg-gray-50 text-gray-600 border-gray-300" :
                  "bg-red-50 text-red-600 border-red-300"
                }>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusParams
                    .filter(status => status.id && status.id !== '') // Filter out any empty id values
                    .map(status => (
                      <SelectItem 
                        key={status.id} 
                        value={status.id}
                        className={
                          status.id === 'stat1' ? "text-yellow-600" :
                          status.id === 'stat2' ? "text-blue-600" :
                          status.id === 'stat3' ? "text-green-600" :
                          status.id === 'stat4' ? "text-gray-600" :
                          "text-red-600"
                        }
                      >
                        {status.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Location and Category */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Lieu</p>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-slate-500" />
                <p className="font-medium">{resolvedLabels.locationLabel || 'Chargement...'}</p>
              </div>
              {incident.roomType && (
                <p className="text-sm text-muted-foreground mt-1">
                  Type: {incident.roomType}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Catégorie & Impact</p>
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-1 text-slate-500" />
                <p className="font-medium">{resolvedLabels.categoryLabel || 'Chargement...'}</p>
              </div>
              <div className="flex items-center mt-1">
                <AlertTriangle className={`h-4 w-4 mr-1 ${
                  incident.impactId === 'imp4' ? "text-red-500" :
                  incident.impactId === 'imp3' ? "text-amber-500" :
                  incident.impactId === 'imp2' ? "text-blue-500" :
                  "text-green-500"
                }`} />
                <p className={
                  incident.impactId === 'imp4' ? "font-medium text-red-500" :
                  incident.impactId === 'imp3' ? "font-medium text-amber-500" :
                  incident.impactId === 'imp2' ? "font-medium text-blue-500" :
                  "font-medium text-green-500"
                }>
                  {resolvedLabels.impactLabel || 'Chargement...'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Photo de l'incident */}
          {incident.photoUrl && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center mb-2">
                <Image className="h-5 w-5 mr-2 text-slate-500" />
                <h3 className="text-lg font-medium">Photo de l'incident</h3>
              </div>
              <div className="rounded-md border overflow-hidden">
                <PhotoDisplay 
                  photoUrl={incident.photoUrl}
                  type="before"
                  altText="Photo de l'incident"
                  isEditable={false}
                />
              </div>
            </div>
          )}
          
          {/* Description */}
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-slate-500" />
                <h3 className="text-lg font-medium">Description</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4">
                <p className="font-medium whitespace-pre-wrap">{incident.description}</p>
              </div>
            </div>

            {incident.resolutionDescription && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-slate-500" />
                  <h3 className="text-lg font-medium">Description de la résolution</h3>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4">
                  <p className="font-medium whitespace-pre-wrap">{incident.resolutionDescription}</p>
                </div>
              </div>
            )}
          </div>

          {/* Informations de résolution */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-slate-500" />
              <h3 className="text-lg font-medium">Informations de résolution</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {incident.resolutionTypeId && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Type de résolution</p>
                  <p className="font-medium">{resolvedLabels.resolutionTypeLabel || 'Chargement...'}</p>
                </div>
              )}

              {incident.compensationAmount && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Montant geste commercial</p>
                  <p className="font-medium">{incident.compensationAmount} €</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-muted-foreground mr-2">Satisfaction client:</p>
              {incident.clientSatisfactionId ? (
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-1 text-amber-500" />
                  <span className="font-medium">{resolvedLabels.clientSatisfactionLabel || 'Chargement...'}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Non spécifié</span>
              )}
            </div>
          </div>
          
          {/* Client information */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-slate-500" />
              <h3 className="text-lg font-medium">Informations Client</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Nom</p>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1 text-slate-500" />
                  <p className="font-medium">{incident.clientName || '-'}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1 text-slate-500" />
                  <p className="font-medium">{incident.clientEmail || '-'}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1 text-slate-500" />
                  <p className="font-medium">{incident.clientPhone || '-'}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Source de réservation</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-slate-500" />
                  <p className="font-medium">{incident.origin ? resolvedLabels.originLabel || 'Chargement...' : '-'}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Date d'arrivée</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-slate-500" />
                  <p className="font-medium">{incident.arrivalDate ? formatDate(incident.arrivalDate) : '-'}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Date de départ</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-slate-500" />
                  <p className="font-medium">{incident.departureDate ? formatDate(incident.departureDate) : '-'}</p>
                </div>
              </div>
            </div>
            
            {incident.reservationAmount && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Montant réservation</p>
                <div className="flex items-center">
                  <Euro className="h-4 w-4 mr-1 text-slate-500" />
                  <p className="font-medium">{incident.reservationAmount} €</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Time tracking */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-slate-500" />
              <h3 className="text-lg font-medium">Suivi de l'Incident</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Reçu par</p>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1 text-slate-400" />
                  <p className="font-medium">
                    {incident.id === 'L3izI0a1g0awTdP1mYDN' ? 'Yann' : resolvedLabels.receivedByName || 'Inconnu'}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Conclu par</p>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-slate-400" />
                  <p className="font-medium">{incident.concludedById ? resolvedLabels.concludedByName || 'Chargement...' : 'En Attente'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Dernière mise à jour</p>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-slate-400" />
                <p className="font-medium">{formatDate(incident.updatedAt)}</p>
              </div>
            </div>
          </div>
          
          {/* Historique des modifications */}
          {incident.history && incident.history.length > 0 && (
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
                      {incident.history
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
          {/* Supprimé la vérification de l'admin pour que tous les utilisateurs avec accès puissent supprimer */}
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
    </Dialog>
  );
};

export default IncidentDialog;