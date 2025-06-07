import React, { useState, useEffect } from 'react';
import IncidentStats from './IncidentStats';
import IncidentCharts from './IncidentCharts';
import IncidentDetailedAnalytics from './IncidentDetailedAnalytics';
import IncidentTrendsAnalytics from './IncidentTrendsAnalytics';
import IncidentStaffPerformance from './IncidentStaffPerformance';
import IncidentLocationAnalytics from './IncidentLocationAnalytics';
import IncidentCompensationAnalytics from './IncidentCompensationAnalytics';
import { Incident } from '../types/incident.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { getIncidentCategoryParameters } from '@/lib/db/parameters-incident-categories';
import { getHotels } from '@/lib/db/hotels';
import { getImpactParameters } from '@/lib/db/parameters-impact';
import { getClientSatisfactionParameters } from '@/lib/db/parameters-client-satisfaction';
import { getStatusParameters } from '@/lib/db/parameters-status';

interface IncidentAnalyticsProps {
  incidents: Incident[];
  hotelId?: string;
  startDate?: Date;
  endDate?: Date;
  onExportPDF: () => void;
  onExportChart: (chartId: string) => void;
}

const IncidentAnalytics: React.FC<IncidentAnalyticsProps> = ({ 
  incidents, 
  hotelId, 
  startDate, 
  endDate,
  onExportPDF,
  onExportChart 
}) => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Export button for complete report */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={onExportPDF}
          className="flex items-center"
        >
          <FileText className="h-4 w-4 mr-2" />
          Exporter le rapport complet
        </Button>
      </div>
      
      {/* Top stats overview cards */}
      <IncidentStats incidents={incidents} />
      
      {/* Main chart overview */}
      <IncidentCharts incidents={incidents} onExportChart={onExportChart} />
      
      {/* Detailed analysis tabs */}
      <Tabs defaultValue="categories" className="mt-8">
        <TabsList className="w-full grid grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="locations">Lieux & Chambres</TabsTrigger>
          <TabsTrigger value="staff">Performance Staff</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="compensation">Gestes Commerciaux</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="mt-4">
          <IncidentDetailedAnalytics incidents={incidents} onExportChart={onExportChart} />
        </TabsContent>
        
        <TabsContent value="locations" className="mt-4">
          <IncidentLocationAnalytics incidents={incidents} onExportChart={onExportChart} />
        </TabsContent>
        
        <TabsContent value="staff" className="mt-4">
          <IncidentStaffPerformance incidents={incidents} onExportChart={onExportChart} />
        </TabsContent>
        
        <TabsContent value="trends" className="mt-4">
          <IncidentTrendsAnalytics incidents={incidents} onExportChart={onExportChart} />
        </TabsContent>
        
        <TabsContent value="compensation" className="mt-4">
          <IncidentCompensationAnalytics incidents={incidents} onExportChart={onExportChart} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncidentAnalytics;