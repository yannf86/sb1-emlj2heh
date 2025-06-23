import { incidentsService } from './incidentsService';
import { technicalInterventionsService } from './technicalInterventionsService';
import { permissionsService } from './permissionsService';
import { hotelsService } from './hotelsService';
import { lostItemsService } from './lostItemsService';
import { Hotel } from '../../types/hotels';

export interface DashboardMetrics {
  openIncidents: number;
  activeMaintenances: number;
  qualityRate: number;
  lostItems: number;
}

export interface ModuleData {
  name: string;
  incidents: number;
  maintenance: number;
  lostItems: number;
  quality: number;
}

export interface HotelComparisonData {
  name: string;
  incidents: number;
  maintenance: number;
  lostItems: number;
}

export interface QualityScoreData {
  hotel: string;
  score: number;
}

class DashboardService {
  /**
   * Récupère les métriques pour le tableau de bord en fonction des hôtels accessibles à l'utilisateur
   */
  async getDashboardMetrics(userEmail: string, selectedHotelId: string = 'all'): Promise<DashboardMetrics> {
    try {
      // Récupérer les hôtels accessibles à l'utilisateur
      const allowedHotels = await permissionsService.getAccessibleHotels(userEmail);
      
      // Si aucun hôtel accessible, retourner des métriques vides
      if (allowedHotels.length === 0) {
        return {
          openIncidents: 0,
          activeMaintenances: 0,
          qualityRate: 0,
          lostItems: 0
        };
      }

      // Déterminer le filtre d'hôtel à passer aux services
      let hotelFilterForServices = selectedHotelId === 'all' ? 'all' : selectedHotelId;

      // Utiliser le statut "en cours" pour les incidents et maintenances
      const inProgressStatusId = 'CZa3iy84r8pVqjVOQHNL';

      // Récupérer les incidents avec le statut "en cours"
      const incidents = await incidentsService.getIncidents(userEmail, hotelFilterForServices, inProgressStatusId);
      const openIncidents = incidents.length;

      // Récupérer les interventions techniques actives (même statut)
      let activeMaintenances = 0;
      try {
        const maintenances = await technicalInterventionsService.getInterventions(userEmail, hotelFilterForServices, inProgressStatusId);
        activeMaintenances = maintenances.length;
      } catch (maintenanceError) {
        console.error('Erreur lors de la récupération des maintenances:', maintenanceError);
        activeMaintenances = 0;
      }

      // Pour l'instant, la valeur de qualité est fictive car nous n'avons pas de module qualité
      const qualityRate = 85; // Pourcentage fictif
      
      // Récupérer le nombre réel d'objets trouvés
      let lostItems = 0;
      try {
        const lostItemsList = await lostItemsService.getLostItems(userEmail, hotelFilterForServices);
        lostItems = lostItemsList.length;
      } catch (lostItemsError) {
        console.error('Erreur lors de la récupération des objets trouvés:', lostItemsError);
        lostItems = 0;
      }

      return {
        openIncidents,
        activeMaintenances,
        qualityRate,
        lostItems
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques du tableau de bord:', error);
      return {
        openIncidents: 0,
        activeMaintenances: 0,
        qualityRate: 0,
        lostItems: 0
      };
    }
  }

  /**
   * Récupère les données pour le graphique d'évolution multi-modules
   */
  async getMultiModuleData(userEmail: string, selectedHotelId: string = 'all'): Promise<ModuleData[]> {
    try {
      // Récupérer les hôtels accessibles à l'utilisateur
      const allowedHotels = await permissionsService.getAccessibleHotels(userEmail);
      
      if (allowedHotels.length === 0) {
        return [];
      }

      // Déterminer le filtre d'hôtel à passer aux services
      let hotelFilterForServices = selectedHotelId === 'all' ? 'all' : selectedHotelId;

      // Récupérer tous les incidents
      const allIncidents = await incidentsService.getIncidents(userEmail, hotelFilterForServices);
      
      // Récupérer toutes les interventions techniques
      const allMaintenances = await technicalInterventionsService.getInterventions(userEmail, hotelFilterForServices);
      
      // Récupérer tous les objets trouvés
      const allLostItems = await lostItemsService.getLostItems(userEmail, hotelFilterForServices);

      // Créer un tableau des 6 derniers mois
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          date: month,
          name: month.toLocaleString('fr-FR', { month: 'short' })
        });
      }

