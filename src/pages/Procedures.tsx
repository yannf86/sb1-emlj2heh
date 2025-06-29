import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, CheckCircle, Clock } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { procedureService } from '../services/firebase/procedureService';
import { useAuth } from '../contexts/AuthContext';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { procedureServices } from '../types/procedure';
import ProcedureModal from '../components/Procedures/ProcedureModal';

export default function Procedures() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isSystemAdmin, isHotelAdmin, accessibleHotels } = useUserPermissions();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  


  // Récupération des données avec permissions
  const { data: procedures = [], isLoading: proceduresLoading } = useQuery({
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

  // Filtrer les procédures selon les permissions
  const filteredProcedures = useMemo(() => {
    if (!currentUser) return [];
    
    let filtered = [];
    
    if (isSystemAdmin) {
      // Les admin système voient toutes les procédures
      filtered = procedures;
    } else if (isHotelAdmin && accessibleHotels.length > 0) {
      // Les admin hôtel ne voient que les procédures des hôtels auxquels ils ont accès
      filtered = procedures.filter(procedure => 
        procedure.hotels?.some(hotelId => accessibleHotels.includes(hotelId))
      );
    } else {
      // Les utilisateurs standards ne voient que les procédures qui leur sont assignées
      filtered = procedures.filter(procedure => 
        procedure.assignedUsers?.includes(currentUser.uid)
      );
    }
    
    return filtered;
  }, [currentUser, procedures, isSystemAdmin, isHotelAdmin, accessibleHotels]);

  // Récupérer les validations de l'utilisateur connecté
  const { data: userAcknowledgments = [] } = useQuery<any[]>({
    queryKey: ['user-acknowledgments', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];
      
      // Récupérer toutes les validations de l'utilisateur
      const allAcknowledgments = [];
      for (const procedure of procedures) {
        try {
          const procedureAcks = await procedureService.getProcedureAcknowledgments(procedure.id);
          // Filtrer pour ne garder que les validations de l'utilisateur connecté
          const userAcks = procedureAcks.filter(ack => ack.userId === currentUser.uid);
          allAcknowledgments.push(...userAcks);
        } catch (error) {
          console.error(`Erreur lors de la récupération des validations pour ${procedure.id}:`, error);
        }
      }
      return allAcknowledgments;
    },
    enabled: !!currentUser && procedures.length > 0
  });

  // Grouper les procédures par service pour afficher les compteurs
  const proceduresByService = procedureServices.reduce((acc, service) => {
    acc[service] = filteredProcedures.filter((p: any) => p.service === service);
    return acc;
  }, {} as Record<string, any[]>);

  // Fonction pour calculer les procédures à valider par service pour l'utilisateur connecté
  const getProceduresToValidateByService = (service: string) => {
    if (!currentUser) return { toValidate: 0, total: 0 };
    
    const serviceProcedures = proceduresByService[service] || [];
    // Filtrer les procédures assignées à l'utilisateur connecté
    const assignedProcedures = serviceProcedures.filter(p => 
      p.assignedUsers && p.assignedUsers.includes(currentUser.uid)
    );
    
    // Compter les procédures déjà validées par l'utilisateur
    const validatedProcedures = assignedProcedures.filter(p => 
      userAcknowledgments.some(ack => ack.procedureId === p.id)
    );
    
    return {
      toValidate: assignedProcedures.length - validatedProcedures.length,
      total: assignedProcedures.length,
      validated: validatedProcedures.length
    };
  };


  const canCreateProcedure = () => {
    if (!currentUser) return false;
    return isSystemAdmin || isHotelAdmin;
  };

  const handleCreateProcedure = () => {
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['procedures'] });
  };

  const handleInitializeVersions = async () => {
    if (!currentUser || !isSystemAdmin) return;
    
    const confirmed = window.confirm(
      'Voulez-vous initialiser les versions pour toutes les procédures existantes ?'
    );
    
    if (confirmed) {
      try {
        await procedureService.initializeProcedureVersions();
        alert('Versions initialisées avec succès !');
        queryClient.invalidateQueries({ queryKey: ['procedures'] });
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des versions:', error);
        alert('Erreur lors de l\'initialisation des versions');
      }
    }
  };

  const getServiceIcon = (service: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Réception': '👥',
      'Housekeeping': '🛏️',
      'Restauration': '🍽️',
      'Technique': '🔧',
      'Sécurité': '🛡️',
      'Spa & Bien-être': '🧘',
      'Événementiel': '🎉',
      'Commercial': '💼',
      'Administration': '📊'
    };
    return icons[service] || '📋';
  };

  const getServiceUrl = (service: string) => {
    const serviceUrls: Record<string, string> = {
      'Réception': 'reception',
      'Housekeeping': 'housekeeping',
      'Restauration': 'restauration',
      'Technique': 'technique',
      'Sécurité': 'securite',
      'Spa & Bien-être': 'spa-bien-etre',
      'Événementiel': 'evenementiel',
      'Commercial': 'commercial',
      'Administration': 'administration'
    };
    return serviceUrls[service] || service.toLowerCase().replace(/\s+/g, '-');
  };

  if (proceduresLoading) {
    return (
      <Layout title="Procédures" subtitle="Gestion des procédures et documents par service">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des procédures...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Procédures" subtitle="Gestion des procédures et documents par service">
      <div className="space-y-6">
        {/* En-tête avec actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Espace réservé pour maintenir la mise en page */}
          <div></div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {canCreateProcedure() && (
              <button
                onClick={handleCreateProcedure}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Procédure
              </button>
            )}
            {isSystemAdmin && (
              <button
                onClick={handleInitializeVersions}
                className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                title="Initialiser les versions pour les procédures existantes"
              >
                Initialiser Versions
              </button>
            )}
            <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
          </div>
        </div>

        {/* Filtre par service */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium mb-4">Services</h3>
          <p className="text-gray-600 text-sm mb-4">
            Sélectionnez un service pour consulter les procédures associées
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/procedures/service/toutes-les-procedures')}
              className="p-4 rounded-lg border text-left transition-colors border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">📋</span>
                  <h3 className="text-lg font-medium text-gray-900">Toutes les procédures</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {filteredProcedures.length} procédure{filteredProcedures.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {/* Indicateur de validation pour l'utilisateur */}
              {(() => {
                // Calculer le total de toutes les procédures à valider
                const totalStats = procedureServices.reduce((acc, service) => {
                  const stats = getProceduresToValidateByService(service);
                  acc.toValidate += stats.toValidate;
                  acc.total += stats.total;
                  return acc;
                }, { toValidate: 0, total: 0 });
                
                return totalStats.total > 0 ? (
                  <div className={`text-sm mt-1 ${totalStats.toValidate === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {totalStats.toValidate === 0 
                      ? <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Validation OK</span>
                      : <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> À valider : {totalStats.toValidate}/{totalStats.total}</span>
                    }
                  </div>
                ) : null;
              })()}
            </button>

            {procedureServices.map(service => {
              const serviceCount = proceduresByService[service]?.length || 0;
              const validationStats = getProceduresToValidateByService(service);
              return (
                <button
                  key={service}
                  onClick={() => navigate(`/procedures/service/${getServiceUrl(service)}`)}
                  className="p-4 rounded-lg border text-left transition-colors border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">{getServiceIcon(service)}</span>
                      <h3 className="text-lg font-medium text-gray-900">{service}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                        {proceduresByService[service]?.length || 0} procédure{(proceduresByService[service]?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  {/* Indicateur de validation pour l'utilisateur */}
                  {getProceduresToValidateByService(service).total > 0 && (
                    <div className={`text-sm mt-1 ${getProceduresToValidateByService(service).toValidate === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {getProceduresToValidateByService(service).toValidate === 0 
                        ? <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Validation OK</span>
                        : <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> À valider : {getProceduresToValidateByService(service).toValidate}/{getProceduresToValidateByService(service).total}</span>
                      }
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de création de procédure */}
      <ProcedureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        procedure={null}
        onSuccess={handleSuccess}
      />
    </Layout>
  );
}
