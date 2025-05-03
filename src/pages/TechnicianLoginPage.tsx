import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building as BuildingIcon, Lock, Mail, Wrench, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { loginTechnician } from '@/lib/technician-auth';

const TechnicianLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if already logged in
  useEffect(() => {
    const techAuth = localStorage.getItem('technicianAuth');
    if (techAuth) {
      try {
        const auth = JSON.parse(techAuth);
        const now = new Date();
        // If session is still valid, redirect to dashboard
        if (auth.expires && new Date(auth.expires) > now) {
          navigate('/technician-dashboard');
        } else {
          // Clear expired session
          localStorage.removeItem('technicianAuth');
        }
      } catch (e) {
        localStorage.removeItem('technicianAuth');
      }
    }
  }, [navigate]);
  
  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    
    // Basic validation
    if (!email) {
      setErrorMessage("Veuillez entrer votre adresse e-mail");
      setLoading(false);
      return;
    }
    
    if (!password) {
      setErrorMessage("Veuillez entrer un mot de passe");
      setLoading(false);
      return;
    }
    
    try {
      // Attempt login
      const result = await loginTechnician(email, password);
      
      if (result.success) {
        toast({
          title: "Connexion réussie",
          description: `Bienvenue, ${result.technician.name}`,
        });
        navigate('/technician-dashboard');
      } else {
        setErrorMessage(result.message || "Identifiants incorrects");
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage("Une erreur est survenue lors de la connexion");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Wrench className="h-12 w-12 text-brand-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-brand-600">Accès Techniciens</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder à votre espace technicien
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                <label htmlFor="email" className="text-sm font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Adresse e-mail</label>
              </div>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                <label htmlFor="password" className="text-sm font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Mot de passe</label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Portal réservé aux techniciens. Pour créer un compte technicien, veuillez contacter un administrateur.
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default TechnicianLoginPage;