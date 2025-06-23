import React, { useState, useEffect } from 'react';
import { IncidentAnalytics as AnalyticsType, IncidentStats } from '../../types/incidents';
import { incidentsService } from '../../services/firebase/incidentsService';
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
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function IncidentAnalytics() {
  const { currentUser } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.email) {
      loadAnalytics();
    }
  }, [currentUser]);

  const loadAnalytics = async () => {
    if (!currentUser?.email) return;
    
    setLoading(true);
    try {
      const [analyticsData, statsData] = await Promise.all([
        incidentsService.getIncidentAnalytics(currentUser.email),
        incidentsService.getIncidentStats(currentUser.email)
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
              <p className="text-sm font-medium text-warm-600">Incidents totaux</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warm-600">Taux de résolution</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">
                {stats.total > 0 ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100) : 0}%
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
              <p className="text-sm font-medium text-warm-600">Temps moyen résolution</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">{stats.averageResolutionTime}h</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warm-600">Satisfaction client</p>
              <p className="text-3xl font-bold text-warm-900 mt-2">{stats.satisfactionScore}/5</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents par catégorie */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Incidents par Catégorie</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.byCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {analytics.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents par statut */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Incidents par Statut</h3>
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

        {/* Incidents par impact */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Incidents par Impact</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byImpact}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents par hôtel */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Incidents par Hôtel</h3>
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

        {/* Évolution des catégories d'incidents */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200 lg:col-span-2">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Évolution des Catégories d'Incidents</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.categoryEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {analytics.byCategory.map((category, index) => (
                  <Line 
                    key={category.name}
                    type="monotone" 
                    dataKey={category.name} 
                    stroke={category.color}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temps de résolution par catégorie */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Temps de Résolution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.resolutionTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}h`, 'Temps moyen']} />
                <Bar dataKey="avgTime" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Satisfaction par catégorie */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
          <h3 className="text-lg font-semibold text-warm-900 mb-4">Satisfaction par Catégorie</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.satisfactionByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 5]} />
                <Tooltip formatter={(value) => [`${value}/5`, 'Satisfaction']} />
                <Bar dataKey="satisfaction" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Moteur géré concerné */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-warm-200">
        <h3 className="text-lg font-semibold text-warm-900 mb-4">Répartition par Moteur Géré Concerné</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.byEngine}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#EC4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}