import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, AlertTriangle, ClipboardCheck, Loader2, ChevronRight, Eye, Calendar, MapPin, PenTool as Tool, Building, Edit, Database } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { getQuoteRequestsForTechnician, submitQuote, updateQuote } from '@/lib/db/quote-requests';
import { useToast } from '@/hooks/use-toast';
import { getCurrentTechnician, logoutTechnician } from '@/lib/technician-auth';
import { TECHNICIAN_SPECIALTIES } from '@/pages/TechniciansPage';
import { getMaintenanceRequest } from '@/lib/db/maintenance';

const TechnicianQuoteRequests = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indexError, setIndexError] = useState<boolean>(false);
  const [quoteRequests, setQuoteRequests] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Quote form state
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteComments, setQuoteComments] = useState('');
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [acceptRequest, setAcceptRequest] = useState(true);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Load quote requests
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        setIndexError(false);
        
        console.log(`Loading quote requests (attempt ${retryCount + 1})...`);

        // Verify technician exists before making the request
        const technician = getCurrentTechnician();
        if (!technician) {
          console.error('No technician logged in, redirecting to login');
          navigate('/technician-login');
          return;
        }
        
        console.log("Loading dashboard for technician:", technician.id, technician.name);
        console.log("Technician specialties:", technician.specialties);
        
        // Load quote request counts
        const requests = await getQuoteRequestsForTechnician();
        
        // Check if we have an error or index issue
        if (requests.error) {
          if (requests.requiresIndex) {
            console.log("Index error detected:", requests.errorMessage);
            setIndexError(true);
            setError('Un index Firebase est requis pour cette requête. L\'index est en cours de création et sera bientôt disponible.');
            toast({
              title: "Configuration Firebase en cours",
              description: "Un index est en cours de création pour afficher les demandes de devis. Veuillez réessayer dans quelques minutes.",
              variant: "destructive"
            });
          } else if (requests.errorMessage) {
            setError(`Erreur: ${requests.errorMessage}`);
          } else {
            setError('Une erreur est survenue lors du chargement des données.');
          }
        } else {
          // Set stats if there are no errors
          console.log("Request data:", requests);
          setQuoteRequests(requests);
        }
      } catch (error) {
        console.error('Error loading quote requests:', error);
        setError(error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement des données.');
        toast({
          title: "Erreur",
          description: "Impossible de charger les demandes de devis.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadRequests();
  }, [toast, navigate, retryCount]);
  
  // Filter quote requests based on status
  const filteredRequests = quoteRequests.filter(request => {
    const currentTechnician = getCurrentTechnician();
    if (!currentTechnician) return false;
    
    if (filterStatus === 'all') return true;
    
    // Get quote status for this technician
    const quoteStatus = getQuoteStatus(request);
    
    if (filterStatus === 'pending' && !quoteStatus) return true; // No quote submitted yet
    if (filterStatus === 'submitted' && quoteStatus === 'pending') return true;
    if (filterStatus === 'accepted' && quoteStatus === 'accepted') return true;
    if (filterStatus === 'rejected' && quoteStatus === 'rejected') return true;
    
    return false;
  });
  
  // Handle view details
  const handleViewDetails = (request: any) => {
    console.log('Viewing details for request:', request.id);
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };
  
  // Handle submit quote
  const handleSubmitQuoteClick = (request: any) => {
    console.log('Opening quote form for request:', request.id);
    setSelectedRequest(request);
    setQuoteAmount('');
    setQuoteComments('');
    setQuoteFile(null);
    setAcceptRequest(true);
    setExistingFileUrl(null);
    setIsEditing(false);
    setQuoteDialogOpen(true);
  };

  // Handle edit quote
  const handleEditQuoteClick = (request: any) => {
    console.log('Opening edit form for existing quote:', request.id);
    
    // Find the quote from the current technician
    const technician = getCurrentTechnician();
    if (!technician) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour modifier un devis",
        variant: "destructive"
      });
      return;
    }
    
    let technicianQuote = null;
    let quoteAmount = '';
    let quoteComments = '';
    let quoteUrl = null;
    
    // Check if there are quotes in the new format
    if (request.quotes && Array.isArray(request.quotes)) {
      technicianQuote = request.quotes.find(q => q.technicianId === technician.id);
      if (technicianQuote) {
        quoteAmount = technicianQuote.amount?.toString() || '';
        quoteComments = technicianQuote.comments || '';
        quoteUrl = technicianQuote.url || null;
      }
    } else if (request.technicianId === technician.id) {
      // Legacy format - use the main quote data
      quoteAmount = request.quoteAmount?.toString() || '';
      quoteComments = request.quoteComments || '';
      quoteUrl = request.quoteUrl || null;
    }
    
    if (!technicianQuote && request.technicianId !== technician.id) {
      toast({
        title: "Erreur",
        description: "Vous n'avez pas soumis de devis pour cette demande",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedRequest(request);
    setQuoteAmount(quoteAmount);
    setQuoteComments(quoteComments);
    setQuoteFile(null);
    setExistingFileUrl(quoteUrl);
    setAcceptRequest(true);
    setIsEditing(true);
    setQuoteDialogOpen(true);
  };
  
  // Helper function to get specialty name from ID
  const getSpecialtyName = (specialtyId: string): string => {
    const specialty = TECHNICIAN_SPECIALTIES.find(s => s.id === specialtyId);
    return specialty ? specialty.name : specialtyId;
  };
  
  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximum autorisée est de 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setQuoteFile(file);
    }
  };
  
  // Handle submit form
  const handleSubmitQuoteForm = async () => {
    try {
      setSubmitting(true);
      
      // Verify technician is logged in
      const technician = getCurrentTechnician();
      if (!technician) {
        console.error('No technician logged in, redirecting to login');
        // Close the dialog before redirecting
        setQuoteDialogOpen(false);
        // Logout the technician (clear their session)
        logoutTechnician();
        // Redirect to login page
        navigate('/technician-login');
        return;
      }
      
      if (acceptRequest && (!quoteAmount || parseFloat(quoteAmount) <= 0)) {
        toast({
          title: "Montant invalide",
          description: "Veuillez saisir un montant valide pour le devis",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }
      
      // Prepare submission data
      const quoteData = {
        amount: acceptRequest ? parseFloat(quoteAmount) : 0,
        comments: quoteComments,
        quoteFile: quoteFile,
        acceptRequest,
        existingFileUrl: existingFileUrl
      };
      
      console.log('Submitting quote with data:', {
        ...quoteData,
        quoteFile: quoteFile ? `${quoteFile.name} (${quoteFile.size} bytes)` : null
      });
      
      // Submit or update the quote directly with the selected request object
      let result;
      if (isEditing) {
        result = await updateQuote(selectedRequest, quoteData);
        toast({
          title: "Devis modifié",
          description: result.message || "Votre devis a été mis à jour avec succès",
        });
      } else {
        result = await submitQuote(selectedRequest, quoteData);
        toast({
          title: acceptRequest ? "Devis soumis" : "Demande refusée",
          description: result.message,
        });
      }
      
      // Reload the quote requests after update
      const updatedRequests = await getQuoteRequestsForTechnician();
      if (!updatedRequests.error) {
        setQuoteRequests(updatedRequests);
      }
      
      // Close dialog
      setQuoteDialogOpen(false);
      
      // Reset form
      setQuoteAmount('');
      setQuoteComments('');
      setQuoteFile(null);
      setExistingFileUrl(null);
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la soumission du devis",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get current quote status for a technician in a request
  const getQuoteStatus = (request: any) => {
    const technician = getCurrentTechnician();
    if (!technician) return null;
    
    // Check if request has quotes array
    if (request.quotes && Array.isArray(request.quotes)) {
      const technicianQuote = request.quotes.find((q: any) => q.technicianId === technician.id);
      if (technicianQuote) {
        return technicianQuote.status;
      }
    } 
    
    // Legacy format - only if this technician is the assigned one
    if (request.technicianId === technician.id) {
      // IMPROVED: Check explicitly for status values in the correct order
      if (request.quoteStatus) {
        return request.quoteStatus; 
      } else if (request.quoteAccepted === true) {
        return 'accepted';
      } else if (request.quoteAccepted === false) {
        return 'rejected';
      } else if (request.quoteSubmitted) {
        return 'pending';
      }
    }
    
    // No quote submitted yet
    return null;
  };
  
  // Check if technician has submitted a quote for this request
  const hasSubmittedQuote = (request: any) => {
    const technician = getCurrentTechnician();
    if (!technician) return false;
    
    // Check if request has quotes array
    if (request.quotes && Array.isArray(request.quotes)) {
      return request.quotes.some((q: any) => q.technicianId === technician.id);
    }
    
    // Legacy format - only if this technician is the assigned one
    return request.technicianId === technician.id && request.quoteSubmitted;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4 mx-auto text-brand-500" />
          <p className="text-lg font-medium">Chargement des demandes de devis...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Demandes de Devis</h1>
          <p className="text-muted-foreground">Gérez les demandes de devis et soumettez vos propositions</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            defaultValue="all"
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente de devis</SelectItem>
              <SelectItem value="submitted">Devis soumis</SelectItem>
              <SelectItem value="accepted">Devis acceptés</SelectItem>
              <SelectItem value="rejected">Devis refusés</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline"
            onClick={() => {
              setRetryCount(prev => prev + 1);
            }}
          >
            Actualiser
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            {indexError && (
              <div className="flex items-center mt-2">
                <Database className="h-4 w-4 mr-1" />
                <span className="text-xs">Statut: Index Firebase en cours de création</span>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Aucune demande de devis {filterStatus !== 'all' ? 'avec ce statut' : ''}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filterStatus === 'all' 
                ? "Vous n'avez actuellement aucune demande de devis."
                : "Aucune demande ne correspond au filtre sélectionné."}
            </p>
            {filterStatus !== 'all' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setFilterStatus('all')}
              >
                Voir toutes les demandes
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Demandes de devis ({filteredRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Type d'intervention</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => {
                  const quoteStatus = getQuoteStatus(request);
                  const hasQuote = hasSubmittedQuote(request);
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">{formatDate(request.date)}</div>
                        <div className="text-xs text-muted-foreground">{request.time}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{request.hotelName}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{request.locationName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Tool className="h-4 w-4 text-muted-foreground" />
                          <span>{request.interventionTypeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {request.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!hasQuote ? (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600 border-blue-300">
                            En attente de devis
                          </span>
                        ) : quoteStatus === 'pending' ? (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-600 border-amber-300">
                            Devis soumis
                          </span>
                        ) : quoteStatus === 'accepted' ? (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-300">
                            Devis accepté
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-300">
                            Devis refusé
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(request)}
                          className="mr-2"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                        
                        {!hasQuote && (
                          <Button
                            onClick={() => handleSubmitQuoteClick(request)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Soumettre devis
                          </Button>
                        )}
                        
                        {/* Edit button for pending quotes that have been submitted */}
                        {hasQuote && quoteStatus === 'pending' && (
                          <Button
                            onClick={() => handleEditQuoteClick(request)}
                            variant="outline"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                        )}
                        
                        {quoteStatus === 'accepted' && (
                          <Button
                            variant="outline"
                            onClick={() => navigate('/technician/schedule')}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Planifier
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Request Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <span className="font-medium">{selectedRequest.hotelName}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Date d'intervention</p>
                  <div className="font-medium">
                    {formatDate(selectedRequest.date)} à {selectedRequest.time}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Type d'intervention</p>
                  <div className="font-medium flex items-center">
                    <Tool className="h-4 w-4 text-muted-foreground mr-1" />
                    {selectedRequest.interventionTypeName}
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lieu</p>
                <div className="font-medium">
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.hotelName}</span>
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.locationName}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md mt-1">
                  <p>{selectedRequest.description}</p>
                </div>
              </div>
              
              {selectedRequest.photoBefore && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Photo du problème</p>
                  <div className="mt-1 border rounded-md overflow-hidden">
                    <img 
                      src={selectedRequest.photoBefore} 
                      alt="Photo du problème"
                      className="max-h-64 w-auto mx-auto"
                    />
                  </div>
                </div>
              )}
              
              {(() => {
                // Find the quote from the current technician
                const technician = getCurrentTechnician();
                if (!technician) return null;
                
                let technicianQuote = null;
                if (selectedRequest.quotes && Array.isArray(selectedRequest.quotes)) {
                  technicianQuote = selectedRequest.quotes.find(q => q.technicianId === technician.id);
                  if (technicianQuote) {
                    // Get actual quote status
                    const actualStatus = technicianQuote.status || 'pending';
                    
                    return (
                      <div className={`p-4 rounded-md border ${
                        actualStatus === 'accepted' ? 'bg-green-50 border-green-200' : 
                        actualStatus === 'rejected' ? 'bg-red-50 border-red-200' : 
                        'bg-brand-50 border-brand-200'
                      }`}>
                        <div className="flex justify-between items-start">
                          <p className="font-medium">Votre devis</p>
                          
                          {/* Edit button inside the quote details section - only for pending quotes */}
                          {actualStatus === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setDetailDialogOpen(false);
                                handleEditQuoteClick(selectedRequest);
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Montant</p>
                            <p className="font-bold">{technicianQuote.amount} €</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Statut</p>
                            <div>
                              {actualStatus === 'pending' ? (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-600 border-amber-300">
                                  En attente
                                </span>
                              ) : actualStatus === 'accepted' ? (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-300">
                                  Accepté
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-300">
                                  Refusé
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Display file link if exists */}
                        {technicianQuote.url && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">Document</p>
                            <a 
                              href={technicianQuote.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-sm text-brand-600 hover:text-brand-800 flex items-center mt-1"
                            >
                              <FileText className="h-3.5 w-3.5 mr-1" />
                              Voir le document
                            </a>
                          </div>
                        )}
                        
                        {technicianQuote.comments && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">Commentaires</p>
                            <p className="text-sm">{technicianQuote.comments}</p>
                          </div>
                        )}
                      </div>
                    );
                  }
                } 
                
                // Legacy format - create an artificial quote object if this technician is the assigned one
                if (selectedRequest.technicianId === technician.id) {
                  // Determine the real status based on the priority of fields
                  let actualStatus;
                  if (selectedRequest.quoteStatus) {
                    actualStatus = selectedRequest.quoteStatus;
                  } else if (selectedRequest.quoteAccepted === true) {
                    actualStatus = 'accepted';
                  } else if (selectedRequest.quoteAccepted === false) {
                    actualStatus = 'rejected';
                  } else {
                    actualStatus = 'pending';
                  }
                  
                  return (
                    <div className={`p-4 rounded-md border ${
                      actualStatus === 'accepted' ? 'bg-green-50 border-green-200' : 
                      actualStatus === 'rejected' ? 'bg-red-50 border-red-200' : 
                      'bg-brand-50 border-brand-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <p className="font-medium">Votre devis</p>
                        
                        {/* Edit button inside the quote details section - only for pending quotes */}
                        {actualStatus === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setDetailDialogOpen(false);
                              handleEditQuoteClick(selectedRequest);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Montant</p>
                          <p className="font-bold">{selectedRequest.quoteAmount} €</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Statut</p>
                          <div>
                            {actualStatus === 'pending' ? (
                              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-600 border-amber-300">
                                En attente
                              </span>
                            ) : actualStatus === 'accepted' ? (
                              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-300">
                                Accepté
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-300">
                                Refusé
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Display file link if exists */}
                      {selectedRequest.quoteUrl && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Document</p>
                          <a 
                            href={selectedRequest.quoteUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm text-brand-600 hover:text-brand-800 flex items-center mt-1"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Voir le document
                          </a>
                        </div>
                      )}
                      
                      {selectedRequest.quoteComments && (
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Commentaires</p>
                          <p className="text-sm">{selectedRequest.quoteComments}</p>
                        </div>
                      )}
                    </div>
                  );
                }
                
                // No quote from this technician
                return null;
              })()}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Fermer
            </Button>
            
            {selectedRequest && !hasSubmittedQuote(selectedRequest) && (
              <Button onClick={() => {
                setDetailDialogOpen(false);
                handleSubmitQuoteClick(selectedRequest);
              }}>
                <FileText className="h-4 w-4 mr-1" />
                Soumettre devis
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Submit/Edit Quote Dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifier le devis" : "Soumettre un devis"}</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  <span className="font-medium">{selectedRequest.interventionTypeName}</span>
                  {' '}pour{' '}
                  <span className="font-medium">{selectedRequest.hotelName}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            {!isEditing && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox" 
                  id="accept-request"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={acceptRequest}
                  onChange={(e) => setAcceptRequest(e.target.checked)}
                />
                <Label htmlFor="accept-request" className="font-medium">
                  J'accepte de soumettre un devis pour cette intervention
                </Label>
              </div>
            )}
            
            {!acceptRequest && !isEditing && (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-sm text-red-800 font-medium">Vous êtes sur le point de refuser cette demande</p>
                <p className="text-sm text-red-700 mt-1">
                  Si vous refusez cette demande, vous ne pourrez plus y répondre ultérieurement.
                </p>
                <div className="mt-2">
                  <Label htmlFor="reject-reason" className="text-sm">
                    Raison du refus (optionnel)
                  </Label>
                  <textarea
                    id="reject-reason"
                    className="mt-1 block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                    rows={3}
                    placeholder="Motif du refus..."
                    value={quoteComments}
                    onChange={(e) => setQuoteComments(e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}
            
            {(acceptRequest || isEditing) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="quote-amount" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    Montant du devis (€)
                  </Label>
                  <Input
                    id="quote-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quote-file">
                    Document du devis (PDF, DOC, DOCX)
                  </Label>
                  
                  {existingFileUrl && !quoteFile && (
                    <div className="mb-2 flex items-center justify-between p-2 bg-slate-50 rounded-md border">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-brand-500 mr-2" />
                        <div className="text-sm">Document existant</div>
                      </div>
                      <div className="flex space-x-2">
                        <a 
                          href={existingFileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-brand-600 hover:text-brand-800"
                        >
                          Voir
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setExistingFileUrl(null)}
                        >
                          Remplacer
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {(quoteFile || !existingFileUrl) && (
                    <>
                      {quoteFile ? (
                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md border">
                          <div className="text-sm">
                            {quoteFile.name} ({Math.round(quoteFile.size / 1024)} Ko)
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setQuoteFile(null)}
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-brand-600 hover:text-brand-500">
                                <span>Téléverser un fichier</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileSelect} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                              </label>
                              <p className="pl-1">ou glisser-déposer</p>
                            </div>
                            <p className="text-xs text-gray-500">PDF, DOC, DOCX jusqu'à 5MB</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quote-comments">
                    Commentaires (optionnel)
                  </Label>
                  <textarea
                    id="quote-comments"
                    className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    value={quoteComments}
                    onChange={(e) => setQuoteComments(e.target.value)}
                    placeholder="Commentaires sur le devis..."
                  ></textarea>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setQuoteDialogOpen(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            
            <Button
              onClick={handleSubmitQuoteForm}
              disabled={submitting || (acceptRequest && (!quoteAmount || parseFloat(quoteAmount) <= 0))}
              variant={isEditing ? 'default' : acceptRequest ? 'default' : 'destructive'}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : isEditing ? (
                'Enregistrer les modifications'
              ) : acceptRequest ? (
                'Soumettre le devis'
              ) : (
                'Refuser la demande'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechnicianQuoteRequests;