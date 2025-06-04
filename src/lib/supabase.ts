import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...args) => {
      return fetch(...args);
    },
  },
});

/**
 * Upload a file to Supabase Storage with retry mechanism
 * @param file File to upload
 * @param bucket Bucket name ('photoavant', 'photoapres', 'devis', 'objettrouve', or 'photosincident')
 * @param customPath Optional custom path within the bucket
 * @returns URL to the uploaded file
 */
export const uploadToSupabase = async (file: File, bucket: string, customPath?: string, retries = 3): Promise<string> => {
  try {
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    // Validate Supabase configuration
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration. Please check your environment variables.');
    }
    
    // Validate bucket name
    const validBuckets = ['photoavant', 'photoapres', 'devis', 'objettrouve', 'photosincident'];
    if (!validBuckets.includes(bucket)) {
      console.warn(`⚠️ Using non-standard bucket name: ${bucket}`);
    }
    
    console.log(`🚀 Starting upload to Supabase bucket: ${bucket}, file: ${file.name} (${(file.size/1024).toFixed(1)}KB)`);
    
    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${timestamp}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Define file path
    const filePath = customPath ? `${customPath}/${fileName}` : fileName;
    
    // Upload file to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600', 
        upsert: true // Replace existing files with same name
      });
    
    if (error) {
      console.error('❌ Error uploading to Supabase:', error);
      
      // If we have network-related errors and retries left, attempt retry
      if ((error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) && retries > 0) {
        console.log(`⏱️ Retrying upload (${retries} attempts left)...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return uploadToSupabase(file, bucket, customPath, retries - 1);
      }
      
      throw error;
    }
    
    if (!data || !data.path) {
      throw new Error('No data returned from Supabase upload');
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    console.log('✅ File uploaded to Supabase successfully:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Error in uploadToSupabase:', error);
    
    // Improve error message for better debugging
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error(`Network error while connecting to Supabase Storage. This is likely a CORS issue. Please add 'http://localhost:5173' to your Supabase Storage CORS configuration in the Supabase dashboard under Storage > Settings > CORS. Original error: ${error.message}`);
      } else if (error.message.includes('not found') || error.message.includes('404')) {
        throw new Error(`Bucket "${bucket}" not found. Please check your Supabase Storage configuration.`);
      } else if (error.message.includes('permission') || error.message.includes('403')) {
        throw new Error(`Permission denied when uploading to bucket "${bucket}". Please check RLS policies in your Supabase project.`);
      }
    }
    
    throw error;
  }
};

/**
 * Extract file path from Supabase URL
 * This is a critical function to ensure files are properly deleted
 */
export const extractPathFromSupabaseUrl = (url: string): { bucket: string | null, path: string | null } => {
  try {
    // Debug the URL we're trying to parse
    console.log('🔍 Extracting path from Supabase URL:', url);
    
    if (!url) {
      return { bucket: null, path: null };
    }
    
    // Remove query parameters if present
    const cleanUrl = url.split('?')[0];
    
    // Find which bucket the file belongs to by checking the URL
    let bucket = null;
    const buckets = ['photoavant', 'photoapres', 'devis', 'objettrouve', 'photosincident'];
    
    for (const b of buckets) {
      if (url.includes(`/${b}/`)) {
        bucket = b;
        break;
      }
    }
    
    if (!bucket) {
      console.warn('⚠️ Could not determine bucket from URL:', url);
      return { bucket: null, path: null };
    }
    
    // Extract the file name from the URL
    // The file name is typically the last segment of the path
    const pathSegments = cleanUrl.split('/');
    const fileName = pathSegments[pathSegments.length - 1];
    
    if (!fileName) {
      console.warn('⚠️ Could not extract filename from URL:', url);
      return { bucket: null, path: null };
    }
    
    console.log(`✅ Extracted bucket: ${bucket}, filename: ${fileName}`);
    return { bucket, path: fileName };
    
  } catch (error) {
    console.error('❌ Error extracting path from URL:', error, url);
    return { bucket: null, path: null };
  }
};

/**
 * Delete a file from Supabase Storage
 * @param url Public URL of the file to delete
 * @returns True if deletion was successful
 */
export const deleteFromSupabase = async (url: string): Promise<boolean> => {
  try {
    console.log('🗑️ Starting deletion from Supabase for URL:', url);
    if (!url || typeof url !== 'string') {
      console.log('⚠️ Invalid URL provided for deletion, skipping');
      return false;
    }

    // Check if it's a Supabase URL
    if (!url.includes('supabase') && !url.includes('incunfhzpnrbaftzpktd')) {
      console.log('⚠️ Not a Supabase URL, skipping Supabase deletion:', url);
      return false;
    }
    
    // Extract bucket and file path from URL
    const { bucket, path } = extractPathFromSupabaseUrl(url);
    
    if (!bucket || !path) {
      console.error('❌ Failed to extract bucket and path from URL:', url);
      return false;
    }
    
    console.log(`🔍 Extracted bucket: "${bucket}", path: "${path}" from URL`);
    
    // Perform the deletion
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error('❌ Error deleting from Supabase:', error);
      return false;
    }
    
    console.log('✅ File deleted from Supabase successfully');
    return true;
  } catch (error) {
    console.error('❌ Error in deleteFromSupabase:', error);
    return false;
  }
};

/**
 * Helper function to check if a string is a data URL
 */
export const isDataUrl = (value: any): boolean => {
  if (typeof value !== 'string') return false;
  return value.startsWith('data:');
};

/**
 * Convert a data URL to a File object
 */
export const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File | null> => {
  try {
    if (!dataUrl || !isDataUrl(dataUrl)) {
      console.warn('⚠️ Invalid data URL format');
      return null;
    }
    
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const mimeType = blob.type || 'image/jpeg'; // Default to JPEG if type is missing
    
    return new File([blob], fileName, { type: mimeType });
  } catch (error) {
    console.error('❌ Error converting data URL to File:', error);
    return null;
  }
};

/**
 * Check if Supabase connection is working
 * @returns Boolean indicating if connection is working
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      return false;
    }
    
    // Test connection by retrieving bucket information
    const { data, error } = await supabase.storage.getBucket('photoavant');
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
};