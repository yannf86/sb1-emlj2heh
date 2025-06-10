import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Incident } from '../types/incident.types';
import { getUserName } from '@/lib/db/users';

interface IncidentStaffPerformanceProps {
  incidents: Incident[];
  onExportChart: (chartId: string) => void;
}

const IncidentStaffPerformance: React.FC<IncidentStaffPerformanceProps> = ({ incidents, onExportChart }) => {
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  
  // Load staff names
  useEffect(() => {
    const loadStaffNames = async () => {
      setLoading(true);
      
      try {
        // Get unique staff IDs (receivers and concluders)
        const staffIds = new Set<string>();
        incidents.forEach(incident => {
          if (incident.receivedById) staffIds.add(incident.receivedById);
          if (incident.concludedById) staffIds.add(incident.concludedById);
        });
        
        // Load names for all IDs
        const namesMap: Record<string, string> = {};
        for (const id of Array.from(staffIds)) {
          try {
            const name = await getUserName(id);
            namesMap[id] = name;
          } catch (error) {
            console.error(`Error loading name for ID ${id}:`, error);
            namesMap[id] = 'Utilisateur inconnu';
          }
        }
        
        setStaffNames(namesMap);
      } catch (error) {
        console.error('Error loading staff names:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStaffNames();
  }, [incidents]);
  
  // Calculate staff performance metrics
  const getStaffPerformanceData = () => {
    const staffPerformance: Record<string, any> = {};
    
    // Count received incidents by staff member
    incidents.forEach(incident => {
      const staffId = incident.receivedById;
      if (!staffId) return;
      
      if (!staffPerformance[staffId]) {
        staffPerformance[staffId] = {
          id: staffId,
          name: staffNames[staffId] || 'Utilisateur inconnu',
          received: 0,
          resolved: 0,
          avgResolutionTime: 0,
          totalResolutionTime: 0,
          criticalResolved: 0,
          satisfactionScore: 0,
          totalFeedback: 0
        };
      }
      
      staffPerformance[staffId].received++;
    });
    
    // Count resolved incidents and calculate avg resolution time
    incidents.forEach(incident => {
      const staffId = incident.concludedById;
      if (!staffId) return;
      
      if (!staffPerformance[staffId]) {
        staffPerformance[staffId] = {
          id: staffId,
          name: staffNames[staffId] || 'Utilisateur inconnu',
          received: 0,
          resolved: 0,
          avgResolutionTime: 0,
          totalResolutionTime: 0,
          criticalResolved: 0,
          satisfactionScore: 0,
          totalFeedback: 0
        };
      }
      
      staffPerformance[staffId].resolved++;
      
      // Check if critical
      if (incident.impactId === 'imp4') {
        staffPerformance[staffId].criticalResolved++;
      }
      
      // Calculate resolution time
      if (incident.createdAt && incident.updatedAt) {
        const created = new Date(incident.createdAt).getTime();
        const updated = new Date(incident.updatedAt).getTime();
        const resolutionTime = (updated - created) / (1000 * 60 * 60); // in hours
        
        staffPerformance[staffId].totalResolutionTime += resolutionTime;
      }
      
      // Calculate satisfaction score
      if (incident.clientSatisfactionId) {
        const satisfactionValue = {
          'sat1': 2, // Très satisfait
          'sat2': 1, // Satisfait
          'sat3': 0, // Neutre
          'sat4': -1, // Insatisfait
          'sat5': -2 // Très insatisfait
        }[incident.clientSatisfactionId] || 0;
        
        staffPerformance[staffId].satisfactionScore += satisfactionValue;
        staffPerformance[staffId].totalFeedback++;
      }
    });
    
    // Calculate averages
    Object.values(staffPerformance).forEach((staff: any) => {
      if (staff.resolved > 0) {
        staff.avgResolutionTime = staff.totalResolutionTime / staff.resolved;
      }
      
      if (staff.totalFeedback > 0) {
        staff.avgSatisfactionScore = staff.satisfactionScore / staff.totalFeedback;
        // Convert to a 0-100 scale where 0 is worst (-2) and 100 is best (+2)
        staff.normalizedSatisfactionScore = ((staff.avgSatisfactionScore + 2) / 4) * 100;
      } else {
        staff.avgSatisfactionScore = 0;
        staff.normalizedSatisfactionScore = 50; // Neutral
      }
    });
    
    return Object.values(staffPerformance);
  };
  
  const staffPerformance = getStaffPerformanceData();
  
  // Prepare data for radar chart comparing staff performance
  const prepareRadarData = (staffIds: string[]) => {
    const metrics = [
      'Incidents reçus', 
      'Incidents résolus',
      'Temps moyen résolution',
      'Incidents critiques résolus', 
      'Score satisfaction'
    ];
    
    // Find max values for normalization
    const maxValues = {
      'Incidents reçus': Math.max(...staffPerformance.map(s => s.received)),
      'Incidents résolus': Math.max(...staffPerformance.map(s => s.resolved)),
      'Temps moyen résolution': Math.max(...staffPerformance.map(s => s.avgResolutionTime || 0)),
      'Incidents critiques résolus': Math.max(...staffPerformance.map(s => s.criticalResolved)),
      'Score satisfaction': 100
    };
    
    // Normalize data for radar chart (0-100 scale)
    return metrics.map(metric => {
      const data: any = { metric };
      
      staffIds.forEach(id => {
        const staff = staffPerformance.find(s => s.id === id);
        if (!staff) return;
        
        let value = 0;
        switch(metric) {
          case 'Incidents reçus':
            value = staff.received / (maxValues[metric] || 1) * 100;
            break;
          case 'Incidents résolus':
            value = staff.resolved / (maxValues[metric] || 1) * 100;
            break;
          case 'Temps moyen résolution':
            // Invert the scale (faster is better)
            value = staff.avgResolutionTime > 0 
              ? 100 - (staff.avgResolutionTime / (maxValues[metric] || 1) * 100)
              : 0;
            break;
          case 'Incidents critiques résolus':
            value = staff.criticalResolved / (maxValues[metric] || 1) * 100;
            break;
          case 'Score satisfaction':
            value = staff.normalizedSatisfactionScore;
            break;
        }
        
        data[staff.name] = value;
      });
      
      return data;
    });
  };
  
  // Get top 5 staff by resolved incidents
  const topStaff = staffPerformance
    .sort((a, b) => b.resolved - a.resolved)
    .slice(0, 5);
  
  const topStaffIds = topStaff.map(staff => staff.id);
  const radarData = prepareRadarData(topStaffIds);
  
  // Prepare efficiency data - received vs resolved
  const efficiencyData = staffPerformance
    .filter(staff => staff.received > 0)
    .map(staff => ({
      name: staff.name,
      received: staff.received,
      resolved: staff.resolved,
      efficiency: staff.resolved / staff.received * 100
    }))
    .sort((a, b) => b.efficiency - a.efficiency);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Comparaison des performances du personnel</CardTitle>
            <CardDescription>Analyse multi-critère des 5 meilleurs résolveurs</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('staff-radar')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={150} width={730} height={400} data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                {topStaff.map((staff, index) => (
                  <Radar 
                    key={staff.id}
                    name={staff.name}
                    dataKey={staff.name}
                    stroke={`hsl(${index * 60}, 70%, 50%)`}
                    fill={`hsl(${index * 60}, 70%, 50%)`}
                    fillOpacity={0.3}
                  />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Incidents résolus par membre du personnel</CardTitle>
              <CardDescription>Top 10 des résolveurs</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExportChart('staff-resolved')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={staffPerformance.sort((a, b) => b.resolved - a.resolved).slice(0, 10)}
                  margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => [value, 'Incidents résolus']} />
                  <Bar dataKey="resolved" name="Incidents résolus" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Temps moyen de résolution</CardTitle>
              <CardDescription>En heures, par membre du personnel</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExportChart('staff-resolution-time')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={staffPerformance
                    .filter(s => s.resolved > 0)
                    .sort((a, b) => a.avgResolutionTime - b.avgResolutionTime)
                    .slice(0, 10)}
                  margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value) => [`${value.toFixed(1)}h`, 'Temps moyen']} />
                  <Bar dataKey="avgResolutionTime" name="Temps moyen (h)" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Taux d'efficacité du personnel</CardTitle>
              <CardDescription>Incidents reçus vs. résolus par membre du personnel</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExportChart('staff-efficiency')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={efficiencyData.slice(0, 10)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]}/>
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="received" name="Incidents reçus" fill="#f59e0b" />
                  <Bar yAxisId="left" dataKey="resolved" name="Incidents résolus" fill="#10b981" />
                  <Bar yAxisId="right" dataKey="efficiency" name="Taux d'efficacité (%)" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Tableau détaillé des performances du personnel</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onExportChart('staff-performance-table')}
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
                  <th className="text-left py-3 px-4">Personnel</th>
                  <th className="text-center py-3 px-4">Incidents reçus</th>
                  <th className="text-center py-3 px-4">Incidents résolus</th>
                  <th className="text-center py-3 px-4">Efficacité</th>
                  <th className="text-center py-3 px-4">Temps moyen résolution</th>
                  <th className="text-center py-3 px-4">Incidents critiques</th>
                  <th className="text-center py-3 px-4">Score satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance
                  .sort((a, b) => b.resolved - a.resolved)
                  .map((staff, index) => (
                    <tr key={staff.id} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                      <td className="py-3 px-4 font-medium">{staff.name}</td>
                      <td className="text-center py-3 px-4">{staff.received}</td>
                      <td className="text-center py-3 px-4">{staff.resolved}</td>
                      <td className="text-center py-3 px-4">
                        {staff.received > 0 ? `${(staff.resolved / staff.received * 100).toFixed(0)}%` : '-'}
                      </td>
                      <td className="text-center py-3 px-4">
                        {staff.resolved > 0 ? `${staff.avgResolutionTime.toFixed(1)}h` : '-'}
                      </td>
                      <td className="text-center py-3 px-4">{staff.criticalResolved}</td>
                      <td className="text-center py-3 px-4">
                        {staff.totalFeedback > 0 ? (
                          <div className="flex items-center justify-center">
                            <div 
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                staff.normalizedSatisfactionScore >= 75 ? 'bg-green-100 text-green-800' :
                                staff.normalizedSatisfactionScore >= 50 ? 'bg-blue-100 text-blue-800' :
                                staff.normalizedSatisfactionScore >= 25 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {staff.normalizedSatisfactionScore >= 75 ? 'Excellent' :
                               staff.normalizedSatisfactionScore >= 50 ? 'Bon' :
                               staff.normalizedSatisfactionScore >= 25 ? 'Moyen' :
                               'Faible'}
                               {` (${staff.normalizedSatisfactionScore.toFixed(0)}%)`}
                            </div>
                          </div>
                        ) : '-'}
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

export default IncidentStaffPerformance;