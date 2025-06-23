import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '../../lib/firebase';
const functions = getFunctions();
import { User } from '../../types/users';
import { appModules } from '../../types/users';

export class UsersService {
  async getUsers(): Promise<User[]> {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((docSnapshot: any) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
          hotels: Array.isArray(data.hotels) ? data.hotels : [],
          modules: Array.isArray(data.modules) ? data.modules : [],
          lastLogin: data.lastLogin instanceof Timestamp ? data.lastLogin.toDate() : undefined,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
        };
      }) as User[];
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  async addUser(user: Omit<User, 'id'>, password: string): Promise<string> {
    try {
      // Préparer les données utilisateur avec les permissions appropriées
      const userData = { ...user };
      
      // Si c'est un administrateur système, lui donner accès à tous les modules automatiquement
      if (user.role === 'system_admin') {
        userData.modules = appModules.map(m => m.key);
      }

      // Create user in Firebase Auth first
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, password);
      const userId = userCredential.user.uid;

      // Then create user document in Firestore with the SAME ID as Auth
      await setDoc(doc(db, 'users', userId), {
        ...userData,
        id: userId, // Stocker l'ID explicitement
        hotels: userData.hotels || [],
        modules: userData.modules || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return userId;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async updateUser(id: string, user: Partial<User>): Promise<void> {
    try {
      const updateData = { ...user };
      
      // Si c'est un administrateur système, lui donner accès à tous les modules automatiquement
      if (user.role === 'system_admin') {
        updateData.modules = appModules.map(m => m.key);
      }

      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      // 1. Vérifier si l'utilisateur existe dans Firestore
      const userRef = doc(db, 'users', id);
      
      // 2. Supprimer le document Firestore
      await deleteDoc(userRef);
      console.log('User document deleted successfully from Firestore');
      
      // 3. Supprimer l'utilisateur dans Firebase Auth via la fonction Cloud
      try {
        const deleteAuthUser = httpsCallable(functions, 'deleteAuthUser');
        const result = await deleteAuthUser({ uid: id });
        console.log('User auth deleted result:', result);
      } catch (authError) {
        console.error('Error deleting user from Auth:', authError);
        // Ne pas bloquer le processus si la suppression Auth échoue
        // car l'utilisateur pourrait ne pas exister dans Auth
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async toggleUserStatus(id: string, active: boolean): Promise<void> {
    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        active,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  async updateUserHotels(id: string, hotelIds: string[]): Promise<void> {
    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        hotels: hotelIds,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user hotels:', error);
      throw error;
    }
  }

  async updateUserModules(id: string, moduleIds: string[]): Promise<void> {
    try {
      const docRef = doc(db, 'users', id);
      await updateDoc(docRef, {
        modules: moduleIds,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user modules:', error);
      throw error;
    }
  }
}

export const usersService = new UsersService();