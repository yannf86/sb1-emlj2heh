import { query, where, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';

// Store the current technician
let currentTechnician: any | null = null;

// Session timeout for technicien (5 minutes in ms)
export const SESSION_TIMEOUT = 5 * 60 * 1000;
let inactivityTimer: NodeJS.Timeout | null = null;

interface TechnicianAuthResult {
  success: boolean;
  technician?: any;
  message?: string;
}

// Login function for technicians (simulated authentication)
export const loginTechnician = async (email: string, password: string): Promise<TechnicianAuthResult> => {
  try {
    // In a real app, this would validate against Firebase Auth
    // For now, we'll just check if there's a technician with this email
    const techQuery = query(
      collection(db, 'technicians'),
      where('email', '==', email),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(techQuery);
    
    if (snapshot.empty) {
      return { 
        success: false, 
        message: "Aucun technicien actif trouvé avec cet email" 
      };
    }
    
    // For testing, we'll accept any password for existing technicians
    // In a real app, you'd check credentials properly
    const technicianData = snapshot.docs[0].data();
    const technician = {
      id: snapshot.docs[0].id,
      ...technicianData
    };
    
    // Store in sessionStorage with 5min expiration
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5);
    
    const authData = {
      technician,
      expires: expires.toISOString()
    };
    
    sessionStorage.setItem('technicianAuth', JSON.stringify(authData));
    currentTechnician = technician;
    
    // Start inactivity timer
    startInactivityTimer();
    
    return { 
      success: true,
      technician
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: "Une erreur est survenue lors de la connexion"
    };
  }
};

// Logout function
export const logoutTechnician = () => {
  sessionStorage.removeItem('technicianAuth');
  currentTechnician = null;
  
  // Clear inactivity timer
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
};

// Get the current logged in technician
export const getCurrentTechnician = () => {
  if (currentTechnician) {
    return currentTechnician;
  }
  
  // Check sessionStorage
  const techAuth = sessionStorage.getItem('technicianAuth');
  if (techAuth) {
    try {
      const auth = JSON.parse(techAuth);
      const now = new Date();
      
      // Check if session is still valid
      if (auth.expires && new Date(auth.expires) > now) {
        currentTechnician = auth.technician;
        return currentTechnician;
      } else {
        // Clear expired session
        sessionStorage.removeItem('technicianAuth');
      }
    } catch (e) {
      sessionStorage.removeItem('technicianAuth');
    }
  }
  
  return null;
};

// Check if a technician is logged in
export const isTechnicianLoggedIn = () => {
  return getCurrentTechnician() !== null;
};

// Set the last activity time
export const setLastActivityTime = () => {
  sessionStorage.setItem('techLastActivity', Date.now().toString());
};

// Start the inactivity timer
export const startInactivityTimer = () => {
  // Clear any existing timer
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  // Set new timer
  inactivityTimer = setTimeout(() => {
    console.log("Technician inactive for 5 minutes, logging out");
    logoutTechnician();
    
    // Reload the page to redirect to login
    window.location.href = '/technician-login';
  }, SESSION_TIMEOUT);
  
  // Set initial activity time
  setLastActivityTime();
};

// Reset the inactivity timer on user activity
export const resetTechnicianInactivityTimer = () => {
  setLastActivityTime();
  startInactivityTimer();
};

// Check if technician session has expired due to inactivity
export const checkTechnicianSessionExpiry = (): boolean => {
  const lastActivity = sessionStorage.getItem('techLastActivity');
  if (!lastActivity) return false;
  
  const lastActivityTime = parseInt(lastActivity, 10);
  const currentTime = Date.now();
  
  return (currentTime - lastActivityTime) > SESSION_TIMEOUT;
};

// Refresh technician session (extend expiration)
export const refreshTechnicianSession = () => {
  const techAuth = sessionStorage.getItem('technicianAuth');
  if (techAuth) {
    try {
      const auth = JSON.parse(techAuth);
      const now = new Date();
      
      // Check if session is still valid
      if (auth.expires && new Date(auth.expires) > now) {
        // Extend by 5 minutes from now
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 5);
        
        const authData = {
          technician: auth.technician,
          expires: expires.toISOString()
        };
        
        sessionStorage.setItem('technicianAuth', JSON.stringify(authData));
        
        // Reset inactivity timer
        resetTechnicianInactivityTimer();
      }
    } catch (e) {
      // Ignore errors
    }
  }
};