      // Organiser les données par mois
      const moduleData: ModuleData[] = months.map(month => {
        const monthStart = month.date;
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

        // Compter les incidents pour ce mois
        const monthIncidents = allIncidents.filter(incident => {
          const incidentDate = new Date(incident.date);
          return incidentDate >= monthStart && incidentDate <= monthEnd;
        }).length;

        // Compter les interventions techniques pour ce mois
        const monthMaintenances = allMaintenances.filter(maintenance => {
          const maintenanceDate = new Date(maintenance.date);
          return maintenanceDate >= monthStart && maintenanceDate <= monthEnd;
        }).length;

        // Compter les objets trouvés pour ce mois
        const monthLostItems = allLostItems.filter(item => {
          const itemDate = new Date(item.discoveryDate);
          return itemDate >= monthStart && itemDate <= monthEnd;
        }).length;
        
        // Valeur fictive pour la qualité
        const qualityValue = Math.floor(Math.random() * 15) + 5;

        return {
          name: month.name,
          incidents: monthIncidents,
          maintenance: monthMaintenances,
          lostItems: monthLostItems,
          quality: qualityValue
        };
      });

      return moduleData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données multi-modules:', error);
      return [];
    }
  }

  /**
   * Récupère les données de comparaison par hôtel
   */
  async getHotelComparisonData(userEmail: string): Promise<HotelComparisonData[]> {
    try {
      // Récupérer les hôtels accessibles à l'utilisateur
      const allowedHotels = await permissionsService.getAccessibleHotels(userEmail);
      
      if (allowedHotels.length === 0) {
        return [];
      }

      // Récupérer la liste des hôtels
      let hotels: Hotel[] = await hotelsService.getHotels();
      
      // Filtrer les hôtels selon les permissions
      if (!allowedHotels.includes('all')) {
        hotels = hotels.filter(hotel => allowedHotels.includes(hotel.id));
      }

      // Récupérer tous les incidents
      const allIncidents = await incidentsService.getIncidents(userEmail, 'all');
      
      // Récupérer toutes les interventions techniques
      const allMaintenances = await technicalInterventionsService.getInterventions(userEmail, 'all');
      
      // Récupérer tous les objets trouvés
      const allLostItems = await lostItemsService.getLostItems(userEmail, 'all');

      // Créer les données de comparaison par hôtel
      const hotelComparisonData: HotelComparisonData[] = hotels.map(hotel => {
        // Compter les incidents pour cet hôtel
        const hotelIncidents = allIncidents.filter(incident => incident.hotelId === hotel.id).length;

        // Compter les interventions techniques pour cet hôtel
        const hotelMaintenances = allMaintenances.filter(maintenance => maintenance.hotelId === hotel.id).length;
        
        // Compter les objets trouvés pour cet hôtel
        const hotelLostItems = allLostItems.filter(item => item.hotelId === hotel.id).length;

        return {
          name: hotel.name,
          incidents: hotelIncidents,
          maintenance: hotelMaintenances,
          lostItems: hotelLostItems
        };
      });

      // Trier par nombre total d'incidents + maintenances + objets trouvés (décroissant)
      return hotelComparisonData.sort((a, b) => 
        (b.incidents + b.maintenance + b.lostItems) - (a.incidents + a.maintenance + a.lostItems)
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des données de comparaison par hôtel:', error);
      return [];
    }
  }

  /**
   * Récupère les données de score qualité par hôtel (fictives pour l'instant)
   */
  async getQualityScoreData(userEmail: string): Promise<QualityScoreData[]> {
    try {
      // Récupérer les hôtels accessibles à l'utilisateur
      const allowedHotels = await permissionsService.getAccessibleHotels(userEmail);
      
      if (allowedHotels.length === 0) {
        return [];
      }

      // Récupérer la liste des hôtels
      let hotels: Hotel[] = await hotelsService.getHotels();
      
      // Filtrer les hôtels selon les permissions
      if (!allowedHotels.includes('all')) {
        hotels = hotels.filter(hotel => allowedHotels.includes(hotel.id));
      }

      // Créer des données fictives de score qualité
      const qualityScoreData: QualityScoreData[] = hotels.map(hotel => {
        // Score fictif entre 60 et 100
        const score = Math.floor(Math.random() * 40) + 60;

        return {
          hotel: hotel.name,
          score
        };
      });

      // Trier par score (décroissant)
      return qualityScoreData.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Erreur lors de la récupération des données de score qualité:', error);
      return [];
    }
  }
}

export const dashboardService = new DashboardService();
