import React, { useState } from 'react';
import { Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('yann@agence-creho.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Redirection explicite vers le dashboard après connexion réussie
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-creho-500 rounded-2xl flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-creho-500 rounded-sm"></div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-warm-900 mb-2">Creho</h2>
          <p className="text-warm-600">Connectez-vous pour accéder à votre espace</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2 bg-creho-50 px-4 py-2 rounded-lg">
              <User className="w-4 h-4 text-creho-600" />
              <span className="text-sm font-medium text-creho-700">Utilisateur</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="email-address" className="flex items-center text-sm font-medium text-warm-700">
                  <span className="mr-2">@</span>
                  Adresse e-mail *
                </label>
              </div>
              <input
                id="email-address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 border-2 border-creho-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 focus:border-creho-500"
                placeholder="yann@agence-creho.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="flex items-center text-sm font-medium text-warm-700">
                  <span className="mr-2">🔑</span>
                  Mot de passe *
                </label>
                <button
                  type="button"
                  className="text-sm text-creho-600 hover:text-creho-500"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 focus:border-transparent pr-10"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-warm-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-warm-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-creho-500 hover:bg-creho-600 disabled:bg-creho-300 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-creho-500 focus:ring-offset-2"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-warm-600">
            Pour créer un compte, veuillez contacter un administrateur qui
            pourra créer votre compte depuis la section Utilisateurs.
          </div>
        </div>
      </div>
    </div>
  );
}