import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Incident, IncidentStats, IncidentAnalytics } from '../../types/incidents';
import { permissionsService } from './permissionsService';
import { historyService } from './historyService';

export class IncidentsService {
  // Cache pour les données fréquemment utilisées
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private static isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? (Date.now() - cached.timestamp) < this.CACHE_DURATION : false;
  }

  private static getFromCache<T>(key: string): T | null {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)?.data || null;
    }
    return null;
  }

  private static setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getIncidents(
    userEmail: string,
    hotelFilter?: string,
    statusFilter?: string,
    limitCount: number = 100,
    startDate?: Date | null
  ): Promise<Incident[]> {
    try {
      // Appliquer le filtre d'hôtel selon les permissions de l'utilisateur
      const allowedHotels = await permissionsService.applyHotelFilter(userEmail, hotelFilter);

      // Construire les contraintes de la requête Firestore
      const constraints: any[] = [];
      let needsClientSideSorting = false;

      // Filtrage par hôtel selon les permissions
      if (!allowedHotels.includes('all')) {
        needsClientSideSorting = true; // Quand on filtre par hôtel, on trie côté client
        
        if (allowedHotels.length === 1) {
          constraints.push(where('hotelId', '==', allowedHotels[0]));
        } else {
          constraints.push(where('hotelId', 'in', allowedHotels.slice(0, 10))); // Firestore limite à 10 valeurs dans 'in'
        }
      }

      // Filtrage par statut
      if (statusFilter && statusFilter !== 'all') {
        constraints.push(where('statusId', '==', statusFilter));
        // Si on filtre par statut ET par hôtel, on trie côté client
        if (!allowedHotels.includes('all')) {
          needsClientSideSorting = true;
        }
      }

      // Ajouter l'ordre seulement si on ne trie pas côté client
      if (!needsClientSideSorting) {
        constraints.push(orderBy('date', 'desc'));
      }

      // Limite par défaut pour éviter de charger trop de données
      constraints.push(limit(limitCount));

      // Construire et exécuter la requête
      const q = query(collection(db, 'incidents'), ...constraints);
      const querySnapshot = await getDocs(q);

      const incidents: Incident[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data();
        incidents.push({
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          clientArrivalDate: data.clientArrivalDate instanceof Timestamp ? data.clientArrivalDate.toDate() : data.clientArrivalDate ? new Date(data.clientArrivalDate) : undefined,
          clientDepartureDate: data.clientDepartureDate instanceof Timestamp ? data.clientDepartureDate.toDate() : data.clientDepartureDate ? new Date(data.clientDepartureDate) : undefined,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
          resolvedAt: data.resolvedAt instanceof Timestamp ? data.resolvedAt.toDate() : undefined,
          incidentMode: Array.isArray(data.incidentMode) ? data.incidentMode : [],
          attachments: Array.isArray(data.attachments) ? data.attachments : [],
        } as Incident);
      });

      // Trier côté client si nécessaire (quand on a des contraintes multiples)
      if (needsClientSideSorting) {
        incidents.sort((a, b) => {
          const dateA = a.date;
          const dateB = b.date;
          return dateB.getTime() - dateA.getTime();
        });
      }

      // Filtrage supplémentaire côté client si nécessaire (pour plus de 10 hôtels)
      let filteredIncidents = allowedHotels.includes('all') 
        ? incidents 
        : incidents.filter(incident => 
            !incident.hotelId || allowedHotels.includes(incident.hotelId)
          );
      
      // Filtrage par date si une date de début est spécifiée
      if (startDate) {
        filteredIncidents = filteredIncidents.filter(incident => {
          const incidentDate = incident.date;
          return incidentDate >= startDate;
        });
      }

      const cacheKey = `incidents-${allowedHotels.join(',')}-${statusFilter || 'all'}-${limitCount}-${startDate ? startDate.getTime() : 'all'}`;
      IncidentsService.setCache(cacheKey, filteredIncidents);
      return filteredIncidents;
    } catch (error) {
      console.error('Erreur lors de la récupération des incidents:', error);
      return [];
    }
  }

  async addIncident(incident: Omit<Incident, 'id'>, userEmail: string): Promise<string> {
    try {
      // Vérifier que l'utilisateur a accès à l'hôtel
      if (incident.hotelId) {
        const hasAccess = await permissionsService.hasAccessToHotel(userEmail, incident.hotelId);
        if (!hasAccess) {
          throw new Error('Accès non autorisé à cet hôtel');
        }
      }

      // Optimisation : ne stocker que les champs nécessaires
      const optimizedIncident = {
        date: Timestamp.fromDate(incident.date),
        time: incident.time,
        hotelId: incident.hotelId,
        categoryId: incident.categoryId,
        impactId: incident.impactId,
        description: incident.description,
        photoURL: incident.photoURL || '', // Ajout du champ photoURL
        statusId: incident.statusId,
        receivedById: incident.receivedById,
        assignedTo: incident.assignedTo,
        location: incident.location,
        locationId: incident.location, // Ajouter aussi locationId pour compatibilité avec les anciens incidents
        priority: incident.priority || 'medium',
        clientName: incident.clientName,
        clientEmail: incident.clientEmail,
        clientPhone: incident.clientPhone,
        clientArrivalDate: incident.clientArrivalDate ? Timestamp.fromDate(incident.clientArrivalDate) : null,
        clientDepartureDate: incident.clientDepartureDate ? Timestamp.fromDate(incident.clientDepartureDate) : null,
        clientRoom: incident.clientRoom,
        clientReservation: incident.clientReservation,
        bookingAmount: incident.bookingAmount || 0,
        bookingOrigin: incident.bookingOrigin,
        resolutionDescription: incident.resolutionDescription,
        resolutionType: incident.resolutionType,
        actualCost: incident.actualCost || 0,
        estimatedCost: incident.estimatedCost || 0,
        clientSatisfactionId: incident.clientSatisfactionId,
        incidentMode: incident.incidentMode || [],
        attachments: incident.attachments || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'incidents'), optimizedIncident);
      
      // Invalider le cache
      this.clearCache();
      
      // Ajouter une entrée d'historique pour la création
      await historyService.addIncidentHistory(
        docRef.id,
        {}, // Pas d'état précédent pour une création
        this.convertTimestampsToDate({ ...optimizedIncident, id: docRef.id }),
        incident.receivedById,
        'create'
      );
      console.log(`📝 [IncidentsService] Historique de création enregistré pour l'incident: ${docRef.id}`);
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding incident:', error);
      throw error;
    }
  }

  async updateIncident(id: string, incident: Partial<Incident>, userEmail: string): Promise<void> {
    try {
      console.log('Mise à jour incident - données reçues:', incident);
      
      // Vérifier que l'utilisateur a accès à l'hôtel
      if (incident.hotelId) {
        const hasAccess = await permissionsService.hasAccessToHotel(userEmail, incident.hotelId);
        if (!hasAccess) {
          throw new Error('Accès non autorisé à cet hôtel');
        }
      }

      // Récupérer d'abord l'objet actuel pour avoir les données complètes
      const docRef = doc(db, 'incidents', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Incident avec l'ID ${id} n'existe pas`);
      }
      
      const currentItem = docSnap.data() as Incident;
      
      // Sauvegarder l'état actuel pour l'historique
      const previousState = this.convertTimestampsToDate({ ...currentItem, id });

      // Créer une copie des données pour éviter de modifier l'original
      const updateData: any = {};
      
      // Ajouter la date de mise à jour
      updateData.updatedAt = Timestamp.now();
      
      // Traiter toutes les propriétés de l'incident
      Object.keys(incident).forEach(key => {
        const value = incident[key as keyof Partial<Incident>];
        
        // Ignorer les propriétés undefined
        if (value === undefined) return;
        
        // Convertir les dates en Timestamp
        if (key === 'date' || key === 'clientArrivalDate' || key === 'clientDepartureDate' || 
            key === 'createdAt' || key === 'updatedAt' || key === 'resolvedAt') {
          if (value instanceof Date) {
            updateData[key] = Timestamp.fromDate(value);
          }
        } else {
          // Copier les autres propriétés telles quelles
          updateData[key] = value;
          
          // Si le champ location est mis à jour, mettre à jour aussi locationId
          if (key === 'location') {
            updateData['locationId'] = value;
          }
          // Si le champ locationId est mis à jour, mettre à jour aussi location
          else if (key === 'locationId') {
            updateData['location'] = value;
          }
        }
      });
      
      // Traitement spécial pour le statut résolu/fermé
      if (incident.statusId === 'resolved' || incident.statusId === 'closed') {
        updateData.resolvedAt = Timestamp.now();
      }
      
      console.log('Mise à jour incident - données préparées:', updateData);
      
      await updateDoc(docRef, updateData);
      
      // Créer un nouvel état qui combine l'état actuel avec les mises à jour
      const newState = this.convertTimestampsToDate({ ...currentItem, ...updateData, id });
      
      // Ajouter une entrée d'historique pour la mise à jour
      // Utiliser uniquement updatedBy pour identifier correctement l'utilisateur qui a effectué la modification
      // Ne pas utiliser receivedById comme fallback car cela peut être une personne différente
      await historyService.addIncidentHistory(
        id,
        previousState,
        newState,
        incident.updatedBy || 'unknown',
        'update'
      );
      console.log(`📝 [IncidentsService] Historique de modification enregistré pour l'incident: ${id}`);
      
      // Invalider le cache
      this.clearCache();
    } catch (error) {
      console.error('Error updating incident:', error);
      throw error;
    }
  }

  async deleteIncident(id: string, userEmail: string): Promise<void> {
    try {
      // Vérifier si l'utilisateur est administrateur
      const isAdmin = await permissionsService.isSystemAdmin(userEmail);
      
      // Récupérer l'incident avant de le supprimer pour l'historique
      const incidentDoc = await getDoc(doc(db, 'incidents', id));
      if (!incidentDoc.exists()) {
        throw new Error('Incident non trouvé');
      }
      
      const incidentData = incidentDoc.data();
      const creatorId = incidentData.receivedById;
      
      // Sauvegarder l'état actuel pour l'historique
      const previousState = this.convertTimestampsToDate({ ...incidentData, id });

      // Si l'utilisateur n'est pas administrateur, vérifier s'il est le créateur de l'incident
      if (!isAdmin) {
        
        // Récupérer l'ID utilisateur à partir de l'email
        const usersSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', userEmail)));
        if (usersSnapshot.empty) {
          throw new Error('Utilisateur non trouvé');
        }
        
        const userId = usersSnapshot.docs[0].id;
        
        // Vérifier si l'utilisateur est le créateur de l'incident
        if (userId !== creatorId) {
          throw new Error('Vous n\'êtes pas autorisé à supprimer cet incident. Seul le créateur ou un administrateur peut le supprimer.');
        }
      }
      
      // Si l'utilisateur est administrateur ou créateur, procéder à la suppression
      await deleteDoc(doc(db, 'incidents', id));
      
      // Récupérer l'ID utilisateur à partir de l'email pour l'historique
      const usersSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', userEmail)));
      const userId = usersSnapshot.empty ? userEmail : usersSnapshot.docs[0].id;
      
      // Ajouter une entrée d'historique pour la suppression
      await historyService.addIncidentHistory(
        id,
        previousState,
        {}, // Pas de nouvel état pour une suppression
        userId,
        'delete'
      );
      console.log(`📝 [IncidentsService] Historique de suppression enregistré pour l'incident: ${id}`);
      
      // Invalider le cache
      this.clearCache();
    } catch (error) {
      console.error('Error deleting incident:', error);
      throw error;
    }
  }

  async getIncidentStats(userEmail: string): Promise<IncidentStats> {
    try {
      const cacheKey = `incident-stats-${userEmail}`;
      const cached = IncidentsService.getFromCache<IncidentStats>(cacheKey);
      if (cached) {
        return cached;
      }

      // Optimisation : récupérer seulement les champs nécessaires
      const incidents = await this.getIncidents(userEmail, 'all', 'all', 1000);
      
      const total = incidents.length;
      const open = incidents.filter(i => i.statusId === 'open').length;
      const inProgress = incidents.filter(i => i.statusId === 'in_progress').length;
      const resolved = incidents.filter(i => i.statusId === 'resolved').length;
      const closed = incidents.filter(i => i.statusId === 'closed').length;

      // Calcul du temps moyen de résolution
      const resolvedIncidents = incidents.filter(i => i.resolvedAt && i.createdAt);
      const avgResolutionTime = resolvedIncidents.length > 0
        ? resolvedIncidents.reduce((sum, incident) => {
            const diff = incident.resolvedAt!.getTime() - incident.createdAt!.getTime();
            return sum + (diff / (1000 * 60 * 60)); // en heures
          }, 0) / resolvedIncidents.length
        : 0;

      // Calcul du score de satisfaction
      const satisfiedIncidents = incidents.filter(i => i.clientSatisfactionId);
      const satisfactionScore = satisfiedIncidents.length > 0
        ? satisfiedIncidents.reduce((sum, incident) => {
            const score = incident.clientSatisfactionId === 'satisfied' ? 5 
                       : incident.clientSatisfactionId === 'neutral' ? 3 
                       : 1;
            return sum + score;
          }, 0) / satisfiedIncidents.length
        : 0;

      const stats = {
        total,
        open,
        inProgress,
        resolved,
        closed,
        averageResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        satisfactionScore: Math.round(satisfactionScore * 10) / 10
      };

      IncidentsService.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error getting incident stats:', error);
      throw error;
    }
  }

  async getIncidentAnalytics(userEmail: string): Promise<IncidentAnalytics> {
    try {
      const cacheKey = `incident-analytics-${userEmail}`;
      const cached = IncidentsService.getFromCache<IncidentAnalytics>(cacheKey);
      if (cached) {
        return cached;
      }

      const incidents = await this.getIncidents(userEmail, 'all', 'all', 1000);
      
      // Importer le service de paramètres
      const { parametersService } = await import('./parametersService');
      
      // Récupérer les catégories pour avoir les labels
      const categoriesData = await parametersService.getParameters('parameters_incident_category');
      const statusesData = await parametersService.getParameters('parameters_status');
      const impactsData = await parametersService.getParameters('parameters_impact');

      // Fonction pour obtenir le label à partir de l'ID
      const getCategoryLabel = (id: string) => {
        const category = categoriesData.find(c => c.id === id);
        return category?.label || id;
      };

      const getStatusLabel = (id: string) => {
        const status = statusesData.find(s => s.id === id);
        return status?.label || id;
      };

      const getImpactLabel = (id: string) => {
        const impact = impactsData.find(i => i.id === id);
        return impact?.label || id;
      };

      // Incidents par catégorie
      const categoryMap = new Map<string, number>();
      incidents.forEach(incident => {
        const categoryLabel = getCategoryLabel(incident.categoryId);
        categoryMap.set(categoryLabel, (categoryMap.get(categoryLabel) || 0) + 1);
      });

      const categoryColors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
      const byCategory = Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: categoryColors[index % categoryColors.length]
      }));

      // Incidents par statut
      const statusMap = new Map<string, number>();
      incidents.forEach(incident => {
        const statusLabel = getStatusLabel(incident.statusId);
        statusMap.set(statusLabel, (statusMap.get(statusLabel) || 0) + 1);
      });

      const statusColors: Record<string, string> = {};
      statusesData.forEach(status => {
        if (status.id === 'open') statusColors[status.label] = '#EF4444';
        else if (status.id === 'in_progress') statusColors[status.label] = '#F59E0B';
        else if (status.id === 'resolved') statusColors[status.label] = '#10B981';
        else if (status.id === 'closed') statusColors[status.label] = '#6B7280';
      });

      const byStatus = Array.from(statusMap.entries()).map(([name, value]) => ({
        name,
        value,
        color: statusColors[name] || '#6B7280'
      }));

      // Incidents par impact
      const impactMap = new Map<string, number>();
      incidents.forEach(incident => {
        const impactLabel = getImpactLabel(incident.impactId);
        impactMap.set(impactLabel, (impactMap.get(impactLabel) || 0) + 1);
      });

      const impactColors: Record<string, string> = {};
      impactsData.forEach(impact => {
        if (impact.id === 'low') impactColors[impact.label] = '#10B981';
        else if (impact.id === 'medium') impactColors[impact.label] = '#F59E0B';
        else if (impact.id === 'high') impactColors[impact.label] = '#EF4444';
        else if (impact.id === 'critical') impactColors[impact.label] = '#991B1B';
      });

      const byImpact = Array.from(impactMap.entries()).map(([name, value]) => ({
        name,
        value,
        color: impactColors[name] || '#6B7280'
      }));

      // Incidents par hôtel (seulement les hôtels accessibles)
      const hotelMap = new Map<string, number>();
      incidents.forEach(incident => {
        if (incident.hotelId) {
          hotelMap.set(incident.hotelId, (hotelMap.get(incident.hotelId) || 0) + 1);
        }
      });

      const byHotel = Array.from(hotelMap.entries()).map(([name, value]) => ({ name, value }));

      // Incidents par moteur géré concerné
      const engineMap = new Map<string, number>();
      incidents.forEach(incident => {
        if (incident.concernedEngine) {
          engineMap.set(incident.concernedEngine, (engineMap.get(incident.concernedEngine) || 0) + 1);
        }
      });

      const byEngine = Array.from(engineMap.entries()).map(([name, value]) => ({ name, value }));

      // Évolution des catégories d'incidents (derniers 30 jours)
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      
      const recentIncidents = incidents.filter(i => i.date >= last30Days);
      const categoryEvolution = this.generateCategoryEvolution(recentIncidents);

      // Temps de résolution par catégorie
      const resolutionTimes = this.calculateResolutionTimes(incidents);

      // Satisfaction par catégorie
      const satisfactionByCategory = this.calculateSatisfactionByCategory(incidents);

      const analytics = {
        byCategory,
        byStatus,
        byImpact,
        byHotel,
        byEngine,
        categoryEvolution,
        resolutionTimes,
        satisfactionByCategory
      };

      IncidentsService.setCache(cacheKey, analytics);
      return analytics;
    } catch (error) {
      console.error('Error getting incident analytics:', error);
      throw error;
    }
  }

  private clearCache(): void {
    IncidentsService.cache.clear();
  }
  
  /**
   * Convertit les Timestamp Firestore en objets Date pour l'historique
   */
  private convertTimestampsToDate(item: any): any {
    if (!item) return null;
    
    const result: any = { ...item };
    
    // Convertir les champs de date connus
    if (result.createdAt && typeof result.createdAt.toDate === 'function') {
      result.createdAt = result.createdAt.toDate();
    }
    
    if (result.updatedAt && typeof result.updatedAt.toDate === 'function') {
      result.updatedAt = result.updatedAt.toDate();
    }
    
    if (result.date && typeof result.date.toDate === 'function') {
      result.date = result.date.toDate();
    }
    
    if (result.resolvedAt && typeof result.resolvedAt.toDate === 'function') {
      result.resolvedAt = result.resolvedAt.toDate();
    }
    
    if (result.clientArrivalDate && typeof result.clientArrivalDate.toDate === 'function') {
      result.clientArrivalDate = result.clientArrivalDate.toDate();
    }
    
    if (result.clientDepartureDate && typeof result.clientDepartureDate.toDate === 'function') {
      result.clientDepartureDate = result.clientDepartureDate.toDate();
    }
    
    return result;
  }

  private generateCategoryEvolution(incidents: Incident[]) {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayIncidents = incidents.filter(i => 
        i.date.toISOString().split('T')[0] === date
      );

      const result: any = { date };
      dayIncidents.forEach(incident => {
        result[incident.categoryId] = (result[incident.categoryId] || 0) + 1;
      });

      return result;
    });
  }

  private calculateResolutionTimes(incidents: Incident[]) {
    const categoryTimes = new Map<string, number[]>();
    
    incidents.forEach(incident => {
      if (incident.resolvedAt && incident.createdAt) {
        const resolutionTime = (incident.resolvedAt.getTime() - incident.createdAt.getTime()) / (1000 * 60 * 60);
        const times = categoryTimes.get(incident.categoryId) || [];
        times.push(resolutionTime);
        categoryTimes.set(incident.categoryId, times);
      }
    });

    return Array.from(categoryTimes.entries()).map(([category, times]) => ({
      category,
      avgTime: Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
    }));
  }

  private calculateSatisfactionByCategory(incidents: Incident[]) {
    const categorySatisfaction = new Map<string, number[]>();
    
    incidents.forEach(incident => {
      if (incident.clientSatisfactionId) {
        const score = incident.clientSatisfactionId === 'satisfied' ? 5 
                   : incident.clientSatisfactionId === 'neutral' ? 3 
                   : 1;
        const scores = categorySatisfaction.get(incident.categoryId) || [];
        scores.push(score);
        categorySatisfaction.set(incident.categoryId, scores);
      }
    });

    return Array.from(categorySatisfaction.entries()).map(([category, scores]) => ({
      category,
      satisfaction: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    }));
  }
}

export const incidentsService = new IncidentsService();