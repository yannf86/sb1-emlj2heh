import React from 'react';
import Layout from '../components/Layout/Layout';
import { Calendar, Clock, CalendarDays, Users } from 'lucide-react';

export default function Planning() {
  return (
    <Layout title="Planning" subtitle="Gestion des plannings et des horaires">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center max-w-lg mx-auto p-8">
          {/* Illustration élaborée */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl transform hover:scale-105 transition-transform duration-300">
              <Calendar className="w-16 h-16 text-white" />
            </div>
            {/* Éléments décoratifs animés */}
            <div className="absolute -top-1 -left-6 w-8 h-8 bg-gradient-to-br from-blue-300 to-blue-500 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -bottom-4 -right-3 w-10 h-10 bg-gradient-to-br from-indigo-300 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div className="absolute top-1/3 -right-8 w-6 h-6 bg-gradient-to-br from-cyan-300 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Users className="w-3 h-3 text-white" />
            </div>
            {/* Lignes décoratives */}
            <div className="absolute top-6 left-8 w-4 h-0.5 bg-gradient-to-r from-indigo-200 to-indigo-400 rounded-full"></div>
            <div className="absolute bottom-8 right-6 w-6 h-0.5 bg-gradient-to-r from-blue-200 to-blue-400 rounded-full"></div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Planning</h3>
          <p className="text-gray-600 leading-relaxed">
            Ce module sera bientôt disponible pour la gestion des plannings, 
            l'organisation des équipes et la planification des tâches.
          </p>
          
          <div className="mt-6 grid grid-cols-5 gap-1 w-20 mx-auto">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${i <= 3 ? 'bg-indigo-400' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}