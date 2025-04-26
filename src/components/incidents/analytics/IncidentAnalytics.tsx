import React from 'react';
import IncidentStats from './IncidentStats';
import IncidentCharts from './IncidentCharts';
import { Incident } from '../types/incident.types';

interface IncidentAnalyticsProps {
  incidents: Incident[];
}

const IncidentAnalytics: React.FC<IncidentAnalyticsProps> = ({ incidents }) => {
  return (
    <div className="space-y-6">
      <IncidentStats incidents={incidents} />
      <IncidentCharts incidents={incidents} />
    </div>
  );
};

export default IncidentAnalytics;