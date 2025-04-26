import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { paramTypeLabels, paramTypeIcons } from '@/lib/settings.constants';

interface ParameterTypeListProps {
  paramTypes: { id: string; name: string }[];
  selectedType: string | null;
  onTypeChange: (type: string) => void;
}

const ParameterTypeList: React.FC<ParameterTypeListProps> = ({
  paramTypes,
  selectedType,
  onTypeChange
}) => {
  return (
    <Card className="md:w-64">
      <CardHeader>
        <CardTitle>Types de Paramètres</CardTitle>
        <CardDescription>Sélectionnez un type</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {paramTypes.map((type) => {
            const Icon = paramTypeIcons[type.id];
            return (
              <Button
                key={type.id}
                variant={selectedType === type.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onTypeChange(type.id)}
              >
                {Icon && <Icon className="h-4 w-4 mr-2" />}
                {type.name}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParameterTypeList;