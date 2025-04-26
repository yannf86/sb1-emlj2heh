import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { parameters, hotels } from '@/lib/data';
import { Incident } from '../types/incident.types';

interface IncidentChartsProps {
  incidents: Incident[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const IncidentCharts: React.FC<IncidentChartsProps> = ({ incidents }) => {
  // Extract parameters by type
  const categoryParams = parameters.filter(p => p.type === 'incident_category');
  const statusParams = parameters.filter(p => p.type === 'status');
  const impactParams = parameters.filter(p => p.type === 'impact');

  // Prepare chart data
  const incidentsByCategory = categoryParams.map(category => ({
    name: category.label,
    value: incidents.filter(inc => inc.categoryId === category.id).length
  }));

  const incidentsByStatus = statusParams.map(status => ({
    name: status.label,
    value: incidents.filter(inc => inc.statusId === status.id).length
  }));

  const incidentsByImpact = impactParams.map(impact => ({
    name: impact.label,
    value: incidents.filter(inc => inc.impactId === impact.id).length
  }));

  const incidentsByHotel = hotels.map(hotel => ({
    name: hotel.name,
    value: incidents.filter(inc => inc.hotelId === hotel.id).length
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Incidents by Category */}
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

      {/* Incidents by Hotel */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Incidents par Hôtel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={incidentsByHotel}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={60} />
                <Tooltip />
                <Bar dataKey="value" name="Incidents" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Incidents by Status */}
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

      {/* Incidents by Impact */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Incidents par Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incidentsByImpact}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
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
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentCharts;