// Script de test pour le filtre "Tous les hôtels" dans le module "Objets trouvés"
// Pour exécuter: node testLostItemsFilter.js

// Importer les modules nécessaires
const firebase = require('firebase/app');
require('firebase/firestore');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Configuration Firebase (à remplacer par vos propres valeurs)
const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "votre-auth-domain",
  projectId: "votre-project-id",
  storageBucket: "votre-storage-bucket",
  messagingSenderId: "votre-messaging-sender-id",
  appId: "votre-app-id"
};

// Initialiser Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fonction de test
async function testLostItemsCollection() {
  console.log('🧪 [TEST] Démarrage du test pour la collection lost_items');
  
  try {
    // Récupérer tous les objets trouvés
    const lostItemsRef = collection(db, 'lost_items');
    const snapshot = await getDocs(lostItemsRef);
    
    console.log(`📊 [TEST] Nombre total d'objets trouvés: ${snapshot.size}`);
    
    if (snapshot.size > 0) {
      // Afficher les hôtels présents dans la collection
      const hotelIds = new Set();
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.hotelId) hotelIds.add(data.hotelId);
      });
      
      console.log(`🏨 [TEST] Hôtels présents dans la collection (${hotelIds.size}): ${Array.from(hotelIds).join(', ')}`);
      
      // Afficher un exemple de document
      const firstDoc = snapshot.docs[0];
      console.log('📄 [TEST] Exemple de document:');
      console.log({
        id: firstDoc.id,
        hotelId: firstDoc.data().hotelId,
        description: firstDoc.data().description,
        discoveryDate: firstDoc.data().discoveryDate
      });
    } else {
      console.log('❌ [TEST] Aucun objet trouvé dans la collection');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Erreur lors du test:', error);
  }
}

// Exécuter le test
testLostItemsCollection()
  .then(() => {
    console.log('✅ [TEST] Test terminé');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ [TEST] Erreur non gérée:', error);
    process.exit(1);
  });
