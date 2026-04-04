# MuleSoft Integration Platform

Plateforme d'intégration complète permettant de gérer, monitorer et tester des connexions avec MuleSoft et autres APIs.

## 📋 Table des Matières

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Architecture](#architecture)
- [Tests](#tests)
- [Déploiement Docker](#déploiement-docker)
- [Maintenance & Rollback](#maintenance--rollback)
- [Contributing](#contributing)

## 🎯 Features

- ✅ Gestion complète des intégrations APIs
- ✅ Monitoring en temps réel des connexions
- ✅ Historique des logs détaillé
- ✅ Dashboard statistiques
- ✅ Tests d'intégration automatisés
- ✅ Support Multi-tenant
- ✅ Architecture microservices avec Docker
- ✅ CI/CD intégré

## 🚀 Installation

### Prérequis
- Node.js 18+
- MongoDB 6+
- Docker & Docker Compose
- Git
- Postman (optionnel, pour tester les APIs)

### Installation locale - Développement

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/mulesoft-integration-platform.git
cd mulesoft-integration-platform
```

2. **Installation Backend**
```bash
cd backend
npm install
```

3. **Installation Frontend**
```bash
cd ../Frontend
npm install
```

### Installation rapide avec Docker
```bash
docker-compose up -d
```

## ⚙️ Configuration

### Variables d'environnement Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mulesoft-platform
JWT_SECRET=your-secret-key-change-in-production
LOG_LEVEL=debug
MULESOFT_API_KEY=your-mulesoft-key
MULESOFT_BASE_URL=https://api.mulesoft.example.com
```

### Variables d'environnement Docker (`.env` racine)
```env
JWT_SECRET=your-strong-secret-key-min-32-chars
MONGODB_HOST=mongodb
MONGODB_PORT=27017
MONGODB_USER=admin
MONGODB_PASSWORD=password123
NODE_ENV=production
```

### Configuration MongoDB
- **Host**: mongodb (Docker) ou localhost (local)
- **Port**: 27017
- **User**: admin
- **Password**: password123
- **Database**: mulesoft-platform

## 📖 Utilisation

### Démarrage en développement

**Backend**:
```bash
cd backend
npm run dev
# Server lancé sur http://localhost:5000
```

**Frontend**:
```bash
cd Frontend
npm run dev
# App disponible sur http://localhost:5173
```

### Démarrage avec Docker
```bash
# Construire et lancer les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Logs en temps réel
docker-compose logs -f backend

# Arrêter les services
docker-compose down
```

### Endpoints principaux API

**Authentification** (si applicable)
```bash
POST /api/auth/login
POST /api/auth/logout
```

**Intégrations**
```bash
GET    /api/integrations              # Récupérer toutes les intégrations
POST   /api/integrations              # Créer une intégration
GET    /api/integrations/:id          # Récupérer une intégration
PUT    /api/integrations/:id          # Modifier une intégration
DELETE /api/integrations/:id          # Supprimer une intégration
POST   /api/integrations/:id/test     # Tester une intégration
```

**Logs**
```bash
GET /api/logs                          # Récupérer tous les logs
GET /api/logs/:id                      # Récupérer un log spécifique
GET /api/logs/integration/:integrationId  # Logs d'une intégration)
```

**Statistiques**
```bash
GET /api/stats/dashboard               # Statistiques globales
GET /api/stats/integration/:id         # Stats d'une intégration
```

## 🏗️ Architecture

### Structure Frontend
```
Frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx       # Dashboard principal
│   │   ├── Integrations.jsx    # Liste des intégrations
│   │   ├── IntegrationForm.jsx # Formulaire création/édition
│   │   └── Logs.jsx            # Affichage des logs
│   ├── App.jsx                 # Routage principal
│   └── main.jsx                # Point d'entrée
├── index.html
├── vite.config.js              # Configuration Vite
└── tailwind.config.js          # Styles Tailwind CSS
```

### Structure Backend
```
backend/
├── src/
│   ├── controllers/
│   │   ├── integrationController.js  # Logique intégrations
│   │   ├── logController.js          # Logique logs
│   │   └── statsController.js        # Logique statistiques
│   ├── models/
│   │   ├── Integration.js       # Schéma MongoDB
│   │   ├── Log.js              # Schéma MongoDB
│   │   └── Stats.js            # Schéma MongoDB
│   ├── routes/
│   │   ├── integrations.js     # Routes intégrations
│   │   ├── logs.js             # Routes logs
│   │   └── stats.js            # Routes statistiques
│   ├── services/
│   │   └── mulesoftService.js  # Appels API MuleSoft
│   ├── utils/                  # Utilitaires (validation, etc)
│   ├── middlewares/            # Middlewares Express
│   └── server.js               # Configuration Express
├── tests/
│   └── integration.test.js     # Tests d'intégration
├── Dockerfile
└── package.json
```

### Stack Technique

**Frontend**:
- React 18.3
- Vite
- Tailwind CSS
- React Router v7
- Axios pour les requêtes HTTP
- Recharts pour les graphiques
- React Query pour la gestion d'état

**Backend**:
- Node.js 18+
- Express.js
- MongoDB + Mongoose
- JWT pour authentification
- Helmet pour la sécurité
- Joi pour la validation
- Jest + Supertest pour les tests

**DevOps**:
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Nginx pour serveur web

## ✅ Tests

### Lancer les tests
```bash
cd backend
npm test
```

### Tests avec couverture
```bash
npm test -- --coverage
```

### Tests en mode watch
```bash
npm run test:watch
```

### Collection Postman
Importez le fichier `postman/collection.json` dans Postman pour tester tous les endpoints.

## 🐳 Déploiement Docker

### Build local
```bash
# Build les images
docker-compose build

# Lance en production
docker-compose up -d
```

### Vérification statut
```bash
docker-compose ps
docker-compose logs
```

### Accès services
- Frontend: http://localhost:80
- Backend: http://localhost:5000
- MongoDB: localhost:27017

#### Arrêt et nettoyage
```bash
docker-compose down
docker-compose down -v  # Avec suppression volumes
```

## 🔧 Maintenance & Rollback

### Logs en temps réel
```bash
docker-compose logs -f
docker-compose logs -f backend
```

### Backup MongoDB
```bash
docker exec mulesoft-mongodb mongodump --out /data/backup
```

### Restore MongoDB
```bash
docker exec mulesoft-mongodb mongorestore /data/backup
```

### Rollback service
```bash
# Arrêter tous les services
docker-compose down

# Redéployer depuis git
git checkout previous-commit
docker-compose up -d
```

### Voir le guide complet
Consultez [docs/MAINTENANCE.md](docs/MAINTENANCE.md) pour les procédures détaillées.

## 📚 Documentation complète

- [Architecture détaillée](docs/architecture/ARCHITECTURE.md)
- [Guide Utilisateur](docs/USER_GUIDE.md)
- [Maintenance & Rollback](docs/MAINTENANCE.md)
- [Choix Techniques](docs/TECHNICAL_CHOICES.md)
- [Collection Postman](postman/collection.json)

## 🚀 CI/CD

Le projet utilise GitHub Actions pour :
- Tests automatisés à chaque push
- Build des images Docker
- Déploiement automatique

Voir [.github/workflows/](.github/workflows/) pour les détails.

## 📝 Contributing

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence ISC. Voir LICENSE pour plus de détails.

## 📧 Support

Pour questions ou problèmes : [clevino512@gmail.com]
