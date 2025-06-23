import React, { useState, useEffect } from 'react';
import { TechnicalAnalytics as AnalyticsType, TechnicalStats } from '../../types/maintenance';
import { technicalInterventionsService } from '../../services/firebase/technicalInterventionsService';
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
import { TrendingUp, TrendingDown, Wrench, CheckCircle, Clock, Euro } from 'lucide-react';

export default function TechnicalAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [stats, setStats] = useState<TechnicalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsData, statsData] = await Promise.all([
        technicalInterventionsService.getInterventionAnalytics(),
        technicalInterventionsService.getInterventionStats()
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
              <p className="text-sm font-medium text-warm-600">Interventions totales</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warm-600">Taux de complétion</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warm-600">Temps moyen</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">{stats.averageCompletionTime}j</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warm-600">Coût total</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">{stats.totalFinalCost.toLocaleString()}€</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Euro className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interventions par type */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Interventions par Type</h3>
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

        {/* Interventions par statut */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Interventions par Statut</h3>
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

        {/* Interventions par hôtel */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Interventions par Hôtel</h3>
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

        {/* Interventions par technicien */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Interventions par Technicien</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byTechnician.slice(0, 10)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Évolution des coûts */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200 lg:col-span-2">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Évolution des Coûts</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.costEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}€`, '']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="estimated" 
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Coût estimé"
                />
                <Line 
                  type="monotone" 
                  dataKey="final" 
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Coût final"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temps de completion par type */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Temps de Completion</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.completionTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} jours`, 'Temps moyen']} />
                <Bar dataKey="avgTime" fill="#EC4899" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interventions mensuelles */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Interventions Mensuelles</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyInterventions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}