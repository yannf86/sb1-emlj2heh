import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HistoryEntry, HistoryChange } from '../../types/history';
import { Clock, User, FileText, Plus, Edit, Trash } from 'lucide-react';

interface HistoryViewerProps {
  history: HistoryEntry[];
  isLoading: boolean;
}

export default function HistoryViewer({ history, isLoading }: HistoryViewerProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-creho-600"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-warm-500">Aucun historique disponible</p>
      </div>
    );
  }

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'create':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'update':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'delete':
        return <Trash className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-warm-600" />;
    }
  };

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'create':
        return 'Création';
      case 'update':
        return 'Modification';
      case 'delete':
        return 'Suppression';
      default:
        return 'Action';
    }
  };

  const getOperationClass = (operation: string) => {
    switch (operation) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-warm-100 text-warm-800';
    }
  };
  
  // Fonction pour obtenir l'opération (compatibilité avec les deux formats)
  const getOperation = (entry: HistoryEntry): string => {
    return entry.operation || entry.action || 'update';
  };

  const formatFieldName = (fieldName: string) => {
    const fieldMappings: Record<string, string> = {
      // Champs communs
      'hotelId': 'Hôtel',
      'categoryId': 'Catégorie',
      'impactId': 'Impact',
      'statusId': 'Statut',
      'description': 'Description',
      'location': 'Localisation',
      'date': 'Date',
      'createdAt': 'Date de création',
      'updatedAt': 'Date de modification',
      'createdBy': 'Créé par',
      'photoURL': 'Photo',
      'photoBeforeURL': 'Photo avant',
      'photoAfterURL': 'Photo après',
      
      // Champs spécifiques aux incidents
      'receivedById': 'Reçu par',
      'concludedBy': 'Conclu par',
      'resolutionDescription': 'Description de la résolution',
      'resolutionType': 'Type de résolution',
      'clientSatisfactionId': 'Satisfaction client',
      'commercialGesture': 'Geste commercial',
      'clientName': 'Nom du client',
      'clientEmail': 'Email du client',
      'clientPhone': 'Téléphone du client',
      'clientRoom': 'Chambre du client',
      'clientReservation': 'Réservation du client',
      'bookingAmount': 'Montant de la réservation',
      'bookingOrigin': 'Origine de la réservation',
      'clientArrivalDate': 'Date d\'arrivée du client',
      'clientDepartureDate': 'Date de départ du client',
      
      // Champs spécifiques aux interventions techniques
      'interventionTypeId': 'Type d\'intervention',
      'assignedTo': 'Assigné à',
      'assignedToType': 'Type d\'assignation',
      'startDate': 'Date de début',
      'endDate': 'Date de fin',
      'time': 'Heure',
      'priority': 'Priorité',
      'cost': 'Coût',
      'quotes': 'Devis',
      'resolution': 'Résolution',
      'notes': 'Notes',
      'status': 'Statut',
    };

    return fieldMappings[fieldName] || fieldName;
  };

  // Fonction pour formater les timestamps Firestore
  const formatTimestamp = (value: any) => {
    if (!value) return 'Non défini';
    
    try {
      // Si c'est un objet Timestamp Firestore (avec seconds et nanoseconds)
      if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        const date = new Date(value.seconds * 1000);
        return format(date, 'dd/MM/yyyy HH:mm', { locale: fr });
      }
      
      // Si c'est une date sous forme de chaîne
      if (typeof value === 'string') {
        return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: fr });
      }
      
      // Si c'est déjà un objet Date
      if (value instanceof Date) {
        return format(value, 'dd/MM/yyyy HH:mm', { locale: fr });
      }
      
      return JSON.stringify(value);
    } catch (e) {
      console.error('Erreur de formatage de timestamp:', e);
      return JSON.stringify(value);
    }
  };
  
  const formatFieldValue = (fieldName: string, value: any) => {
    if (value === null || value === undefined) return 'Non défini';
    
    // Traitement spécial pour les champs de date
    if (fieldName === 'date' || fieldName === 'clientArrivalDate' || fieldName === 'clientDepartureDate' || 
        fieldName.includes('Date') || fieldName === 'createdAt' || fieldName === 'updatedAt') {
      return formatTimestamp(value);
    }
    
    // Traitement spécial pour les booléens
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }
    
    // Traitement spécial pour les IDs qui se terminent par Id
    if ((fieldName.endsWith('Id') || fieldName === 'assignedTo' || fieldName === 'createdBy') && typeof value === 'string') {
      // Pour les IDs d'hôtel, de catégorie, etc., on pourrait ici faire une recherche dans un cache
      // pour afficher le nom au lieu de l'ID, mais pour simplifier on va juste raccourcir l'ID
      return `ID: ${value.substring(0, 8)}...`;
    }
    
    // Pour les objets complexes
    if (typeof value === 'object' && value !== null) {
      // Si c'est un tableau, on affiche sa longueur
      if (Array.isArray(value)) {
        return `${value.length} élément(s)`;
      }
      
      // Sinon on stringify l'objet mais de façon plus lisible
      try {
        const stringified = JSON.stringify(value);
        if (stringified.length > 50) {
          return `${stringified.substring(0, 47)}...`;
        }
        return stringified;
      } catch (e) {
        return 'Objet complexe';
      }
    }
    
    return value.toString();
  };

  return (
    <div className="space-y-6">
      {history.map((entry) => {
        const operation = getOperation(entry);
        const userName = entry.userName || (entry.userId ? `Utilisateur ${entry.userId.substring(0, 8)}...` : 'Utilisateur inconnu');
        
        return (
          <div key={entry.id} className="border border-warm-200 rounded-lg overflow-hidden">
            <div className="bg-warm-50 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOperationClass(operation)}`}>
                  {getOperationIcon(operation)}
                  <span className="ml-1">{getOperationLabel(operation)}</span>
                </span>
                <span className="text-warm-600 text-sm flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {entry.timestamp instanceof Date 
                    ? format(entry.timestamp, 'dd/MM/yyyy HH:mm', { locale: fr })
                    : entry.timestamp && typeof entry.timestamp === 'string'
                      ? entry.timestamp
                      : 'Date inconnue'
                  }
                </span>
              </div>
              <div className="flex items-center text-sm text-warm-600">
                <User className="w-4 h-4 mr-1" />
                <span>{userName}</span>
              </div>
            </div>
            
            <div className="p-4 bg-white">
              {/* Affichage pour le format ancien */}
              {operation === 'create' && !entry.changes && (
                <div className="text-sm text-warm-600">
                  <p>Création de l'élément avec les valeurs initiales.</p>
                  {entry.type && (
                    <p className="mt-2">Type: <span className="font-medium">{entry.type}</span></p>
                  )}
                </div>
              )}
              
              {operation === 'delete' && !entry.changes && (
                <div className="text-sm text-warm-600">
                  <p>Suppression de l'élément.</p>
                </div>
              )}
              
              {/* Affichage pour l'ancien format avec changedFields */}
              {operation === 'update' && entry.changedFields && entry.changedFields.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-warm-200">
                    <thead className="bg-warm-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                          Champ
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                          Ancienne valeur
                        </th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                          Nouvelle valeur
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-warm-200">
                      {entry.changedFields.map((field) => (
                        <tr key={field}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-warm-900">
                            {formatFieldName(field)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-warm-500">
                            {entry.previousState && entry.previousState[field] !== undefined
                              ? formatFieldValue(field, entry.previousState[field])
                              : 'Non défini'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-warm-900">
                            {entry.newState && entry.newState[field] !== undefined
                              ? formatFieldValue(field, entry.newState[field])
                              : 'Non défini'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Affichage pour le nouveau format avec changes */}
              {entry.changes && (
                <div className="overflow-x-auto">
                  {Array.isArray(entry.changes) ? (
                    <table className="min-w-full divide-y divide-warm-200">
                      <thead className="bg-warm-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                            Champ
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                            Ancienne valeur
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                            Nouvelle valeur
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-warm-200">
                        {entry.changes.map((change: HistoryChange, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-warm-900">
                              {change.field ? formatFieldName(change.field) : `Changement ${index + 1}`}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-warm-500">
                              {change.old !== undefined
                                ? formatFieldValue(change.field || '', change.old)
                                : 'Non défini'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-warm-900">
                              {change.new !== undefined
                                ? formatFieldValue(change.field || '', change.new)
                                : 'Non défini'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-sm text-warm-600">
                      <p className="font-medium mb-2">Modifications:</p>
                      <pre className="bg-warm-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(entry.changes, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              
              {/* Si aucune information de changement n'est disponible */}
              {!entry.changes && !entry.changedFields && operation !== 'create' && operation !== 'delete' && (
                <div className="text-sm text-warm-600">
                  <p>Détails des modifications non disponibles.</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
