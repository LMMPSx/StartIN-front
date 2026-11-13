# StartIn Frontend - React 19, TypeScript, Vite, Tailwind CSS & PWA

Interface responsiva da plataforma StartIn, desenvolvida com React 19, TypeScript, Vite e Tailwind CSS, preparada para funcionar como Progressive Web App (PWA) instalavel no desktop e mobile, com fluxos segregados por perfil, sistema de assinatura Freemium/Premium (Free e Pro), exportacao de documentos do Chatbot em PDF/DOCX e painel administrativo completo.

---

## 1. Identidade Visual e Experiencia do Usuario

- **Cores Oficiais**:
  - Preto Primario: `#111827` (Backgrounds dark, tipografia de contraste, botoes principais)
  - Amarelo Destaque: `#FEC908` (Badges de aderencia de IA, selos Pro, botoes de acao primaria, acentos)
  - Superficies Claras: `#F9FAFB` e `#FFFFFF`
- **Tipografia**: Inter / Outfit sans-serif com hierarquia visual padronizada.
- **Seletores Inteligentes (`Outro:`)**: Em todos os perfis e telas (Onboarding, Meu Perfil, Conta e Lancamento de Demandas), os seletores de Categoria Principal, Area de Tecnologia e Setor de Atuacao trazem a opcao padronizada `Outro:`. Ao seleciona-la, o proprio campo se converte em caixa de digitacao no mesmo lugar (com botao `Ver lista` integrado), sem abrir campos extras abaixo.
- **Tratamento Anti-Overflow**: Cards de oportunidades e demandas contam com regras estritas de `min-w-0`, `break-words` e `line-clamp`, mantendo o layout integro em qualquer resolucao.

---

## 2. Suporte a PWA (Progressive Web App)

A aplicacao conta com arquitetura PWA completa:
- `manifest.json`: Configurado com nome da aplicacao, cores tematicas, display standalone e mapa de icones.
- Service Worker (`sw.js`): Cache estatico e suporte a navegacao resiliente.
- Instalacao Nativa: Pode ser instalada diretamente via navegador (Chrome, Edge, Safari iOS e Android).
- Pasta de Icones PWA: Centralizada em `client/public/icons/` com resolucoes padronizadas (192x192, 512x512, maskable e favicon).

---

## 3. Estrutura de Pastas do Frontend

