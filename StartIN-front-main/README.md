# StartIn Frontend — React 19, Vite, Tailwind CSS & PWA

Interface moderna e responsiva da plataforma **StartIn**, desenvolvida com **React 19**, **TypeScript**, **Vite** e **Tailwind CSS**, preparada para funcionar como **Progressive Web App (PWA)** instalável no desktop e mobile, com estilos CSS modularizados e fluxos segregados por perfil de usuário.

---

## 🎨 Identidade Visual e Experiência do Usuário

- **Cores Oficiais**:
  - Preto Primário: `#111827` (Backgrounds dark, tipografia de contraste, botões principais)
  - Amarelo Destaque: `#FEC908` (Badges de aderência de IA, botões de ação primária, acentos)
  - Superfícies Claras: `#F9FAFB` e `#FFFFFF`
- **Tipografia**: Inter / Outfit sans-serif com legibilidade aprimorada.
- **Marca Oficial**: Logotipo StartIn em vetor sem caixas translúcidas ou backgrounds redundantes no cabeçalho e na tela de login/cadastro.
- **Tratamento Anti-Overflow**: Cards e caixas de texto com regras estritas de `min-w-0`, `break-words`, `break-all` e `line-clamp`, garantindo que conteúdos extensos ou sem espaçamento não ultrapassem os limites dos cards.

---

## 📱 Suporte a PWA (Progressive Web App)

A aplicação conta com arquitetura PWA completa:
- **`manifest.json`**: Configurado com nome da aplicação, cores temáticas, display standalone e mapa de ícones.
- **Service Worker (`sw.js`)**: Cache estático e suporte à navegação offline.
- **Instalação Nativa**: Pode ser instalada diretamente via navegador (Google Chrome, Edge, Safari iOS e Android) comportando-se como um aplicativo nativo no sistema operacional.
- **Pasta de Ícones PWA**: Centralizada em `client/public/icons/` com resoluções padronizadas (192x192, 512x512, maskable e favicon).

---

## 📂 Arquitetura de Pastas e CSS Modular

O frontend adota uma organização limpa e modular de estilos, separando responsabilidades:

```
StartIN-front-main/
├── client/
│   ├── public/
│   │   ├── manifest.json            # Manifesto PWA
│   │   ├── sw.js                    # Service Worker para cache e offline
│   │   └── icons/                   # Ícones oficiais StartIn e PWA
│   ├── src/
│   │   ├── components/              # Componentes de UI (Navbar, Sidebar, Modais, Cards)
│   │   ├── icons/                   # Ícones SVG e Marca Oficial (BrandMarks.tsx)
│   │   ├── screens/                 # Telas da aplicação (Auth, Dashboard, Para Você, Conta)
│   │   │   ├── OpportunitiesScreen.tsx  # Oportunidades unificadas e salvas
│   │   │   ├── AccountScreen.tsx        # Conta & Acesso unificada com Minha Startup
│   │   │   ├── SearchScreen.tsx         # Busca estilo rede social (Instagram-like)
│   │   │   └── DashboardScreen.tsx      # Métricas e indicadores
│   │   └── styles/                  # CSS Modularizado
│   │       ├── tokens.css           # Variáveis CSS de cores, raios e sombras
│   │       ├── base.css             # Resets e regras globais de tipografia
│   │       ├── layout.css           # Estruturas de grid, flexbox e containers
│   │       ├── components.css       # Estilização de botões, cards, badges e modais
│   │       ├── pwa.css              # Regras de visualização standalone de PWA
│   │       └── utilities.css        # Classes utilitárias auxiliares
├── start_front.bat                  # Inicializador rápido para Windows
├── package.json                     # Dependências e scripts
└── vite.config.ts                   # Configuração do Vite e porta 3000
```

---

## 👥 Fluxos de Usuário Segregados

Logo no primeiro passo do cadastro (`AuthScreen`), o usuário escolhe o seu perfil:

### 1. Fluxo Startup
- **"Para você"**: Oportunidades personalizadas com percentual de aderência (0 a 100%) calculado pelo modelo de IA, destacando os 4 pilares: *Perfil da Solução*, *Requisitos do Edital*, *Objetivo Estratégico* e *Contexto de Mercado*.
- **Editais Raspados**: Acesso aos editais reais da FAPESP, FINEP e InovaStartups raspados diariamente com links diretos para PDFs e regulamentos oficiais.
- **Salvar Matches**: Funcionalidade persistente para salvar ou remover oportunidades com sincronização no banco de dados.
- **Busca de Empresas**: Busca pública em estilo Instagram: exibe foto da empresa, nome, 3 tags em miniatura e, ao abrir, exibe resumo de atuação e contatos diretos (incluindo telefone).
- **Conta e Acesso Unificada**: Configurações da conta, dados de login e todos os dados da startup consolidados em um único local intuitivo.

### 2. Fluxo Empresa
- **Lançamento de Oportunidades**: Interface exclusiva para cadastrar e publicar novas oportunidades corporativas (POCs, Compra Direta ou POC + Compra).
- **Busca de Startups com IA**: Painel de busca com cards em estilo Instagram exibindo startups cadastradas, com cálculo de compatibilidade por inteligência artificial com base na necessidade da empresa.
- **Ambiente Limpo**: Não exibe editais públicos de fomento (destinados a startups), focando estritamente em inovação aberta e contratações.

### 🖼 Foto de Perfil Individualizada
Cada perfil (seja Startup ou Empresa) possui sua própria imagem de avatar isolada, persistida tanto no estado da sessão quanto no banco de dados, sem vazamento de imagem ao alternar de conta.

---

## 🚀 Como Executar

### Pré-requisitos
- **Node.js**: Versão 18 ou superior.
- **npm** instalado.

### Passo 1: Instalar Dependências (primeira execução)
```bash
npm install
```

### Passo 2: Executar em Modo de Desenvolvimento
#### Opção A: Script Rápido (Windows)
```powershell
.\start_front.bat
```

#### Opção B: Via Terminal npm
```bash
npm run dev
```

A aplicação subirá na porta padrão configurada: **`http://localhost:3000`** (ou `http://localhost:5173` caso configurado alternativamente).

### Passo 3: Build de Produção
Para validar e compilar os pacotes estáticos com minificação e otimização:
```bash
npm run build
```
Os arquivos otimizados serão gerados na pasta `dist/`.

---

## 🔗 Integração com Outros Serviços
- **Backend Spring Boot**: Comunica-se via REST na porta `8080` (`/api/auth`, `/api/startups`, `/api/companies`, `/api/opportunities`, `/api/matches`).
- **Microserviço de IA Python**: Comunica-se via endpoints proxy ou diretos na porta `8000` (`/api/ai/chat`, `/api/ai/match`).
