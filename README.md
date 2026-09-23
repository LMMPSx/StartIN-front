# StartIn

Frontend da StartIn, uma plataforma para conectar startups a editais, eventos, provas de conceito, compras corporativas e outras oportunidades personalizadas por inteligência artificial.

Este projeto implementa o fluxo visual e interativo definido no protótipo de UI/UX. A versão atual funciona de forma independente, usando dados locais e estados simulados no navegador. A integração com o back-end ainda não está habilitada.

## Visão geral

A aplicação foi construída para representar a jornada completa de uma startup dentro da StartIn. O usuário pode criar uma conta, configurar o perfil da startup, explorar oportunidades, consultar matches, conversar com o assistente de IA, cadastrar oportunidades e gerenciar preferências da conta.

A interface segue a identidade visual do protótipo, com navegação lateral em desktop, menu adaptado para mobile, fundo claro, azul navy como cor principal e amarelo como cor de destaque.

## Funcionalidades implementadas

### Acesso e onboarding

- Login com e-mail e senha.
- Cadastro de nova conta.
- Recuperação e redefinição de senha.
- Tela de confirmação de e-mail.
- Onboarding dividido em etapas para configurar a startup.
- Tela de conclusão do perfil.

### Área principal

- Dashboard com resumo da atividade.
- Indicadores de oportunidades salvas, matches, prazos e acompanhamentos.
- Lista de próximos prazos.
- Atividade recente.
- Recomendações personalizadas para a startup.

### Oportunidades

- Busca por texto.
- Filtro por tipo de oportunidade.
- Categorias de edital, evento, POC e compra.
- Cards com percentual de aderência.
- Tela detalhada da oportunidade.
- Informações de prazo, localização, modalidade e status.
- Explicação dos critérios usados para o match.
- Registro local de interesse em uma oportunidade.
- Estado vazio quando nenhum resultado corresponde aos filtros.

### Matches e inteligência artificial

- Lista de conexões recomendadas.
- Percentual médio de compatibilidade.
- Status das conexões.
- Tela de detalhe do match.
- Explicação transparente da recomendação.
- Assistente IA com conversa local simulada.
- Ações rápidas para buscar editais, eventos, matches e analisar oportunidades.

### Perfil e publicação

- Perfil da startup.
- Preferências de matching.
- Áreas de interesse e tipos de oportunidade.
- Cadastro de empresa ou organização.
- Cadastro de nova oportunidade.
- Tela de confirmação após publicação.
- Minhas oportunidades com resumo por status.

### Conta e configurações

- Configurações gerais.
- Conta e acesso.
- Privacidade e segurança.
- Preferências de matching.
- Notificações com categorias e histórico.
- Preferências rápidas para recomendações, e-mails e novos matches.
- Logout local.

## Tecnologias

- **React 19** para a interface.
- **TypeScript** para tipagem estática.
- **Tailwind CSS 4** para estilos utilitários e responsividade.
- **Vite** para desenvolvimento e build.
- **Wouter** para a estrutura de rotas do template.
- **Lucide React** para ícones.
- **Vitest** para testes automatizados.
- **tRPC, Express, Drizzle e MySQL** permanecem disponíveis no template para a futura integração com o back-end.

## Estrutura principal

```text
client/
  index.html                 Documento HTML principal.
  src/
    App.tsx                  Providers e roteamento base.
    index.css                Tokens visuais, fontes e estilos globais.
    pages/
      Home.tsx               Fluxo completo do protótipo StartIn.
    components/              Componentes reutilizáveis e componentes UI.
    contexts/                Contextos globais da aplicação.
    hooks/                   Hooks reutilizáveis.
    lib/                     Integrações e utilitários do cliente.

docs-startin-flow-notes.txt Observações extraídas do fluxo visual de referência.
server/
  routers.ts                Contratos tRPC disponíveis no servidor.
  db.ts                     Helpers de acesso ao banco.
  _core/                    Infraestrutura do template WebDev.
drizzle/
  schema.ts                 Schema inicial do banco.
```

## Requisitos

- Node.js 22 ou versão compatível.
- pnpm 10 ou versão compatível.
- Variáveis de ambiente do template WebDev, caso o servidor e a autenticação sejam utilizados.

## Instalação

Na raiz do projeto, instale as dependências:

```bash
pnpm install
```

Depois, inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

A aplicação será disponibilizada pelo servidor WebDev configurado para o projeto.

## Comandos disponíveis

```bash
pnpm dev       # inicia o servidor de desenvolvimento
pnpm check     # executa a checagem TypeScript
pnpm test      # executa os testes Vitest
pnpm build     # gera o build de produção
pnpm start     # inicia o build de produção
pnpm format    # formata os arquivos do projeto
pnpm db:push   # gera e aplica migrações do banco
```

## Estado atual da integração

O frontend está preparado para receber dados reais, mas a versão atual utiliza dados mockados e estados locais para permitir a validação visual e funcional do fluxo sem depender de serviços externos.

A próxima etapa de integração deverá substituir os dados definidos em `client/src/pages/Home.tsx` por chamadas tRPC. Os principais pontos de integração serão:

1. Autenticação e sessão de usuário.
2. Persistência do perfil da startup.
3. Busca e filtragem de oportunidades.
4. Registro de interesses e matches.
5. Persistência de notificações e preferências.
6. Publicação e gerenciamento de oportunidades.
7. Integração real com o assistente IA.

O contrato inicial de oportunidades já existe no servidor para facilitar essa evolução, mas ainda não substitui os dados simulados da interface.

## Responsividade e acessibilidade

A interface foi construída com abordagem mobile-first. O menu lateral transforma-se em menu móvel em telas menores, os grids se reorganizam verticalmente e os formulários ocupam toda a largura disponível.

Os elementos interativos utilizam botões e campos semânticos, possuem estados de foco e mantêm contraste adequado entre fundo, texto e ações principais.

## Validação realizada

A versão atual foi validada com:

- `pnpm check` sem erros de TypeScript.
- `pnpm test` com os testes existentes aprovados.
- `pnpm build` concluído com sucesso.
- Revisão visual do login em desktop.
- Revisão visual do login em viewport mobile.
- Navegação local entre os principais fluxos do produto.

## Próximas evoluções recomendadas

A integração com o back-end deve começar pela autenticação e pelo perfil da startup, pois essas informações alimentam praticamente todas as outras telas. Em seguida, recomenda-se conectar oportunidades e matches usando procedimentos tRPC tipados.

Também será importante adicionar validações de formulário, tratamento de loading e erro para cada chamada, persistência dos filtros e testes de componentes para os fluxos críticos de cadastro, publicação e registro de interesse.

## Referências

[1]: https://react.dev/ "React Documentation"
[2]: https://tailwindcss.com/docs "Tailwind CSS Documentation"
[3]: https://vite.dev/guide/ "Vite Guide"
[4]: https://vitest.dev/guide/ "Vitest Guide"
[5]: https://trpc.io/docs "tRPC Documentation"
