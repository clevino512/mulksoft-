# Documentation de Maintenance et Rollback

## 🔧 Procédures de Maintenance

### 1. Monitoring quotidien

**Vérifier l'état des services** :
```bash
docker-compose ps

# Résultat attendu
NAME                    STATUS              PORTS
mulesoft-backend        Up                  0.0.0.0:5000->5000/tcp
mulesoft-frontend       Up                  0.0.0.0:80->80/tcp
mulesoft-mongodb        Up                  0.0.0.0:27017->27017/tcp
```

**En cas de service down** :
```bash
docker-compose restart backend  # Redémarrer le backend
docker-compose logs backend     # Consulter les logs
```

### 2. Gestion des logs

**Voir les logs en temps réel** :
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f backend
docker-compose logs -f mongodb

# Dernières N lignes
docker-compose logs --tail=100 backend

# Depuis un timestamp
docker-compose logs --since 2024-04-04T10:00:00 backend
```

**Archivage des logs** :
```bash
# Exporter les logs
docker-compose logs backend > backup/logs-$(date +%Y%m%d).log

# Vider les logs (optionnel)
docker container prune --filter "until=72h"
```

### 3. Gestion de la Database MongoDB

#### Backup quotidien
```bash
# Backup manuel
docker exec mulesoft-mongodb mongodump \
  --username admin \
  --password password123 \
  --authenticationDatabase admin \
  --out /data/backup/backup-$(date +%Y%m%d)

# Automatiser avec cron (Linux/Mac)
0 2 * * * docker exec mulesoft-mongodb mongodump --username admin --password password123 --authenticationDatabase admin --out /data/backup/backup-$(date +\%Y\%m\%d)
```

#### Restore depuis backup
```bash
# Restore complet
docker exec mulesoft-mongodb mongorestore \
  --username admin \
  --password password123 \
  --authenticationDatabase admin \
  /data/backup/backup-20240404

# Restore une collection spécifique
docker exec mulesoft-mongodb mongorestore \
  --username admin \
  --password password123 \
  --authenticationDatabase admin \
  --db mulesoft-platform \
  --collection integrations \
  /data/backup/backup-20240404/mulesoft-platform/integrations.bson
```

#### Vérifier l'intégrité
```bash
# Connexion à MongoDB
docker exec -it mulesoft-mongodb mongosh --username admin --password password123 --authenticationDatabase admin

# Dans le shell MongoDB
use mulesoft-platform
db.integrations.countDocuments()
db.logs.countDocuments()
db.stats.countDocuments()
```

### 4. Nettoyage de données

#### Archivage des vieux logs (>90 jours)
```bash
# Créer une tâche MongoDB
docker exec mulesoft-mongodb mongosh --username admin --password password123 --authenticationDatabase admin <<EOF
use mulesoft-platform
db.logs.deleteMany({ 
  timestamp: { 
    \$lt: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000) 
  } 
})
EOF
```

#### Optimiser les indexes
```bash
docker exec -it mulesoft-mongodb mongosh --username admin --password password123 --authenticationDatabase admin <<EOF
use mulesoft-platform
db.logs.reIndex()
db.integrations.reIndex()
db.stats.reIndex()
EOF
```

---

## 🔄 Procédures de Rollback

### Scénario 1 : Rollback complet du déploiement

**Situation** : Un nouveau déploiement a causé une instabilité

```bash
# 1. Vérifier le version précédente en git
git log --oneline -5
git log --format="%h %s" -5

# 2. Identifier le commit stable
git checkout <previous-stable-commit>

# 3. Arrêter les services actuels
docker-compose down

# 4. Reconstruire et redéployer
docker-compose build
docker-compose up -d

# 5. Vérifier le statut
docker-compose ps
curl http://localhost:5000/api/health

# 6. Verify frontend
curl http://localhost
```

### Scénario 2 : Rollback Base de Données uniquement

**Situation** : Erreur de migration de données

```bash
# 1. Lister les backups disponibles
ls -la /path/to/backup/

