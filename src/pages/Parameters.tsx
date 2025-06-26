import React, { useState, useEffect } from 'react';
import { useUserPermissions } from '../hooks/useUserPermissions';
import Layout from '../components/Layout/Layout';
import ParameterModal from '../components/Parameters/ParameterModal';
import HotelModal from '../components/Hotels/HotelModal';
import HotelCategoriesModal from '../components/Hotels/HotelCategoriesModal';
import HotelLocationsModal from '../components/Hotels/HotelLocationsModal';
import ChecklistMissionModal from '../components/ChecklistMissions/ChecklistMissionModal';
import ExperienceLevelModal from '../components/Gamification/ExperienceLevelModal';
import ActionPointModal from '../components/Gamification/ActionPointModal';
import BadgeModal from '../components/Gamification/BadgeModal';
import {
  MapPin,
  AlertTriangle,
  Activity,
  Flag,
  Wrench,
  Calendar,
  ClipboardCheck,
  Target,
  Package,
  FileText,
  BookOpen,
  CheckCircle,
  Star,
  Plus,
  Upload,
  Hotel,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Settings,
  Trophy,
  Zap,
  Award,
  RotateCcw
} from 'lucide-react';
import { parameterTypes, Parameter, Hotel as HotelType, ChecklistMission } from '../types/parameters';
import { ExperienceLevel, ActionPoint, Badge, GamificationSettings } from '../types/gamification';
import { parametersService } from '../services/firebase/parametersService';
import { hotelsService } from '../services/firebase/hotelsService';
import { checklistMissionsService } from '../services/firebase/checklistMissionsService';
import { gamificationService } from '../services/firebase/gamificationService';

const iconMap = {
  MapPin,
  AlertTriangle,
  Activity,
  Flag,
  Wrench,
  Calendar,
  ClipboardCheck,
  Target,
  Package,
  FileText,
  BookOpen,
  CheckCircle,
  Star,
  Hotel
};

const tabs = [
  { key: 'parameters', label: 'Paramètres', icon: MapPin },
  { key: 'missions', label: 'Missions Check-list', icon: CheckCircle },
  { key: 'hotels', label: 'Hôtels', icon: Hotel },
  { key: 'gamification', label: 'Gamification', icon: Star },
];

const gamificationTabs = [
  { key: 'levels', label: 'Niveaux d\'Expérience', icon: Trophy },
  { key: 'actions', label: 'Points d\'Action', icon: Zap },
  { key: 'badges', label: 'Badges', icon: Award },
  { key: 'challenges', label: 'Défis', icon: Target },
  { key: 'config', label: 'Configuration Générale', icon: Settings },
];

const actionCategories = [
  { value: 'all', label: 'Toutes les catégories' },
  { value: 'general', label: 'Général' },
  { value: 'incidents', label: 'Incidents' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'quality', label: 'Qualité' },
  { value: 'objects', label: 'Objets Trouvés' },
  { value: 'procedures', label: 'Procédures' },
];

const badgeCategories = [
  { value: 'all', label: 'Toutes les catégories' },
  { value: 'incidents', label: 'Incidents' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'quality', label: 'Qualité' },
  { value: 'objects', label: 'Objets Trouvés' },
  { value: 'procedures', label: 'Procédures' },
  { value: 'general', label: 'Général' },
  { value: 'special', label: 'Spéciaux' },
];

const serviceIcons: { [key: string]: string } = {
  housekeeping: '🧹',
  reception: '🏨',
  restaurant: '🍽️',
  maintenance: '🔧',
  direction: '👔',
  security: '🔒',
  bar: '🍷',
};

const serviceLabels: { [key: string]: string } = {
  housekeeping: 'Housekeeping',
  reception: 'Réception',
  restaurant: 'Restaurant',
  maintenance: 'Maintenance',
  direction: 'Direction',
  security: 'Sécurité',
  bar: 'Bar',
};

