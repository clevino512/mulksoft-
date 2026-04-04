# Guide des Tests - Windows

## ⚠️ Prérequis

### 1. MongoDB doit être en cours d'exécution

```bash
# Démarrer MongoDB via Docker
docker-compose up -d mongodb

# Vérifier que MongoDB est actif
docker ps | findstr mongodb
```

### 2. Vérifier la connexion MongoDB

```bash
# Depuis PowerShell
docker exec mulesoft-mongodb mongosh --serve admin:password123@localhost:27017

# Ou utiliser MongoDB Compass GUI
# mongodb://admin:password123@localhost:27017
```

---

## 🚀 Lancer les Tests

### Première fois (installation des dépendances)

```bash
cd backend
npm install
npm run test
```

### Fois suivantes

```bash
cd backend
npm test
```

---

## 📋 Script de test complet (PowerShell)

```powershell
# 1. Naviguer vers le backend
cd backend

# 2. Vérifier que MongoDB est lancé
docker ps | Select-String mongodb

# 3. Installer les dépendances
npm install

# 4. Lancer les tests
npm run test

# 5. Voir la couverture
npm run test:coverage
```

---

## 🔧 Dépannage

### Erreur : "buffering timed out after 10000ms"

**Cause** : MongoDB n'est pas connecté

**Solutions** :
```bash
# 1. Vérifier que MongoDB est lancé
docker-compose ps

# 2. Relancer MongoDB
docker-compose restart mongodb

# 3. Attendre quelques secondes
Start-Sleep -Seconds 5

# 4. Relancer les tests
npm run test
```

### Erreur : "Operation timed out"

```bash
# Augmentez le timeout dans package.json
# Actuellement: --testTimeout=60000 (60s)
# Changez à: --testTimeout=120000 (120s)

npm run test
```

### MongoDB ne démarre pas

```bash
# Vérifier les logs
docker-compose logs mongodb

# Reconstruire le container
docker-compose down
docker volume rm mulksoft_mongodb_data
docker-compose up -d mongodb
```

---

## 📊 Commandes Disponibles

| Commande | Description |
|----------|-------------|
| `npm test` | Lancer les tests une fois |
| `npm run test:watch` | Tests en mode watch (re-run au changement) |
| `npm run test:coverage` | Tests avec couverture de code |

---

## ✅ Résultat Attendu

Si tout va bien, vous devriez voir :

```
PASS  tests/integration.test.js
  MuleSoft Integration Platform - Integration Tests
    Health Check
      ✓ should return 200 on /health endpoint
    Integrations API
      GET /api/integrations
        ✓ should return empty array initially
        ✓ should return all integrations
        ✓ should support pagination
      ...
      
✓ 26 passed (time)
Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
```

---

## 🆘 Besoin d'aide supplémentaire?

Vérifiez que :
1. ✅ MongoDB est lancé : `docker ps | findstr mongodb`
2. ✅ .env.test existe : `ls backend\.env.test`
3. ✅ jest.setup.js existe : `ls backend\jest.setup.js`
4. ✅ node_modules est installé : `ls backend\node_modules\.bin\jest`
5. ✅ Pas de ports en conflit (5001 si test)
