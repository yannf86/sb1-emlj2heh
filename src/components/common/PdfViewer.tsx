import React, { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { ToolbarSlot, ToolbarProps } from '@react-pdf-viewer/toolbar';
import { X, ExternalLink } from 'lucide-react';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PdfViewerProps {
  url: string;
  onClose?: () => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure URL has ?alt=media if it's a Firebase Storage URL
  const pdfUrl = url.includes('firebasestorage.googleapis.com') && !url.includes('?alt=media')
    ? `${url}?alt=media`
    : url;

  // Create the default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    toolbarPlugin: {
      renderDefaultToolbar: (Toolbar: (props: ToolbarProps) => React.ReactElement) => (
        <Toolbar>
          {(slots: ToolbarSlot) => (
            <div className="rpv-toolbar">
              <div className="rpv-toolbar__left">
                <div className="rpv-toolbar__item">
                  <slots.NumberOfPages />
                </div>
                <div className="rpv-toolbar__item">
                  <slots.GoToPageField />
                </div>
                <div className="rpv-toolbar__item">
                  <slots.GoToNextPage />
                </div>
                <div className="rpv-toolbar__item">
                  <slots.GoToPreviousPage />
                </div>
              </div>
              <div className="rpv-toolbar__center">
                <div className="rpv-toolbar__item">
                  <slots.Zoom />
                </div>
                <div className="rpv-toolbar__item">
                  <slots.ZoomIn />
                </div>
                <div className="rpv-toolbar__item">
                  <slots.ZoomOut />
                </div>
                <div className="rpv-toolbar__item">
                  <slots.SwitchTheme />
                </div>
                <div className="rpv-toolbar__item">
                  <slots.FullScreen />
                </div>
              </div>
              <div className="rpv-toolbar__right">
                <div className="rpv-toolbar__item">
                  <slots.Print />
                </div>
                <div className="rpv-toolbar__item">
                  <slots.Download />
                </div>
                <div className="rpv-toolbar__item">
                  <a 
                    href={pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="rpv-core__button rpv-core__button--outline"
                    title="Ouvrir dans un nouvel onglet"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
                {onClose && (
                  <div className="rpv-toolbar__item">
                    <button 
                      className="rpv-core__button rpv-core__button--outline"
                      onClick={onClose}
                      title="Fermer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Toolbar>
      ),
    },
  });

  const handleDocumentLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setLoading(false);
    setError('Impossible de charger le document PDF. Veuillez essayer de l\'ouvrir dans un nouvel onglet.');
  };

  return (
    <div className="pdf-viewer-container h-full">
      {loading && (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-creho-500"></div>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-warm-700 mb-4">{error}</div>
          <div className="flex space-x-4">
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-creho-500 text-white rounded-lg hover:bg-creho-600 transition-colors"
            >
              Ouvrir dans un nouvel onglet
            </a>
            <a 
              href={pdfUrl} 
              download
              className="px-4 py-2 bg-warm-100 text-warm-700 rounded-lg hover:bg-warm-200 transition-colors"
            >
              Télécharger
            </a>
          </div>
        </div>
      )}
      
      <div className={`h-full ${loading ? 'hidden' : ''}`}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={pdfUrl}
            plugins={[defaultLayoutPluginInstance]}
            onDocumentLoad={handleDocumentLoad}
            onError={handleError}
          />
        </Worker>
      </div>
    </div>
  );
};

export default PdfViewer;
