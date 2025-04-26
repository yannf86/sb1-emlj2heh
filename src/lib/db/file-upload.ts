import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { supabase, deleteFromSupabase, isDataUrl, dataUrlToFile } from '../supabase';

/**
 * Uploads a file to Supabase Storage (with Firebase fallback) and returns the download URL
 * @param file The file to upload
 * @param path The path in the storage bucket
 * @param maxSizeMB Maximum size in MB (default: 2MB)
 * @returns Promise with the download URL
 */
export async function uploadFile(file: File, path: string, maxSizeMB: number = 2): Promise<string> {
  try {
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size exceeds the ${maxSizeMB}MB limit`);
    }
    
    // Determine the appropriate bucket based on the path
    let bucket = 'photoavant'; // Default bucket
    
    if (path.includes('lost_items')) {
      bucket = 'objettrouve';
    } else if (path.includes('photos/before') || path.includes('incidents/photos')) {
      bucket = 'photoavant';
    } else if (path.includes('photos/after')) {
      bucket = 'photoapres';
    } else if (path.includes('quotes') || path.includes('documents')) {
      bucket = 'devis';
    }
    
    console.log(`🚀 Uploading file to Supabase bucket: ${bucket}`);
    
    // Try uploading to Supabase first
    try {
      // Create a unique filename using timestamp and random string
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      
      // Upload file to Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      console.log('✅ File uploaded successfully to Supabase:', publicUrl);
      return publicUrl;
    } catch (supabaseError) {
      console.error('❌ Error uploading to Supabase:', supabaseError);
      console.log('Falling back to Firebase...');
      
      // Fallback to Firebase Storage
      // Create a unique filename
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}-${safeFileName}`;
      const fullPath = `${path}/${filename}`;
      const storageRef = ref(storage, fullPath);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      console.log('💾 File uploaded to Firebase as fallback:', snapshot.metadata.fullPath);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('📝 Download URL obtained from Firebase:', downloadURL);
      
      return downloadURL;
    }
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    throw error;
  }
}

/**
 * Deletes a file from both Supabase and Firebase Storage
 * @param url The URL of the file to delete
 * @returns Promise that resolves when deletion attempts are complete
 */
export async function deleteFile(url: string): Promise<void> {
  if (!url) {
    console.log('⚠️ No URL provided for deletion, skipping');
    return;
  }
  
  console.log('🗑️ Starting deletion process for file URL:', url);
  
  let supabaseDeleted = false;
  
  // Try Supabase deletion first
  if (url.includes('supabase') || url.includes('incunfhzpnrbaftzpktd')) {
    try {
      console.log('🔄 Attempting to delete file from Supabase...');
      supabaseDeleted = await deleteFromSupabase(url);
      console.log('🔔 Supabase deletion result:', supabaseDeleted ? 'Success ✅' : 'Failed ❌');
    } catch (error) {
      console.error('❌ Error attempting Supabase deletion:', error);
    }
  } else {
    console.log('ℹ️ URL does not appear to be from Supabase, skipping Supabase deletion');
  }
  
  // If not a Supabase URL or Supabase deletion failed, try Firebase
  if (!supabaseDeleted && (url.includes('firebase') || url.includes('appspot.com'))) {
    try {
      console.log('🔄 Attempting to delete file from Firebase...');
      // Extract the path from the URL
      const path = url.split('o/')[1]?.split('?')[0];
      if (!path) {
        console.error('❌ Could not extract path from Firebase URL:', url);
        return;
      }
      
      // Decode the path
      const decodedPath = decodeURIComponent(path);
      console.log('🔍 Extracted Firebase path:', decodedPath);
      const fileRef = ref(storage, decodedPath);
      
      await deleteObject(fileRef);
      console.log('✅ File deleted successfully from Firebase:', decodedPath);
    } catch (error) {
      console.error('❌ Error deleting file from Firebase:', error);
      // Don't throw, just log the error
    }
  } else if (!supabaseDeleted) {
    console.log('⚠️ URL does not appear to be from Firebase, and Supabase deletion failed or was not attempted');
  }
}

