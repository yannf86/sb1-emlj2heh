import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building as Buildings, Lock, Mail, Key, UserCircle, AlertTriangle, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { login, isAuthenticated } from '@/lib/auth';
import { loginTechnician, isTechnicianLoggedIn } from '@/lib/technician-auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LoginPage = () => {
  // State for user login
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State for technician login
  const [techEmail, setTechEmail] = useState('');
  const [techPassword, setTechPassword] = useState('');
  const [techLoading, setTechLoading] = useState(false);
  const [techErrorMessage, setTechErrorMessage] = useState<string | null>(null);
  
  // Auth check loading state
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>('user');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        navigate('/dashboard', { replace: true });
        return;
      }
      
      if (isTechnicianLoggedIn()) {
        navigate('/technician/dashboard', { replace: true });
        return;
      }
      
      setCheckingAuth(false);
    };
    
    // Short delay to ensure auth state is ready
    const timer = setTimeout(checkAuth, 500);
    return () => clearTimeout(timer);
  }, [navigate]);
  
  // Handle user login form submission
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    
    // Basic validation
    if (username === '') {
      setErrorMessage("Veuillez entrer un nom d'utilisateur");
      setLoading(false);
      return;
    }
    
    if (email === '') {
      setErrorMessage("Veuillez entrer une adresse e-mail");
      setLoading(false);
      return;
    }
    
    if (password === '') {
      setErrorMessage("Veuillez entrer un mot de passe");
      setLoading(false);
      return;
    }
    
    // Perform login (passing username to validate it matches)
    const result = await login(email, password, username);
    
    if (result.success) {
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${username}`,
      });
      navigate('/dashboard');
    } else {
      setErrorMessage(result.message || "Identifiants incorrects");
    }
    
    setLoading(false);
  };

  // Handle technician login form submission
  const handleTechnicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTechLoading(true);
    setTechErrorMessage(null);
    
    // Basic validation
    if (!techEmail) {
      setTechErrorMessage("Veuillez entrer votre adresse e-mail");
      setTechLoading(false);
      return;
    }
    
    if (!techPassword) {
      setTechErrorMessage("Veuillez entrer un mot de passe");
      setTechLoading(false);
      return;
    }
    
    try {
      // Attempt login
      const result = await loginTechnician(techEmail, techPassword);
      
      if (result.success) {
        toast({
          title: "Connexion réussie",
          description: `Bienvenue, ${result.technician.name}`,
        });
        navigate('/technician/dashboard');
      } else {
        setTechErrorMessage(result.message || "Identifiants incorrects");
      }
    } catch (error) {
      console.error('Login error:', error);
      setTechErrorMessage("Une erreur est survenue lors de la connexion");
    } finally {
      setTechLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Buildings className="h-12 w-12 text-brand-500 animate-pulse mx-auto mb-4" />
          <p className="text-lg font-medium">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Buildings className="h-12 w-12 text-brand-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-brand-600">Creho</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder à votre espace
          </CardDescription>
        </CardHeader>

        <Tabs
          defaultValue="user"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="px-6 mb-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="user" className="flex items-center">
                <UserCircle className="h-4 w-4 mr-2" />
                Utilisateur
              </TabsTrigger>
              <TabsTrigger value="technician" className="flex items-center">
                <Wrench className="h-4 w-4 mr-2" />
                Technicien
              </TabsTrigger>
            </TabsList>
          </div>

          {/* User Login Content */}
          <TabsContent value="user">
            <form onSubmit={handleUserSubmit}>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
              
                <div className="space-y-2">
                  <div className="flex items-center">
                    <UserCircle className="h-4 w-4 text-muted-foreground mr-2" />
                    <label htmlFor="username" className="text-sm font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Nom d'utilisateur</label>
                  </div>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Votre nom d'utilisateur"
                    className="w-full"
                    required
                  />
                </div>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Key className="h-4 w-4 text-muted-foreground mr-2" />
                      <label htmlFor="password" className="text-sm font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Mot de passe</label>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => toast({
                        title: "Réinitialisation du mot de passe",
                        description: "Veuillez contacter votre administrateur pour réinitialiser votre mot de passe.",
                      })}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
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
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </Button>
              </CardFooter>
            </form>
            <div className="mt-4 text-center px-6 pb-6">
              <p className="text-sm text-muted-foreground">
                Pour créer un compte, veuillez contacter un administrateur qui pourra créer votre compte depuis la section Utilisateurs.
              </p>
            </div>
          </TabsContent>

          {/* Technician Login Content */}
          <TabsContent value="technician">
            <form onSubmit={handleTechnicianSubmit}>
              <CardContent className="space-y-4">
                {techErrorMessage && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{techErrorMessage}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                    <label htmlFor="tech-email" className="text-sm font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Adresse e-mail</label>
                  </div>
                  <Input
                    id="tech-email"
                    type="email"
                    value={techEmail}
                    onChange={(e) => setTechEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="w-full"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 text-muted-foreground mr-2" />
                    <label htmlFor="tech-password" className="text-sm font-medium after:content-['*'] after:ml-0.5 after:text-red-500">Mot de passe</label>
                  </div>
                  <Input
                    id="tech-password"
                    type="password"
                    value={techPassword}
                    onChange={(e) => setTechPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={techLoading}
                >
                  {techLoading ? 'Connexion en cours...' : 'Se connecter'}
                </Button>
              </CardFooter>
            </form>
            <div className="mt-4 text-center px-6 pb-6">
              <p className="text-sm text-muted-foreground">
                Portail réservé aux techniciens. Pour créer un compte technicien, veuillez contacter un administrateur.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default LoginPage;