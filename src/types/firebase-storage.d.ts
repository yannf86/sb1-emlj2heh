// Déclaration de type pour firebase/storage
declare module 'firebase/storage' {
  import { FirebaseStorage } from '@firebase/storage-types';
  
  export function getStorage(): FirebaseStorage;
  export function ref(storage: FirebaseStorage, path?: string): any;
  export function uploadBytes(reference: any, data: Blob | Uint8Array | ArrayBuffer): Promise<any>;
  export function getDownloadURL(reference: any): Promise<string>;
  export function deleteObject(reference: any): Promise<void>;
}
