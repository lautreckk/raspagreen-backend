# 🚀 Deploy Instructions

## Railway Deploy

### 1. Preparação
1. Fazer commit de todas as mudanças
2. Push para GitHub
3. Acessar [railway.app](https://railway.app)

### 2. Configurar Variáveis de Ambiente no Railway
```bash
SUPABASE_URL=https://pomwdxozwhmdwyufxrcu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbXdkeG96d2htZHd5dWZ4cmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2NDc5OTUsImV4cCI6MjA2OTIyMzk5NX0.vYo0j76yd9nSGjiG6sxmq4wyMZMmVbSbEAs5URNOmpo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbXdkeG96d2htZHd5dWZ4cmN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY0Nzk5NSwiZXhwIjoyMDY5MjIzOTk1fQ.gHS39mc46ff8OCqpVzDmAFBmwwKDsABVq1vNTUbSvvc
JWT_SECRET=raspadinha_jwt_secret_2024_secure_key_production
NODE_ENV=production
FRONTEND_URL=https://your-app.netlify.app
ALLOWED_ORIGINS=https://your-app.netlify.app
```

### 3. Scripts Railway
- **Start Command**: `npm start`
- **Build Command**: `npm install`

### 4. Após Deploy
1. Anotar URL do Railway (ex: https://raspadinha-backend-production.up.railway.app)
2. Adicionar URL do frontend no ALLOWED_ORIGINS
3. Configurar frontend para usar URL do Railway

## Health Check
Após deploy, testar: `https://your-railway-url.railway.app/health`

## Troubleshooting
- Verificar logs no Railway Dashboard
- Confirmar variáveis de ambiente
- Testar conexão com Supabase