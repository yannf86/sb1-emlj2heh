import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getHotels } from '@/lib/db/hotels';
import { getHotelLocations } from '@/lib/db/parameters-locations';
import { getIncidentCategoryParameters } from '@/lib/db/parameters-incident-categories';
import { getImpactParameters } from '@/lib/db/parameters-impact';
import { getStatusParameters } from '@/lib/db/parameters-status';
import { getBookingOriginParameters } from '@/lib/db/parameters-booking-origin';
import { getCurrentUser } from '@/lib/auth';
import { getUsers, getUsersByHotel } from '@/lib/db/users';
import { useToast } from '@/hooks/use-toast';

interface IncidentEditProps {
  isOpen: boolean;
  onClose: () => void;
  incident: any;
  onSave: (updatedIncident: any) => void;
}

const IncidentEdit: React.FC<IncidentEditProps> = ({
  isOpen,
  onClose,
  incident,
  onSave
}) => {
  const [formData, setFormData] = useState<any>({
    ...incident,
    concludedById: incident.concludedById || null
  });

  const [hotels, setHotels] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [impacts, setImpacts] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [bookingOrigins, setBookingOrigins] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load hotels
        const hotelsData = await getHotels();
        setHotels(hotelsData);
        
        // Load categories
        const categoriesData = await getIncidentCategoryParameters();
        setCategories(categoriesData);
        
        // Load impacts
        const impactsData = await getImpactParameters();
        setImpacts(impactsData);
        
        // Load statuses
        const statusesData = await getStatusParameters();
        setStatuses(statusesData);
        
        // Load booking origins
        const bookingOriginsData = await getBookingOriginParameters();
        setBookingOrigins(bookingOriginsData);
        
        // Load all users initially
        const allUsers = await getUsers();
        setUsers(allUsers);
        
        // Filter users based on selected hotel
        if (incident.hotelId) {
          const hotelUsers = await getUsersByHotel(incident.hotelId);
          setFilteredUsers(hotelUsers);
        } else {
          setFilteredUsers(allUsers);
        }
        
        // Load locations for the current hotel
        if (incident.hotelId) {
          const locationsData = await getHotelLocations(incident.hotelId);
          setLocations(locationsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [incident.hotelId, toast]);

  // Load locations when hotel changes
  useEffect(() => {
    const loadLocations = async () => {
      if (!formData.hotelId) {
        setLocations([]);
        return;
      }

      try {
        setLoadingLocations(true);
        const locationsData = await getHotelLocations(formData.hotelId);
        setLocations(locationsData);
      } catch (error) {
        console.error('Error loading locations:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les lieux",
          variant: "destructive",
        });
      } finally {
        setLoadingLocations(false);
      }
    };

    loadLocations();
  }, [formData.hotelId, toast]);
  
  // Load users filtered by hotel when hotel selection changes
  useEffect(() => {
    const loadFilteredUsers = async () => {
      if (!formData.hotelId) {
        // If no hotel selected, show all users
        setFilteredUsers(users);
        return;
      }

      try {
        setLoadingUsers(true);
        // Get users with access to the selected hotel
        const hotelUsers = await getUsersByHotel(formData.hotelId);
        setFilteredUsers(hotelUsers);
      } catch (error) {
        console.error('Error loading users by hotel:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les utilisateurs pour cet hôtel",
          variant: "destructive",
        });
        // Fallback to all users
        setFilteredUsers(users);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadFilteredUsers();
  }, [formData.hotelId, users, toast]);

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string | null) => {
    if (name === 'hotelId') {
      // When hotel changes, reset locationId and concludedById
      setFormData(prev => ({
        ...prev,
        [name]: value,
        locationId: '',
        concludedById: null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Filter hotels based on user role
  const filteredHotels = currentUser?.role === 'admin' 
    ? hotels 
    : hotels.filter(hotel => currentUser?.hotels?.includes(hotel.id));

  // Handle save
  const handleSubmit = () => {
    // Here you would normally handle file uploads and create URLs
    onSave(formData);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chargement...</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p>Chargement des données en cours...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'incident</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l'incident
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Heure</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleFormChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotelId">Hôtel</Label>
              <Select 
                value={formData.hotelId} 
                onValueChange={(value) => handleSelectChange('hotelId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un hôtel" />
                </SelectTrigger>
                <SelectContent>
                  {filteredHotels.map(hotel => (
                    <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="locationId">Lieu</Label>
              <Select 
                value={formData.locationId} 
                onValueChange={(value) => handleSelectChange('locationId', value)}
                disabled={!formData.hotelId || loadingLocations}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.hotelId 
                      ? "Sélectionnez d'abord un hôtel" 
                      : loadingLocations 
                        ? "Chargement..." 
                        : "Sélectionnez un lieu"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {loadingLocations ? (
                    <SelectItem value="loading" disabled>Chargement...</SelectItem>
                  ) : locations.length === 0 ? (
                    <SelectItem value="none" disabled>Aucun lieu disponible</SelectItem>
                  ) : (
                    locations
                      .filter(location => location.id && location.id !== '')
                      .map(location => (
                        <SelectItem key={location.id} value={location.id}>{location.label}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Catégorie</Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => handleSelectChange('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(category => category.id && category.id !== '') // Filter out empty IDs
                    .map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="impactId">Impact</Label>
              <Select 
                value={formData.impactId} 
                onValueChange={(value) => handleSelectChange('impactId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un impact" />
                </SelectTrigger>
                <SelectContent>
                  {impacts
                    .filter(impact => impact.id && impact.id !== '') // Filter out empty IDs
                    .map(impact => (
                      <SelectItem key={impact.id} value={impact.id}>{impact.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              value={formData.description}
              onChange={handleFormChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolutionDescription">Description de la résolution</Label>
            <textarea
              id="resolutionDescription"
              name="resolutionDescription"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder="Description de la résolution (optionnel)"
              value={formData.resolutionDescription || ''}
              onChange={handleFormChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receivedById">Reçu par</Label>
              <Input
                id="receivedById"
                name="receivedById"
                value={currentUser?.name || ''}
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="concludedById">Conclu par</Label>
              <Select 
                value={formData.concludedById || "none"} 
                onValueChange={(value) => handleSelectChange('concludedById', value === "none" ? null : value)}
                disabled={loadingUsers || !formData.hotelId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.hotelId
                      ? "Sélectionnez d'abord un hôtel"
                      : loadingUsers
                        ? "Chargement..."
                        : "Sélectionnez un utilisateur"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">En Attente</SelectItem>
                  {loadingUsers ? (
                    <SelectItem value="loading" disabled>Chargement des utilisateurs...</SelectItem>
                  ) : filteredUsers.length === 0 ? (
                    <SelectItem value="empty" disabled>Aucun utilisateur disponible</SelectItem>
                  ) : (
                    filteredUsers
                      .filter(user => user.id && user.id !== '')
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statusId">Statut</Label>
              <Select 
                value={formData.statusId} 
                onValueChange={(value) => handleSelectChange('statusId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statuses
                    .filter(status => status.id && status.id !== '') // Filter out empty IDs
                    .map(status => (
                      <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Informations Client</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nom du client</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  value={formData.clientName || ''}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  name="clientEmail"
                  type="email"
                  value={formData.clientEmail || ''}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Téléphone</Label>
              <Input
                id="clientPhone"
                name="clientPhone"
                type="tel"
                value={formData.clientPhone || ''}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arrivalDate">Date d'arrivée</Label>
                <Input
                  id="arrivalDate"
                  name="arrivalDate"
                  type="date"
                  value={formData.arrivalDate || ''}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="departureDate">Date de départ</Label>
                <Input
                  id="departureDate"
                  name="departureDate"
                  type="date"
                  value={formData.departureDate || ''}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reservationAmount">Montant réservation</Label>
                <Input
                  id="reservationAmount"
                  name="reservationAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.reservationAmount || ''}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="origin">Origine réservation</Label>
                <Select 
                  value={formData.origin || "none"} 
                  onValueChange={(value) => handleSelectChange('origin', value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une origine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non spécifié</SelectItem>
                    {bookingOrigins
                      .filter(origin => origin.id && origin.id !== '')
                      .map(origin => (
                        <SelectItem key={origin.id} value={origin.id}>{origin.label}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Enregistrer les modifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentEdit;