import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableNetwork,
  disableNetwork 
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfTTaMbrnT6NPFJBgZI4FNHz_DXE_4Xc4",
  authDomain: "app-creho-2.firebaseapp.com",
  projectId: "app-creho-2",
  storageBucket: "app-creho-2.appspot.com",
  messagingSenderId: "727196643524",
  appId: "1:727196643524:web:a4de397d842db8d9ec5991"
};

// Initialize Firebase (only if it hasn't been initialized yet)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Flag to track connectivity state
let isOffline = false;

// Add connection timeout handling
const originalFetch = window.fetch;
window.fetch = function(input, init) {
  const timeout = 30000; // Increase timeout to 30 seconds
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const fetchPromise = originalFetch.call(this, input, {
    ...init,
    signal: controller.signal
  });
  
  return fetchPromise.finally(() => clearTimeout(timeoutId));
};

// Connection state variables
let isReconnecting = false;
let reconnectTimeout: any = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 3;

// Function to attempt reconnection to Firestore with debounce
const attemptReconnect = async () => {
  // Prevent multiple simultaneous reconnection attempts
  if (isReconnecting) return;
  
  // Clear any pending reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  if (!isOffline || reconnectAttempts >= maxReconnectAttempts) {
    return;
  }
  
  isReconnecting = true;
  reconnectAttempts++;
  
  try {
    console.log(`Attempting to reconnect to Firestore (Attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
    await enableNetwork(db);
    console.log('Successfully reconnected to Firestore');
    isOffline = false;
    reconnectAttempts = 0;
  } catch (error) {
    console.warn(`Failed to reconnect to Firestore on attempt ${reconnectAttempts}:`, error);
    if (reconnectAttempts < maxReconnectAttempts) {
      // Schedule another retry with increasing back-off
      const delay = Math.min(30000, 5000 * Math.pow(1.5, reconnectAttempts)); // Exponential backoff
      console.log(`Scheduling next reconnection attempt in ${delay/1000} seconds`);
      reconnectTimeout = setTimeout(attemptReconnect, delay);
    } else {
      console.error('Maximum reconnection attempts reached. Please reload the application.');
    }
  } finally {
    isReconnecting = false;
  }
};

// Throttle online/offline event handling to prevent rapid state changes
let lastOnlineEvent = 0;
let lastOfflineEvent = 0;
const eventThreshold = 5000; // 5 seconds minimum between events

// Listen for online/offline status
window.addEventListener('online', () => {
  const now = Date.now();
  if (now - lastOnlineEvent < eventThreshold) {
    return; // Ignore too frequent online events
  }
  lastOnlineEvent = now;
  
  console.log('Browser is online, attempting to reconnect to Firestore');
  attemptReconnect();
});

window.addEventListener('offline', async () => {
  const now = Date.now();
  if (now - lastOfflineEvent < eventThreshold) {
    return; // Ignore too frequent offline events
  }
  lastOfflineEvent = now;
  
  console.log('Browser is offline, disabling Firestore network');
  try {
    await disableNetwork(db);
    isOffline = true;
  } catch (error) {
    console.error('Error disabling Firestore network:', error);
  }
});

// Handle Firestore connection failures
const handleFirestoreConnectionFailure = () => {
  if (isReconnecting) return; // Don't stack up reconnection attempts
  
  console.warn('Firestore connection failed, attempting to reconnect with delay');
  isOffline = true;
  
  // Clear any existing timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  // Schedule reconnect with increasing delay
  const delay = Math.min(30000, 5000 * Math.pow(1.5, reconnectAttempts)); 
  reconnectTimeout = setTimeout(attemptReconnect, delay);
};

// Check if we're in development mode and use emulators if needed
if (import.meta.env.DEV) {
  try {
    // Check if we should use emulators (can be controlled via env variables)
    const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
    
    if (useEmulators) {
      try {
        // Connect to Firestore emulator
        connectFirestoreEmulator(db, 'localhost', 8080);
        // Connect to Storage emulator
        connectStorageEmulator(storage, 'localhost', 9199);
        console.log('Connected to Firebase emulators');
      } catch (emulatorError) {
        console.error('Failed to connect to Firebase emulators:', emulatorError);
        console.warn('Falling back to production Firebase services');
      }
    }
  } catch (error) {
    console.error('Error in Firebase emulator setup:', error);
  }
}

// Simplified error handling for Firebase operations
export const runWithErrorHandling = async <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error('Firebase operation failed:', error);
    // Only trigger connection handling for specific errors
    if (error.code === 'unavailable' || error.code === 'resource-exhausted') {
      handleFirestoreConnectionFailure();
    }
    return fallback;
  }
};

export default app;