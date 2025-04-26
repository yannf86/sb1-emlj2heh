import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
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
  CalendarClock, 
  Euro,
  TrendingUp,
  Star,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { parameters } from '@/lib/data';
import { useGamification } from '@/components/gamification/GamificationContext';
import { formatDate } from '@/lib/utils';
import { getIncidents } from '@/lib/db/incidents';
import { getMaintenanceRequests } from '@/lib/db/maintenance';
import { getHotels } from '@/lib/db/hotels';
import { useToast } from '@/hooks/use-toast';

// Define chart colors
const COLORS = ['#D4A017', '#B08214', '#8C6410', '#68470C', '#442E07'];
const QUALITY_COLORS = ['#22c55e', '#84cc16', '#f59e0b', '#ef4444', '#6b7280'];

const DashboardPage = () => {
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [dateRange, setDateRange] = useState('30'); // days
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for data
  const [incidents, setIncidents] = useState<any[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [qualityVisits, setQualityVisits] = useState<any[]>([]);
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load hotels
        const hotelsData = await getHotels();
        setHotels(hotelsData);
        
        // Load incidents
        const incidentsData = await getIncidents(selectedHotel === 'all' ? undefined : selectedHotel);
        setIncidents(incidentsData);

        // Load maintenance requests
        const maintenanceData = await getMaintenanceRequests(selectedHotel === 'all' ? undefined : selectedHotel);
        setMaintenanceRequests(maintenanceData);

        // TODO: Add API calls for quality visits and lost items once implemented
        // For now, using empty arrays
        setQualityVisits([]);
        setLostItems([]);

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
  }, [selectedHotel, toast]);
  
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
    // Count open incidents (status 'stat1' = open)
    const openIncidents = filteredIncidents.filter(inc => inc.statusId === 'stat1').length;
    
    // Count resolved incidents (status 'stat3' = resolved or 'stat4' = closed)
    const resolvedIncidents = filteredIncidents.filter(inc => 
      inc.statusId === 'stat3' || inc.statusId === 'stat4'
    ).length;
    
    // Count open maintenance requests
    const openMaintenance = filteredMaintenance.filter(req => 
      req.statusId === 'stat1' || req.statusId === 'stat2'
    ).length;
    
    // Count completed maintenance requests
    const completedMaintenance = filteredMaintenance.filter(req => 
      req.statusId === 'stat3' || req.statusId === 'stat4'
    ).length;
    
    // Calculate average quality score
    const avgQualityScore = Math.round(
      filteredQualityVisits.reduce((acc, visit) => acc + visit.conformityRate, 0) / 
      (filteredQualityVisits.length || 1)
    );
    
    // Count lost and returned items
    const lostItemsCount = filteredLostItems.length;
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

  // Create data for charts
  const incidentsByCategory = [
    { name: 'Propreté', value: filteredIncidents.filter(inc => inc.categoryId === 'cat1').length },
    { name: 'Technique', value: filteredIncidents.filter(inc => inc.categoryId === 'cat2').length },
    { name: 'Service', value: filteredIncidents.filter(inc => inc.categoryId === 'cat3').length },
    { name: 'Bruit', value: filteredIncidents.filter(inc => inc.categoryId === 'cat4').length },
    { name: 'Nourriture', value: filteredIncidents.filter(inc => inc.categoryId === 'cat5').length },
  ];
  
  const maintenanceByType = [
    { name: 'Plomberie', value: filteredMaintenance.filter(req => req.interventionTypeId === 'int1').length },
    { name: 'Électricité', value: filteredMaintenance.filter(req => req.interventionTypeId === 'int2').length },
    { name: 'Clim/Chauffage', value: filteredMaintenance.filter(req => req.interventionTypeId === 'int3').length },
    { name: 'Mobilier', value: filteredMaintenance.filter(req => req.interventionTypeId === 'int4').length },
    { name: 'Peinture', value: filteredMaintenance.filter(req => req.interventionTypeId === 'int5').length },
  ];
  
  const qualityByHotel = hotels.map(hotel => {
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
  
  // Additional charts data
  
  // 1. Client Satisfaction Data (mock data - in a real app, this would come from the database)
  const clientSatisfactionData = [
    { name: 'Très satisfait', value: 45 },
    { name: 'Satisfait', value: 30 },
    { name: 'Neutre', value: 15 },
    { name: 'Insatisfait', value: 7 },
    { name: 'Très insatisfait', value: 3 },
  ];
  
  // 2. Room Occupancy Rate by Month (mock data)
  const roomOccupancyData = [
    { month: 'Jan', rate: 68 },
    { month: 'Fév', rate: 72 },
    { month: 'Mar', rate: 80 },
    { month: 'Avr', rate: 85 },
    { month: 'Mai', rate: 78 },
    { month: 'Jun', rate: 90 },
  ];
  
  // 3. Revenue by Hotel (mock data)
  const revenueByHotelData = hotels.map((hotel, index) => ({
    name: hotel.name.substring(0, 12) + (hotel.name.length > 12 ? '...' : ''),
    revenue: 15000 + Math.floor(Math.random() * 25000),
    target: 25000 + Math.floor(Math.random() * 10000),
  }));
  
  // 4. Staff Performance Metrics (mock data)
  const staffPerformanceData = [
    { category: 'Accueil', value: 85 },
    { category: 'Réactivité', value: 92 },
    { category: 'Résolution', value: 79 },
    { category: 'Communication', value: 88 },
    { category: 'Suivi', value: 82 },
  ];
  
  // 5. Top Intervention Categories (mock data)
  const interventionCategoriesData = [
    { name: 'Salle de bain', count: 42 },
    { name: 'Climatisation', count: 38 },
    { name: 'Électricité', count: 30 },
    { name: 'Mobilier', count: 25 },
    { name: 'Télévision', count: 20 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chargement des données...</h2>
          <p className="text-muted-foreground">Veuillez patienter pendant le chargement du tableau de bord.</p>
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
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Sélectionner un hôtel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les hôtels</SelectItem>
              {hotels.map((hotel) => (
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
                  data={hotels.map(hotel => {
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
        
        {/* Client Satisfaction */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Satisfaction Client</CardTitle>
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
                    <Cell fill="#22c55e" /> {/* Très satisfait */}
                    <Cell fill="#84cc16" /> {/* Satisfait */}
                    <Cell fill="#facc15" /> {/* Neutre */}
                    <Cell fill="#f97316" /> {/* Insatisfait */}
                    <Cell fill="#ef4444" /> {/* Très insatisfait */}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Room Occupancy Rate */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Taux d'Occupation</CardTitle>
              <Hotel className="h-4 w-4 text-charcoal-500 dark:text-cream-400" />
            </div>
            <CardDescription>Évolution du taux d'occupation sur 6 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={roomOccupancyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Taux d\'occupation']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    name="Taux d'occupation" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Staff Performance Radar Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Performance Équipe</CardTitle>
              <User className="h-4 w-4 text-charcoal-500 dark:text-cream-400" />
            </div>
            <CardDescription>Évaluation des performances par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={staffPerformanceData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar 
                    name="Performance (%)" 
                    dataKey="value" 
                    stroke="#D4A017" 
                    fill="#D4A017" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Revenue by Hotel */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Revenus par Hôtel</CardTitle>
              <Euro className="h-4 w-4 text-charcoal-500 dark:text-cream-400" />
            </div>
            <CardDescription>Comparaison revenus actuels vs objectifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueByHotelData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toLocaleString()} €`, '']} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenus actuels" fill="#10b981" />
                  <Bar dataKey="target" name="Objectifs" fill="#9ca3af" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Top Intervention Categories */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Top Catégories d'Intervention</CardTitle>
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
        
        {/* Task Resolution Time */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Délai de Résolution par Type</CardTitle>
              <CalendarClock className="h-4 w-4 text-charcoal-500 dark:text-cream-400" />
            </div>
            <CardDescription>Temps moyen de résolution par catégorie (en heures)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { category: "Problèmes techniques", urgence: 8, normal: 24, faible: 48 },
                    { category: "Réclamations clients", urgence: 2, normal: 8, faible: 24 },
                    { category: "Demandes spéciales", urgence: 1, normal: 4, faible: 12 },
                    { category: "Maintenance", urgence: 4, normal: 16, faible: 36 },
                    { category: "Administration", urgence: 24, normal: 48, faible: 72 }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="urgence" name="Priorité Haute" fill="#ef4444" />
                  <Bar dataKey="normal" name="Priorité Normale" fill="#f59e0b" />
                  <Bar dataKey="faible" name="Priorité Basse" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;