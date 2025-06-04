import { checkFirebaseIndex } from '../lib/api/checkFirebaseIndex';

/**
 * API route handler for checking if a Firebase index exists
 */
export async function POST(req: Request) {
  try {
    const { collection, field, operator, value, orderByField } = await req.json();
    
    if (!collection) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Collection name is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const result = await checkFirebaseIndex(
      collection, 
      field || 'technicianIds',
      operator || 'array-contains',
      value || 'test',
      orderByField || 'date'
    );
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}