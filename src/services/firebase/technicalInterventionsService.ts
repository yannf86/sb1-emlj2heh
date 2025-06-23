import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  limit,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { TechnicalIntervention, TechnicalStats, TechnicalAnalytics } from '../../types/maintenance';
import { permissionsService } from './permissionsService';
import { historyService } from './historyService';

export class TechnicalInterventionsService {
  async getInterventions(userEmail: string, hotelFilter?: string, statusFilter?: string, maxResults: number = 100, startDate?: Date | null): Promise<TechnicalIntervention[]> {
    try {
      // Appliquer le filtrage par permissions utilisateur
      const allowedHotels = await permissionsService.applyHotelFilter(userEmail, hotelFilter);
      
      // Si aucun hôtel accessible, retourner un tableau vide
      if (allowedHotels.length === 0) {
        return [];
      }

      // Construction optimisée de la requête
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
        // Si on filtre par statut, on trie toujours côté client pour éviter les index composites
        needsClientSideSorting = true;
      }

      // Ajouter l'ordre seulement si on ne trie pas côté client
      if (!needsClientSideSorting) {
        constraints.push(orderBy('date', 'desc'));
      }

      // Limite par défaut pour éviter de charger trop de données
      constraints.push(limit(maxResults));

      const q = query(collection(db, 'technical_interventions'), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const interventions: TechnicalIntervention[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        interventions.push({
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : data.endDate ? new Date(data.endDate) : undefined,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          hasQuote: data.hasQuote || false,
          quotes: Array.isArray(data.quotes) ? data.quotes.map((quote: any) => ({
            ...quote,
            quotedAt: quote.quotedAt instanceof Timestamp ? quote.quotedAt.toDate() : new Date(quote.quotedAt || Date.now())
          })) : [],
        } as TechnicalIntervention);
      });

      // Trier côté client si nécessaire (quand on a des contraintes multiples)
      if (needsClientSideSorting) {
        interventions.sort((a, b) => {
          const dateA = a.date;
          const dateB = b.date;
          return dateB.getTime() - dateA.getTime();
        });
      }
      
      // Filtrage supplémentaire côté client si nécessaire (pour plus de 10 hôtels)
      let filteredInterventions = allowedHotels.includes('all') 
        ? interventions 
        : interventions.filter(intervention => 
            !intervention.hotelId || allowedHotels.includes(intervention.hotelId)
          );
      
      // Filtrer par date de début si spécifiée
      if (startDate) {
        filteredInterventions = filteredInterventions.filter(intervention => {
          const interventionDate = intervention.date;
          return interventionDate >= startDate;
        });
      }
      
      return filteredInterventions;
    } catch (error) {
      console.error('Error getting technical interventions:', error);
      throw error;
    }
  }

  async addIntervention(intervention: Omit<TechnicalIntervention, 'id'>, beforePhoto?: File, afterPhoto?: File): Promise<string> {
    try {
      // Handle before photo upload
      if (beforePhoto) {
        const beforeRef = ref(storage, `interventions/before/${Date.now()}_${beforePhoto.name}`);
        const snapshot = await uploadBytes(beforeRef, beforePhoto);
        intervention.beforePhotoUrl = await getDownloadURL(snapshot.ref);
      }

      // Handle after photo upload
      if (afterPhoto) {
        const afterRef = ref(storage, `interventions/after/${Date.now()}_${afterPhoto.name}`);
        const snapshot = await uploadBytes(afterRef, afterPhoto);
        intervention.afterPhotoUrl = await getDownloadURL(snapshot.ref);
      }

      // Convert dates to Firestore Timestamps
      const data = {
        ...intervention,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        startDate: intervention.startDate ? Timestamp.fromDate(intervention.startDate) : null,
        endDate: intervention.endDate ? Timestamp.fromDate(intervention.endDate) : null,
      };

      const docRef = await addDoc(collection(db, 'technical_interventions'), data);
      
      // Ajouter une entrée d'historique pour la création
      await historyService.addTechnicalInterventionHistory(
        docRef.id,
        null, // Pas d'état précédent pour une création
        { ...data, id: docRef.id },
        intervention.createdBy || 'unknown',
        'create'
      );
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding technical intervention:', error);
      throw error;
    }
  }

  async updateIntervention(
    id: string, 
    intervention: Partial<TechnicalIntervention>, 
    beforePhoto?: File, 
    afterPhoto?: File
  ): Promise<void> {
    try {
      // Récupérer l'état précédent pour l'historique
      const docRef = doc(db, 'technical_interventions', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Intervention technique avec l'ID ${id} n'existe pas`);
      }
      
      // Convertir les Timestamp en objets Date pour l'historique
      const docData = docSnap.data();
      const previousState = { id, ...docData };
      
      // Préparer les données de mise à jour
      const updateData: any = {
        updatedAt: Timestamp.now()
      };

      // Ajouter uniquement les champs définis (pas de undefined)
      Object.entries(intervention).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value;
        }
      });

      // Convert dates to Firestore Timestamps
      if (intervention.startDate) {
        updateData.startDate = Timestamp.fromDate(intervention.startDate);
      }
      
      if (intervention.endDate) {
        updateData.endDate = Timestamp.fromDate(intervention.endDate);
      }

      // Handle before photo upload
      if (beforePhoto) {
        // Delete old photo if exists
        if (intervention.beforePhotoUrl) {
          try {
            const oldRef = ref(storage, intervention.beforePhotoUrl);
            await deleteObject(oldRef);
          } catch (error) {
            console.error('Error deleting old before photo:', error);
          }
        }

        // Upload new photo
        const beforeRef = ref(storage, `interventions/before/${Date.now()}_${beforePhoto.name}`);
        const snapshot = await uploadBytes(beforeRef, beforePhoto);
        updateData.beforePhotoUrl = await getDownloadURL(snapshot.ref);
      }

      // Handle after photo upload
      if (afterPhoto) {
        // Delete old photo if exists
        if (intervention.afterPhotoUrl) {
          try {
            const oldRef = ref(storage, intervention.afterPhotoUrl);
            await deleteObject(oldRef);
          } catch (error) {
            console.error('Error deleting old after photo:', error);
          }
        }

        // Upload new photo
        const afterRef = ref(storage, `interventions/after/${Date.now()}_${afterPhoto.name}`);
        const snapshot = await uploadBytes(afterRef, afterPhoto);
        updateData.afterPhotoUrl = await getDownloadURL(snapshot.ref);
      }

      // Mettre à jour l'intervention
      await updateDoc(docRef, updateData);
      
      // Récupérer l'état mis à jour pour l'historique
      const updatedDocSnap = await getDoc(docRef);
      const updatedData = updatedDocSnap.exists() ? updatedDocSnap.data() : {};
      const newState = { id, ...updatedData };
      
      // Ajouter une entrée d'historique pour la mise à jour
      try {
        // Utiliser uniquement updatedBy pour identifier clairement qui a fait la modification
        // Ne pas utiliser createdBy comme fallback car cela crée une confusion
        await historyService.addTechnicalInterventionHistory(
          id,
          previousState,
          newState,
          intervention.updatedBy || 'unknown',
          'update'
        );
      } catch (historyError) {
        console.error('Erreur lors de l\'ajout de l\'historique:', historyError);
        // Ne pas propager cette erreur pour ne pas bloquer la mise à jour
      }
    } catch (error) {
      console.error('Error updating technical intervention:', error);
      throw error;
    }
  }

  async deleteIntervention(id: string, userEmail?: string): Promise<void> {
    try {
      // First get the intervention to delete associated photos
      const interventions = await this.getInterventions(userEmail || 'admin@creho.fr', 'all', 'all', 1000);
      const intervention = interventions.find(i => i.id === id);
      
      if (!intervention) {
        throw new Error(`Intervention technique avec l'ID ${id} n'existe pas`);
      }
      
      // Stocker l'état précédent pour l'historique
      const previousState = { ...intervention };
      
      // Delete photos if they exist
      if (intervention.beforePhotoUrl) {
        try {
          const beforeRef = ref(storage, intervention.beforePhotoUrl);
          await deleteObject(beforeRef);
        } catch (error) {
          console.error('Error deleting before photo:', error);
        }
      }

      if (intervention.afterPhotoUrl) {
        try {
          const afterRef = ref(storage, intervention.afterPhotoUrl);
          await deleteObject(afterRef);
        } catch (error) {
          console.error('Error deleting after photo:', error);
        }
      }

      // Supprimer l'intervention
      await deleteDoc(doc(db, 'technical_interventions', id));
      
      // Ajouter une entrée d'historique pour la suppression
      await historyService.addTechnicalInterventionHistory(
        id,
        previousState,
        null, // Pas de nouvel état pour une suppression
        userEmail || previousState.createdBy || 'unknown',
        'delete'
      );
    } catch (error) {
      console.error('Error deleting technical intervention:', error);
      throw error;
    }
  }

  async getInterventionStats(userEmail?: string): Promise<TechnicalStats> {
    try {
      const interventions = await this.getInterventions(userEmail || 'admin@creho.fr', 'all', 'all', 1000);
      
      const total = interventions.length;
      const pending = interventions.filter(i => i.statusId === 'pending').length;
      const inProgress = interventions.filter(i => i.statusId === 'in_progress').length;
      const completed = interventions.filter(i => i.statusId === 'completed').length;

      // Calculate average completion time
      const completedInterventions = interventions.filter(i => 
        i.statusId === 'completed' && i.startDate && i.endDate
      );
      
      const avgCompletionTime = completedInterventions.length > 0
        ? completedInterventions.reduce((sum, intervention) => {
            const diff = intervention.endDate!.getTime() - intervention.startDate!.getTime();
            return sum + (diff / (1000 * 60 * 60 * 24)); // en jours
          }, 0) / completedInterventions.length
        : 0;

      const totalEstimatedCost = interventions.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
      const totalFinalCost = interventions.reduce((sum, i) => {
        // If intervention has accepted quotes, use the best quote price
        if (i.hasQuote && i.quotes && i.quotes.length > 0) {
          const acceptedQuotes = i.quotes.filter(q => q.status === 'accepted');
          if (acceptedQuotes.length > 0) {
            const bestQuote = Math.min(...acceptedQuotes.map(q => q.amount - q.discount));
            return sum + bestQuote;
          }
        }
        return sum + (i.finalCost || 0);
      }, 0);

      return {
        total,
        pending,
        inProgress,
        completed,
        averageCompletionTime: Math.round(avgCompletionTime * 10) / 10,
        totalEstimatedCost,
        totalFinalCost
      };
    } catch (error) {
      console.error('Error getting intervention stats:', error);
      throw error;
    }
  }

  async getInterventionAnalytics(userEmail?: string): Promise<TechnicalAnalytics> {
    try {
      const interventions = await this.getInterventions(userEmail || 'admin@creho.fr', 'all', 'all', 1000);

      // Analytics by type
      const typeMap = new Map<string, number>();
      interventions.forEach(intervention => {
        typeMap.set(intervention.interventionTypeId, (typeMap.get(intervention.interventionTypeId) || 0) + 1);
      });

      const typeColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
      const byType = Array.from(typeMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: typeColors[index % typeColors.length]
      }));

      // Analytics by status
      const statusMap = new Map<string, number>();
      interventions.forEach(intervention => {
        statusMap.set(intervention.statusId, (statusMap.get(intervention.statusId) || 0) + 1);
      });

      const statusColors = { pending: '#F59E0B', in_progress: '#3B82F6', completed: '#10B981', cancelled: '#6B7280' };
      const byStatus = Array.from(statusMap.entries()).map(([name, value]) => ({
        name,
        value,
        color: statusColors[name as keyof typeof statusColors] || '#6B7280'
      }));

      // Analytics by hotel
      const hotelMap = new Map<string, number>();
      interventions.forEach(intervention => {
        hotelMap.set(intervention.hotelId, (hotelMap.get(intervention.hotelId) || 0) + 1);
      });

      const byHotel = Array.from(hotelMap.entries()).map(([name, value]) => ({ name, value }));

      // Analytics by technician
      const technicianMap = new Map<string, number>();
      interventions.forEach(intervention => {
        if (intervention.assignedTo && intervention.assignedToType === 'technician') {
          technicianMap.set(intervention.assignedTo, (technicianMap.get(intervention.assignedTo) || 0) + 1);
        }
      });

      const byTechnician = Array.from(technicianMap.entries()).map(([name, value]) => ({ name, value }));

      // Cost evolution (last 6 months)
      const costEvolution = this.generateCostEvolution(interventions);

      // Completion times by type
      const completionTimes = this.calculateCompletionTimes(interventions);

      // Monthly interventions
      const monthlyInterventions = this.generateMonthlyInterventions(interventions);

      return {
        byType,
        byStatus,
        byHotel,
        byTechnician,
        costEvolution,
        completionTimes,
        monthlyInterventions
      };
    } catch (error) {
      console.error('Error getting intervention analytics:', error);
      throw error;
    }
  }

  private generateCostEvolution(interventions: TechnicalIntervention[]) {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date.toISOString().slice(0, 7); // YYYY-MM
    });

    return last6Months.map(month => {
      const monthInterventions = interventions.filter(i => 
        i.date.toISOString().slice(0, 7) === month
      );

      const estimated = monthInterventions.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);
      const final = monthInterventions.reduce((sum, i) => {
        // Use best quote price if available
        if (i.hasQuote && i.quotes && i.quotes.length > 0) {
          const acceptedQuotes = i.quotes.filter(q => q.status === 'accepted');
          if (acceptedQuotes.length > 0) {
            const bestQuote = Math.min(...acceptedQuotes.map(q => q.amount - q.discount));
            return sum + bestQuote;
          }
        }
        return sum + (i.finalCost || 0);
      }, 0);

      return { date: month, estimated, final };
    });
  }

  private calculateCompletionTimes(interventions: TechnicalIntervention[]) {
    const typeTimes = new Map<string, number[]>();
    
    interventions.forEach(intervention => {
      if (intervention.startDate && intervention.endDate) {
        const completionTime = (intervention.endDate.getTime() - intervention.startDate.getTime()) / (1000 * 60 * 60 * 24);
        const times = typeTimes.get(intervention.interventionTypeId) || [];
        times.push(completionTime);
        typeTimes.set(intervention.interventionTypeId, times);
      }
    });

    return Array.from(typeTimes.entries()).map(([type, times]) => ({
      type,
      avgTime: Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
    }));
  }

  private generateMonthlyInterventions(interventions: TechnicalIntervention[]) {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return {
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        key: date.toISOString().slice(0, 7)
      };
    });

    return last12Months.map(({ month, key }) => {
      const count = interventions.filter(i => 
        i.date.toISOString().slice(0, 7) === key
      ).length;

      return { month, count };
    });
  }
}

export const technicalInterventionsService = new TechnicalInterventionsService();