```text
StartIN-front-main/
|-- client/
|   |-- public/
|   |   |-- manifest.json                # Manifesto PWA
|   |   |-- sw.js                        # Service Worker para cache
|   |   `-- icons/                       # Icones oficiais StartIn e PWA
|   `-- src/
|       |-- components/startin/          # Componentes reutilizaveis do ecossistema
|       |   |-- AppShell.tsx             # Layout autenticado, sidebar e bloqueios Free/Pro
|       |   |-- CommonUI.tsx             # Campos, botoes, cards e guia de prompt IA
|       |   `-- PlanComponents.tsx       # Selos Pro Member, Verificado, Banner Ver Mais e Modal Pro
|       |-- icons/                       # Icones SVG e Marca Oficial (BrandMarks.tsx)
|       |-- lib/
|       |   `-- api.ts                   # Cliente HTTP REST, filtro Free sem mutacao de score e tipos
|       |-- screens/                     # Telas especializadas da aplicacao
|       |   |-- LandingScreen.tsx        # Landing page publica com comparativo Free vs Pro (R$ 30)
|       |   |-- AuthScreens.tsx          # Login (incluindo admin / 0000), Cadastro e Recuperacao
|       |   |-- OnboardingScreen.tsx     # Onboarding de Startups e Empresas
|       |   |-- DashboardScreen.tsx      # Dashboards de Startup e Empresa
|       |   |-- OpportunitiesScreen.tsx  # Aba Para Voce, Explorar e Detalhes de Oportunidades
|       |   |-- MatchesScreen.tsx        # Conexoes e Matches com decomposicao auditada 40/30/30
|       |   |-- MyOpportunitiesScreen.tsx# Gestao de POCs/Compras corporativas e Busca de Startups
|       |   |-- ProviderScreens.tsx      # Onboarding 3 etapas + PDF, Recomendacoes e Demandas
|       |   |-- AssistantScreen.tsx      # Assistente IA com estilo de template e exportacao PDF/DOCX
|       |   |-- SettingsScreens.tsx      # Configuracoes, Conta, Estagio TRL e Planos
|       |   `-- AdminScreen.tsx          # Painel de controle e moderacao geral do Administrador
|       |-- styles/                      # CSS Modularizado (tokens, base, layout, components, pwa)
|       `-- utils/                       # Formatadores e exportadores (formatters.ts, templateExport.ts)
|-- start_front.bat                      # Inicializador rapido para Windows
|-- package.json                         # Dependencias e scripts npm
`-- vite.config.ts                       # Configuracao do Vite e porta 3000
```

---

## 4. Fluxos de Usuario, Planos (Free vs Pro) e Funcionalidades

### 4.1. Comparativo de Planos (Free vs Pro - R$ 30/mes)
- **Plano Free**:
  - Exibe 1 match principal de alta aderencia e ate 3 resultados complementares nas listagens de recomendacoes e conexoes, preservando integralmente o score real calculado pela IA.
  - Componente `VerMaisProBanner` enxuto ao final das listagens reduzidas para convidar ao upgrade sem exibir textos tecnicos redundantes de faixa percentual.
  - Limite de lancamento de ate **5 oportunidades por mes** (Empresas e Startups em Tracao).
  - Sem acesso ao botao "Melhorar texto com IA" na criacao de oportunidades e sem acesso ao Assistente IA (Chatbot).
  - RAG e atualizacao automatica de editais 1 vez por semana (segundas-feiras as 08:00).
- **Plano Pro (R$ 30/mes para qualquer perfil)**:
  - Acesso total a 100% dos matches, oportunidades, empresas, startups e prestadores de servico.
  - Limite ampliado de ate **15 oportunidades por mes** (Empresas e Startups em Tracao).
  - Impulsionamento de visibilidade nas oportunidades lancadas, selo `pro member` nos cards e selo `Verificado` ao lado do nome do assinante.
  - Botao **Melhorar texto com a IA** liberado ao lancar oportunidades e demandas.
  - Acesso liberado ao **Assistente IA (Chatbot)** e RAG diario as 08:00.

### 4.2. Fluxo Startup (Validacao e Tracao)
- **Onboarding em 3 Etapas**: Identidade (com seletor `Outro:` no mesmo campo), Solucao estruturada com IA e Momento (`Validacao` vs `Tracao` com escala TRL NASA 1-9 e Atestado de Capacidade Tecnica em PDF).
- **Alternancia Persistente de Estagio**: Ao alterar o estagio para `Tracao` nas configuracoes, o sistema persiste imediatamente no backend e atualiza os menus para exibir contratacao de prestadores de servico e lancamento de demandas tecnicas (ate 5/mes no Free ou 15/mes no Pro).

### 4.3. Fluxo Prestador de Servicos
- **Onboarding Resumido em 3 Etapas com Leitura de Curriculo em PDF**:
  1. `01 · Perfil & Anexos`: Foto/logo opcional, Nome ou Razao Social, Tipo de prestador, **Anexar Curriculo em PDF (Obrigatorio)**, LinkedIn (opcional) e Meu Site / Portfolio (opcional). A IA processa o PDF imediatamente e extrai categoria, servico principal, tecnologias dominadas, experiencia e gera a descricao previa em 1a pessoa.
  2. `02 · Competencias, Tecnologias & Servicos`: Revisao e edicao dos campos extraidos pela IA (incluindo Categoria Principal com opcao `Outro:` editavel no mesmo campo).
  3. `03 · Descricao Profissional`: Campo pre-preenchido com a descricao profissional gerada pela IA a partir do curriculo em PDF, permitindo edicao livre e aprimoramento via botao **Melhorar com IA**.
- **Recomendacoes de Oportunidades**: Exibe diretamente as demandas tecnicas e oportunidades lancadas pelas startups em Tracao com o score real e simetrico da IA.

### 4.4. Fluxo Empresa
- **Dashboard e Gestao de Oportunidades**: Lancamento e edicao de `POC`, `Primeira Compra` e `Compra` respeitando o limite mensal do plano (5 no Free, 15 no Pro), com impulsao e melhoria por IA no Plano Pro.
- **Busca de Startups**: Matchmaking auditado e simetrico com todas as startups compativeis.

### 4.5. Assistente IA (Chatbot) com Estilo de Template e Exportacao PDF/DOCX
- Permite ao usuario definir um estilo de template personalizado (ou digitar `padrao` para usar o formato padrao da IA).
- Exportacao nativa de qualquer template ou resposta gerada pela IA diretamente em formato **PDF** ou **DOCX** (`utils/templateExport.ts`).

### 4.6. Fluxo Administrador (`AdminScreen.tsx`)
- Login direto com usuario `admin` e senha `0000`.
- Controle centralizado de usuarios, perfis, planos (`FREE` / `PRO`), oportunidades corporativas e demandas de startups, com edicao e exclusao em tempo real.

---

## 5. Como Executar

### Pre-requisitos
- Node.js: Versao 18 ou superior.
- npm instalado.

### Passo 1: Instalar Dependencias
```bash
npm install
```

### Passo 2: Executar em Modo de Desenvolvimento
```bash
npm run dev
```
Ou via script no Windows:
```powershell
.\start_front.bat
```
A aplicacao estara disponivel em `http://localhost:3000`.

### Passo 3: Build de Producao
```bash
npm run build
```
Os pacotes otimizados serao gerados no diretorio `dist/`.


---

## Deploy no Vercel

- Root Directory no Vercel: `StartIN-front-main` (preset `Vite`, build `npm run build`, saida `dist/public`, ja definidos em `vercel.json`).
- Variavel obrigatoria: `VITE_API_URL` com a URL do backend no Railway (ex.: `https://seu-backend.up.railway.app/api`). Apos alterar, faca Redeploy.
- Sem `VITE_API_URL`, o modo dev usa `http://localhost:8080/api`.

Passo a passo completo: [../DEPLOY.md](../DEPLOY.md).
