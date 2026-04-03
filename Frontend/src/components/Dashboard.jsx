import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Fonctions API corrigées
const fetchStats = async () => {
  const { data } = await axios.get(`${API_URL}/api/stats`);
  return data;
};

const fetchRecentIntegrations = async () => {
  const { data } = await axios.get(`${API_URL}/api/integrations?limit=5`);
  // Extraire le tableau integrations de la réponse
  return data.integrations || [];
};

const fetchRecentLogs = async () => {
  const { data } = await axios.get(`${API_URL}/api/logs?limit=10`);
  // Extraire le tableau logs de la réponse
  return data.logs || [];
};

function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Requêtes API
  const { data: stats, isLoading: statsLoading } = useQuery('stats', fetchStats, {
    refetchInterval: 30000
  });
  
  const { data: recentIntegrations, isLoading: integrationsLoading } = useQuery(
    'recentIntegrations', 
    fetchRecentIntegrations
  );
  
  const { data: recentLogs, isLoading: logsLoading } = useQuery(
    'recentLogs', 
    fetchRecentLogs
  );

  // Mise à jour de l'heure
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Données pour les graphiques
  const performanceData = [
    { time: '00:00', success: 95, errors: 5 },
    { time: '04:00', success: 98, errors: 2 },
    { time: '08:00', success: 92, errors: 8 },
    { time: '12:00', success: 96, errors: 4 },
    { time: '16:00', success: 94, errors: 6 },
    { time: '20:00', success: 97, errors: 3 },
  ];

  const statusData = [
    { name: 'Actives', value: stats?.activeCount || 0, color: '#10B981' },
    { name: 'Inactives', value: stats?.inactiveCount || 0, color: '#6B7280' },
    { name: 'Erreur', value: stats?.errorCount || 0, color: '#EF4444' },
  ];

  const COLORS = ['#10B981', '#6B7280', '#EF4444'];

  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR');
  };

  const getLogBadgeColor = (level) => {
    switch(level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (statsLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble des intégrations</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Dernière mise à jour</p>
          <p className="text-lg font-semibold">{currentTime.toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total intégrations</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1.5 4 4 4h8c2.5 0 4-2 4-4V7" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7l8-4 8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Intégrations actives</p>
              <p className="text-3xl font-bold text-green-600">{stats?.activeCount || 0}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Taux de succès</p>
              <p className="text-3xl font-bold text-blue-600">{stats?.successRate || 0}%</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Erreurs (24h)</p>
              <p className="text-3xl font-bold text-red-600">{stats?.errorCount24h || 0}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Performance des intégrations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Répartition des statuts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intégrations récentes et logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intégrations récentes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Intégrations récentes</h3>
          <div className="space-y-3">
            {integrationsLoading ? (
              <div className="text-center py-4">Chargement...</div>
            ) : !recentIntegrations || recentIntegrations.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Aucune intégration</div>
            ) : (
              recentIntegrations.map((integration) => (
                <div key={integration._id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-gray-500">{integration.type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    integration.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : integration.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {integration.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logs récents */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Logs récents</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logsLoading ? (
              <div className="text-center py-4">Chargement...</div>
            ) : !recentLogs || recentLogs.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Aucun log</div>
            ) : (
              recentLogs.map((log) => (
                <div key={log._id} className="border-b pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-1 rounded ${getLogBadgeColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;