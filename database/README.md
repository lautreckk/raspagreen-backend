# Database Setup

Este diretório contém os scripts SQL e utilitários para configurar o banco de dados Supabase da aplicação Raspadinha.

## Arquivos

- `01_create_tables.sql` - Criação das tabelas principais
- `02_create_rls_policies.sql` - Políticas de Row Level Security
- `03_create_functions_triggers.sql` - Functions e triggers
- `04_insert_initial_data.sql` - Dados iniciais (categorias e prêmios)
- `setup-database.js` - Script Node.js para executar a configuração

## Como configurar

### 1. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto backend com:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Instalar dependências

```bash
cd backend
npm install
```

### 3. Executar setup do banco

```bash
cd backend
node database/setup-database.js
```

## Estrutura do Banco

### Tabelas Principais

1. **user_profiles** - Perfis de usuários com dados de carteira
2. **scratch_categories** - Categorias de raspadinhas disponíveis  
3. **prizes** - Prêmios disponíveis para cada categoria
4. **game_sessions** - Histórico de jogos realizados
5. **rtp_control** - Controle de RTP por categoria
6. **transactions** - Histórico de transações financeiras

### Funcionalidades Automáticas

- **RLS (Row Level Security)** - Usuários só acessam seus próprios dados
- **Triggers** - Atualização automática de saldo e RTP
- **Functions** - Cálculos automáticos e validações
- **Índices** - Otimização de performance

## Dados Iniciais

O sistema vem com 3 categorias pré-configuradas:

- **Raspadinha R$ 5,00** - 9 prêmios (R$ 2 a iPhone 15)
- **Raspadinha R$ 10,00** - 11 prêmios (R$ 5 a PlayStation 5)  
- **Raspadinha R$ 25,00** - 10 prêmios (R$ 10 a Moto Biz)

Cada categoria tem RTP configurado para 85% por padrão.

## Monitoramento

Após a configuração, você pode:

1. **Verificar no Supabase Dashboard** - Tables, RLS, Functions
2. **Testar APIs** - Usar Postman ou similar
3. **Monitorar RTP** - Consultar tabela `rtp_control`
4. **Ver logs** - Transações na tabela `transactions`