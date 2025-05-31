import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUpRight, 
  BarChart2, 
  FileCheck, 
  Hotel, 
  AlertTriangle, 
  PenTool as Tool, 
  ClipboardCheck, 
  Search, 
  User, 
  Clock, 
  TrendingUp,
  Star,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Loader2,
  InfoIcon
} from 'lucide-react';
import { parameters } from '@/lib/data';
import { useGamification } from '@/components/gamification/GamificationContext';
import { formatDate } from '@/lib/utils';
import { getIncidents } from '@/lib/db/incidents';
import { getMaintenanceRequests } from '@/lib/db/maintenance';
import { getHotels } from '@/lib/db/hotels';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, hasHotelAccess } from '@/lib/auth';
import { getLostItems } from '@/lib/db/lost-items';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getClientSatisfactionParameters } from '@/lib/db/parameters-client-satisfaction';
import { getIncidentCategoryParameters } from '@/lib/db/parameters-incident-categories';

// Define chart colors
const COLORS = ['#D4A017', '#B08214', '#8C6410', '#68470C', '#442E07'];
const QUALITY_COLORS = ['#22c55e', '#84cc16', '#f59e0b', '#ef4444', '#6b7280'];
const SATISFACTION_COLORS = ['#22c55e', '#84cc16', '#facc15', '#f97316', '#ef4444'];

