import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';
import { Incident } from '../types/incident.types';

interface IncidentStatsProps {
  incidents: Incident[];
}

const IncidentStats: React.FC<IncidentStatsProps> = ({ incidents }) => {
  // Calculate statistics
  const openIncidents = incidents.filter(inc => ['stat1', 'stat2'].includes(inc.statusId)).length;
  const resolvedIncidents = incidents.filter(inc => ['stat3', 'stat4'].includes(inc.statusId)).length;
  const criticalIncidents = incidents.filter(inc => inc.impactId === 'imp4').length;
  const avgResolutionTime = incidents
    .filter(inc => inc.statusId === 'stat3' || inc.statusId === 'stat4')
    .reduce((acc, inc) => {
      const createdDate = new Date(inc.createdAt);
      const updatedDate = new Date(inc.updatedAt);
      return acc + (updatedDate.getTime() - createdDate.getTime());
    }, 0) / (resolvedIncidents || 1) / (1000 * 60 * 60); // Convert to hours

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Incidents Ouverts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openIncidents}</div>
          <div className="flex items-center pt-1 text-xs text-muted-foreground">
            <span className="text-green-500 inline-flex items-center">
              {resolvedIncidents} résolus
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Incidents Critiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{criticalIncidents}</div>
          <div className="flex items-center pt-1 text-xs text-muted-foreground">
            <span className={criticalIncidents > 0 ? "text-red-500" : "text-green-500"}>
              {criticalIncidents > 0 ? "Nécessite attention" : "Aucun incident critique"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Taux de Résolution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {((resolvedIncidents / (incidents.length || 1)) * 100).toFixed(1)}%
          </div>
          <div className="flex items-center pt-1 text-xs text-muted-foreground">
            {resolvedIncidents} incidents résolus sur {incidents.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Temps Moyen de Résolution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgResolutionTime.toFixed(1)}h</div>
          <div className="flex items-center pt-1 text-xs text-muted-foreground">
            Moyenne sur {resolvedIncidents} incidents résolus
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentStats;