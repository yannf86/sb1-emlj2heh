import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import MetricCard from '../components/Dashboard/MetricCard';
import ChartCard from '../components/Dashboard/ChartCard';
import { useAuth } from '../contexts/AuthContext';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { dashboardService } from '../services/firebase/dashboardService';
import { hotelsService } from '../services/firebase/hotelsService';
import type { DashboardMetrics, ModuleData, HotelComparisonData, QualityScoreData } from '../services/firebase/dashboardService';
import type { Hotel } from '../types/hotels';
import {
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  Package,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';

// Données de satisfaction client (fictives pour l'instant)
const satisfactionData = [
  { name: 'Très satisfait', value: 67, color: '#10B981' },
  { name: 'Satisfait', value: 23, color: '#3B82F6' },
  { name: 'Neutre', value: 7, color: '#F59E0B' },
  { name: 'Insatisfait', value: 3, color: '#EF4444' },
];

// Données d'intervention (fictives pour l'instant)
const defaultInterventionData = [
  { name: 'Technique', value: 45, color: '#8B5CF6' },
  { name: 'Housekeeping', value: 30, color: '#D4AF37' },
  { name: 'Restauration', value: 15, color: '#EF4444' },
  { name: 'Accueil', value: 10, color: '#10B981' },
];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { accessibleHotels, initialized } = useUserPermissions();
  
  // États pour les métriques et données de graphiques
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    openIncidents: 0,
    activeMaintenances: 0,
    qualityRate: 0,
    lostItems: 0
  });
  
  const [multiModuleData, setMultiModuleData] = useState<ModuleData[]>([]);
  const [hotelComparisonData, setHotelComparisonData] = useState<HotelComparisonData[]>([]);
  const [qualityScoreData, setQualityScoreData] = useState<QualityScoreData[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour les filtres
  const [availableHotels, setAvailableHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('all');
  const [filterLoading, setFilterLoading] = useState(false);

  // Charger la liste des hôtels disponibles
  useEffect(() => {
    const loadAvailableHotels = async () => {
      if (!initialized || !accessibleHotels.length) return;

      try {
        const allHotels = await hotelsService.getHotels();
        
        // Filtrer selon les permissions de l'utilisateur
        const userHotels = accessibleHotels.includes('all') 
          ? allHotels 
          : allHotels.filter(hotel => accessibleHotels.includes(hotel.id));
        
        setAvailableHotels(userHotels);
      } catch (error) {
        console.error('Erreur lors du chargement des hôtels:', error);
      }
    };

    loadAvailableHotels();
  }, [accessibleHotels, initialized]);

  // Chargement des données du tableau de bord
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser?.email || !initialized) return;
      
      setLoading(true);
      try {
        // Récupérer les métriques
        const dashboardMetrics = await dashboardService.getDashboardMetrics(currentUser.email, selectedHotelId);
        setMetrics(dashboardMetrics);
        
        // Récupérer les données pour le graphique multi-modules
        const moduleData = await dashboardService.getMultiModuleData(currentUser.email, selectedHotelId);
        setMultiModuleData(moduleData);
        
        // Récupérer les données de comparaison par hôtel (seulement si "Tous les hôtels" est sélectionné)
        if (selectedHotelId === 'all') {
          const hotelData = await dashboardService.getHotelComparisonData(currentUser.email);
          setHotelComparisonData(hotelData);
          
          const qualityData = await dashboardService.getQualityScoreData(currentUser.email);
          setQualityScoreData(qualityData);
        } else {
          // Pour un hôtel spécifique, pas de comparaison
          setHotelComparisonData([]);
          setQualityScoreData([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du tableau de bord:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [currentUser?.email, initialized, selectedHotelId]);

  // Fonction pour appliquer les filtres
  const handleFilterChange = async (hotelId: string) => {
    setSelectedHotelId(hotelId);
  };

  // Fonction pour actualiser les données
  const handleRefresh = async () => {
    setFilterLoading(true);
    try {
      // Forcer le rechargement en rechargeant directement les données
      if (!currentUser?.email || !initialized) return;
      
      // Récupérer les métriques
      const dashboardMetrics = await dashboardService.getDashboardMetrics(currentUser.email, selectedHotelId);
      setMetrics(dashboardMetrics);
      
      // Récupérer les données pour le graphique multi-modules
      const moduleData = await dashboardService.getMultiModuleData(currentUser.email, selectedHotelId);
      setMultiModuleData(moduleData);
      
      // Récupérer les données de comparaison par hôtel (seulement si "Tous les hôtels" est sélectionné)
      if (selectedHotelId === 'all') {
        const hotelData = await dashboardService.getHotelComparisonData(currentUser.email);
        setHotelComparisonData(hotelData);
        
        const qualityData = await dashboardService.getQualityScoreData(currentUser.email);
        setQualityScoreData(qualityData);
      } else {
        // Pour un hôtel spécifique, pas de comparaison
        setHotelComparisonData([]);
        setQualityScoreData([]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'actualisation des données du tableau de bord:', error);
    } finally {
      setTimeout(() => setFilterLoading(false), 1000);
    }
  };

  // Obtenir le nom de l'hôtel sélectionné
  const getSelectedHotelName = () => {
    if (selectedHotelId === 'all') return 'Tous les hôtels';
    const hotel = availableHotels.find(h => h.id === selectedHotelId);
    return hotel ? hotel.name : 'Hôtel sélectionné';
  };

  return (
    <Layout title="Tableau de Bord" subtitle="Vue d'ensemble des opérations hôtelières">
      <div className="p-6 space-y-6">
        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-warm-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-warm-600" />
              <h3 className="text-lg font-medium text-warm-800">Filtres</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Sélecteur d'hôtel */}
              <div className="flex items-center gap-2">
                <label htmlFor="hotel-select" className="text-sm font-medium text-warm-700 whitespace-nowrap">
                  Hôtel :
                </label>
                <select
                  id="hotel-select"
                  value={selectedHotelId}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="px-3 py-2 border border-warm-300 rounded-md focus:outline-none focus:ring-2 focus:ring-creho-500 focus:border-transparent bg-white text-warm-900 min-w-[200px]"
                  disabled={loading || filterLoading}
                >
                  <option value="all">Tous les hôtels</option>
                  {availableHotels.map(hotel => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bouton d'actualisation */}
              <button
                onClick={handleRefresh}
                disabled={loading || filterLoading}
                className="flex items-center gap-2 px-4 py-2 bg-creho-500 text-white rounded-md hover:bg-creho-600 focus:outline-none focus:ring-2 focus:ring-creho-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${(loading || filterLoading) ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>
          
          {/* Indicateur de l'hôtel sélectionné */}
          <div className="mt-3 pt-3 border-t border-warm-200">
            <p className="text-sm text-warm-600">
              <span className="font-medium">Données affichées pour :</span> {getSelectedHotelName()}
            </p>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Incidents Ouverts"
            value={loading ? "..." : metrics.openIncidents.toString()}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="creho"
            trend={{ value: 0, isPositive: false }}
          />
          <MetricCard
            title="Maintenances Actives"
            value={loading ? "..." : metrics.activeMaintenances.toString()}
            icon={<Wrench className="w-6 h-6" />}
            color="blue"
            trend={{ value: 0, isPositive: true }}
          />
          <MetricCard
            title="Taux Qualité"
            value={loading ? "..." : `${metrics.qualityRate}%`}
            icon={<ClipboardCheck className="w-6 h-6" />}
            color="green"
            trend={{ value: 0, isPositive: true }}
          />
          <MetricCard
            title="Objets Trouvés"
            value={loading ? "..." : metrics.lostItems.toString()}
            icon={<Package className="w-6 h-6" />}
            color="purple"
            trend={{ value: 0, isPositive: true }}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-creho-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-warm-600">Chargement des données...</span>
          </div>
        ) : (
          <>
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Multi-Module Overview */}
              <ChartCard
                title="Vue d'ensemble multi-modules"
                subtitle="Évolution des incidents et opérations sur 6 mois"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={multiModuleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="incidents" stroke="#D4AF37" strokeWidth={2} name="Incidents" />
                    <Line type="monotone" dataKey="maintenance" stroke="#3B82F6" strokeWidth={2} name="Maintenances" />
                    <Line type="monotone" dataKey="lostItems" stroke="#8B5CF6" strokeWidth={2} name="Objets trouvés" />
                    <Line type="monotone" dataKey="quality" stroke="#10B981" strokeWidth={2} name="Qualité" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Hotel Comparison - Seulement si "Tous les hôtels" est sélectionné */}
              {selectedHotelId === 'all' && hotelComparisonData.length > 0 && (
                <ChartCard
                  title="Comparaison par Hôtel"
                  subtitle="Incidents, maintenances et objets trouvés par établissement"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hotelComparisonData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="incidents" fill="#D4AF37" name="Incidents" />
                      <Bar dataKey="maintenance" fill="#3B82F6" name="Maintenances" />
                      <Bar dataKey="lostItems" fill="#8B5CF6" name="Objets trouvés" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Customer Satisfaction */}
              <ChartCard
                title="Satisfaction Client"
                subtitle="Répartition des niveaux de satisfaction"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Tooltip />
                    <RechartsPieChart data={satisfactionData} cx="50%" cy="50%" outerRadius={80}>
                      {satisfactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Quality Scores - Seulement si "Tous les hôtels" est sélectionné */}
              {selectedHotelId === 'all' && qualityScoreData.length > 0 && (
                <ChartCard
                  title="Scores Qualité par Hôtel"
                  subtitle="Évaluation qualité par établissement"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={qualityScoreData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hotel" angle={-45} textAnchor="end" height={100} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>

            {/* Bottom Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Intervention Categories */}
              <ChartCard
                title="Top Catégories d'Intervention"
                subtitle="Les interventions les plus fréquentes"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={defaultInterventionData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
