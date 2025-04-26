import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = 'https://incunfhzpnrbaftzpktd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluY3VuZmh6cG5yYmFmdHpwa3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1OTk3ODMsImV4cCI6MjA2MTE3NTc4M30.b1aZXoAxRfYS41_NMts5042cIWeaJYG4iCnCcNKUJoA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a file to Supabase Storage
 * @param file File to upload
 * @param bucket Bucket name ('photoavant', 'photoapres', 'devis', or 'objettrouve')
 * @param customPath Optional custom path within the bucket
 * @returns URL to the uploaded file
 */
export const uploadToSupabase = async (file: File, bucket: string, customPath?: string): Promise<string> => {
  try {
    if (!file) {
      throw new Error('No file provided for upload');
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
      throw error;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    console.log('✅ File uploaded to Supabase successfully:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Error in uploadToSupabase:', error);
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
    const buckets = ['photoavant', 'photoapres', 'devis', 'objettrouve'];
    
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