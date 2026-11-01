# Fase 0 — Auditoria da estrutura e decisão de arquitetura

> Documento de trabalho do `netclub.app`. Nenhuma alteração de backend, migração ou
> configuração de Supabase foi executada. Nada em `netclub.site` foi tocado.

Data: 2026-11-01
Base: commit `a787239` (importação do código de `netclub.site`)

---

## 1. Método

1. Leitura do código-fonte (rotas, componentes, camada de dados, migrações, configs).
2. Verificação do estado do Git e do repositório remoto.
3. Execução real de `bun install`, `bun run test`, `bun run build` e `bun run dev`
   para confirmar o que funciona sem backend configurado.
4. Comparação item a item entre o código atual e a especificação do MVP.

---

## 2. Estado real do projeto (verificado)

### 2.1 Stack

- React 19 + TanStack Router/Query/Start (SSR via Nitro)
- Vite 8 + Tailwind CSS 4 + shadcn/ui (Radix)
- Supabase JS (cliente gerado pelo Lovable)
- Bun, Vitest, ESLint, Prettier
- Build Nitro configurado para Cloudflare (`.output/server/wrangler.json`)

### 2.2 O que já é código real (não é mock)

| Área | Situação | Evidência |
|---|---|---|
| Landing `/` | Funcional | `src/routes/index.tsx` |
| Login/cadastro `/auth` | Funcional (e-mail/senha + Google via Lovable) | `src/routes/auth.tsx` |
| Recuperação de senha `/reset-password` | Funcional | `src/routes/reset-password.tsx` |
| Proteção de rotas privadas | Funcional (`beforeLoad` + `ssr: false`) | `src/routes/_authenticated/route.tsx` |
| Home/feed `/home` | Funcional: criar post, curtir, salvar, comentar, excluir | `home.tsx`, `PostCard.tsx` |
| Rede `/network` | Funcional: listar pessoas, conectar, aceitar | `network.tsx` |
| Grupos `/clubs` | Funcional: listar e entrar/sair | `clubs.tsx` |
| Perfil `/profile`, `/members/$id` | Funcional: dados + publicações | `profile.tsx`, `members.$id.tsx` |
| Notificações | Funcional: curtida, comentário, conexão | `notifications.tsx` + triggers |
| Tema visual | Implementado (escuro, esmeralda, dourado) | `src/styles.css` |

Não há dados falsos, mocks ou telas puramente demonstrativas no código atual
(busca por `mock|demo|fake` não retornou ocorrências).

### 2.3 Tabelas e RLS já existentes

Migrações em `drizzle/migrations/`:

- `profiles`, `groups`, `group_members`, `posts`, `post_likes`, `post_saves`,
  `post_comments`, `connections`, `notifications`.
- RLS habilitada em todas, com policies de leitura/escrita por dono.
- `0001_security_integrity.sql`: par único de conexões (índice funcional),
  `WITH CHECK` em updates, restrição de colunas atualizáveis
  (`connections.status`, `notifications.read`), índices de consultas quentes.
- Triggers: criação automática de perfil, notificação de like/comentário/conexão.

### 2.4 O que NÃO existe

Stories, NetMach/match, chat, notificações em tempo real, busca global, grupos
com feed próprio, portfólio, recomendações, colaborações, Canal Oficial
(cotações/notícias), moderação/denúncias/bloqueios, painel admin, LGPD/termos,
impulsionamento, assinatura Premium, i18n, PWA/manifest, upload de arquivos
(nenhum uso de Storage), paginação no feed (hoje `limit(50)` fixo).

### 2.5 Achado crítico: o app já está acoplado ao backend do site

O código importado **não é apenas layout**. Ele consulta tabelas reais via
Supabase e carrega a referência do projeto do site em `supabase/config.toml`
(`project_id = "kmacumnnoywwazznxbct"`). Como não há `.env`, o cliente lança
`Missing Supabase environment variable(s)` no navegador e todos os fluxos
autenticados falham.

Consequência: a premissa da especificação ("somente layout visual") não se
confirma no código. Isso **reforça** a necessidade da decisão da seção 3 antes
de qualquer avanço no backend.

### 2.6 Verificações executadas

| Comando | Resultado |
|---|---|
| `bun install` | 541 pacotes instalados |
| `bun run test` | 11/11 testes passando |
| `bun run build` | build de produção OK |
| `bun run dev` + `GET /` | HTTP 200 (SSR da landing sem env) |
| Fluxos autenticados | bloqueados sem `.env` (esperado) |

### 2.7 Repositório

- `netclub.app`: repositório Git local próprio (`main`, commit inicial), **sem
  remote**. Ainda não existe repositório GitHub para ele.
- `netclub.site`: intacto, remote original preservado, 26 alterações locais
  pré-existentes não foram tocadas.

---

## 3. Decisão pendente — Supabase compartilhado ou exclusivo

### Opção A — Compartilhar o Supabase do site

**Vantagens**
- Uma única base de usuários: quem se cadastra no site já entra no app.
- Menos custo operacional e uma só equipe de manutenção de schema.
- Dados institucionais (leads, newsletter) podem se relacionar com perfis.
- Menos projetos para monitorar, migrar e auditar.

**Desvantagens**
- Acoplamento: mudanças no app podem quebrar o site e vice-versa.
- RLS e permissões passam a servir dois produtos com regras diferentes.
- Autenticação compartilhada exige configurar domínios, redirect URLs e cookies
  para `netclub.site` e `netclub.app` ao mesmo tempo.
- Um incidente de segurança afeta os dois produtos.
- O site passaria a carregar tabelas e dados que não usa (superfície de ataque).
- Fica mais difícil separar ambientes (dev/staging/prod) por produto.

**Pré-requisitos se escolhida**
- Definir dono do schema e processo de migração único.
- Revisar todas as policies considerando dois frontends.
- Configurar Site URL + Redirect URLs para os dois domínios.
- Separar buckets de Storage por produto.

### Opção B — Supabase exclusivo para o aplicativo (recomendada)

**Vantagens**
- Isolamento total: falha ou mudança em um produto não afeta o outro.
- RLS, Storage, cron e chaves próprios, desenhados só para o app.
- Ambientes independentes e auditoria mais simples.
- Liberdade para adotar o schema definitivo do MVP (`clubs`, `stories`, etc.)
  sem herdar decisões antigas.
- Permite no futuro um SSO entre site e app, se necessário, sem acoplar bancos.

**Desvantagens**
- Duas bases de usuários: será preciso decidir se haverá login único no futuro.
- Custo e operação duplicados (ainda que baixos no início).
- Necessidade de estratégia de migração/ponte caso o site também passe a
  autenticar usuários.

**Pré-requisitos se escolhida**
- Criar projeto Supabase novo (nome, região, plano).
- Configurar `Site URL` e `Redirect URLs` para os domínios do app.
- Aplicar as migrações do app nesse projeto (schema próprio).
- Criar buckets de Storage (avatares, capas, stories) com policies.
- Configurar cron/Edge Function para expiração de stories.
- Guardar `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor.

### Comparação direta

| Critério | A — Compartilhar | B — Exclusivo |
|---|---|---|
| Isolamento de falhas | Baixo | Alto |
| Complexidade de RLS | Alta (2 produtos) | Média |
| Custo operacional | Menor | Um pouco maior |
| Velocidade para começar | Maior | Média |
| Segurança/auditoria | Mais difícil | Mais simples |
| Evolução do schema do app | Limitada | Livre |
| Login único site+app | Nativo | Requer SSO futuro |

### Recomendação

**Opção B — Supabase exclusivo do `netclub.app`.**

Motivos: o app tem um modelo de dados muito maior que o do site (stories, chat,
matches, moderação, assinaturas); misturar isso no banco institucional aumenta
risco de segurança e engessa a evolução. O custo de manter dois projetos é
baixo e o isolamento é o que a própria especificação exige (projetos
independentes).

Se o login único for um requisito comercial forte, o caminho correto é um
provedor de identidade compartilhado no futuro — não um banco compartilhado
agora.

**Nada será criado ou alterado no Supabase sem autorização explícita.**

---

## 4. Arquitetura proposta (para após a autorização)

### 4.1 Camadas

```
src/
  routes/                 # rotas TanStack (finas, só composição)
  features/               # domínio por funcionalidade
    feed/                 # componentes, hooks, queries, mutations
    stories/
    netmach/
    clubs/
    profile/
    chat/
    official/
    moderation/
    premium/
  server/                 # server functions (validação + acesso privilegiado)
    *.functions.ts
  integrations/supabase/  # clientes gerados (browser e admin)
  i18n/                   # traduções e provider
  components/ui/          # shadcn (preservar)
  components/netclub/     # componentes de marca (preservar)
  lib/                    # utilitários puros
```

Regras:
- Componentes não chamam `supabase.from()` diretamente; usam hooks/queries da feature.
- Toda escrita valida entrada com Zod (cliente e servidor).
- Operações sensíveis (moderação, cotações, expiração, promoções) só em
  `server/*.functions.ts` com `supabaseAdmin`, nunca no bundle do browser.
- `service_role` jamais no cliente.

### 4.2 Mapa de entidades (especificação → schema)

A especificação usa `clubs`; o código atual usa `groups`. Proposta: adotar os
nomes da especificação no schema novo (`clubs`, `club_members`) e manter
compatibilidade visual, já que o banco será criado do zero na Opção B.

| Especificação | Observação |
|---|---|
| `profiles` | ampliar: username único, área, experiência, objetivos, links |
| `posts`, `post_likes`, `comments` | renomear `post_comments` → `comments` |
| `stories` | nova, com `expires_at` e Storage |
| `clubs`, `club_members` | evolução de `groups`/`group_members` |
| `match_interests`, `connections` | NetMach + conexões |
| `conversations`, `conversation_members`, `messages` | chat |
| `notifications` | ampliar `kind` e referências |
| `reports`, `blocks`, `moderation_actions` | moderação |
| `recommendations`, `collaborations` | perfil profissional |
| `official_news`, `market_quotes_cache` | Canal Oficial |
| `user_settings`, `terms_acceptances` | LGPD |
| `saved_searches`, `subscriptions`, `subscription_events` | Premium |
| `promotions`, `promotion_events` | impulsionamento |

### 4.3 Segurança desde o início

- RLS em todas as tabelas, com testes de policy.
- Mensagens: leitura restrita a membros da conversa.
- Bloqueios aplicados em feed, NetMach, chat e busca.
- Uploads: tipo/tamanho validados, bucket privado + URL assinada.
- Admin: papel verificado no banco, não no frontend.
- Rate limiting em publicações, comentários, denúncias e mensagens.
- Auditoria de ações administrativas em `moderation_actions`.

---

## 5. Internacionalização (i18n)

### Decisão técnica proposta

- `i18next` + `react-i18next` + detecção de idioma do navegador.
- Namespaces por domínio (`common`, `auth`, `feed`, `netmach`, `clubs`,
  `profile`, `chat`, `official`, `settings`, `legal`).
- `pt-BR` como padrão; `en` e `es` preparados.
- Formatação com `Intl` (datas, números, moedas, relativos) — nada de formato fixo.
- Preferência salva em `user_settings` (quando houver backend) e em
  `localStorage` como fallback imediato.
- Conteúdo de usuário **não** é traduzido.
- Estrutura pronta para `dir="rtl"` no futuro (evitar margens físicas fixas).

### Arquivos previstos

```
src/i18n/
  index.ts
  locales/pt-BR/{common,auth,feed,...}.json
  locales/en/...
  locales/es/...
```

### Site institucional

O `netclub.site` deverá receber i18n no repositório próprio. Orientação técnica
a registrar lá futuramente: mesma biblioteca, mesmos namespaces públicos,
`hreflang` por idioma e rotas prefixadas (`/en`, `/es`). **Nada será alterado no
site neste trabalho.**

---

## 6. PWA e mobile

- Adicionar `manifest.webmanifest`, ícones e service worker na fase de preparação
  para lançamento (não agora).
- Manter o layout sem dependência de APIs exclusivas de desktop.
- Evitar `position: fixed` problemático em WebView.
- Estrutura de rotas compatível com Capacitor (sem depender de servidor Node
  exclusivo; build Nitro já gera artefato estático/servidor separável).

---

## 7. Riscos identificados

| Risco | Nível | Mitigação |
|---|---|---|
| App já aponta para o projeto Supabase do site | Alto | Decidir Opção A/B antes de rodar qualquer fluxo |
| Sem `.env`, fluxos autenticados quebram | Alto | Criar `.env` local após escolha do projeto |
| Schema atual não cobre o MVP | Médio | Migrações novas e versionadas |
| Strings fixas em PT-BR | Médio | i18n antes de crescer a UI |
| Feed sem paginação | Médio | Cursor pagination na Fase 2 |
| Dependência do Lovable para OAuth Google | Médio | Reavaliar provedor de auth na Fase 1 |
| Sem repositório GitHub do app | Médio | Criar repo próprio e configurar remote |
| Sem Storage configurado | Médio | Buckets + policies na Fase 1/2 |

---

## 8. O que precisa de autorização

1. **Escolha da Opção A ou B** para o Supabase (recomendação: B).
2. Se B: criar o projeto Supabase, definir região/plano e aplicar as migrações.
3. Criar o repositório GitHub do `netclub.app` e configurar o remote
   (necessário token/credencial — não há autenticação GitHub nesta máquina).
4. Autorizar a inclusão das dependências de i18n e a extração gradual das strings.

Enquanto 1–3 não forem autorizados, o trabalho segue apenas em frontend,
estrutura de pastas, i18n e documentação — sem simular backend funcionando.
