import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Hotel, Settings, Euro } from 'lucide-react';
import { Technician } from '../../types/maintenance';
import { Hotel as HotelType } from '../../types/parameters';
import { appModules } from '../../types/users';
import { hotelsService } from '../../services/firebase/hotelsService';

interface TechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (technician: Omit<Technician, 'id'>, password?: string) => void;
  technician?: Technician | null;
  isEdit?: boolean;
}

const technicianSpecialties = [
  'Plomberie',
  'Électricité',
  'Climatisation',
  'Chauffage',
  'Menuiserie',
  'Peinture',
  'Carrelage',
  'Serrurerie',
  'Jardinage',
  'Nettoyage',
  'Maintenance générale'
];

export default function TechnicianModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  technician, 
  isEdit = false 
}: TechnicianModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    specialties: [] as string[],
    hourlyRate: 50,
    hotels: [] as string[],
    modules: [] as string[],
    contractType: 'external' as 'internal' | 'external',
    availability: 'available' as 'available' | 'busy' | 'unavailable',
    active: true,
    notes: ''
  });
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelsError, setHotelsError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHotels();
      if (technician) {
        setFormData({
          name: technician.name,
          email: technician.email,
          phone: technician.phone || '',
          company: technician.company || '',
          specialties: technician.specialties || [],
          hourlyRate: technician.hourlyRate || 50,
          hotels: technician.hotels || [],
          modules: technician.modules || [],
          contractType: technician.contractType,
          availability: technician.availability,
          active: technician.active,
          notes: technician.notes || ''
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          specialties: [],
          hourlyRate: 50,
          hotels: [],
          modules: [],
          contractType: 'external',
          availability: 'available',
          active: true,
          notes: ''
        });
      }
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, technician]);

  const loadHotels = async () => {
    setHotelsLoading(true);
    setHotelsError(null);
    try {
      const data = await hotelsService.getHotels();
      setHotels(data);
      
      if (data.length === 0) {
        setHotelsError('Aucun hôtel trouvé. Veuillez d\'abord créer des hôtels dans les paramètres.');
      }
    } catch (error) {
      console.error('Error loading hotels:', error);
      setHotelsError('Erreur lors du chargement des hôtels: ' + (error as Error).message);
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

  const toggleModule = (moduleKey: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleKey)
        ? prev.modules.filter(key => key !== moduleKey)
        : [...prev.modules, moduleKey]
    }));
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
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

    const technicianData: Omit<Technician, 'id'> = {
      ...formData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onSubmit(technicianData, !isEdit ? password : undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            {isEdit ? 'Modifier le technicien' : 'Ajouter un nouveau technicien'}
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
              ? 'Modifiez les informations et les permissions du technicien.' 
              : 'Créez un nouveau technicien pour la maintenance et les interventions techniques.'
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
                Entreprise
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                placeholder="Entreprise de maintenance"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                placeholder="+33 6 12 34 56 78"
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
                  Ce mot de passe servira uniquement pour la première connexion. L'utilisateur recevra un email pour le modifier.
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

          {/* Spécialités */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Spécialités
            </label>
            <div className="grid grid-cols-3 gap-2">
              {technicianSpecialties.map((specialty) => (
                <label key={specialty} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes(specialty)}
                    onChange={() => toggleSpecialty(specialty)}
                    className="mr-2 text-creho-500 focus:ring-creho-500"
                  />
                  <span className="text-sm text-warm-700">{specialty}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-warm-500 mt-1">
              Sélectionnez les domaines de spécialité du technicien
            </p>
          </div>

          {/* Taux horaire */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Taux horaire (€) *
            </label>
            <div className="relative max-w-xs">
              <Euro className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                className="pl-10 pr-4 py-2 w-full border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
                placeholder="50"
              />
            </div>
          </div>

          {/* Hôtels accessibles */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Hôtels accessibles *
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
                  onClick={loadHotels}
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
              <div className="max-h-32 overflow-y-auto border border-warm-300 rounded-lg p-3 space-y-2">
                {hotels.map((hotel) => (
                  <div key={hotel.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Hotel className="w-4 h-4 text-warm-400 mr-2" />
                      <span className="text-sm text-warm-700">{hotel.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleHotel(hotel.id)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        formData.hotels.includes(hotel.id) 
                          ? 'bg-creho-500' 
                          : 'bg-warm-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                        formData.hotels.includes(hotel.id) 
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
                {formData.hotels.length} hôtel(s) sélectionné(s) sur {hotels.length} disponible(s)
              </p>
            )}
          </div>

          {/* Modules accessibles */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Modules accessibles *
            </label>
            <div className="max-h-40 overflow-y-auto border border-warm-300 rounded-lg p-3 space-y-2">
              {appModules.map((module) => (
                <div key={module.key} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Settings className="w-4 h-4 text-warm-400 mr-2" />
                    <span className="text-sm text-warm-700">{module.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleModule(module.key)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      formData.modules.includes(module.key) 
                        ? 'bg-creho-500' 
                        : 'bg-warm-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      formData.modules.includes(module.key) 
                        ? 'translate-x-7' 
                        : 'translate-x-1'
                    }`}></div>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-warm-500 mt-1">
              {formData.modules.length} module(s) sélectionné(s) sur {appModules.length} disponible(s)
            </p>
          </div>

          {/* Type de contrat et disponibilité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Type de contrat
              </label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value as 'internal' | 'external' })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                <option value="external">Externe</option>
                <option value="internal">Interne</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Disponibilité
              </label>
              <select
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value as 'available' | 'busy' | 'unavailable' })}
                className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              >
                <option value="available">Disponible</option>
                <option value="busy">Occupé</option>
                <option value="unavailable">Indisponible</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 resize-none"
              placeholder="Notes additionnelles sur le technicien..."
            />
          </div>

          {/* Statut actif */}
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-warm-700">
              Technicien actif
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
              {isEdit ? 'Enregistrer les modifications' : 'Créer le technicien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}