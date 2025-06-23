import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Trash2, Hotel } from 'lucide-react';
import { ChecklistMission, Hotel as HotelType } from '../../types/parameters';
import { hotelsService } from '../../services/firebase/hotelsService';

interface ChecklistMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mission: Omit<ChecklistMission, 'id'>, pdfFile?: File) => void;
  mission?: ChecklistMission | null;
  isEdit?: boolean;
}

const services = [
  { value: 'housekeeping', label: 'Housekeeping', icon: '🧹' },
  { value: 'reception', label: 'Réception', icon: '🏨' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'direction', label: 'Direction', icon: '👔' },
  { value: 'security', label: 'Sécurité', icon: '🔒' },
  { value: 'bar', label: 'Bar', icon: '🍷' },
];

export default function ChecklistMissionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mission, 
  isEdit = false 
}: ChecklistMissionModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    service: '',
    hotels: [] as string[],
    isPermanent: false,
    imageUrl: '',
    active: true,
    order: 1
  });
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>('');
  const [currentPdfFileName, setCurrentPdfFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHotels();
      if (mission) {
        setFormData({
          title: mission.title,
          description: mission.description || '',
          service: mission.service,
          hotels: mission.hotels || [],
          isPermanent: mission.isPermanent,
          imageUrl: mission.imageUrl || '',
          active: mission.active,
          order: mission.order
        });
        setCurrentPdfUrl(mission.pdfUrl || '');
        setCurrentPdfFileName(mission.pdfFileName || '');
      } else {
        setFormData({
          title: '',
          description: '',
          service: '',
          hotels: [],
          isPermanent: false,
          imageUrl: '',
          active: true,
          order: 1
        });
        setCurrentPdfUrl('');
        setCurrentPdfFileName('');
      }
      setPdfFile(null);
    }
  }, [isOpen, mission]);

  const loadHotels = async () => {
    try {
      const data = await hotelsService.getHotels();
      setHotels(data);
    } catch (error) {
      console.error('Error loading hotels:', error);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Veuillez sélectionner un fichier PDF valide.');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, pdfFile || undefined);
    onClose();
  };

  const getSelectedService = () => {
    return services.find(s => s.value === formData.service);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-warm-900">
            {isEdit ? 'Modifier la mission' : 'Nouvelle mission de check-list'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warm-100 rounded-lg"
          >
            <X className="w-4 h-4 text-warm-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-warm-600">
            {isEdit ? 'Modifiez les détails de cette mission de check-list' : 'Créez une nouvelle mission pour les check-lists quotidiennes'}
          </p>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Titre de la mission
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border-2 border-creho-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 focus:border-creho-500"
              placeholder="ex: Vérifier l'état des chambres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Description (optionnelle)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 resize-none"
              placeholder="Instructions détaillées pour accomplir cette mission"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Service
            </label>
            <select
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              required
            >
              <option value="">Sélectionner un service</option>
              {services.map(service => (
                <option key={service.value} value={service.value}>
                  {service.icon} {service.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Hôtels concernés
            </label>
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
          </div>

          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-warm-700">
              Mission permanente
            </label>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPermanent}
                  onChange={(e) => setFormData({ ...formData, isPermanent: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full ${formData.isPermanent ? 'bg-creho-500' : 'bg-warm-300'} relative transition-colors`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${formData.isPermanent ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </div>
              </label>
            </div>
          </div>
          <p className="text-xs text-warm-500">Les missions permanentes sont dupliquées automatiquement chaque jour.</p>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              URL de l'image (optionnelle)
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-warm-500 mt-1">L'image sera affichée comme référence pour cette mission</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1">
              Chemin du fichier attaché (optionnelle)
            </label>
            
            {currentPdfUrl && !pdfFile && (
              <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm text-green-700">{currentPdfFileName}</span>
                  </div>
                  <a
                    href={currentPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-800"
                  >
                    Voir le fichier
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfChange}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="flex items-center px-3 py-2 bg-warm-100 border border-warm-300 rounded-lg cursor-pointer hover:bg-warm-200 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2 text-warm-600" />
                <span className="text-sm text-warm-700">
                  {pdfFile ? 'Changer le fichier' : 'Choisir un fichier PDF'}
                </span>
              </label>
              
              {pdfFile && (
                <button
                  type="button"
                  onClick={() => setPdfFile(null)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {pdfFile && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-700">{pdfFile.name}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-warm-500 mt-1">Un lien vers un fichier complémentaire pour cette mission</p>
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
              className="flex-1 px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
            >
              {isEdit ? 'Enregistrer les modifications' : 'Créer la mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}