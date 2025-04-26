import { db } from './firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { 
  users, 
  hotels, 
  modules, 
  hotelServices, 
  parameters,
  supplierCategories,
  supplierSubcategories
} from './data';

// Migrate static data to Firestore
export const migrateStaticData = async () => {
  try {
    // Migrate users
    for (const user of users) {
      await setDoc(doc(db, 'users', user.id), {
        ...user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    console.log('Users migrated successfully');

    // Migrate hotels
    for (const hotel of hotels) {
      await setDoc(doc(db, 'hotels', hotel.id), {
        ...hotel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    console.log('Hotels migrated successfully');

    // Migrate modules
    for (const module of modules) {
      await setDoc(doc(db, 'modules', module.id), {
        ...module,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    console.log('Modules migrated successfully');

    // Migrate hotel services
    for (const service of hotelServices) {
      await setDoc(doc(db, 'hotel_services', service.id), {
        ...service,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    console.log('Hotel services migrated successfully');

    // Migrate parameters
    for (const param of parameters) {
      await setDoc(doc(db, 'parameters', param.id), {
        ...param,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    console.log('Parameters migrated successfully');

    // Migrate supplier categories
    for (const category of supplierCategories) {
      await setDoc(doc(db, 'supplier_categories', category.id), {
        ...category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    console.log('Supplier categories migrated successfully');

    // Migrate supplier subcategories
    for (const subcategory of supplierSubcategories) {
      await setDoc(doc(db, 'supplier_subcategories', subcategory.id), {
        ...subcategory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    console.log('Supplier subcategories migrated successfully');

    return { success: true };
  } catch (error) {
    console.error('Error during migration:', error);
    return { success: false, error };
  }
};

// Function to generate test data
export const generateTestData = async () => {
  try {
    // Generate incidents
    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const incident = {
        date: date.toISOString().split('T')[0],
        time: `${Math.floor(Math.random() * 14) + 8}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        hotelId: hotels[Math.floor(Math.random() * hotels.length)].id,
        locationId: parameters.filter(p => p.type === 'location')[Math.floor(Math.random() * 8)].id,
        roomType: Math.random() > 0.5 ? parameters.filter(p => p.type === 'room_type')[Math.floor(Math.random() * 5)].id : null,
        clientName: `Client ${Math.floor(Math.random() * 100) + 1}`,
        categoryId: parameters.filter(p => p.type === 'incident_category')[Math.floor(Math.random() * 5)].id,
        impactId: parameters.filter(p => p.type === 'impact')[Math.floor(Math.random() * 4)].id,
        description: `Description de l'incident ${i + 1}`,
        receivedById: users[Math.floor(Math.random() * users.length)].id,
        statusId: parameters.filter(p => p.type === 'status')[Math.floor(Math.random() * 5)].id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(collection(db, 'incidents')), incident);
    }
    console.log('Test incidents generated successfully');

    // Generate maintenance requests
    for (let i = 0; i < 40; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const maintenance = {
        date: date.toISOString().split('T')[0],
        time: `${Math.floor(Math.random() * 14) + 8}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        hotelId: hotels[Math.floor(Math.random() * hotels.length)].id,
        locationId: parameters.filter(p => p.type === 'location')[Math.floor(Math.random() * 8)].id,
        interventionTypeId: parameters.filter(p => p.type === 'intervention_type')[Math.floor(Math.random() * 5)].id,
        description: `Description de la maintenance ${i + 1}`,
        receivedById: users[Math.floor(Math.random() * users.length)].id,
        statusId: parameters.filter(p => p.type === 'status')[Math.floor(Math.random() * 5)].id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(collection(db, 'maintenance')), maintenance);
    }
    console.log('Test maintenance requests generated successfully');

    // Generate quality visits
    for (let i = 0; i < 20; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const checklistItems = [];
      const checkCount = Math.floor(Math.random() * 10) + 5;
      
      for (let j = 0; j < checkCount; j++) {
        const category = parameters.filter(p => p.type === 'quality_category')[Math.floor(Math.random() * 6)].id;
        const item = parameters.filter(p => p.type === 'quality_item')[Math.floor(Math.random() * 6)].id;
        const resultOptions = ['conforme', 'non-conforme', 'non-applicable'];
        
        checklistItems.push({
          categoryId: category,
          itemId: item,
          result: resultOptions[Math.floor(Math.random() * 3)],
          comment: Math.random() > 0.5 ? `Commentaire sur l'item ${j + 1}` : null
        });
      }
      
      const conformeCount = checklistItems.filter(i => i.result === 'conforme').length;
      const totalApplicable = checklistItems.filter(i => i.result !== 'non-applicable').length;
      const conformityRate = totalApplicable > 0 ? Math.round((conformeCount / totalApplicable) * 100) : 100;
      
      const visit = {
        visitDate: date.toISOString().split('T')[0],
        startTime: `${Math.floor(Math.random() * 8) + 8}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        endTime: `${Math.floor(Math.random() * 5) + 17}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        hotelId: hotels[Math.floor(Math.random() * hotels.length)].id,
        visitorId: users[Math.floor(Math.random() * users.length)].id,
        visitTypeId: parameters.filter(p => p.type === 'visit_type')[Math.floor(Math.random() * 5)].id,
        checklist: checklistItems,
        remarks: Math.random() > 0.5 ? `Remarques générales visite ${i + 1}` : null,
        actionPlan: Math.random() > 0.5 ? `Plan d'action visite ${i + 1}` : null,
        conformityRate: conformityRate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(collection(db, 'quality_visits')), visit);
    }
    console.log('Test quality visits generated successfully');

    // Generate lost items
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      const statusOptions = ['conservé', 'rendu', 'transféré'];
      const status = statusOptions[Math.floor(Math.random() * 3)];
      
      const item = {
        date: date.toISOString().split('T')[0],
        time: `${Math.floor(Math.random() * 14) + 8}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        hotelId: hotels[Math.floor(Math.random() * hotels.length)].id,
        locationId: parameters.filter(p => p.type === 'location')[Math.floor(Math.random() * 8)].id,
        description: `Description de l'objet trouvé ${i + 1}`,
        itemTypeId: parameters.filter(p => p.type === 'lost_item_type')[Math.floor(Math.random() * 5)].id,
        foundById: users[Math.floor(Math.random() * users.length)].id,
        storageLocation: `Stockage ${Math.floor(Math.random() * 5) + 1}`,
        status: status,
        returnedTo: status === 'rendu' ? `Client ${Math.floor(Math.random() * 100) + 1}` : null,
        returnDate: status === 'rendu' ? new Date().toISOString().split('T')[0] : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(collection(db, 'lost_items')), item);
    }
    console.log('Test lost items generated successfully');

    return { success: true };
  } catch (error) {
    console.error('Error generating test data:', error);
    return { success: false, error };
  }
};