import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ParameterTypeList from '../ParameterTypeList';
import ParameterTable from '../ParameterTable';
import ParameterDialog from '../ParameterDialog';
import LocationHotelsDialog from '../LocationHotelsDialog';
import { paramTypeLabels } from '@/lib/settings.constants';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getParameterTypes, getParametersByCollection } from '@/lib/db/parameters-types';

const ParametersTab = () => {
  const [selectedParamType, setSelectedParamType] = useState<string | null>(null);
  const [editingParam, setEditingParam] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [hotelsDialogOpen, setHotelsDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [parameterTypes, setParameterTypes] = useState<any[]>([]);
  const [parameters, setParameters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newParam, setNewParam] = useState({
    label: '',
    code: '',
    order: 1,
    active: true
  });
  
  const { toast } = useToast();

  // Load parameter types and parameters
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load parameter types
        const types = await getParameterTypes();
        setParameterTypes(types);
        
        // Set initial type and load its parameters
        if (types.length > 0) {
          const initialType = types[0].id;
          setSelectedParamType(initialType);
          const params = await getParametersByCollection(initialType);
          setParameters(params);
        }
      } catch (error) {
        console.error('Error loading parameters:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load parameters when type changes
  useEffect(() => {
    const loadParameters = async () => {
      if (!selectedParamType) return;
      
      try {
        setLoading(true);
        const params = await getParametersByCollection(selectedParamType);
        setParameters(params);
      } catch (error) {
        console.error('Error loading parameters:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadParameters();
  }, [selectedParamType]);

  // Handle edit parameter
  const handleEditParam = (param: any) => {
    setEditingParam(param);
    setEditDialogOpen(true);
  };

  // Handle save parameter
  const handleSaveParam = async () => {
    if (!editingParam || !selectedParamType) return;
    
    try {
      setSaving(true);
      
      // Update parameter in the specific collection
      const collectionName = `parameters_${selectedParamType}`;
      const paramRef = doc(db, collectionName, editingParam.id);
      await updateDoc(paramRef, {
        ...editingParam,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setParameters(prev => prev.map(p => 
        p.id === editingParam.id ? editingParam : p
      ));
      
      toast({
        title: "Paramètre mis à jour",
        description: "Les modifications ont été enregistrées avec succès",
      });
      
      setEditDialogOpen(false);
      setEditingParam(null);
    } catch (error) {
      console.error('Error updating parameter:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du paramètre",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle add parameter
  const handleAddParam = async () => {
    if (!selectedParamType) return;
    
    try {
      setSaving(true);
      
      // Create new parameter in the specific collection
      const collectionName = `parameters_${selectedParamType}`;
      const docRef = await addDoc(collection(db, collectionName), {
        ...newParam,
        type: selectedParamType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      const newParamWithId = {
        id: docRef.id,
        ...newParam,
        type: selectedParamType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setParameters(prev => [...prev, newParamWithId]);
      
      toast({
        title: "Paramètre ajouté",
        description: "Le nouveau paramètre a été créé avec succès",
      });
      
      setAddDialogOpen(false);
      setNewParam({
        label: '',
        code: '',
        order: 1,
        active: true
      });
    } catch (error) {
      console.error('Error adding parameter:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du paramètre",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete parameter
  const handleDeleteParam = async (param: any) => {
    if (!selectedParamType) return;
    
    try {
      setSaving(true);
      
      // Delete parameter from the specific collection
      const collectionName = `parameters_${selectedParamType}`;
      await deleteDoc(doc(db, collectionName, param.id));
      
      // Update local state
      setParameters(prev => prev.filter(p => p.id !== param.id));
      
      toast({
        title: "Paramètre supprimé",
        description: "Le paramètre a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting parameter:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du paramètre",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (param: any, active: boolean) => {
    if (!selectedParamType) return;
    
    try {
      setSaving(true);
      
      // Update parameter in the specific collection
      const collectionName = `parameters_${selectedParamType}`;
      const paramRef = doc(db, collectionName, param.id);
      await updateDoc(paramRef, {
        active,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setParameters(prev => prev.map(p => 
        p.id === param.id ? { ...p, active } : p
      ));
      
      toast({
        title: active ? "Paramètre activé" : "Paramètre désactivé",
        description: `Le paramètre a été ${active ? 'activé' : 'désactivé'} avec succès`,
      });
    } catch (error) {
      console.error('Error updating parameter status:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut",
        variant: "destructive",
      });
      
      // Revert local state on error
      setParameters(prev => prev.map(p => 
        p.id === param.id ? { ...p, active: !active } : p
      ));
    } finally {
      setSaving(false);
    }
  };

  // Handle manage hotels for location
  const handleManageHotels = (location: any) => {
    setSelectedLocation(location);
    setHotelsDialogOpen(true);
  };

  // Render additional actions for locations
  const renderLocationActions = (param: any) => {
    if (selectedParamType !== 'location') return null;

    return (
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => handleManageHotels(param)}
        disabled={saving}
      >
        <Building className="h-4 w-4 mr-2" />
        Hôtels
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Chargement des paramètres...</h2>
          <p className="text-muted-foreground">Veuillez patienter pendant le chargement des données.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <ParameterTypeList 
        paramTypes={parameterTypes}
        selectedType={selectedParamType}
        onTypeChange={setSelectedParamType}
      />
      
      <div className="flex-1 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>
                {selectedParamType ? paramTypeLabels[selectedParamType] || selectedParamType : 'Sélectionnez un type'}
              </CardTitle>
              <CardDescription>
                Gérer les paramètres de type {selectedParamType ? paramTypeLabels[selectedParamType]?.toLowerCase() || selectedParamType : ''}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={() => setAddDialogOpen(true)}
                disabled={!selectedParamType || saving}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ParameterTable 
              parameters={parameters}
              onEdit={handleEditParam}
              onDelete={handleDeleteParam}
              onToggleActive={handleToggleActive}
              renderActions={renderLocationActions}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Parameter Dialog */}
      <ParameterDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        title="Ajouter un paramètre"
        description={`Ajoutez un nouveau paramètre de type ${selectedParamType ? paramTypeLabels[selectedParamType]?.toLowerCase() : ''}`}
        data={newParam}
        onChange={(field, value) => setNewParam(prev => ({ ...prev, [field]: value }))}
        onSave={handleAddParam}
        type={selectedParamType || ''}
      />

      {/* Edit Parameter Dialog */}
      <ParameterDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Modifier le paramètre"
        description="Modifiez les informations du paramètre"
        data={editingParam || {}}
        onChange={(field, value) => setEditingParam(prev => ({ ...prev, [field]: value }))}
        onSave={handleSaveParam}
        type={selectedParamType || ''}
      />

      {/* Location Hotels Dialog */}
      {selectedLocation && (
        <LocationHotelsDialog
          isOpen={hotelsDialogOpen}
          onClose={() => {
            setHotelsDialogOpen(false);
            setSelectedLocation(null);
          }}
          location={{
            id: selectedLocation.id,
            label: selectedLocation.label
          }}
        />
      )}
    </div>
  );
};

export default ParametersTab;