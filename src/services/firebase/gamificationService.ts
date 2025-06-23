import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ExperienceLevel, ActionPoint, Badge, Challenge, GamificationSettings } from '../../types/gamification';

export class GamificationService {
  // Experience Levels
  async getExperienceLevels(): Promise<ExperienceLevel[]> {
    try {
      const q = query(
        collection(db, 'gamification_levels'),
        orderBy('level', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
        };
      }) as ExperienceLevel[];
    } catch (error) {
      console.error('Error getting experience levels:', error);
      throw error;
    }
  }

  async addExperienceLevel(level: Omit<ExperienceLevel, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'gamification_levels'), {
        ...level,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding experience level:', error);
      throw error;
    }
  }

  async updateExperienceLevel(id: string, level: Partial<ExperienceLevel>): Promise<void> {
    try {
      const docRef = doc(db, 'gamification_levels', id);
      await updateDoc(docRef, {
        ...level,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating experience level:', error);
      throw error;
    }
  }

  async deleteExperienceLevel(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'gamification_levels', id));
    } catch (error) {
      console.error('Error deleting experience level:', error);
      throw error;
    }
  }

  // Action Points
  async getActionPoints(): Promise<ActionPoint[]> {
    try {
      const q = query(
        collection(db, 'gamification_action_points'),
        orderBy('category', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          hotels: Array.isArray(data.hotels) ? data.hotels : [],
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
        };
      }) as ActionPoint[];
    } catch (error) {
      console.error('Error getting action points:', error);
      throw error;
    }
  }

  async addActionPoint(actionPoint: Omit<ActionPoint, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'gamification_action_points'), {
        ...actionPoint,
        hotels: actionPoint.hotels || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding action point:', error);
      throw error;
    }
  }

  async updateActionPoint(id: string, actionPoint: Partial<ActionPoint>): Promise<void> {
    try {
      const docRef = doc(db, 'gamification_action_points', id);
      await updateDoc(docRef, {
        ...actionPoint,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating action point:', error);
      throw error;
    }
  }

  async deleteActionPoint(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'gamification_action_points', id));
    } catch (error) {
      console.error('Error deleting action point:', error);
      throw error;
    }
  }

  // Badges
  async getBadges(): Promise<Badge[]> {
    try {
      const q = query(
        collection(db, 'gamification_badges'),
        orderBy('category', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          hotels: Array.isArray(data.hotels) ? data.hotels : [],
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
        };
      }) as Badge[];
    } catch (error) {
      console.error('Error getting badges:', error);
      throw error;
    }
  }

  async addBadge(badge: Omit<Badge, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'gamification_badges'), {
        ...badge,
        hotels: badge.hotels || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding badge:', error);
      throw error;
    }
  }

  async updateBadge(id: string, badge: Partial<Badge>): Promise<void> {
    try {
      const docRef = doc(db, 'gamification_badges', id);
      await updateDoc(docRef, {
        ...badge,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating badge:', error);
      throw error;
    }
  }

  async deleteBadge(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'gamification_badges', id));
    } catch (error) {
      console.error('Error deleting badge:', error);
      throw error;
    }
  }

  // Settings
  async getGamificationSettings(): Promise<GamificationSettings | null> {
    try {
      const querySnapshot = await getDocs(collection(db, 'gamification_settings'));
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
      } as GamificationSettings;
    } catch (error) {
      console.error('Error getting gamification settings:', error);
      throw error;
    }
  }

  async updateGamificationSettings(settings: Partial<GamificationSettings>): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, 'gamification_settings'));
      
      if (querySnapshot.empty) {
        // Create new settings
        await addDoc(collection(db, 'gamification_settings'), {
          ...settings,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Update existing settings
        const docRef = doc(db, 'gamification_settings', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          ...settings,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error updating gamification settings:', error);
      throw error;
    }
  }

  // Initialize default levels (33 levels)
  async initializeDefaultLevels(): Promise<void> {
    try {
      const existingLevels = await this.getExperienceLevels();
      if (existingLevels.length > 0) return; // Already initialized

      const defaultLevels = this.generateDefaultLevels();
      
      for (const level of defaultLevels) {
        await this.addExperienceLevel(level);
      }
    } catch (error) {
      console.error('Error initializing default levels:', error);
      throw error;
    }
  }

  private generateDefaultLevels(): Omit<ExperienceLevel, 'id'>[] {
    const levelNames = [
      'Novice', 'Apprenti', 'Assistant', 'Débutant', 'Initié', 'Compétent', 'Qualifié', 
      'Professionnel', 'Spécialiste', 'Expert', 'Virtuose', 'Maître', 'Sage', 'Mentor',
      'Guide', 'Conseiller', 'Référent', 'Autorité', 'Légende', 'Champion', 'Élite',
      'Prodige', 'Génie', 'Maestro', 'Visionnaire', 'Pionnier', 'Révolutionnaire',
      'Innovateur', 'Créateur', 'Architecte', 'Fondateur', 'Empereur', 'Divin'
    ];

    const colors = [
      '#9CA3AF', '#6B7280', '#4B5563', // Gris (1-3)
      '#10B981', '#059669', '#047857', // Vert (4-6)
      '#3B82F6', '#2563EB', '#1D4ED8', // Bleu (7-9)
      '#8B5CF6', '#7C3AED', '#6D28D9', // Violet (10-12)
      '#F59E0B', '#D97706', '#B45309', // Orange (13-15)
      '#EF4444', '#DC2626', '#B91C1C', // Rouge (16-18)
      '#EC4899', '#DB2777', '#BE185D', // Rose (19-21)
      '#14B8A6', '#0D9488', '#0F766E', // Teal (22-24)
      '#F97316', '#EA580C', '#C2410C', // Orange foncé (25-27)
      '#84CC16', '#65A30D', '#4D7C0F', // Lime (28-30)
      '#D4AF37', '#B8860B', '#996515'  // Or (31-33)
    ];

    const badges = [
      '🥉', '🥉', '🥉', // Bronze (1-3)
      '🌱', '🌿', '🍀', // Nature (4-6)
      '💎', '💎', '💎', // Diamant (7-9)
      '🔮', '🔮', '🔮', // Mystique (10-12)
      '⭐', '⭐', '⭐', // Étoile (13-15)
      '🔥', '🔥', '🔥', // Feu (16-18)
      '👑', '👑', '👑', // Couronne (19-21)
      '🌟', '🌟', '🌟', // Étoile brillante (22-24)
      '⚡', '⚡', '⚡', // Éclair (25-27)
      '🏆', '🏆', '🏆', // Trophée (28-30)
      '🥇', '🌞', '🎖️'  // Médaille d'or, Soleil, Décoration (31-33)
    ];

    return levelNames.map((name, index) => {
      const level = index + 1;
      const baseXP = level === 1 ? 0 : Math.floor(100 * Math.pow(1.5, level - 2));
      const maxXP = level === 33 ? 999999 : Math.floor(100 * Math.pow(1.5, level - 1)) - 1;

      return {
        level,
        name,
        minXP: baseXP,
        maxXP,
        badge: badges[index],
        color: colors[index],
        description: `Niveau ${level} - ${name}`,
        active: true,
        order: level
      };
    });
  }
}

export const gamificationService = new GamificationService();