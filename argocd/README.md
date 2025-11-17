# ArgoCD Configuration - Dockify App

Configurare ArgoCD pentru deployment automat al aplicației dockify-app.

## Fișiere în acest folder

- **project.yaml**: Definește ArgoCD Project "dockify-app"
- **repo-secret.yaml**: Secret pentru conectare la GitHub repository privat
- **application.yaml**: Definește ArgoCD Application cu auto-sync

## Deployment Steps

### 1. Conectează Repository-ul GitHub

Aplică secret-ul pentru conectarea la repo privat:

```bash
kubectl apply -f argocd/repo-secret.yaml
```

Verifică că secret-ul a fost creat:

```bash
kubectl get secret -n argocd dockify-app-repo
```

### 2. Creează ArgoCD Project

```bash
kubectl apply -f argocd/project.yaml
```

Verifică project-ul:

```bash
kubectl get appproject -n argocd dockify-app
```

### 3. Deploy ArgoCD Application

```bash
kubectl apply -f argocd/application.yaml
```

Verifică aplicația:

```bash
kubectl get application -n argocd dockify-app
```

## Monitoring

### Via kubectl

```bash
# Watch application status
kubectl get application -n argocd dockify-app -w

# Check sync status
kubectl get application -n argocd dockify-app -o yaml | grep -A 5 status

# View application details
kubectl describe application -n argocd dockify-app
```

### Via ArgoCD UI

1. Access ArgoCD UI:
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

2. Open browser: https://localhost:8080

3. Navigate to **Applications** → **dockify-app**

4. View:
   - Sync status
   - Resource tree
   - Deployment history
   - Logs

## Manual Sync

Dacă auto-sync este dezactivat sau vrei să forțezi sync:

```bash
# Via kubectl
kubectl patch application -n argocd dockify-app --type merge \
  -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'

# Via ArgoCD CLI
argocd app sync dockify-app
```

## Rollback

```bash
# List revision history
argocd app history dockify-app

# Rollback to specific revision
argocd app rollback dockify-app <revision-number>
```

## Auto-Sync Configuration

Aplicația este configurată cu:

- **Auto-sync**: Enabled (sincronizare automată la push pe Git)
- **Self-heal**: Enabled (revine la starea din Git dacă modifici manual)
- **Prune**: Enabled (șterge resursele eliminate din Git)

## Troubleshooting

### Repository Connection Failed

```bash
# Check secret
kubectl get secret -n argocd dockify-app-repo -o yaml

# Test GitHub token
curl -H "Authorization: token <GITHUB_TOKEN>" \
  https://api.github.com/repos/xtian-o/dockify-app
```

### Application Out of Sync

```bash
# Check diff
argocd app diff dockify-app

# Force sync
argocd app sync dockify-app --force

# Refresh application
argocd app get dockify-app --refresh
```

### Health Check Failed

```bash
# Check application logs
kubectl logs -n argocd deployment/argocd-application-controller | grep dockify-app

# Check individual resources
kubectl get all -n dockify-app
```

## Security Notes

**IMPORTANT**: `repo-secret.yaml` conține GitHub Personal Access Token.

Pentru producție:
- Folosește **Sealed Secrets** sau **External Secrets Operator**
- Rotează token-ul periodic
- Limitează permisiunile la "Read-only" pentru repository

## Clean Up

Pentru a șterge complet aplicația:

```bash
# Delete application (va șterge toate resursele din cluster)
kubectl delete application -n argocd dockify-app

# Delete project
kubectl delete appproject -n argocd dockify-app

# Delete repository secret
kubectl delete secret -n argocd dockify-app-repo
```