const DashboardPage = () => {
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [dateRange, setDateRange] = useState('30'); // days
  const [availableHotels, setAvailableHotels] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // State for data
  const [incidents, setIncidents] = useState<any[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [qualityVisits, setQualityVisits] = useState<any[]>([]);
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientSatisfactionParams, setClientSatisfactionParams] = useState<any[]>([]);
  const [incidentCategoryParams, setIncidentCategoryParams] = useState<any[]>([]);

  // Load data on mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Don't attempt to load data if user is not authenticated
        if (!currentUser) {
          return;
        }
        
        // Load hotels - this function now filters hotels based on user permissions
        const hotelsData = await getHotels();
        setHotels(hotelsData);
        setAvailableHotels(hotelsData);
        
        // If user has only one hotel, automatically select it
        if (hotelsData.length === 1 && selectedHotel === 'all') {
          setSelectedHotel(hotelsData[0].id);
        }
        
        // Determine which hotel ID to filter by
        const filterHotelId = selectedHotel === 'all' ? undefined : selectedHotel;
        
        // Only load data for accessible hotels
        if (selectedHotel === 'all' || hasHotelAccess(selectedHotel)) {
          // Load incidents
          const incidentsData = await getIncidents(filterHotelId);
          setIncidents(incidentsData);

          // Load maintenance requests
          const maintenanceData = await getMaintenanceRequests(filterHotelId);
          setMaintenanceRequests(maintenanceData);
          
          // Load lost items
          const lostItemsData = await getLostItems(filterHotelId);
          setLostItems(lostItemsData);

          // Load satisfaction parameters
          const satisfactionParams = await getClientSatisfactionParameters();
          setClientSatisfactionParams(satisfactionParams);

          // Load incident category parameters
          const categoryParams = await getIncidentCategoryParameters();
          setIncidentCategoryParams(categoryParams);

          // TODO: Add API calls for quality visits once implemented
          // For now, using empty arrays
          setQualityVisits([]);
        } else {
          // Reset data if user has no access to selected hotel
          setIncidents([]);
          setMaintenanceRequests([]);
          setLostItems([]);
          setQualityVisits([]);
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas accès à cet hôtel",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du tableau de bord",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedHotel, toast, currentUser, navigate]);
  
  // Filter data based on selected period
  const filterByPeriod = (data: { date: string }[]) => {
    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  };
  
  // Apply period filter
  const filteredIncidents = filterByPeriod(incidents);
  const filteredMaintenance = filterByPeriod(maintenanceRequests);
  const filteredQualityVisits = filterByPeriod(qualityVisits);
  const filteredLostItems = filterByPeriod(lostItems);
  
  // Get statistics
  const getStats = () => {
    // Count open incidents with exact status "En cours"
    const openIncidents = filteredIncidents.filter(inc => {
      // Le statut peut être "En cours" ou l'ID spécifique "CZa3iy84r8pVqjVOQHNL"
      return inc.statusId === "En cours" || inc.statusId === "CZa3iy84r8pVqjVOQHNL";
    }).length;
    
    // Count resolved incidents
    const resolvedIncidents = filteredIncidents.filter(inc => {
      const status = inc.statusId;
      return status === 'Clôturé' || status === 'Résolu' || 
             (typeof status === 'string' && (status.toLowerCase() === 'clôturé' || status.toLowerCase() === 'résolu'));
    }).length;
    
    // Count open maintenance requests
    const openMaintenance = filteredMaintenance.filter(req => {
      const status = req.statusId;
      return status === 'En cours' || 
             (typeof status === 'string' && status.toLowerCase() === 'en cours');
    }).length;
    
    // Count completed maintenance requests
    const completedMaintenance = filteredMaintenance.filter(req => {
      const status = req.statusId;
      return status === 'Clôturé' || status === 'Résolu' ||
             (typeof status === 'string' && (status.toLowerCase() === 'clôturé' || status.toLowerCase() === 'résolu'));
    }).length;
    
    // Calculate average quality score
    const avgQualityScore = filteredQualityVisits.length > 0
      ? Math.round(
        filteredQualityVisits.reduce((acc, visit) => acc + visit.conformityRate, 0) / 
        filteredQualityVisits.length
      )
      : 0;
    
    // Count lost and returned items
    // Only count items with status 'conservé' for the main count
    const lostItemsCount = filteredLostItems.filter(item => item.status === 'conservé').length;
    const returnedItemsCount = filteredLostItems.filter(item => item.status === 'rendu').length;
    
    return {
      openIncidents,
      resolvedIncidents,
      openMaintenance,
      completedMaintenance,
      avgQualityScore,
      lostItemsCount,
      returnedItemsCount,
    };
  };
  
  const stats = getStats();

  // Create data for charts - only for accessible hotels
  const incidentsByCategory = incidentCategoryParams
    .filter(p => p.id && p.id !== '')
    .map(category => ({
      name: category.label,
      value: filteredIncidents.filter(inc => inc.categoryId === category.id).length
    }));
  
  // Filter hotels to only show those the user has access to
  const accessibleHotels = hotels.filter(hotel => hasHotelAccess(hotel.id));
  
  // Create quality scores only for accessible hotels
  const qualityByHotel = accessibleHotels.map(hotel => {
    const hotelVisits = qualityVisits.filter(visit => visit.hotelId === hotel.id);
    return {
      name: hotel.name.substring(0, 15) + (hotel.name.length > 15 ? '...' : ''),
      score: hotelVisits.length > 0 
        ? Math.round(hotelVisits.reduce((acc, visit) => acc + visit.conformityRate, 0) / hotelVisits.length) 
        : 0
    };
  });
  
  // Create monthly data for trend charts
  const getTrendData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    
    return Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - 5 + i) % 12;
      const month = months[monthIndex >= 0 ? monthIndex : monthIndex + 12];
      
      // Get incidents for this month
      const monthIncidents = incidents.filter(inc => {
        const incidentDate = new Date(inc.date);
        return incidentDate.getMonth() === monthIndex && 
          (selectedHotel === 'all' || inc.hotelId === selectedHotel);
      }).length;
      
      // Get maintenance for this month
      const monthMaintenance = maintenanceRequests.filter(req => {
        const requestDate = new Date(req.date);
        return requestDate.getMonth() === monthIndex && 
          (selectedHotel === 'all' || req.hotelId === selectedHotel);
      }).length;
      
      const monthQualityVisits = qualityVisits.filter(visit => {
        const date = new Date(visit.visitDate);
        return date.getMonth() === monthIndex && 
          (selectedHotel === 'all' || visit.hotelId === selectedHotel);
      });
      
      const avgQualityScore = monthQualityVisits.length > 0 
        ? Math.round(monthQualityVisits.reduce((acc, visit) => acc + visit.conformityRate, 0) / monthQualityVisits.length) 
        : 0;
      
      return {
        name: month,
        incidents: monthIncidents,
        maintenance: monthMaintenance,
        qualityScore: avgQualityScore
      };
    });
  };
  
  const trendData = getTrendData();
  
  // Prepare data for client satisfaction chart - connect to real data
  const prepareClientSatisfactionData = () => {
    // If we have client satisfaction parameters, use them for the chart
    if (clientSatisfactionParams && clientSatisfactionParams.length > 0) {
      return clientSatisfactionParams.map(param => {
        // Count incidents with this satisfaction level
        const count = filteredIncidents.filter(incident => 
          incident.clientSatisfactionId === param.id && 
          (selectedHotel === 'all' || incident.hotelId === selectedHotel)
        ).length;
        
        return {
          name: param.label,
          value: count || 0 // If no incidents have this level, return 0
        };
      });
    }
    
    // Fallback to simulated data if no parameters or incidents found
    return [
      { name: 'Très satisfait', value: 45 },
      { name: 'Satisfait', value: 30 },
      { name: 'Neutre', value: 15 },
      { name: 'Insatisfait', value: 7 },
      { name: 'Très insatisfait', value: 3 },
    ];
  };
  
  const clientSatisfactionData = prepareClientSatisfactionData();
  
  // Prepare data for top intervention categories - connect to real incident data
  const prepareTopInterventionData = () => {
    // If we have incident category parameters, use them for the chart
    if (incidentCategoryParams && incidentCategoryParams.length > 0) {
      // Create map of categories and count the occurrences in incidents
      const categoryCounts = incidentCategoryParams.reduce((acc, category) => {
        const count = filteredIncidents.filter(incident => 
          incident.categoryId === category.id && 
          (selectedHotel === 'all' || incident.hotelId === selectedHotel)
        ).length;
        
        if (count > 0) {
          acc.push({
            name: category.label,
            count: count
          });
        }
        return acc;
      }, [] as { name: string, count: number }[]);
      
      // Sort by count descending and take top 5
      return categoryCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }
    
    // Fallback to simulated data
    return [
      { name: 'Salle de bain', count: 42 },
      { name: 'Climatisation', count: 38 },
      { name: 'Électricité', count: 30 },
      { name: 'Mobilier', count: 25 },
      { name: 'Télévision', count: 20 },
    ];
  };
  
  const interventionCategoriesData = prepareTopInterventionData();

  // If not authenticated, show nothing while redirecting
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-500" />
          <h2 className="text-xl font-semibold mb-2">Vérification de l'authentification...</h2>
          <p className="text-muted-foreground">Redirection vers la page de connexion.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brand-500" />
          <h2 className="text-xl font-semibold mb-2">Chargement des données...</h2>
          <p className="text-muted-foreground">Veuillez patienter pendant le chargement du tableau de bord.</p>
        </div>
      </div>
    );
  }

  if (availableHotels.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <h2 className="text-xl font-semibold mb-2">Accès limité</h2>
          <p className="text-muted-foreground mb-4">
            Vous n'avez pas accès à des hôtels dans le système. 
            Veuillez contacter votre administrateur pour obtenir les autorisations nécessaires.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-charcoal-500 dark:text-cream-400">Vue d'ensemble des opérations hôtelières</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={selectedHotel}
            onValueChange={setSelectedHotel}
            disabled={availableHotels.length === 0}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder={loading ? "Chargement..." : "Sélectionner un hôtel"} />
            </SelectTrigger>
            <SelectContent>
              {availableHotels.length > 1 && (
                <SelectItem value="all">Tous les hôtels</SelectItem>
              )}
              {availableHotels.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={dateRange}
            onValueChange={setDateRange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
              <SelectItem value="365">Année complète</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Incidents Ouverts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openIncidents}</div>
            <div className="flex items-center pt-1 text-xs text-charcoal-500 dark:text-cream-400">
              <span className="text-green-500 inline-flex items-center">
                {stats.resolvedIncidents} résolus
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </span>
              <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={() => navigate('/incidents')}>
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Maintenances Actives</CardTitle>
            <Tool className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openMaintenance}</div>
            <div className="flex items-center pt-1 text-xs text-charcoal-500 dark:text-cream-400">
              <span className="text-green-500 inline-flex items-center">
                {stats.completedMaintenance} terminés
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </span>
              <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={() => navigate('/maintenance')}>
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Score Qualité</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgQualityScore}%</div>
            <div className="flex items-center pt-1 text-xs text-charcoal-500 dark:text-cream-400">
              <span className={stats.avgQualityScore >= 80 ? "text-green-500" : "text-brand-500"}>
                {stats.avgQualityScore >= 90 ? 'Excellent' : 
                  stats.avgQualityScore >= 80 ? 'Bon' : 
                  stats.avgQualityScore >= 70 ? 'Acceptable' : 'À améliorer'}
              </span>
              <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={() => navigate('/quality')}>
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Objets Trouvés</CardTitle>
            <Search className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lostItemsCount}</div>
            <div className="flex items-center pt-1 text-xs text-charcoal-500 dark:text-cream-400">
              <span className="text-green-500">
                {stats.returnedItemsCount} objets rendus
              </span>
              <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={() => navigate('/lost-found')}>
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Vue d'ensemble multi-modules</CardTitle>
              <BarChart2 className="h-4 w-4 text-charcoal-500 dark:text-cream-400" />
            </div>
            <CardDescription>Évolution des incidents et maintenances sur les 6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trendData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="incidents" name="Incidents" fill="#f59e0b" barSize={20} />
                  <Bar yAxisId="left" dataKey="maintenance" name="Maintenances" fill="#0ea5e9" barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="qualityScore" name="Score Qualité (%)" stroke="#10b981" strokeWidth={2} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Comparaison par Hôtel</CardTitle>
              <BarChartIcon className="h-5 w-5 text-charcoal-500 dark:text-cream-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={accessibleHotels.map(hotel => {
                    const hotelIncidents = incidents.filter(inc => 
                      inc.hotelId === hotel.id && 
                      (selectedHotel === 'all' || inc.hotelId === selectedHotel)
                    );
                    
                    const hotelMaintenance = maintenanceRequests.filter(req => 
                      req.hotelId === hotel.id && 
                      (selectedHotel === 'all' || req.hotelId === selectedHotel)
                    );
                    
                    return {
                      name: hotel.name.substring(0, 12) + (hotel.name.length > 12 ? '...' : ''),
                      incidents: hotelIncidents.length,
                      maintenance: hotelMaintenance.length
                    };
                  })}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="incidents" name="Incidents" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="maintenance" name="Maintenances" stackId="a" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Scores Qualité par Hôtel</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-charcoal-500 dark:text-cream-400" />
            </div>
            <CardDescription>Évaluation qualité par établissement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={qualityByHotel}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Legend />
                  <Bar dataKey="score" name="Score Qualité" fill="#10b981">
                    {qualityByHotel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.score >= 90 ? '#4caf50' :
                        entry.score >= 80 ? '#8bc34a' :
                        entry.score >= 70 ? '#ffc107' :
                        '#f44336'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Client Satisfaction - Données dynamiques */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <span>Satisfaction Client</span>
                {clientSatisfactionData.every(d => d.value === 0) && (
                  <div className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded">Données simulées</div>
                )}
              </CardTitle>
              <Star className="h-4 w-4 text-charcoal-500 dark:text-cream-400" />
            </div>
            <CardDescription>Répartition des niveaux de satisfaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientSatisfactionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {clientSatisfactionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={SATISFACTION_COLORS[index % SATISFACTION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Top Intervention Categories - Données dynamiques */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <span>Top Catégories d'Intervention</span>
                {interventionCategoriesData.length === 0 && (
                  <div className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded">Données simulées</div>
                )}
              </CardTitle>
              <Tool className="h-4 w-4 text-charcoal-500 dark:text-cream-400" />
            </div>
            <CardDescription>Les interventions les plus fréquentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={interventionCategoriesData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Nombre d'interventions" fill="#8C6410" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Message concernant les données manquantes */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <InfoIcon className="mr-2 h-5 w-5 text-blue-500" />
              Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                <p className="font-medium">Les cartes "Satisfaction Client" et "Top Catégories d'Intervention" sont maintenant connectées aux données réelles de Firebase.</p>
                <p className="mt-1">Si elles apparaissent comme "Données simulées", cela signifie qu'aucune donnée n'a été trouvée dans les collections correspondantes.</p>
                <p className="mt-1">Pour voir des données réelles, ajoutez des incidents avec des valeurs de satisfaction client et des catégories d'incidents.</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;