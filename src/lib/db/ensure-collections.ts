import { collection, getDocs, doc, setDoc, limit, query, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Vérifie si une collection spécifique existe dans Firestore
 * @param collectionName Nom de la collection à vérifier
 * @returns true si la collection contient au moins un document
 */
export const checkCollectionExists = async (collectionName: string): Promise<boolean> => {
  try {
    const q = query(collection(db, collectionName), limit(1));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error(`Error checking if collection ${collectionName} exists:`, error);
    return false;
  }
};

/**
 * Supprime le document factice qui a servi à initialiser la collection
 * @param collectionName Nom de la collection
 */
export const removeDummyDoc = async (collectionName: string): Promise<void> => {
  try {
    const dummyDocRef = doc(db, collectionName, 'dummy_doc');
    await deleteDoc(dummyDocRef);
    console.log(`Dummy document removed from ${collectionName} collection`);
  } catch (error) {
    console.error(`Error removing dummy document from ${collectionName} collection:`, error);
    // Ne pas déclencher d'exception ici, car ce n'est pas critique
  }
};

/**
 * Assure que la collection maintenance existe
 * Crée la collection avec un document factice si elle n'existe pas
 */
export const ensureMaintenanceCollection = async (): Promise<void> => {
  const exists = await checkCollectionExists('maintenance');
  
  if (!exists) {
    console.log('Collection maintenance does not exist. Creating dummy document...');
    try {
      // Créer un document factice qui sera supprimé plus tard
      const dummyDoc = doc(db, 'maintenance', 'dummy_doc');
      await setDoc(dummyDoc, {
        dummy: true,
        message: 'Ce document sert uniquement à initialiser la collection maintenance',
        createdAt: new Date().toISOString(),
      });
      console.log('Collection maintenance initialized successfully');
    } catch (error) {
      console.error('Error initializing maintenance collection:', error);
      throw error;
    }
  } else {
    // La collection existe, vérifions si le document dummy_doc existe et supprimons-le
    try {
      await removeDummyDoc('maintenance');
    } catch (error) {
      console.error('Error checking/removing dummy doc:', error);
    }
  }
};

/**
 * Vérifie l'existence des collections principales et les crée si nécessaire
 * Utile lors du démarrage de l'application
 */
export const ensureAllCollections = async (): Promise<void> => {
  try {
    await ensureMaintenanceCollection();
    // Ajouter d'autres collections ici si nécessaire
  } catch (error) {
    console.error('Error ensuring collections exist:', error);
    throw error;
  }
};