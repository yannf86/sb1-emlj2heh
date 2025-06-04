import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * Check if an index exists or needs to be created
 * @param collectionName The name of the collection to check
 * @param field The field to filter on
 * @param operator The operator to use (e.g., '==', 'array-contains')
 * @param value The value to compare against
 * @param orderByField The field to order by
 */
export const checkFirebaseIndex = async (
  collectionName: string, 
  field: string = 'technicianIds',
  operator: string = 'array-contains',
  value: string = 'test',
  orderByField: string = 'date'
) => {
  try {
    // Build a query that requires a composite index
    let q;
    
    switch (operator) {
      case 'array-contains':
        q = query(
          collection(db, collectionName),
          where(field, 'array-contains', value),
          orderBy(orderByField, 'desc'),
          limit(1)
        );
        break;
      case '==':
        q = query(
          collection(db, collectionName),
          where(field, '==', value),
          orderBy(orderByField, 'desc'),
          limit(1)
        );
        break;
      default:
        q = query(
          collection(db, collectionName),
          where(field, '==', value),
          orderBy(orderByField, 'desc'),
          limit(1)
        );
    }
    
    // Execute the query - if the index doesn't exist, this will throw an error
    await getDocs(q);
    
    // If we get here, the index exists
    return {
      success: true,
      indexExists: true,
      message: "Index exists"
    };
  } catch (error) {
    // Check if the error is about missing index
    if (error instanceof Error && 
        (error.message.includes('requires an index') || 
         error.message.includes('FirebaseError: 9 FAILED_PRECONDITION') ||
         error.message.includes('index is currently building'))) {
      
      return {
        success: false,
        indexExists: false,
        message: error.message,
        error: error
      };
    }
    
    // Some other error
    return {
      success: false,
      indexExists: false,
      message: error instanceof Error ? error.message : 'Unknown error checking index',
      error: error
    };
  }
};