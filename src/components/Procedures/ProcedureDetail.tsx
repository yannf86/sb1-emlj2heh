import { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, Clock, Users, History, Edit, RefreshCw } from 'lucide-react';
import { Procedure } from '../../types/procedure';
import { procedureService } from '../../services/firebase/procedureService';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { hotelsService } from '../../services/firebase/hotelsService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
// Import ProcedureDiagnostic supprimé

interface ProcedureDetailProps {
  isOpen: boolean;
  onClose: () => void;
  procedure: Procedure | null;
  onAcknowledge?: () => void;
  onEdit?: (procedure: Procedure) => void;
}

export default function ProcedureDetail({ isOpen, onClose, procedure, onAcknowledge, onEdit }: ProcedureDetailProps) {
  const { currentUser } = useAuth();
  const { isSystemAdmin, isHotelAdmin, accessibleHotels } = useUserPermissions();
  const queryClient = useQueryClient();
  const [acknowledging, setAcknowledging] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  
  // Vérifier si l'utilisateur peut modifier la procédure
  const canEdit = () => {
    if (!currentUser || !procedure) return false;
    
    // Les administrateurs système peuvent tout modifier
    if (isSystemAdmin) return true;
    
    // Les administrateurs d'hôtel peuvent modifier les procédures des hôtels auxquels ils ont accès
    if (isHotelAdmin && accessibleHotels.length > 0) {
      // Vérifier si au moins un hôtel de la procédure est dans les hôtels accessibles
      const hasAccessToHotel = procedure.hotels.some(hotelId => 
        accessibleHotels.includes(hotelId)
      );
      if (hasAccessToHotel) return true;
    }
    
    // Le créateur peut toujours modifier sa procédure
    return procedure.createdBy === currentUser.uid;
  };

  // Récupération des données
  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels'],
    queryFn: hotelsService.getHotels
  });

  const { data: acknowledgments = [] } = useQuery({
    queryKey: ['procedure-acknowledgments', procedure?.id],
    queryFn: () => procedure ? procedureService.getProcedureAcknowledgments(procedure.id) : Promise.resolve([]),
    enabled: !!procedure
  });

  const { data: history = [] } = useQuery({
    queryKey: ['procedure-history', procedure?.id],
    queryFn: () => procedure ? procedureService.getProcedureHistory(procedure.id) : Promise.resolve([]),
    enabled: !!procedure // Toujours charger l'historique quand une procédure est ouverte
  });

  // Vérifier si l'utilisateur a déjà validé cette procédure
  useEffect(() => {
    const checkAcknowledgment = async () => {
      if (procedure && currentUser) {
        const acknowledged = await procedureService.hasUserAcknowledged(procedure.id, currentUser.uid);
        setHasAcknowledged(acknowledged);
      }
    };
    checkAcknowledgment();
  }, [procedure, currentUser]);

  // Fonction pour révoquer toutes les validations (admin seulement)
  const handleRevokeAllAcknowledgments = async () => {
    if (!procedure || !currentUser || !canEdit()) return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir révoquer toutes les validations pour cette procédure ? Les utilisateurs devront valider à nouveau.')) {
      return;
    }
    
    setIsRevoking(true);
    try {
      await procedureService.revokeAllAcknowledgments(procedure.id);
      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['procedureAcknowledgments', procedure.id] });
      alert('Toutes les validations ont été révoquées avec succès.');
    } catch (error) {
      console.error('Erreur lors de la révocation des validations:', error);
      alert('Erreur lors de la révocation des validations');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!procedure || !currentUser) return;

    setAcknowledging(true);
    try {
      // Récupérer l'hôtel de l'utilisateur (prendre le premier s'il y en a plusieurs)
      const userHotel = hotels.find(hotel => 
        currentUser.hotels?.includes(hotel.id)
      );

      await procedureService.acknowledgeProcedure(
        procedure.id,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'Utilisateur inconnu',
        currentUser.email || '',
        userHotel?.id || '',
        userHotel?.name || 'Hôtel inconnu'
      );

      setHasAcknowledged(true);
      onAcknowledge?.();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert('Erreur lors de la validation de la procédure');
    } finally {
      setAcknowledging(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Date inconnue';
    if (timestamp instanceof Date) {
      return format(timestamp, 'dd/MM/yyyy à HH:mm', { locale: fr });
    }
    return format(timestamp.toDate(), 'dd/MM/yyyy à HH:mm', { locale: fr });
  };

  if (!isOpen || !procedure) return null;

  const procedureHotels = hotels.filter(hotel => procedure.hotels.includes(hotel.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">{procedure.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {procedure.service} • {procedure.type}
              {procedure.version && ` • Version ${procedure.version}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          {procedure.description && (
            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-gray-700">{procedure.description}</p>
            </div>
          )}

          {/* Contenu additionnel */}
          {procedure.content && (
            <div>
              <h3 className="text-lg font-medium mb-2">Contenu additionnel</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700 whitespace-pre-wrap">{procedure.content}</p>
              </div>
            </div>
          )}

          {/* Document PDF */}
          {procedure.pdfUrl && (
            <div>
              <h3 className="text-lg font-medium mb-2">Document PDF</h3>
              <div className="border border-gray-200 rounded-md p-4 flex items-center">
                <FileText className="w-8 h-8 text-red-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium">{procedure.pdfName}</p>
                  <p className="text-sm text-gray-600">Document PDF</p>
                </div>
                <a
                  href={procedure.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Ouvrir
                </a>
              </div>
            </div>
          )}

          {/* Hôtels concernés */}
          <div>
            <h3 className="text-lg font-medium mb-2">Hôtels concernés</h3>
            <div className="flex flex-wrap gap-2">
              {procedureHotels.map(hotel => (
                <span
                  key={hotel.id}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {hotel.name}
                </span>
              ))}
            </div>
          </div>

          {/* Informations de création */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Créé par :</span> {procedure.createdByName}
              </div>
              <div>
                <span className="font-medium">Créé le :</span> {formatDate(procedure.createdAt)}
              </div>
              <div>
                <span className="font-medium">Modifié le :</span> {formatDate(procedure.updatedAt)}
              </div>
              <div>
                <span className="font-medium">Validations :</span> {acknowledgments.length}
              </div>
            </div>
          </div>

          {/* Statut de validation pour l'utilisateur actuel */}
          {hasAcknowledged ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-800">Vous avez validé cette procédure</span>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-yellow-800 font-medium">Validation requise</span>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                Vous devez valider cette procédure pour confirmer que vous en avez pris connaissance.
              </p>
              <button
                onClick={handleAcknowledge}
                disabled={acknowledging}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {acknowledging ? 'Validation...' : 'Valider la procédure'}
              </button>
            </div>
          )}

          {/* Validations */}
          {acknowledgments.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Validations ({acknowledgments.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {acknowledgments.map(ack => (
                  <div key={ack.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">{ack.userName}</p>
                      <p className="text-sm text-gray-600">{ack.hotelName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{formatDate(ack.acknowledgedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historique des modifications */}
          <div className="mt-6">
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <History className="w-5 h-5 mr-2" />
              {showHistory ? 'Masquer l\'historique' : 'Historique des modifications'}
            </button>
            
            {showHistory && (
              <div className="mt-3 border border-gray-200 rounded-md p-4 bg-gray-50">
                <h3 className="text-lg font-medium mb-3">Historique des modifications</h3>
                {history.length === 0 ? (
                  <p className="text-gray-500 italic">Chargement de l'historique...</p>
                ) : (
                  <ul className="space-y-3">
                    {history.map((item, index) => (
                      <li key={index} className="border-b border-gray-200 pb-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {item.action === 'created' ? 'Création' : 
                             item.action === 'updated' ? 'Modification' : 
                             item.action === 'revoked_acknowledgments' ? 'Révocation des validations' : 
                             'Action'}
                          </span>
                          <span className="text-gray-500">{format(item.timestamp.toDate(), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                        </div>
                        <div className="text-sm mt-1">
                          <span>Par: {item.userName}</span>
                        </div>
                        {item.details && <div className="text-sm text-gray-600 mt-1">{item.details}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Composant de diagnostic supprimé */}

        <div className="flex justify-between p-6 border-t">
          {/* Boutons d'administration (uniquement pour les admins) */}
          {canEdit() && (
            <div className="flex space-x-3">
              <button
                onClick={() => procedure && onEdit?.(procedure)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                title="Modifier la procédure"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </button>
              
              {acknowledgments.length > 0 && (
                <button
                  onClick={handleRevokeAllAcknowledgments}
                  disabled={isRevoking}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center disabled:opacity-50"
                  title="Révoquer toutes les validations"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isRevoking ? 'En cours...' : 'Révoquer validations'}
                </button>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
