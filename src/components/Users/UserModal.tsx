import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Hotel, Settings } from 'lucide-react';
import { User, userRoles } from '../../types/users';
import { Hotel as HotelType } from '../../types/parameters';
import { hotelsService } from '../../services/firebase/hotelsService';
import { modulesService, FirebaseModule } from '../../services/firebase/modulesService';
import { useUserPermissions } from '../../hooks/useUserPermissions';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: Omit<User, 'id'>, password?: string) => void;
  user?: User | null;
  isEdit?: boolean;
}

export default function UserModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  user, 
  isEdit = false 
}: UserModalProps) {
  const { isSystemAdmin } = useUserPermissions();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'standard' as User['role'],
    hotels: [] as string[],
    modules: [] as string[],
    active: true
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [modules, setModules] = useState<FirebaseModule[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelsError, setHotelsError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          role: user.role,
          hotels: user.hotels || [],
          modules: user.modules || [],
          active: user.active
        });
      } else {
        setFormData({
          name: '',
          email: '',
          role: 'standard',
          hotels: [],
          modules: [],
          active: true
        });
      }
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, user]);

  const loadData = async () => {
    setHotelsLoading(true);
    setHotelsError(null);
    try {
      console.log('Chargement des données...');
      
      // Initialiser les modules si nécessaire
      await modulesService.checkAndInitializeModules();
      
      const [hotelsData, modulesData] = await Promise.all([
        hotelsService.getHotels(),
        modulesService.getAllAppModules()
      ]);

      console.log('Hôtels chargés:', hotelsData);
      console.log('Modules chargés:', modulesData);
      
      setHotels(hotelsData);
      setModules(modulesData);
      
      if (hotelsData.length === 0) {
        setHotelsError('Aucun hôtel trouvé. Veuillez d\'abord créer des hôtels dans les paramètres.');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setHotelsError('Erreur lors du chargement des données: ' + (error as Error).message);
    } finally {
      setHotelsLoading(false);
    }
  };

  const toggleHotel = (hotelId: string) => {
    setFormData(prev => ({
      ...prev,
      hotels: prev.hotels.includes(hotelId)
        ? prev.hotels.filter(id => id !== hotelId)
        : [...prev.hotels, hotelId]
    }));
  };

  const toggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter(id => id !== moduleId)
        : [...prev.modules, moduleId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEdit) {
      if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
      }
      if (password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
    }

    if (formData.hotels.length === 0) {
      alert('Veuillez sélectionner au moins un hôtel accessible');
      return;
    }

    if (formData.modules.length === 0) {
      alert('Veuillez sélectionner au moins un module accessible');
      return;
    }
    
    // Vérifier si l'utilisateur tente de modifier le rôle sans être admin système
    if (isEdit && !isSystemAdmin && user && user.role !== formData.role) {
      alert('Seul un administrateur système peut modifier le rôle d\'un utilisateur');
      return;
    }

    onSubmit(formData, !isEdit ? password : undefined);
    onClose();
  };

  if (!isOpen) return null;

  const selectedRole = userRoles.find(r => r.key === formData.role);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            {isEdit ? 'Modifier l\'utilisateur' : 'Ajouter un nouvel utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 rounded-lg"
          >
            <X className="w-4 h-4 text-warm-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <p className="text-sm text-warm-600">
            {isEdit 
              ? 'Modifiez les informations et les permissions de l\'utilisateur.' 
              : 'Créez un nouvel utilisateur et définissez ses permissions.'
            }
          </p>

          {/* Informations de base */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border-2 border-creho-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 focus:border-creho-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Adresse e-mail *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                placeholder="john.doe@exemple.com"
              />
            </div>
          </div>

          {/* Mot de passe (seulement pour la création) */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 pr-10"
                    placeholder="••••••"
                    minLength={6}
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
                <p className="text-xs text-warm-500 mt-1">
                  Minimum 6 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">
                  Confirmer le mot de passe *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                  placeholder="••••••"
                  minLength={6}
                />
              </div>
            </div>
          )}

          {/* Rôle */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Rôle *
              {isEdit && !isSystemAdmin && (
                <span className="text-xs text-orange-600 ml-2">(Seuls les administrateurs système peuvent modifier les rôles)</span>
              )}
            </label>
            <div className="space-y-3">
              {userRoles.map((role) => (
                <label key={role.key} className="flex items-start">
                  <input
                    type="radio"
                    name="role"
                    value={role.key}
                    checked={formData.role === role.key}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                    className="mt-1 text-creho-500 focus:ring-creho-500"
                    disabled={(isEdit && !isSystemAdmin) || (isEdit && user?.role === 'system_admin' && !isSystemAdmin && role.key !== 'system_admin')}
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-warm-900">{role.label}</div>
                    <div className="text-xs text-warm-600">{role.description}</div>
                    {role.key === 'system_admin' && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        ⚡ Accès automatique à tous les modules et hôtels
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Hôtels accessibles */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Hôtels accessibles *
              {formData.role === 'system_admin' && (
                <span className="text-xs text-green-600 ml-2">(Accès automatique à tous les hôtels)</span>
              )}
            </label>
            
            {hotelsLoading ? (
              <div className="border border-warm-300 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Chargement des hôtels...
                </div>
              </div>
            ) : hotelsError ? (
              <div className="border border-red-300 rounded-lg p-4 bg-red-50">
                <p className="text-sm text-red-600">{hotelsError}</p>
                <button
                  type="button"
                  onClick={loadData}
                  className="mt-2 text-sm text-red-700 underline hover:text-red-900"
                >
                  Réessayer
                </button>
              </div>
            ) : hotels.length === 0 ? (
              <div className="border border-orange-300 rounded-lg p-4 bg-orange-50">
                <p className="text-sm text-orange-700 mb-2">
                  Aucun hôtel trouvé. Vous devez d'abord créer des hôtels dans les paramètres.
                </p>
                <p className="text-xs text-orange-600">
                  Allez dans Paramètres → Hôtels pour créer de nouveaux hôtels.
                </p>
              </div>
            ) : (
              <div className={`max-h-32 overflow-y-auto border border-warm-300 rounded-lg p-3 space-y-2 ${formData.role === 'system_admin' ? 'opacity-50' : ''}`}>
                {hotels.map((hotel) => (
                  <div key={hotel.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Hotel className="w-4 h-4 text-warm-400 mr-2" />
                      <span className="text-sm text-warm-700">{hotel.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleHotel(hotel.id)}
                      disabled={formData.role === 'system_admin'}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        formData.hotels.includes(hotel.id) || formData.role === 'system_admin'
                          ? 'bg-creho-500' 
                          : 'bg-warm-300'
                      } ${formData.role === 'system_admin' ? 'cursor-not-allowed' : ''}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        formData.hotels.includes(hotel.id) || formData.role === 'system_admin'
                          ? 'translate-x-7' 
                          : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {hotels.length > 0 && (
              <p className="text-xs text-warm-500 mt-1">
                {formData.role === 'system_admin' 
                  ? `Accès automatique à tous les hôtels (${hotels.length})` 
                  : `${formData.hotels.length} hôtel(s) sélectionné(s) sur ${hotels.length} disponible(s)`
                }
              </p>
            )}
          </div>

          {/* Modules accessibles */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Modules accessibles *
              {formData.role === 'system_admin' && (
                <span className="text-xs text-green-600 ml-2">(Accès automatique à tous les modules)</span>
              )}
            </label>
            <div className={`max-h-40 overflow-y-auto border border-warm-300 rounded-lg p-3 space-y-2 ${formData.role === 'system_admin' ? 'opacity-50' : ''}`}>
              {modules.map((module) => (
                <div key={module.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Settings className="w-4 h-4 text-warm-400 mr-2" />
                    <span className="text-sm text-warm-700">{module.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    disabled={formData.role === 'system_admin'}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      formData.modules.includes(module.id) || formData.role === 'system_admin'
                        ? 'bg-creho-500' 
                        : 'bg-warm-300'
                    } ${formData.role === 'system_admin' ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      formData.modules.includes(module.id) || formData.role === 'system_admin'
                        ? 'translate-x-7' 
                        : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-warm-500 mt-1">
              {formData.role === 'system_admin' 
                ? `Accès automatique à tous les modules (${modules.length})` 
                : `${formData.modules.length} module(s) sélectionné(s) sur ${modules.length} disponible(s)`
              }
            </p>
          </div>

          {/* Statut actif */}
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-warm-700">
              Utilisateur actif
            </label>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full relative transition-colors ${
                  formData.active ? 'bg-green-500' : 'bg-warm-300'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    formData.active ? 'translate-x-7' : 'translate-x-1'
                  }`}></div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={hotelsLoading || hotels.length === 0}
              className="flex-1 px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEdit ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}