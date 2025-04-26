import { useState } from 'react';
import { IncidentFormData } from '../types/incident.types';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/auth';

export const useIncidentForm = (onSuccess?: () => void) => {
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  
  const [formData, setFormData] = useState<IncidentFormData>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hotelId: '',
    locationId: '',
    roomType: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    arrivalDate: '',
    departureDate: '',
    reservationAmount: '',
    origin: '',
    categoryId: '',
    impactId: '',
    description: '',
    receivedById: currentUser?.id || '' // Pré-remplir avec l'ID de l'utilisateur connecté
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Here you would normally send the data to your backend
      toast({
        title: "Incident créé",
        description: "L'incident a été créé avec succès",
      });

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hotelId: '',
        locationId: '',
        roomType: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        arrivalDate: '',
        departureDate: '',
        reservationAmount: '',
        origin: '',
        categoryId: '',
        impactId: '',
        description: '',
        receivedById: currentUser?.id || '' // Maintenir l'ID de l'utilisateur connecté
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'incident",
        variant: "destructive",
      });
    }
  };

  return {
    formData,
    handleFormChange,
    handleSelectChange,
    handleSubmit,
    resetForm: () => setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hotelId: '',
      locationId: '',
      roomType: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      arrivalDate: '',
      departureDate: '',
      reservationAmount: '',
      origin: '',
      categoryId: '',
      impactId: '',
      description: '',
      receivedById: currentUser?.id || '' // Maintenir l'ID de l'utilisateur connecté
    })
  };
};