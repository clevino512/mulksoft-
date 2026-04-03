# Guide Utilisateur - MuleSoft Integration Platform

## 📱 Accès à l'Application

### URL
- **Production**: http://localhost (via Docker) ou http://localhost:3000 (développement)
- **Backend API**: http://localhost:5000/api

### Première utilisation
L'application est accessible sans authentification (configurez JWT si nécessaire).

---

## 🎯 Tableau de Bord

Le dashboard affiche :
- **Nombre d'intégrations** actives
- **Statut des connexions** en temps réel
- **Logs récents** des dernières opérations
- **Statistiques** de succès/erreurs
- **Graphiques** de tendances

### Navigation
- Utilisez la barre latérale pour naviguer entre les sections
- Chaque section est disponible dans le menu principal

---

## 🔗 Gestion des Intégrations

### Créer une intégration

1. **Cliquez** sur "Intégrations" dans le menu
2. **Cliquez** sur le bouton "+ Nouvelle Intégration"
3. **Remplissez** le formulaire :
   - **Nom** : Identificateur unique de l'intégration
   - **Type** : REST, SOAP, JDBC, etc.
   - **Endpoint** : URL de l'API (ex: https://api.example.com/endpoint)
   - **Méthode** : GET, POST, PUT, DELETE
   - **Headers** : En-têtes HTTP additionnels (JSON)
   - **Body** : Payload (pour POST/PUT)
   - **Authentification** : Credentials si nécessaire

4. **Cliquez** "Créer"

### Tester une intégration

**Avant de valider**, testez la connexion :

1. **Cliquez** sur l'intégration créée
2. **Cliquez** le bouton "Tester"
3. **Vérifiez** le résultat :
   - ✅ **Succès** : Status code, réponse affichés
   - ❌ **Erreur** : Message et détails de l'erreur

### Éditer une intégration

1. **Cliquez** sur l'intégration à modifier
2. **Cliquez** le bouton "Éditer"
3. **Modifiez** les paramètres
4. **Cliquez** "Enregistrer"

### Supprimer une intégration

1. **Cliquez** sur l'intégration
2. **Cliquez** le bouton "Supprimer"
3. **Confirmez** la suppression

**⚠️ Non-réversible** : Tous les logs associés seront conservés à des fins d'audit.

---

## 📊 Statistiques et Monitoring

### Voir les statistiques

1. **Accédez** Dashboard > Statistiques
2. **Consultez** :
   - Total d'appels API
   - Taux de succès/erreurs
   - Temps de réponse moyen
   - Intégrations les plus utilisées

### Exporter les données
- **CSV** : Cliquez le bouton "Exporter CSV"
- **PDF** : Cliquez le bouton "Exporter PDF" (si disponible)

---

## 📝 Logs et Debugging

### Voir les logs

1. **Accédez** à la section "Logs"
2. **Filtrez** par :
   - **Intégration** : Sélectionnez une intégration spécifique
   - **Statut** : Succès, Erreur, Avertissement
   - **Date** : Plage de dates
   - **Niveau** : Debug, Info, Warn, Error

### Interpréter un log

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "integrationId": "505f1f88ccg97ce899549022",
  "integrationName": "MuleSoft API",
  "status": "success",
  "statusCode": 200,
  "request": { "method": "GET", "url": "https://api.mulesoft.com/v1/..." },
  "response": { "time": 234, "size": 1024 },
  "error": null,
  "timestamp": "2025-04-04T14:23:45Z"
}
```

**Explications** :
- **status** : Résultat de l'appel (success/error)
- **statusCode** : Code HTTP retourné
- **response.time** : Latence en ms
- **error** : Message d'erreur (si erreur)

### Exporter les logs
- **CSV** : Cliquez "Exporter CSV"
- **JSON** : Cliquez "Exporter JSON"

---

## 🔐 Sécurité & Best Practices

### URLs de base
✅ **Sécurisées** :
- `https://api.example.com` → HTTPS obligatoire
- Certificats SSL valides

❌ **À éviter** :
- `http://api.example.com` → HTTP non-chiffré
- Endpoints publics sans authentification

### Authentification API

**Trois méthodes supportées** :

1. **API Key**
   - Headers: `Authorization: Bearer YOUR_API_KEY`

2. **Basic Auth**
   - Headers: `Authorization: Basic base64(username:password)`

3. **OAuth 2.0** (si configuré)
   - Frame d'authentification automatique

### Données sensibles
⚠️ **Ne jamais** :
- Stocker les credentials en clair
- Commiter les `.env` en git
- Partager les clés API en messages

---

## 🆘 Troubleshooting

### "Connection refused"
```
Vérifiez :
1. L'endpoint est-il correct ? 
2. Le service cible est-il actif ?
3. Firewall bloque-t-il les requêtes ?
```

### "401 Unauthorized"
```
Vérifiez :
1. Les credentials sont-ils valides ?
2. Le token a-t-il expiré ?
3. L'authentification est-elle configurée ?
```

### "Timeout"
```
Solutions :
1. Augmentez le timeout ( défault: 30s)
2. Vérifiez la latence réseau
3. Comprimez les données de requête
```

### "500 Internal Server Error"
```
Consultez les logs :
1. Accédez Logs > Filtrez par Erreur
2. Copiez l'error ID
3. Contactez le support avec l'error ID
```

---

## 📞 Support

**Besoin d'aide ?**
- 📧 Email : support@mulesoft-integration.com
- 💬 Chat : Disponible via l'app (9h-17h)
- 📖 Docs : https://docs.example.com
- 🐛 Bug Report : https://github.com/issues

---

## 📋 Checklist - Première Configuration

- [ ] Se connecter à l'application
- [ ] Créer une première intégration
- [ ] Tester la connexion
- [ ] Consulter les logs
- [ ] Explorer le dashboard
- [ ] Vérifier les statistiques
