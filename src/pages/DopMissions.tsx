import React from 'react';
import Layout from '../components/Layout/Layout';
import { Target, TrendingUp, BarChart3, CheckCircle } from 'lucide-react';

export default function DopMissions() {
  return (
    <Layout title="Suivi Mission DOP" subtitle="Suivi et gestion des missions DOP (Directeur des Opérations)">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center max-w-lg mx-auto p-8">
          {/* Illustration élaborée */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl -rotate-3 transform hover:-rotate-6 transition-transform duration-300">
              <Target className="w-16 h-16 text-white" />
            </div>
            {/* Éléments décoratifs */}
            <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-pink-300 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-4 w-8 h-8 bg-gradient-to-br from-purple-300 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div className="absolute top-0 -right-2 w-6 h-6 bg-gradient-to-br from-indigo-300 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Suivi Mission DOP</h3>
          <p className="text-gray-600 leading-relaxed">
            Ce module sera bientôt disponible pour le suivi des missions stratégiques 
            et des objectifs opérationnels définis par la direction.
          </p>
          
          <div className="mt-6 flex justify-center space-x-4">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}