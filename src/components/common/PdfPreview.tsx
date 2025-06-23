import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';

interface PdfPreviewProps {
  url: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure URL has ?alt=media if it's a Firebase Storage URL
  const pdfUrl = url.includes('firebasestorage.googleapis.com') && !url.includes('?alt=media')
    ? `${url}?alt=media`
    : url;

  const handleDocumentLoad = () => {
    setLoading(false);
    setError(null);
  };

  return (
    <div className="pdf-preview-container h-full">
      {loading && (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-creho-500"></div>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-warm-700 text-xs">Aperçu non disponible</div>
        </div>
      )}
      
      <div className={`h-full ${loading ? 'hidden' : ''}`}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={pdfUrl}
            onDocumentLoad={handleDocumentLoad}
            defaultScale={0.5}
            renderLoader={() => <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-creho-500"></div>
            </div>}
          />
        </Worker>
      </div>
    </div>
  );
};

export default PdfPreview;