export default function Parameters() {
  const { isSystemAdmin } = useUserPermissions();
  const [activeTab, setActiveTab] = useState('parameters');
  const [activeGamificationTab, setActiveGamificationTab] = useState('levels');
  const [activeParameterType, setActiveParameterType] = useState(0);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [checklistMissions, setChecklistMissions] = useState<ChecklistMission[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>([]);
  const [actionPoints, setActionPoints] = useState<ActionPoint[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [gamificationSettings, setGamificationSettings] = useState<GamificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isLocationsModalOpen, setIsLocationsModalOpen] = useState(false);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState<Parameter | null>(null);
  const [editingHotel, setEditingHotel] = useState<HotelType | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelType | null>(null);
  const [editingMission, setEditingMission] = useState<ChecklistMission | null>(null);
  const [editingLevel, setEditingLevel] = useState<ExperienceLevel | null>(null);
  const [editingAction, setEditingAction] = useState<ActionPoint | null>(null);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedHotelsFilter, setSelectedHotelsFilter] = useState('all');
  const [selectedActionCategory, setSelectedActionCategory] = useState('all');
  const [selectedBadgeCategory, setSelectedBadgeCategory] = useState('all');

  const currentParameterType = parameterTypes[activeParameterType];

  useEffect(() => {
    if (activeTab === 'parameters') {
      loadParameters();
    } else if (activeTab === 'hotels') {
      loadHotels();
    } else if (activeTab === 'missions') {
      loadChecklistMissions();
      loadHotels(); // Needed for filters
    } else if (activeTab === 'gamification') {
      loadGamificationData();
    }
  }, [activeParameterType, activeTab, activeGamificationTab]);

  const loadParameters = async () => {
    setLoading(true);
    try {
      const data = await parametersService.getParameters(currentParameterType.collection);
      setParameters(data);
    } catch (error) {
      console.error('Error loading parameters:', error);
      setParameters([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHotels = async () => {
    setLoading(true);
    try {
      const data = await hotelsService.getHotels();
      setHotels(data);
    } catch (error) {
      console.error('Error loading hotels:', error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChecklistMissions = async () => {
    setLoading(true);
    try {
      const data = await checklistMissionsService.getChecklistMissions();
      setChecklistMissions(data);
    } catch (error) {
      console.error('Error loading checklist missions:', error);
      setChecklistMissions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGamificationData = async () => {
    setLoading(true);
    try {
      if (activeGamificationTab === 'levels') {
        const data = await gamificationService.getExperienceLevels();
        setExperienceLevels(data);
      } else if (activeGamificationTab === 'actions') {
        const data = await gamificationService.getActionPoints();
        setActionPoints(data);
      } else if (activeGamificationTab === 'badges') {
        const data = await gamificationService.getBadges();
        setBadges(data);
      } else if (activeGamificationTab === 'config') {
        const data = await gamificationService.getGamificationSettings();
        setGamificationSettings(data);
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParameter = async (parameterData: Omit<Parameter, 'id'>) => {
    try {
      await parametersService.addParameter(currentParameterType.collection, parameterData);
      loadParameters();
    } catch (error) {
      console.error('Error adding parameter:', error);
    }
  };

  const handleEditParameter = async (parameterData: Omit<Parameter, 'id'>) => {
    if (!editingParameter) return;
    
    try {
      await parametersService.updateParameter(
        currentParameterType.collection, 
        editingParameter.id, 
        parameterData
      );
      loadParameters();
      setEditingParameter(null);
    } catch (error) {
      console.error('Error updating parameter:', error);
    }
  };

  const handleDeleteParameter = async (id: string) => {
    if (!isSystemAdmin) {
      alert('Seuls les administrateurs système peuvent supprimer des paramètres.');
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paramètre ?')) return;
    
    try {
      await parametersService.deleteParameter(currentParameterType.collection, id);
      loadParameters();
    } catch (error) {
      console.error('Error deleting parameter:', error);
    }
  };

  const handleToggleStatus = async (id: string, active: boolean) => {
    try {
      await parametersService.toggleParameterStatus(currentParameterType.collection, id, active);
      loadParameters();
    } catch (error) {
      console.error('Error toggling parameter status:', error);
    }
  };

  const handleAddHotel = async (hotelData: Omit<HotelType, 'id'>) => {
    try {
      await hotelsService.addHotel(hotelData);
      loadHotels();
    } catch (error) {
      console.error('Error adding hotel:', error);
    }
  };

  const handleEditHotel = async (hotelData: Omit<HotelType, 'id'>) => {
    if (!editingHotel) return;
    
    try {
      await hotelsService.updateHotel(editingHotel.id, hotelData);
      loadHotels();
      setEditingHotel(null);
    } catch (error) {
      console.error('Error updating hotel:', error);
    }
  };

  const handleDeleteHotel = async (id: string) => {
    if (!isSystemAdmin) {
      alert('Seuls les administrateurs système peuvent supprimer des hôtels.');
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet hôtel ?')) return;
    
    try {
      await hotelsService.deleteHotel(id);
      loadHotels();
    } catch (error) {
      console.error('Error deleting hotel:', error);
    }
  };

  const handleUpdateHotelCategories = async (categoryIds: string[]) => {
    if (!selectedHotel) return;
    
    try {
      await hotelsService.updateHotelCategories(selectedHotel.id, categoryIds);
      loadHotels();
    } catch (error) {
      console.error('Error updating hotel categories:', error);
    }
  };

  const handleUpdateHotelLocations = async (locationIds: string[]) => {
    if (!selectedHotel) return;
    
    try {
      await hotelsService.updateHotelLocations(selectedHotel.id, locationIds);
      loadHotels();
    } catch (error) {
      console.error('Error updating hotel locations:', error);
    }
  };

  const handleAddMission = async (missionData: Omit<ChecklistMission, 'id'>, pdfFile?: File) => {
    try {
      await checklistMissionsService.addChecklistMission(missionData, pdfFile);
      loadChecklistMissions();
    } catch (error) {
      console.error('Error adding mission:', error);
    }
  };

  const handleEditMission = async (missionData: Omit<ChecklistMission, 'id'>, pdfFile?: File) => {
    if (!editingMission) return;
    
    try {
      await checklistMissionsService.updateChecklistMission(editingMission.id, missionData, pdfFile);
      loadChecklistMissions();
      setEditingMission(null);
    } catch (error) {
      console.error('Error updating mission:', error);
    }
  };

  const handleDeleteMission = async (id: string) => {
    if (!isSystemAdmin) {
      alert('Seuls les administrateurs système peuvent supprimer des missions.');
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) return;
    
    try {
      await checklistMissionsService.deleteChecklistMission(id);
      loadChecklistMissions();
    } catch (error) {
      console.error('Error deleting mission:', error);
    }
  };

  const handleAddLevel = async (levelData: Omit<ExperienceLevel, 'id'>) => {
    try {
      await gamificationService.addExperienceLevel(levelData);
      loadGamificationData();
    } catch (error) {
      console.error('Error adding level:', error);
    }
  };

  const handleEditLevel = async (levelData: Omit<ExperienceLevel, 'id'>) => {
    if (!editingLevel) return;
    
    try {
      await gamificationService.updateExperienceLevel(editingLevel.id, levelData);
      loadGamificationData();
      setEditingLevel(null);
    } catch (error) {
      console.error('Error updating level:', error);
    }
  };

  const handleDeleteLevel = async (id: string) => {
    if (!isSystemAdmin) {
      alert('Seuls les administrateurs système peuvent supprimer des niveaux d\'expérience.');
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce niveau ?')) return;
    
    try {
      await gamificationService.deleteExperienceLevel(id);
      loadGamificationData();
    } catch (error) {
      console.error('Error deleting level:', error);
    }
  };

  const handleAddAction = async (actionData: Omit<ActionPoint, 'id'>) => {
    try {
      await gamificationService.addActionPoint(actionData);
      loadGamificationData();
    } catch (error) {
      console.error('Error adding action:', error);
    }
  };

  const handleEditAction = async (actionData: Omit<ActionPoint, 'id'>) => {
    if (!editingAction) return;
    
    try {
      await gamificationService.updateActionPoint(editingAction.id, actionData);
      loadGamificationData();
      setEditingAction(null);
    } catch (error) {
      console.error('Error updating action:', error);
    }
  };

  const handleDeleteAction = async (id: string) => {
    if (!isSystemAdmin) {
      alert('Seuls les administrateurs système peuvent supprimer des actions.');
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) return;
    
    try {
      await gamificationService.deleteActionPoint(id);
      loadGamificationData();
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  };

  const handleAddBadge = async (badgeData: Omit<Badge, 'id'>) => {
    try {
      await gamificationService.addBadge(badgeData);
      loadGamificationData();
    } catch (error) {
      console.error('Error adding badge:', error);
    }
  };

  const handleEditBadge = async (badgeData: Omit<Badge, 'id'>) => {
    if (!editingBadge) return;
    
    try {
      await gamificationService.updateBadge(editingBadge.id, badgeData);
      loadGamificationData();
      setEditingBadge(null);
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  };

  const handleDeleteBadge = async (id: string) => {
    if (!isSystemAdmin) {
      alert('Seuls les administrateurs système peuvent supprimer des badges.');
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce badge ?')) return;
    
    try {
      await gamificationService.deleteBadge(id);
      loadGamificationData();
    } catch (error) {
      console.error('Error deleting badge:', error);
    }
  };

  const handleInitializeDefaultLevels = async () => {
    if (!confirm('Cela va créer 33 niveaux par défaut. Continuer ?')) return;
    
    try {
      await gamificationService.initializeDefaultLevels();
      loadGamificationData();
    } catch (error) {
      console.error('Error initializing default levels:', error);
    }
  };

  const handleUpdateGamificationSettings = async (settings: Partial<GamificationSettings>) => {
    try {
      await gamificationService.updateGamificationSettings(settings);
      loadGamificationData();
    } catch (error) {
      console.error('Error updating gamification settings:', error);
    }
  };

  const openAddModal = () => {
    setEditingParameter(null);
    setIsModalOpen(true);
  };

  const openEditModal = (parameter: Parameter) => {
    setEditingParameter(parameter);
    setIsModalOpen(true);
  };

  const openAddHotelModal = () => {
    setEditingHotel(null);
    setIsHotelModalOpen(true);
  };

  const openEditHotelModal = (hotel: HotelType) => {
    setEditingHotel(hotel);
    setIsHotelModalOpen(true);
  };

  const openCategoriesModal = (hotel: HotelType) => {
    setSelectedHotel(hotel);
    setIsCategoriesModalOpen(true);
  };

  const openLocationsModal = (hotel: HotelType) => {
    setSelectedHotel(hotel);
    setIsLocationsModalOpen(true);
  };

  const openAddMissionModal = () => {
    setEditingMission(null);
    setIsMissionModalOpen(true);
  };

  const openEditMissionModal = (mission: ChecklistMission) => {
    setEditingMission(mission);
    setIsMissionModalOpen(true);
  };

  const openAddLevelModal = () => {
    setEditingLevel(null);
    setIsLevelModalOpen(true);
  };

  const openEditLevelModal = (level: ExperienceLevel) => {
    setEditingLevel(level);
    setIsLevelModalOpen(true);
  };

  const openAddActionModal = () => {
    setEditingAction(null);
    setIsActionModalOpen(true);
  };

  const openEditActionModal = (action: ActionPoint) => {
    setEditingAction(action);
    setIsActionModalOpen(true);
  };

  const openAddBadgeModal = () => {
    setEditingBadge(null);
    setIsBadgeModalOpen(true);
  };

  const openEditBadgeModal = (badge: Badge) => {
    setEditingBadge(badge);
    setIsBadgeModalOpen(true);
  };

  const getHotelNames = (hotelIds: string[]) => {
    return hotelIds.map(id => {
      const hotel = hotels.find(h => h.id === id);
      return hotel?.name || id;
    }).join(', ');
  };

  const filteredMissions = checklistMissions.filter(mission => {
    const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = selectedService === 'all' || mission.service === selectedService;
    const matchesHotels = selectedHotelsFilter === 'all' || 
                         mission.hotels.includes(selectedHotelsFilter);

    return matchesSearch && matchesService && matchesHotels;
  });

  const filteredActionPoints = actionPoints.filter(action => {
    const matchesSearch = action.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedActionCategory === 'all' || action.category === selectedActionCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredBadges = badges.filter(badge => {
    const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedBadgeCategory === 'all' || badge.category === selectedBadgeCategory;
    return matchesSearch && matchesCategory;
  });

  const renderParametersTab = () => (
    <div className="flex h-full">
      {/* Left Panel - Parameter Types */}
      <div className="w-80 bg-white border-r border-warm-200 flex flex-col">
        <div className="p-4 border-b border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900">Types de Paramètres</h3>
          <p className="text-sm text-warm-600">Sélectionnez un type</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {parameterTypes.map((type, index) => {
            const IconComponent = iconMap[type.icon as keyof typeof iconMap];
            const isActive = index === activeParameterType;
            
            return (
              <button
                key={index}
                onClick={() => setActiveParameterType(index)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-warm-50 border-b border-warm-100 ${
                  isActive ? 'bg-creho-50 border-r-2 border-r-creho-500' : ''
                }`}
              >
                <IconComponent className={`w-5 h-5 mr-3 ${isActive ? 'text-creho-500' : 'text-warm-400'}`} />
                <span className={`text-sm font-medium ${isActive ? 'text-creho-700' : 'text-warm-700'}`}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel - Parameter Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-warm-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-warm-900">{currentParameterType.label}</h2>
              <p className="text-sm text-warm-600 mt-1">Gérer les paramètres de type {currentParameterType.label.toLowerCase()}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={openAddModal}
                className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </button>
              <button className="flex items-center px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                Exporter
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-warm-50 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-warm-600">Chargement...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-warm-200">
              <div className="px-6 py-4 border-b border-warm-200">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-warm-500">
                  <div>Label</div>
                  <div>Code</div>
                  <div>Ordre</div>
                  <div>Actif</div>
                  <div></div>
                  <div>Actions</div>
                </div>
              </div>
              <div className="divide-y divide-warm-200">
                {parameters.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-6 h-6 text-warm-400" />
                    </div>
                    <h3 className="text-lg font-medium text-warm-900 mb-2">Aucun paramètre</h3>
                    <p className="text-warm-600 mb-4">Commencez par ajouter votre premier paramètre</p>
                    <button
                      onClick={openAddModal}
                      className="px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
                    >
                      Ajouter un paramètre
                    </button>
                  </div>
                ) : (
                  parameters.map((item) => (
                    <div key={item.id} className="px-6 py-4 grid grid-cols-6 gap-4 items-center">
                      <div className="text-sm font-medium text-warm-900">{item.label}</div>
                      <div className="text-sm text-warm-600">{item.code}</div>
                      <div className="text-sm text-warm-600">{item.order}</div>
                      <div>
                        <button
                          onClick={() => handleToggleStatus(item.id, !item.active)}
                          className={`w-8 h-4 rounded-full ${item.active ? 'bg-green-500' : 'bg-warm-300'} relative transition-colors`}
                        >
                          <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${item.active ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Hotel className="w-4 h-4 text-warm-400" />
                        <span className="text-sm text-warm-600">{item.hotels ? item.hotels.join(', ') : ''}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1 hover:bg-warm-100 rounded"
                        >
                          <Edit className="w-4 h-4 text-warm-400" />
                        </button>
                        <button 
                          onClick={() => handleDeleteParameter(item.id)}
                          className="p-1 hover:bg-warm-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-warm-400" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMissionsTab = () => (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-warm-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-warm-900">Missions de Check-list</h2>
            <p className="text-sm text-warm-600 mt-1">Configuration des tâches quotidiennes pour les check-lists par service et par hôtel</p>
          </div>
          <button 
            onClick={openAddMissionModal}
            className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Mission
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une mission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 w-64"
            />
          </div>
          
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
          >
            <option value="all">Tous les services</option>
            {Object.entries(serviceLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={selectedHotelsFilter}
            onChange={(e) => setSelectedHotelsFilter(e.target.value)}
            className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
          >
            <option value="all">Tous les hôtels</option>
            {hotels.map(hotel => (
              <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 bg-warm-50 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-warm-600">Chargement...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-warm-200">
            <div className="px-6 py-4 border-b border-warm-200">
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-warm-500">
                <div>Mission</div>
                <div>Service</div>
                <div>Hôtels</div>
                <div>Permanent</div>
                <div></div>
                <div>Actions</div>
              </div>
            </div>
            <div className="divide-y divide-warm-200">
              {filteredMissions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-warm-400" />
                  </div>
                  <h3 className="text-lg font-medium text-warm-900 mb-2">Aucune mission</h3>
                  <p className="text-warm-600 mb-4">Commencez par ajouter votre première mission de check-list</p>
                  <button
                    onClick={openAddMissionModal}
                    className="px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
                  >
                    Ajouter une mission
                  </button>
                </div>
              ) : (
                filteredMissions.map((mission) => (
                  <div key={mission.id} className="px-6 py-4 grid grid-cols-6 gap-4 items-center">
                    <div>
                      <div className="text-sm font-medium text-warm-900">{mission.title}</div>
                      <div className="text-xs text-warm-500">{mission.description}</div>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">{serviceIcons[mission.service] || '📋'}</span>
                      <span className="text-sm text-warm-600">{serviceLabels[mission.service] || mission.service}</span>
                    </div>
                    <div className="flex items-center">
                      <Hotel className="w-4 h-4 text-warm-400 mr-1" />
                      <span className="text-sm text-warm-600">{mission.hotels.length} hôtel{mission.hotels.length > 1 ? 's' : ''}</span>
                    </div>
                    <div>
                      {mission.isPermanent ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Permanent
                        </span>
                      ) : (
                        <span className="text-sm text-warm-500">-</span>
                      )}
                    </div>
                    <div>
                      {mission.pdfUrl && (
                        <a
                          href={mission.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          PDF
                        </a>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => openEditMissionModal(mission)}
                        className="p-1 hover:bg-warm-100 rounded"
                      >
                        <Edit className="w-4 h-4 text-warm-400" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMission(mission.id)}
                        className="p-1 hover:bg-warm-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderHotelsTab = () => (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-warm-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-warm-900">Gestion des Hôtels</h2>
            <p className="text-sm text-warm-600 mt-1">Ajouter, modifier ou supprimer les hôtels du système</p>
          </div>
          <button 
            onClick={openAddHotelModal}
            className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un Hôtel
          </button>
        </div>
      </div>

      <div className="flex-1 bg-warm-50 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-warm-600">Chargement...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-warm-200">
            <div className="px-6 py-4 border-b border-warm-200">
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-warm-500">
                <div>Nom</div>
                <div>Adresse</div>
                <div>Ville</div>
                <div>Pays</div>
                <div></div>
                <div>Actions</div>
              </div>
            </div>
            <div className="divide-y divide-warm-200">
              {hotels.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Hotel className="w-6 h-6 text-warm-400" />
                  </div>
                  <h3 className="text-lg font-medium text-warm-900 mb-2">Aucun hôtel</h3>
                  <p className="text-warm-600 mb-4">Commencez par ajouter votre premier hôtel</p>
                  <button
                    onClick={openAddHotelModal}
                    className="px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
                  >
                    Ajouter un hôtel
                  </button>
                </div>
              ) : (
                hotels.map((hotel) => (
                  <div key={hotel.id} className="px-6 py-4 grid grid-cols-6 gap-4 items-center">
                    <div className="flex items-center">
                      <Hotel className="w-4 h-4 text-creho-500 mr-2" />
                      <span className="text-sm font-medium text-warm-900">{hotel.name}</span>
                    </div>
                    <div className="text-sm text-warm-600">{hotel.address}</div>
                    <div className="text-sm text-warm-600">{hotel.city}</div>
                    <div className="text-sm text-warm-600">{hotel.country}</div>
                    <div></div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => openLocationsModal(hotel)}
                        className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Lieux
                      </button>
                      <button 
                        onClick={() => openCategoriesModal(hotel)}
                        className="flex items-center px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Catégories
                      </button>
                      <button 
                        onClick={() => openEditHotelModal(hotel)}
                        className="p-1 hover:bg-warm-100 rounded"
                      >
                        <Edit className="w-4 h-4 text-warm-400" />
                      </button>
                      <button 
                        onClick={() => handleDeleteHotel(hotel.id)}
                        className="p-1 hover:bg-warm-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderGamificationTab = () => {
    const renderLevelsContent = () => (
      <div className="bg-white rounded-lg shadow-sm border border-warm-200">
        <div className="px-6 py-4 border-b border-warm-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-warm-900">Niveaux d'Expérience</h3>
            <p className="text-sm text-warm-600">Configurer les seuils d'expérience pour chaque niveau</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInitializeDefaultLevels}
              className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Initialiser 33 niveaux
            </button>
            <button 
              onClick={openAddLevelModal}
              className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un niveau
            </button>
          </div>
        </div>
        <div className="divide-y divide-warm-200 max-h-96 overflow-y-auto">
          {experienceLevels.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-warm-400" />
              </div>
              <h3 className="text-lg font-medium text-warm-900 mb-2">Aucun niveau configuré</h3>
              <p className="text-warm-600 mb-4">Initialisez les 33 niveaux par défaut ou créez vos propres niveaux</p>
              <div className="flex justify-center space-x-2">
                <button
                  onClick={handleInitializeDefaultLevels}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Initialiser 33 niveaux
                </button>
                <button
                  onClick={openAddLevelModal}
                  className="px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
                >
                  Créer un niveau
                </button>
              </div>
            </div>
          ) : (
            experienceLevels.map((level) => (
              <div key={level.id} className="px-6 py-4 grid grid-cols-7 gap-4 items-center">
                <div className="text-sm font-medium text-warm-900">{level.level}</div>
                <div className="text-sm font-medium text-warm-900">{level.name}</div>
                <div className="text-sm text-warm-600">{level.minXP}</div>
                <div className="text-sm text-warm-600">{level.maxXP}</div>
                <div className="flex items-center">
                  <span 
                    className="text-lg mr-2 w-8 h-8 flex items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: level.color }}
                  >
                    {level.badge}
                  </span>
                </div>
                <div 
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: level.color }}
                />
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => openEditLevelModal(level)}
                    className="p-1 hover:bg-warm-100 rounded"
                  >
                    <Edit className="w-4 h-4 text-warm-400" />
                  </button>
                  <button 
                    onClick={() => handleDeleteLevel(level.id)}
                    className="p-1 hover:bg-warm-100 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {experienceLevels.length > 0 && (
          <div className="px-6 py-4 border-t border-warm-200">
            <div className="grid grid-cols-7 gap-4 text-sm font-medium text-warm-500">
              <div>Niveau</div>
              <div>Nom</div>
              <div>XP Minimum</div>
              <div>XP Maximum</div>
              <div>Badge</div>
              <div>Couleur</div>
              <div>Actions</div>
            </div>
          </div>
        )}
      </div>
    );

    const renderActionsContent = () => (
      <div className="bg-white rounded-lg shadow-sm border border-warm-200">
        <div className="px-6 py-4 border-b border-warm-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-warm-900">Points d'Action</h3>
            <p className="text-sm text-warm-600">Configurer les points XP attribués pour chaque action dans le système</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 w-64"
              />
            </div>
            <select
              value={selectedActionCategory}
              onChange={(e) => setSelectedActionCategory(e.target.value)}
              className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
            >
              {actionCategories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
            <button 
              onClick={openAddActionModal}
              className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une action
            </button>
          </div>
        </div>
        <div className="divide-y divide-warm-200">
          {filteredActionPoints.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-warm-400" />
              </div>
              <h3 className="text-lg font-medium text-warm-900 mb-2">Aucune action configurée</h3>
              <p className="text-warm-600 mb-4">Les points XP sont attribués automatiquement lorsque les utilisateurs effectuent des actions dans le système.</p>
              <button
                onClick={openAddActionModal}
                className="px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
              >
                Ajouter une action
              </button>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-warm-200">
                <div className="grid grid-cols-5 gap-4 text-sm font-medium text-warm-500">
                  <div>Action</div>
                  <div>Catégorie</div>
                  <div>Points XP</div>
                  <div>Hôtels</div>
                  <div>Actions</div>
                </div>
              </div>
              {filteredActionPoints.map((action) => (
                <div key={action.id} className="px-6 py-4 grid grid-cols-5 gap-4 items-center">
                  <div>
                    <div className="text-sm font-medium text-warm-900">{action.name}</div>
                    <div className="text-xs text-warm-500">{action.description}</div>
                  </div>
                  <div className="text-sm text-warm-600 capitalize">{action.category}</div>
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 text-creho-500 mr-1" />
                    <span className="text-sm font-medium text-creho-600">+{action.points} XP</span>
                  </div>
                  <div className="text-sm text-warm-600">{action.hotels.length} hôtel{action.hotels.length > 1 ? 's' : ''}</div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => openEditActionModal(action)}
                      className="p-1 hover:bg-warm-100 rounded"
                    >
                      <Edit className="w-4 h-4 text-warm-400" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAction(action.id)}
                      className="p-1 hover:bg-warm-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );

    const renderBadgesContent = () => (
      <div className="bg-white rounded-lg shadow-sm border border-warm-200">
        <div className="px-6 py-4 border-b border-warm-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-warm-900">Badges</h3>
            <p className="text-sm text-warm-600">Gérer les badges qui peuvent être débloqués par les utilisateurs</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un badge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 w-64"
              />
            </div>
            <select
              value={selectedBadgeCategory}
              onChange={(e) => setSelectedBadgeCategory(e.target.value)}
              className="px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
            >
              {badgeCategories.map(category => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
            <button 
              onClick={openAddBadgeModal}
              className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un badge
            </button>
          </div>
        </div>
        <div className="divide-y divide-warm-200">
          {filteredBadges.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-warm-400" />
              </div>
              <h3 className="text-lg font-medium text-warm-900 mb-2">Aucun badge configuré</h3>
              <p className="text-warm-600 mb-4">Les badges sont débloqués automatiquement lorsque les utilisateurs remplissent les conditions associées.</p>
              <button
                onClick={openAddBadgeModal}
                className="px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
              >
                Ajouter un badge
              </button>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-warm-200">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-warm-500">
                  <div>Badge</div>
                  <div>Catégorie</div>
                  <div>Couleur</div>
                  <div>Condition</div>
                  <div>Hôtels</div>
                  <div>Actions</div>
                </div>
              </div>
              {filteredBadges.map((badge) => (
                <div key={badge.id} className="px-6 py-4 grid grid-cols-6 gap-4 items-center">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{badge.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-warm-900">{badge.name}</div>
                      <div className="text-xs text-warm-500">{badge.description}</div>
                    </div>
                  </div>
                  <div className="text-sm text-warm-600 capitalize">{badge.category}</div>
                  <div className="text-sm text-warm-600 capitalize">{badge.color}</div>
                  <div className="text-sm text-warm-600">{badge.condition}</div>
                  <div className="text-sm text-warm-600">{badge.hotels.length} hôtel{badge.hotels.length > 1 ? 's' : ''}</div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => openEditBadgeModal(badge)}
                      className="p-1 hover:bg-warm-100 rounded"
                    >
                      <Edit className="w-4 h-4 text-warm-400" />
                    </button>
                    <button 
                      onClick={() => handleDeleteBadge(badge.id)}
                      className="p-1 hover:bg-warm-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );

    const renderConfigContent = () => (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-warm-200 p-6">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Paramètres de Gamification</h3>
          <p className="text-sm text-warm-600 mb-6">Configurez le système de points, badges et récompenses</p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-orange-800">Configuration avancée</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Le module de configuration de gamification est disponible dans une section dédiée pour une gestion plus précise des paramètres.
                </p>
              </div>
            </div>
          </div>

          <button className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors">
            <Trophy className="w-4 h-4 mr-2" />
            Accéder à la configuration de la gamification
          </button>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="text-sm font-medium text-warm-700 mb-2">Taux d'XP global</h4>
              <div className="flex items-center">
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  defaultValue="1"
                  className="w-20 px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                />
                <span className="ml-2 text-sm text-warm-600">Multiplicateur appliqué à tous les gains d'XP</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-warm-700 mb-2">Système de gamification</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-warm-700">Activer la gamification</span>
                  <button className="w-12 h-6 bg-green-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 translate-x-7"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-warm-700">Afficher les notifications de points XP</span>
                  <button className="w-12 h-6 bg-green-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 translate-x-7"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-warm-700">Afficher les notifications de badges</span>
                  <button className="w-12 h-6 bg-warm-300 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 translate-x-1"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-warm-700">Activer le classement</span>
                  <button className="w-12 h-6 bg-warm-300 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 translate-x-1"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-warm-200">
            <button className="flex items-center px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors">
              <RotateCcw className="w-4 h-4 mr-2" />
              Réinitialiser les paramètres
            </button>
            <button className="flex items-center px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors">
              <Settings className="w-4 h-4 mr-2" />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col h-full">
        <div className="bg-white border-b border-warm-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-warm-900">Paramètres de Gamification</h2>
              <p className="text-sm text-warm-600 mt-1">Configurer le système de points, badges et récompenses</p>
            </div>
          </div>

          {/* Gamification Sub-tabs */}
          <div className="flex space-x-6">
            {gamificationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeGamificationTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveGamificationTab(tab.key)}
                  className={`flex items-center space-x-2 py-2 border-b-2 transition-colors ${
                    isActive
                      ? 'border-creho-500 text-creho-600'
                      : 'border-transparent text-warm-500 hover:text-warm-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-warm-50 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-warm-600">Chargement...</p>
              </div>
            </div>
          ) : (
            <div>
              {activeGamificationTab === 'levels' && renderLevelsContent()}
              {activeGamificationTab === 'actions' && renderActionsContent()}
              {activeGamificationTab === 'badges' && renderBadgesContent()}
              {activeGamificationTab === 'challenges' && (
                <div className="bg-white rounded-lg shadow-sm border border-warm-200 p-12 text-center">
                  <Target className="w-12 h-12 text-warm-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-warm-900 mb-2">Défis</h3>
                  <p className="text-warm-600">Module en cours de développement</p>
                </div>
              )}
              {activeGamificationTab === 'config' && renderConfigContent()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmptyTab = (tabName: string) => (
    <div className="flex-1 flex items-center justify-center bg-warm-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-warm-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Hotel className="w-8 h-8 text-warm-400" />
        </div>
        <h3 className="text-lg font-medium text-warm-900 mb-2">{tabName}</h3>
        <p className="text-warm-600">Ce module sera implémenté prochainement</p>
      </div>
    </div>
  );

  return (
    <Layout title="Paramètres" subtitle="Configuration générale et paramétrages système">
      <div className="h-full flex flex-col">
        {/* Tabs Header */}
        <div className="bg-white border-b border-warm-200 px-6">
          <div className="flex space-x-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    isActive
                      ? 'border-creho-500 text-creho-600'
                      : 'border-transparent text-warm-500 hover:text-warm-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'parameters' && renderParametersTab()}
          {activeTab === 'missions' && renderMissionsTab()}
          {activeTab === 'hotels' && renderHotelsTab()}
          {activeTab === 'gamification' && renderGamificationTab()}
        </div>
      </div>

      <ParameterModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingParameter(null);
        }}
        onSubmit={editingParameter ? handleEditParameter : handleAddParameter}
        parameter={editingParameter}
        title={currentParameterType.label}
      />

      <HotelModal
        isOpen={isHotelModalOpen}
        onClose={() => {
          setIsHotelModalOpen(false);
          setEditingHotel(null);
        }}
        onSubmit={editingHotel ? handleEditHotel : handleAddHotel}
        hotel={editingHotel}
        isEdit={!!editingHotel}
      />

      <HotelCategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => {
          setIsCategoriesModalOpen(false);
          setSelectedHotel(null);
        }}
        onSubmit={handleUpdateHotelCategories}
        hotelName={selectedHotel?.name || ''}
        selectedCategories={selectedHotel?.incidentCategories || []}
      />

      <HotelLocationsModal
        isOpen={isLocationsModalOpen}
        onClose={() => {
          setIsLocationsModalOpen(false);
          setSelectedHotel(null);
        }}
        onSubmit={handleUpdateHotelLocations}
        hotelName={selectedHotel?.name || ''}
        selectedLocations={selectedHotel?.locations || []}
      />

      <ChecklistMissionModal
        isOpen={isMissionModalOpen}
        onClose={() => {
          setIsMissionModalOpen(false);
          setEditingMission(null);
        }}
        onSubmit={editingMission ? handleEditMission : handleAddMission}
        mission={editingMission}
        isEdit={!!editingMission}
      />

      <ExperienceLevelModal
        isOpen={isLevelModalOpen}
        onClose={() => {
          setIsLevelModalOpen(false);
          setEditingLevel(null);
        }}
        onSubmit={editingLevel ? handleEditLevel : handleAddLevel}
        level={editingLevel}
        isEdit={!!editingLevel}
      />

      <ActionPointModal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setEditingAction(null);
        }}
        onSubmit={editingAction ? handleEditAction : handleAddAction}
        actionPoint={editingAction}
        isEdit={!!editingAction}
      />

      <BadgeModal
        isOpen={isBadgeModalOpen}
        onClose={() => {
          setIsBadgeModalOpen(false);
          setEditingBadge(null);
        }}
        onSubmit={editingBadge ? handleEditBadge : handleAddBadge}
        badge={editingBadge}
        isEdit={!!editingBadge}
      />
    </Layout>
  );
}