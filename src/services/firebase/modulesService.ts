import {
  collection,
  getDocs,
  doc,
  addDoc,
  setDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { appModules } from '../../types/users';

export interface FirebaseModule {
  id: string;
  active: boolean;
  code: string;
  icon: string;
  label: string;
  order: number;
  path: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ModulesService {
  async getModules(): Promise<FirebaseModule[]> {
    try {
      const q = query(
        collection(db, 'modules'),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
        };
      }) as FirebaseModule[];
    } catch (error) {
      console.error('Error getting modules:', error);
      throw error;
    }
  }

  async initializeAppModules(): Promise<void> {
    try {
      console.log('Initialisation des modules de l\'application...');
      
      // Vérifier quels modules existent déjà
      const existingModules = await this.getModules();
      const existingModuleIds = existingModules.map(m => m.id);
      
      console.log('Modules existants:', existingModuleIds);
      
      // Créer les modules manquants
      const modulesToCreate = appModules.filter(module => 
        !existingModuleIds.includes(module.key)
      );
      
      console.log('Modules à créer:', modulesToCreate.map(m => m.key));
      
      if (modulesToCreate.length === 0) {
        console.log('Tous les modules existent déjà.');
        return;
      }

      // Créer chaque module manquant
      for (let i = 0; i < modulesToCreate.length; i++) {
        const module = modulesToCreate[i];
        const moduleData = {
          active: true,
          code: module.key.replace('mod', '').replace(/\d+/, module.label.toLowerCase().replace(/\s+/g, '_').replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/[ç]/g, 'c')),
          icon: module.icon,
          label: module.label,
          order: parseInt(module.key.replace('mod', '')) - 19, // mod20 = order 1, mod21 = order 2, etc.
          path: module.path,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // Créer le document avec l'ID spécifique
        const docRef = doc(db, 'modules', module.key);
        await setDoc(docRef, moduleData);
        
        console.log(`Module ${module.key} (${module.label}) créé avec succès`);
      }
      
      console.log(`${modulesToCreate.length} module(s) créé(s) avec succès!`);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des modules:', error);
      throw error;
    }
  }

  async checkAndInitializeModules(): Promise<boolean> {
    try {
      const existingModules = await this.getModules();
      const appModuleIds = appModules.map(m => m.key);
      const missingModules = appModuleIds.filter(id => 
        !existingModules.find(m => m.id === id)
      );
      
      if (missingModules.length > 0) {
        console.log(`${missingModules.length} module(s) manquant(s) détecté(s). Initialisation...`);
        await this.initializeAppModules();
        return true; // Modules initialisés
      }
      
      return false; // Aucun module manquant
    } catch (error) {
      console.error('Erreur lors de la vérification des modules:', error);
      return false;
    }
  }

  // Méthode pour obtenir les modules accessibles pour un utilisateur
  async getAccessibleModules(userModules: string[]): Promise<FirebaseModule[]> {
    try {
      const allModules = await this.getModules();
      return allModules.filter(module => 
        userModules.includes(module.id) && module.active
      );
    } catch (error) {
      console.error('Error getting accessible modules:', error);
      return [];
    }
  }

  // Méthode pour obtenir tous les modules de l'application (pour les admins)
  async getAllAppModules(): Promise<FirebaseModule[]> {
    try {
      const allModules = await this.getModules();
      const appModuleIds = appModules.map(m => m.key);
      return allModules.filter(module => 
        appModuleIds.includes(module.id) && module.active
      );
    } catch (error) {
      console.error('Error getting all app modules:', error);
      return [];
    }
  }
}

export const modulesService = new ModulesService();