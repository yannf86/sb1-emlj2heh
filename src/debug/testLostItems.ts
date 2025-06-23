import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function testLostItemsCollection() {
  console.log('🧪 [DEBUG] Testing lost_items collection...');
  
  try {
    // Test 1: Vérifier si la collection existe et contient des documents
    console.log('📋 [DEBUG] Test 1: Basic collection query');
    const basicQuery = collection(db, 'lost_items');
    const basicSnapshot = await getDocs(basicQuery);
    
    console.log('📊 [DEBUG] Basic query results:', {
      size: basicSnapshot.size,
      empty: basicSnapshot.empty,
      docs: basicSnapshot.docs.length
    });

    if (!basicSnapshot.empty) {
      console.log('📄 [DEBUG] First document sample:', {
        id: basicSnapshot.docs[0].id,
        data: basicSnapshot.docs[0].data()
      });
    }

    // Test 2: Tester la requête avec orderBy (comme dans le service)
    console.log('📋 [DEBUG] Test 2: Query with orderBy');
    try {
      const orderedQuery = query(
        collection(db, 'lost_items'),
        orderBy('discoveryDate', 'desc')
      );
      const orderedSnapshot = await getDocs(orderedQuery);
      
      console.log('📊 [DEBUG] Ordered query results:', {
        size: orderedSnapshot.size,
        empty: orderedSnapshot.empty,
        docs: orderedSnapshot.docs.length
      });

      if (!orderedSnapshot.empty) {
        console.log('📄 [DEBUG] Ordered query first document:', {
          id: orderedSnapshot.docs[0].id,
          data: orderedSnapshot.docs[0].data()
        });
      }
    } catch (orderError) {
      console.error('❌ [DEBUG] Error with ordered query:', orderError);
      console.log('💡 [DEBUG] This might indicate missing Firestore index for discoveryDate field');
    }

    // Test 3: Lister toutes les collections disponibles
    console.log('📋 [DEBUG] Test 3: Available collections check');
    // Note: listCollections n'est pas disponible côté client, mais on peut tester d'autres collections connues
    
    return {
      basicQueryWorked: !basicSnapshot.empty,
      orderedQueryWorked: true,
      documentCount: basicSnapshot.size
    };

  } catch (error) {
    console.error('❌ [DEBUG] Error testing lost_items collection:', error);
    return {
      basicQueryWorked: false,
      orderedQueryWorked: false,
      documentCount: 0,
      error: error
    };
  }
}

// Fonction pour créer un objet trouvé de test
export async function createTestLostItem() {
  console.log('🧪 [DEBUG] Creating test lost item...');
  
  try {
    const { addDoc, collection, Timestamp } = await import('firebase/firestore');
    
    const testItem = {
      description: 'Test item - Clés trouvées dans le hall',
      category: 'Clés',
      location: 'Hall principal',
      discoveryDate: Timestamp.now(),
      status: 'found',
      hotelId: 'test-hotel-id',
      discoveredBy: 'Test User',
      contactInfo: 'test@example.com',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      photoUrl: '',
      returnedDate: null,
      returnedTo: '',
      notes: 'Objet de test créé pour déboguer le module'
    };

    const docRef = await addDoc(collection(db, 'lost_items'), testItem);
    console.log('✅ [DEBUG] Test item created with ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ [DEBUG] Error creating test item:', error);
    throw error;
  }
}
