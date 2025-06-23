import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo animé */}
        <div className="mx-auto w-16 h-16 bg-creho-500 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-6 h-6 bg-creho-500 rounded-sm"></div>
          </div>
        </div>
        
        {/* Texte de chargement */}
        <h2 className="text-xl font-semibold text-warm-900 mb-2">Creho</h2>
        <p className="text-warm-600 mb-6">Chargement en cours...</p>
        
        {/* Spinner */}
        <div className="inline-flex items-center">
          <div className="w-6 h-6 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-sm text-warm-600">Veuillez patienter</span>
        </div>
      </div>
    </div>
  );
}