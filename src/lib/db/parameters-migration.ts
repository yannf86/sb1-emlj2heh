import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Function to migrate parameters to their type-specific collections
export const migrateParameters = async () => {
  try {
    // Get all parameters from the main collection
    const querySnapshot = await getDocs(collection(db, 'parameters'));
    const parameters = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Group parameters by type
    const parametersByType = parameters.reduce((acc: any, param: any) => {
      if (!param.type) return acc;
      acc[param.type] = acc[param.type] || [];
      acc[param.type].push(param);
      return acc;
    }, {});

    // Migrate each type to its own collection
    const results = await Promise.all(
      Object.entries(parametersByType).map(async ([type, params]: [string, any[]]) => {
        const collectionName = `parameters_${type}`;
        let migratedCount = 0;

        for (const param of params) {
          try {
            // Create new document in type-specific collection
            await addDoc(collection(db, collectionName), {
              ...param,
              createdAt: param.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

            // Delete old document from parameters collection
            await deleteDoc(doc(db, 'parameters', param.id));

            migratedCount++;
          } catch (error) {
            console.error(`Error migrating parameter ${param.id} of type ${type}:`, error);
          }
        }

        return {
          type,
          total: params.length,
          migrated: migratedCount,
          failed: params.length - migratedCount
        };
      })
    );

    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Error during parameters migration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Function to check migration status
export const checkMigrationStatus = async () => {
  try {
    // Get counts from old parameters collection
    const oldParamsQuery = await getDocs(collection(db, 'parameters'));
    const oldParamsCount = oldParamsQuery.size;

    // Get counts from new collections
    const collections = [
      'parameters_incident_category',
      'parameters_impact',
      'parameters_status',
      'parameters_intervention_type',
      'parameters_visit_type',
      'parameters_quality_category',
      'parameters_quality_item',
      'parameters_lost_item_type',
      'parameters_procedure_type',
      'parameters_booking_origin'
    ];

    const newCounts = await Promise.all(
      collections.map(async (collectionName) => {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return {
          collection: collectionName,
          count: querySnapshot.size
        };
      })
    );

    const totalNewCount = newCounts.reduce((acc, curr) => acc + curr.count, 0);

    return {
      success: true,
      oldParametersCount: oldParamsCount,
      newCollectionsCount: totalNewCount,
      collectionCounts: newCounts,
      migrationComplete: oldParamsCount === 0 && totalNewCount > 0
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};