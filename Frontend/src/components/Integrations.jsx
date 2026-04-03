import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Fonctions API corrigées
const fetchIntegrations = async () => {
  const { data } = await axios.get(`${API_URL}/api/integrations`);
  // Extraire le tableau integrations de la réponse
  return data.integrations || [];
};

const deleteIntegration = async (id) => {
  const { data } = await axios.delete(`${API_URL}/api/integrations/${id}`);
  return data;
};

const testIntegration = async (id) => {
  const { data } = await axios.post(`${API_URL}/api/integrations/${id}/test`);
  return data;
};

const toggleIntegrationStatus = async ({ id, status }) => {
  const { data } = await axios.patch(`${API_URL}/api/integrations/${id}`, { status });
  return data;
};

function Integrations() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTestResult, setShowTestResult] = useState(null);

  // Requêtes
  const { data: integrations, isLoading, error } = useQuery(
    'integrations',
    fetchIntegrations,
    {
      refetchInterval: 30000 // Rafraîchir toutes les 30 secondes
    }
  );

  // Mutations
  const deleteMutation = useMutation(deleteIntegration, {
    onSuccess: () => {
      queryClient.invalidateQueries('integrations');
      queryClient.invalidateQueries('stats');
      setShowDeleteModal(false);
      setSelectedIntegration(null);
    }
  });

  const testMutation = useMutation(testIntegration, {
    onSuccess: (data) => {
      setShowTestResult({
        success: data.success,
        message: data.success ? 'Test réussi !' : 'Test échoué',
        responseTime: data.responseTime,
        error: data.error
      });
      queryClient.invalidateQueries('integrations');
      
      // Cacher le message après 5 secondes
      setTimeout(() => setShowTestResult(null), 5000);
    }
  });

  const toggleMutation = useMutation(toggleIntegrationStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries('integrations');
      queryClient.invalidateQueries('stats');
    }
  });

  // Filtrage des intégrations - CORRECTION ICI
  const filteredIntegrations = integrations && Array.isArray(integrations) 
    ? integrations.filter(integration => {
        const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || integration.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
    : [];

  // Statistiques - CORRECTION ICI
  const stats = {
    total: integrations && Array.isArray(integrations) ? integrations.length : 0,
    active: integrations && Array.isArray(integrations) ? integrations.filter(i => i.status === 'active').length : 0,
    inactive: integrations && Array.isArray(integrations) ? integrations.filter(i => i.status === 'inactive').length : 0,
    error: integrations && Array.isArray(integrations) ? integrations.filter(i => i.status === 'error').length : 0
  };

  const handleDelete = (integration) => {
    setSelectedIntegration(integration);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedIntegration) {
      deleteMutation.mutate(selectedIntegration._id);
    }
  };

  const handleTest = (id) => {
    testMutation.mutate(id);
  };

  const handleToggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    toggleMutation.mutate({ id, status: newStatus });
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'active': return 'Actif';
      case 'error': return 'Erreur';
      default: return 'Inactif';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Erreur :</strong> {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intégrations</h1>
          <p className="text-gray-600 mt-1">Gérez vos connexions MuleSoft</p>
        </div>
        <Link
          to="/integrations/new"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nouvelle intégration</span>
        </Link>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Actives</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Inactives</p>
          <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Erreur</p>
          <p className="text-2xl font-bold text-red-600">{stats.error}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher une intégration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="error">Erreur</option>
            </select>
          </div>
        </div>
      </div>

      {/* Message de test */}
      {showTestResult && (
        <div className={`p-4 rounded-lg ${showTestResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <div className="flex justify-between items-center">
            <div>
              <strong>{showTestResult.message}</strong>
              {showTestResult.responseTime && (
                <p className="text-sm mt-1">Temps de réponse: {showTestResult.responseTime}ms</p>
              )}
              {showTestResult.error && (
                <p className="text-sm mt-1">Erreur: {showTestResult.error}</p>
              )}
            </div>
            <button
              onClick={() => setShowTestResult(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Liste des intégrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune intégration</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par créer une nouvelle intégration.</p>
            <div className="mt-6">
              <Link
                to="/integrations/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle intégration
              </Link>
            </div>
          </div>
        ) : (
          filteredIntegrations.map((integration) => (
            <div key={integration._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{integration.type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(integration.status)}`}>
                    {getStatusText(integration.status)}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m3.172-3.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102" />
                    </svg>
                    <span className="truncate">{integration.config?.endpoint || 'N/A'}</span>
                  </div>
                  {integration.lastExecution && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Dernière exécution: {new Date(integration.lastExecution).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <button
                    onClick={() => handleTest(integration._id)}
                    disabled={testMutation.isLoading}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{testMutation.isLoading ? 'Test...' : 'Tester'}</span>
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleToggleStatus(integration._id, integration.status)}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                    >
                      {integration.status === 'active' ? 'Désactiver' : 'Activer'}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(integration)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Confirmer la suppression</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir supprimer l'intégration "{selectedIntegration?.name}" ?
                  Cette action est irréversible.
                </p>
              </div>
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isLoading}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none"
                >
                  {deleteMutation.isLoading ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Integrations;