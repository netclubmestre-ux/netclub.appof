# Fase 1 — Frontend do MVP

Este documento registra o que foi construído na fase 1, o que já funciona com o
backend próprio do `netclub.app` e o que continua bloqueado por dependências
externas.

## Princípio adotado

Nenhuma tela fala com o Supabase diretamente. Todas consomem a interface
`NetclubRepository` (`src/data/repository.ts`), com duas implementações:

- `DevRepository` (`src/data/dev-repository.ts`): banco em memória, com dados
  fictícios, sem rede.
- `SupabaseRepository` (`src/data/supabase-repository.ts`): backend real do
  projeto `netclub.app`.

A seleção é feita por `VITE_DATA_SOURCE` (`demo` ou `supabase`). No modo demo o
app exibe um aviso fixo e nada é gravado em servidor. No modo `supabase`, os
dados são gravados no projeto próprio e protegidos por RLS.

## Backend próprio (concluído)

- Projeto Supabase exclusivo do `netclub.app` provisionado.
- Migrações aplicadas: schema inicial, correção de ordem das políticas de
  bloqueio e endurecimento de funções/grants.
- `SupabaseRepository` implementado sobre a chave publishable (a service role
  nunca entra no bundle).
- Supabase Auth: cadastro, login, logout, recuperação e atualização de senha.
  Confirmação de e-mail desativada para o MVP; Site URL e URLs de recuperação
  configuradas para desenvolvimento local.
- Uploads de avatar e imagem de story no Storage.
- RLS e grants revisados; funções privilegiadas em `security definer`.

## Pronto para uso (frontend)

### Identidade e estrutura

- Tema graphite/emerald/gold preservado, tipografia Manrope/Sora, cards arredondados.
- `AppShell` autenticado com navegação desktop, tablet e mobile, busca global e seletor de idioma.
- Layout responsivo em todas as telas implementadas.
- `public/manifest.webmanifest` preparado para PWA (sem service worker ainda).

### Telas

- **Landing** (`/`) com apresentação, destaques e chamadas para cadastro/login.
- **Auth** (`/auth`): entrar, criar conta e recuperação de senha.
- **Onboarding profissional** (`/onboarding`): 4 etapas com nome, username, headline,
  área, localização, bio, foto, experiência, competências, interesses, objetivos,
  "procura" e "oferece". Cadastro cai direto no onboarding.
- **Home** (`/home`): feed de texto, criação de post, curtidas, comentários, stories
  (criar, visualizar, excluir) e sugestões.
- **Rede** (`/network`): conexões, solicitações, sugestões e bloqueios.
- **NetMach** (`/netmach`): perfis compatíveis, passar, tenho interesse, match e início
  de conversa; limite diário do plano free e trava de filtros avançados no Premium.
- **Grupos** (`/clubs`, `/clubs/$slug`): listagem, entrada/saída, posts do grupo e
  bloqueio de saída para administradores com explicação.
- **Chat** (`/chat`, `/chat/$id`): lista de conversas e conversa com envio de mensagens.
- **Notificações** (`/notifications`): leitura e marcação como lidas.
- **Perfil** (`/profile`, `/members/$id`): perfil profissional com portfólio,
  competências, recomendações, colaborações, edição, denúncia, bloqueio e mensagem.
- **Canal Oficial** (`/official`): ações, câmbio (USD/BRL, EUR/BRL), cripto e notícias.
  Sem provedor configurado, cada seção mostra indisponibilidade — nada é inventado.
- **Premium** (`/premium`): comparação de planos e intenção de assinatura; pagamento
  fica pendente com explicação, sem cobrança.
- **Promover** (`/promote`): formulário de campanha para post/story e histórico;
  criação bloqueada com `PAYMENTS_UNAVAILABLE`.
- **Busca** (`/search`): pessoas, grupos, posts e assuntos; salvar busca exige Premium.
- **Configurações** (`/settings`): idioma, privacidade, notificações, bloqueados,
  exclusão de conta, documentos legais e moderação de denúncias para administradores.
- **Legal** (`/legal/$doc`): termos, privacidade e diretrizes em pt-BR/en/es.

### Comportamentos

- i18n próprio com pt-BR como fonte, en/es tipados e formatação via `Intl`.
- Idioma persistido em `localStorage`, com detecção do idioma do navegador na primeira visita.
- Botões desabilitados têm explicação visível ou `title` (limite diário, Premium,
  pagamento, administrador de grupo, mensagem sem conexão, marcar todas como lidas etc.).
- Denúncias gravadas no backend e listadas na moderação admin.
- Erros de domínio traduzidos (`PREMIUM_REQUIRED`, `DAILY_LIMIT`, `BLOCKED`,
  `FORBIDDEN`, `PAYMENTS_UNAVAILABLE`, `username_taken`, `not_found`, entre outros).

### Mobile

- Viewport de referência: 390×844 (DPR 2), verificado em Chrome headless via CDP.
- Header compacto com busca curta (`Busca`), sem overflow horizontal.
- Bottom nav respeita `env(safe-area-inset-bottom)`; o conteúdo usa padding
  equivalente para não ficar sob a barra.
- Abas de Rede, Perfil e Canal Oficial usam grade 2×2 no mobile (sem truncamento).
- Chips de categoria de Grupos e de Notícias quebram linha em vez de cortar.
- Diálogos ocupam a largura da tela com margem, rolam internamente e cabem em
  telas baixas (story, edição de perfil, denúncia).
- Toasts escuros ficam acima da bottom nav.
- Formulários de comentário e composer de post validados sem overflow.
- Estados vazios compactos no feed para o conteúdo aparecer antes da dobra.

## Qualidade

- `bunx tsc --noEmit` sem erros.
- `bun run test`: 36 testes (rotas, paridade de chaves i18n, repositório demo).
- `bun run lint`: 0 erros (10 avisos pré-existentes).
- `bun run build`: conclui com sucesso.
- Sem erros de console nas telas autenticadas verificadas no mobile.

## Depende de serviços externos

| Área              | Situação atual                           | Necessário                                              |
| ----------------- | ---------------------------------------- | ------------------------------------------------------- |
| Pagamentos        | Sempre `PAYMENTS_UNAVAILABLE`            | Provedor (Stripe/Mercado Pago) + webhooks               |
| Premium           | Intenção registrada, sem cobrança        | Assinatura real, recibos e cancelamento                 |
| Canal Oficial     | Indisponível por design                  | Provedores de cotações e notícias com contrato          |
| Push/e-mail       | Não implementado                         | Serviço de notificações, templates e domínio verificado |
| Moderação         | Denúncias gravadas                       | Fila operacional, histórico e auditoria                 |
| Exclusão de conta | Solicitação registrada                   | Rotina LGPD/anonimização no backend                     |
| Busca             | Filtro no cliente sobre dados carregados | Índice/consulta dedicada no banco                       |
| Deploy            | Build gera saída Nitro/Cloudflare        | Domínio de produção e URLs de Auth                      |

## Como rodar

```bash
bun install
bun run dev
```

Build de produção:

```bash
bun run build
```

## Como ligar o Supabase

1. Criar o projeto Supabase exclusivo do `netclub.app`.
2. Aplicar as migrações em `supabase/migrations`.
3. Configurar `.env` com `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_DATA_SOURCE=supabase`.
4. Em Auth, definir Site URL e URLs de redirecionamento do ambiente.
5. Nunca colocar a service role/secret key no `.env` do frontend.

O projeto atual já está provisionado e configurado para desenvolvimento local.
Para produção, falta apenas apontar as URLs de Auth e o deploy para o domínio
definitivo.
