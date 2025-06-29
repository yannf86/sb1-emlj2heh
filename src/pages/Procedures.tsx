import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { procedureService } from '../services/firebase/procedureService';
import { hotelsService } from '../services/firebase/hotelsService';
import { useAuth } from '../contexts/AuthContext';
import { procedureServices } from '../types/procedure';
import ProcedureModal from '../components/Procedures/ProcedureModal';

export default function Procedures() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  


  // Récupération des données avec permissions
  const { data: procedures = [], isLoading: proceduresLoading } = useQuery({
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



  // Grouper les procédures par service pour afficher les compteurs
  const proceduresByService = procedureServices.reduce((acc, service) => {
    acc[service] = procedures.filter(p => p.service === service);
    return acc;
  }, {} as Record<string, any[]>);

  const canCreateProcedure = () => {
    if (!currentUser) return false;
    return currentUser.role === 'system_admin' || currentUser.role === 'hotel_admin';
  };

  const handleCreateProcedure = () => {
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['procedures'] });
  };

  const handleInitializeVersions = async () => {
    if (!currentUser || currentUser.role !== 'system_admin') return;
    
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
          <div className="flex items-center text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {hotels.length} hôtels
            </span>
          </div>
          
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
            {currentUser?.role === 'system_admin' && (
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl mb-2">📋</div>
                  <h4 className="font-medium">Toutes les procédures</h4>
                  <p className="text-sm text-gray-600">{procedures.length} procédures</p>
                </div>
                <span className="text-sm text-gray-500">Voir →</span>
              </div>
            </button>

            {procedureServices.map(service => {
              const serviceCount = proceduresByService[service]?.length || 0;
              return (
                <button
                  key={service}
                  onClick={() => navigate(`/procedures/service/${getServiceUrl(service)}`)}
                  className="p-4 rounded-lg border text-left transition-colors border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl mb-2">{getServiceIcon(service)}</div>
                      <h4 className="font-medium">{service}</h4>
                      <p className="text-sm text-gray-600">{serviceCount} procédures</p>
                    </div>
                    <span className="text-sm text-gray-500">Voir →</span>
                  </div>
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
