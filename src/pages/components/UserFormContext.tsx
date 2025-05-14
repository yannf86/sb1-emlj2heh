import React, { createContext, useContext, useState, useCallback } from 'react';
import { modules } from '@/lib/data';

// Types
interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'standard' | 'admin';
  active: boolean;
}

interface UserFormContextType {
  formData: UserFormData;
  selectedHotels: string[];
  selectedModules: string[];
  handleFormChange: (field: string, value: any) => void;
  toggleHotelSelection: (hotelId: string) => void;
  toggleModuleSelection: (moduleId: string) => void;
  isNew: boolean;
  saving: boolean;
}

// Create context
const UserFormContext = createContext<UserFormContextType | undefined>(undefined);

// Provider component
export const UserFormProvider: React.FC<{
  children: React.ReactNode;
  initialFormData: UserFormData;
  initialHotels: string[];
  initialModules: string[];
  isNew: boolean;
  saving: boolean;
  onFormChange: (field: string, value: any) => void;
  onHotelsChange: (hotels: string[]) => void;
  onModulesChange: (modules: string[]) => void;
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
    <UserFormContext.Provider value={value}>
      {children}
    </UserFormContext.Provider>
  );
};

// Hook to use the context
export const useUserForm = () => {
  const context = useContext(UserFormContext);
  if (context === undefined) {
    throw new Error('useUserForm must be used within a UserFormProvider');
  }
  return context;
};