# 2. Arrêter le backend (importante!)
docker-compose down backend

# 3. Restore le backup MongoDB
docker exec mulesoft-mongodb mongorestore \
  --username admin \
  --password password123 \
  --authenticationDatabase admin \
  --drop \
  /data/backup/backup-20240403

# 4. Redémarrer les services
docker-compose restart backend
docker-compose restart frontend

# 5. Valider les données
docker exec -it mulesoft-mongodb mongosh --username admin --password password123 --authenticationDatabase admin
# use mulesoft-platform
# db.integrations.findOne()
```

### Scénario 3 : Réversion d'une feature spécifique

**Situation** : Une feature cause des problèmes

```bash
# 1. Identifier le commit avant la feature
git log --oneline | grep "feature-name"
git show <commit-before-feature>

# 2. Créer une branche hotfix
git checkout -b hotfix/revert-feature <stable-commit>

# 3. Faire un revert propre
git revert <breaking-commit> --no-edit

# 4. Redéployer
docker-compose rebuild backend
docker-compose up -d

# 5. Tester
npm test
curl http://localhost:5000/api/health
```

---

## 🚨 Gestion des incidents

### Checklist d'urgence

```bash
# 1. Vérifier les services
docker-compose ps

# 2. Consulter les logs d'erreur
docker-compose logs backend --tail=100

# 3. Vérifier la connexion MongoDB
docker exec mulesoft-mongodb mongosh --eval "db.adminCommand('ping')"

# 4. Redémarrer un service spécifique
docker-compose restart backend

# 5. Vérifier les réponses API
curl -v http://localhost:5000/api/integrations

# 6. Vérifier l'espace disque
docker system df

# 7. Vérifier la mémoire
docker stats
```

### Incident : "Database connection refused"

```bash
# Étapes de résolution
1. Vérifier que MongoDB est en cours d'exécution
   docker-compose ps mongodb

2. Vérifier les credentials
   MONGODB_URI=mongodb://admin:password123@mongodb:27017/mulesoft-platform?authSource=admin

3. Redémarrer MongoDB
   docker-compose restart mongodb

4. Vérifier la connectivité réseau
   docker exec backend ping mongodb

5. Consulter les logs MongoDB
   docker-compose logs mongodb --tail=50
```

### Incident : "Out of disk space"

```bash
# Libérer de l'espace
docker system prune -a  # Enlever les images/conteneurs inutilisés
docker volume prune     # Enlever les volumes orphelins

# Vérifier l'utilisation
docker system df

# Archiver et delete les vieux logs
docker-compose exec -T mongodb mongosh --eval "
  db.logs.deleteMany({ 
    timestamp: { \$lt: new Date(new Date() - 30*24*60*60*1000) } 
  })
" --username admin --password password123
```

### Incident : "High CPU/Memory usage"

```bash
# Identifier le service
docker stats

# Limiter les ressources dans docker-compose.yml
# services:
#   backend:
#     deploy:
#       resources:
#         limits:
#           cpus: '1'
#           memory: 512M

docker-compose up -d  # Appliquer les limites
```

---

## 📋 SLA & Recommandations

### Backup
- **Fréquence** : Quotidien (2:00 AM)
- **Rétention** : 30 jours
- **Vérification** : Hebdomadaire

### Monitoring
- **Temps réponse** : < 200ms (cible)
- **Uptime** : 99.5%
- **Alertes** : Configurez les seuils

### Maintenance programmée
- **Jour** : Dimanche 2:00 AM
- **Durée** : 30 minutes max
- **Notification** : 24h avant

---

## 🔗 Ressources complémentaires

- [MongoDB Ops Manager](https://docs.mongodb.com)
- [Docker Best Practices](https://docs.docker.com)
- [Express.js Logging](https://expressjs.com)
- [GitHub Actions Workflows](https://docs.github.com/actions)
 
