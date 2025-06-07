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
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { parameters, hotels } from '@/lib/data';
import { Incident } from '../types/incident.types';
import { getIncidentCategoryParameters } from '@/lib/db/parameters-incident-categories';
import { getImpactParameters } from '@/lib/db/parameters-impact';
import { getStatusParameters } from '@/lib/db/parameters-status';
import { getHotels } from '@/lib/db/hotels';

interface IncidentChartsProps {
  incidents: Incident[];
  onExportChart: (chartId: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const IncidentCharts: React.FC<IncidentChartsProps> = ({ incidents, onExportChart }) => {
  const [categoryParams, setCategoryParams] = React.useState<any[]>([]);
  const [statusParams, setStatusParams] = React.useState<any[]>([]);
  const [impactParams, setImpactParams] = React.useState<any[]>([]);
  const [hotelList, setHotelList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch parameters and hotels from Firebase
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categories, impacts, statuses, hotelData] = await Promise.all([
          getIncidentCategoryParameters(),
          getImpactParameters(),
          getStatusParameters(),
          getHotels()
        ]);
        
        setCategoryParams(categories);
        setImpactParams(impacts);
        setStatusParams(statuses);
        setHotelList(hotelData);
      } catch (error) {
        console.error('Error fetching data for charts:', error);
        // Fallback to static data if fetch fails
        setCategoryParams(parameters.filter(p => p.type === 'incident_category'));
        setImpactParams(parameters.filter(p => p.type === 'impact'));
        setStatusParams(parameters.filter(p => p.type === 'status'));
        setHotelList(hotels);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate incidents by category using the loaded parameters
  const incidentsByCategory = categoryParams.map(category => ({
    name: category.label,
    value: incidents.filter(inc => inc.categoryId === category.id).length
  }));

  // Calculate incidents by hotel
  const incidentsByHotel = hotelList.map(hotel => ({
    name: hotel.name,
    value: incidents.filter(inc => inc.hotelId === hotel.id).length
  }));

  // Calculate incidents by status
  const incidentsByStatus = statusParams.map(status => ({
    name: status.label,
    value: incidents.filter(inc => inc.statusId === status.id).length
  }));

  // Calculate incidents by impact
  const incidentsByImpact = impactParams.map(impact => ({
    name: impact.label,
    value: incidents.filter(inc => inc.impactId === impact.id).length
  }));

  // Get monthly data for trend line
  const getLast6MonthsData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[month.getMonth()];
      const monthIncidents = incidents.filter(inc => {
        const incDate = new Date(inc.date);
        return incDate.getMonth() === month.getMonth() && 
               incDate.getFullYear() === month.getFullYear();
      }).length;

      data.push({
        name: monthName,
        incidents: monthIncidents
      });
    }

    return data;
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement des données analytiques...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="col-span-1">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Incidents par Catégorie</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('incidents-by-category')}
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
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Incidents par Hôtel</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('incidents-by-hotel')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
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
                <Legend />
                <Bar dataKey="value" name="Incidents" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Incidents par Statut</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('incidents-by-status')}
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
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Incidents par Impact</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('incidents-by-impact')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
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
                <Bar dataKey="value" name="Incidents">
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
    </div>
  );
};

export default IncidentCharts;