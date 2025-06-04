import { query, where, getDocs, collection, doc, getDoc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, getAuth, sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from './firebase';

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

// Login function for technicians
export const loginTechnician = async (email: string, password: string): Promise<TechnicianAuthResult> => {
  try {
    // First try to sign in with Firebase Auth
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (authError: any) {
      console.error('Firebase auth error:', authError);
      
      // Handle specific Firebase Authentication error codes
      if (authError.code) {
        switch (authError.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            return { 
              success: false, 
              message: "Identifiants incorrects. Veuillez vérifier votre email et mot de passe." 
            };
          case 'auth/too-many-requests':
            return {
              success: false,
              message: "Trop de tentatives de connexion. Veuillez réessayer plus tard."
            };
          case 'auth/user-disabled':
            return {
              success: false,
              message: "Ce compte a été désactivé. Veuillez contacter l'administrateur."
            };
          default:
            return { 
              success: false, 
              message: `Erreur d'authentification: ${authError.code}. Veuillez réessayer.` 
            };
        }
      }
      
      // Fallback error message
      return { 
        success: false, 
        message: "Erreur d'authentification. Veuillez vérifier vos identifiants." 
      };
    }
    
    // Now check if this user is a technician in our Firestore database
    const techQuery = query(
      collection(db, 'technicians'),
      where('email', '==', email),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(techQuery);
    
    if (snapshot.empty) {
      // User exists in Auth but not as a technician in Firestore
      await signOut(auth); // Sign out the user from Firebase Auth
      return { 
        success: false, 
        message: "Aucun compte technicien trouvé pour cet email." 
      };
    }
    
    // Get technician data
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
      message: "Une erreur est survenue lors de la connexion. Veuillez réessayer."
    };
  }
};

// Check if an email is already in use in Firebase Auth
export const checkEmailInUse = async (email: string): Promise<boolean> => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.error("Error checking email usage:", error);
    // If we can't check, assume it's not in use to allow the flow to continue
    // The createUserWithEmailAndPassword will catch the error if it is in use
    return false;
  }
};

// Register a new technician with authentication
export const registerTechnician = async (email: string, password: string, technicianData: any) => {
  try {
    // Check if technician already exists in Firestore
    const techQuery = query(
      collection(db, 'technicians'),
      where('email', '==', email)
    );
    
    const snapshot = await getDocs(techQuery);
    if (!snapshot.empty) {
      return {
        success: false,
        message: "Un technicien avec cet email existe déjà dans notre base de données."
      };
    }
    
    // Check if email is already in use in Firebase Auth
    const isEmailInUse = await checkEmailInUse(email);
    let firebaseUser = null;
    
    if (isEmailInUse) {
      console.warn(`Email ${email} is already in use in Firebase Auth, but no technician record exists.`);
      // We'll continue without creating a new auth user, but will note this in the technician record
      
      return {
        success: false,
        message: "Cet email est déjà utilisé par un autre compte. Veuillez utiliser un email différent."
      };
    } else {
      // Create user in Firebase Auth
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        console.log(`Created new Firebase Auth user for ${email}`);
      } catch (authError: any) {
        console.error('Error creating Firebase Auth user:', authError);
        
        if (authError.code === 'auth/email-already-in-use') {
          return {
            success: false,
            message: "Cet email est déjà utilisé par un autre compte. Veuillez utiliser un email différent."
          };
        }
        
        return {
          success: false,
          message: authError.message || "Erreur lors de la création du compte d'authentification"
        };
      }
    }
    
    // Store technician data in Firestore
    const technicianWithAuthInfo = {
      ...technicianData,
      hasFirebaseAuth: true,
      firebaseUid: firebaseUser?.uid || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to Firestore collection
    const docRef = await addDoc(collection(db, 'technicians'), technicianWithAuthInfo);
    
    return {
      success: true,
      id: docRef.id,
      message: "Technicien créé avec succès"
    };
  } catch (error) {
    console.error('Error registering technician:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la création du compte"
    };
  }
};

// Update technician password
export const updateTechnicianPassword = async (id: string, newPassword: string) => {
  try {
    // For Firebase Auth, we need to use password reset
    // First get the technician's email
    const technicianRef = doc(db, 'technicians', id);
    const techDoc = await getDoc(technicianRef);
    
    if (!techDoc.exists()) {
      return {
        success: false,
        message: "Technicien non trouvé"
      };
    }
    
    const technicianData = techDoc.data();
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(auth, technicianData.email);
    } catch (resetError) {
      console.error('Error sending password reset email:', resetError);
      return {
        success: false,
        message: "Erreur lors de l'envoi de l'email de réinitialisation"
      };
    }
    
    // Update the technician record to indicate password has been managed
    await updateDoc(technicianRef, {
      passwordManaged: true,
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      message: "Email de réinitialisation de mot de passe envoyé"
    };
  } catch (error) {
    console.error('Error updating technician password:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la mise à jour du mot de passe"
    };
  }
};

// Logout function
export const logoutTechnician = () => {
  sessionStorage.removeItem('technicianAuth');
  currentTechnician = null;
  
  // Sign out from Firebase Auth
  signOut(auth).catch(error => {
    console.error('Error signing out:', error);
  });
  
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