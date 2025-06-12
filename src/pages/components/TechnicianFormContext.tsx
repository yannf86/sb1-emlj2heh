import React, { createContext, useContext, useState, useCallback } from 'react';

// Types
interface TechnicianFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  specialties: string;
  hourlyRate: string;
}

interface TechnicianFormContextType {
  formData: TechnicianFormData;
  selectedHotels: string[];
  selectedModules: string[]; // Modules sélectionnés
  handleFormChange: (field: string, value: any) => void;
  toggleHotelSelection: (hotelId: string) => void;
  toggleModuleSelection: (moduleId: string) => void; // Fonction pour sélectionner/désélectionner des modules
  isNew: boolean;
  saving: boolean;
}

// Create context
const TechnicianFormContext = createContext<TechnicianFormContextType | undefined>(undefined);

// Provider component
export const TechnicianFormProvider: React.FC<{
  children: React.ReactNode;
  initialFormData: TechnicianFormData;
  initialHotels: string[];
  initialModules: string[]; // Modules initiaux
  isNew: boolean;
  saving: boolean;
  onFormChange: (field: string, value: any) => void;
  onHotelsChange: (hotels: string[]) => void;
  onModulesChange: (modules: string[]) => void; // Fonction pour mettre à jour les modules
}> = ({
  children,
  initialFormData,
  initialHotels,
  initialModules,
  isNew,
  saving,
  onFormChange,
  onHotelsChange,
  onModulesChange
}) => {
  // Local state that mirrors the parent state
  const [formData, setFormData] = useState(initialFormData);
  const [selectedHotels, setSelectedHotels] = useState(initialHotels);
  const [selectedModules, setSelectedModules] = useState(initialModules);

  // Update local state when props change
  React.useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  React.useEffect(() => {
    setSelectedHotels(initialHotels);
  }, [initialHotels]);

  React.useEffect(() => {
    setSelectedModules(initialModules);
  }, [initialModules]);

  // Handlers
  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onFormChange(field, value);
  }, [onFormChange]);

  const toggleHotelSelection = useCallback((hotelId: string) => {
    setSelectedHotels(prev => {
      const newSelection = prev.includes(hotelId)
        ? prev.filter(id => id !== hotelId)
        : [...prev, hotelId];
      
      onHotelsChange(newSelection);
      return newSelection;
    });
  }, [onHotelsChange]);

  const toggleModuleSelection = useCallback((moduleId: string) => {
    setSelectedModules(prev => {
      const newSelection = prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId];
      
      onModulesChange(newSelection);
      return newSelection;
    });
  }, [onModulesChange]);

  const value = {
    formData,
    selectedHotels,
    selectedModules,
    handleFormChange,
    toggleHotelSelection,
    toggleModuleSelection,
    isNew,
    saving
  };

  return (
    <TechnicianFormContext.Provider value={value}>
      {children}
    </TechnicianFormContext.Provider>
  );
};

// Hook to use the context
export function useTechnicianForm() {
  const context = useContext(TechnicianFormContext);
  if (context === undefined) {
    throw new Error('useTechnicianForm must be used within a TechnicianFormProvider');
  }
  return context;
}