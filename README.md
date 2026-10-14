# Revista NEW

Next.js 16 + Postgres + Drizzle. Auth de produção: Cofre (Módulo 2).

## Desenvolvimento
```
npm install
cp .env.example .env.local
npm run db:dev        # Postgres local (porta 5437), em outro terminal
npm run db:migrate
npm run dev           # http://localhost:3020
npm test
```
Com `DEV_FAKE_USER=1`, `/entrar` cria um usuário falso (somente fora de produção).
Alternativa ao `db:dev`: `docker compose up -d`.

Arquitetura e limites: `docs/ARCHITECTURE.md`.
