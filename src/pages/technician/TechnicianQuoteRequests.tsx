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
        
        const requests = await getQuoteRequestsForTechnician();
        setQuoteRequests(requests);
        
        // Check if we have a Firebase index error
        if (requests.length === 0) {
          try {
            // Try to detect if this is an index error
            const testQuery = query(
              collection(db, 'maintenance'),
              where('technicianIds', 'array-contains', 'any-id'),
              orderBy('date', 'desc')
            );
            await getDocs(testQuery);
          } catch (error) {
            if (error instanceof Error && 
                (error.message.includes('requires an index') || 
                 error.message.includes('FirebaseError: 9 FAILED_PRECONDITION') ||
                 error.message.includes('index is currently building'))) {
              setIndexError(true);
              setError('Un index Firebase est requis pour cette requête. L\'index est en cours de création et sera bientôt disponible.');
            }
          }
        }
      } catch (error) {
        console.error('Error getting quote requests:', error);
        setError('Une erreur est survenue lors du chargement des demandes de devis.');
        
        // Check if this is an index error
        if (error instanceof Error && 
            (error.message.includes('requires an index') || 
             error.message.includes('FirebaseError: 9 FAILED_PRECONDITION') ||
             error.message.includes('index is currently building'))) {
          setIndexError(true);
          setError('Un index Firebase est requis pour cette requête. L\'index est en cours de création et sera bientôt disponible.');
        }
        
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
  }, [toast]);
  
  // Filter quote requests based on status
  const filteredRequests = quoteRequests.filter(request => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending' && !request.quoteSubmitted) return true;
    if (filterStatus === 'submitted' && request.quoteSubmitted && request.quoteStatus === 'pending') return true;
    if (filterStatus === 'accepted' && request.quoteSubmitted && request.quoteStatus === 'accepted') return true;
    if (filterStatus === 'rejected' && request.quoteSubmitted && request.quoteStatus === 'rejected') return true;
    return false;
  });
  
  // Handle view details
  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };
  
  // Handle submit quote
  const handleSubmitQuoteClick = (request: any) => {
    setSelectedRequest(request);
    setQuoteAmount('');
    setQuoteComments('');
    setQuoteFile(null);
    setAcceptRequest(true);
    setExistingFileUrl(null);
    setIsEditing(false);
    setQuoteDialogOpen(true);
  };

  // Handle edit quote - NEW FUNCTION
  const handleEditQuoteClick = (request: any) => {
    setSelectedRequest(request);
    setQuoteAmount(request.quoteAmount?.toString() || '');
    setQuoteComments(request.quoteComments || '');
    setQuoteFile(null);
    setExistingFileUrl(request.quoteUrl || null);
    setAcceptRequest(true);
    setIsEditing(true);
    setQuoteDialogOpen(true);
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
      
      if (acceptRequest && (!quoteAmount || parseFloat(quoteAmount) <= 0)) {
        toast({
          title: "Montant invalide",
          description: "Veuillez saisir un montant valide pour le devis",
          variant: "destructive"
        });
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
      
      // Submit or update the quote
      let result;
      if (isEditing) {
        result = await updateQuote(selectedRequest.id, quoteData);
        toast({
          title: "Devis modifié",
          description: result.message || "Votre devis a été mis à jour avec succès",
        });
      } else {
        result = await submitQuote(selectedRequest.id, quoteData);
        toast({
          title: acceptRequest ? "Devis soumis" : "Demande refusée",
          description: result.message,
        });
      }
      
      // Update local state to reflect the change
      setQuoteRequests(prev => prev.map(req => {
        if (req.id === selectedRequest.id) {
          return {
            ...req,
            quoteSubmitted: acceptRequest,
            quoteRejected: !acceptRequest,
            quoteAmount: acceptRequest ? parseFloat(quoteAmount) : null,
            quoteStatus: 'pending',
            quoteComments: quoteComments,
            quoteUrl: result.quoteUrl || req.quoteUrl
          };
        }
        return req;
      }));
      
      // Close dialog
      setQuoteDialogOpen(false);
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
            onClick={() => window.location.reload()}
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
                {filteredRequests.map((request) => (
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
                      {!request.quoteSubmitted && !request.quoteRejected ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600 border-blue-300">
                          En attente de devis
                        </span>
                      ) : request.quoteStatus === 'pending' ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-600 border-amber-300">
                          Devis soumis
                        </span>
                      ) : request.quoteStatus === 'accepted' ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600 border-green-300">
                          Devis accepté
                        </span>
                      ) : request.quoteStatus === 'rejected' ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-300">
                          Devis refusé
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 border-red-300">
                          Demande refusée
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
                      
                      {!request.quoteSubmitted && !request.quoteRejected && (
                        <Button
                          onClick={() => handleSubmitQuoteClick(request)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Soumettre devis
                        </Button>
                      )}
                      
                      {/* Edit button for pending quotes that have been submitted */}
                      {request.quoteSubmitted && request.quoteStatus === 'pending' && (
                        <Button
                          onClick={() => handleEditQuoteClick(request)}
                          variant="outline"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                      )}
                      
                      {request.quoteSubmitted && request.quoteStatus === 'accepted' && (
                        <Button
                          variant="outline"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Planifier
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
              
              {selectedRequest.quoteSubmitted && (
                <div className="bg-brand-50 border border-brand-200 p-4 rounded-md">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">Votre devis</p>
                    
                    {/* Edit button inside the quote details section */}
                    {selectedRequest.quoteStatus === 'pending' && (
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
                        {selectedRequest.quoteStatus === 'pending' ? (
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-600 border-amber-300">
                            En attente
                          </span>
                        ) : selectedRequest.quoteStatus === 'accepted' ? (
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
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Fermer
            </Button>
            
            {selectedRequest && !selectedRequest.quoteSubmitted && !selectedRequest.quoteRejected && (
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