import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  Star,
  Database
} from 'lucide-react';
import { getCurrentTechnician } from '@/lib/technician-auth';
import { getQuoteRequestsCount } from '@/lib/db/quote-requests';
import { useToast } from '@/hooks/use-toast';

const TechnicianDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [indexError, setIndexError] = useState<boolean>(false);
  const [stats, setStats] = useState<any>({
    pendingRequests: 0,
    submittedQuotes: 0,
    acceptedQuotes: 0,
    total: 0
  });
  
  const technician = getCurrentTechnician();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        setIndexError(false);
        
        // Load quote request counts
        const requestCounts = await getQuoteRequestsCount();
        setStats(requestCounts);
        
        // Check if we have a Firestore index error
        if (requestCounts.requiresIndex) {
          setIndexError(true);
          setError('Un index Firebase est requis pour cette requête. L\'index est en cours de création et sera bientôt disponible.');
          toast({
            title: "Configuration Firebase en cours",
            description: "Un index est en cours de création pour afficher les demandes de devis. Veuillez réessayer dans quelques minutes.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Une erreur est survenue lors du chargement des données.');
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du tableau de bord.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboard();
  }, [toast]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4 mx-auto text-brand-500" />
          <p className="text-lg font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de Bord Technicien</h1>
        <p className="text-muted-foreground">Bienvenue {technician?.name}</p>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Erreur</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
              {indexError && (
                <div className="mt-2">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    L'index Firebase nécessaire est en cours de création. Cette opération peut prendre quelques minutes.
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    Veuillez patienter et réessayer dans quelques instants.
                  </p>
                  <div className="flex items-center mt-2">
                    <Database className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
                    <p className="text-xs text-red-700 dark:text-red-400">
                      Statut: Index Firebase en cours de création
                    </p>
                  </div>
                </div>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stats Cards */}
        <Card className="bg-white dark:bg-charcoal-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <ClipboardCheck className="h-5 w-5 mr-2 text-brand-500" />
              Demandes de devis
            </CardTitle>
            <CardDescription>Demandes en attente de votre réponse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingRequests}</div>
            {stats.pendingRequests > 0 && (
              <Button 
                className="mt-2"
                variant="outline"
                size="sm"
                onClick={() => navigate('/technician/quote-requests')}
              >
                Voir les demandes
              </Button>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-charcoal-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-amber-500" />
              Devis en attente
            </CardTitle>
            <CardDescription>En attente d'une réponse client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.submittedQuotes}</div>
            {stats.submittedQuotes > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Ces devis sont en cours d'examen par le client
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-charcoal-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Devis acceptés
            </CardTitle>
            <CardDescription>Interventions à planifier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.acceptedQuotes}</div>
            {stats.acceptedQuotes > 0 && (
              <Button
                className="mt-2" 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/technician/accepted-quotes')}
              >
                Voir les interventions
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Profile Card */}
      <Card className="bg-white dark:bg-charcoal-900">
        <CardHeader>
          <CardTitle>Profil Technicien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{technician?.name}</h3>
                <p className="text-sm text-muted-foreground">{technician?.email}</p>
              </div>
              
              <div className="flex items-center">
                <Star className="h-5 w-5 text-amber-400 mr-1" />
                <span className="font-semibold">{technician?.rating?.toFixed(1) || 'N/A'}</span>
                {technician?.completedJobs > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({technician.completedJobs} intervention{technician.completedJobs > 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium">Status:</p>
              <div className="mt-1">
                {technician?.available ? (
                  <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                    Disponible
                  </span>
                ) : (
                  <span className="inline-flex items-center bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 mr-1 bg-amber-500 rounded-full"></span>
                    Indisponible
                  </span>
                )}
              </div>
            </div>
            
            {technician?.specialties && technician.specialties.length > 0 && (
              <div>
                <p className="text-sm font-medium">Spécialités:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {technician.specialties.map((specialty: string) => (
                    <span 
                      key={specialty}
                      className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate('/technician/settings')}
              className="mt-2"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Gérer ma disponibilité
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianDashboard;