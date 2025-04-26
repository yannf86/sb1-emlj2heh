import React, { useState } from 'react';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardCheck, 
  Search, 
  Download, 
  Plus, 
  RefreshCw,
  SlidersHorizontal,
  BarChart2,
  FileText
} from 'lucide-react';
import { 
  qualityVisits,
  hotels, 
  parameters, 
  getHotelName, 
  getParameterLabel, 
  getUserName 
} from '@/lib/data';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Import components
import QualityVisitDialog from '@/components/quality/QualityVisitDialog';
import QualityVisitForm from '@/components/quality/QualityVisitForm';

// Define chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const QualityPage = () => {
  const [selectedTab, setSelectedTab] = useState('list');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterVisitType, setFilterVisitType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const { toast } = useToast();
  
  // Local state for quality visits
  const [localQualityVisits, setLocalQualityVisits] = useState(qualityVisits);
  
  // New visit dialog
  const [newVisitDialogOpen, setNewVisitDialogOpen] = useState(false);
  
  // View quality visit dialog
  const [viewVisitDialogOpen, setViewVisitDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  
  // Extract parameters by type
  const visitTypeParams = parameters.filter(p => p.type === 'visit_type');
  const qualityCategoryParams = parameters.filter(p => p.type === 'quality_category');
  
  // Filter visits based on selected filters
  const filteredVisits = localQualityVisits.filter(visit => {
    // Filter by hotel
    if (filterHotel !== 'all' && visit.hotelId !== filterHotel) return false;
    
    // Filter by visit type
    if (filterVisitType !== 'all' && visit.visitTypeId !== filterVisitType) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesHotel = getHotelName(visit.hotelId).toLowerCase().includes(query);
      const matchesVisitor = getUserName(visit.visitorId).toLowerCase().includes(query);
      const matchesVisitType = getParameterLabel(visit.visitTypeId).toLowerCase().includes(query);
      
      if (!matchesHotel && !matchesVisitor && !matchesVisitType) return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  
  // Handle new visit submission
  const handleSubmitVisit = (formData: any) => {
    // Here you would normally send the data to your backend
    toast({
      title: "Visite créée",
      description: "La visite qualité a été créée avec succès",
    });
    setNewVisitDialogOpen(false);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilterHotel('all');
    setFilterVisitType('all');
    setSearchQuery('');
  };
  
  // Handle view quality visit
  const handleViewVisit = (visitId: string) => {
    const visit = localQualityVisits.find(v => v.id === visitId);
    if (visit) {
      setSelectedVisit(visit);
      setViewVisitDialogOpen(true);
    }
  };
  
  // Handle update visit
  const handleUpdateVisit = (updatedVisit: any) => {
    setLocalQualityVisits(prev => 
      prev.map(visit => 
        visit.id === updatedVisit.id ? updatedVisit : visit
      )
    );
  };
  
  // Create data for radar chart - average scores by category
  const getCategoryAverages = () => {
    const categoryScores: { [key: string]: { count: number, total: number } } = {};
    
    // Initialize categories
    qualityCategoryParams.forEach(cat => {
      categoryScores[cat.id] = { count: 0, total: 0 };
    });
    
    // Calculate scores
    filteredVisits.forEach(visit => {
      visit.checklist.forEach(item => {
        if (item.result === 'conforme') {
          categoryScores[item.categoryId].total += 1;
        }
        if (item.result !== 'non-applicable') {
          categoryScores[item.categoryId].count += 1;
        }
      });
    });
    
    // Convert to chart data
    return qualityCategoryParams.map(cat => ({
      category: cat.label,
      score: categoryScores[cat.id].count > 0 
        ? Math.round((categoryScores[cat.id].total / categoryScores[cat.id].count) * 100) 
        : 0
    }));
  };
  
  const categoryAverages = getCategoryAverages();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visites Contrôle Qualité</h1>
          <p className="text-muted-foreground">Suivi des visites et évaluations de qualité</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={() => setNewVisitDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Visite
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={filterHotel} onValueChange={setFilterHotel}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tous les hôtels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les hôtels</SelectItem>
              {hotels.map(hotel => (
                <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={() => setFiltersExpanded(!filtersExpanded)}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={resetFilters}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {filtersExpanded && (
          <div className="p-4 border rounded-md">
            <div>
              <label className="text-sm font-medium mb-1 block">Type de visite</label>
              <Select value={filterVisitType} onValueChange={setFilterVisitType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {visitTypeParams.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="list" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="list">Liste des Visites</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Hôtel</TableHead>
                  <TableHead>Type de visite</TableHead>
                  <TableHead>Visiteur</TableHead>
                  <TableHead>Référent Local</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <span className="mr-2">Taux Conformité</span>
                      <ClipboardCheck className="h-4 w-4 text-green-500" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Aucune visite trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>
                        <div className="font-medium">{formatDate(visit.visitDate)}</div>
                        <div className="text-xs text-muted-foreground">{visit.startTime} - {visit.endTime}</div>
                      </TableCell>
                      <TableCell>{getHotelName(visit.hotelId)}</TableCell>
                      <TableCell>{getParameterLabel(visit.visitTypeId)}</TableCell>
                      <TableCell>{getUserName(visit.visitorId)}</TableCell>
                      <TableCell>{visit.localReferentId ? getUserName(visit.localReferentId) : "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div 
                            className={`h-2.5 w-full rounded-full ${
                              visit.conformityRate >= 90 ? "bg-green-500" :
                              visit.conformityRate >= 80 ? "bg-lime-500" :
                              visit.conformityRate >= 70 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`}
                          >
                            <div 
                              className="h-2.5 rounded-full bg-green-700" 
                              style={{ width: `${visit.conformityRate}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 font-medium text-sm">{visit.conformityRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewVisit(visit.id)}
                        >
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quality Scores by Hotel */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Scores Qualité par Hôtel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={hotels.map(hotel => {
                        const hotelVisits = filteredVisits.filter(visit => visit.hotelId === hotel.id);
                        return {
                          name: hotel.name.substring(0, 15),
                          score: hotelVisits.length > 0 
                            ? Math.round(hotelVisits.reduce((acc, visit) => acc + visit.conformityRate, 0) / hotelVisits.length) 
                            : 0
                        };
                      })}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                      <Bar dataKey="score" name="Score Qualité (%)">
                        {hotels.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={
                            index % 2 === 0 ? '#4caf50' : '#2e7d32'
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Category Radar Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Scores par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryAverages}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar 
                        name="Score (%)" 
                        dataKey="score" 
                        stroke="#2563eb" 
                        fill="#3b82f6" 
                        fillOpacity={0.6} 
                      />
                      <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* New Visit Form */}
      <QualityVisitForm
        isOpen={newVisitDialogOpen}
        onClose={() => setNewVisitDialogOpen(false)}
        onSubmit={handleSubmitVisit}
      />
      
      {/* View/Edit Visit Dialog */}
      <QualityVisitDialog 
        visit={selectedVisit}
        isOpen={viewVisitDialogOpen}
        onClose={() => setViewVisitDialogOpen(false)}
        onUpdate={handleUpdateVisit}
      />
    </div>
  );
};

export default QualityPage;