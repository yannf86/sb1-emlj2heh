import {
  collection,
  getDocs,
  query,
  where,
  limit,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { LostItem, LostItemStats, LostItemAnalytics } from '../../types/lostItems';
import { permissionsService } from './permissionsService';
import { historyService } from './historyService';

class LostItemsService {
  // Collection Firestore pour les objets trouvés
  private static COLLECTION_NAME = 'lost_items';

  async getLostItems(
    userEmail: string,
    hotelFilter?: string,
    statusFilter?: string
  ): Promise<LostItem[]> {
    try {
      console.log('💶 [LostItemsService] getLostItems called with:', { userEmail, hotelFilter, statusFilter });
      
      // SOLUTION SIMPLIFIÉE SELON LA MÉMOIRE 21e8e264
      // 1. Convertir hotelFilter en hotelFilterForServices comme dans dashboardService
      const hotelFilterForServices = hotelFilter === 'all' ? 'all' : hotelFilter;
      console.log('💼 [LostItemsService] hotelFilterForServices:', hotelFilterForServices);
      
      // 2. Récupérer les hôtels autorisés pour cet utilisateur
      const allowedHotels = await permissionsService.applyHotelFilter(userEmail, hotelFilterForServices);
      console.log('🏨 [LostItemsService] Allowed hotels:', allowedHotels);

      // Vérifier si l'utilisateur a des permissions
      if (allowedHotels.length === 0) {
        console.log('🚫 [LostItemsService] No allowed hotels for user');
        return [];
      }

      // Déterminer si l'utilisateur est admin
      const isAdmin = allowedHotels.includes('all');
      console.log('👤 [LostItemsService] isAdmin:', isAdmin);
      
      // Préparer les contraintes de la requête
      const constraints: any[] = [];
      
      // 3. Logique de filtrage simplifiée
      if (isAdmin && (!hotelFilter || hotelFilter === 'all')) {
        // Admin avec "Tous les hôtels" - pas de contrainte
        console.log('👑 [LostItemsService] Admin avec "Tous les hôtels" - aucun filtre');
        // Pas de contrainte sur hotelId
      } else if (hotelFilter && hotelFilter !== 'all') {
        // Filtre sur un hôtel spécifique
        console.log('🏨 [LostItemsService] Filtre sur hôtel spécifique:', hotelFilter);
        constraints.push(where('hotelId', '==', hotelFilter));
      } else if (!isAdmin) {
        // Non-admin avec "Tous les hôtels" - filtrer sur les hôtels autorisés
        if (allowedHotels.length === 1) {
          console.log('🏨 [LostItemsService] Un seul hôtel autorisé:', allowedHotels[0]);
          constraints.push(where('hotelId', '==', allowedHotels[0]));
        } else if (allowedHotels.length <= 10) {
          console.log('🏨 [LostItemsService] Plusieurs hôtels (≤10):', allowedHotels);
          constraints.push(where('hotelId', 'in', allowedHotels));
        } else {
          console.log('🏨 [LostItemsService] Trop d\'hôtels (>10) - filtrage côté client');
          // Filtrage côté client plus tard
        }
      }

      // Filtrage par statut
      if (statusFilter && statusFilter !== 'all') {
        console.log('🚨 [LostItemsService] Filtre de statut:', statusFilter);
        constraints.push(where('status', '==', statusFilter));
      }
      
      // 4. Toujours faire le tri côté client pour éviter les erreurs d'index composite
      // Note: nous ne faisons plus de tri côté serveur pour éviter les erreurs d'index composite
      
      // 5. Ajouter une limite pour éviter les problèmes de performance
      if (constraints.length === 0) {
        console.log('🔍 [LostItemsService] Aucune contrainte, ajout d\'une limite');
        constraints.push(limit(100));
      } else {
        // Ajouter une limite même avec des contraintes
        constraints.push(limit(100));
      }

      // DIAGNOSTIC: Afficher les contraintes de la requête
      console.log('📚 [LostItemsService] Contraintes de la requête:');
      constraints.forEach((constraint, index) => {
        console.log(`  - Contrainte ${index + 1}:`, constraint.toString());
      });
      
      const q = query(collection(db, LostItemsService.COLLECTION_NAME), ...constraints);
      console.log('📚 [LostItemsService] Query sur collection:', LostItemsService.COLLECTION_NAME);

      console.log('🔎 [LostItemsService] Exécution de la requête Firestore...');
      const querySnapshot = await getDocs(q);
      console.log('💾 [LostItemsService] Résultat de la requête:', querySnapshot.docs.length, 'documents');
      
      // DIAGNOSTIC: Si aucun résultat, essayer une requête sans contraintes
      if (querySnapshot.docs.length === 0) {
        console.log('🚨 [LostItemsService] Aucun résultat avec les contraintes. Test sans contraintes...');
        const testQuery = query(collection(db, LostItemsService.COLLECTION_NAME), limit(10));
        const testSnapshot = await getDocs(testQuery);
        console.log('🚨 [LostItemsService] Test sans contraintes:', testSnapshot.docs.length, 'documents');
        
        if (testSnapshot.docs.length > 0) {
          console.log('🚨 [LostItemsService] Problème de filtrage détecté! Voici un exemple de document:');
          const firstDoc = testSnapshot.docs[0];
          console.log({
            id: firstDoc.id,
            hotelId: firstDoc.data().hotelId,
            ...firstDoc.data()
          });
        }
      }

      let items = querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        
        // Conversion sécurisée des dates
        let discoveryDate: Date;
        let returnedDate: Date | undefined;
        let createdAt: Date;
        let updatedAt: Date;

        try {
          discoveryDate = data.discoveryDate instanceof Timestamp 
            ? data.discoveryDate.toDate() 
            : data.discoveryDate instanceof Date
              ? data.discoveryDate
              : typeof data.discoveryDate === 'string' || typeof data.discoveryDate === 'number'
                ? new Date(data.discoveryDate)
                : new Date();
                
          // Vérifier si la date est valide
          if (isNaN(discoveryDate.getTime())) {
            console.warn('🚨 [LostItemsService] Invalid discoveryDate for doc', doc.id, ':', data.discoveryDate);
            discoveryDate = new Date();
          }
        } catch (e) {
          console.warn('🚨 [LostItemsService] Error parsing discoveryDate for doc', doc.id, ':', data.discoveryDate, e);
          discoveryDate = new Date();
        }

        try {
          returnedDate = data.returnedDate 
            ? (data.returnedDate instanceof Timestamp 
                ? data.returnedDate.toDate() 
                : data.returnedDate instanceof Date
                  ? data.returnedDate
                  : typeof data.returnedDate === 'string' || typeof data.returnedDate === 'number'
                    ? new Date(data.returnedDate)
                    : undefined)
            : undefined;
                
          // Vérifier si la date est valide
          if (returnedDate && isNaN(returnedDate.getTime())) {
            console.warn('🚨 [LostItemsService] Invalid returnedDate for doc', doc.id, ':', data.returnedDate);
            returnedDate = undefined;
          }
        } catch (e) {
          console.warn('🚨 [LostItemsService] Error parsing returnedDate for doc', doc.id, ':', data.returnedDate, e);
          returnedDate = undefined;
        }

        try {
          createdAt = data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate() 
            : data.createdAt instanceof Date
              ? data.createdAt
              : typeof data.createdAt === 'string' || typeof data.createdAt === 'number'
                ? new Date(data.createdAt)
                : new Date();
                
          // Vérifier si la date est valide
          if (isNaN(createdAt.getTime())) {
            console.warn('🚨 [LostItemsService] Invalid createdAt for doc', doc.id, ':', data.createdAt);
            createdAt = new Date();
          }
        } catch (e) {
          console.warn('🚨 [LostItemsService] Error parsing createdAt for doc', doc.id, ':', data.createdAt, e);
          createdAt = new Date();
        }

        try {
          updatedAt = data.updatedAt instanceof Timestamp 
            ? data.updatedAt.toDate() 
            : data.updatedAt instanceof Date
              ? data.updatedAt
              : typeof data.updatedAt === 'string' || typeof data.updatedAt === 'number'
                ? new Date(data.updatedAt)
                : new Date();
                
          // Vérifier si la date est valide
          if (isNaN(updatedAt.getTime())) {
            console.warn('🚨 [LostItemsService] Invalid updatedAt for doc', doc.id, ':', data.updatedAt);
            updatedAt = new Date();
          }
        } catch (e) {
          console.warn('🚨 [LostItemsService] Error parsing updatedAt for doc', doc.id, ':', data.updatedAt, e);
          updatedAt = new Date();
        }

        return {
          id: doc.id,
          ...data,
          discoveryDate,
          returnedDate,
          createdAt,
          updatedAt,
        };
      }) as LostItem[];

      // Filtrage supplémentaire côté client si nécessaire (pour plus de 10 hôtels)
      console.log('🔍 [LostItemsService] Filtrage final - isAdmin:', isAdmin, 'hotelFilter:', hotelFilter, 'allowedHotels:', allowedHotels);
      console.log('🔍 [LostItemsService] Items avant filtrage:', items.length, 'items');
      
      // Filtrage côté client pour les cas spéciaux
      let filteredItems = items;
      
      // DIAGNOSTIC: Vérifier les hotelId dans les items récupérés
      if (items.length > 0) {
        const hotelIds = [...new Set(items.map(item => {
          const hotelIdValue = item.hotelId;
          return typeof hotelIdValue === 'string' ? hotelIdValue : 'unknown';
        }))];
        console.log('🔍 [LostItemsService] HotelIds dans les résultats:', hotelIds);
      }
      
      // Filtrage côté client selon la mémoire 76c71f77
      if (hotelFilter && hotelFilter !== 'all') {
        // Filtre sur un hôtel spécifique - déjà filtré par Firestore
        console.log('✅ [LostItemsService] Hôtel spécifique - déjà filtré par Firestore');
      } else if (isAdmin) {
        // Admin avec filtre "Tous les hôtels" - voir tous les objets
        console.log('✅ [LostItemsService] Admin avec "Tous les hôtels" - pas de filtrage côté client');
      } else if (!isAdmin && allowedHotels.length > 10) {
        // Non-admin avec >10 hôtels - filtrer côté client
        console.log('🔢 [LostItemsService] Non-admin avec >10 hôtels - filtrage côté client');
        filteredItems = items.filter(item => allowedHotels.includes(item.hotelId));
        console.log('📊 [LostItemsService] Après filtrage:', filteredItems.length, 'objets sur', items.length);
      } else {
        // Non-admin avec ≤10 hôtels - déjà filtré par Firestore
        console.log('✅ [LostItemsService] Non-admin avec ≤10 hôtels - déjà filtré par Firestore');
      }

      // Tri côté client (toujours nécessaire pour éviter les erreurs d'index composite)
      console.log('📊 [LostItemsService] Tri côté client par date de découverte');
      filteredItems.sort((a, b) => {
        const dateA = a.discoveryDate ? new Date(a.discoveryDate).getTime() : 0;
        const dateB = b.discoveryDate ? new Date(b.discoveryDate).getTime() : 0;
        return dateB - dateA;
      });

      console.log('✅ [LostItemsService] Returning', filteredItems.length, 'filtered items');
      console.log('🔄🔄 [LostItemsService] getLostItems FIN - retourne', filteredItems.length, 'objets');
      return filteredItems;
    } catch (error) {
      console.error('❌ [LostItemsService] Error getting lost items:', error);
      return [];
    }
  }

  // Méthode utilisée par LostItems.tsx - NE PAS RENOMMER
  async addLostItem(lostItem: Omit<LostItem, 'id'>, photo?: File): Promise<string> {
    try {
      let photoUrl = '';

      // Upload photo if provided
      if (photo) {
        // Générer un nom de fichier sécurisé avec timestamp pour éviter les collisions
        const timestamp = Date.now();
        const fileExtension = photo.name.split('.').pop() || 'jpg';
        const fileName = `lost_items/${timestamp}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        
        const photoRef = ref(storage, fileName);
        const snapshot = await uploadBytes(photoRef, photo);
        photoUrl = await getDownloadURL(snapshot.ref);
        console.log(`📸 [LostItemsService] Photo uploadée avec succès: ${photoUrl}`);
      }

      // Préparer les données à sauvegarder dans Firestore
      const firestoreData: any = {
        ...lostItem,
        discoveryDate: Timestamp.fromDate(lostItem.discoveryDate),
        photoUrl,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Gestion spécifique des champs de restitution selon le statut
      if (lostItem.status === 'returned') {
        // Si le statut est "returned" mais qu'aucune date n'est fournie, utiliser la date actuelle
        firestoreData.returnedDate = lostItem.returnedDate 
          ? Timestamp.fromDate(lostItem.returnedDate) 
          : Timestamp.now();
        
        // S'assurer que returnedById est toujours présent pour le statut "returned"
        firestoreData.returnedById = lostItem.returnedById || '';
        
        // S'assurer que returnedNotes est toujours présent (peut être vide)
        firestoreData.returnedNotes = lostItem.returnedNotes || '';
        
        console.log('📝 [LostItemsService] Ajout d\'un objet avec statut "Rendu", champs de restitution inclus');
      } else {
        // Pour les autres statuts, initialiser les champs de restitution à null/vide
        firestoreData.returnedDate = null;
        firestoreData.returnedById = null;
        firestoreData.returnedNotes = '';
      }

      console.log(`📝 [LostItemsService] Ajout d'un objet trouvé dans la collection: ${LostItemsService.COLLECTION_NAME}`);
      const docRef = await addDoc(collection(db, LostItemsService.COLLECTION_NAME), firestoreData);
      
      // Enregistrer l'historique de création
      try {
        await historyService.addLostItemHistory(
          docRef.id,
          null, // Pas d'état précédent pour une création
          firestoreData,
          lostItem.foundById,
          'create'
        );
        console.log(`📝 [LostItemsService] Historique de création enregistré pour l'objet trouvé: ${docRef.id}`);
      } catch (historyError) {
        console.error('❌ Erreur lors de l\'enregistrement de l\'historique de création:', historyError);
        // On ne propage pas cette erreur pour ne pas bloquer la création de l'objet
      }
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding lost item:', error);
      throw error;
    }
  }

  async updateLostItem(
    id: string, 
    lostItem: Partial<LostItem>, 
    photo?: File,
    deletePhoto?: boolean
  ): Promise<void> {
    try {
      // Récupérer d'abord l'objet actuel pour avoir les données complètes
      const docRef = doc(db, LostItemsService.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Objet trouvé avec l'ID ${id} n'existe pas`);
      }
      
      const currentItem = docSnap.data() as LostItem;
      
      const updateData: any = {
        ...lostItem,
        updatedAt: Timestamp.now(),
      };

      // Gestion des dates
      if (lostItem.discoveryDate) {
        updateData.discoveryDate = Timestamp.fromDate(lostItem.discoveryDate);
      }

      // Gestion spécifique des champs de restitution selon le statut
      if (lostItem.status === 'returned') {
        // Si le statut est "returned", s'assurer que tous les champs de restitution sont présents
        
        // Pour la date de restitution: utiliser celle fournie ou la date actuelle
        updateData.returnedDate = lostItem.returnedDate 
          ? Timestamp.fromDate(lostItem.returnedDate) 
          : Timestamp.now();
        
        // S'assurer que returnedById est toujours présent (peut être vide)
        updateData.returnedById = lostItem.returnedById !== undefined 
          ? lostItem.returnedById 
          : currentItem.returnedById || '';
        
        // S'assurer que returnedNotes est toujours présent (peut être vide)
        updateData.returnedNotes = lostItem.returnedNotes !== undefined 
          ? lostItem.returnedNotes 
          : currentItem.returnedNotes || '';
        
        console.log('📝 [LostItemsService] Mise à jour avec statut "Rendu", champs de restitution inclus');
      } else if (lostItem.status === 'conserved' || lostItem.status === 'conserve') {
        // Si le statut est "conserved" ou "conserve", réinitialiser les champs de restitution
        // Cela est important quand on passe de "returned" à "conserved"
        updateData.returnedDate = null;
        updateData.returnedById = null;
        updateData.returnedNotes = '';
        
        console.log('📝 [LostItemsService] Mise à jour avec statut "Conservé", champs de restitution réinitialisés');
      } else if (lostItem.returnedDate) {
        // Si une date de restitution est fournie mais pas de statut "returned"
        updateData.returnedDate = Timestamp.fromDate(lostItem.returnedDate);
      }

      // Gérer la suppression de photo
      if (deletePhoto === true) {
        console.log(`🗑️ [LostItemsService] Suppression de la photo demandée. URL actuelle: ${currentItem.photoUrl}`);
        
        if (currentItem.photoUrl) {
          try {
            // Extraire le chemin de stockage à partir de l'URL complète
            // L'URL peut être soit un chemin direct dans le stockage, soit une URL complète
            let storagePath = currentItem.photoUrl;
            
            // Si l'URL commence par https://firebasestorage.googleapis.com, c'est une URL complète
            // Nous devons extraire le chemin relatif
            if (storagePath.startsWith('https://')) {
              try {
                // Essayer d'extraire le chemin à partir de l'URL
                const url = new URL(storagePath);
                const fullPath = decodeURIComponent(url.pathname.split('/o/')[1]);
                if (fullPath) {
                  storagePath = fullPath.split('?')[0]; // Enlever les paramètres de requête
                  console.log(`🗑️ [LostItemsService] Chemin de stockage extrait: ${storagePath}`);
                }
              } catch (parseError) {
                console.error('❌ Erreur lors de l\'analyse de l\'URL de la photo:', parseError);
              }
            }
            
            const photoRef = ref(storage, storagePath);
            await deleteObject(photoRef);
            console.log('✅ [LostItemsService] Photo supprimée avec succès du stockage');
          } catch (error) {
            console.error('❌ Erreur lors de la suppression de la photo du stockage:', error);
          }
        }
        
        // Toujours mettre à jour le champ photoUrl à vide, même si la suppression a échoué
        updateData.photoUrl = '';
        console.log('✅ [LostItemsService] Champ photoUrl réinitialisé à vide');
      }

      // Gérer l'upload de photo
      if (photo) {
        // Supprimer l'ancienne photo si elle existe
        if (currentItem.photoUrl) {
          try {
            console.log(`🔄 [LostItemsService] Remplacement de la photo: ${currentItem.photoUrl}`);
            const oldPhotoRef = ref(storage, currentItem.photoUrl);
            await deleteObject(oldPhotoRef);
          } catch (error) {
            console.error('❌ Erreur lors de la suppression de l\'ancienne photo:', error);
          }
        }

        // Upload de la nouvelle photo avec un nom de fichier sécurisé
        const timestamp = Date.now();
        const fileExtension = photo.name.split('.').pop() || 'jpg';
        const fileName = `lost_items/${timestamp}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        
        const photoRef = ref(storage, fileName);
        const snapshot = await uploadBytes(photoRef, photo);
        updateData.photoUrl = await getDownloadURL(snapshot.ref);
        console.log(`📸 [LostItemsService] Nouvelle photo uploadée: ${updateData.photoUrl}`);
      }

      // Mettre à jour le document
      await updateDoc(docRef, updateData);
      console.log(`📝 [LostItemsService] Objet trouvé mis à jour avec succès: ${id}`);
      
      // Enregistrer l'historique de modification
      try {
        await historyService.addLostItemHistory(
          id,
          currentItem,
          { ...currentItem, ...updateData },
          lostItem.updatedById || currentItem.updatedById || currentItem.foundById,
          'update'
        );
        console.log(`📝 [LostItemsService] Historique de modification enregistré pour l'objet trouvé: ${id}`);
      } catch (historyError) {
        console.error('❌ Erreur lors de l\'enregistrement de l\'historique de modification:', historyError);
        // On ne propage pas cette erreur pour ne pas bloquer la mise à jour de l'objet
      }
    } catch (error) {
      console.error(' Erreur lors de la mise à jour de l\'objet trouvé:', error);
      throw error;
    }
  }

  async deleteLostItem(id: string, userId: string): Promise<void> {
    try {
      // Récupérer d'abord l'objet pour avoir les données complètes (notamment l'URL de la photo)
      const docRef = doc(db, LostItemsService.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Objet trouvé avec l'ID ${id} n'existe pas`);
      }
      
      const lostItem = docSnap.data() as LostItem;
      
      // Enregistrer l'historique de suppression avant de supprimer l'objet
      try {
        await historyService.addLostItemHistory(
          id,
          lostItem,
          null, // Pas d'état suivant pour une suppression
          userId,
          'delete'
        );
        console.log(` [LostItemsService] Historique de suppression enregistré pour l'objet trouvé: ${id}`);
      } catch (historyError) {
        console.error(' Erreur lors de l\'enregistrement de l\'historique de suppression:', historyError);
        // On ne propage pas cette erreur pour ne pas bloquer la suppression de l'objet
      }
      
      // Si l'objet a une photo, la supprimer du stockage
      if (lostItem.photoUrl) {
        try {
          // Extraire le chemin de stockage à partir de l'URL complète
          let storagePath = lostItem.photoUrl;
          
          // Si l'URL commence par https://firebasestorage.googleapis.com, c'est une URL complète
          if (storagePath.startsWith('https://firebasestorage.googleapis.com')) {
            // Extraire le chemin après /o/ et avant ?
            const match = storagePath.match(/\/o\/(.+?)\?/);
            if (match && match[1]) {
              // Décoder l'URL
              storagePath = decodeURIComponent(match[1]);
            } else {
              console.warn(' [LostItemsService] Impossible d\'extraire le chemin de stockage de l\'URL:', storagePath);
            }
          }
          
          console.log(` [LostItemsService] Suppression de la photo: ${storagePath}`);
          const photoRef = ref(storage, storagePath);
          await deleteObject(photoRef);
          console.log(' [LostItemsService] Photo supprimée avec succès');
        } catch (photoError) {
          console.error(' Erreur lors de la suppression de la photo:', photoError);
          // On continue malgré l'erreur de suppression de la photo
        }
      }
      
      // Supprimer le document
      await deleteDoc(docRef);
      console.log(` [LostItemsService] Objet trouvé supprimé avec succès: ${id}`);
    } catch (error) {
      console.error(' Erreur lors de la suppression de l\'objet trouvé:', error);
      throw error;
    }
  }

  async markAsReturned(id: string, returnedById: string, returnedNotes?: string): Promise<void> {
    try {
      const docRef = doc(db, 'lost_items', id);
      await updateDoc(docRef, {
        status: 'returned',
        returnedById,
        returnedDate: Timestamp.now(),
        returnedNotes: returnedNotes || '',
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error marking item as returned:', error);
      throw error;
    }
  }

  async getLostItemStats(userEmail: string, hotelFilter?: string): Promise<LostItemStats> {
    try {
      const items = await this.getLostItems(userEmail, hotelFilter);
      
      const total = items.length;
      const conserved = items.filter(i => i.status === 'conserved').length;
      const returned = items.filter(i => i.status === 'returned').length;
      const returnRate = total > 0 ? Math.round((returned / total) * 100) : 0;

      // Group by type
      const byType: { [key: string]: number } = {};
      items.forEach(item => {
        byType[item.itemTypeId] = (byType[item.itemTypeId] || 0) + 1;
      });

      // Group by hotel
      const byHotel: { [key: string]: number } = {};
      items.forEach(item => {
        byHotel[item.hotelId] = (byHotel[item.hotelId] || 0) + 1;
      });

      return {
        total,
        conserved,
        returned,
        byType,
        byHotel,
        returnRate
      };
    } catch (error) {
      console.error('Error getting lost item stats:', error);
      throw error;
    }
  }

  async getLostItemAnalytics(userEmail: string, hotelFilter?: string): Promise<LostItemAnalytics> {
    try {
      const items = await this.getLostItems(userEmail, hotelFilter);

      // Analytics by type
      const typeMap = new Map<string, number>();
      items.forEach(item => {
        typeMap.set(item.itemTypeId, (typeMap.get(item.itemTypeId) || 0) + 1);
      });

      const typeColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
      const byType = Array.from(typeMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: typeColors[index % typeColors.length]
      }));

      // Analytics by status
      const statusMap = new Map<string, number>();
      items.forEach(item => {
        statusMap.set(item.status, (statusMap.get(item.status) || 0) + 1);
      });

      const statusColors = ['#10B981', '#F59E0B', '#EF4444'];
      const byStatus = Array.from(statusMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: statusColors[index % statusColors.length]
      }));

      // Monthly trends
      const monthlyData = new Map<string, number>();
      items.forEach(item => {
        const month = item.discoveryDate.toISOString().slice(0, 7); // YYYY-MM
        monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
      });

      const monthlyTrends = Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
          month,
          count
        }));

      return {
        byType,
        byStatus,
        monthlyTrends
      };
    } catch (error) {
      console.error('Error getting lost item analytics:', error);
      throw error;
    }
  }
}

export const lostItemsService = new LostItemsService();