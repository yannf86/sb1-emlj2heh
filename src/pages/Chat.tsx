import React from 'react';
import Layout from '../components/Layout/Layout';
import { MessageCircle, Users, Hash, AtSign } from 'lucide-react';

export default function Chat() {
  return (
    <Layout title="Canal de Discussion" subtitle="Messagerie et communication entre équipes">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="text-center max-w-lg mx-auto p-8">
          {/* Illustration élaborée */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-1 transform hover:-rotate-1 transition-transform duration-300">
              <MessageCircle className="w-16 h-16 text-white" />
            </div>
            {/* Bulles de conversation */}
            <div className="absolute -top-6 -left-2 w-8 h-6 bg-gradient-to-br from-rose-300 to-rose-500 rounded-full flex items-center justify-center shadow-lg animate-bounce" style={{animationDelay: '0.5s'}}>
              <Hash className="w-3 h-3 text-white" />
            </div>
            <div className="absolute -bottom-4 -right-6 w-10 h-8 bg-gradient-to-br from-pink-300 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="absolute top-6 -right-8 w-6 h-6 bg-gradient-to-br from-purple-300 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <AtSign className="w-3 h-3 text-white" />
            </div>
            {/* Messages flottants */}
            <div className="absolute top-2 left-6 w-12 h-2 bg-gradient-to-r from-pink-200 to-transparent rounded-full opacity-60"></div>
            <div className="absolute bottom-12 right-2 w-8 h-2 bg-gradient-to-r from-rose-200 to-transparent rounded-full opacity-60"></div>
            <div className="absolute bottom-6 left-4 w-6 h-2 bg-gradient-to-r from-purple-200 to-transparent rounded-full opacity-60"></div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Canal de Discussion</h3>
          <p className="text-gray-600 leading-relaxed">
            Ce module sera bientôt disponible pour la communication en temps réel 
            entre les équipes, les discussions de groupe et la messagerie instantanée.
          </p>
          
          <div className="mt-6 flex justify-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}