import { useState } from 'react';
import { Plus, Trash2, FileText, Euro, Check, XCircle, Clock, Upload, Download, File } from 'lucide-react';
import { TechnicalQuote, Technician } from '../../../types/maintenance';
import { useQuoteManagement } from '../../../hooks/useQuoteManagement';
import { storageService } from '../../../services/firebase/storageService';

interface InterventionQuotesProps {
  hasQuote: boolean;
  quotes: TechnicalQuote[];
  technicians: Technician[];
  onQuoteToggle: (hasQuote: boolean) => void;
  onQuotesUpdate: (quotes: TechnicalQuote[]) => void;
  interventionId?: string; // ID de l'intervention pour l'upload des fichiers de devis
}

export default function InterventionQuotes({
  hasQuote,
  quotes,
  technicians,
  onQuoteToggle,
  onQuotesUpdate,
  interventionId
}: InterventionQuotesProps) {
  const { addQuote, removeQuote, updateQuote } = useQuoteManagement();
  const [uploading, setUploading] = useState<{[key: string]: boolean}>({});
  const [uploadError, setUploadError] = useState<{[key: string]: string}>({});

  const handleToggle = (enabled: boolean) => {
    onQuoteToggle(enabled);
    if (enabled && quotes.length === 0) {
      onQuotesUpdate([useQuoteManagement().createNewQuote()]);
    } else if (!enabled) {
      onQuotesUpdate([]);
    }
  };

  const handleAddQuote = () => {
    const newQuotes = addQuote(quotes);
    onQuotesUpdate(newQuotes);
  };

  const handleRemoveQuote = (index: number) => {
    const newQuotes = removeQuote(quotes, index);
    onQuotesUpdate(newQuotes);
  };

  const handleUpdateQuote = (index: number, field: keyof TechnicalQuote, value: any) => {
    const updatedQuotes = updateQuote(quotes, index, field, value);
    onQuotesUpdate(updatedQuotes);
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!interventionId) {
      setUploadError({ ...uploadError, [quotes[index].id]: 'ID d\'intervention manquant' });
      return;
    }
    
    const quoteId = quotes[index].id;
    
    try {
      setUploading({ ...uploading, [quoteId]: true });
      setUploadError({ ...uploadError, [quoteId]: '' });
      
      const downloadURL = await storageService.uploadQuoteFile(file, interventionId, quoteId);
      
      // Mettre à jour le devis avec l'URL du fichier
      const updatedQuotes = updateQuote(quotes, index, 'quoteFileUrl', downloadURL);
      onQuotesUpdate(updatedQuotes);
      
      setUploading({ ...uploading, [quoteId]: false });
    } catch (error) {
      console.error('Erreur lors du téléchargement du devis:', error);
      setUploadError({ ...uploadError, [quoteId]: 'Erreur lors du téléchargement du fichier' });
      setUploading({ ...uploading, [quoteId]: false });
    }
  };
  
  const handleFileDelete = async (index: number) => {
    const quote = quotes[index];
    if (!quote.quoteFileUrl) return;
    
    try {
      setUploading({ ...uploading, [quote.id]: true });
      await storageService.deleteFile(quote.quoteFileUrl);
      
      // Supprimer l'URL du fichier du devis
      const updatedQuotes = updateQuote(quotes, index, 'quoteFileUrl', null);
      onQuotesUpdate(updatedQuotes);
      
      setUploading({ ...uploading, [quote.id]: false });
    } catch (error) {
      console.error('Erreur lors de la suppression du devis:', error);
      setUploadError({ ...uploadError, [quote.id]: 'Erreur lors de la suppression du fichier' });
      setUploading({ ...uploading, [quote.id]: false });
    }
  };

  const getTechnicianName = (technicianId: string) => {
    const technician = technicians.find(t => t.id === technicianId);
    return technician?.name || 'Technicien inconnu';
  };

  const getQuoteStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-orange-100 text-orange-700 border-orange-200',
      accepted: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getQuoteStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <Check className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="border-t border-warm-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-warm-900">Gestion des devis</h3>
        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={hasQuote}
              onChange={(e) => handleToggle(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-12 h-6 rounded-full relative transition-colors ${
              hasQuote ? 'bg-blue-500' : 'bg-warm-300'
            }`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                hasQuote ? 'translate-x-7' : 'translate-x-1'
              }`}></div>
            </div>
            <span className="ml-3 text-sm text-warm-700">Devis reçu</span>
          </label>
        </div>
      </div>

      {hasQuote && (
        <div className="space-y-4">
          {quotes.map((quote, index) => (
            <div key={quote.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-blue-900 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Devis {index + 1}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getQuoteStatusColor(quote.status)}`}>
                    {getQuoteStatusIcon(quote.status)}
                    <span className="ml-1">
                      {quote.status === 'pending' ? 'En attente' : 
                       quote.status === 'accepted' ? 'Accepté' : 'Refusé'}
                    </span>
                  </span>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuote(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Technicien *
                  </label>
                  <select
                    required
                    value={quote.technicianId}
                    onChange={(e) => handleUpdateQuote(index, 'technicianId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un technicien</option>
                    {technicians.map(technician => (
                      <option key={technician.id} value={technician.id}>{technician.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Statut *
                  </label>
                  <select
                    value={quote.status}
                    onChange={(e) => handleUpdateQuote(index, 'status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">En attente</option>
                    <option value="accepted">Accepté</option>
                    <option value="rejected">Refusé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Montant (€) *
                  </label>
                  <div className="relative">
                    <Euro className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={quote.amount === 0 ? '' : quote.amount}
                      onChange={(e) => handleUpdateQuote(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="pl-10 pr-4 py-2 w-full text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Remise obtenue (€)
                  </label>
                  <div className="relative">
                    <Euro className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quote.discount === 0 ? '' : quote.discount}
                      onChange={(e) => handleUpdateQuote(index, 'discount', parseFloat(e.target.value) || 0)}
                      className="pl-10 pr-4 py-2 w-full text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={quote.notes}
                  onChange={(e) => handleUpdateQuote(index, 'notes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Notes sur ce devis..."
                />
              </div>
              
              <div className="mt-3">
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Fichier de devis
                </label>
                <div className="flex items-center space-x-2">
                  {!quote.quoteFileUrl ? (
                    <div className="flex-1">
                      {!interventionId ? (
                        <div className="flex items-center justify-center w-full px-4 py-2 border border-blue-300 border-dashed rounded-lg bg-gray-50">
                          <Clock className="w-4 h-4 text-blue-400 mr-2" />
                          <span className="text-sm text-blue-500">L'upload sera disponible après l'enregistrement</span>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center w-full px-4 py-2 border border-blue-300 border-dashed rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                          <Upload className="w-4 h-4 text-blue-500 mr-2" />
                          <span className="text-sm text-blue-600">Choisir un fichier</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(index, e.target.files[0]);
                              }
                            }}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          />
                        </label>
                      )}
                      {uploadError[quote.id] && (
                        <p className="text-xs text-red-500 mt-1">{uploadError[quote.id]}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between p-2 border border-blue-200 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <File className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-sm text-blue-600 truncate max-w-[150px]">
                          {quote.quoteFileUrl.split('/').pop()}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <a 
                          href={quote.quoteFileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1 rounded-md hover:bg-blue-100 transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4 text-blue-500" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleFileDelete(index)}
                          className="p-1 rounded-md hover:bg-red-100 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  )}
                  {uploading[quote.id] && (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>

              {quote.amount > 0 && quote.discount > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-700">
                    <strong>Prix final: {(quote.amount - quote.discount).toFixed(2)}€</strong>
                    <span className="ml-2 text-green-600">
                      (Économie: {quote.discount}€ - {((quote.discount / quote.amount) * 100).toFixed(1)}%)
                    </span>
                  </p>
                </div>
              )}
            </div>
          ))}

          {quotes.length < 3 && (
            <button
              type="button"
              onClick={handleAddQuote}
              className="w-full px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter devis {quotes.length + 1}
            </button>
          )}

          {quotes.length > 0 && (
            <div className="bg-warm-50 border border-warm-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-warm-900 mb-2">Résumé des devis</h5>
              <div className="space-y-1">
                {quotes.map((quote, index) => {
                  const finalAmount = quote.amount - quote.discount;
                  return (
                    <div key={quote.id} className="flex justify-between text-xs">
                      <span>Devis {index + 1} ({getTechnicianName(quote.technicianId)}):</span>
                      <span className={`font-medium ${
                        quote.status === 'accepted' ? 'text-green-600' : 
                        quote.status === 'rejected' ? 'text-red-600' : 'text-warm-600'
                      }`}>
                        {finalAmount.toFixed(2)}€ 
                        {quote.discount > 0 && <span className="text-green-600"> (-{quote.discount}€)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}