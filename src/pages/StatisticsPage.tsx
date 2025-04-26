import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Area,
  Scatter
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  Share2, 
  Save, 
  FilePieChart, 
  RefreshCw,
  FileBarChart2,
  Layers,
  BarChart3,
  BarChart4,
  LineChart as LineChartIcon
} from 'lucide-react';
import { 
  incidents, 
  maintenanceRequests, 
  qualityVisits, 
  lostItems, 
  hotels, 
  parameters
} from '@/lib/data';

// Define chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const StatisticsPage = () => {
  const [selectedDashboard, setSelectedDashboard] = useState('global');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('30');
  
  // Predefined dashboards
  const dashboards = [
    { id: 'global', name: 'Vue Globale' },
    { id: 'incidents', name: 'Incidents' },
    { id: 'quality', name: 'Qualité' },
    { id: 'maintenance', name: 'Maintenance' },
    { id: 'lostfound', name: 'Objets Trouvés' }
  ];
  
  // Filter data based on selected hotel
  const filterByHotel = (data: { hotelId: string }[]) => {
    if (filterHotel === 'all') return data;
    return data.filter(item => item.hotelId === filterHotel);
  };
  
  // Filter data based on selected period
  const filterByPeriod = (data: { date: string }[]) => {
    const daysAgo = parseInt(filterPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };
  
  // Apply both filters
  const filteredIncidents = filterByPeriod(filterByHotel(incidents));
  const filteredMaintenance = filterByPeriod(filterByHotel(maintenanceRequests));
  const filteredQualityVisits = filterByPeriod(filterByHotel(qualityVisits));
  const filteredLostItems = filterByPeriod(filterByHotel(lostItems));
  
  // Helper function to get parameter label by id
  const getParameterLabel = (params: typeof parameters, id: string): string => {
    const param = params.find(p => p.id === id);
    return param ? param.label : 'Inconnu';
  };
  
  // Helper function to get hotel name by id
  const getHotelName = (hotelId: string): string => {
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel ? hotel.name : 'Inconnu';
  };
  
  // Extract parameters by type
  const categoryParams = parameters.filter(p => p.type === 'incident_category');
  const statusParams = parameters.filter(p => p.type === 'status');
  const impactParams = parameters.filter(p => p.type === 'impact');
  const interventionTypeParams = parameters.filter(p => p.type === 'intervention_type');
  const qualityCategoryParams = parameters.filter(p => p.type === 'quality_category');
  const itemTypeParams = parameters.filter(p => p.type === 'lost_item_type');
  
  // Create chart data
  const incidentsByCategory = categoryParams.map(category => ({
    name: category.label,
    value: filteredIncidents.filter(inc => inc.categoryId === category.id).length
  }));
  
  const incidentsByStatus = statusParams.map(status => ({
    name: status.label,
    value: filteredIncidents.filter(inc => inc.statusId === status.id).length
  }));
  
  const incidentsByImpact = impactParams.map(impact => ({
    name: impact.label,
    value: filteredIncidents.filter(inc => inc.impactId === impact.id).length
  }));
  
  const maintenanceByType = interventionTypeParams.map(type => ({
    name: type.label,
    value: filteredMaintenance.filter(item => item.interventionTypeId === type.id).length
  }));
  
  const maintenanceByStatus = statusParams.map(status => ({
    name: status.label,
    value: filteredMaintenance.filter(item => item.statusId === status.id).length
  }));
  
  const qualityScoresByHotel = hotels.map(hotel => {
    const hotelVisits = qualityVisits.filter(visit => 
      visit.hotelId === hotel.id && 
      (filterHotel === 'all' || visit.hotelId === filterHotel)
    );
    
    return {
      name: hotel.name.substring(0, 12) + (hotel.name.length > 12 ? '...' : ''),
      score: hotelVisits.length > 0 
        ? Math.round(hotelVisits.reduce((acc, visit) => acc + visit.conformityRate, 0) / hotelVisits.length) 
        : 0
    };
  });
  
  const lostItemsByType = itemTypeParams.map(type => ({
    name: type.label,
    value: filteredLostItems.filter(item => item.itemTypeId === type.id).length
  }));
  
  const lostItemsByStatus = [
    { name: 'Conservé', value: filteredLostItems.filter(item => item.status === 'conservé').length },
    { name: 'Rendu', value: filteredLostItems.filter(item => item.status === 'rendu').length },
    { name: 'Transféré', value: filteredLostItems.filter(item => item.status === 'transféré').length }
  ];
  
  // Create trend data - for global view
  const getTrendData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    
    return Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - 5 + i) % 12;
      const month = months[monthIndex >= 0 ? monthIndex : monthIndex + 12];
      
      // Get data for this month
      const monthIncidents = incidents.filter(inc => {
        const date = new Date(inc.date);
        return date.getMonth() === monthIndex && 
          (filterHotel === 'all' || inc.hotelId === filterHotel);
      });
      
      const monthMaintenance = maintenanceRequests.filter(req => {
        const date = new Date(req.date);
        return date.getMonth() === monthIndex && 
          (filterHotel === 'all' || req.hotelId === filterHotel);
      });
      
      const monthQualityVisits = qualityVisits.filter(visit => {
        const date = new Date(visit.visitDate);
        return date.getMonth() === monthIndex && 
          (filterHotel === 'all' || visit.hotelId === filterHotel);
      });
      
      const avgQualityScore = monthQualityVisits.length > 0 
        ? Math.round(monthQualityVisits.reduce((acc, visit) => acc + visit.conformityRate, 0) / monthQualityVisits.length) 
        : 0;
      
      return {
        name: month,
        incidents: monthIncidents.length,
        maintenance: monthMaintenance.length,
        qualityScore: avgQualityScore
      };
    });
  };
  
  const trendData = getTrendData();
  
  // Create combined chart data
  const combinedHotelData = hotels.map(hotel => {
    const hotelIncidents = incidents.filter(inc => 
      inc.hotelId === hotel.id && 
      (filterHotel === 'all' || inc.hotelId === filterHotel)
    );
    
    const hotelMaintenance = maintenanceRequests.filter(req => 
      req.hotelId === hotel.id && 
      (filterHotel === 'all' || req.hotelId === filterHotel)
    );
    
    const hotelQualityVisits = qualityVisits.filter(visit => 
      visit.hotelId === hotel.id && 
      (filterHotel === 'all' || visit.hotelId === filterHotel)
    );
    
    const avgQualityScore = hotelQualityVisits.length > 0 
      ? Math.round(hotelQualityVisits.reduce((acc, visit) => acc + visit.conformityRate, 0) / hotelQualityVisits.length) 
      : 0;
    
    return {
      name: hotel.name.substring(0, 12) + (hotel.name.length > 12 ? '...' : ''),
      incidents: hotelIncidents.length,
      maintenance: hotelMaintenance.length,
      qualityScore: avgQualityScore
    };
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistiques & Rapports</h1>
          <p className="text-muted-foreground">Analyse de données avancée et rapports personnalisables</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button>
            <Share2 className="mr-2 h-4 w-4" />
            Partager
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:items-center">
        <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <FilePieChart className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Choisir un tableau de bord" />
          </SelectTrigger>
          <SelectContent>
            {dashboards.map(dashboard => (
              <SelectItem key={dashboard.id} value={dashboard.id}>{dashboard.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterHotel} onValueChange={setFilterHotel}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tous les hôtels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les hôtels</SelectItem>
            {hotels.map(hotel => (
              <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
            <SelectItem value="90">90 derniers jours</SelectItem>
            <SelectItem value="365">Année complète</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex-1"></div>
        
        <Button variant="outline" size="icon">
          <Save className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Global Dashboard */}
      {selectedDashboard === 'global' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Vue d'ensemble multi-modules</CardTitle>
                <LineChartIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>
                Évolution des incidents, maintenances et scores qualité sur 6 mois
              </CardDescription>
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
              <div className="flex items-center justify-between">
                <CardTitle>Comparaison par Hôtel</CardTitle>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={combinedHotelData}
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
              <div className="flex items-center justify-between">
                <CardTitle>Scores Qualité par Hôtel</CardTitle>
                <BarChart4 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={qualityScoresByHotel}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score Qualité']} />
                    <Bar dataKey="score" name="Score Qualité" fill="#10b981">
                      {qualityScoresByHotel.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.score >= 90 ? '#10b981' : // green
                            entry.score >= 80 ? '#84cc16' : // lime
                            entry.score >= 70 ? '#f59e0b' : // amber
                            '#ef4444' // red
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Incidents Dashboard */}
      {selectedDashboard === 'incidents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Incidents par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incidentsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {incidentsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Incidents par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incidentsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {incidentsByStatus.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            index === 0 ? "#f59e0b" : // Ouvert
                            index === 1 ? "#3b82f6" : // En cours
                            index === 2 ? "#10b981" : // Résolu
                            index === 3 ? "#6b7280" : // Fermé
                            "#ef4444" // Annulé
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Incidents par Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={incidentsByImpact}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Incidents" fill="#3b82f6">
                      {incidentsByImpact.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            index === 0 ? "#22c55e" : // Faible
                            index === 1 ? "#3b82f6" : // Moyen
                            index === 2 ? "#f59e0b" : // Élevé
                            "#ef4444" // Critique
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Incidents par Hôtel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hotels.map(hotel => ({
                      name: hotel.name.substring(0, 15),
                      value: filteredIncidents.filter(inc => inc.hotelId === hotel.id).length
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Incidents" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Maintenance Dashboard */}
      {selectedDashboard === 'maintenance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Interventions par Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={maintenanceByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {maintenanceByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Interventions par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={maintenanceByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {maintenanceByStatus.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            index === 0 ? "#f59e0b" : // Ouvert
                            index === 1 ? "#3b82f6" : // En cours
                            index === 2 ? "#10b981" : // Résolu
                            index === 3 ? "#6b7280" : // Fermé
                            "#ef4444" // Annulé
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Répartition des Interventions par Hôtel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={interventionTypeParams.map(type => {
                      const data: any = { name: type.label };
                      
                      hotels.forEach(hotel => {
                        const count = filteredMaintenance.filter(m => 
                          m.interventionTypeId === type.id && m.hotelId === hotel.id
                        ).length;
                        
                        data[hotel.name.substring(0, 10)] = count;
                      });
                      
                      return data;
                    })}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {hotels.map((hotel, index) => (
                      <Bar 
                        key={hotel.id} 
                        dataKey={hotel.name.substring(0, 10)} 
                        stackId="a" 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Quality Dashboard */}
      {selectedDashboard === 'quality' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Évolution des Scores Qualité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={hotels.map(hotel => {
                      const visits = qualityVisits.filter(visit => visit.hotelId === hotel.id)
                        .sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
                      
                      if (visits.length === 0) return null;
                      
                      // Get the last 5 visits or all if less than 5
                      const recentVisits = visits.slice(-5);
                      
                      return {
                        name: hotel.name.substring(0, 15),
                        data: recentVisits.map(visit => ({
                          date: new Date(visit.visitDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
                          score: visit.conformityRate
                        }))
                      };
                    }).filter(Boolean)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    {hotels.map((hotel, index) => (
                      <Line 
                        key={hotel.id} 
                        type="monotone" 
                        dataKey="score" 
                        data={qualityVisits.filter(visit => visit.hotelId === hotel.id)
                          .map(visit => ({
                            name: new Date(visit.visitDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
                            score: visit.conformityRate
                          }))}
                        name={hotel.name.substring(0, 15)} 
                        stroke={COLORS[index % COLORS.length]} 
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Scores Moyens par Hôtel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={qualityScoresByHotel}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score Qualité']} />
                    <Bar dataKey="score" name="Score Qualité (%)" fill="#10b981">
                      {qualityScoresByHotel.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.score >= 90 ? '#10b981' : // green
                            entry.score >= 80 ? '#84cc16' : // lime
                            entry.score >= 70 ? '#f59e0b' : // amber
                            '#ef4444' // red
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Répartition des Contrôles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityCategoryParams.map(cat => ({
                        name: cat.label,
                        value: filteredQualityVisits.reduce((acc, visit) => {
                          return acc + visit.checklist.filter(item => item.categoryId === cat.id).length;
                        }, 0)
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {qualityCategoryParams.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Lost & Found Dashboard */}
      {selectedDashboard === 'lostfound' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Objets par Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lostItemsByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {lostItemsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Objets par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lostItemsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#3b82f6" /> {/* Conservé */}
                      <Cell fill="#10b981" /> {/* Rendu */}
                      <Cell fill="#f59e0b" /> {/* Transféré */}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Répartition des Objets Trouvés par Hôtel et Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={itemTypeParams.map(type => {
                      const data: any = { name: type.label };
                      
                      hotels.forEach(hotel => {
                        const count = filteredLostItems.filter(item => 
                          item.itemTypeId === type.id && item.hotelId === hotel.id
                        ).length;
                        
                        data[hotel.name.substring(0, 10)] = count;
                      });
                      
                      return data;
                    })}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {hotels.map((hotel, index) => (
                      <Bar 
                        key={hotel.id} 
                        dataKey={hotel.name.substring(0, 10)} 
                        stackId="a" 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;