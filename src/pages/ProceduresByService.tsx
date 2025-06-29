import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, FileText, CheckCircle, Clock, Users, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { procedureService } from '../services/firebase/procedureService';
import { useAuth } from '../contexts/AuthContext';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { Procedure } from '../types/procedure';
import ProcedureModal from '../components/Procedures/ProcedureModal';
import ProcedureDetail from '../components/Procedures/ProcedureDetail';

const serviceIcons: { [key: string]: React.ReactNode } = {
  'Toutes les procédures': <FileText className="w-6 h-6" />,
  'Réception': <Users className="w-6 h-6" />,
  'Housekeeping': <FileText className="w-6 h-6" />,
  'Restauration': <FileText className="w-6 h-6" />,
  'Technique': <FileText className="w-6 h-6" />,
  'Spa & Bien-être': <FileText className="w-6 h-6" />,
  'Événementiel': <FileText className="w-6 h-6" />,
  'Administration': <FileText className="w-6 h-6" />,
  'Sécurité': <FileText className="w-6 h-6" />,
  'Commercial': <FileText className="w-6 h-6" />
};

// Fonctions utilitaires
const getServiceDisplayName = (serviceKey: string) => {
  const serviceNames: { [key: string]: string } = {
    'toutes-les-procedures': 'Toutes les procédures',
    'reception': 'Réception',
    'housekeeping': 'Housekeeping',
    'restauration': 'Restauration',
    'technique': 'Technique',
    'spa-bien-etre': 'Spa & Bien-être',
    'evenementiel': 'Événementiel',
    'administration': 'Administration',
    'securite': 'Sécurité',
    'commercial': 'Commercial'
  };
  return serviceNames[serviceKey] || serviceKey;
};

const getServiceFromUrl = (serviceKey: string) => {
  const urlToService: { [key: string]: string } = {
    'reception': 'Réception',
    'housekeeping': 'Housekeeping',
    'restauration': 'Restauration',
    'technique': 'Technique',
    'securite': 'Sécurité',
    'spa-bien-etre': 'Spa & Bien-être',
    'evenementiel': 'Événementiel',
    'administration': 'Administration',
    'commercial': 'Commercial'
  };
  return urlToService[serviceKey] || serviceKey;
};

