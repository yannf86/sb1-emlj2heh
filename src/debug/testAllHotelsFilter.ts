import { lostItemsService } from '../services/firebase/lostItemsService';
import { permissionsService } from '../services/firebase/permissionsService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Script de test pour diagnostiquer le problème du filtre "Tous les hôtels"
 */
export async function testAllHotelsFilter(userEmail: string) {
  console.log('🔍 [TEST] Démarrage du test pour le filtre "Tous les hôtels"');
  console.log('👤 [TEST] Utilisateur:', userEmail);
  
  try {
    // Test 1: Vérifier les permissions de l'utilisateur
    console.log('\n📋 [TEST] Test 1: Vérification des permissions utilisateur');
    const user = await permissionsService.getCurrentUser(userEmail);
    console.log('👤 [TEST] Utilisateur trouvé:', user ? 'Oui' : 'Non');
    if (user) {
      console.log('👤 [TEST] Rôle:', user.role);
      console.log('👤 [TEST] Hôtels autorisés:', user.hotels);
      console.log('👤 [TEST] Est admin:', user.role === 'system_admin' ? 'Oui' : 'Non');
    }
    
    // Test 2: Vérifier les hôtels accessibles
    console.log('\n📋 [TEST] Test 2: Vérification des hôtels accessibles');
    const accessibleHotels = await permissionsService.getAccessibleHotels(userEmail);
    console.log('🏨 [TEST] Hôtels accessibles:', accessibleHotels);
    console.log('🏨 [TEST] Est admin (all):', accessibleHotels.includes('all') ? 'Oui' : 'Non');
    
    // Test 3: Vérifier l'application du filtre hôtel
    console.log('\n📋 [TEST] Test 3: Application du filtre hôtel');
    const hotelFilter = 'all';
    const filteredHotels = await permissionsService.applyHotelFilter(userEmail, hotelFilter);
    console.log('🏨 [TEST] Filtre demandé:', hotelFilter);
    console.log('🏨 [TEST] Hôtels filtrés:', filteredHotels);
    
    // Test 4: Vérifier la collection lost_items directement
    console.log('\n📋 [TEST] Test 4: Vérification directe de la collection lost_items');
    const lostItemsSnapshot = await getDocs(collection(db, 'lost_items'));
    console.log('📊 [TEST] Nombre total d\'objets trouvés dans Firestore:', lostItemsSnapshot.size);
    
    if (lostItemsSnapshot.size > 0) {
      // Extraire les hôtels uniques pour voir quels hôtels sont présents
      const uniqueHotels = new Set<string>();
      lostItemsSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        if (data.hotelId) uniqueHotels.add(data.hotelId);
      });
      console.log('🏨 [TEST] Hôtels présents dans la collection:', Array.from(uniqueHotels));
      
      // Afficher un échantillon de document
      const sampleDoc = lostItemsSnapshot.docs[0].data();
      console.log('📄 [TEST] Exemple de document:', {
        id: lostItemsSnapshot.docs[0].id,
        hotelId: sampleDoc.hotelId,
        description: sampleDoc.description,
        discoveryDate: sampleDoc.discoveryDate
      });
    }
    
    // Test 5: Tester le service avec différents filtres
    console.log('\n📋 [TEST] Test 5: Test du service avec différents filtres');
    
    // 5.1 - Filtre "Tous les hôtels"
    console.log('\n🔍 [TEST] 5.1 - Filtre "Tous les hôtels"');
    const allHotelsItems = await lostItemsService.getLostItems(userEmail, 'all');
    console.log('📊 [TEST] Nombre d\'objets avec filtre "all":', allHotelsItems.length);
    
    // 5.2 - Sans filtre (devrait être équivalent à "all")
    console.log('\n🔍 [TEST] 5.2 - Sans filtre');
    const noFilterItems = await lostItemsService.getLostItems(userEmail);
    console.log('📊 [TEST] Nombre d\'objets sans filtre:', noFilterItems.length);
    
    // 5.3 - Si des hôtels sont disponibles, tester avec un hôtel spécifique
    if (accessibleHotels.length > 0 && accessibleHotels[0] !== 'all') {
      const specificHotel = accessibleHotels[0];
      console.log('\n🔍 [TEST] 5.3 - Filtre sur hôtel spécifique:', specificHotel);
      const specificHotelItems = await lostItemsService.getLostItems(userEmail, specificHotel);
      console.log('📊 [TEST] Nombre d\'objets pour hôtel spécifique:', specificHotelItems.length);
    }
    
    return {
      success: true,
      allHotelsCount: allHotelsItems.length,
      noFilterCount: noFilterItems.length,
      totalInFirestore: lostItemsSnapshot.size,
      accessibleHotels
    };
    
  } catch (error) {
    console.error('❌ [TEST] Erreur lors du test:', error);
    return {
      success: false,
      error
    };
  }
}

// Fonction pour exécuter le test avec un utilisateur spécifique
export function runTest(userEmail: string) {
  console.log('🧪 [TEST] Exécution du test pour:', userEmail);
  return testAllHotelsFilter(userEmail)
    .then(result => {
      console.log('\n✅ [TEST] Résultat du test:', result);
      return result;
    })
    .catch(error => {
      console.error('\n❌ [TEST] Erreur lors de l\'exécution du test:', error);
      return { success: false, error };
    });
}
