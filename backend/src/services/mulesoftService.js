const axios = require('axios');

class MuleSoftService {
  constructor() {
    this.baseUrl = process.env.MULESOFT_API_URL || 'https://anypoint.mulesoft.com/api';
  }
  
  async testConnection(integration) {
    try {
      console.log(`🔗 Test de connexion à: ${integration.config.endpoint}`);
      
      // Configuration de la requête
      const config = {
        method: integration.config.method || 'GET',
        url: integration.config.endpoint,
        timeout: 10000,
        headers: this.buildHeaders(integration)
      };
      
      // Ajout de l'authentification si nécessaire
      const auth = this.buildAuth(integration);
      if (auth) {
        config.auth = auth;
      }
      
      const response = await axios(config);
      
      console.log(`✅ Connexion réussie - Status: ${response.status}`);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error(`❌ Échec de connexion: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        status: error.response?.status || 500
      };
    }
  }
  
  buildHeaders(integration) {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'MuleSoft-Integration-Platform/1.0'
    };
    
    if (integration.config.headers) {
      // Convertir Map en objet si nécessaire
      const customHeaders = integration.config.headers instanceof Map 
        ? Object.fromEntries(integration.config.headers)
        : integration.config.headers;
      
      Object.assign(headers, customHeaders);
    }
    
    return headers;
  }
  
  buildAuth(integration) {
    const auth = integration.config.authentication;
    
    if (!auth || auth.type === 'none') {
      return null;
    }
    
    if (auth.type === 'basic') {
      return {
        username: auth.credentials?.username || '',
        password: auth.credentials?.password || ''
      };
    }
    
    if (auth.type === 'apiKey') {
      // Pour API Key, on l'ajoute dans les headers
      return null;
    }
    
    return null;
  }
}

module.exports = new MuleSoftService();