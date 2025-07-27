# 🚀 Deploy Gratuito - Guia Completo

Este guia mostra como fazer deploy do backend em serviços gratuitos, já que você não pode usar o Railway no momento.

## 🎯 Opções de Deploy Gratuito

### 1. Railway (Pago - Para referência futura)
- ✅ Fácil deploy direto do GitHub
- ✅ Banco PostgreSQL incluído
- ❌ Requer pagamento

### 2. Render (🏆 RECOMENDADO)
- ✅ 750 horas gratuitas/mês
- ✅ Deploy automático do GitHub
- ✅ Banco PostgreSQL gratuito
- ✅ HTTPS automático
- ❌ "Hiberna" após 15min sem uso

### 3. Vercel
- ✅ Completamente gratuito
- ✅ Deploy super rápido
- ❌ Serverless functions apenas
- ❌ Precisa adaptar código

### 4. Heroku
- ❌ Não é mais gratuito

## 🎯 Deploy no Render (RECOMENDADO)

### Passo 1: Preparar o código

1. **Crie um repositório no GitHub:**
```bash
cd /caminho/para/raspagreen-backend
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/raspagreen-backend.git
git push -u origin main
```

2. **Configure o package.json para produção:**
```json
{
  "scripts": {
    "start": "node src/app.js",
    "build": "echo 'No build needed'"
  },
  "engines": {
    "node": "18"
  }
}
```

### Passo 2: Deploy no Render

1. **Acesse [render.com](https://render.com)**
2. **Conecte sua conta GitHub**
3. **Clique em "New Web Service"**
4. **Selecione seu repositório raspagreen-backend**
5. **Configure:**
   - **Name:** raspagreen-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### Passo 3: Configurar Banco de Dados

1. **No Render, clique em "New PostgreSQL"**
2. **Configure:**
   - **Name:** raspagreen-db
   - **Plan:** Free
3. **Anote as credenciais que aparecerem**

### Passo 4: Variáveis de Ambiente

No painel do Render, vá em "Environment" e adicione:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
JWT_SECRET=seu_jwt_secret_muito_forte_aqui
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://seu-site-netlify.netlify.app
```

### Passo 5: Configurar Frontend

No seu frontend (Netlify), atualize a URL da API:

```env
VITE_API_URL=https://raspagreen-backend-xyz.onrender.com
```

## 🎯 Deploy no Vercel (Alternativa)

### Configuração Serverless

1. **Instale o Vercel CLI:**
```bash
npm i -g vercel
```

2. **Crie `vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. **Adapte o app.js para serverless:**
```javascript
// No final do src/app.js, adicione:
export default app;
```

4. **Deploy:**
```bash
vercel --prod
```

## 🎯 Configuração do Supabase (GRATUITO)

O Supabase oferece tier gratuito excelente:

1. **Acesse [supabase.com](https://supabase.com)**
2. **Crie conta gratuita**
3. **Novo projeto:**
   - Name: raspagreen
   - Database Password: [senha forte]
   - Region: South America (São Paulo)

4. **Execute os scripts SQL:**
   - Copie o conteúdo de `database/01_create_tables.sql`
   - Cole no SQL Editor do Supabase
   - Execute um por vez

## 📱 Configuração Completa

### 1. Frontend (Netlify)
```
Site: https://raspagreen.netlify.app
Deploy: Automático via GitHub
```

### 2. Backend (Render)
```
API: https://raspagreen-backend.onrender.com
Deploy: Automático via GitHub
```

### 3. Banco (Supabase)
```
Host: Gerenciado pelo Supabase
Backup: Automático
```

## ⚡ Limitações do Tier Gratuito

### Render:
- Hibernação após 15min inativo
- 750 horas/mês (suficiente para uso pessoal)
- 1 aplicação web grátis

### Netlify:
- 100GB banda/mês
- 300 minutos build/mês
- Sites ilimitados

### Supabase:
- 2 projetos gratuitos
- 500MB banco de dados
- 2GB transferência/mês

## 🔧 Troubleshooting

### Se o backend "hiberna":
- Normal no Render free tier
- Primeira requisição demora ~10-30s
- Considere implementar "ping" periódico

### Se der erro de CORS:
- Verifique FRONTEND_URL nas env vars
- Certifique-se que está usando HTTPS

### Se o banco der timeout:
- Verifique se executou todos os scripts SQL
- Confirme as credenciais do Supabase

## 💡 Dicas de Performance

1. **Mantenha o backend "acordado":**
```javascript
// Adicione uma rota de health check
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

2. **Use CDN para assets:**
   - Netlify já fornece CDN global
   - Imagens no ImageKit (já configurado)

3. **Cache inteligente:**
   - Configure headers de cache
   - Use Redis se disponível no futuro

Pronto! Com essa configuração você terá um sistema completo funcionando 100% gratuito! 🚀