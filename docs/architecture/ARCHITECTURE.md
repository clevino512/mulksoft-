# Architecture MuleSoft Integration Platform

## 📐 Diagramme d'Architecture Générale

```
┌─────────────────────────────────────────────────────────────────┐
│                       INTERNET / UTILISATEURS                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   Nginx/80     │ (Reverse Proxy)
                    │  Docker        │
                    └───────┬────────┘
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼──────┐      ┌────▼────┐        ┌────▼────┐
    │ Frontend  │      │ Backend  │       │  Static  │
    │ React     │      │ Express  │       │  Files   │
    │ :3000    │      │  :5000  │       │          │
    └──────────┘      └────┬────┘       └──────────┘
                           │
                    ┌──────▼─────┐
                    │  MongoDB    │
                    │  :27017     │
                    │  Database   │
                    └─────────────┘
```

## 🐳 Architecture Docker Compose

```
┌──────────────────────────── docker-compose ────────────────────────────┐
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  Service: Web   │  │  Service: Api   │  │   Service: Database     │ │
│  │  ─────────────  │  │  ──────────────  │  │   ─────────────────────  │ │
│  │  image: nginx   │  │  image: node18  │  │   image: mongo:6        │ │
│  │  container_name │  │  container_name │  │   container_name        │ │
│  │  mulesoft-fe    │  │  mulesoft-be    │  │   mulesoft-mongodb      │ │
│  │  ports: 80:80   │  │  ports: 5000    │  │   ports: 27017:27017    │ │
│  │  volumes:       │  │  volumes: /app  │  │   volumes: /data/db     │ │
│  │  - dist/        │  │  env: MongoDB   │  │   env: auth creds       │ │
│  │  - nginx.conf   │  │  depends: DB    │  │   restart: always       │ │
│  │  networks: net  │  │  networks: net  │  │   networks: net         │ │
│  │  restart: always│  │  restart: always│  │   restart: always       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
│                                                                          │
│  ┌───────────────────── Networking ──────────────────────────────────┐  │
│  │  Service names resolve automatically in same network              │  │
│  │  Example: backend connects to mongodb:27017                       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌───────────────────── Volumes –──────────────────────────────────┐  │
│  │  mongodb_data: → /data/db (persistence entre redémarrages)      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Flow Requête - Utilisateur à Base de Données

```
1. UTILISATEUR
   ├─ Accède http://localhost
   │
