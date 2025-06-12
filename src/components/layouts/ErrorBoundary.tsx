import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: _, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    
    // Log to an error reporting service here if needed
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback || (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-800 border border-cream-200 dark:border-charcoal-700 rounded-lg shadow-lg max-w-2xl w-full p-8">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-16 w-16 text-amber-500 mb-6" />
              
              <h1 className="text-2xl font-bold mb-2">Une erreur est survenue</h1>
              
              <div className="mb-6 text-muted-foreground">
                <p className="mb-2">Nous sommes désolés, une erreur inattendue s'est produite.</p>
                
                {this.state.error && (
                  <Alert variant="destructive" className="my-4 text-left">
                    <AlertDescription>
                      <strong>Erreur:</strong> {this.state.error.message}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="mt-4">
                  <p>Vous pouvez essayer de:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside text-left text-sm">
                    <li>Rafraîchir la page</li>
                    <li>Revenir à l'accueil</li>
                    <li>Vérifier votre connexion internet</li>
                    <li>Contacter l'assistance technique si le problème persiste</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={this.handleHome} variant="outline">
                  Retour à l'accueil
                </Button>
                <Button onClick={this.handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rafraîchir la page
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;