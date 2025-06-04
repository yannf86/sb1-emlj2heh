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
          loading="lazy"
          onError={(e) => {
            console.error(`Error loading image: ${photoUrl}`);
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNmMWYxZjEiLz48cGF0aCBkPSJNMTIgMTJDMTQuMjA5MSAxMiAxNiAxMC4yMDkxIDE2IDhDMTYgNS43OTA4NiAxNC4yMDkxIDQgMTIgNEM5Ljc5MDg2IDQgOCA1Ljc5MDg2IDggOEM4IDEwLjIwOTEgOS43OTA4NiAxMiAxMiAxMloiIGZpbGw9IiNjMmMyYzIiLz48cGF0aCBkPSJNNSAxOUM1IDE1LjEzNCA4LjEzNDAxIDEyIDEyIDEyQzE1Ljg2NiAxMiAxOSAxNS4xMzQgMTkgMTlDMTkgMTkuNTUyMyAxOC41NTIzIDIwIDE4IDIwSDZDNS40NDc3MiAyMCA1IDE5LjU1MjMgNSAxOVoiIGZpbGw9IiNjMmMyYzIiLz48L3N2Zz4=';
            e.currentTarget.classList.add('error-image');
          }}
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