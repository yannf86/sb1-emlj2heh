import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Layout from '../components/Layout/Layout';
import LostItemModal from '../components/LostItems/LostItemModal';
import LostItemDetailModal from '../components/LostItems/LostItemDetailModal';
import LostItemAnalytics from '../components/LostItems/LostItemAnalytics';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import {
  Search,
  Plus,
  Filter,
  Download,
  FileText,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  User,
  CheckCircle,
  Package,
  MapPin
} from 'lucide-react';
import { LostItem } from '../types/lostItems';
import { Parameter, Hotel } from '../types/parameters';
import { User as UserType } from '../types/users';
import { lostItemsService } from '../services/firebase/lostItemsService';
import { parametersService } from '../services/firebase/parametersService';
import { hotelsService } from '../services/firebase/hotelsService';
import { usersService } from '../services/firebase/usersService';
import { useUserPermissions } from '../hooks/useUserPermissions';

export default function LostItems() {
  const { userData, initialized, isSystemAdmin } = useUserPermissions();
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [locations, setLocations] = useState<Parameter[]>([]);
  const [itemTypes, setItemTypes] = useState<Parameter[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [isLostItemModalOpen, setIsLostItemModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLostItem, setSelectedLostItem] = useState<LostItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  // États pour le modal de confirmation de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LostItem | null>(null);

  useEffect(() => {
    if (initialized && userData?.email) {
      loadData();
    }
  }, [selectedStatus, selectedHotel, initialized, userData]);

  const loadData = async () => {
    if (!userData?.email) return;
    
    setLoading(true);
    console.log(' [LostItems] loadData called with filters:', { selectedHotel, selectedStatus });
    
    try {
      const [
        lostItemsData, 
        hotelsData, 
        locationsData, 
        itemTypesData, 
        usersData
      ] = await Promise.all([
        lostItemsService.getLostItems(userData.email, selectedHotel, selectedStatus),
        hotelsService.getHotels(),
        parametersService.getParameters('parameters_location'),
        parametersService.getParameters('parameters_lost_item_type'),
        usersService.getUsers(),
      ]);
      
      console.log(' [LostItems] Data loaded:', {
        lostItems: lostItemsData.length,
        hotels: hotelsData.length,
        locations: locationsData.length,
        itemTypes: itemTypesData.length,
        users: usersData.length
      });
      
      setLostItems(lostItemsData);
      setHotels(hotelsData);
      setLocations(locationsData.filter(p => p.active));
      setItemTypes(itemTypesData.filter(p => p.active));
      setUsers(usersData.filter(u => u.active));
    } catch (error) {
      console.error(' [LostItems] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLostItem = async (lostItemData: Omit<LostItem, 'id'>, photo?: File) => {
    if (!userData?.email) return;
    
    try {
      await lostItemsService.addLostItem(lostItemData, photo);
      loadData();
    } catch (error) {
      console.error('Error creating lost item:', error);
    }
  };

  const handleUpdateLostItem = async (lostItemData: Omit<LostItem, 'id'>, photo?: File, deletePhoto?: boolean) => {
    if (!userData?.email || !selectedLostItem) return;
    
    try {
      await lostItemsService.updateLostItem(selectedLostItem.id, lostItemData, photo, deletePhoto);
      loadData();
    } catch (error) {
      console.error('Error updating lost item:', error);
    }
  };

  const handleDeleteLostItem = async () => {
    if (!itemToDelete || !userData?.email) return;
    
    try {
      await lostItemsService.deleteLostItem(itemToDelete.id);
      await loadData();
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting lost item:', error);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const openDeleteModal = (lostItem: LostItem) => {
    // Vérifier si l'utilisateur est un administrateur système
    if (isSystemAdmin) {
      setItemToDelete(lostItem);
      setIsDeleteModalOpen(true);
    } else {
      // Afficher un message d'erreur si l'utilisateur n'est pas administrateur
      alert('Seuls les administrateurs peuvent supprimer des objets trouvés');
      console.warn('Permission refusée: seul un administrateur peut supprimer cet objet trouvé');
    }
  };

  const openEditModal = (lostItem: LostItem) => {
    setSelectedLostItem(lostItem);
    setIsEditMode(true);
    setIsLostItemModalOpen(true);
  };

  const openDetailModal = (lostItem: LostItem) => {
    setSelectedLostItem(lostItem);
    setIsDetailModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedLostItem(null);
    setIsEditMode(false);
    setIsLostItemModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'conserved': 'bg-orange-100 text-orange-700',
      'returned': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    return status === 'conserved' ? 'Conservé' : 'Rendu';
  };

  const getItemTypeLabel = (typeId: string) => {
    const type = itemTypes.find(t => t.id === typeId);
    return type?.label || typeId;
  };

  const getLocationLabel = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    return location?.label || locationId;
  };

  const getHotelName = (hotelId: string) => {
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel?.name || 'Hôtel inconnu';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Utilisateur inconnu';
  };

  // Fonction utilitaire pour formater les dates de manière sécurisée
  const formatDate = (date: any): string => {
    try {
      if (!date) return 'Date non définie';
      
      // Si c'est déjà une Date valide
      if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toLocaleDateString('fr-FR');
      }
      
      // Essayer de convertir en Date
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('fr-FR');
      }
      
      return 'Date invalide';
    } catch (error) {
      console.warn('Error formatting date:', error, date);
      return 'Date invalide';
    }
  };

  // Fonction pour exporter les données au format Excel
  const exportToExcel = () => {
    try {
      // Préparer les données pour l'export
      const exportData = filteredLostItems.map(item => ({
        'Date de découverte': formatDate(item.discoveryDate),
        'Hôtel': getHotelName(item.hotelId),
        'Lieu': getLocationLabel(item.locationId),
        'Type d\'objet': getItemTypeLabel(item.itemTypeId),
        'Description': item.description,
        'Trouvé par': getUserName(item.foundById),
        'Lieu de stockage': item.storageLocation,
        'Statut': getStatusLabel(item.status),
        'Rendu par': item.returnedById ? getUserName(item.returnedById) : '-',
        'Date de restitution': item.returnedDate ? formatDate(item.returnedDate) : '-',
        'Notes de restitution': item.returnedNotes || '-',
        'Créé le': formatDate(item.createdAt),
        'Mis à jour le': formatDate(item.updatedAt)
      }));
      
      // Créer un workbook et une worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Objets Trouvés');
      
      // Générer le fichier Excel
      const fileName = `objets_trouves_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      console.log('Export Excel réussi');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Une erreur est survenue lors de l\'export Excel. Veuillez réessayer.');
    }
  };

  // Fonction pour exporter les données au format PDF
  const exportToPDF = () => {
    try {
      // Créer un nouveau document PDF en format paysage (landscape)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Ajouter un titre
      doc.setFontSize(18);
      doc.text('Liste des Objets Trouvés', 14, 20);
      doc.setFontSize(11);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
      
      // Préparer les données pour le tableau avec plus de colonnes
      const tableData = filteredLostItems.map(item => [
        formatDate(item.discoveryDate),
        getHotelName(item.hotelId),
        getLocationLabel(item.locationId),
        getItemTypeLabel(item.itemTypeId),
        item.description.substring(0, 25) + (item.description.length > 25 ? '...' : ''),
        getUserName(item.foundById),
        item.storageLocation,
        getStatusLabel(item.status),
        item.returnedById ? getUserName(item.returnedById) : '-',
        item.returnedDate ? formatDate(item.returnedDate) : '-',
        item.returnedNotes ? (item.returnedNotes.substring(0, 20) + (item.returnedNotes.length > 20 ? '...' : '')) : '-'
      ]);
      
      // Définir les en-têtes du tableau avec les colonnes supplémentaires
      const headers = [
        'Date', 'Hôtel', 'Lieu', 'Type', 'Description', 'Trouvé par', 'Lieu stockage', 'Statut', 'Rendu par', 'Date restitution', 'Notes'
      ];
      
      // Générer le tableau dans le PDF
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 35,
        headStyles: { fillColor: [230, 126, 34] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 18 },  // Date
          1: { cellWidth: 25 },  // Hôtel
          2: { cellWidth: 18 },  // Lieu
          3: { cellWidth: 18 },  // Type
          4: { cellWidth: 30 },  // Description
          5: { cellWidth: 25 },  // Trouvé par
          6: { cellWidth: 25 },  // Lieu stockage
          7: { cellWidth: 15 },  // Statut
          8: { cellWidth: 25 },  // Rendu par
          9: { cellWidth: 18 },  // Date restitution
          10: { cellWidth: 30 }  // Notes
        }
      });
      
      // Sauvegarder le PDF
      const fileName = `objets_trouves_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      console.log('Export PDF réussi en format paysage avec colonnes supplémentaires');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Une erreur est survenue lors de l\'export PDF. Veuillez réessayer.');
    }
  };

  const filteredLostItems = lostItems.filter(item => {
    // Filtrage par terme de recherche seulement (hôtel et statut sont déjà filtrés côté serveur)
    if (!searchTerm) return true;
    
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getItemTypeLabel(item.itemTypeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getHotelName(item.hotelId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getUserName(item.foundById).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.storageLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <Layout title="Objets Trouvés" subtitle="Gestion des objets trouvés et perdus">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'bg-creho-500 text-white'
                    : 'text-warm-600 hover:text-warm-900'
                }`}
              >
                Liste des Objets
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-creho-500 text-white'
                    : 'text-warm-600 hover:text-warm-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2 inline" />
                Analytiques
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={exportToExcel}
                className="flex items-center px-3 py-2 text-warm-600 border border-warm-300 rounded-lg hover:bg-warm-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </button>
              <button 
                onClick={exportToPDF}
                className="flex items-center px-3 py-2 text-warm-600 border border-warm-300 rounded-lg hover:bg-warm-50 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Objet
              </button>
            </div>
          </div>

          {activeTab === 'list' && (
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher..."
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
                <option value="conserved">Conservés</option>
                <option value="returned">Rendus</option>
              </select>

              <button className="p-2 border border-warm-300 rounded-lg hover:bg-warm-50 transition-colors">
                <Filter className="w-4 h-4 text-warm-600" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === 'list' ? (
          <div className="bg-white rounded-lg border border-warm-200 overflow-hidden">
            {/* Compteur de résultats */}
            <div className="px-6 py-3 bg-warm-50 border-b border-warm-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-warm-600">
                  {loading ? (
                    'Chargement...'
                  ) : (
                    <>
                      <span className="font-medium text-warm-900">{filteredLostItems.length}</span>
                      {' '}objet{filteredLostItems.length !== 1 ? 's' : ''} trouvé{filteredLostItems.length !== 1 ? 's' : ''}
                      {searchTerm && (
                        <span className="ml-2 text-warm-500">
                          (filtré{filteredLostItems.length !== 1 ? 's' : ''} sur {lostItems.length})
                        </span>
                      )}
                    </>
                  )}
                </div>
                {!loading && filteredLostItems.length > 0 && (
                  <div className="text-xs text-warm-500">
                    Hôtel: {selectedHotel === 'all' ? 'Tous les hôtels' : getHotelName(selectedHotel)} • 
                    Statut: {selectedStatus === 'all' ? 'Tous les statuts' : selectedStatus === 'conserved' ? 'Conservés' : 'Rendus'}
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-warm-50 border-b border-warm-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Hôtel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Lieu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Trouvé par
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Stockage
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
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Chargement...
                        </div>
                      </td>
                    </tr>
                  ) : filteredLostItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-warm-500">
                        Aucun objet trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredLostItems.map((item) => (
                      <tr key={item.id} className="hover:bg-warm-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-warm-900">
                            {formatDate(item.discoveryDate)}
                          </div>
                          <div className="text-xs text-warm-500">
                            {item.discoveryTime}
                          </div>
                          <div className="text-xs text-warm-400 mt-1">
                            Créé le: {formatDate(item.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-warm-400 mr-2" />
                            <span className="text-sm text-warm-700">{getHotelName(item.hotelId)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-warm-700">{getLocationLabel(item.locationId)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="w-4 h-4 text-warm-400 mr-2" />
                            <span className="text-sm text-warm-700">{getItemTypeLabel(item.itemTypeId)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-warm-900 max-w-xs truncate" title={item.description}>
                            {item.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-warm-400 mr-2" />
                            <span className="text-sm text-warm-700">{getUserName(item.foundById)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="w-4 h-4 text-warm-400 mr-2" />
                            <span className="text-sm text-warm-700">{item.storageLocation}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                          {item.status === 'returned' && item.returnedDate && (
                            <div className="text-xs text-warm-500 mt-1 flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {formatDate(item.returnedDate)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openDetailModal(item)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="text-creho-600 hover:text-creho-900 transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(item)}
                              className={`${isSystemAdmin ? 'text-red-600 hover:text-red-900' : 'text-red-300 cursor-not-allowed'} transition-colors`}
                              title={isSystemAdmin ? 'Supprimer' : 'Seuls les administrateurs peuvent supprimer'}
                              disabled={!isSystemAdmin}
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
        ) : (
          <LostItemAnalytics />
        )}
      </div>

      {/* Modals */}
      <LostItemModal
        isOpen={isLostItemModalOpen}
        onClose={() => setIsLostItemModalOpen(false)}
        onSubmit={isEditMode ? handleUpdateLostItem : handleCreateLostItem}
        lostItem={selectedLostItem}
        isEdit={isEditMode}
      />

      <LostItemDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        lostItem={selectedLostItem}
        getHotelName={getHotelName}
        getLocationLabel={getLocationLabel}
        getItemTypeLabel={getItemTypeLabel}
        getUserName={getUserName}
        formatDate={formatDate}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteLostItem}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cet objet trouvé ?"
        itemName={itemToDelete?.description}
      />
    </Layout>
  );
}