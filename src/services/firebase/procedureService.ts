import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Procedure, ProcedureAcknowledgment, ProcedureHistory } from '../../types/procedure';

class ProcedureService {
  private proceduresCollection = 'procedures';
  private acknowledgementsCollection = 'procedure_acknowledgments';
  private historyCollection = 'procedure_history';

  // Créer une nouvelle procédure
  async createProcedure(procedureData: Omit<Procedure, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const procedure: Omit<Procedure, 'id'> = {
        ...procedureData,
        createdAt: now,
        updatedAt: now,
        isActive: true
      };

      const docRef = await addDoc(collection(db, this.proceduresCollection), procedure);
      
      // Ajouter à l'historique
      await this.addHistory(docRef.id, 'created', procedureData.createdBy, procedureData.createdByName, 'Procédure créée');

      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création de la procédure:', error);
      throw error;
    }
  }

  // Mettre à jour une procédure avec gestion avancée des modifications
  async updateProcedure(id: string, updates: Partial<Procedure>, userId: string, userName: string): Promise<void> {
    try {
      const procedureRef = doc(db, this.proceduresCollection, id);
      const currentDoc = await getDoc(procedureRef);
      const currentData = currentDoc.data() as Procedure;

      if (!currentData) {
        throw new Error('Procédure introuvable');
      }

      // Analyser les modifications pour déterminer si une nouvelle validation est nécessaire
      const modifications = this.analyzeChanges(currentData, updates);
      const requiresRevalidation = this.shouldRequireRevalidation(modifications);

      // Incrémenter la version si une revalidation est nécessaire
      const newVersion = requiresRevalidation ? (currentData.version || 1) + 1 : (currentData.version || 1);
      
      const updatedData = {
        ...updates,
        version: newVersion,
        updatedAt: Timestamp.now()
      };

      await updateDoc(procedureRef, updatedData);

      // Si une revalidation est nécessaire, révoquer toutes les validations existantes
      if (requiresRevalidation) {
        await this.revokeAllAcknowledgments(id, false); // false = ne pas ajouter à l'historique ici
        await this.addHistory(
          id, 
          'revoked_acknowledgments', 
          userId, 
          userName, 
          `Validations révoquées automatiquement suite aux modifications: ${modifications.join(', ')}`
        );
      }

      // Ajouter à l'historique avec détails des modifications
      await this.addHistory(
        id, 
        'updated', 
        userId, 
        userName, 
        `Modifications: ${modifications.join(', ')}${requiresRevalidation ? ' (Nouvelle validation requise)' : ''}`,
        currentData, 
        updatedData
      );

    } catch (error) {
      console.error('Erreur lors de la mise à jour de la procédure:', error);
      throw error;
    }
  }

  // Supprimer une procédure
  async deleteProcedure(id: string, userId: string, userName: string): Promise<void> {
    try {
      const procedureRef = doc(db, this.proceduresCollection, id);
      const procedureDoc = await getDoc(procedureRef);
      
      if (procedureDoc.exists()) {
        const procedureData = procedureDoc.data() as Procedure;
        
        // Supprimer le fichier PDF s'il existe
        if (procedureData.pdfUrl) {
          try {
            const pdfRef = ref(storage, `procedures/${id}/${procedureData.pdfName}`);
            await deleteObject(pdfRef);
          } catch (error) {
            console.warn('Erreur lors de la suppression du PDF:', error);
          }
        }

        // Supprimer la procédure
        await deleteDoc(procedureRef);

        // Ajouter à l'historique
        await this.addHistory(id, 'deactivated', userId, userName, 'Procédure supprimée');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la procédure:', error);
      throw error;
    }
  }

  // Récupérer toutes les procédures
  async getAllProcedures(): Promise<Procedure[]> {
    try {
      const q = query(
        collection(db, this.proceduresCollection),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return [];
      }
      
      return querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          service: data.service || '',
          type: data.type || 'standard',
          hotels: data.hotels || [],
          assignedUsers: data.assignedUsers || [],
          pdfUrl: data.pdfUrl || null,
          pdfName: data.pdfName || null,
          content: data.content || data.additionalContent || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
          createdBy: data.createdBy || '',
          createdByName: data.createdByName || ''
        } as Procedure;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des procédures:', error);
      // Retourner un tableau vide si la collection n'existe pas encore ou en cas d'erreur
      return [];
    }
  }

  // Récupérer les procédures par service
  async getProceduresByService(service: string): Promise<Procedure[]> {
    try {
      const q = query(
        collection(db, this.proceduresCollection),
        where('service', '==', service),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          service: data.service || '',
          type: data.type || 'standard',
          hotels: data.hotels || [],
          assignedUsers: data.assignedUsers || [],
          pdfUrl: data.pdfUrl || null,
          pdfName: data.pdfName || null,
          content: data.content || data.additionalContent || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
          createdBy: data.createdBy || '',
          createdByName: data.createdByName || ''
        } as Procedure;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des procédures par service:', error);
      throw error;
    }
  }

  // Récupérer les procédures pour un utilisateur spécifique
  async getProceduresForUser(userId: string): Promise<Procedure[]> {
    try {
      // Récupérer toutes les procédures d'abord, puis filtrer côté client
      // pour éviter les problèmes d'index Firestore
      const q = query(
        collection(db, this.proceduresCollection),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() } as Procedure))
        .filter((procedure: any) => {
          // Filtrer par isActive et assignedUsers côté client
          const isActive = procedure.isActive !== undefined ? procedure.isActive : true;
          const isAssigned = procedure.assignedUsers && procedure.assignedUsers.includes(userId);
          return isActive && isAssigned;
        });
    } catch (error) {
      console.error('Erreur lors de la récupération des procédures pour l\'utilisateur:', error);
      throw error;
    }
  }

  // Valider la prise de connaissance d'une procédure
  async acknowledgeProcedure(
    procedureId: string,
    userId: string,
    userName: string,
    userEmail: string,
    hotelId: string,
    hotelName: string
  ): Promise<void> {
    try {
      // Récupérer la procédure pour obtenir sa version actuelle
      const procedureDoc = await getDoc(doc(db, this.proceduresCollection, procedureId));
      const procedureData = procedureDoc.data();
      const currentVersion = procedureData?.version || 1;
      
      const acknowledgment: Omit<ProcedureAcknowledgment, 'id'> = {
        procedureId,
        userId,
        userName,
        userEmail,
        hotelId,
        hotelName,
        acknowledgedAt: Timestamp.now(),
        version: currentVersion
      };

      await addDoc(collection(db, this.acknowledgementsCollection), acknowledgment);

      // Ajouter à l'historique
      await this.addHistory(procedureId, 'acknowledged', userId, userName, `Procédure validée par ${userName} (version ${currentVersion})`);

    } catch (error) {
      console.error('Erreur lors de la validation de la procédure:', error);
      throw error;
    }
  }

  // Vérifier si un utilisateur a validé une procédure
  async hasUserAcknowledged(procedureId: string, userId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.acknowledgementsCollection),
        where('procedureId', '==', procedureId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erreur lors de la vérification de la validation:', error);
      return false;
    }
  }

  // Récupérer les validations d'une procédure
  async getProcedureAcknowledgments(procedureId: string): Promise<ProcedureAcknowledgment[]> {
    try {
      const q = query(
        collection(db, this.acknowledgementsCollection),
        where('procedureId', '==', procedureId),
        orderBy('acknowledgedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as ProcedureAcknowledgment));
    } catch (error) {
      console.error('Erreur lors de la récupération des validations:', error);
      throw error;
    }
  }
  


  // Upload d'un fichier PDF
  async uploadPDF(file: File, procedureId: string): Promise<{ url: string; name: string }> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `procedures/${procedureId}/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        url: downloadURL,
        name: fileName
      };
    } catch (error) {
      console.error('Erreur lors de l\'upload du PDF:', error);
      throw error;
    }
  }

  // Ajouter une entrée à l'historique
  private async addHistory(
    procedureId: string,
    action: ProcedureHistory['action'],
    userId: string,
    userName: string,
    details?: string,
    previousData?: any,
    newData?: any
  ): Promise<void> {
    try {
      // Créer l'objet de base sans les champs optionnels qui pourraient être undefined
      const historyEntry: Omit<ProcedureHistory, 'id'> = {
        procedureId,
        action,
        userId,
        userName,
        timestamp: Timestamp.now()
      };
      
      // Ajouter les champs optionnels seulement s'ils ne sont pas undefined
      if (details !== undefined) historyEntry.details = details;
      if (previousData !== undefined) historyEntry.previousData = previousData;
      if (newData !== undefined) historyEntry.newData = newData;

      await addDoc(collection(db, this.historyCollection), historyEntry);
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'historique:', error);
      // Ne pas faire échouer l'opération principale
    }
  }



  // Analyser les modifications entre l'ancienne et la nouvelle version
  private analyzeChanges(currentData: Procedure, updates: Partial<Procedure>): string[] {
    const changes: string[] = [];
    
    // Vérifier chaque champ modifiable
    if (updates.title && updates.title !== currentData.title) {
      changes.push('Titre');
    }
    
    if (updates.description && updates.description !== currentData.description) {
      changes.push('Description');
    }
    
    if (updates.service && updates.service !== currentData.service) {
      changes.push('Service');
    }
    
    if (updates.type && updates.type !== currentData.type) {
      changes.push('Type');
    }
    
    if (updates.content && updates.content !== currentData.content) {
      changes.push('Contenu');
    }
    
    if (updates.pdfUrl && updates.pdfUrl !== currentData.pdfUrl) {
      changes.push('Document PDF');
    }
    
    // Vérifier les modifications d'hôtels (ajout/suppression)
    if (updates.hotels && JSON.stringify(updates.hotels.sort()) !== JSON.stringify((currentData.hotels || []).sort())) {
      changes.push('Hôtels concernés');
    }
    
    // Vérifier les modifications d'utilisateurs assignés (ajout/suppression)
    if (updates.assignedUsers && JSON.stringify(updates.assignedUsers.sort()) !== JSON.stringify((currentData.assignedUsers || []).sort())) {
      changes.push('Utilisateurs assignés');
    }
    
    return changes;
  }

  // Déterminer si les modifications nécessitent une nouvelle validation
  private shouldRequireRevalidation(modifications: string[]): boolean {
    // Champs qui nécessitent une revalidation (tous sauf ajout d'hôtels/utilisateurs)
    const fieldsRequiringRevalidation = [
      'Titre',
      'Description', 
      'Service',
      'Type',
      'Contenu',
      'Document PDF'
    ];
    
    // Si des hôtels ou utilisateurs sont ajoutés/supprimés, on considère que c'est substantiel
    // mais on peut ajuster cette logique selon les besoins métier
    return modifications.some(mod => fieldsRequiringRevalidation.includes(mod));
  }

  // Modifier la fonction revokeAllAcknowledgments pour accepter un paramètre d'historique
  async revokeAllAcknowledgments(procedureId: string, addToHistory: boolean = true): Promise<void> {
    try {
      // 1. Récupérer toutes les validations pour cette procédure
      const q = query(
        collection(db, this.acknowledgementsCollection),
        where('procedureId', '==', procedureId)
      );
      const querySnapshot = await getDocs(q);
      
      // 2. Supprimer chaque validation
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((docSnapshot: any) => {
        batch.delete(docSnapshot.ref);
      });
      
      // 3. Exécuter le batch
      await batch.commit();
      
      // 4. Ajouter à l'historique seulement si demandé
      if (addToHistory) {
        await this.addHistory(
          procedureId,
          'revoked_acknowledgments',
          'system',
          'Système',
          'Toutes les validations ont été révoquées par un administrateur'
        );
      }
      
    } catch (error) {
      console.error('Erreur lors de la révocation des validations:', error);
      throw error;
    }
  }

  // Fonction utilitaire pour initialiser les versions des procédures existantes
  async initializeProcedureVersions(): Promise<void> {
    try {
      const q = query(collection(db, this.proceduresCollection));
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      let updateCount = 0;
      
      querySnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        if (!data.version) {
          batch.update(doc.ref, { version: 1 });
          updateCount++;
        }
      });
      
      if (updateCount > 0) {
        await batch.commit();
        console.log(`${updateCount} procédures mises à jour avec la version initiale`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des versions:', error);
    }
  }

  // Récupérer l'historique des modifications d'une procédure
  async getProcedureHistory(procedureId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'procedure_history'),
        where('procedureId', '==', procedureId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      // Si l'erreur est due à un index manquant, retourner un tableau vide
      if (error instanceof Error && error.message.includes('index')) {
        console.warn('Index manquant pour procedure_history. Retour d\'un historique vide.');
        return [];
      }
      throw error;
    }
  }
}

export const procedureService = new ProcedureService();
