import { collection, addDoc, getDocs, query, where, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

// Get incident categories for a hotel
export const getHotelIncidentCategories = async (hotelId: string) => {
  try {
    const q = query(
      collection(db, 'hotel_incident_categories'),
      where('hotel_id', '==', hotelId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting hotel incident categories:', error);
    throw error;
  }
};

// Update hotel incident categories
export const updateHotelIncidentCategories = async (hotelId: string, categoryIds: string[]) => {
  try {
    console.log(`Updating categories for hotel ${hotelId}:`, categoryIds);
    
    // First, get existing categories
    const q = query(
      collection(db, 'hotel_incident_categories'),
      where('hotel_id', '==', hotelId)
    );
    const querySnapshot = await getDocs(q);
    const existingCategories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      categoryId: doc.data().category_id
    }));

    console.log("Existing categories:", existingCategories);

    // Use a batch to ensure all operations succeed or fail together
    const batch = writeBatch(db);

    // Delete removed categories
    const categoriesToDelete = existingCategories.filter(
      cat => !categoryIds.includes(cat.categoryId)
    );
    
    console.log("Categories to delete:", categoriesToDelete);
    
    for (const cat of categoriesToDelete) {
      const docRef = doc(db, 'hotel_incident_categories', cat.id);
      batch.delete(docRef);
    }

    // Add new categories
    const existingCategoryIds = existingCategories.map(cat => cat.categoryId);
    const categoriesToAdd = categoryIds.filter(
      id => !existingCategoryIds.includes(id)
    );
    
    console.log("Categories to add:", categoriesToAdd);
    
    for (const categoryId of categoriesToAdd) {
      const newDocRef = doc(collection(db, 'hotel_incident_categories'));
      batch.set(newDocRef, {
        hotel_id: hotelId,
        category_id: categoryId,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Commit the batch
    await batch.commit();
    console.log("Batch committed successfully");

    return true;
  } catch (error) {
    console.error('Error updating hotel incident categories:', error);
    throw error;
  }
};

// Get hotels for an incident category
export const getCategoryHotels = async (categoryId: string) => {
  try {
    const q = query(
      collection(db, 'hotel_incident_categories'),
      where('category_id', '==', categoryId),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting category hotels:', error);
    throw error;
  }
};

// Update category hotels
export const updateCategoryHotels = async (categoryId: string, hotelIds: string[]) => {
  try {
    console.log(`Updating hotels for category ${categoryId}:`, hotelIds);
    
    // First, get existing hotels for this category
    const q = query(
      collection(db, 'hotel_incident_categories'),
      where('category_id', '==', categoryId)
    );
    const querySnapshot = await getDocs(q);
    const existingHotels = querySnapshot.docs.map(doc => ({
      id: doc.id,
      hotelId: doc.data().hotel_id
    }));

    console.log("Existing hotels:", existingHotels);

    // Use a batch to ensure all operations succeed or fail together
    const batch = writeBatch(db);

    // Delete removed hotels
    const hotelsToDelete = existingHotels.filter(
      hotel => !hotelIds.includes(hotel.hotelId)
    );
    
    console.log("Hotels to delete:", hotelsToDelete);
    
    for (const hotel of hotelsToDelete) {
      const docRef = doc(db, 'hotel_incident_categories', hotel.id);
      batch.delete(docRef);
    }

    // Add new hotels
    const existingHotelIds = existingHotels.map(hotel => hotel.hotelId);
    const hotelsToAdd = hotelIds.filter(
      id => !existingHotelIds.includes(id)
    );
    
    console.log("Hotels to add:", hotelsToAdd);
    
    for (const hotelId of hotelsToAdd) {
      const newDocRef = doc(collection(db, 'hotel_incident_categories'));
      batch.set(newDocRef, {
        hotel_id: hotelId,
        category_id: categoryId,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Commit the batch
    await batch.commit();
    console.log("Batch committed successfully");

    return true;
  } catch (error) {
    console.error('Error updating category hotels:', error);
    throw error;
  }
};