import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Incident } from '../types/incident.types';
import { getIncidentCategoryParameters } from '@/lib/db/parameters-incident-categories';
import { getClientSatisfactionParameters } from '@/lib/db/parameters-client-satisfaction';

interface IncidentDetailedAnalyticsProps {
  incidents: Incident[];
  onExportChart: (chartId: string) => void;
}

const IncidentDetailedAnalytics: React.FC<IncidentDetailedAnalyticsProps> = ({ incidents, onExportChart }) => {
  const [categoryParams, setCategoryParams] = useState<any[]>([]);
  const [satisfactionParams, setSatisfactionParams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categories, satisfactions] = await Promise.all([
          getIncidentCategoryParameters(),
          getClientSatisfactionParameters(),
        ]);
        setCategoryParams(categories);
        setSatisfactionParams(satisfactions);
      } catch (error) {
        console.error('Error fetching detailed analytics data:', error);
        // Fallback to static data
        setCategoryParams([]);
        setSatisfactionParams([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Calculate incidents per category per month for trend analysis
  const getIncidentCategoryTrends = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const data = [];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthData: any = {
        name: months[month.getMonth()],
      };
      
      // Count incidents for each category this month
      categoryParams.forEach(category => {
        const count = incidents.filter(inc => {
          const incDate = new Date(inc.date);
          return incDate.getMonth() === month.getMonth() && 
                 incDate.getFullYear() === month.getFullYear() &&
                 inc.categoryId === category.id;
        }).length;
        
        monthData[category.label] = count;
      });
      
      data.push(monthData);
    }

    return data;
  };
  
  // Get specific incident category details
  const getCategoryDetails = (categoryId: string) => {
    const categoryIncidents = incidents.filter(inc => inc.categoryId === categoryId);
    
    // Calculate satisfaction rates for this category
    const satisfied = categoryIncidents.filter(inc => 
      inc.clientSatisfactionId === 'sat1' || inc.clientSatisfactionId === 'sat2'
    ).length;
    const neutral = categoryIncidents.filter(inc => inc.clientSatisfactionId === 'sat3').length;
    const unsatisfied = categoryIncidents.filter(inc => 
      inc.clientSatisfactionId === 'sat4' || inc.clientSatisfactionId === 'sat5'
    ).length;
    
    const totalWithFeedback = satisfied + neutral + unsatisfied;
    
    const satisfactionData = [
      { name: 'Satisfait', value: satisfied, percentage: totalWithFeedback > 0 ? Math.round((satisfied / totalWithFeedback) * 100) : 0 },
      { name: 'Neutre', value: neutral, percentage: totalWithFeedback > 0 ? Math.round((neutral / totalWithFeedback) * 100) : 0 },
      { name: 'Insatisfait', value: unsatisfied, percentage: totalWithFeedback > 0 ? Math.round((unsatisfied / totalWithFeedback) * 100) : 0 }
    ];
    
    // Calculate average resolution time for this category
    const resolvedIncidents = categoryIncidents.filter(inc => 
      inc.statusId === 'stat3' || inc.statusId === 'stat4' || 
      inc.statusId === '3ElZmcduy3R8NUd1kuzn' || inc.statusId === 'JyK8HpAF5qwg39QbQeS1'
    );
    
    let avgResolutionTime = 0;
    if (resolvedIncidents.length > 0) {
      avgResolutionTime = resolvedIncidents.reduce((acc, inc) => {
        const created = new Date(inc.createdAt).getTime();
        const updated = new Date(inc.updatedAt).getTime();
        return acc + (updated - created);
      }, 0) / resolvedIncidents.length / (1000 * 60 * 60); // Convert to hours
    }
    
    return {
      count: categoryIncidents.length,
      satisfactionData,
      avgResolutionTime,
      withCompensation: categoryIncidents.filter(inc => inc.compensationAmount && parseFloat(inc.compensationAmount) > 0).length,
      totalCompensation: categoryIncidents.reduce((acc, inc) => {
        if (inc.compensationAmount) {
          return acc + parseFloat(inc.compensationAmount);
        }
        return acc;
      }, 0)
    };
  };
  
  // Detailed stats for all categories
  const categoryStats = categoryParams.map(category => {
    const details = getCategoryDetails(category.id);
    return {
      id: category.id,
      name: category.label,
      ...details
    };
  }).sort((a, b) => b.count - a.count);
  
  const colors = {
    satisfied: "#10b981",
    neutral: "#f59e0b",
    unsatisfied: "#ef4444"
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return <div className="p-8 text-center">Chargement des données détaillées...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Category trends over time */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Évolution des Catégories d'Incident</CardTitle>
            <CardDescription>Tendances sur les 6 derniers mois</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('category-trends')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getIncidentCategoryTrends()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {categoryParams.map((category, index) => (
                  <Bar 
                    key={category.id} 
                    dataKey={category.label} 
                    stackId="a" 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Top categories details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categoryStats.slice(0, 4).map(category => (
          <Card key={category.id} className="col-span-1">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>{category.count} incidents</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onExportChart(`category-${category.id}`)}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Satisfaction Client</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={category.satisfactionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill={colors.satisfied} />
                          <Cell fill={colors.neutral} />
                          <Cell fill={colors.unsatisfied} />
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${props.payload.percentage}%`, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Temps moyen de résolution</h4>
                    <div className="text-2xl font-bold">{category.avgResolutionTime.toFixed(1)}h</div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Gestes commerciaux</h4>
                    <div className="text-xl font-bold">{category.totalCompensation.toFixed(0)}€</div>
                    <div className="text-sm text-muted-foreground">{category.withCompensation} incidents avec compensation</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* All categories comparison */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Comparaison des Catégories d'Incidents</CardTitle>
            <CardDescription>Performance et statistiques par catégorie</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('all-categories')}
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
                  <th className="text-left py-3 px-4">Catégorie</th>
                  <th className="text-center py-3 px-4">Nombre</th>
                  <th className="text-center py-3 px-4">Temps de résolution</th>
                  <th className="text-center py-3 px-4">% Satisfaction</th>
                  <th className="text-center py-3 px-4">Total compensations</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((category, index) => (
                  <tr key={category.id} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                    <td className="py-3 px-4 font-medium">{category.name}</td>
                    <td className="text-center py-3 px-4">{category.count}</td>
                    <td className="text-center py-3 px-4">{category.avgResolutionTime.toFixed(1)}h</td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center">
                        <div 
                          className="w-16 h-4 rounded-full overflow-hidden bg-gray-200"
                          title={`${category.satisfactionData[0].percentage}% satisfait, ${category.satisfactionData[2].percentage}% insatisfait`}
                        >
                          <div className="flex h-full">
                            <div className="bg-green-500 h-full" style={{ width: `${category.satisfactionData[0].percentage}%` }}></div>
                            <div className="bg-amber-400 h-full" style={{ width: `${category.satisfactionData[1].percentage}%` }}></div>
                            <div className="bg-red-500 h-full" style={{ width: `${category.satisfactionData[2].percentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      {category.totalCompensation.toFixed(0)}€
                      <span className="text-xs text-gray-500 block">
                        ({category.withCompensation} incidents)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentDetailedAnalytics;