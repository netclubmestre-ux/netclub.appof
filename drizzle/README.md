# Banco de dados — NetClub

## Fonte da verdade

O schema real é definido pelos arquivos SQL em `drizzle/migrations/*.sql` **e pelo
banco de produção**. As policies de RLS, triggers e funções existem apenas no SQL —
o Drizzle não modela RLS.

## ⚠️ Não rode `drizzle-kit push`

`drizzle/schema.ts` está intencionalmente vazio (é gerado pelo Lovable e marcado com
"do not edit"). O snapshot (`meta/0000_snapshot.json`) também está vazio, porque a
migration inicial foi escrita à mão.

Consequência: `drizzle-kit push` compara `schema.ts` (vazio) com o banco e
**propõe dropar todas as tabelas**. Nunca execute `push` neste projeto.

| Comando                                  | Seguro? | Por quê                                      |
| ---------------------------------------- | ------- | -------------------------------------------- |
| `drizzle-kit migrate`                    | ✅      | Só aplica os arquivos do journal, em ordem   |
| `drizzle-kit generate --custom --name=x` | ✅      | Cria migration vazia para SQL manual         |
| `drizzle-kit generate`                   | ❌      | Diffa contra um snapshot vazio e recria tudo |
| `drizzle-kit push`                       | ❌      | Propõe dropar todas as tabelas               |

## Como adicionar uma alteração de schema

1. Gere uma migration vazia:
   ```sh
   bunx drizzle-kit generate --custom --name=minha_alteracao
   ```
2. Escreva o SQL em `drizzle/migrations/000N_minha_alteracao.sql`.
3. Torne o SQL **idempotente** (`if not exists`, `drop policy if exists`,
   `on conflict do nothing`) — ele pode ser reaplicado em ambientes diferentes.
4. Deixe o Lovable Cloud aplicar no deploy.

## Migrations existentes

| Arquivo                       | Conteúdo                                                                |
| ----------------------------- | ----------------------------------------------------------------------- |
| `0000_migration.sql`          | Schema inicial: 9 tabelas, RLS, triggers de notificação, seed de grupos |
| `0001_security_integrity.sql` | RLS de `connections`, unicidade de conexões, grants por coluna          |
