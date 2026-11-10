# NetClub

Rede social de networking para profissionais do mercado digital.
Construído com React + TanStack Start, Tailwind CSS e Supabase.

**Live app**: https://netclub.lovable.app

## Stack

- **React 19** + **TanStack Router / Query / Start** (SSR via Nitro)
- **Vite 8** + **Tailwind CSS 4** + shadcn/ui (Radix)
- **Supabase** — autenticação, Postgres e RLS
- **Bun** (gerenciador de pacotes), **Vitest**, **ESLint** e **Prettier**

## Desenvolvimento

Requisitos: Node.js 20+ e [Bun](https://bun.sh).

```sh
bun install
cp .env.example .env   # preencha com as chaves do Supabase
bun run dev
```

Outros scripts:

```sh
bun run build     # build de produção
bun run preview   # serve o build
bun run lint      # ESLint
bun run format    # Prettier
bun run test      # Vitest
```

### Variáveis de ambiente

As chaves `VITE_SUPABASE_*` são públicas por design (vão para o bundle do browser).
A `SUPABASE_SERVICE_ROLE_KEY` **nunca** deve ir para o repositório — ela é injetada
pelo Lovable Cloud apenas em runtime no servidor.

### Banco de dados

O schema, as policies de RLS e a publication do Realtime vivem em
`supabase/migrations/`. Aplique os arquivos na ordem e veja
[`docs/supabase-setup.md`](docs/supabase-setup.md) para o passo a passo,
incluindo o SQL necessário para habilitar o Realtime.

O diretório `drizzle/` é legado: consulte
[`drizzle/README.md`](drizzle/README.md) apenas se for mexer nele.

## Lovable

Continue o desenvolvimento no [editor do Lovable](https://lovable.dev/projects/a2f7f218-34b2-44f9-beb3-f042d349bbc9).

- Commits enviados para `main` sincronizam de volta com o editor.
- **Não reescreva o histórico publicado** (force push, rebase, amend ou squash de
  commits já enviados) — isso quebra o histórico do projeto no Lovable.
