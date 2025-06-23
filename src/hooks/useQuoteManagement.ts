import { TechnicalQuote } from '../types/maintenance';

export function useQuoteManagement() {
  const createNewQuote = (): TechnicalQuote => {
    return {
      id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      technicianId: '',
      amount: 0,
      discount: 0,
      status: 'pending',
      notes: '',
      quotedAt: new Date(),
      quoteFileUrl: null
    };
  };

  const addQuote = (quotes: TechnicalQuote[]): TechnicalQuote[] => {
    if (quotes.length < 3) {
      return [...quotes, createNewQuote()];
    }
    return quotes;
  };

  const removeQuote = (quotes: TechnicalQuote[], index: number): TechnicalQuote[] => {
    return quotes.filter((_, i) => i !== index);
  };

  const updateQuote = (
    quotes: TechnicalQuote[], 
    index: number, 
    field: keyof TechnicalQuote, 
    value: any
  ): TechnicalQuote[] => {
    return quotes.map((quote, i) => 
      i === index ? { ...quote, [field]: value } : quote
    );
  };

  return {
    createNewQuote,
    addQuote,
    removeQuote,
    updateQuote
  };
}