import React from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoDisplayProps {
  photoUrl: string;
  type: 'before' | 'after';
  onDelete?: () => void;
  altText?: string;
  isEditable?: boolean;
}

const PhotoDisplay: React.FC<PhotoDisplayProps> = ({
  photoUrl,
  type,
  onDelete,
  altText = "Photo",
  isEditable = true
}) => {
  return (
    <div className="relative rounded-md overflow-hidden border">
      <div className="relative aspect-video bg-slate-100">
        <img 
          src={photoUrl} 
          alt={type === 'before' ? `${altText} avant` : `${altText} après`}
          className="w-full h-full object-contain"
        />
      </div>
      
      <div className="absolute top-0 left-0 p-2 bg-black/60 text-white text-xs font-medium rounded-br">
        {type === 'before' ? 'Avant' : 'Après'}
      </div>
      
      <div className="absolute top-0 right-0 p-1 flex gap-1">
        <a 
          href={photoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
        >
          <ExternalLink size={16} />
        </a>
        
        {isEditable && onDelete && (
          <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6 rounded-full"
            onClick={onDelete}
          >
            <X size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PhotoDisplay;