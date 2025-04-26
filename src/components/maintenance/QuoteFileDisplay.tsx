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
        >
          <X size={16} />
        </Button>
      )}
    </div>
  );
};

export default QuoteFileDisplay;