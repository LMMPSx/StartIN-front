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
- **Onboarding Enxuto em 3 Etapas + IA**:
  1. **Identidade**: Seletor de área tecnológica principal (com opção `Outro`), localização e site (dados do cadastro inicial como Nome, Telefone e CNPJ ficam editáveis exclusivamente em `Conta e acesso`, sem campo de descrição curta).
  2. **Solução**: Campo único de *Problema que resolve* com estruturação obrigatória via botão **`Melhorar texto com IA`**, extraindo automaticamente tecnologias, modelo de negócio e tags de matchmaking.
  3. **Momento (`Validação` vs `Tração`)**: Startups em **Validação** finalizam imediatamente e visualizam `POCs`, `Primeira Compra`, `Editais` e `Eventos`; startups em **Tração** respondem à pesquisa de maturidade **TRL da NASA (1–9)** e anexam o **Atestado de Capacidade Técnica (PDF)** lido pela IA, visualizando `Compras Corporativas` diretas (sem POCs), `Editais` e `Eventos`.
- **Dashboard Otimizado**: Exibe `Oportunidades encontradas` (soma acumulada histórica), `Empresas com match`, `Matches novos` (delta da última atualização da IA) e `Em acompanhamento`.
- **"Para você" & Detalhes da Oportunidade**: Filtragem automática pelo estágio da startup (sem botão manual de filtros) e card direto da **Empresa Ofertante** nas oportunidades de `POC`, `Primeira Compra` e `Compra`.
- **Busca de Empresas**: Exibe no perfil de cada empresa todas as oportunidades (`POC`, `Primeira Compra`, `Compra`) lançadas por ela.
- **Salvos & Assistente IA Gerador de Templates**: Botão direto em oportunidades salvas para abrir o chat da IA com a oportunidade pré-selecionada, suporte a upload de documentos (PDF/DOCX/TXT) e geração de templates e propostas persuasivas.

### 2. Fluxo Empresa
- **Dashboard Corporativo**: Exibe os 2 indicadores principais (`Startups que deram match` e `POCs / Compras lançadas`), painel de **Últimas POCs / Compras abertas** (com edição direta ao clicar) e painel de **Últimas startups que deram match** (abrindo o histórico completo de matches ao clicar).
- **Lançamento e Edição de Oportunidades**: Criação e edição completa de `POC`, `Primeira Compra` e `Compra`.
- **Busca de Startups com Interesse Destacado**: Exibe startups compatíveis e destaca quais salvaram interesse em participar das POCs/Compras da empresa (sem botão redundante de nova POC e sem Assistente IA no fluxo corporativo).

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
