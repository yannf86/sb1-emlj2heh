import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Trash2 } from 'lucide-react';
import { Procedure, procedureServices, procedureTypes } from '../../types/procedure';
import { procedureService } from '../../services/firebase/procedureService';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { hotelsService } from '../../services/firebase/hotelsService';
import { usersService } from '../../services/firebase/usersService';

interface ProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedure?: Procedure | null;
  onSuccess: () => void;
}

export default function ProcedureModal({ isOpen, onClose, procedure, onSuccess }: ProcedureModalProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const isInitializingRef = useRef(false);
  
  // États du formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [service, setService] = useState('');
  const [type, setType] = useState('standard');
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>('');
  const [currentPdfName, setCurrentPdfName] = useState<string>('');

  // Récupération des données
  const { data: hotels = [] } = useQuery({
    queryKey: ['hotels'],
    queryFn: hotelsService.getHotels
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.getUsers
  });

  // Filtrer les hôtels selon les permissions utilisateur
  const accessibleHotels = hotels.filter(hotel => {
    if (currentUser?.role === 'system_admin') {
      return true; // Les admin système voient tous les hôtels
    }
    // Les admin hôtel ne voient que leurs hôtels assignés
    return currentUser?.hotels?.includes(hotel.id);
  });

  // Filtrer les utilisateurs selon les hôtels sélectionnés
  const filteredUsers = users.filter(user => {
    if (selectedHotels.length === 0) {
      return false; // Aucun utilisateur si aucun hôtel sélectionné
    }
    // Afficher les utilisateurs qui ont accès à au moins un des hôtels sélectionnés
    return selectedHotels.some(hotelId => 
      user.hotels?.includes(hotelId) || user.role === 'system_admin'
    );
  });

  // Initialiser le formulaire avec les données de la procédure existante
  useEffect(() => {
    if (procedure) {
      isInitializingRef.current = true;
      setTitle(procedure.title);
      setDescription(procedure.description);
      setService(procedure.service);
      setType(procedure.type);
      setSelectedHotels(procedure.hotels);
      setSelectedUsers(procedure.assignedUsers);
      setContent(procedure.content || '');
      setCurrentPdfUrl(procedure.pdfUrl || '');
      setCurrentPdfName(procedure.pdfName || '');
      // Réinitialiser le flag après un court délai
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    } else if (isOpen) {
      // Ne réinitialiser que si la modal est ouverte pour une nouvelle procédure
      resetForm();
    }
  }, [procedure, isOpen]);

  // Fonction pour nettoyer les utilisateurs sélectionnés quand les hôtels changent
  const handleHotelChange = (hotelIds: string[]) => {
    setSelectedHotels(hotelIds);
    
    // Si aucun hôtel sélectionné, vider les utilisateurs
    if (hotelIds.length === 0) {
      setSelectedUsers([]);
      return;
    }
    
    // Garder seulement les utilisateurs qui ont encore accès aux hôtels sélectionnés
    setSelectedUsers(prev => 
      prev.filter(userId => {
        const user = users.find(u => u.id === userId);
        return user && (hotelIds.some(hotelId => 
          user.hotels?.includes(hotelId) || user.role === 'system_admin'
        ));
      })
    );
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setService('');
    setType('standard');
    setSelectedHotels([]);
    setSelectedUsers([]);
    setContent('');
    setPdfFile(null);
    setCurrentPdfUrl('');
    setCurrentPdfName('');
  };

  const handleHotelToggle = (hotelId: string) => {
    const newHotels = selectedHotels.includes(hotelId) 
      ? selectedHotels.filter(id => id !== hotelId)
      : [...selectedHotels, hotelId];
    
    handleHotelChange(newHotels);
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else if (file) {
      alert('Veuillez sélectionner un fichier PDF valide.');
      event.target.value = ''; // Réinitialiser l'input file
    }
  };
  
  const handleRemovePdf = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer le PDF actuel ?')) {
      setCurrentPdfUrl('');
      setCurrentPdfName('');
      setPdfFile(null);
      // Réinitialiser l'input file s'il existe
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      let pdfUrl = currentPdfUrl;
      let pdfName = currentPdfName;

      // Upload du PDF si un nouveau fichier a été sélectionné
      if (pdfFile) {
        setUploadingPDF(true);
        const tempId = procedure?.id || Date.now().toString();
        const uploadResult = await procedureService.uploadPDF(pdfFile, tempId);
        pdfUrl = uploadResult.url;
        pdfName = uploadResult.name;
        setUploadingPDF(false);
      }

      // Construire les données de la procédure en fonction du mode (création ou édition)
      const procedureData: any = {
        title,
        description,
        service,
        type: type as Procedure['type'],
        hotels: selectedHotels,
        assignedUsers: selectedUsers,
        content,
        pdfUrl,
        pdfName,
        isActive: true
      };
      
      // Ajouter les informations du créateur uniquement lors de la création
      if (!procedure) {
        procedureData.createdBy = currentUser.uid;
        procedureData.createdByName = currentUser.displayName || currentUser.email || 'Utilisateur inconnu';
      }

      if (procedure) {
        await procedureService.updateProcedure(
          procedure.id, 
          procedureData, 
          currentUser.uid, 
          currentUser.displayName || currentUser.email || 'Utilisateur inconnu'
        );
      } else {
        await procedureService.createProcedure(procedureData);
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la procédure');
    } finally {
      setLoading(false);
      setUploadingPDF(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {procedure ? 'Modifier la procédure' : 'Nouvelle Procédure'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Titre de la procédure"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description de la procédure"
            />
          </div>

          {/* Service et Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service *
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un service</option>
                {procedureServices.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {procedureTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Hôtels concernés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hôtels concernés
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
              {accessibleHotels.map(hotel => (
                <label key={hotel.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedHotels.includes(hotel.id)}
                    onChange={() => handleHotelToggle(hotel.id)}
                    className="mr-2"
                  />
                  <span className="text-sm">{hotel.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Utilisateurs assignés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Utilisateurs assignés
            </label>
            {selectedHotels.length === 0 ? (
              <div className="text-sm text-gray-500 italic p-3 border border-gray-200 rounded-md">
                Sélectionnez d'abord un ou plusieurs hôtels pour voir les utilisateurs disponibles.
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
                {filteredUsers.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">
                    Aucun utilisateur disponible pour les hôtels sélectionnés.
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <label key={user.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserToggle(user.id)}
                        className="mr-2"
                      />
                      <span className="text-sm">{user.name || user.email}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Contenu additionnel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenu additionnel
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes ou explications complémentaires..."
            />
          </div>

          {/* Document PDF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document PDF
            </label>
            
            {currentPdfUrl && (
              <div className="mb-3 p-3 bg-gray-50 rounded-md flex items-center">
                <FileText className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-sm text-gray-700 flex-1">{currentPdfName}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={currentPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Voir
                  </a>
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    className="text-red-600 hover:text-red-800"
                    title="Supprimer le PDF"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {pdfFile ? pdfFile.name : 'Cliquez pour uploader ou glissez-déposez'}
                </p>
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || uploadingPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sauvegarde...' : uploadingPDF ? 'Upload...' : procedure ? 'Modifier' : 'Créer la procédure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
