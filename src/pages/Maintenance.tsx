import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import TechnicalInterventionModal from '../components/TechnicalInterventions/TechnicalInterventionModal';
import TechnicalInterventionHistoryModal from '../components/TechnicalInterventions/TechnicalInterventionHistoryModal';
import TechnicalAnalytics from '../components/TechnicalInterventions/TechnicalAnalytics';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search,
  Plus,
  Filter,
  Download,
  FileText,
  Eye,
  Edit,
  Trash2,
  Camera,
  BarChart3,
  User,
  Users,
  Euro,
  Award,
  Check,
  XCircle,
  Clock,
  History
} from 'lucide-react';
import { TechnicalIntervention, Technician } from '../types/maintenance';
import { Parameter } from '../types/parameters';
import { User as UserType } from '../types/users';
import { Hotel } from '../types/parameters';
import { technicalInterventionsService } from '../services/firebase/technicalInterventionsService';
import { techniciansService } from '../services/firebase/techniciansService';
import { parametersService } from '../services/firebase/parametersService';
import { hotelsService } from '../services/firebase/hotelsService';
import { usersService } from '../services/firebase/usersService';
import { useAuth } from '../contexts/AuthContext';
import { useUserPermissions } from '../hooks/useUserPermissions';

export default function Maintenance() {
  const { currentUser } = useAuth();
  const { userData, accessibleHotels, isSystemAdmin, initialized } = useUserPermissions();
  const [interventions, setInterventions] = useState<TechnicalIntervention[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [interventionTypes, setInterventionTypes] = useState<Parameter[]>([]);
  const [statuses, setStatuses] = useState<Parameter[]>([]);
  const [locations, setLocations] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Définir le statut par défaut sur "tous les statuts" pour afficher toutes les interventions
  const [selectedStatus, setSelectedStatus] = useState('all'); // Valeur par défaut: tous les statuts
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('7days'); // Valeur par défaut: 7 derniers jours
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<TechnicalIntervention | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  // États pour le modal de confirmation de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [interventionToDelete, setInterventionToDelete] = useState<TechnicalIntervention | null>(null);

  // État pour le modal d'historique
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // useEffect pour le chargement initial des données une fois que l'utilisateur est initialisé
  useEffect(() => {
    if (currentUser?.email && initialized) {
      console.log('Maintenance: Chargement initial des données après initialisation...', { accessibleHotels });
      loadData();
    }
  }, [currentUser, initialized, accessibleHotels]); // Déclencher lorsque l'utilisateur est chargé ET initialisé ET que les hôtels accessibles sont disponibles

  // useEffect pour réagir aux changements de filtres
  useEffect(() => {
    if (userData && currentUser?.email && initialized) {
      console.log('Maintenance: Rechargement des données suite à un changement de filtre:', { selectedStatus, selectedHotel, selectedPeriod });
      loadData();
    }
  }, [selectedStatus, selectedHotel, selectedPeriod, userData, initialized]);
  
  // useEffect pour charger les données initiales des paramètres (statuts, types, etc.)
  useEffect(() => {
    const loadParameters = async () => {
      try {
        console.log('Maintenance: Chargement initial des paramètres...');
        const [hotelsData, statusesData, interventionTypesData, locationsData] = await Promise.all([
          hotelsService.getHotels(),
          parametersService.getParameters('parameters_status'),
          parametersService.getParameters('parameters_intervention_type'),
          parametersService.getParameters('parameters_location'),
        ]);
        
        // Filtrer les hôtels selon les permissions
        const filteredHotels = isSystemAdmin 
          ? hotelsData 
          : hotelsData.filter(hotel => accessibleHotels.includes(hotel.id));
        
        console.log('Maintenance: Hôtels filtrés:', { 
          total: hotelsData.length, 
          accessibles: filteredHotels.length, 
          accessibleHotels 
        });
        
        setHotels(filteredHotels);
        setStatuses(statusesData.filter(p => p.active));
        setInterventionTypes(interventionTypesData.filter(p => p.active));
        setLocations(locationsData.filter(p => p.active));
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    };
    
    if (initialized && accessibleHotels.length > 0) {
      loadParameters();
    }
  }, [initialized, accessibleHotels, isSystemAdmin]);

  const loadData = async () => {
    if (!currentUser?.email || !initialized) return;
    
    setLoading(true);
    try {
      // Calculer la date de début en fonction de la période sélectionnée
      let startDate: Date | null = null;
      const now = new Date();
      
      if (selectedPeriod === '7days') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else if (selectedPeriod === '30days') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
      } else if (selectedPeriod === '90days') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 90);
      } else if (selectedPeriod === 'year') {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
      }
      
      console.log('Maintenance: Chargement des interventions avec les filtres:', {
        email: currentUser.email,
        hotel: selectedHotel,
        status: selectedStatus,
        startDate: startDate
      });

      const [
        interventionsData, 
        techniciansData, 
        usersData,
        hotelsData,
        interventionTypesData, 
        statusesData,
        locationsData
      ] = await Promise.all([
        technicalInterventionsService.getInterventions(currentUser.email, selectedHotel, selectedStatus, 100, startDate),
        techniciansService.getTechnicians(),
        usersService.getUsers(),
        hotelsService.getHotels(),
        parametersService.getParameters('parameters_intervention_type'),
        parametersService.getParameters('parameters_status'),
        parametersService.getParameters('parameters_location'),
      ]);
      
      console.log('Maintenance: Données chargées:', { 
        interventions: interventionsData.length,
        statuses: statusesData.length,
        hotels: hotelsData.length
      });
      
      setInterventions(interventionsData);
      setTechnicians(techniciansData.filter(t => t.active));
      setUsers(usersData.filter(u => u.active));
      setInterventionTypes(interventionTypesData.filter(p => p.active));
      
      // Filtrer et logger les statuts pour débogage
      const activeStatuses = statusesData.filter(p => p.active);
      console.log('Maintenance: Statuts disponibles:', activeStatuses);
      console.log('Maintenance: Statut "en cours" présent?', activeStatuses.some(s => s.id === 'CZa3iy84r8pVqjVOQHNL'));
      setStatuses(activeStatuses);
      
      setLocations(locationsData.filter(p => p.active));
      
      // Filtrer les hôtels selon les permissions
      // À ce stade, accessibleHotels devrait être correctement chargé
      console.log('Maintenance: Filtrage des hôtels avec accessibleHotels:', accessibleHotels);
      
      const accessibleHotelsList = isSystemAdmin 
        ? hotelsData 
        : hotelsData.filter(hotel => accessibleHotels.includes(hotel.id));
      
      setHotels(accessibleHotelsList);
      
      // Débogage pour comprendre pourquoi le filtre d'hôtel ne s'affiche pas
      console.log('Maintenance: Hôtels accessibles après filtrage:', {
        accessibleHotels,
        accessibleHotelsList,
        isSystemAdmin,
        hotelsLength: accessibleHotelsList.length
      });
      
      // Ne pas auto-sélectionner le premier hôtel pour permettre de voir tous les hôtels accessibles
      // lorsque l'utilisateur sélectionne "Tous les hôtels accessibles"
      console.log('Maintenance: Pas d\'auto-sélection du premier hôtel, affichage de tous les hôtels accessibles');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntervention = async (interventionData: Omit<TechnicalIntervention, 'id'>, beforePhoto?: File, afterPhoto?: File) => {
    try {
      await technicalInterventionsService.addIntervention(interventionData, beforePhoto, afterPhoto);
      loadData();
    } catch (error) {
      console.error('Error creating intervention:', error);
      alert('Erreur lors de la création de l\'intervention');
    }
  };

  const handleUpdateIntervention = async (interventionData: Omit<TechnicalIntervention, 'id'>, beforePhoto?: File, afterPhoto?: File) => {
    try {
      if (selectedIntervention) {
        await technicalInterventionsService.updateIntervention(selectedIntervention.id, interventionData, beforePhoto, afterPhoto);
        loadData();
      }
    } catch (error) {
      console.error('Error updating intervention:', error);
      alert('Erreur lors de la modification de l\'intervention');
    }
  };

  const openDeleteModal = (intervention: TechnicalIntervention) => {
    // Vérifier si l'utilisateur a les permissions pour supprimer (admin ou créateur)
    if (isSystemAdmin || (userData && intervention.createdBy === userData.id)) {
      setInterventionToDelete(intervention);
      setIsDeleteModalOpen(true);
    } else {
      // Optionnel: afficher un message d'erreur si quelqu'un essaie de contourner la désactivation du bouton
      console.warn('Permission refusée: seul le créateur ou un administrateur peut supprimer cette intervention');
    }
  };

  const confirmDelete = async () => {
    if (!interventionToDelete) {
      console.log('Aucune intervention à supprimer');
      return;
    }
    
    try {
      setLoading(true);
      const idToDelete = interventionToDelete.id;
      console.log(`Début de la suppression de l'intervention: ${idToDelete}`);
      
      // Fermer le modal avant de procéder à la suppression
      setIsDeleteModalOpen(false);
      setInterventionToDelete(null);
      
      // Procéder à la suppression
      await technicalInterventionsService.deleteIntervention(idToDelete);
      console.log(`Suppression de l'intervention ${idToDelete} réussie`);
      
      // Recharger les données après un court délai pour s'assurer que Firebase a bien enregistré les changements
      setTimeout(async () => {
        try {
          await loadData();
          console.log('Données rechargées après suppression');
          alert('Intervention supprimée avec succès');
        } catch (reloadError) {
          console.error('Erreur lors du rechargement des données:', reloadError);
        } finally {
          setLoading(false);
        }
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setLoading(false);
    }
  };

  const openEditModal = (intervention: TechnicalIntervention) => {
    setSelectedIntervention(intervention);
    setIsEditMode(true);
    setIsInterventionModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedIntervention(null);
    setIsEditMode(false);
    setIsInterventionModalOpen(true);
  };

  const openHistoryModal = (intervention: TechnicalIntervention) => {
    setSelectedIntervention(intervention);
    setIsHistoryModalOpen(true);
  };

  const getStatusColor = (statusId: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-orange-100 text-orange-700',
      'in_progress': 'bg-blue-100 text-blue-700', 
      'completed': 'bg-green-100 text-green-700',
      'cancelled': 'bg-gray-100 text-gray-700'
    };
    return colors[statusId] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    return status?.label || statusId;
  };

  const getInterventionTypeLabel = (typeId: string) => {
    const type = interventionTypes.find(t => t.id === typeId);
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

  const getAssignedPersonName = (intervention: TechnicalIntervention): string => {
    if (!intervention.assignedTo) return 'Non assigné';
    
    if (intervention.assignedToType === 'user') {
      const user = users.find(u => u.id === intervention.assignedTo);
      return user?.name || 'Utilisateur inconnu';
    } else {
      // Mapper depuis la collection technicians
      const technician = technicians.find(t => t.id === intervention.assignedTo);
      return technician?.name || 'Technicien inconnu';
    }
  };

  const getAssignedPersonIcon = (intervention: TechnicalIntervention) => {
    if (!intervention.assignedTo) return null;
    
    return intervention.assignedToType === 'user' ? (
      <User className="w-3 h-3 mr-1 text-blue-500" />
    ) : (
      <Users className="w-3 h-3 mr-1 text-green-500" />
    );
  };

  // Fonction pour récupérer le nom d'un technicien depuis la collection technicians
  const getTechnicianName = (technicianId: string): string => {
    const technician = technicians.find(t => t.id === technicianId);
    return technician?.name || 'Technicien inconnu';
  };
  
  // Fonction pour récupérer le nom d'un utilisateur depuis son ID
  const getUserNameById = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Utilisateur inconnu';
  };

  const getQuoteStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <Check className="w-3 h-3 text-green-600" />;
      case 'rejected': return <XCircle className="w-3 h-3 text-red-600" />;
      default: return <Clock className="w-3 h-3 text-orange-600" />;
    }
  };

  const renderQuotesSummary = (intervention: TechnicalIntervention) => {
    if (!intervention.hasQuote || !intervention.quotes || intervention.quotes.length === 0) {
      return <span className="text-xs text-warm-500">Aucun devis</span>;
    }

    const acceptedQuotes = intervention.quotes.filter(q => q.status === 'accepted');
    const rejectedQuotes = intervention.quotes.filter(q => q.status === 'rejected');
    const pendingQuotes = intervention.quotes.filter(q => q.status === 'pending');

    return (
      <div className="space-y-1">
        {intervention.quotes.map((quote) => (
          <div key={quote.id} className="text-xs flex items-center justify-between">
            <div className="flex items-center">
              {getQuoteStatusIcon(quote.status)}
              <span className="ml-1">{getTechnicianName(quote.technicianId)}</span>
            </div>
            <span className="font-medium">
              {(quote.amount - quote.discount).toFixed(0)}€
              {quote.discount > 0 && (
                <span className="text-green-600 ml-1">(-{quote.discount}€)</span>
              )}
            </span>
          </div>
        ))}
        
        <div className="text-xs text-warm-500 border-t pt-1 mt-1">
          {acceptedQuotes.length > 0 && (
            <span className="text-green-600">{acceptedQuotes.length} accepté{acceptedQuotes.length > 1 ? 's' : ''}</span>
          )}
          {pendingQuotes.length > 0 && (
            <span className="text-orange-600 ml-2">{pendingQuotes.length} en attente</span>
          )}
          {rejectedQuotes.length > 0 && (
            <span className="text-red-600 ml-2">{rejectedQuotes.length} refusé{rejectedQuotes.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    );
  };

  const getBestQuoteAmount = (intervention: TechnicalIntervention): number => {
    if (!intervention.hasQuote || !intervention.quotes || intervention.quotes.length === 0) {
      return intervention.finalCost || intervention.estimatedCost || 0;
    }

    const acceptedQuotes = intervention.quotes.filter(q => q.status === 'accepted');
    if (acceptedQuotes.length > 0) {
      return Math.min(...acceptedQuotes.map(q => q.amount - q.discount));
    }

    // Si pas de devis acceptés, retourner le coût final ou estimé
    return intervention.finalCost || intervention.estimatedCost || 0;
  };
  
  // Fonction pour exporter les données vers Excel
  const exportToExcel = () => {
    // Préparer les données pour l'export
    const dataToExport = filteredInterventions.map(intervention => ({
      'Date': intervention.date.toLocaleDateString('fr-FR'),
      'Heure': intervention.time,
      'Hôtel': getHotelName(intervention.hotelId),
      'Emplacement': getLocationLabel(intervention.location),
      'Type d\'intervention': getInterventionTypeLabel(intervention.interventionTypeId),
      'Description': intervention.description,
      'Photos': intervention.beforePhotoUrl && intervention.afterPhotoUrl ? 'Avant et Après' :
                intervention.beforePhotoUrl ? 'Avant' :
                intervention.afterPhotoUrl ? 'Après' : 'Non',
      'Assigné à': getAssignedPersonName(intervention),
      'Devis': intervention.hasQuote ? `${intervention.quotes?.length || 0} devis` : 'Non',
      'Meilleur prix': `${getBestQuoteAmount(intervention).toFixed(2)}€`,
      'Statut': getStatusLabel(intervention.statusId),
      'Créé par': intervention.createdBy ? getUserNameById(intervention.createdBy) : 'Non spécifié'
    }));

    // Créer un workbook et une worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Ajuster la largeur des colonnes pour une meilleure lisibilité
    const wscols = [
      { wch: 12 }, // Date
      { wch: 8 },  // Heure
      { wch: 15 }, // Hôtel
      { wch: 15 }, // Emplacement
      { wch: 20 }, // Type d'intervention
      { wch: 50 }, // Description
      { wch: 15 }, // Photos
      { wch: 15 }, // Assigné à
      { wch: 10 }, // Devis
      { wch: 15 }, // Meilleur prix
      { wch: 15 }, // Statut
      { wch: 15 }  // Créé par
    ];
    ws['!cols'] = wscols;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Interventions');

    // Générer le fichier Excel
    const fileName = `interventions_techniques_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Fonction pour exporter les données vers PDF
  const exportToPDF = () => {
    try {
      console.log('Début de l\'export PDF...');
      // Créer un nouveau document PDF
      const doc = new jsPDF('landscape');
      
      // Ajouter un titre
      doc.setFontSize(18);
      doc.text('Liste des Interventions Techniques', 14, 22);
      doc.setFontSize(11);
      doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
      
      // Préparer les données pour le tableau avec toutes les colonnes demandées
      const tableColumn = [
        'Date', 'Hôtel', 'Emplacement', 'Type', 'Description', 
        'Photos', 'Assigné à', 'Devis', 'Meilleur prix', 'Statut', 'Créé par'
      ];
      
      const tableRows = filteredInterventions.map(intervention => [
        `${intervention.date.toLocaleDateString('fr-FR')} ${intervention.time}`,
        getHotelName(intervention.hotelId),
        getLocationLabel(intervention.location),
        getInterventionTypeLabel(intervention.interventionTypeId),
        intervention.description, // Texte complet
        intervention.beforePhotoUrl && intervention.afterPhotoUrl ? 'Avant et Après' :
        intervention.beforePhotoUrl ? 'Avant' :
        intervention.afterPhotoUrl ? 'Après' : 'Non',
        getAssignedPersonName(intervention),
        intervention.hasQuote ? `${intervention.quotes?.length || 0} devis` : 'Non',
        `${getBestQuoteAmount(intervention).toFixed(2)}€`,
        getStatusLabel(intervention.statusId),
        intervention.createdBy ? getUserNameById(intervention.createdBy) : 'Non spécifié'
      ]);
      
      console.log('Données préparées pour le PDF:', { tableColumn, rowCount: tableRows.length });
      
      // Générer le tableau avec cellule qui s'adapte au contenu
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },  // Date
          1: { cellWidth: 20 },  // Hôtel
          2: { cellWidth: 20 },  // Emplacement
          3: { cellWidth: 20 },  // Type
          4: { cellWidth: 'auto', minCellWidth: 40 }, // Description - s'adapte au contenu
          5: { cellWidth: 15 },  // Photos
          6: { cellWidth: 20 },  // Assigné à
          7: { cellWidth: 15 },  // Devis
          8: { cellWidth: 15 },  // Meilleur prix
          9: { cellWidth: 15 },  // Statut
          10: { cellWidth: 20 }  // Créé par
        },
        headStyles: { fillColor: [204, 153, 0] },
        didDrawPage: (data) => {
          // Ajouter numéro de page
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber} / ${doc.getNumberOfPages()}`,
            doc.internal.pageSize.width - 20, 
            doc.internal.pageSize.height - 10
          );
        }
      });
      
      console.log('Tableau généré, sauvegarde du PDF...');
      // Enregistrer le PDF
      const fileName = `interventions_techniques_export_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      console.log('PDF exporté avec succès:', fileName);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Une erreur est survenue lors de l\'export PDF. Veuillez vérifier la console pour plus de détails.');
    }
  };

  const filteredInterventions = interventions
    .filter(intervention => {
      const matchesSearch = intervention.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getInterventionTypeLabel(intervention.interventionTypeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getHotelName(intervention.hotelId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getAssignedPersonName(intervention).toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    // Trier les interventions par date (les plus récentes en premier)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Ordre décroissant (plus récent en premier)
    });

  return (
    <Layout title="Suivi Technique" subtitle="Gestion de la maintenance technique">
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
                Liste des Interventions
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
                Nouvelle Intervention
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
                <option value="all">Tous les hôtels accessibles</option>
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
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>

              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                <option value="7days">7 derniers jours</option>
                <option value="30days">30 derniers jours</option>
                <option value="90days">90 derniers jours</option>
                <option value="year">12 derniers mois</option>
                <option value="all">Toutes les dates</option>
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
                      Type d'intervention
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Photos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Assigné à
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Devis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider">
                      Coût
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
                      <td colSpan={11} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Chargement...
                        </div>
                      </td>
                    </tr>
                  ) : filteredInterventions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-warm-500">
                        Aucune intervention trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredInterventions.map((intervention) => (
                      <tr key={intervention.id} className="hover:bg-warm-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-warm-900">
                            {intervention.date.toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-xs text-warm-500">
                            {intervention.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-warm-700">{getHotelName(intervention.hotelId)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-warm-700">{getLocationLabel(intervention.location)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-warm-700">{getInterventionTypeLabel(intervention.interventionTypeId)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-warm-900 max-w-xs truncate" title={intervention.description}>
                            {intervention.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center space-x-2">
                            {intervention.beforePhotoUrl && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                <Camera className="w-3 h-3 mr-1" />
                                Avant
                              </span>
                            )}
                            {intervention.afterPhotoUrl && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                <Camera className="w-3 h-3 mr-1" />
                                Après
                              </span>
                            )}
                            {!intervention.beforePhotoUrl && !intervention.afterPhotoUrl && (
                              <span className="text-xs text-warm-500">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-warm-700">
                            {getAssignedPersonIcon(intervention)}
                            <span className="truncate max-w-[120px]" title={getAssignedPersonName(intervention)}>
                              {getAssignedPersonName(intervention)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="max-w-[200px]">
                            {renderQuotesSummary(intervention)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-warm-900">
                            <div className="flex items-center">
                              <Euro className="w-3 h-3 mr-1 text-warm-400" />
                              <span className="font-medium">{getBestQuoteAmount(intervention).toFixed(2)}€</span>
                            </div>
                            {intervention.hasQuote && intervention.quotes && intervention.quotes.some(q => q.status === 'accepted' && q.discount > 0) && (
                              <div className="text-xs text-green-600 flex items-center mt-1">
                                <Award className="w-3 h-3 mr-1" />
                                Avec remise
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(intervention.statusId)}`}>
                            {getStatusLabel(intervention.statusId)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditModal(intervention)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(intervention)}
                              className="text-creho-600 hover:text-creho-900 transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(intervention)}
                              className={`transition-colors ${isSystemAdmin || (userData && intervention.createdBy === userData.id) 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-gray-300 cursor-not-allowed'}`}
                              title={isSystemAdmin || (userData && intervention.createdBy === userData.id)
                                ? "Supprimer"
                                : "Seul le créateur ou un administrateur peut supprimer cette intervention"}
                              disabled={!(isSystemAdmin || (userData && intervention.createdBy === userData.id))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openHistoryModal(intervention)}
                              className="text-purple-600 hover:text-purple-900 transition-colors"
                              title="Historique des modifications"
                            >
                              <History className="w-4 h-4" />
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
          <TechnicalAnalytics />
        )}
      </div>

      {/* Modal */}
      <TechnicalInterventionModal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        onSubmit={isEditMode ? handleUpdateIntervention : handleCreateIntervention}
        intervention={selectedIntervention}
        isEdit={isEditMode}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setInterventionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette intervention ?"
        itemName={interventionToDelete?.description}
      />

      {/* Modal d'historique */}
      {selectedIntervention && (
        <TechnicalInterventionHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          intervention={selectedIntervention}
        />
      )}
    </Layout>
  );
}