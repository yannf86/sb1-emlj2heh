import React from 'react';
import Layout from '../components/Layout/Layout';
import { Construction } from 'lucide-react';

interface EmptyModuleProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

export default function EmptyModule({ title, subtitle, icon }: EmptyModuleProps) {
  return (
    <Layout title={title} subtitle={subtitle}>
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            {icon || <Construction className="w-8 h-8 text-gray-400" />}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 max-w-md">
            Ce module sera implémenté prochainement. Vous pourrez y accéder une fois les détails fournis.
          </p>
        </div>
      </div>
    </Layout>
  );
}