export default function ProceduresByService() {
  const { service } = useParams<{ service: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isSystemAdmin, isHotelAdmin, accessibleHotels } = useUserPermissions();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  
  // États pour les filtres
  const [statusFilter, setStatusFilter] = useState<'all' | 'validated' | 'pending'>('all');

  // Récupération des procédures avec permissions
  const { data: allProcedures = [], isLoading: proceduresLoading } = useQuery({
    queryKey: ['procedures', currentUser?.uid, accessibleHotels.join(',')],
    queryFn: async () => {
      if (!currentUser) return [];
      
      // Les administrateurs système peuvent voir toutes les procédures
      if (isSystemAdmin) {
        return procedureService.getAllProcedures();
      }
      
      // Les administrateurs d'hôtel ne voient que les procédures des hôtels auxquels ils ont accès
      if (isHotelAdmin && accessibleHotels.length > 0) {
        const allProcedures = await procedureService.getAllProcedures();
        return allProcedures.filter(procedure => 
          procedure.hotels.some(hotelId => accessibleHotels.includes(hotelId))
        );
      }
      
      // Les autres utilisateurs ne voient que les procédures qui leur sont assignées
      return procedureService.getProceduresForUser(currentUser.uid);
    },
    enabled: !!currentUser
  });



  // Filtrer les procédures par service avec useMemo pour éviter les re-rendus infinis
  const procedures = useMemo(() => {
    const serviceNameForFilter = getServiceFromUrl(service || '');
    return allProcedures.filter(procedure => 
      service === 'toutes-les-procedures' || procedure.service === serviceNameForFilter
    );
  }, [allProcedures, service]);

  // Récupérer les validations pour toutes les procédures
  const { data: acknowledgments = [] } = useQuery({
    queryKey: ['procedure-acknowledgments', procedures.map(p => p.id).join(',')],
    queryFn: async () => {
      if (!currentUser) {
        return [];
      }
      
      // Récupérer les validations pour toutes les procédures affichées
      const allAcknowledgments = [];
      for (const procedure of procedures) {
        try {
          const procedureAcks = await procedureService.getProcedureAcknowledgments(procedure.id);
          allAcknowledgments.push(...procedureAcks);
        } catch (error) {
          console.error(`Erreur lors de la récupération des validations pour ${procedure.id}:`, error);
        }
      }
      return allAcknowledgments;
    },
    enabled: !!currentUser && procedures.length > 0
  });

  // Fonction pour obtenir le nombre de validations d'une procédure
  const getValidationCount = (procedureId: string) => {
    return acknowledgments.filter(ack => ack.procedureId === procedureId).length;
  };
  
  // Vérifier si l'utilisateur courant a validé une procédure
  const hasUserValidated = (procedureId: string) => {
    return acknowledgments.some(ack => 
      ack.procedureId === procedureId && ack.userId === currentUser?.uid
    );
  };
  
  // Filtrer les procédures selon le statut de validation
  const filteredProcedures = useMemo(() => {
    if (statusFilter === 'all') {
      return procedures;
    } else if (statusFilter === 'validated') {
      return procedures.filter(procedure => hasUserValidated(procedure.id));
    } else { // pending
      return procedures.filter(procedure => 
        procedure.assignedUsers?.includes(currentUser?.uid || '') && 
        !hasUserValidated(procedure.id)
      );
    }
  }, [procedures, statusFilter, acknowledgments, currentUser]);



  const canEdit = () => {
    return currentUser?.role === 'system_admin' || currentUser?.role === 'hotel_admin';
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['procedures'] });
  };

  const handleDelete = async (procedure: Procedure) => {
    if (!canEdit()) return;
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette procédure ?')) {
      try {
        await procedureService.deleteProcedure(
          procedure.id, 
          currentUser!.uid, 
          currentUser!.displayName || currentUser!.email || 'Utilisateur inconnu'
        );
        handleSuccess();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la procédure');
      }
    }
  };

  const serviceDisplayName = useMemo(() => getServiceDisplayName(service || ''), [service]);

  if (proceduresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout title={serviceDisplayName}>
      <div className="space-y-6">
        {/* En-tête avec bouton retour */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/procedures')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Retour aux services"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {serviceIcons[serviceDisplayName] && (
              <span className="mr-2 inline-block align-middle">
                {serviceIcons[serviceDisplayName]}
              </span>
            )}
            {serviceDisplayName}
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Filtres */}
          <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${statusFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Toutes
            </button>
            <button
              onClick={() => setStatusFilter('validated')}
              className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${statusFilter === 'validated' 
                ? 'bg-green-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Validées
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${statusFilter === 'pending' 
                ? 'bg-orange-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Clock className="w-3 h-3 mr-1" />
              À valider
            </button>
          </div>
          
          {canEdit() && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle procédure
            </button>
          )}
        </div>
      </div>

      {/* Liste des procédures */}
      {procedures.length === 0 || filteredProcedures.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune procédure
          </h3>
          <p className="text-gray-500">
            {procedures.length === 0 
              ? (service === 'toutes-les-procedures' 
                ? 'Aucune procédure disponible pour le moment.'
                : `Aucune procédure disponible pour le service ${serviceDisplayName}.`)
              : `Aucune procédure ${statusFilter === 'validated' ? 'validée' : statusFilter === 'pending' ? 'en attente de validation' : ''} trouvée.`
            }
          </p>
          {canEdit() && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Créer la première procédure
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProcedures.map((procedure) => (
            <div
              key={procedure.id}
              className={`rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${hasUserValidated(procedure.id) 
                ? 'bg-green-50 border border-green-200' 
                : procedure.assignedUsers?.includes(currentUser?.uid || '') 
                  ? 'bg-orange-50 border border-orange-200' 
                  : 'bg-white border border-gray-200'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {procedure.title}
                    </h3>
                    {procedure.version && (
                      <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
                        v{procedure.version}
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      procedure.type === 'emergency' 
                        ? 'bg-red-100 text-red-800'
                        : procedure.type === 'training'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {procedure.type === 'emergency' ? 'Urgent' : 
                       procedure.type === 'training' ? 'Formation' : 
                       procedure.type === 'quality' ? 'Qualité' : 'Standard'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {procedure.description}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {procedure.assignedUsers?.length || 0} utilisateur{(procedure.assignedUsers?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    {(isSystemAdmin || isHotelAdmin) && (
                      <span className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Validations: {getValidationCount(procedure.id)}/{procedure.assignedUsers?.length || 0}
                      </span>
                    )}
                    {procedure.assignedUsers?.includes(currentUser?.uid || '') && (
                      <span className={`flex items-center font-medium ${hasUserValidated(procedure.id) ? 'text-green-600' : 'text-orange-600'}`}>
                        {hasUserValidated(procedure.id) 
                          ? <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Validée
                            </>
                          : <>
                              <Clock className="w-4 h-4 mr-1" />
                              À valider
                            </>
                        }
                      </span>
                    )}
                    {procedure.pdfUrl && (
                      <a 
                        href={procedure.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        PDF joint
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedProcedure(procedure)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Voir les détails"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  
                  {canEdit() && (
                    <>
                      <button
                        onClick={() => setEditingProcedure(procedure)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(procedure)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ProcedureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        procedure={null}
        onSuccess={handleSuccess}
      />

      <ProcedureModal
        isOpen={!!editingProcedure}
        onClose={() => setEditingProcedure(null)}
        procedure={editingProcedure}
        onSuccess={handleSuccess}
      />

      <ProcedureDetail
        isOpen={!!selectedProcedure}
        onClose={() => setSelectedProcedure(null)}
        procedure={selectedProcedure}
        onEdit={setEditingProcedure}
      />
      </div>
    </Layout>
  );
}
