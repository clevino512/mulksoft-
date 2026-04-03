import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Dashboard from './components/Dashboard';
import Integrations from './components/Integrations';
import IntegrationForm from './components/IntegrationForm';
import Logs from './components/Logs';

const queryClient = new QueryClient();

// Créer un composant séparé pour le contenu qui a besoin du Router
function AppContent() {
  const location = useLocation();
  const isNewPage = location.pathname === '/integrations';

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-800">
                MuleSoft Integration Platform
              </h1>
              <Link to={!isNewPage ? "/integrations" : "/"}>
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  {!isNewPage ? 'Commencer' : "Page d'accueil"}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 px-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/integrations/new" element={<IntegrationForm />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

export default App;