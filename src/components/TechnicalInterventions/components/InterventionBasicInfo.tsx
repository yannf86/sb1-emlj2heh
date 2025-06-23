import React from 'react';
import { Calendar, Clock, Hotel as HotelIcon, MapPin } from 'lucide-react';
import { InterventionFormData } from '../../../hooks/useInterventionForm';
import { Hotel } from '../../../types/parameters';
import { Parameter } from '../../../types/parameters';

interface InterventionBasicInfoProps {
  formData: InterventionFormData;
  updateFormData: (updates: Partial<InterventionFormData>) => void;
  hotels: Hotel[];
  locations: Parameter[];
  interventionTypes: Parameter[];
  filteredLocations: Parameter[];
}

export default function InterventionBasicInfo({
  formData,
  updateFormData,
  hotels,
  interventionTypes,
  filteredLocations
}: InterventionBasicInfoProps) {
  return (
    <div className="space-y-4">
      {/* Date et heure */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-2">
          Date et heure de l'intervention *
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Calendar className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="date"
              required
              value={formData.date.toISOString().split('T')[0]}
              onChange={(e) => {
                // Validation pour éviter les dates invalides
                try {
                  const dateValue = e.target.value;
                  if (!dateValue || dateValue === '0') {
                    // Si la valeur est vide ou "0", utiliser la date actuelle
                    updateFormData({ date: new Date() });
                  } else {
                    const newDate = new Date(dateValue);
                    // Vérifier si la date est valide
                    if (isNaN(newDate.getTime())) {
                      console.warn('Date invalide détectée:', dateValue);
                      // Utiliser la date actuelle en cas d'erreur
                      updateFormData({ date: new Date() });
                    } else {
                      updateFormData({ date: newDate });
                    }
                  }
                } catch (error) {
                  console.error('Erreur lors de la conversion de la date:', error);
                  // Utiliser la date actuelle en cas d'erreur
                  updateFormData({ date: new Date() });
                }
              }}
              className="pl-10 pr-4 py-2 w-full border-2 border-creho-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 focus:border-creho-500"
            />
          </div>
          <div className="relative">
            <Clock className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="time"
              required
              value={formData.time}
              onChange={(e) => updateFormData({ time: e.target.value })}
              className="pl-10 pr-4 py-2 w-full border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
            />
          </div>
        </div>
      </div>

      {/* Hôtel et Lieu */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Hôtel *
          </label>
          <div className="relative">
            <HotelIcon className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select
              required
              value={formData.hotelId}
              onChange={(e) => updateFormData({ hotelId: e.target.value })}
              className="pl-10 pr-4 py-2 w-full border-2 border-creho-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 focus:border-creho-500"
            >
              <option value="">Sélectionnez un hôtel</option>
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Lieu *
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-warm-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select
              required
              value={formData.location}
              onChange={(e) => updateFormData({ location: e.target.value })}
              disabled={!formData.hotelId}
              className="pl-10 pr-4 py-2 w-full border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 disabled:bg-warm-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {!formData.hotelId ? 'Sélectionnez d\'abord un hôtel' : 'Sélectionnez un lieu'}
              </option>
              {filteredLocations.map(location => (
                <option key={location.id} value={location.id}>{location.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Type d'intervention */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Type d'intervention *
        </label>
        <select
          required
          value={formData.interventionTypeId}
          onChange={(e) => updateFormData({ interventionTypeId: e.target.value })}
          className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500"
        >
          <option value="">Sélectionnez un type d'intervention</option>
          {interventionTypes.map(type => (
            <option key={type.id} value={type.id}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Description *
        </label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-creho-500 resize-none"
          placeholder="Décrivez l'intervention en détail..."
        />
      </div>
    </div>
  );
}