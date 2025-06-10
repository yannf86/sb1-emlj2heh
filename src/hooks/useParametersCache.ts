import { useQuery } from '@tanstack/react-query';
import { 
  getIncidentCategoryParameters, 
  getIncidentCategoryLabel,
} from '../lib/db/parameters-incident-categories';

import { 
  getImpactParameters, 
  getImpactLabel,
} from '../lib/db/parameters-impact';

import {
  getStatusParameters,
  getStatusLabel,
} from '../lib/db/parameters-status';

import {
  getClientSatisfactionParameters,
  getClientSatisfactionLabel,
} from '../lib/db/parameters-client-satisfaction';

import {
  getInterventionTypeParameters,
  getInterventionTypeLabel,
} from '../lib/db/parameters-intervention-type';

import {
  getLocationParameters,
  getLocationLabel,
} from '../lib/db/parameters-locations';

import {
  getLostItemTypeParameters,
  getLostItemTypeLabel,
} from '../lib/db/parameters-lost-item-type';

import {
  getResolutionTypeParameters,
  getResolutionTypeLabel,
} from '../lib/db/parameters-resolution-type';

// Hook for incident categories
export function useIncidentCategoryParameters() {
  return useQuery({
    queryKey: ['parameters', 'incident_category'],
    queryFn: getIncidentCategoryParameters,
    staleTime: 60 * 60 * 1000, // 1 hour - Parameters rarely change
  });
}

export function useIncidentCategoryLabel(id: string) {
  return useQuery({
    queryKey: ['parameters', 'incident_category', id, 'label'],
    queryFn: () => getIncidentCategoryLabel(id),
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - Labels rarely change
  });
}

// Hook for impact parameters
export function useImpactParameters() {
  return useQuery({
    queryKey: ['parameters', 'impact'],
    queryFn: getImpactParameters,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useImpactLabel(id: string) {
  return useQuery({
    queryKey: ['parameters', 'impact', id, 'label'],
    queryFn: () => getImpactLabel(id),
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Hook for status parameters
export function useStatusParameters() {
  return useQuery({
    queryKey: ['parameters', 'status'],
    queryFn: getStatusParameters,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useStatusLabel(id: string) {
  return useQuery({
    queryKey: ['parameters', 'status', id, 'label'],
    queryFn: () => getStatusLabel(id),
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Hook for client satisfaction parameters
export function useClientSatisfactionParameters() {
  return useQuery({
    queryKey: ['parameters', 'client_satisfaction'],
    queryFn: getClientSatisfactionParameters,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useClientSatisfactionLabel(id: string) {
  return useQuery({
    queryKey: ['parameters', 'client_satisfaction', id, 'label'],
    queryFn: () => getClientSatisfactionLabel(id),
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Hook for intervention type parameters
export function useInterventionTypeParameters() {
  return useQuery({
    queryKey: ['parameters', 'intervention_type'],
    queryFn: getInterventionTypeParameters,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useInterventionTypeLabel(id: string) {
  return useQuery({
    queryKey: ['parameters', 'intervention_type', id, 'label'],
    queryFn: () => getInterventionTypeLabel(id),
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Hook for location parameters
export function useLocationParameters() {
  return useQuery({
    queryKey: ['parameters', 'location'],
    queryFn: getLocationParameters,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useLocationLabel(id: string) {
  return useQuery({
    queryKey: ['parameters', 'location', id, 'label'],
    queryFn: () => getLocationLabel(id),
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Hook for lost item type parameters
export function useLostItemTypeParameters() {
  return useQuery({
    queryKey: ['parameters', 'lost_item_type'],
    queryFn: getLostItemTypeParameters,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useLostItemTypeLabel(id: string) {
  return useQuery({
    queryKey: ['parameters', 'lost_item_type', id, 'label'],
    queryFn: () => getLostItemTypeLabel(id),
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Hook for resolution type parameters
export function useResolutionTypeParameters() {
  return useQuery({
    queryKey: ['parameters', 'resolution_type'],
    queryFn: getResolutionTypeParameters,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useResolutionTypeLabel(id: string) {
  return useQuery({
    queryKey: ['parameters', 'resolution_type', id, 'label'],
    queryFn: () => getResolutionTypeLabel(id),
    enabled: !!id,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// Helper hook to get all parameters - useful for dropdowns and filters
export function useAllParameters() {
  const incidentCategories = useIncidentCategoryParameters();
  const impacts = useImpactParameters();
  const statuses = useStatusParameters();
  const clientSatisfactions = useClientSatisfactionParameters();
  const interventionTypes = useInterventionTypeParameters();
  const locations = useLocationParameters();
  const lostItemTypes = useLostItemTypeParameters();
  const resolutionTypes = useResolutionTypeParameters();
  
  return {
    incidentCategories,
    impacts,
    statuses,
    clientSatisfactions,
    interventionTypes,
    locations,
    lostItemTypes,
    resolutionTypes,
    isLoading: 
      incidentCategories.isLoading || 
      impacts.isLoading || 
      statuses.isLoading || 
      clientSatisfactions.isLoading || 
      interventionTypes.isLoading || 
      locations.isLoading || 
      lostItemTypes.isLoading || 
      resolutionTypes.isLoading,
    isError:
      incidentCategories.isError || 
      impacts.isError || 
      statuses.isError || 
      clientSatisfactions.isError || 
      interventionTypes.isError || 
      locations.isError || 
      lostItemTypes.isError || 
      resolutionTypes.isError
  };
}