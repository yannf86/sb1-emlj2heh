import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building as Buildings, Lock, Mail, Key, UserCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, isAuthenticated } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent) => {
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
  
  return (
    <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Buildings className="h-12 w-12 text-brand-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-brand-600">Creho</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder à votre espace de gestion
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
                Pour créer un compte, veuillez contacter un administrateur qui pourra créer votre compte depuis la section Utilisateurs.
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;