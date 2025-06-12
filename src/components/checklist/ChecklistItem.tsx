import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronDown, 
  ChevronUp, 
  Image as ImageIcon
} from 'lucide-react';

interface ChecklistItemProps {
  item: any;
  onToggleComplete: (id: string, completed: boolean) => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggleComplete
}) => {
  const [expanded, setExpanded] = useState(false);

  // Handle toggle expanded
  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // Handle toggle completion
  const handleToggleComplete = (checked: boolean) => {
    onToggleComplete(item.id, checked);
  };

  return (
    <div className="border-b pb-2 last:border-0 last:pb-0">
      <div className="flex items-start py-2">
        <Checkbox 
          checked={item.completed} 
          onCheckedChange={handleToggleComplete}
          className="mt-1"
          id={`item-${item.id}`}
        />
        <div className="ml-3 flex-1">
          <label 
            htmlFor={`item-${item.id}`}
            className={`font-medium cursor-pointer ${item.completed ? 'line-through text-muted-foreground' : ''}`}
          >
            {item.title}
          </label>
          
          {item.assignedTo && (
            <div className="text-xs text-muted-foreground mt-1">
              — {item.assignedToName || 'Assigné'}
            </div>
          )}
        </div>
        
        {(item.imageUrl || item.description) && (
          <button
            onClick={handleToggleExpanded}
            className="text-muted-foreground h-6 w-6 rounded-full hover:bg-slate-100 inline-flex items-center justify-center"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      
      {expanded && (
        <div className="pl-7 pb-2">
          {item.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {item.description}
            </p>
          )}
          
          {item.imageUrl && (
            <div className="mt-2 border rounded-md overflow-hidden">
              <img 
                src={item.imageUrl}
                alt={item.title}
                className="max-h-48 object-contain w-full"
              />
            </div>
          )}
          
          {item.attachmentPath && (
            <div className="mt-2 text-xs text-brand-500">
              <a 
                href={item.attachmentPath}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                {item.attachmentName || item.attachmentPath.split('/').pop()}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChecklistItem;