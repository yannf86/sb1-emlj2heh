import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  getDoc,
  doc,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { HistoryEntry, HistoryChange } from '../../types/history';
import { usersService } from './usersService';

class HistoryService {
  /**
   * Ajoute une entrée d'historique pour un incident
   */
  async addIncidentHistory(
    incidentId: string,
    previousState: any,
    newState: any,
    userId: string,
    operation: 'create' | 'update' | 'delete'
  ): Promise<string> {
    try {
      // Récupérer les informations de l'utilisateur
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Utiliser le nom complet ou le nom d'affichage, ou l'email comme fallback, ou l'ID comme dernier recours
      let userName = 'Utilisateur inconnu';
      if (userData) {
        userName = userData.name || userData.displayName || userData.email || `Utilisateur ${userId.substring(0, 8)}...`;
      }
      
      // Déterminer les champs qui ont été modifiés
      const changedFields = this.detectChangedFields(previousState, newState);
      
      const historyEntry: Omit<HistoryEntry, 'id'> = {
        entityId: incidentId,
        entityType: 'incident',
        previousState,
        newState,
        changedFields,
        userId,
        userName: userName,
        userEmail: userData?.email || 'Email inconnu',
        timestamp: Timestamp.now(),
        operation,
        action: operation
      };
      
      const docRef = await addDoc(collection(db, 'history'), historyEntry);
      console.log(`Entrée d'historique créée avec l'ID: ${docRef.id}`);
      
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'une entrée d\'historique:', error);
      throw error;
    }
  }
  
  /**
   * Ajoute une entrée d'historique pour une intervention technique
   */
  async addTechnicalInterventionHistory(
    interventionId: string,
    previousState: any,
    newState: any,
    userId: string,
    operation: 'create' | 'update' | 'delete'
  ): Promise<string> {
    try {
      // Récupérer les informations de l'utilisateur
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Utiliser le nom complet ou le nom d'affichage, ou l'email comme fallback, ou l'ID comme dernier recours
      let userName = 'Utilisateur inconnu';
      if (userData) {
        userName = userData.name || userData.displayName || userData.email || `Utilisateur ${userId.substring(0, 8)}...`;
      }
      
      // Déterminer les champs qui ont été modifiés
      const changedFields = this.detectChangedFields(previousState, newState);
      
      const historyEntry: Omit<HistoryEntry, 'id'> = {
        entityId: interventionId,
        entityType: 'technical_intervention',
        previousState,
        newState,
        changedFields,
        userId,
        userName: userName,
        userEmail: userData?.email || 'Email inconnu',
        timestamp: Timestamp.now(),
        operation,
        action: operation
      };
      
      const docRef = await addDoc(collection(db, 'history'), historyEntry);
      console.log(`Entrée d'historique créée avec l'ID: ${docRef.id}`);
      
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'une entrée d\'historique:', error);
      throw error;
    }
  }
  
  /**
   * Récupère l'historique d'un incident
   */
  async getIncidentHistory(incidentId: string): Promise<HistoryEntry[]> {
    try {
      console.log(`[HistoryService] Récupération de l'historique pour l'incident: ${incidentId}`);
      
      // Vérifier si la collection existe déjà
      const collectionRef = collection(db, 'history');
      
      // Essayer d'abord de récupérer tous les documents de la collection
      const allDocsQuery = query(collectionRef);
      const allDocsSnapshot = await getDocs(allDocsQuery);
      
      console.log(`[HistoryService] Nombre total de documents dans la collection history: ${allDocsSnapshot.size}`);
      
      // Filtrer manuellement les documents pour trouver ceux qui sont liés à l'incident
      const filteredDocs = allDocsSnapshot.docs.filter(doc => {
        const data = doc.data();
        
        // Vérifier plusieurs possibilités de liaison avec l'incident
        if (data.entityId === incidentId) return true;
        
        // Vérifier si l'ID de l'incident est dans les changes
        if (data.changes) {
          if (Array.isArray(data.changes)) {
            for (const change of data.changes) {
              if (change.new === incidentId || change.old === incidentId) {
                return true;
              }
            }
          } else if (typeof data.changes === 'object') {
            const changesStr = JSON.stringify(data.changes);
            if (changesStr.includes(incidentId)) {
              return true;
            }
          }
        }
        
        // Vérifier si le document est lié à l'incident d'une autre manière
        const docStr = JSON.stringify(data);
        return docStr.includes(incidentId);
      });
      
      console.log(`[HistoryService] Après filtrage manuel - nombre de documents liés à l'incident: ${filteredDocs.length}`);
      
      // Trier les documents par timestamp (du plus récent au plus ancien)
      const sortedEntries = filteredDocs.sort((a, b) => {
        const timestampA = a.data().timestamp;
        const timestampB = b.data().timestamp;
        
        if (!timestampA) return 1;
        if (!timestampB) return -1;
        
        const dateA = timestampA instanceof Timestamp ? timestampA.toMillis() : new Date(timestampA).getTime();
        const dateB = timestampB instanceof Timestamp ? timestampB.toMillis() : new Date(timestampB).getTime();
        
        return dateB - dateA; // Ordre décroissant (du plus récent au plus ancien)
      });
      
      const history: HistoryEntry[] = [];
      sortedEntries.forEach((doc) => {
        const data = doc.data();
        console.log('[HistoryService] Document lié à l\'incident:', data);
        
        // Convertir les timestamps Firestore en objets Date
        const timestamp = data.timestamp instanceof Timestamp 
          ? data.timestamp.toDate() 
          : data.timestamp;
        
        history.push({
          id: doc.id,
          ...data,
          timestamp
        } as HistoryEntry);
      });
      
      return history;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }
  
  /**
   * Récupère l'historique d'une intervention technique
   */
  async getTechnicalInterventionHistory(interventionId: string): Promise<HistoryEntry[]> {
    try {
      console.log(`[HistoryService] Récupération de l'historique pour l'intervention technique: ${interventionId}`);
      
      // Vérifier si la collection existe déjà
      const collectionRef = collection(db, 'history');
      
      // Essayer d'abord de récupérer tous les documents de la collection
      const allDocsQuery = query(collectionRef);
      const allDocsSnapshot = await getDocs(allDocsQuery);
      
      console.log(`[HistoryService] Nombre total de documents dans la collection history: ${allDocsSnapshot.size}`);
      
      // Filtrer manuellement les documents pour trouver ceux qui sont liés à l'intervention technique
      const filteredDocs = allDocsSnapshot.docs.filter(doc => {
        const data = doc.data();
        
        // Vérifier si le document est lié à l'intervention technique
        if (data.entityId === interventionId && data.entityType === 'technical_intervention') {
          return true;
        }
        
        // Vérifier si l'ID de l'intervention est dans les changes
        if (data.changes) {
          if (Array.isArray(data.changes)) {
            for (const change of data.changes) {
              if (change.new === interventionId || change.old === interventionId) {
                return true;
              }
            }
          } else if (typeof data.changes === 'object') {
            const changesStr = JSON.stringify(data.changes);
            if (changesStr.includes(interventionId)) {
              return true;
            }
          }
        }
        
        // Vérifier si le document est lié à l'intervention d'une autre manière
        const docStr = JSON.stringify(data);
        return docStr.includes(interventionId);
      });
      
      console.log(`[HistoryService] Après filtrage manuel - nombre de documents liés à l'intervention: ${filteredDocs.length}`);
      
      // Trier les documents par timestamp (du plus récent au plus ancien)
      const sortedEntries = filteredDocs.sort((a, b) => {
        const timestampA = a.data().timestamp;
        const timestampB = b.data().timestamp;
        
        if (!timestampA) return 1;
        if (!timestampB) return -1;
        
        const dateA = timestampA instanceof Timestamp ? timestampA.toMillis() : new Date(timestampA).getTime();
        const dateB = timestampB instanceof Timestamp ? timestampB.toMillis() : new Date(timestampB).getTime();
        
        return dateB - dateA; // Ordre décroissant (du plus récent au plus ancien)
      });
      
      const history: HistoryEntry[] = [];
      sortedEntries.forEach((doc) => {
        const data = doc.data();
        console.log('[HistoryService] Document lié à l\'intervention technique:', data);
        
        // Convertir les timestamps Firestore en objets Date
        const timestamp = data.timestamp instanceof Timestamp 
          ? data.timestamp.toDate() 
          : data.timestamp;
        
        history.push({
          id: doc.id,
          ...data,
          timestamp
        } as HistoryEntry);
      });
      
      return history;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }
  
  /**
   * Détecte les champs qui ont été modifiés entre deux états
   */
  private detectChangedFields(previousState: any, newState: any): string[] {
    if (!previousState || Object.keys(previousState).length === 0) {
      return Object.keys(newState).filter(key => key !== 'id');
    }
    
    if (!newState || Object.keys(newState).length === 0) {
      return Object.keys(previousState).filter(key => key !== 'id');
    }
    
    const changedFields: string[] = [];
    
    // Parcourir tous les champs du nouvel état
    Object.keys(newState).forEach(key => {
      // Ignorer l'ID et les champs spéciaux
      if (key === 'id') return;
      
      // Si le champ n'existe pas dans l'état précédent ou si sa valeur a changé
      if (
        !previousState.hasOwnProperty(key) || 
        JSON.stringify(previousState[key]) !== JSON.stringify(newState[key])
      ) {
        changedFields.push(key);
      }
    });
    
    // Vérifier les champs qui ont été supprimés
    Object.keys(previousState).forEach(key => {
      if (key === 'id') return;
      
      if (!newState.hasOwnProperty(key)) {
        changedFields.push(key);
      }
    });
    
    return changedFields;
  }
}

export const historyService = new HistoryService();
