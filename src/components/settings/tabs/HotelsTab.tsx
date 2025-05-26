import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Building, MapPin, Globe, Trash2, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import HotelLocationsDialog from '../HotelLocationsDialog';

interface Hotel {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  imageUrl?: string;
}

const HotelsTab = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHotelDialog, setNewHotelDialog] = useState(false);
  const [editHotelDialog, setEditHotelDialog] = useState(false);
  const [deleteHotelDialog, setDeleteHotelDialog] = useState(false);
  const [locationsDialog, setLocationsDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    address: '',
    city: '',
    country: '',
    imageUrl: ''
  });

  // Load hotels on mount
  useEffect(() => {
    loadHotels();
  }, []);

  // Load hotels from Firebase
  const loadHotels = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'hotels'));
      const hotelsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Hotel[];
      setHotels(hotelsData);
    } catch (error) {
      console.error('Error loading hotels:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des hôtels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open edit dialog
  const handleEdit = (hotel: Hotel) => {
    setFormData(hotel);
    setEditHotelDialog(true);
  };

  // Open delete dialog
  const handleDeleteClick = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setDeleteHotelDialog(true);
  };

  // Open locations dialog
  const handleLocationsClick = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setLocationsDialog(true);
  };

  // Handle delete hotel
  const handleDelete = async () => {
    if (!selectedHotel) return;

    try {
      setSaving(true);

      // Delete hotel from Firestore
      await deleteDoc(doc(db, 'hotels', selectedHotel.id));

      toast({
        title: "Hôtel supprimé",
        description: "L'hôtel a été supprimé avec succès",
      });

      // Close dialog and reload hotels
      setDeleteHotelDialog(false);
      setSelectedHotel(null);
      await loadHotels();
    } catch (error) {
      console.error('Error deleting hotel:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'hôtel",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle form submission for new hotel
  const handleSubmit = async () => {
    // Validate form
    if (!formData.name || !formData.address || !formData.city || !formData.country) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Create new hotel in Firebase
      await addDoc(collection(db, 'hotels'), {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        imageUrl: formData.imageUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Show success message
      toast({
        title: "Hôtel créé",
        description: "L'hôtel a été créé avec succès",
      });

      // Reset form and close dialog
      setFormData({
        id: '',
        name: '',
        address: '',
        city: '',
        country: '',
        imageUrl: ''
      });
      setNewHotelDialog(false);

      // Reload hotels
      await loadHotels();
    } catch (error) {
      console.error('Error creating hotel:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'hôtel",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle form submission for edit
  const handleUpdate = async () => {
    // Validate form
    if (!formData.name || !formData.address || !formData.city || !formData.country) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Update hotel in Firebase
      const hotelRef = doc(db, 'hotels', formData.id);
      await updateDoc(hotelRef, {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        imageUrl: formData.imageUrl || null,
        updatedAt: new Date().toISOString()
      });

      // Show success message
      toast({
        title: "Hôtel modifié",
        description: "L'hôtel a été modifié avec succès",
      });

      // Reset form and close dialog
      setFormData({
        id: '',
        name: '',
        address: '',
        city: '',
        country: '',
        imageUrl: ''
      });
      setEditHotelDialog(false);

      // Reload hotels
      await loadHotels();
    } catch (error) {
      console.error('Error updating hotel:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification de l'hôtel",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Chargement des hôtels...</h2>
            <p className="text-muted-foreground">Veuillez patienter pendant le chargement des données.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Gestion des Hôtels</CardTitle>
          <CardDescription>
            Ajouter, modifier ou supprimer les hôtels du système
          </CardDescription>
        </div>
        <Button onClick={() => setNewHotelDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un Hôtel
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hotels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Aucun hôtel trouvé
                </TableCell>
              </TableRow>
            ) : (
              hotels.map((hotel) => (
                <TableRow key={hotel.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-brand-500" />
                      {hotel.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                      {hotel.address}
                    </div>
                  </TableCell>
                  <TableCell>{hotel.city}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-slate-400" />
                      {hotel.country}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleLocationsClick(hotel)}
                      disabled={saving}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Lieux
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(hotel)}
                      disabled={saving}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteClick(hotel)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Hotel Locations Dialog */}
      {selectedHotel && (
        <HotelLocationsDialog
          isOpen={locationsDialog}
          onClose={() => {
            setLocationsDialog(false);
            setSelectedHotel(null);
          }}
          hotel={{
            id: selectedHotel.id,
            name: selectedHotel.name
          }}
        />
      )}

      {/* New Hotel Dialog */}
      <Dialog open={newHotelDialog} onOpenChange={setNewHotelDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel hôtel</DialogTitle>
            <DialogDescription>
              Créez un nouvel hôtel dans le système
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Nom de l'hôtel
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nom de l'hôtel"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Adresse
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Adresse complète"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  Ville
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Ville"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  Pays
                </Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Pays"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">
                URL de l'image
              </Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                URL d'une image représentative de l'hôtel (optionnel)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewHotelDialog(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Création...' : 'Créer l\'hôtel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Hotel Dialog */}
      <Dialog open={editHotelDialog} onOpenChange={setEditHotelDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'hôtel</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'hôtel
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Nom de l'hôtel
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nom de l'hôtel"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-address" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Adresse
              </Label>
              <Input
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Adresse complète"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  Ville
                </Label>
                <Input
                  id="edit-city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Ville"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-country" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  Pays
                </Label>
                <Input
                  id="edit-country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Pays"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">
                URL de l'image
              </Label>
              <Input
                id="edit-imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                URL d'une image représentative de l'hôtel (optionnel)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditHotelDialog(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Hotel Dialog */}
      <Dialog open={deleteHotelDialog} onOpenChange={setDeleteHotelDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Supprimer l'hôtel</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet hôtel ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {selectedHotel && (
            <div className="py-4">
              <div className="flex items-center mb-4">
                <Building className="h-5 w-5 mr-2 text-brand-500" />
                <h3 className="text-lg font-medium">{selectedHotel.name}</h3>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {selectedHotel.address}
                </p>
                <p className="flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  {selectedHotel.city}, {selectedHotel.country}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteHotelDialog(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? 'Suppression...' : 'Supprimer l\'hôtel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default HotelsTab;