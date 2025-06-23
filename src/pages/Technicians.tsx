import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import TechnicianModal from '../components/Technicians/TechnicianModal';
import TechnicianPasswordResetModal from '../components/Technicians/TechnicianPasswordResetModal';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import {
  Search,
  Plus,
  Mail,
  Edit,
  Trash2,
  Filter,
  RefreshCw,
  User,
  Euro,
  Phone,
  Building
} from 'lucide-react';
import { Technician } from '../types/maintenance';
import { Hotel } from '../types/parameters';
import { appModules } from '../types/users';
import { techniciansService } from '../services/firebase/techniciansService';
import { hotelsService } from '../services/firebase/hotelsService';

export default function Technicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isTechnicianModalOpen, setIsTechnicianModalOpen] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // États pour le modal de confirmation de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [technicianToDelete, setTechnicianToDelete] = useState<Technician | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedHotel]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [techniciansData, hotelsData] = await Promise.all([
        techniciansService.getTechnicians(selectedHotel),
        hotelsService.getHotels()
      ]);
      setTechnicians(techniciansData);
      setHotels(hotelsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTechnician = async (technicianData: Omit<Technician, 'id'>, password?: string) => {
    try {
      await techniciansService.addTechnician(technicianData, password);
      loadData();
    } catch (error) {
      console.error('Error creating technician:', error);
      alert('Erreur lors de la création du technicien');
    }
  };

  const handleUpdateTechnician = async (technicianData: Omit<Technician, 'id'>) => {
    try {
      if (selectedTechnician) {
        await techniciansService.updateTechnician(selectedTechnician.id, technicianData);
        loadData();
      }
    } catch (error) {
      console.error('Error updating technician:', error);
      alert('Erreur lors de la modification du technicien');
    }
  };

  const openDeleteModal = (technician: Technician) => {
    setTechnicianToDelete(technician);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!technicianToDelete) return;
    
    try {
      await techniciansService.deleteTechnician(technicianToDelete.id);
      await loadData();
      setTechnicianToDelete(null);
    } catch (error) {
      console.error('Error deleting technician:', error);
      alert('Erreur lors de la suppression du technicien');
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      await techniciansService.sendPasswordReset(email);
      alert('Email de réinitialisation envoyé avec succès');
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('Erreur lors de l\'envoi de l\'email');
    }
  };

  const openEditModal = (technician: Technician) => {
    setSelectedTechnician(technician);
    setIsEditMode(true);
    setIsTechnicianModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedTechnician(null);
    setIsEditMode(false);
    setIsTechnicianModalOpen(true);
  };

  const openPasswordResetModal = (technician: Technician) => {
    setSelectedTechnician(technician);
    setIsPasswordResetModalOpen(true);
  };

  const getHotelNames = (hotelIds: string[]) => {
    if (hotelIds.length === 0) return 'Aucun hôtel';
    const names = hotelIds.map(id => {
      const hotel = hotels.find(h => h.id === id);
      return hotel?.name || 'Hôtel inconnu';
    });
    return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
  };

  const getModuleCount = (moduleIds: string[]) => {
    if (moduleIds.length === 0) return 'Aucun module';
    if (moduleIds.length === appModules.length) return 'Tous les modules';
    return `${moduleIds.length} module${moduleIds.length > 1 ? 's' : ''}`;
  };

  const getAvailabilityColor = (availability: string) => {
    const colors = {
      available: 'bg-green-100 text-green-700',
      busy: 'bg-orange-100 text-orange-700',
      unavailable: 'bg-red-100 text-red-700'
    };
    return colors[availability as keyof typeof colors] || colors.available;
  };

  const getAvailabilityLabel = (availability: string) => {
    const labels = {
      available: 'Disponible',
      busy: 'Occupé',
      unavailable: 'Indisponible'
    };
    return labels[availability as keyof typeof labels] || availability;
  };

  const filteredTechnicians = technicians.filter(technician => {
    const matchesSearch = technician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         technician.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (technician.company && technician.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && technician.active) ||
                         (selectedStatus === 'inactive' && !technician.active);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout title="Gestion des Techniciens" subtitle="Gérer les techniciens et leurs assignations pour la maintenance">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-warm-900">Liste des Techniciens</h1>
              <p className="text-warm-600">{filteredTechnicians.length} technicien{filteredTechnicians.length > 1 ? 's' : ''} au total</p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Technicien
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un technicien..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 w-full"
              />
            </div>

            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
            >
              <option value="all">Tous les hôtels</option>
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>

            <button
              onClick={loadData}
              className="p-2 border border-warm-300 rounded-lg hover:bg-warm-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-warm-600" />
            </button>
          </div>
        </div>

        {/* Technicians Table */}
        <div className="bg-white rounded-lg border border-warm-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-warm-50 border-b border-warm-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Technicien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Entreprise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Hôtels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Modules
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Taux horaire
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-warm-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Chargement...
                      </div>
                    </td>
                  </tr>
                ) : filteredTechnicians.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-warm-500">
                      Aucun technicien trouvé
                    </td>
                  </tr>
                ) : (
                  filteredTechnicians.map((technician) => (
                    <tr key={technician.id} className="hover:bg-warm-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-creho-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-creho-600 font-semibold text-sm">
                              {technician.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-warm-900">{technician.name}</div>
                            <div className="text-xs text-warm-500">
                              {technician.specialties.slice(0, 2).join(', ')}
                              {technician.specialties.length > 2 && ` +${technician.specialties.length - 2}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-warm-700">
                          <div className="flex items-center mb-1">
                            <Mail className="w-3 h-3 mr-1 text-warm-400" />
                            {technician.email}
                          </div>
                          {technician.phone && (
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1 text-warm-400" />
                              <span className="text-xs">{technician.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-2 text-warm-400" />
                          <span className="text-sm text-warm-700">{technician.company || 'Non spécifié'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-warm-600" title={getHotelNames(technician.hotels)}>
                          {technician.hotels.length} hôtel{technician.hotels.length > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-warm-600">
                          {getModuleCount(technician.modules)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Euro className="w-4 h-4 mr-1 text-warm-400" />
                          <span className="text-sm font-medium text-warm-900">{technician.hourlyRate}€/h</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            technician.active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {technician.active ? 'Actif' : 'Inactif'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAvailabilityColor(technician.availability)}`}>
                            {getAvailabilityLabel(technician.availability)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openPasswordResetModal(technician)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Envoyer email de réinitialisation"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(technician)}
                            className="text-creho-600 hover:text-creho-900 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(technician)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TechnicianModal
        isOpen={isTechnicianModalOpen}
        onClose={() => setIsTechnicianModalOpen(false)}
        onSubmit={isEditMode ? handleUpdateTechnician : handleCreateTechnician}
        technician={selectedTechnician}
        isEdit={isEditMode}
      />

      <TechnicianPasswordResetModal
        isOpen={isPasswordResetModalOpen}
        onClose={() => setIsPasswordResetModalOpen(false)}
        onSubmit={handlePasswordReset}
        technicianName={selectedTechnician?.name || ''}
        technicianEmail={selectedTechnician?.email || ''}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTechnicianToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce technicien ?"
        itemName={technicianToDelete?.name}
      />
    </Layout>
  );
}