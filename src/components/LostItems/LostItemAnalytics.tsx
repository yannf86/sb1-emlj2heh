import React, { useState, useEffect } from 'react';
import { LostItemAnalytics as AnalyticsType, LostItemStats } from '../../types/lostItems';
import { lostItemsService } from '../../services/firebase/lostItemsService';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Package, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function LostItemAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [stats, setStats] = useState<LostItemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsData, statsData] = await Promise.all([
        lostItemsService.getLostItemAnalytics(),
        lostItemsService.getLostItemStats()
      ]);
      setAnalytics(analyticsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-creho-500 border-t-transparent rounded-full animate-spin mr-2"></div>
        Chargement des analyses...
      </div>
    );
  }

  if (!analytics || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-warm-600">Impossible de charger les données d'analyse</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warm-600">Objets trouvés</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warm-600">Objets rendus</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">{stats.returned}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warm-600">Objets conservés</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">{stats.conserved}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warm-600">Taux de retour</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">{stats.returnRate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objets par type */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Objets par Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.byType}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {analytics.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Objets par statut */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Objets par Statut</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Objets par hôtel */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Objets par Hôtel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byHotel.slice(0, 10)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Évolution du taux de retour */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Évolution du Taux de Retour</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.returnRateEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Taux de retour']} />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#8B5CF6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Objets trouvés vs rendus mensuellement */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200 lg:col-span-2">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Objets Trouvés vs Rendus (Mensuel)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyFound.map((item, index) => ({
                ...item,
                returned: analytics.monthlyReturned[index]?.count || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" name="Objets trouvés" />
                <Bar dataKey="returned" fill="#10B981" name="Objets rendus" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}