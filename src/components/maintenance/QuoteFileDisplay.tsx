import React from 'react';
import { FileText, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuoteFileDisplayProps {
  quoteUrl: string;
  onDelete?: () => void;
  isEditable?: boolean;
}

const QuoteFileDisplay: React.FC<QuoteFileDisplayProps> = ({
  quoteUrl,
  onDelete,
  isEditable = true
}) => {
  // Check if the URL is valid before rendering
  const isValidUrl = !!quoteUrl && typeof quoteUrl === 'string' && (
    quoteUrl.startsWith('http://') || 
    quoteUrl.startsWith('https://') || 
    quoteUrl.startsWith('data:')
  );

  if (!isValidUrl) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <FileText className="h-4 w-4" />
        <span>URL de fichier invalide</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a 
        href={quoteUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="bg-brand-100 text-brand-700 px-3 py-2 rounded-md inline-flex items-center hover:bg-brand-200 transition-colors"
      >
        <FileText className="mr-2 h-4 w-4" />
        <span>Voir le devis</span>
        <ExternalLink className="ml-2 h-4 w-4" />
      </a>
      
      {isEditable && onDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8"
          onClick={onDelete}
          type="button"
        >
          <X size={16} />
        </Button>
      )}
    </div>
  );
};

export default QuoteFileDisplay;