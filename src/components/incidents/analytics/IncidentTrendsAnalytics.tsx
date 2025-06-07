import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, ComposedChart, Bar 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parameters } from '@/lib/data';
import { Incident } from '../types/incident.types';

interface IncidentTrendsAnalyticsProps {
  incidents: Incident[];
  onExportChart: (chartId: string) => void;
}

const IncidentTrendsAnalytics: React.FC<IncidentTrendsAnalyticsProps> = ({ incidents, onExportChart }) => {
  const [periodicity, setPeriodicity] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [trendType, setTrendType] = useState<'volume' | 'category' | 'impact' | 'resolution'>('volume');
  
  // Helper functions for dates
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };
  
  const formatWeek = (date: Date): string => {
    const weekNum = getWeekNumber(date);
    return `S${weekNum}`;
  };
  
  const getDateKey = (date: Date): string => {
    switch (periodicity) {
      case 'daily':
        return date.toISOString().split('T')[0];
      case 'weekly':
        return `${date.getFullYear()}-${formatWeek(date)}`;
      case 'monthly':
      default:
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
  };
  
  const formatDateForDisplay = (dateKey: string): string => {
    if (periodicity === 'daily') {
      const [year, month, day] = dateKey.split('-');
      return `${day}/${month}`;
    }
    
    if (periodicity === 'weekly') {
      const [year, week] = dateKey.split('-');
      return `${week} ${year}`;
    }
    
    // Monthly
    const [year, month] = dateKey.split('-');
    const monthNames = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    return `${monthNames[parseInt(month)]} ${year}`;
  };
  
  // Get date range for trend analysis
  const getDateRange = (): Date[] => {
    // Sort incidents by date
    const sortedIncidents = [...incidents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    if (sortedIncidents.length === 0) {
      return [];
    }
    
    const startDate = new Date(sortedIncidents[0].date);
    const endDate = new Date(sortedIncidents[sortedIncidents.length - 1].date);
    
    // Ensure at least 12 months of data for monthly view
    if (periodicity === 'monthly') {
      const currentDate = new Date();
      if (endDate.getTime() < currentDate.getTime()) {
        endDate.setTime(currentDate.getTime());
      }
      
      // Go back 12 months if not enough data
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (startDate.getTime() > oneYearAgo.getTime()) {
        startDate.setTime(oneYearAgo.getTime());
      }
    }
    
    return [startDate, endDate];
  };
  
  // Generate trend data
  const generateTrendData = () => {
    const [startDate, endDate] = getDateRange();
    if (!startDate || !endDate) {
      return [];
    }
    
    const categoryParams = parameters.filter(p => p.type === 'incident_category');
    const impactParams = parameters.filter(p => p.type === 'impact');
    const statusParams = parameters.filter(p => p.type === 'status');
    
    const trendData: Record<string, any> = {};
    
    // Initialize time periods
    if (periodicity === 'monthly') {
      let currentDate = new Date(startDate);
      currentDate.setDate(1); // First day of the month
      
      while (currentDate <= endDate) {
        const dateKey = getDateKey(currentDate);
        trendData[dateKey] = { name: formatDateForDisplay(dateKey), count: 0 };
        
        // Initialize category, impact, and resolution counts
        categoryParams.forEach(cat => {
          trendData[dateKey][cat.label] = 0;
        });
        
        impactParams.forEach(impact => {
          trendData[dateKey][`impact_${impact.label}`] = 0;
        });
        
        statusParams.forEach(status => {
          trendData[dateKey][`resolution_${status.label}`] = 0;
        });
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else if (periodicity === 'weekly') {
      let currentDate = new Date(startDate);
      // Set to first day of the week (Sunday)
      currentDate.setDate(currentDate.getDate() - currentDate.getDay());
      
      while (currentDate <= endDate) {
        const dateKey = getDateKey(currentDate);
        trendData[dateKey] = { name: formatDateForDisplay(dateKey), count: 0 };
        
        // Initialize category, impact, and resolution counts
        categoryParams.forEach(cat => {
          trendData[dateKey][cat.label] = 0;
        });
        
        impactParams.forEach(impact => {
          trendData[dateKey][`impact_${impact.label}`] = 0;
        });
        
        statusParams.forEach(status => {
          trendData[dateKey][`resolution_${status.label}`] = 0;
        });
        
        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else {
      // Daily view - use each day between start and end
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateKey = getDateKey(currentDate);
        trendData[dateKey] = { name: formatDateForDisplay(dateKey), count: 0 };
        
        // Initialize category, impact, and resolution counts
        categoryParams.forEach(cat => {
          trendData[dateKey][cat.label] = 0;
        });
        
        impactParams.forEach(impact => {
          trendData[dateKey][`impact_${impact.label}`] = 0;
        });
        
        statusParams.forEach(status => {
          trendData[dateKey][`resolution_${status.label}`] = 0;
        });
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // Count incidents per time period
    incidents.forEach(incident => {
      const incidentDate = new Date(incident.date);
      const dateKey = getDateKey(incidentDate);
      
      if (trendData[dateKey]) {
        // Increment total count
        trendData[dateKey].count++;
        
        // Count by category
        const categoryLabel = categoryParams.find(cat => cat.id === incident.categoryId)?.label || 'Autre';
        trendData[dateKey][categoryLabel]++;
        
        // Count by impact
        const impactLabel = impactParams.find(imp => imp.id === incident.impactId)?.label || 'Autre';
        trendData[dateKey][`impact_${impactLabel}`]++;
        
        // Count by resolution status
        const statusLabel = statusParams.find(status => status.id === incident.statusId)?.label || 'Autre';
        trendData[dateKey][`resolution_${statusLabel}`]++;
      }
    });
    
    // Convert to array for charts
    return Object.values(trendData);
  };
  
  const trendData = generateTrendData();
  
  const categoryParams = parameters.filter(p => p.type === 'incident_category');
  const impactParams = parameters.filter(p => p.type === 'impact');
  const statusParams = parameters.filter(p => p.type === 'status');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={periodicity} onValueChange={(value) => setPeriodicity(value as 'daily' | 'weekly' | 'monthly')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Périodicité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Quotidien</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuel</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={trendType} onValueChange={(value) => setTrendType(value as 'volume' | 'category' | 'impact' | 'resolution')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type d'analyse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="volume">Volume d'incidents</SelectItem>
            <SelectItem value="category">Par catégorie</SelectItem>
            <SelectItem value="impact">Par impact</SelectItem>
            <SelectItem value="resolution">Par statut</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>
              {trendType === 'volume' && 'Évolution du volume d\'incidents'}
              {trendType === 'category' && 'Évolution des catégories d\'incidents'}
              {trendType === 'impact' && 'Évolution des niveaux d\'impact'}
              {trendType === 'resolution' && 'Évolution des statuts d\'incidents'}
            </CardTitle>
            <CardDescription>
              Vue {periodicity === 'daily' ? 'quotidienne' : periodicity === 'weekly' ? 'hebdomadaire' : 'mensuelle'}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart(`trend-${trendType}-${periodicity}`)}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              {trendType === 'volume' ? (
                <AreaChart
                  data={trendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="count" name="Nombre d'incidents" fill="#8884d8" stroke="#8884d8" />
                </AreaChart>
              ) : trendType === 'category' ? (
                <ComposedChart
                  data={trendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Total" fill="#8884d8" />
                  {categoryParams.map((category, index) => (
                    <Line
                      key={category.id}
                      type="monotone"
                      dataKey={category.label}
                      name={category.label}
                      stroke={`hsl(${index * 40}, 70%, 50%)`}
                      strokeWidth={2}
                    />
                  ))}
                </ComposedChart>
              ) : trendType === 'impact' ? (
                <AreaChart
                  data={trendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  stackOffset="expand"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(value, name) => [value, name.replace('impact_', '')]} />
                  <Legend formatter={(value) => value.replace('impact_', '')} />
                  {impactParams.map((impact, index) => {
                    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"]; // Faible, Moyen, Élevé, Critique
                    return (
                      <Area 
                        key={impact.id}
                        type="monotone"
                        dataKey={`impact_${impact.label}`}
                        name={`impact_${impact.label}`}
                        stackId="1"
                        stroke={colors[index]}
                        fill={colors[index]}
                      />
                    );
                  })}
                </AreaChart>
              ) : (
                // Resolution Status
                <AreaChart
                  data={trendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  stackOffset="expand"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(value, name) => [value, name.replace('resolution_', '')]} />
                  <Legend formatter={(value) => value.replace('resolution_', '')} />
                  {statusParams.map((status, index) => {
                    const colors = ["#f59e0b", "#3b82f6", "#10b981", "#6b7280", "#ef4444"];
                    return (
                      <Area 
                        key={status.id}
                        type="monotone"
                        dataKey={`resolution_${status.label}`}
                        name={`resolution_${status.label}`}
                        stackId="1"
                        stroke={colors[index % colors.length]}
                        fill={colors[index % colors.length]}
                      />
                    );
                  })}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Resolution Time Trend */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Évolution du temps de résolution</CardTitle>
            <CardDescription>Temps moyen de résolution au fil du temps</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('resolution-time-trend')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData.map(period => {
                  const periodIncidents = incidents.filter(incident => {
                    const incidentDate = new Date(incident.date);
                    return getDateKey(incidentDate) === period.name;
                  });
                  
                  const resolvedIncidents = periodIncidents.filter(inc => 
                    ['stat3', 'stat4', '3ElZmcduy3R8NUd1kuzn', 'JyK8HpAF5qwg39QbQeS1'].includes(inc.statusId)
                  );
                  
                  let avgTime = 0;
                  if (resolvedIncidents.length > 0) {
                    avgTime = resolvedIncidents.reduce((acc, inc) => {
                      const created = new Date(inc.createdAt).getTime();
                      const updated = new Date(inc.updatedAt).getTime();
                      return acc + (updated - created);
                    }, 0) / resolvedIncidents.length / (1000 * 60 * 60); // hours
                  }
                  
                  return {
                    ...period,
                    avgResolutionTime: avgTime,
                    resolvedCount: resolvedIncidents.length
                  };
                })}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" domain={[0, 'dataMax + 5']} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax + 2']} />
                <Tooltip formatter={(value, name) => {
                  if (name === "Temps moyen résolution") return [`${value.toFixed(1)}h`, name];
                  return [value, name];
                }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avgResolutionTime" name="Temps moyen résolution" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="resolvedCount" name="Incidents résolus" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Seasonality Analysis */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Analyse de saisonnalité</CardTitle>
            <CardDescription>Répartition des incidents par jour de la semaine et heure</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('seasonality-analysis')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Par jour de la semaine</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                      const daysCounts = Array(7).fill(0);
                      
                      incidents.forEach(incident => {
                        const date = new Date(incident.date);
                        daysCounts[date.getDay()]++;
                      });
                      
                      return days.map((day, index) => ({
                        name: day,
                        count: daysCounts[index]
                      }));
                    })()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Incidents" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Par heure de la journée</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      const hoursCounts = Array(24).fill(0);
                      
                      incidents.forEach(incident => {
                        // Extract hour from time
                        if (incident.time) {
                          const [hours] = incident.time.split(':').map(Number);
                          if (!isNaN(hours) && hours >= 0 && hours < 24) {
                            hoursCounts[hours]++;
                          }
                        }
                      });
                      
                      return hoursCounts.map((count, hour) => ({
                        name: `${hour}:00`,
                        count
                      }));
                    })()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Incidents" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentTrendsAnalytics;