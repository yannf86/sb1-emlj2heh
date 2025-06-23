import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import IncidentModal from '../components/Incidents/IncidentModal';
import IncidentAnalytics from '../components/Incidents/IncidentAnalytics';
import IncidentHistoryModal from '../components/Incidents/IncidentHistoryModal';
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
  BarChart3,
  History
} from 'lucide-react';
import { Incident } from '../types/incidents';
import { Parameter, Hotel } from '../types/parameters';
import { User as UserType } from '../types/users';
import { incidentsService } from '../services/firebase/incidentsService';
import { parametersService } from '../services/firebase/parametersService';
import { usersService } from '../services/firebase/usersService';
import { hotelsService } from '../services/firebase/hotelsService';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { useAuth } from '../contexts/AuthContext';

export default function Incidents() {
  const { currentUser } = useAuth();
  const { userData, accessibleHotels, isSystemAdmin, initialized } = useUserPermissions();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [categories, setCategories] = useState<Parameter[]>([]);
  const [impacts, setImpacts] = useState<Parameter[]>([]);
  const [statuses, setStatuses] = useState<Parameter[]>([]);
  const [locations, setLocations] = useState<Parameter[]>([]);
  const [satisfactionTypes, setSatisfactionTypes] = useState<Parameter[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('CZa3iy84r8pVqjVOQHNL'); // Valeur par défaut: en cours
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('7days'); // Valeur par défaut: 7 derniers jours
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // États pour le modal de confirmation de suppression
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);

  // useEffect pour le chargement initial des données une fois que l'utilisateur est initialisé
  useEffect(() => {
    if (currentUser?.email && initialized) {
      console.log('Chargement initial des données après initialisation...');
      loadData();
    }
  }, [currentUser, initialized]); // Déclencher lorsque l'utilisateur est chargé ET initialisé

  // useEffect existant pour réagir aux changements de filtres
  useEffect(() => {
    if (userData && currentUser?.email && initialized) {
      console.log('Rechargement des données suite à un changement de filtre:', { selectedStatus, selectedHotel, selectedPeriod });
      loadData();
    }
  }, [selectedStatus, selectedHotel, selectedPeriod, userData, initialized]);

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
      
      console.log('Chargement des incidents avec les filtres:', {
        email: currentUser.email,
        hotel: selectedHotel,
        status: selectedStatus,
        startDate: startDate
      });

      const [
        incidentsData,
        categoriesData,
        impactsData,
        statusesData,
        locationsData,
        satisfactionData,
        usersData,
        hotelsData,
      ] = await Promise.all([
        incidentsService.getIncidents(currentUser.email, selectedHotel, selectedStatus, 100, startDate),
        parametersService.getParameters('parameters_incident_category'),
        parametersService.getParameters('parameters_impact'),
        parametersService.getParameters('parameters_status'),
        parametersService.getParameters('parameters_location'),
        parametersService.getParameters('parameters_client_satisfaction'),
        usersService.getUsers(),
        hotelsService.getHotels(),
      ]);
      
      console.log('Données chargées:', { 
        incidents: incidentsData.length,
        statuses: statusesData.length,
        hotels: hotelsData.length
      });
      
      setIncidents(incidentsData);
      setCategories(categoriesData.filter((p: Parameter) => p.active));
      setImpacts(impactsData.filter((p: Parameter) => p.active));
      setStatuses(statusesData.filter((p: Parameter) => p.active));
      setLocations(locationsData.filter((p: Parameter) => p.active));
      setSatisfactionTypes(satisfactionData.filter((p: Parameter) => p.active));
      setUsers(usersData);
      
      // Filtrer les hôtels selon les permissions
      // À ce stade, accessibleHotels devrait être correctement chargé
      console.log('Filtrage des hôtels avec accessibleHotels:', accessibleHotels);
      
      const accessibleHotelsList = isSystemAdmin 
        ? hotelsData 
        : hotelsData.filter((hotel: Hotel) => accessibleHotels.includes(hotel.id));
      
      setHotels(accessibleHotelsList);
      
      // Débogage pour comprendre pourquoi le filtre d'hôtel ne s'affiche pas
      console.log('Hôtels accessibles après filtrage:', {
        accessibleHotels,
        accessibleHotelsList,
        isSystemAdmin,
        hotelsLength: accessibleHotelsList.length
      });
      
      // Ne pas auto-sélectionner le premier hôtel pour permettre de voir tous les hôtels accessibles
      // lorsque l'utilisateur sélectionne "Tous les hôtels accessibles"
      console.log('Incidents: Pas d\'auto-sélection du premier hôtel, affichage de tous les hôtels accessibles');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (incidentData: Omit<Incident, 'id'>) => {
    try {
      if (!currentUser?.email) return;
      console.log('Création d\'incident avec les données:', incidentData);
      
      // Vérifier que le statusId est un ID valide et pas une chaîne comme "open"
      if (incidentData.statusId === 'open') {
        console.warn('Attention: statusId "open" détecté, cela devrait être un ID valide de la collection de statuts');
        // Corriger le statusId si nécessaire pour utiliser l'ID du statut "en cours"
        // incidentData = { ...incidentData, statusId: 'CZa3iy84r8pVqjVOQHNL' };
      }
      
      const newIncidentId = await incidentsService.addIncident(incidentData, currentUser.email);
      console.log('Incident créé avec succès, ID:', newIncidentId);
      
      // Recharger complètement les données en forçant une nouvelle requête
      // Cette approche est similaire à celle utilisée pour résoudre le problème du Dashboard
      setIncidents([]);
      setLoading(true);
      await loadData();
      
      // Si l'incident n'apparaît toujours pas, vérifier les filtres actuels
      console.log('Filtres actuels - Hôtel:', selectedHotel, 'Statut:', selectedStatus);
      
      // Vérifier si le statut de l'incident correspond au filtre actuel
      if (selectedStatus !== 'all' && incidentData.statusId !== selectedStatus) {
        console.warn(`L'incident créé a le statut ${incidentData.statusId} mais le filtre actuel est ${selectedStatus}. ` +
                     `Changez le filtre pour voir l'incident.`);
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      alert('Erreur lors de la création de l\'incident');
    }
  };

  const handleUpdateIncident = async (incidentData: Omit<Incident, 'id'>) => {
    try {
      if (selectedIncident && currentUser?.email) {
        // Ajouter l'ID de l'utilisateur actuel comme updatedBy pour tracer correctement qui a effectué la modification
        const updatedIncidentData = {
          ...incidentData,
          updatedBy: currentUser.uid || 'unknown'
        };
        
        await incidentsService.updateIncident(selectedIncident.id, updatedIncidentData, currentUser.email);
        loadData();
      }
    } catch (error) {
      console.error('Error updating incident:', error);
      alert('Erreur lors de la modification de l\'incident');
    }
  };

  const openDeleteModal = (incident: Incident) => {
    // Vérifier si l'utilisateur est autorisé à supprimer l'incident (admin ou créateur)
    const canDelete = isSystemAdmin || (userData && incident.receivedById === userData.id);
    
    if (!canDelete) {
      alert('Vous n\'\u00eates pas autorisé à supprimer cet incident. Seul le créateur ou un administrateur peut le supprimer.');
      return;
    }
    
    setIncidentToDelete(incident);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!incidentToDelete || !currentUser?.email) return;
    
    try {
      await incidentsService.deleteIncident(incidentToDelete.id, currentUser.email);
      await loadData();
      setIncidentToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting incident:', error);
      alert(error.message || 'Erreur lors de la suppression de l\'incident');
    }
  };

  const openEditModal = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsEditMode(true);
    setIsIncidentModalOpen(true);
  };

  const openViewModal = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsEditMode(false); // Mode lecture seule
    setIsIncidentModalOpen(true);
  };

  const openHistoryModal = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsHistoryModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedIncident(null);
    setIsEditMode(false);
    setIsIncidentModalOpen(true);
  };

  const getUserNameById = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user?.name || userId;
  };

  const getStatusColor = (statusId: string) => {
    const colors: { [key: string]: string } = {
      'open': 'bg-red-100 text-red-700',
      'in_progress': 'bg-yellow-100 text-yellow-700', 
      'resolved': 'bg-green-100 text-green-700',
      'closed': 'bg-gray-100 text-gray-700'
    };
    return colors[statusId] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    return status?.label || statusId;
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.label || categoryId;
  };

  const getImpactLabel = (impactId: string) => {
    const impact = impacts.find(i => i.id === impactId);
    return impact?.label || impactId;
  };

  // Fonction pour exporter les données vers Excel
  const exportToExcel = () => {
    // Préparer les données pour l'export avec toutes les colonnes
    const dataToExport = filteredIncidents.map(incident => ({
      'Date': incident.date.toLocaleDateString('fr-FR'),
      'Heure': incident.time,
      'Hôtel': getHotelName(incident.hotelId || ''),
      'Catégorie': getCategoryLabel(incident.categoryId),
      'Lieu': getLocationLabel(incident.location || (incident as any).locationId),
      'Impact': getImpactLabel(incident.impactId),
      'Description': incident.description,
      'Client': incident.clientName || '-',
      'Chambre': incident.clientRoom || '-',
      'Reçu par': getUserNameById(incident.receivedById),
      'Statut': getStatusLabel(incident.statusId),
      'Description résolution': incident.resolutionDescription || '-',
      'Conclu par': incident.assignedTo ? getUserNameById(incident.assignedTo) : '-',
      'Satisfaction client': incident.clientSatisfactionId ? getSatisfactionEmoji(incident.clientSatisfactionId) : '-',
      'Type de résolution': incident.resolutionType || '-',
      'Compensation': incident.actualCost ? `${incident.actualCost} €` : '-'
    }));

    // Créer un workbook et une worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Ajuster la largeur des colonnes pour une meilleure lisibilité
    const wscols = [
      { wch: 12 }, // Date
      { wch: 8 },  // Heure
      { wch: 15 }, // Hôtel
      { wch: 15 }, // Catégorie
      { wch: 15 }, // Lieu
      { wch: 10 }, // Impact
      { wch: 50 }, // Description
      { wch: 15 }, // Client
      { wch: 10 }, // Chambre
      { wch: 15 }, // Reçu par
      { wch: 15 }, // Statut
      { wch: 50 }, // Description résolution
      { wch: 15 }, // Conclu par
      { wch: 18 }, // Satisfaction client
      { wch: 20 }, // Type de résolution
      { wch: 15 }  // Compensation
    ];
    ws['!cols'] = wscols;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Incidents');

    // Générer le fichier Excel
    const fileName = `incidents_export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      doc.text('Liste des Incidents', 14, 22);
      doc.setFontSize(11);
      doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
      
      // Préparer les données pour le tableau avec toutes les colonnes demandées
      const tableColumn = [
        'Date', 'Hôtel', 'Catégorie', 'Impact', 'Description', 
        'Client', 'Reçu par', 'Statut', 'Résolution', 'Conclu par', 
        'Satisfaction client', 'Compensation'
      ];
      
      const tableRows = filteredIncidents.map(incident => [
        `${incident.date.toLocaleDateString('fr-FR')} ${incident.time}`,
        getHotelName(incident.hotelId || ''),
        getCategoryLabel(incident.categoryId),
        getImpactLabel(incident.impactId),
        incident.description, // Texte complet
        incident.clientName || '-',
        getUserNameById(incident.receivedById),
        getStatusLabel(incident.statusId),
        incident.resolutionDescription || '-', // Texte complet
        incident.assignedTo ? getUserNameById(incident.assignedTo) : '-', // Conclu par
        incident.clientSatisfactionId ? getSatisfactionEmoji(incident.clientSatisfactionId) : '-', // Satisfaction client
        incident.actualCost ? `${incident.actualCost} €` : '-' // Compensation
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
          2: { cellWidth: 20 },  // Catégorie
          3: { cellWidth: 15 },  // Impact
          4: { cellWidth: 'auto', minCellWidth: 40 }, // Description - s'adapte au contenu
          5: { cellWidth: 20 },  // Client
          6: { cellWidth: 20 },  // Reçu par
          7: { cellWidth: 15 },  // Statut
          8: { cellWidth: 'auto', minCellWidth: 40 }, // Résolution - s'adapte au contenu
          9: { cellWidth: 20 },  // Conclu par
          10: { cellWidth: 15 }, // Satisfaction
          11: { cellWidth: 15 }  // Compensation
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
      const fileName = `incidents_export_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      console.log('PDF exporté avec succès:', fileName);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Une erreur est survenue lors de l\'export PDF. Veuillez vérifier la console pour plus de détails.');
    }
  };

  // Nous utilisons directement l'ID comme label pour le type de résolution
  // Cette fonction peut être améliorée plus tard si nécessaire

  const getLocationLabel = (locationId: string | undefined) => {
    if (!locationId) return '-';
    const location = locations.find(l => l.id === locationId);
    return location?.label || locationId;
  };

  const getImpactColor = (impactId: string) => {
    // Correspondance directe entre les IDs d'impact et les couleurs
    // Basée sur les IDs fournis par l'utilisateur
    const impactColorMap: {[key: string]: string} = {
      // Aucun (gris)
      'cw5bdJmkxWEFnwx7n2i5': 'text-gray-500',
      
      // Faible (vert)
      'c6MWUSL8v22pCBwAsd0J': 'text-green-600',
      
      // Moyen (jaune)
      'AhAQmoMeWdeUfh5C1Z7C': 'text-yellow-600',
      
      // Élevé (orange)
      'KexNZn1snytEiVmv2kBH': 'text-orange-600',
      
      // Très Élevé (rouge)
      'oqk3A0VC1Y2KxB3h0ba9': 'text-red-600',
      
      // Anciens IDs conservés pour compatibilité
      'cPMK4L8v2JzCRwLu8Y': 'text-green-600',
      'AOw2wNdHdUFMCIZZw': 'text-green-600',
      'ANqPqPWudNfPKJZCv': 'text-yellow-600',
      'AOw2wNdHdUFMCIZZ': 'text-yellow-600',
      'KmDw21wvtE1WvJdEN': 'text-orange-600',
      'KmDw21wvtE1WvJdE': 'text-orange-600',
      'qgDwMOV1XJQw82MdEP': 'text-red-600',
      'qgDwMOV1XJQw82Md': 'text-red-600',
    };
    
    // Si l'ID est directement dans notre mapping
    if (impactColorMap[impactId]) {
      return impactColorMap[impactId];
    }
    
    // Sinon, on utilise la méthode par libellé comme fallback
    const impact = impacts.find(i => i.id === impactId);
    const impactLabel = impact?.label || '';
    
    if (impactLabel.toLowerCase().includes('aucun')) {
      return 'text-gray-500';
    } else if (impactLabel.toLowerCase().includes('faible')) {
      return 'text-green-600';
    } else if (impactLabel.toLowerCase().includes('moyen')) {
      return 'text-yellow-600';
    } else if (impactLabel.toLowerCase().includes('élev') && !impactLabel.toLowerCase().includes('très')) {
      return 'text-orange-600';
    } else if (impactLabel.toLowerCase().includes('très') || impactLabel.toLowerCase().includes('critique')) {
      return 'text-red-600';
    }
    
    return 'text-gray-600';
  };

  const getImpactGradientStyle = (impactId: string) => {
    // Correspondance directe entre les IDs d'impact et les styles de dégradé
    // Basée sur les IDs fournis par l'utilisateur
    const impactGradientMap: {[key: string]: string} = {
      // Aucun (gris)
      'cw5bdJmkxWEFnwx7n2i5': 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300',
      
      // Faible (vert)
      'c6MWUSL8v22pCBwAsd0J': 'bg-gradient-to-r from-green-100 to-green-200 border-green-300',
      
      // Moyen (jaune)
      'AhAQmoMeWdeUfh5C1Z7C': 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300',
      
      // Élevé (orange)
      'KexNZn1snytEiVmv2kBH': 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300',
      
      // Très Élevé (rouge)
      'oqk3A0VC1Y2KxB3h0ba9': 'bg-gradient-to-r from-red-100 to-red-300 border-red-400',
      
      // Anciens IDs conservés pour compatibilité
      'cPMK4L8v2JzCRwLu8Y': 'bg-gradient-to-r from-green-100 to-green-200 border-green-300',
      'AOw2wNdHdUFMCIZZw': 'bg-gradient-to-r from-green-100 to-green-200 border-green-300',
      'ANqPqPWudNfPKJZCv': 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300',
      'AOw2wNdHdUFMCIZZ': 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300',
      'KmDw21wvtE1WvJdEN': 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300',
      'KmDw21wvtE1WvJdE': 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300',
      'qgDwMOV1XJQw82MdEP': 'bg-gradient-to-r from-red-100 to-red-300 border-red-400',
      'qgDwMOV1XJQw82Md': 'bg-gradient-to-r from-red-100 to-red-300 border-red-400',
    };
    
    // Si l'ID est directement dans notre mapping
    if (impactGradientMap[impactId]) {
      return impactGradientMap[impactId];
    }
    
    // Sinon, on utilise la méthode par libellé comme fallback
    const impact = impacts.find(i => i.id === impactId);
    const impactLabel = impact?.label || '';
    
    if (impactLabel.toLowerCase().includes('aucun')) {
      return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300';
    } else if (impactLabel.toLowerCase().includes('faible')) {
      return 'bg-gradient-to-r from-green-100 to-green-200 border-green-300';
    } else if (impactLabel.toLowerCase().includes('moyen')) {
      return 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300';
    } else if (impactLabel.toLowerCase().includes('élev') && !impactLabel.toLowerCase().includes('très')) {
      return 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300';
    } else if (impactLabel.toLowerCase().includes('très') || impactLabel.toLowerCase().includes('critique')) {
      return 'bg-gradient-to-r from-red-100 to-red-300 border-red-400';
    }
    
    return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300';
  };

  const getSatisfactionLabel = (satisfactionId: string) => {
    const satisfaction = satisfactionTypes.find(s => s.id === satisfactionId);
    return satisfaction?.label || satisfactionId;
  };

  const getSatisfactionEmoji = (satisfactionId: string) => {
    const emojis: { [key: string]: string } = {
      'satisfied': '😊',
      'neutral': '😐',
      'unsatisfied': '😞'
    };
    const satisfaction = satisfactionTypes.find(s => s.id === satisfactionId);
    return emojis[satisfaction?.code || ''] || '';
  };

  const getHotelName = (hotelId: string) => {
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel?.name || 'Hôtel inconnu';
  };

  const filteredIncidents = incidents
    .filter(incident => {
      const matchesSearch = incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getUserNameById(incident.receivedById).toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    // Trier les incidents par date (les plus récents en premier)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Ordre décroissant (plus récent en premier)
    });



  return (
    <Layout title="Suivi des Incidents" subtitle="Gestion et analyse des incidents signalés">
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
                Liste des Incidents
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
                Nouvel Incident
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

              {/* Sélecteur de période */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                <option value="7days">7 derniers jours</option>
                <option value="30days">30 derniers jours</option>
                <option value="90days">3 derniers mois</option>
                <option value="year">12 derniers mois</option>
                <option value="all">Toutes les périodes</option>
              </select>

              {/* Sélecteur d'hôtel - toujours visible */}
              <select
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                {/* Option "Tous les hôtels accessibles" disponible pour tous les utilisateurs */}
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
                {/* Placer "En cours" en premier, puis les autres statuts, et enfin "Tous les statuts" */}
                <option value="CZa3iy84r8pVqjVOQHNL">En cours</option>
                {statuses
                  .filter(status => status.id !== 'CZa3iy84r8pVqjVOQHNL') // Exclure "En cours" car déjà ajouté
                  .map(status => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                <option value="all">Tous les statuts</option>
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
            <div className="relative overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-warm-50 border-b border-warm-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider w-24 min-w-[90px]">
                      Date
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider w-28 min-w-[100px]">
                      Hôtel
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider w-28 min-w-[100px]">
                      Catégorie
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider w-24 min-w-[90px]">
                      Lieu
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider w-24 min-w-[90px]">
                      Impact
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider min-w-[150px] max-w-[200px]">
                      Description
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider w-24 min-w-[90px]">
                      Client
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider w-24 min-w-[90px]">
                      Reçu par
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider min-w-[150px] max-w-[200px]">
                      Résolution
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider w-24 min-w-[90px]">
                      Satisfaction
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider w-24 min-w-[90px]">
                      Statut
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-warm-500 uppercase tracking-wider w-20 min-w-[80px] sticky right-0 bg-warm-50">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-warm-200">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="px-3 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Chargement...
                        </div>
                      </td>
                    </tr>
                  ) : filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-3 py-12 text-center text-warm-500">
                        {accessibleHotels.length === 0 
                          ? "Aucun hôtel accessible. Contactez votre administrateur."
                          : "Aucun incident trouvé"
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((incident) => (
                      <tr key={incident.id} className="hover:bg-warm-50">
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm text-warm-900">
                            {incident.date.toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-xs text-warm-500">
                            {incident.time}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-warm-700 line-clamp-2">{getHotelName(incident.hotelId || '')}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-warm-700 line-clamp-2">{getCategoryLabel(incident.categoryId)}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-warm-700 line-clamp-2">{getLocationLabel(incident.location || (incident as any).locationId)}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`text-sm font-medium px-2 py-1 rounded-full border ${getImpactGradientStyle(incident.impactId)} ${getImpactColor(incident.impactId)}`}>
                            {getImpactLabel(incident.impactId)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm text-warm-900 max-w-[200px] truncate" title={incident.description}>
                            {incident.description}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm text-warm-900 line-clamp-1">{incident.clientName || '-'}</div>
                          {incident.clientRoom && (
                            <div className="text-xs text-warm-500">Ch. {incident.clientRoom}</div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-warm-700 line-clamp-2">{getUserNameById(incident.receivedById)}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm text-warm-900 max-w-[200px] truncate" title={incident.resolutionDescription}>
                            {incident.resolutionDescription || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <div className="text-lg">
                            {getSatisfactionEmoji(incident.clientSatisfactionId || '')}
                          </div>
                          {incident.clientSatisfactionId && (
                            <div className="text-xs text-warm-500 truncate">
                              {getSatisfactionLabel(incident.clientSatisfactionId)}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(incident.statusId)}`}>
                            {getStatusLabel(incident.statusId)}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium sticky right-0 bg-white shadow-l">
                          <div className="flex items-center space-x-2 justify-center">
                            <button
                              onClick={() => openViewModal(incident)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(incident)}
                              className="text-creho-600 hover:text-creho-900 transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {/* Bouton de suppression - visible uniquement pour admin ou créateur */}
                            <button
                              onClick={() => openDeleteModal(incident)}
                              className={`transition-colors ${isSystemAdmin || (userData && incident.receivedById === userData.id) 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-gray-300 cursor-not-allowed'}`}
                              title={isSystemAdmin || (userData && incident.receivedById === userData.id)
                                ? "Supprimer"
                                : "Seul le créateur ou un administrateur peut supprimer cet incident"}
                              disabled={!(isSystemAdmin || (userData && incident.receivedById === userData.id))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openHistoryModal(incident)}
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
          <IncidentAnalytics />
        )}
      </div>

      {/* Modal */}
      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        onSubmit={isEditMode ? handleUpdateIncident : handleCreateIncident}
        incident={selectedIncident}
        isEdit={isEditMode}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setIncidentToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cet incident ?"
        itemName={incidentToDelete?.description ? 
          incidentToDelete.description.substring(0, 50) + (incidentToDelete.description.length > 50 ? '...' : '') 
          : undefined
        }
      />

      {/* Modal d'historique */}
      {selectedIncident && (
        <IncidentHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          incident={selectedIncident}
        />
      )}
    </Layout>
  );
}