2. NGINX (Reverse Proxy)
   ├─ Reçoit la requête HTTP
   ├─ Si /api/* → Forward vers Backend:5000
   ├─ Si /* → Serve Frontend (React)
   │
3. FRONTEND (React App)
   ├─ [SPA] JavaScript exécuté côté client
   ├─ Rendu DOM
   ├─ User interagit
   ├─ Axios call → http://backend:5000/api/...
   │
4. NGINX (API Proxy)
   ├─ Intercept /api/* → Backend:5000
   ├─ Headers: X-Forwarded-For, Host, etc
   │
5. BACKEND (Express.js)
   ├─ Morgan Logger → Logs la requête
   ├─ Helmet → Sécurité headers
   ├─ Route Handler → Traite la requête
   ├─ Controller → Logique métier
   ├─ Mongoose Model → Requête BD
   │
6. DATABASE (MongoDB)
   ├─ Connection Pool
   ├─ Execute Query
   ├─ Return Document(s)
   │
7. RESPONSE CHAIN (Retour)
   ├─ Mongoose → JSON
   ├─ Controller → res.json()
   ├─ Express → JSON response
   ├─ Nginx → Proxy response avec headers
   ├─ Frontend → Axios .then()
   ├─ React State Update → Re-render UI
   ├─ Browser → Display to user
```

## 📊 Flux de Données

### Créer une Intégration

```
┌─────────────────────┐
│ Frontend (Form)     │
│ IntegrationForm.jsx │
└──────────┬──────────┘
           │ (user fills form)
           │ name, type, endpoint
           │
           ▼
┌──────────────────────────────┐
│ Axios POST /api/integrations │
│ (React Query mutation)        │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Backend - POST handler       │
│ routes/integrations.js       │
│ controllers/integration...js │
└──────────┬───────────────────┘
           │ Joi Validation
           ▼
┌──────────────────────────────┐
│ Mongoose Model Save          │
│ Integration.create()         │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ MongoDB Insert Document      │
│ _id generated ObjectId       │
│ timestamps auto              │
└──────────┬───────────────────┘
           │
           ▼ (201 Created)
┌──────────────────────────────┐
│ Frontend Update State        │
│ React Query refetch list     │
│ UI shows new integration     │
└──────────────────────────────┘
```

### Tester une Intégration

```
┌──────────────────┐
│ User clicks Test │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Frontend POST /api/integrations │
│ /:id/test                       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Backend Controller              │
│ 1. Fetch Integration from DB    │
│ 2. Extract config (endpoint..)  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ MuleSoftService.test()          │
│ Execute external API call       │
│ (Axios to real endpoint)        │
│ Catch errors & responses        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Create Log Entry                │
│ Log.create({                    │
│   integrationId,                │
│   statusCode,                   │
│   responseTime,                 │
│   status: success|error         │
│ })                              │
└────────┬────────────────────────┘
         │
         ▼ (200 with result)
┌─────────────────────────────────┐
│ Frontend Shows Result           │
│ ✅ Success: {...response}       │
│ ❌ Error: "Connection refused"  │
└─────────────────────────────────┘
```

## 🗄️ Schéma Base de Données

### Collections MongoDB

```javascript
// ============================================
// COLLECTION: integrations
// ============================================
db.integrations
├─ _id: ObjectId
├─ name: String (ex: "MuleSoft Prod API")
├─ type: String enum ["REST", "SOAP", "JDBC"]
├─ config: Object
│  ├─ endpoint: String (ex: "https://api.mulesoft.com/v1/...")
│  ├─ method: String enum ["GET", "POST", "PUT", "DELETE"]
│  ├─ headers?: Object (ex: {"Authorization": "Bearer ..."})
│  ├─ auth?: Object
│  │  ├─ type: String enum ["none", "basic", "bearer", "oauth"]
│  │  └─ credentials: String
│  └─ timeout?: Number (ms, default: 30000)
├─ status: String enum ["active", "inactive", "error"]
├─ lastTestDate?: Date
├─ lastTestStatus?: String enum ["success", "error"]
├─ createdAt: Date
├─ updatedAt: Date
└─ createdBy?: String

// Index
db.integrations.createIndex({ name: 1 }, { unique: true })
db.integrations.createIndex({ status: 1 })

// ============================================
// COLLECTION: logs
// ============================================
db.logs
├─ _id: ObjectId
├─ integrationId: ObjectId (FK → integrations._id)
├─ integrationName: String (denormalized for query perf)
├─ status: String enum ["success", "error", "timeout"]
├─ statusCode: Number (ex: 200, 404, 500)
├─ request: Object
│  ├─ method: String
│  ├─ url: String
│  ├─ headers: Object
│  └─ body?: String
├─ response: Object
│  ├─ statusCode: Number
│  ├─ headers: Object
│  ├─ body?: String
│  └─ time: Number (ms)
├─ error?: Object
│  ├─ message: String
│  ├─ code: String
│  └─ stack?: String
├─ timestamp: Date
└─ userId?: String

// Index
db.logs.createIndex({ integrationId: 1 })
db.logs.createIndex({ timestamp: 1 })
db.logs.createIndex({ status: 1 })
db.logs.createIndex({ timestamp: -1 }, { expireAfterSeconds: 7776000 }) // TTL: 90 dias

// ============================================
// COLLECTION: stats
// ============================================
db.stats
├─ _id: ObjectId
├─ date: Date
├─ totalCalls: Number
├─ successCalls: Number
├─ errorCalls: Number
├─ errorRate: Number (%)
├─ avgResponseTime: Number (ms)
├─ maxResponseTime: Number (ms)
├─ minResponseTime: Number (ms)
├─ topIntegrations: Array
│  └─ { integrationId, name, callCount }
├─ errorDistribution: Object
│  ├─ "401": Number
│  ├─ "404": Number
│  ├─ "500": Number
│  └─ ...
└─ createdAt: Date

// Index
db.stats.createIndex({ date: -1 })
db.stats.createIndex({ _id: 1 }, { expireAfterSeconds: 2592000 }) // TTL: 30 days
```

## 🔐 Sécurité - Layers

```
┌──────────────────────────────────────────────────┐
│ Layer 1: Network Security (DevOps)              │
├──────────────────────────────────────────────────┤
│ • Firewall (ports 80, 443 only)                 │
│ • VPN/SSH access au serveur                     │
│ • DDoS protection                               │
└──────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│ Layer 2: Transport (Nginx + TLS)               │
├──────────────────────────────────────────────────┤
│ • HTTPS/TLS encryption                          │
│ • Certificate validation                        │
│ • Rate limiting                                 │
└──────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│ Layer 3: HTTP Headers (Helmet)                  │
├──────────────────────────────────────────────────┤
│ • X-Frame-Options (Clickjacking)                │
│ • CSP (XSS protection)                          │
│ • X-Content-Type-Options (MIME sniffing)        │
│ • Strict-Transport-Security (HSTS)              │
└──────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│ Layer 4: Application (Express + Auth)           │
├──────────────────────────────────────────────────┤
│ • JWT validation                                │
│ • CORS policy                                   │
│ • Input validation (Joi)                        │
│ • Rate limiting per endpoint                    │
└──────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│ Layer 5: Data (MongoDB + Encryption)            │
├──────────────────────────────────────────────────┤
│ • Auth enabled (username/password)              │
│ • Role-based access control (if needed)         │
│ • Encryption at rest (optional)                 │
│ • Parameterized queries (Mongoose)              │
└──────────────────────────────────────────────────┘
```

## 🚀 Deployment Architecture

```
┌───────────────────────────────────────┐
│      GitHub Repository                │
│  (code + docker-compose.yml)          │
└────────────┬────────────────────────┘
             │ (push)
             │
             ▼
┌───────────────────────────────────────┐
│    GitHub Actions (CI/CD)             │
│  ├─ Test runner (npm test)            │
│  ├─ Build Docker images               │
│  ├─ Push to Docker Hub                │
│  └─ Trigger deploy via webhook        │
└────────────┬────────────────────────┘
             │
             ▼
┌───────────────────────────────────────┐
│      Production Server                │
│  (docker-compose up -d)               │
│  ├─ Pull latest images                │
│  ├─ Start containers                  │
│  ├─ Health checks                     │
│  ├─ Logs aggregation                  │
│  └─ Monitoring/Alerts                 │
└───────────────────────────────────────┘
```

Voir aussi : [TECHNICAL_CHOICES.md](TECHNICAL_CHOICES.md)
