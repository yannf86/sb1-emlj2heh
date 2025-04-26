import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Truck, 
  Building, 
  Phone, 
  Mail, 
  Globe, 
  User, 
  FileText, 
  Star, 
  Tag, 
  Plus,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { 
  suppliers, 
  supplierCategories, 
  supplierSubcategories, 
  hotels,
  getSupplierCategoryName,
  getSupplierSubcategoryName,
  getHotelName
} from '@/lib/data';

// Import components
import SupplierSearch from '@/components/suppliers/SupplierSearch';
import SupplierList from '@/components/suppliers/SupplierList';
import SupplierDialog from '@/components/suppliers/SupplierDialog';

const SuppliersPage = () => {
  const [viewMode, setViewMode] = useState<'categories' | 'subcategories' | 'suppliers'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [newSupplierDialogOpen, setNewSupplierDialogOpen] = useState(false);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [viewSupplierDialogOpen, setViewSupplierDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  
  // Filtrer les sous-catégories en fonction de la catégorie sélectionnée
  const filteredSubcategories = supplierSubcategories.filter(
    sub => sub.categoryId === selectedCategory
  );
  
  // Filtrer les fournisseurs en fonction des critères
  const filteredSuppliers = suppliers.filter(supplier => {
    // Filtrer par sous-catégorie
    if (selectedSubcategory && supplier.subcategoryId !== selectedSubcategory) return false;
    
    // Filtrer par catégorie si pas de sous-catégorie sélectionnée
    if (!selectedSubcategory && selectedCategory) {
      const supplierCategory = supplierSubcategories.find(
        sub => sub.id === supplier.subcategoryId
      )?.categoryId;
      if (supplierCategory !== selectedCategory) return false;
    }
    
    // Recherche textuelle
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = supplier.companyName.toLowerCase().includes(query);
      const matchesDescription = supplier.description.toLowerCase().includes(query);
      const matchesCity = supplier.city.toLowerCase().includes(query);
      const matchesCategory = getSupplierCategoryName(supplier.subcategoryId).toLowerCase().includes(query);
      const matchesSubcategory = getSupplierSubcategoryName(supplier.subcategoryId).toLowerCase().includes(query);
      
      return matchesName || matchesDescription || matchesCity || matchesCategory || matchesSubcategory;
    }
    
    return true;
  });
  
  // Compter les fournisseurs par catégorie
  const getSupplierCountByCategory = (categoryId: string) => {
    const subcategoryIds = supplierSubcategories
      .filter(sub => sub.categoryId === categoryId)
      .map(sub => sub.id);
    
    return suppliers.filter(s => subcategoryIds.includes(s.subcategoryId)).length;
  };
  
  // Compter les fournisseurs par sous-catégorie
  const getSupplierCountBySubcategory = (subcategoryId: string) => {
    return suppliers.filter(s => s.subcategoryId === subcategoryId).length;
  };
  
  // Sélectionner une catégorie
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setViewMode('subcategories');
  };
  
  // Sélectionner une sous-catégorie
  const handleSelectSubcategory = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    setViewMode('suppliers');
  };
  
  // Retour à la vue des catégories
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setViewMode('categories');
    setSearchQuery('');
  };
  
  // Retour à la vue des sous-catégories
  const handleBackToSubcategories = () => {
    setSelectedSubcategory(null);
    setViewMode('subcategories');
    setSearchQuery('');
  };
  
  // Handle view supplier
  const handleViewSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
      setViewSupplierDialogOpen(true);
    }
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFiltersExpanded(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fournisseurs</h1>
          <p className="text-muted-foreground">Gestion des fournisseurs et de leurs contrats</p>
        </div>
        
        <Button onClick={() => setNewSupplierDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Fournisseur
        </Button>
      </div>
      
      {viewMode === 'categories' ? (
        /* Vue par catégories */
        <div className="space-y-4">
          <SupplierSearch 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            filtersExpanded={filtersExpanded}
            onFiltersExpandedChange={setFiltersExpanded}
            onReset={handleResetFilters}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {supplierCategories.map(category => {
              const supplierCount = getSupplierCountByCategory(category.id);
              
              return (
                <Card 
                  key={category.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700"
                  onClick={() => handleSelectCategory(category.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center">
                      <div className="mr-3 p-3 bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-300 rounded-lg text-2xl">
                        {category.icon}
                      </div>
                      <span>{category.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {supplierCount} fournisseur{supplierCount !== 1 ? 's' : ''}
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1">
                        Voir <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'subcategories' ? (
        /* Vue des sous-catégories */
        <div className="space-y-4">
          {selectedCategory && (
            <div className="flex items-center gap-2 mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToCategories}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour aux catégories
              </Button>
              
              <div className="flex items-center bg-brand-50 dark:bg-brand-900 rounded-lg px-3 py-1.5">
                <div className="mr-2 text-xl">
                  {supplierCategories.find(cat => cat.id === selectedCategory)?.icon}
                </div>
                <span className="font-medium">
                  {supplierCategories.find(cat => cat.id === selectedCategory)?.name}
                </span>
              </div>
            </div>
          )}
          
          <SupplierSearch 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            filtersExpanded={filtersExpanded}
            onFiltersExpandedChange={setFiltersExpanded}
            onReset={handleResetFilters}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredSubcategories.map(subcategory => {
              const supplierCount = getSupplierCountBySubcategory(subcategory.id);
              
              return (
                <Card 
                  key={subcategory.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700"
                  onClick={() => handleSelectSubcategory(subcategory.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{subcategory.name}</CardTitle>
                    <CardDescription>{subcategory.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {supplierCount} fournisseur{supplierCount !== 1 ? 's' : ''}
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1">
                        Voir <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* Vue des fournisseurs */
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBackToSubcategories}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour aux sous-catégories
            </Button>
            
            {selectedSubcategory && (
              <div className="flex items-center bg-brand-50 dark:bg-brand-900 rounded-lg px-3 py-1.5">
                <span className="font-medium">
                  {getSupplierSubcategoryName(selectedSubcategory)}
                </span>
              </div>
            )}
          </div>
          
          <SupplierSearch 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            filtersExpanded={filtersExpanded}
            onFiltersExpandedChange={setFiltersExpanded}
            onReset={handleResetFilters}
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Liste des Fournisseurs</CardTitle>
              <CardDescription>
                {selectedSubcategory && getSupplierSubcategoryName(selectedSubcategory)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <SupplierList 
                suppliers={filteredSuppliers}
                onViewSupplier={handleViewSupplier}
              />
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Supplier Dialog */}
      <SupplierDialog 
        supplier={selectedSupplier}
        isOpen={viewSupplierDialogOpen}
        onClose={() => setViewSupplierDialogOpen(false)}
      />
      
      {/* New Supplier Dialog */}
      <Dialog open={newSupplierDialogOpen} onOpenChange={setNewSupplierDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau Fournisseur</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau fournisseur au système
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={selectedCategory || "none"} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subcategory">Sous-catégorie</Label>
                <Select 
                  value={selectedSubcategory || "none"} 
                  onValueChange={setSelectedSubcategory}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      selectedCategory 
                        ? "Sélectionner une sous-catégorie" 
                        : "Choisissez d'abord une catégorie"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubcategories.map(subcategory => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input id="companyName" placeholder="Nom de l'entreprise" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Description de l'entreprise" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" placeholder="+33 1 23 45 67 89" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="contact@entreprise.fr" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" placeholder="Adresse" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" placeholder="Ville" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Hôtels concernés</Label>
              <div className="border rounded-md p-4 space-y-2">
                {hotels.map(hotel => (
                  <div key={hotel.id} className="flex items-center space-x-2">
                    <Switch 
                      id={`hotel-${hotel.id}`}
                      checked={selectedHotels.includes(hotel.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedHotels([...selectedHotels, hotel.id]);
                        } else {
                          setSelectedHotels(selectedHotels.filter(id => id !== hotel.id));
                        }
                      }}
                    />
                    <Label htmlFor={`hotel-${hotel.id}`}>{hotel.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSupplierDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" onClick={() => setNewSupplierDialogOpen(false)}>
              Créer le fournisseur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuppliersPage;