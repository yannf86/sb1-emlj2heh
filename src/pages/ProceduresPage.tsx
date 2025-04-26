import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  FileText, 
  Plus, 
  Upload,
  Building,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Download,
  Save,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Search
} from 'lucide-react';
import { 
  procedures, 
  hotelServices, 
  hotels, 
  users, 
  parameters,
  getHotelName,
  getParameterLabel,
  getUserName,
  getServiceName
} from '@/lib/data';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ProceduresPage = () => {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'services' | 'procedures'>(
    'services'
  );

  // Dialogs
  const [newProcedureDialog, setNewProcedureDialog] = useState(false);
  const [viewProcedureDialog, setViewProcedureDialog] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  
  // Filter procedures based on selected filters
  const filteredProcedures = procedures.filter(procedure => {
    // Filter by service
    if (selectedService && procedure.serviceId !== selectedService) return false;
    
    // Filter by hotel
    if (filterHotel !== 'all' && !procedure.hotelIds.includes(filterHotel)) return false;
    
    // Filter by type
    if (filterType !== 'all' && procedure.typeId !== filterType) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = procedure.title.toLowerCase().includes(query);
      const matchesDescription = procedure.description.toLowerCase().includes(query);
      const matchesService = getServiceName(procedure.serviceId).toLowerCase().includes(query);
      const matchesType = getParameterLabel(procedure.typeId).toLowerCase().includes(query);
      
      if (!matchesTitle && !matchesDescription && !matchesService && !matchesType) return false;
    }
    
    return true;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  // Handle view procedure
  const handleViewProcedure = (procedureId: string) => {
    const procedure = procedures.find(p => p.id === procedureId);
    if (procedure) {
      setSelectedProcedure(procedure);
      setViewProcedureDialog(true);
    }
  };
  
  // Handle selecting a service
  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId);
    setViewMode('procedures');
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedService(null);
    setFilterHotel('all');
    setFilterType('all');
    setSearchQuery('');
  };
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      // Handle PDF upload
      toast({
        title: "Fichier PDF ajouté",
        description: `Le fichier ${file.name} a été ajouté avec succès.`,
        variant: "default",
      });
    } else {
      toast({
        title: "Format de fichier invalide",
        description: "Seuls les fichiers PDF sont acceptés.",
        variant: "destructive",
      });
    }
  };
  
  // Count procedures by service
  const getProcedureCountByService = (serviceId: string) => {
    return procedures.filter(p => p.serviceId === serviceId).length;
  };
  
  // Get service name and icon
  const getServiceInfo = (serviceId: string) => {
    const service = hotelServices.find(s => s.id === serviceId);
    return {
      name: service ? service.name : 'Inconnu',
      icon: service ? service.icon : '📄'
    };
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procédures</h1>
          <p className="text-muted-foreground">
            Gestion des procédures et documents par service
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={() => setNewProcedureDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Procédure
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>
      
      {viewMode === 'services' ? (
        /* Services Grid View */
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Services</h2>
          <p className="text-muted-foreground">
            Sélectionnez un service pour consulter les procédures associées
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {hotelServices.map(service => {
              const procedureCount = getProcedureCountByService(service.id);
              
              return (
                <Card 
                  key={service.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700"
                  onClick={() => handleSelectService(service.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <div className="mr-3 p-3 bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-300 rounded-lg text-2xl">
                        {service.icon}
                      </div>
                      <span>{service.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {procedureCount} procédure{procedureCount !== 1 ? 's' : ''}
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1">
                        Voir <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* Procedures List View */
        <div className="space-y-4">
          {selectedService && (
            <div className="flex items-center gap-2 mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setViewMode('services');
                  setSelectedService(null);
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour aux services
              </Button>
              
              <div className="flex items-center bg-brand-50 dark:bg-brand-900 rounded-lg px-3 py-1.5">
                <div className="mr-2 text-xl">{getServiceInfo(selectedService).icon}</div>
                <span className="font-medium">{getServiceInfo(selectedService).name}</span>
              </div>
            </div>
          )}
          
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 border rounded-md">
                <div>
                  <Label htmlFor="filter-type" className="text-sm font-medium mb-1 block">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger id="filter-type">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {parameters
                        .filter(p => p.type === 'procedure_type')
                        .map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Liste des Procédures</CardTitle>
              {selectedService && (
                <CardDescription>
                  Procédures du service {getServiceName(selectedService)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Hôtels</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <span className="mr-2">Lectures</span>
                        <Eye className="h-4 w-4 text-blue-500" />
                      </div>
                    </TableHead>
                    <TableHead>Dernière mise à jour</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcedures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Aucune procédure trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProcedures.map((procedure) => (
                      <TableRow key={procedure.id}>
                        <TableCell>
                          <div className="font-medium">{procedure.title}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                            {procedure.description}
                          </div>
                        </TableCell>
                        <TableCell>{getParameterLabel(procedure.typeId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building className="mr-1 h-3.5 w-3.5 text-slate-500" />
                            <span>
                              {procedure.hotelIds.length === hotels.length 
                                ? "Tous les hôtels" 
                                : procedure.hotelIds.length === 1 
                                  ? getHotelName(procedure.hotelIds[0])
                                  : `${procedure.hotelIds.length} hôtels`
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="text-green-600 font-medium mr-1">
                              {procedure.userReads.filter(ur => ur.validated).length}
                            </span>
                            <span className="text-xs text-slate-500">
                              /{procedure.assignedUserIds.length}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(procedure.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewProcedure(procedure.id)}
                          >
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* New Procedure Dialog */}
      <Dialog open={newProcedureDialog} onOpenChange={setNewProcedureDialog}>
        <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col">
          <DialogHeader className="flex-none">
            <DialogTitle>Nouvelle Procédure</DialogTitle>
            <DialogDescription>
              Créez une nouvelle procédure et assignez-la aux utilisateurs concernés.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-1 py-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" placeholder="Titre de la procédure" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Description de la procédure" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <Select>
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotelServices.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          <span className="mr-2">{service.icon}</span>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {parameters
                        .filter(p => p.type === 'procedure_type')
                        .map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Hôtels concernés</Label>
                <div className="border rounded-md p-4 space-y-2">
                  {hotels.map(hotel => (
                    <div key={hotel.id} className="flex items-center space-x-2">
                      <Switch id={`hotel-${hotel.id}`} />
                      <Label htmlFor={`hotel-${hotel.id}`}>{hotel.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Utilisateurs assignés</Label>
                <div className="border rounded-md p-4 space-y-2">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Switch id={`user-${user.id}`} />
                      <Label htmlFor={`user-${user.id}`}>{user.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Contenu additionnel</Label>
                <textarea
                  id="content"
                  className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  placeholder="Notes ou explications complémentaires..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Document PDF</Label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PDF uniquement</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-none border-t pt-4">
            <Button variant="outline" onClick={() => setNewProcedureDialog(false)}>
              Annuler
            </Button>
            <Button type="submit" onClick={() => setNewProcedureDialog(false)}>
              Créer la procédure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Procedure Dialog */}
      <Dialog open={viewProcedureDialog} onOpenChange={setViewProcedureDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProcedure?.title}</DialogTitle>
            <DialogDescription>
              Procédure du service {selectedProcedure && getServiceName(selectedProcedure.serviceId)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProcedure && (
            <div className="space-y-6">
              {/* Basic procedure information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="font-medium">{getParameterLabel(selectedProcedure.typeId)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Service</p>
                  <p className="font-medium">{getServiceName(selectedProcedure.serviceId)}</p>
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-2 pt-2 border-t">
                <h3 className="text-lg font-medium">Description</h3>
                <p className="text-sm whitespace-pre-wrap">{selectedProcedure.description}</p>
              </div>
              
              {/* Additional content */}
              {selectedProcedure.content && (
                <div className="space-y-2 pt-2 border-t">
                  <h3 className="text-lg font-medium">Notes complémentaires</h3>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 max-h-60 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{selectedProcedure.content}</p>
                  </div>
                </div>
              )}
              
              {/* Hotels */}
              <div className="space-y-4 pt-2 border-t">
                <h3 className="text-lg font-medium flex items-center">
                  <Building className="h-5 w-5 mr-2 text-slate-500" /> 
                  Hôtels concernés
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  {selectedProcedure.hotelIds.length === hotels.length ? (
                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm">
                      Tous les hôtels
                    </div>
                  ) : (
                    selectedProcedure.hotelIds.map(hotelId => (
                      <div key={hotelId} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm">
                        {getHotelName(hotelId)}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Assigned Users and Reading Status */}
              <div className="space-y-4 pt-2 border-t">
                <h3 className="text-lg font-medium flex items-center">
                  <UsersIcon className="h-5 w-5 mr-2 text-slate-500" />
                  Utilisateurs assignés
                </h3>
                
                <div className="border rounded-md divide-y">
                  {selectedProcedure.assignedUserIds.map(userId => {
                    const userRead = selectedProcedure.userReads.find(read => read.userId === userId);
                    return (
                      <div key={userId} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{getUserName(userId)}</p>
                          {userRead && (
                            <p className="text-xs text-slate-500">
                              <Calendar className="h-3.5 w-3.5 inline mr-1" />
                              Lu le {formatDate(userRead.readDate)}
                            </p>
                          )}
                        </div>
                        {userRead ? (
                          userRead.validated ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Validé
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                              Lu
                            </Badge>
                          )
                        ) : (
                          <Badge className="bg-slate-100 text-slate-800 border-slate-200">
                            <XCircle className="mr-1 h-3 w-3" />
                            Non lu
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Document */}
              <div className="space-y-4 pt-2 border-t">
                <h3 className="text-lg font-medium flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-slate-500" /> 
                  Document
                </h3>
                
                <div className="bg-brand-50 border border-brand-200 rounded-md p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedProcedure.fileUrl.split('/').pop()}</p>
                    <p className="text-sm text-slate-500">Cliquez pour télécharger le document</p>
                  </div>
                  <Button variant="outline" size="sm">Télécharger</Button>
                </div>
              </div>
              
              {/* Metadata */}
              <div className="space-y-4 pt-2 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                    <p className="font-medium">{formatDate(selectedProcedure.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Dernière mise à jour</p>
                    <p className="font-medium">{formatDate(selectedProcedure.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewProcedureDialog(false)}>
              Fermer
            </Button>
            <Button>
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProceduresPage;