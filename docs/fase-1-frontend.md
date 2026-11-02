# Fase 1 — Frontend do MVP

Este documento registra o que foi construído na fase 1, o que funciona sem backend e
o que permanece bloqueado até a configuração do Supabase próprio do `netclub.app`.

## Princípio adotado

Nenhuma tela fala com o Supabase diretamente. Todas consomem a interface
`NetclubRepository` (`src/data/repository.ts`), com duas implementações:

- `DevRepository` (`src/data/dev-repository.ts`): banco em memória, usado por padrão.
- `SupabaseRepository` (`src/data/supabase-repository.ts`): esqueleto que lança
  `SupabaseNotConfiguredError` até o projeto ser autorizado e configurado.

A seleção é feita por `VITE_DATA_SOURCE` (`demo` por padrão, `supabase` para o futuro).
Enquanto a fonte for demo, o app exibe um aviso fixo de modo demonstração e nenhum dado
é gravado em servidor. Recarregar a página restaura o estado inicial.

## Pronto para uso (frontend)

### Identidade e estrutura

- Tema graphite/emerald/gold preservado, tipografia Manrope/Sora, cards arredondados.
- `AppShell` autenticado com navegação desktop, tablet e mobile, busca global e seletor de idioma.
- Layout responsivo em todas as telas implementadas.
- `public/manifest.webmanifest` preparado para PWA (sem service worker ainda).

### Telas

- **Landing** (`/`) com apresentação, destaques e chamadas para cadastro/login.
- **Auth** (`/auth`): entrar, criar conta e recuperação de senha em modo demonstração,
  com aviso explícito de que não há autenticação real.
- **Onboarding profissional** (`/onboarding`): 4 etapas com nome, username, headline,
  área, localização, bio, foto, experiência, competências, interesses, objetivos,
  "procura" e "oferece". Cadastro demo cai direto no onboarding.
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
  exclusão de conta (solicitação local), documentos legais e moderação de denúncias
  para administradores.
- **Legal** (`/legal/$doc`): termos, privacidade e diretrizes em pt-BR/en/es.

### Comportamentos

- i18n próprio com pt-BR como fonte, en/es tipados e formatação via `Intl`.
- Idioma persistido em `localStorage`, com detecção do idioma do navegador na primeira visita.
- Botões desabilitados têm explicação visível (limite diário, Premium, pagamento,
  administrador de grupo, mensagem sem conexão etc.).
- Denúncias registradas localmente e listadas na moderação admin.
- Erros de domínio traduzidos (`PREMIUM_REQUIRED`, `DAILY_LIMIT`, `BLOCKED`,
  `FORBIDDEN`, `PAYMENTS_UNAVAILABLE`, `username_taken`, `not_found`, entre outros).

### Qualidade

- `bunx tsc --noEmit` sem erros.
- `bun run test`: 36 testes (rotas, paridade de chaves i18n, repositório demo).
- `bun run lint`: 0 erros (10 avisos pré-existentes).
- `bun run build`: conclui com sucesso.

## Depende do backend

| Área | Situação atual | Necessário |
| --- | --- | --- |
| Autenticação | Sessão demo fixa / cadastro local | Supabase Auth, recuperação por e-mail, verificação |
| Persistência | Memória, reset ao recarregar | Tabelas, RLS e políticas por perfil |
| Uploads | `URL.createObjectURL` local | Storage (avatar, portfólio, imagem de story) |
| Pagamentos | Sempre `PAYMENTS_UNAVAILABLE` | Provedor (Stripe/Mercado Pago) + webhooks |
| Premium | Estado demo | Assinatura real, recibos e cancelamento |
| Canal Oficial | Indisponível por design | Provedores de cotações e notícias com contrato |
| Push/e-mail | Não implementado | Serviço de notificações e templates |
| Moderação | Denúncias locais | Fila real, histórico e auditoria |
| Exclusão de conta | Solicitação local | Rotina LGPD no backend |
| Busca | Filtro em memória | Índice/consulta no banco |

## Como rodar

```bash
bun install
bun run dev
```

Build de produção:

```bash
bun run build
```

## Como ligar o Supabase (quando autorizado)

1. Criar o projeto Supabase exclusivo do `netclub.app`.
2. Aplicar as migrações do schema (a definir na fase 2).
3. Configurar `.env` com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e
   `VITE_DATA_SOURCE=supabase`.
4. Implementar `SupabaseRepository` respeitando a interface existente.
5. Trocar o aviso de demonstração por estado real de conexão.

Nada disso foi executado: o projeto Supabase ainda não foi criado nem autorizado.
