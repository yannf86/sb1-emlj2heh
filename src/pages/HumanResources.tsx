import React from 'react';
import Layout from '../components/Layout/Layout';
import { Users, UserCheck, Calendar, GraduationCap } from 'lucide-react';

export default function HumanResources() {
  return (
    <Layout title="Ressources Humaines" subtitle="Gestion des ressources humaines et du personnel">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center max-w-lg mx-auto p-8">
          {/* Illustration élaborée */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3 transform hover:rotate-6 transition-transform duration-300">
              <Users className="w-16 h-16 text-white" />
            </div>
            {/* Éléments décoratifs */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-indigo-300 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-br from-purple-300 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div className="absolute top-1/2 -right-6 w-6 h-6 bg-gradient-to-br from-blue-300 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <GraduationCap className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Ressources Humaines</h3>
          <p className="text-gray-600 leading-relaxed">
            Ce module sera bientôt disponible pour gérer les ressources humaines, 
            les plannings du personnel, les congés et les formations.
          </p>
          
          <div className="mt-6 flex justify-center space-x-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}