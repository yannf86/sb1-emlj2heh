import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, FileText, CheckCircle, Clock, Users, Edit, Trash2 } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { procedureService } from '../services/firebase/procedureService';
import { hotelsService } from '../services/firebase/hotelsService';
import { useAuth } from '../contexts/AuthContext';
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
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);

  // Récupération des procédures avec permissions
  const { data: allProcedures = [], isLoading: proceduresLoading } = useQuery({
    queryKey: ['procedures', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];
      
      // Les administrateurs système et d'hôtel peuvent voir toutes les procédures
      if (currentUser.role === 'system_admin' || currentUser.role === 'hotel_admin') {
        return procedureService.getAllProcedures();
      }
      
      // Les autres utilisateurs ne voient que les procédures qui leur sont assignées
      return procedureService.getProceduresForUser(currentUser.uid);
    },
    enabled: !!currentUser
  });

  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => hotelsService.getHotels()
  });

  // Filtrer les procédures par service avec useMemo pour éviter les re-rendus infinis
  const procedures = useMemo(() => {
    const serviceNameForFilter = getServiceFromUrl(service || '');
    return allProcedures.filter(procedure => 
      service === 'toutes-les-procedures' || procedure.service === serviceNameForFilter
    );
  }, [allProcedures, service]);



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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/procedures')}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour aux services
          </button>
          <div className="flex items-center space-x-3">
            {serviceIcons[serviceDisplayName]}
            <h1 className="text-2xl font-bold text-gray-900">
              {serviceDisplayName}
            </h1>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
              {procedures.length} procédure{procedures.length !== 1 ? 's' : ''}
            </span>
          </div>
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

      {/* Liste des procédures */}
      {procedures.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune procédure
          </h3>
          <p className="text-gray-500">
            {service === 'toutes-les-procedures' 
              ? 'Aucune procédure disponible pour le moment.'
              : `Aucune procédure disponible pour le service ${serviceDisplayName}.`
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
          {procedures.map((procedure) => (
            <div
              key={procedure.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
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
                      procedure.type === 'urgent' 
                        ? 'bg-red-100 text-red-800'
                        : procedure.type === 'important'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {procedure.type === 'urgent' ? 'Urgent' : 
                       procedure.type === 'important' ? 'Important' : 'Standard'}
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
                    <span className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Validations: 0
                    </span>
                    {procedure.pdfUrl && (
                      <span className="flex items-center text-blue-600">
                        <FileText className="w-4 h-4 mr-1" />
                        PDF joint
                      </span>
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
