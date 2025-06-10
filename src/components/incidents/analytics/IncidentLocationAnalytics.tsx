import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Building, MapPin } from 'lucide-react';
import { parameters, hotels } from '@/lib/data';
import { Incident } from '../types/incident.types';

interface IncidentLocationAnalyticsProps {
  incidents: Incident[];
  onExportChart: (chartId: string) => void;
}

const IncidentLocationAnalytics: React.FC<IncidentLocationAnalyticsProps> = ({ incidents, onExportChart }) => {
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [selectedViewType, setSelectedViewType] = useState<string>('locations');
  
  const locationParams = parameters.filter(p => p.type === 'location');
  
  // Filter incidents by selected hotel
  const filteredIncidents = selectedHotel === 'all' 
    ? incidents 
    : incidents.filter(inc => inc.hotelId === selectedHotel);
  
  // Get incidents by location
  const incidentsByLocation = locationParams.map(location => ({
    name: location.label,
    value: filteredIncidents.filter(inc => inc.locationId === location.id).length
  })).sort((a, b) => b.value - a.value);
  
  // Get incidents by room type if available
  const roomTypeParams = parameters.filter(p => p.type === 'room_type');
  
  const incidentsByRoomType = roomTypeParams.map(type => ({
    name: type.label,
    value: filteredIncidents.filter(inc => inc.roomType === type.id).length
  })).sort((a, b) => b.value - a.value);

  // Get heatmap data - room numbers with frequency of issues
  const getHeatmapData = () => {
    // Group incidents by room numbers and create bubble size based on frequency
    const roomCounts: Record<string, number> = {};
    
    filteredIncidents.forEach(inc => {
      if (inc.description && inc.description.includes('chambre')) {
        // Extract room number using regex
        const match = inc.description.match(/chambre\s*(\d+)/i);
        if (match && match[1]) {
          const roomNumber = match[1];
          roomCounts[roomNumber] = (roomCounts[roomNumber] || 0) + 1;
        }
      }
    });
    
    // Convert to scatter chart data
    return Object.entries(roomCounts).map(([room, count]) => ({
      x: parseInt(room, 10) % 100, // X position based on room number
      y: Math.floor(parseInt(room, 10) / 100), // Y position based on floor
      z: count, // Size based on frequency
      room: room,
      count
    }));
  };
  
  // Get top problematic rooms
  const getTopProblematicRooms = () => {
    const roomCounts: Record<string, any> = {};
    
    filteredIncidents.forEach(inc => {
      if (inc.description && inc.description.includes('chambre')) {
        // Extract room number using regex
        const match = inc.description.match(/chambre\s*(\d+)/i);
        if (match && match[1]) {
          const roomNumber = match[1];
          if (!roomCounts[roomNumber]) {
            roomCounts[roomNumber] = {
              count: 0,
              incidents: []
            };
          }
          roomCounts[roomNumber].count++;
          roomCounts[roomNumber].incidents.push(inc);
        }
      }
    });
    
    // Sort by frequency and take top 10
    return Object.entries(roomCounts)
      .map(([room, data]: [string, any]) => ({
        room,
        count: data.count,
        categories: data.incidents.reduce((acc: Record<string, number>, inc: Incident) => {
          const categoryId = inc.categoryId;
          const categoryName = parameters.find(p => p.id === categoryId)?.label || 'Autre';
          acc[categoryName] = (acc[categoryName] || 0) + 1;
          return acc;
        }, {}),
        lastIncident: new Date(Math.max(...data.incidents.map((i: Incident) => new Date(i.date).getTime()))).toLocaleDateString(),
        avgImpact: data.incidents.reduce((acc: number, inc: Incident) => {
          const impactValue = {
            'imp1': 1, // Faible
            'imp2': 2, // Moyen
            'imp3': 3, // Élevé
            'imp4': 4  // Critique
          }[inc.impactId] || 0;
          return acc + impactValue;
        }, 0) / data.incidents.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // Location impact on satisfaction
  const getLocationSatisfactionData = () => {
    const data: Record<string, any> = {};
    
    locationParams.forEach(location => {
      const locationIncidents = filteredIncidents.filter(inc => inc.locationId === location.id);
      if (locationIncidents.length === 0) return;
      
      const satisfied = locationIncidents.filter(inc => 
        inc.clientSatisfactionId === 'sat1' || inc.clientSatisfactionId === 'sat2'
      ).length;
      const neutral = locationIncidents.filter(inc => inc.clientSatisfactionId === 'sat3').length;
      const unsatisfied = locationIncidents.filter(inc => 
        inc.clientSatisfactionId === 'sat4' || inc.clientSatisfactionId === 'sat5'
      ).length;
      
      const totalWithFeedback = satisfied + neutral + unsatisfied;
      
      data[location.label] = {
        name: location.label,
        incidents: locationIncidents.length,
        satisfactionScore: totalWithFeedback > 0 
          ? (satisfied * 100 - unsatisfied * 100) / totalWithFeedback 
          : 0
      };
    });
    
    return Object.values(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Select value={selectedHotel} onValueChange={setSelectedHotel}>
            <SelectTrigger className="w-full">
              <Building className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Tous les hôtels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les hôtels</SelectItem>
              {hotels.map(hotel => (
                <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Select value={selectedViewType} onValueChange={setSelectedViewType}>
            <SelectTrigger className="w-full">
              <MapPin className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type d'analyse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="locations">Analyse par lieu</SelectItem>
              <SelectItem value="rooms">Analyse par chambre</SelectItem>
              <SelectItem value="heatmap">Cartographie des incidents</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {selectedViewType === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Incidents par Lieu</CardTitle>
                <CardDescription>Répartition des incidents par emplacement</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onExportChart('incidents-by-location')}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={incidentsByLocation}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={90} />
                    <Tooltip />
                    <Bar dataKey="value" name="Incidents" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Impact sur la Satisfaction Client</CardTitle>
                <CardDescription>Par lieu</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onExportChart('location-satisfaction')}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getLocationSatisfactionData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[-100, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="satisfactionScore" 
                      name="Score de Satisfaction (-100 à +100)" 
                      fill="#8884d8"
                      isAnimationActive={false}
                    >
                      {getLocationSatisfactionData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.satisfactionScore > 0 ? '#10b981' : '#ef4444'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Incidents par Type de Chambre</CardTitle>
                <CardDescription>Répartition par catégorie de chambre</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onExportChart('incidents-by-room-type')}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={incidentsByRoomType}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Incidents" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {selectedViewType === 'rooms' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Top 10 des Chambres Problématiques</CardTitle>
              <CardDescription>Chambres avec le plus d'incidents signalés</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExportChart('top-problematic-rooms')}
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
                    <th className="text-left py-3 px-4">Chambre</th>
                    <th className="text-center py-3 px-4">Incidents</th>
                    <th className="text-left py-3 px-4">Catégories principales</th>
                    <th className="text-center py-3 px-4">Impact Moyen</th>
                    <th className="text-center py-3 px-4">Dernier Incident</th>
                  </tr>
                </thead>
                <tbody>
                  {getTopProblematicRooms().map((room, index) => (
                    <tr key={room.room} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                      <td className="py-3 px-4 font-medium">Chambre {room.room}</td>
                      <td className="text-center py-3 px-4">{room.count}</td>
                      <td className="py-3 px-4">
                        {Object.entries(room.categories)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 2)
                          .map(([category, count], i) => (
                            <div key={i} className="text-sm">
                              {category}: <span className="font-medium">{count as number}</span>
                            </div>
                          ))}
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            room.avgImpact < 2 ? 'bg-green-100 text-green-800' :
                            room.avgImpact < 3 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {room.avgImpact < 2 ? 'Faible' :
                            room.avgImpact < 3 ? 'Moyen' :
                            room.avgImpact < 3.5 ? 'Élevé' : 'Critique'}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">{room.lastIncident}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedViewType === 'heatmap' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Carte de Chaleur des Incidents</CardTitle>
              <CardDescription>Concentration des incidents par chambre</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExportChart('room-heatmap')}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Numéro de Chambre" 
                    domain={[0, 100]}
                    label={{ value: 'Numéro de Chambre', position: 'bottom' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Étage" 
                    domain={[0, 10]}
                    label={{ value: 'Étage', angle: -90, position: 'left' }}
                  />
                  <ZAxis 
                    type="number" 
                    dataKey="z" 
                    range={[60, 400]} 
                    name="Fréquence" 
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name, props) => {
                      if (name === "Numéro de Chambre") return [`Chambre ${props.payload.room}`, ""];
                      if (name === "Étage") return [`Étage ${value}`, ""];
                      if (name === "Fréquence") return [`${props.payload.count} incidents`, ""];
                      return [value, name];
                    }}
                  />
                  <Scatter 
                    name="Incidents par Chambre" 
                    data={getHeatmapData()} 
                    fill="#8884d8"
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IncidentLocationAnalytics;