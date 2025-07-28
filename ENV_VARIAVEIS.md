# 🔧 Variáveis de Ambiente - Render

## 📋 Lista para copiar no Render.com

### ✅ Obrigatórias:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://seu-projeto.supabase.co` |
| `SUPABASE_ANON_KEY` | `sua_anon_key_aqui` |
| `SUPABASE_SERVICE_ROLE_KEY` | `sua_service_key_aqui` |
| `JWT_SECRET` | `sua_chave_jwt_forte_32_chars` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://seu-site.netlify.app` |

### 🔧 Opcionais:

| Name | Value |
|------|-------|
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |
| `DEFAULT_RTP` | `0.85` |
| `INITIAL_BALANCE` | `1000` |

## 📍 Como configurar:

1. **Render.com** → Seu projeto → **Environment**
2. **Add Environment Variable**
3. Copie **Name** e **Value** da tabela acima
4. **NÃO** use aspas nos valores

## 🔗 Onde obter credenciais:

- **Supabase:** supabase.com → Projeto → Settings → API
- **JWT_SECRET:** Gerador de senhas (mínimo 32 caracteres)
- **FRONTEND_URL:** URL do Netlify após deploy