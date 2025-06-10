import { useState } from 'react';
import { MaintenanceFormData } from '../types/maintenance.types';
import { useToast } from '@/hooks/use-toast';

export const useMaintenanceForm = (onSuccess?: () => void) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<MaintenanceFormData>({
    description: '',
    hotelId: '',
    locationId: '',
    interventionTypeId: '',
    photoBefore: null,
    photoBeforePreview: '',
    hasQuote: false,
    quoteFile: null,
    quoteAmount: '',
    quoteAccepted: false
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'photoBefore' | 'quoteFile') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileType === 'photoBefore') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photoBefore: file,
          photoBeforePreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    } else if (fileType === 'quoteFile') {
      setFormData(prev => ({
        ...prev,
        quoteFile: file
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Here you would normally send the data to your backend
      toast({
        title: "Intervention créée",
        description: "La demande d'intervention a été créée avec succès",
      });

      // Reset form
      setFormData({
        description: '',
        hotelId: '',
        locationId: '',
        interventionTypeId: '',
        photoBefore: null,
        photoBeforePreview: '',
        hasQuote: false,
        quoteFile: null,
        quoteAmount: '',
        quoteAccepted: false
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'intervention",
        variant: "destructive",
      });
    }
  };

  return {
    formData,
    handleFormChange,
    handleSwitchChange,
    handleFileUpload,
    handleSubmit,
    resetForm: () => setFormData({
      description: '',
      hotelId: '',
      locationId: '',
      interventionTypeId: '',
      photoBefore: null,
      photoBeforePreview: '',
      hasQuote: false,
      quoteFile: null,
      quoteAmount: '',
      quoteAccepted: false
    })
  };
};