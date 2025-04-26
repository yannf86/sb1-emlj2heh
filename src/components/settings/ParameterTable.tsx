import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2 } from 'lucide-react';

interface ParameterTableProps {
  parameters: any[];
  onEdit: (param: any) => void;
  onDelete?: (param: any) => void;
  onToggleActive?: (param: any, active: boolean) => void;
  renderActions?: (param: any) => React.ReactNode;
}

const ParameterTable: React.FC<ParameterTableProps> = ({
  parameters,
  onEdit,
  onDelete,
  onToggleActive,
  renderActions
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Ordre</TableHead>
          <TableHead>Actif</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {parameters.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              Aucun paramètre trouvé
            </TableCell>
          </TableRow>
        ) : (
          parameters
            .sort((a, b) => a.order - b.order)
            .map((param) => (
              <TableRow key={param.id}>
                <TableCell className="font-medium">{param.label}</TableCell>
                <TableCell>{param.code}</TableCell>
                <TableCell>{param.order}</TableCell>
                <TableCell>
                  <Switch 
                    checked={param.active} 
                    onCheckedChange={(checked) => onToggleActive?.(param, checked)}
                  />
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {renderActions?.(param)}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEdit(param)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {onDelete && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onDelete(param)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
        )}
      </TableBody>
    </Table>
  );
};

export default ParameterTable;