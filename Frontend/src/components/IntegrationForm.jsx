import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const createIntegration = async (integrationData) => {
  const { data } = await axios.post(`${API_URL}/api/integrations`, integrationData);
  return data;
  console.log(integrationData)
};

function IntegrationForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    type: 'REST',
    config: {
      endpoint: '',
      method: 'GET',
      headers: {},
      authentication: {
        type: 'none',
        credentials: {}
      }
    }
  });
  
  const [errors, setErrors] = useState({});
  const [showAuthConfig, setShowAuthConfig] = useState(false);
  
  const mutation = useMutation(createIntegration, {
    onSuccess: () => {
      queryClient.invalidateQueries('integrations');
      queryClient.invalidateQueries('stats');
      navigate('/integrations');
      console.log('📤 Données envoyées:', JSON.stringify(integrationData, null, 2));
    },
    onError: (error) => {
      setErrors({ submit: error.response?.data?.error || 'Erreur lors de la création' });
    }
  });

  // Fonction handleChange CORRIGÉE
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Gérer les champs imbriqués (ex: config.endpoint)
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        // Naviguer jusqu'au dernier niveau
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        authentication: {
          ...prev.config.authentication,
          [name]: value
        }
      }
    }));
  };

  const handleAddHeader = () => {
    const key = prompt('Nom du header:');
    const value = prompt('Valeur du header:');
    if (key && value) {
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          headers: {
            ...prev.config.headers,
            [key]: value
          }
        }
      }));
    }
  };

  const handleRemoveHeader = (key) => {
    const newHeaders = { ...formData.config.headers };
    delete newHeaders[key];
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        headers: newHeaders
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.config.endpoint.trim()) {
      newErrors['config.endpoint'] = "L'URL est requise";
    } else if (!isValidUrl(formData.config.endpoint)) {
      newErrors['config.endpoint'] = "URL invalide";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      mutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    navigate('/integrations');
  };

  const integrationTypes = [
    { value: 'REST', label: 'REST API' },
    { value: 'SOAP', label: 'SOAP Web Service' },
    { value: 'MuleSoft', label: 'MuleSoft API' },
    { value: 'Database', label: 'Base de données' }
  ];

  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  const authTypes = [
    { value: 'none', label: 'Aucune authentification' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'apiKey', label: 'API Key' },
    { value: 'oauth2', label: 'OAuth 2.0' }
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* En-tête */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle intégration</h1>
          <p className="text-gray-600 mt-1">Configurez une nouvelle connexion avec MuleSoft</p>
        </div>
        
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Message d'erreur global */}
          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}
          
          {/* Nom de l'intégration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'intégration *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Ex: API MuleSoft Production"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>
          
          {/* Type d'intégration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'intégration *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {integrationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Endpoint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL / Endpoint *
            </label>
            <input
              type="text"
              name="config.endpoint"
              value={formData.config.endpoint}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${errors['config.endpoint'] ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="https://api.example.com/endpoint"
            />
            {errors['config.endpoint'] && (
              <p className="mt-1 text-sm text-red-600">{errors['config.endpoint']}</p>
            )}
          </div>
          
          {/* Méthode HTTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Méthode HTTP
            </label>
            <select
              name="config.method"
              value={formData.config.method}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {httpMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
          
          {/* Headers HTTP */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Headers HTTP
              </label>
              <button
                type="button"
                onClick={handleAddHeader}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Ajouter un header
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(formData.config.headers || {}).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <span className="flex-1 px-3 py-2 bg-gray-50 rounded text-sm font-medium">
                    {key}
                  </span>
                  <span className="flex-1 px-3 py-2 bg-gray-50 rounded text-sm">
                    {value}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHeader(key)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Section Authentification */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Authentification
              </label>
              <button
                type="button"
                onClick={() => setShowAuthConfig(!showAuthConfig)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAuthConfig ? 'Masquer' : 'Configurer'}
              </button>
            </div>
            
            {showAuthConfig && (
              <div className="space-y-4 pl-4 border-l-4 border-blue-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'authentification
                  </label>
                  <select
                    name="type"
                    value={formData.config.authentication.type}
                    onChange={handleAuthChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {authTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {formData.config.authentication.type === 'basic' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData.config.authentication.credentials?.username || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              authentication: {
                                ...prev.config.authentication,
                                credentials: {
                                  ...prev.config.authentication.credentials,
                                  username: e.target.value
                                }
                              }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={formData.config.authentication.credentials?.password || ''}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              authentication: {
                                ...prev.config.authentication,
                                credentials: {
                                  ...prev.config.authentication.credentials,
                                  password: e.target.value
                                }
                              }
                            }
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
                
                {formData.config.authentication.type === 'apiKey' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <input
                      type="text"
                      value={formData.config.authentication.credentials?.apiKey || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            authentication: {
                              ...prev.config.authentication,
                              credentials: {
                                ...prev.config.authentication.credentials,
                                apiKey: e.target.value
                              }
                            }
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Boutons d'action */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {mutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Création...</span>
                </>
              ) : (
                <span>Créer l'intégration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IntegrationForm;