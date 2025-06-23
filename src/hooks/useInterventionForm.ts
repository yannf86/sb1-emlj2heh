import { useState, useEffect } from 'react';
import { TechnicalIntervention, TechnicalQuote } from '../types/maintenance';

export interface InterventionFormData {
  date: Date;
  time: string;
  hotelId: string;
  location: string;
  interventionTypeId: string;
  description: string;
  statusId: string;
  assignedTo: string;
  assignedToType: 'user' | 'technician';
  startDate?: Date;
  endDate?: Date;
  estimatedCost: number;
  finalCost: number;
  comments: string;
  hasQuote: boolean;
  quotes: TechnicalQuote[];
}

export function useInterventionForm(intervention?: TechnicalIntervention | null) {
  const [formData, setFormData] = useState<InterventionFormData>({
    date: new Date(),
    time: '',
    hotelId: '',
    location: '',
    interventionTypeId: '',
    description: '',
    statusId: '',
    assignedTo: '',
    assignedToType: 'user',
    startDate: undefined,
    endDate: undefined,
    estimatedCost: 0,
    finalCost: 0,
    comments: '',
    hasQuote: false,
    quotes: [],
  });

  useEffect(() => {
    if (intervention) {
      setFormData({
        date: intervention.date,
        time: intervention.time,
        hotelId: intervention.hotelId || '',
        location: intervention.location || '',
        interventionTypeId: intervention.interventionTypeId,
        description: intervention.description,
        statusId: intervention.statusId,
        assignedTo: intervention.assignedTo || '',
        assignedToType: intervention.assignedToType,
        startDate: intervention.startDate,
        endDate: intervention.endDate,
        estimatedCost: intervention.estimatedCost || 0,
        finalCost: intervention.finalCost || 0,
        comments: intervention.comments || '',
        hasQuote: intervention.hasQuote || false,
        quotes: intervention.quotes || [],
      });
    } else {
      const now = new Date();
      setFormData({
        date: now,
        time: now.toTimeString().slice(0, 5),
        hotelId: '',
        location: '',
        interventionTypeId: '',
        description: '',
        statusId: 'CZa3iy84r8pVqjVOQHNL', // Statut "en cours" par défaut
        assignedTo: '',
        assignedToType: 'user',
        startDate: undefined,
        endDate: undefined,
        estimatedCost: 0,
        finalCost: 0,
        comments: '',
        hasQuote: false,
        quotes: [],
      });
    }
  }, [intervention]);

  const updateFormData = (updates: Partial<InterventionFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return {
    formData,
    updateFormData,
    setFormData
  };
}