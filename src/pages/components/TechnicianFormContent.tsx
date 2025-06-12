import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { modules } from '@/lib/data';
import { useTechnicianForm } from './TechnicianFormContext';
import { getCurrentUser } from '@/lib/auth';

interface TechnicianFormContentProps {
  hotels: Array<{ id: string; name: string }>;
}

const TechnicianFormContent: React.FC<TechnicianFormContentProps> = React.memo(({ hotels }) => {
  const { 
    formData, 
    selectedHotels,
    selectedModules,
    handleFormChange, 
    toggleHotelSelection,
    toggleModuleSelection,
    isNew,
    saving
  } = useTechnicianForm();
  
  const currentUser = getCurrentUser();

  // Refs for inputs to maintain focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Focus name input when component mounts
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name-input" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Nom complet
          </Label>
          <Input
            id="name-input"
            ref={nameInputRef}
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            placeholder="John Doe"
            disabled={saving}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company-input">
            Entreprise
          </Label>
          <Input
            id="company-input"
            value={formData.company}
            onChange={(e) => handleFormChange('company', e.target.value)}
            placeholder="Entreprise de maintenance"
            disabled={saving}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email-input" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Adresse e-mail
          </Label>
          <Input
            id="email-input"
            ref={emailInputRef}
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange('email', e.target.value)}
            placeholder="john.doe@example.com"
            disabled={saving}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone-input" className="after:content-['*'] after:ml-0.5 after:text-red-500">
            Téléphone
          </Label>
          <Input
            id="phone-input"
            ref={phoneInputRef}
            type="tel"
            value={formData.phone}
            onChange={(e) => handleFormChange('phone', e.target.value)}
            placeholder="+33 6 12 34 56 78"
            disabled={saving}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="specialties-input">
            Spécialités
          </Label>
          <Input
            id="specialties-input"
            value={formData.specialties}
            onChange={(e) => handleFormChange('specialties', e.target.value)}
            placeholder="Plomberie, électricité, etc."
            disabled={saving}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hourly-rate-input">
            Taux horaire (€)
          </Label>
          <Input
            id="hourly-rate-input"
            type="number"
            value={formData.hourlyRate}
            onChange={(e) => handleFormChange('hourlyRate', e.target.value)}
            placeholder="50"
            disabled={saving}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Hôtels accessibles</Label>
        <div className="p-4 border rounded-md max-h-36 overflow-y-auto">
          {hotels.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun hôtel disponible</p>
          ) : (
            hotels.map(hotel => (
              <div key={hotel.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`hotel-${hotel.id}`}
                  checked={selectedHotels.includes(hotel.id)}
                  onChange={() => toggleHotelSelection(hotel.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={saving}
                />
                <label htmlFor={`hotel-${hotel.id}`} className="text-sm font-medium">
                  {hotel.name}
                </label>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Modules accessibles</Label>
        <div className="p-4 border rounded-md max-h-36 overflow-y-auto">
          {modules.map(module => (
            <div key={module.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`module-${module.id}`}
                checked={selectedModules.includes(module.id)}
                onChange={() => toggleModuleSelection(module.id)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={saving}
              />
              <label htmlFor={`module-${module.id}`} className="text-sm font-medium">
                {module.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

TechnicianFormContent.displayName = 'TechnicianFormContent';

export default TechnicianFormContent;