/**
 * Processes file data from form input, handling both File objects and data URLs
 * Uses Supabase as primary storage, with Firebase fallback
 *
 * @param fileData File object from input
 * @param previewData Preview data (usually a data URL or existing file URL)
 * @param existingUrl Any existing URL for the file that might need to be deleted
 * @param path Path for storage organization
 * @param fileName Default file name to use if creating from data URL
 * @returns Promise with the URL of the uploaded file or null
 */
export async function processFileUpload(
  fileData: File | null | undefined,
  previewData: string | null | undefined,
  existingUrl: string | null | undefined,
  path: string,
  fileName: string = 'file.jpg'
): Promise<string | null> {
  try {
    console.log('🔄 Processing file upload with:', { 
      hasFileData: !!fileData,
      hasPreviewData: !!previewData?.substring(0, 50) + '...',
      hasExistingUrl: !!existingUrl?.substring(0, 50) + '...',
      path
    });
    
    // Case 1: We have a File object - upload it and delete old file if needed
    if (fileData instanceof File) {
      console.log('📄 Processing File object for upload');
      
      // If we have an existing URL, delete that file
      if (existingUrl) {
        try {
          console.log('🗑️ Deleting existing file before upload:', existingUrl?.substring(0, 50) + '...');
          await deleteFile(existingUrl);
          console.log('✅ Existing file deleted successfully');
        } catch (error) {
          console.error('❌ Failed to delete previous file, continuing with upload:', error);
        }
      }
      
      // Determine bucket from path
      let bucket = 'photoavant'; // Default
      if (path.includes('objettrouve') || path.includes('lost_items')) {
        bucket = 'objettrouve';
      } else if (path.includes('after')) {
        bucket = 'photoapres';
      } else if (path.includes('devis') || path.includes('documents')) {
        bucket = 'devis';
      }
      
      const url = await uploadToSupabase(fileData, bucket);
      return url;
    }
    
    // Case 2: We have a data URL in the preview - convert to file and upload
    else if (isDataUrl(previewData)) {
      console.log('🔄 Processing data URL for upload');
      
      // If we have an existing URL and it doesn't match the preview, delete the old file
      if (existingUrl && existingUrl !== previewData) {
        try {
          console.log('🗑️ Deleting existing file before uploading from data URL:', existingUrl?.substring(0, 50) + '...');
          await deleteFile(existingUrl);
          console.log('✅ Existing file deleted successfully');
        } catch (error) {
          console.error('❌ Failed to delete previous file, continuing with upload:', error);
        }
      }
      
      // Determine bucket from path
      let bucket = 'photoavant'; // Default
      if (path.includes('objettrouve') || path.includes('lost_items')) {
        bucket = 'objettrouve';
      } else if (path.includes('after')) {
        bucket = 'photoapres';
      } else if (path.includes('devis') || path.includes('documents')) {
        bucket = 'devis';
      }
      
      const file = await dataUrlToFile(previewData, fileName);
      if (file) {
        const url = await uploadToSupabase(file, bucket);
        return url;
      }
      return null;
    }
    
    // Case 3: We have an existing URL that should be kept
    else if (previewData && !isDataUrl(previewData)) {
      console.log('🔄 Keeping existing URL from preview data:', previewData?.substring(0, 50) + '...');
      return previewData;
    }
    
    // Case 4: We have an existing URL in the separate existingUrl parameter
    else if (existingUrl) {
      console.log('🔄 Using provided existing URL:', existingUrl?.substring(0, 50) + '...');
      return existingUrl;
    }
    
    // No file data to process
    return null;
  } catch (error) {
    console.error('❌ Error processing file upload:', error);
    throw error;
  }
}