import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { modules } from '@/lib/data';
import { useUserForm } from './UserFormContext';

// Component for radio button with stable IDs
const RadioButton = React.memo(({ 
  id, 
  name, 
  value, 
  checked, 
  onChange 
}: { 
  id: string, 
  name: string, 
  value: string, 
  checked: boolean, 
  onChange: () => void 
}) => (
  <div className="flex items-center space-x-2">
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <Label htmlFor={id} className="text-sm">
      {value === 'standard' ? 'Utilisateur Standard' : 'Administrateur'}
    </Label>
  </div>
));

RadioButton.displayName = 'RadioButton';

interface UserFormContentProps {
  hotels: Array<{ id: string; name: string }>;
}

const UserFormContent: React.FC<UserFormContentProps> = React.memo(({ hotels }) => {
  const { 
    formData, 
    selectedHotels, 
    selectedModules, 
    handleFormChange, 
    toggleHotelSelection, 
    toggleModuleSelection,
    isNew,
    saving
  } = useUserForm();

  // Refs for inputs to maintain focus
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

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
      </div>
      
      {isNew && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password-input" className="after:content-['*'] after:ml-0.5 after:text-red-500">
              Mot de passe
            </Label>
            <Input
              id="password-input"
              ref={passwordInputRef}
              type="password"
              value={formData.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              disabled={saving}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password-input" className="after:content-['*'] after:ml-0.5 after:text-red-500">
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirm-password-input"
              ref={confirmPasswordInputRef}
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Rôle</Label>
        <div className="flex space-x-4">
          <RadioButton
            id="role-standard"
            name="role"
            value="standard"
            checked={formData.role === 'standard'}
            onChange={() => handleFormChange('role', 'standard')}
          />
          <RadioButton
            id="role-admin"
            name="role"
            value="admin"
            checked={formData.role === 'admin'}
            onChange={() => handleFormChange('role', 'admin')}
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
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="user-active" 
          checked={formData.active}
          onCheckedChange={(checked) => handleFormChange('active', checked)}
          disabled={saving}
        />
        <Label htmlFor="user-active" className="text-sm font-medium">
          Utilisateur actif
        </Label>
      </div>
    </div>
  );
});

UserFormContent.displayName = 'UserFormContent';

export default UserFormContent;