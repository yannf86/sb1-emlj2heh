import { User } from '../../types/users';
import { usersService } from './usersService';

export class PermissionsService {
  private static userCache = new Map<string, User>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Récupère l'utilisateur connecté avec mise en cache
   */
  static async getCurrentUser(email: string): Promise<User | null> {
    try {
      console.log('permissionsService.getCurrentUser: Loading user for email:', email);
      
      // Vérifier le cache
      const cached = this.userCache.get(email);
      if (cached) {
        console.log('permissionsService.getCurrentUser: Found cached user:', cached);
        return cached;
      }

      // Charger depuis la base
      console.log('permissionsService.getCurrentUser: Loading from database...');
      const users = await usersService.getUsers();
      console.log('permissionsService.getCurrentUser: All users loaded:', users);
      
      const user = users.find(u => u.email === email);
      console.log('permissionsService.getCurrentUser: Found user:', user);
      
      if (user) {
        this.userCache.set(email, user);
        // Nettoyer le cache après 5 minutes
        setTimeout(() => {
          this.userCache.delete(email);
        }, this.CACHE_DURATION);
      }

      return user || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Récupère les hôtels accessibles pour un utilisateur
   */
  static async getAccessibleHotels(userEmail: string): Promise<string[]> {
    try {
      const user = await this.getCurrentUser(userEmail);
      if (!user) return [];

      // Les administrateurs système ont accès à tous les hôtels
      if (user.role === 'system_admin') {
        return ['all']; // Indicateur spécial pour "tous les hôtels"
      }

      return user.hotels || [];
    } catch (error) {
      console.error('Error getting accessible hotels:', error);
      return [];
    }
  }

  /**
   * Vérifie si un utilisateur a accès à un hôtel spécifique
   */
  static async hasAccessToHotel(userEmail: string, hotelId: string): Promise<boolean> {
    try {
      const accessibleHotels = await this.getAccessibleHotels(userEmail);
      
      // Admin système a accès à tout
      if (accessibleHotels.includes('all')) {
        return true;
      }

      return accessibleHotels.includes(hotelId);
    } catch (error) {
      console.error('Error checking hotel access:', error);
      return false;
    }
  }

  /**
   * Filtre une liste d'hôtels selon les permissions utilisateur
   */
  static async filterHotelsByPermissions(userEmail: string, hotelIds: string[]): Promise<string[]> {
    try {
      const accessibleHotels = await this.getAccessibleHotels(userEmail);
      
      // Admin système a accès à tout
      if (accessibleHotels.includes('all')) {
        return hotelIds;
      }

      return hotelIds.filter(hotelId => accessibleHotels.includes(hotelId));
    } catch (error) {
      console.error('Error filtering hotels by permissions:', error);
      return [];
    }
  }
  
  /**
   * Vérifie si un utilisateur est administrateur système
   */
  static async isSystemAdmin(userEmail: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser(userEmail);
      if (!user) return false;
      
      return user.role === 'system_admin';
    } catch (error) {
      console.error('Error checking if user is admin:', error);
      return false;
    }
  }

  /**
   * Applique le filtrage automatique par hôtel dans une requête
   */
  static async applyHotelFilter(userEmail: string, requestedFilter?: string): Promise<string[]> {
    try {
      const accessibleHotels = await this.getAccessibleHotels(userEmail);
      
      // Admin système a accès à tout
      if (accessibleHotels.includes('all')) {
        if (requestedFilter && requestedFilter !== 'all') {
          return [requestedFilter];
        }
        return ['all'];
      }

      // Utilisateur standard : filtrer selon ses permissions
      if (requestedFilter && requestedFilter !== 'all') {
        // Vérifier si l'utilisateur a accès à l'hôtel demandé
        if (accessibleHotels.includes(requestedFilter)) {
          return [requestedFilter];
        }
        // Si pas d'accès, retourner le premier hôtel accessible
        return accessibleHotels.slice(0, 1);
      }

      return accessibleHotels;
    } catch (error) {
      console.error('Error applying hotel filter:', error);
      return [];
    }
  }

  /**
   * Nettoie le cache utilisateur
   */
  static clearUserCache(): void {
    this.userCache.clear();
  }
}

export const permissionsService = PermissionsService;