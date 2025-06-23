import React from 'react';
import Layout from '../components/Layout/Layout';
import { Mail, Send, Zap, Bell } from 'lucide-react';

export default function MailAutomation() {
  return (
    <Layout title="Mail Automatisation" subtitle="Automatisation et gestion des emails">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center max-w-lg mx-auto p-8">
          {/* Illustration élaborée */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl -rotate-1 transform hover:rotate-1 transition-transform duration-500">
              <Mail className="w-16 h-16 text-white" />
            </div>
            {/* Éléments volants */}
            <div className="absolute -top-4 -right-2 w-8 h-8 bg-gradient-to-br from-amber-300 to-orange-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-5 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="absolute top-4 -left-4 w-6 h-6 bg-gradient-to-br from-red-300 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Bell className="w-3 h-3 text-white" />
            </div>
            {/* Trails d'emails */}
            <div className="absolute top-8 right-4 space-y-1">
              <div className="w-8 h-1 bg-gradient-to-r from-orange-200 to-transparent rounded-full animate-pulse"></div>
              <div className="w-6 h-1 bg-gradient-to-r from-amber-200 to-transparent rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-4 h-1 bg-gradient-to-r from-yellow-200 to-transparent rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Mail Automatisation</h3>
          <p className="text-gray-600 leading-relaxed">
            Ce module sera bientôt disponible pour l'automatisation des emails, 
            la gestion des campagnes et des notifications automatiques.
          </p>
          
          <div className="mt-6 flex justify-center items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
            <div className="text-xs text-orange-600 font-medium">Sending...</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}