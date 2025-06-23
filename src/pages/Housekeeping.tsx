import React from 'react';
import Layout from '../components/Layout/Layout';
import { Sparkles, Home, RectangleVertical as CleaningServices, CheckSquare } from 'lucide-react';

export default function Housekeeping() {
  return (
    <Layout title="Housekeeping" subtitle="Gestion du service d'entretien et de propreté">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center max-w-lg mx-auto p-8">
          {/* Illustration élaborée */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-2 transform hover:rotate-0 transition-transform duration-300">
              <Sparkles className="w-16 h-16 text-white" />
            </div>
            {/* Éléments décoratifs */}
            <div className="absolute -top-2 -left-4 w-10 h-10 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg rotate-12">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-3 -right-1 w-8 h-8 bg-gradient-to-br from-green-300 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <CleaningServices className="w-4 h-4 text-white" />
            </div>
            <div className="absolute top-2 -right-5 w-6 h-6 bg-gradient-to-br from-teal-300 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckSquare className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Housekeeping</h3>
          <p className="text-gray-600 leading-relaxed">
            Ce module sera bientôt disponible pour la gestion du service housekeeping, 
            l'attribution des chambres et le suivi de l'avancement du ménage.
          </p>
          
          <div className="mt-6 flex justify-center space-x-4">
            <div className="w-3 h-1 bg-green-400 rounded-full animate-pulse"></div>
            <div className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
            <div className="w-3 h-1 bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}