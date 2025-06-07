import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parameters, hotels } from '@/lib/data';
import { Incident } from '../types/incident.types';

interface IncidentCompensationAnalyticsProps {
  incidents: Incident[];
  onExportChart: (chartId: string) => void;
}

const IncidentCompensationAnalytics: React.FC<IncidentCompensationAnalyticsProps> = ({ incidents, onExportChart }) => {
  // Calculate total compensation amount
  const totalCompensation = incidents.reduce((acc, incident) => {
    if (incident.compensationAmount) {
      return acc + parseFloat(incident.compensationAmount);
    }
    return acc;
  }, 0);
  
  // Count incidents with compensation
  const incidentsWithCompensation = incidents.filter(incident => 
    incident.compensationAmount && parseFloat(incident.compensationAmount) > 0
  ).length;
  
  // Calculate average compensation amount
  const averageCompensation = incidentsWithCompensation > 0 
    ? totalCompensation / incidentsWithCompensation
    : 0;
  
  // Compensation by category
  const categoryParams = parameters.filter(p => p.type === 'incident_category');
  
  const compensationByCategory = categoryParams.map(category => {
    const categoryIncidents = incidents.filter(incident => incident.categoryId === category.id);
    const total = categoryIncidents.reduce((acc, incident) => {
      if (incident.compensationAmount) {
        return acc + parseFloat(incident.compensationAmount);
      }
      return acc;
    }, 0);
    
    const count = categoryIncidents.filter(incident => 
      incident.compensationAmount && parseFloat(incident.compensationAmount) > 0
    ).length;
    
    return {
      name: category.label,
      total,
      count,
      average: count > 0 ? total / count : 0
    };
  }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);
  
  // Compensation by hotel
  const compensationByHotel = hotels.map(hotel => {
    const hotelIncidents = incidents.filter(incident => incident.hotelId === hotel.id);
    const total = hotelIncidents.reduce((acc, incident) => {
      if (incident.compensationAmount) {
        return acc + parseFloat(incident.compensationAmount);
      }
      return acc;
    }, 0);
    
    const count = hotelIncidents.filter(incident => 
      incident.compensationAmount && parseFloat(incident.compensationAmount) > 0
    ).length;
    
    return {
      name: hotel.name,
      total,
      count,
      average: count > 0 ? total / count : 0
    };
  }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);
  
  // Compensation distribution by amount range
  const compensationDistribution = [
    { name: '0-50€', range: [0, 50], count: 0, total: 0 },
    { name: '51-100€', range: [51, 100], count: 0, total: 0 },
    { name: '101-200€', range: [101, 200], count: 0, total: 0 },
    { name: '201-500€', range: [201, 500], count: 0, total: 0 },
    { name: '> 500€', range: [501, Infinity], count: 0, total: 0 }
  ];
  
  incidents.forEach(incident => {
    if (incident.compensationAmount) {
      const amount = parseFloat(incident.compensationAmount);
      if (amount > 0) {
        const range = compensationDistribution.find(r => 
          amount >= r.range[0] && amount <= r.range[1]
        );
        
        if (range) {
          range.count++;
          range.total += amount;
        }
      }
    }
  });
  
  // Compensation by resolution type
  const resolutionTypeParams = parameters.filter(p => p.type === 'resolution_type');
  
  const compensationByResolutionType = resolutionTypeParams.map(type => {
    const typeIncidents = incidents.filter(incident => incident.resolutionTypeId === type.id);
    const total = typeIncidents.reduce((acc, incident) => {
      if (incident.compensationAmount) {
        return acc + parseFloat(incident.compensationAmount);
      }
      return acc;
    }, 0);
    
    const count = typeIncidents.filter(incident => 
      incident.compensationAmount && parseFloat(incident.compensationAmount) > 0
    ).length;
    
    return {
      name: type.label,
      total,
      count,
      average: count > 0 ? total / count : 0
    };
  }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);
  
  // Monthly compensation trend
  const monthlyCompensationTrend = () => {
    const monthlyData: Record<string, { month: string, total: number, count: number }> = {};
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      
      monthlyData[monthKey] = {
        month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        total: 0,
        count: 0
      };
    }
    
    // Populate with actual data
    incidents.forEach(incident => {
      if (incident.compensationAmount && incident.date) {
        const amount = parseFloat(incident.compensationAmount);
        if (amount > 0) {
          const date = new Date(incident.date);
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].total += amount;
            monthlyData[monthKey].count++;
          }
        }
      }
    });
    
    // Convert to array
    return Object.values(monthlyData);
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total des Compensations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompensation.toLocaleString('fr-FR')} €</div>
            <div className="flex items-center pt-1 text-xs text-charcoal-500 dark:text-cream-400">
              <span>Sur {incidentsWithCompensation} incidents</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compensation Moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompensation.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €</div>
            <div className="flex items-center pt-1 text-xs text-charcoal-500 dark:text-cream-400">
              <span>Par incident avec compensation</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux de Compensation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidents.length > 0 ? ((incidentsWithCompensation / incidents.length) * 100).toFixed(1) : 0}%
            </div>
            <div className="flex items-center pt-1 text-xs text-charcoal-500 dark:text-cream-400">
              <span>Des incidents ont reçu une compensation</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {incidents.length > 0 && incidentsWithCompensation === 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Aucune donnée de compensation n'est disponible pour les incidents actuels. Les analyses ci-dessous seront disponibles dès que des gestes commerciaux seront enregistrés.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Compensations par Catégorie</CardTitle>
              <CardDescription>Total des gestes commerciaux par type d'incident</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExportChart('compensation-by-category')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={compensationByCategory}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value) => [`${value.toLocaleString('fr-FR')} €`, 'Total']} />
                  <Bar dataKey="total" name="Total (€)" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Compensation Moyenne par Catégorie</CardTitle>
              <CardDescription>Montant moyen accordé selon le type d'incident</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExportChart('avg-compensation-by-category')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={compensationByCategory}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip formatter={(value) => [`${value.toLocaleString('fr-FR')} €`, 'Moyenne']} />
                  <Bar dataKey="average" name="Moyenne (€)" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Compensations par Hôtel</CardTitle>
              <CardDescription>Total des gestes commerciaux par établissement</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExportChart('compensation-by-hotel')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={compensationByHotel}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toLocaleString('fr-FR')} €`, 'Total']} />
                  <Bar dataKey="total" name="Total (€)" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Distribution des Montants</CardTitle>
              <CardDescription>Répartition des compensations par tranche</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExportChart('compensation-distribution')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compensationDistribution.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {compensationDistribution.filter(d => d.count > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value.toLocaleString('fr-FR')} €`, 'Total']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Évolution Mensuelle des Compensations</CardTitle>
            <CardDescription>Tendance et montant moyen au fil du temps</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('monthly-compensation-trend')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyCompensationTrend()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value, name) => {
                  if (name === "Montant total") return [`${value.toLocaleString('fr-FR')} €`, name];
                  return [value, name];
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="total" name="Montant total" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="count" name="Nombre d'incidents" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Tableau détaillé des compensations</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('compensation-details-table')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Catégorie / Type</th>
                  <th className="text-center py-3 px-4">Nombre d'Incidents</th>
                  <th className="text-center py-3 px-4">Avec Compensation</th>
                  <th className="text-center py-3 px-4">Total Compensations</th>
                  <th className="text-center py-3 px-4">Compensation Moyenne</th>
                  <th className="text-center py-3 px-4">% des Incidents</th>
                </tr>
              </thead>
              <tbody>
                {categoryParams.map((category, index) => {
                  const categoryIncidents = incidents.filter(inc => inc.categoryId === category.id);
                  const withCompensation = categoryIncidents.filter(inc => 
                    inc.compensationAmount && parseFloat(inc.compensationAmount) > 0
                  );
                  const total = withCompensation.reduce((acc, inc) => 
                    acc + parseFloat(inc.compensationAmount || '0'), 0
                  );
                  const average = withCompensation.length > 0 ? total / withCompensation.length : 0;
                  const percentage = categoryIncidents.length > 0 
                    ? (withCompensation.length / categoryIncidents.length) * 100 
                    : 0;
                  
                  return (
                    <tr key={category.id} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                      <td className="py-3 px-4 font-medium">{category.label}</td>
                      <td className="text-center py-3 px-4">{categoryIncidents.length}</td>
                      <td className="text-center py-3 px-4">{withCompensation.length}</td>
                      <td className="text-center py-3 px-4">{total.toFixed(0)} €</td>
                      <td className="text-center py-3 px-4">{average.toFixed(0)} €</td>
                      <td className="text-center py-3 px-4">{percentage.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentCompensationAnalytics;