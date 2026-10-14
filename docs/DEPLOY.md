# Plano de deploy — Revista NEW (Módulo 6)

Padrão: o mesmo do Flow e do WIN Trader (VPS Hostinger `72.62.107.199`, Ubuntu 24.04, PM2 + nginx + Let's Encrypt).

## 0. Decisões

Decididas em 14/10/2026: Cofre na mesma VPS com o cofre pessoal trancado; admin `new.company.sys@gmail.com`.

| # | Decisão | Recomendação |
|---|---|---|
| 1 | **Cofre em produção.** O login da Revista depende dele e ele só roda no computador do Rafael. | Subir o Cofre na mesma VPS em `cofre.newflowsys.cloud` e **trancar no nginx** as rotas do cofre pessoal (`/cofre`, `/api/sistemas`, `/api/auth`) por IP ou senha básica. Ficam públicas só `/cadastro`, `/api/clientes` e `/api/integracao/resgatar`. |
| 2 | **E-mail do administrador** (`ADMIN_EMAILS`). | **Decidido:** `new.company.sys@gmail.com`. |
| 3 | **Domínio.** | `revista.newflowsys.cloud` (registro A → 72.62.107.199 no DNS da Hostinger). |

## 1. Antes de tocar no servidor
- [ ] Registros DNS `revista` e `cofre` → `72.62.107.199`.
- [ ] Conferir portas livres na VPS (`ss -ltnp`). Ocupadas (conferido na VPS em 14/10): 3001, 3005, 3010, 3015, 3020, 3021, 3030, 3040, 5020, 5099, 5432, 5678, 8000, 8001, 8010. Escolhidas: Revista **3050**, Cofre **3051**.
- [ ] Gerar segredos novos (nunca reaproveitar os de dev):
  - `APP_SECRET_REVISTA` (igual nos dois lados: Cofre e Revista)
  - senha do Postgres da Revista e do Cofre
  - `ENCRYPTION_KEY` do Cofre: **a mesma de hoje**, senão as senhas guardadas ficam ilegíveis (migrar o banco do cofre pessoal ou começar vazio, a decidir).
- [x] Imagens de `public/` otimizadas (1,4–1,9 MB → 0,4–0,7 MB, mesmas dimensões e nomes).

## 2. Servidor — Revista
1. Banco: `CREATE DATABASE revista; CREATE USER revista ...` (Postgres local).
2. Código em `/opt/revista` (git clone do repositório; se privado, deploy key somente leitura).
3. `.env.production`:
   ```
   DATABASE_URL=postgres://revista:<senha>@localhost:5432/revista
   APP_ORIGIN=https://revista.newflowsys.cloud
   COFRE_URL=https://cofre.newflowsys.cloud
   APP_SECRET_REVISTA=<segredo>
   ADMIN_EMAILS=new.company.sys@gmail.com
   FEATURE_MONEY=0
   # DEV_FAKE_USER NÃO definir
   ```
4. `npm ci && npm run db:migrate && npm run build`.
5. PM2: app `revista` em `127.0.0.1:3050` (`next start -p 3050`), `pm2 save`.
6. nginx: `revista.newflowsys.cloud` → `127.0.0.1:3050`, com
   `proxy_set_header X-Forwarded-For $remote_addr;` (o limitador de abuso confia nesse cabeçalho),
   `client_max_body_size 1m;` e cabeçalhos de segurança (HSTS, `X-Content-Type-Options`, `Referrer-Policy`).
7. `certbot --nginx -d revista.newflowsys.cloud` (renovação automática).

## 3. Servidor — Cofre
1. Banco `cofre` + usuário próprio.
2. Código em `/opt/cofre` (hoje **não é repositório git**: criar um, privado, antes de subir).
3. `.env` de produção com `APP_SECRET_REVISTA`, `ENCRYPTION_KEY`, senha mestra e `DATABASE_URL`.
4. `npx prisma migrate deploy` (aplica `20261013000000_app_revista` e as anteriores) e `npm run build`.
5. PM2 `cofre` em `127.0.0.1:3051`; nginx + certbot em `cofre.newflowsys.cloud`, com as rotas do cofre pessoal restritas (ver decisão 1).

## 4. Segurança antes de abrir
- [ ] `DEV_FAKE_USER` ausente e `NODE_ENV=production` (cookie `Secure`, `HttpOnly`, `SameSite=Lax`).
- [ ] `FEATURE_MONEY=0`: marketplace, apoio e rodadas retornam 403/404.
- [ ] `/admin` retorna 404 para quem não é equipe (testar logado como membro comum).
- [ ] Firewall: só 22, 80, 443 abertas ao público; Postgres só em `localhost`.
- [ ] SSH só por chave (já configurado na VPS).

## 5. Backup e operação
- `pg_dump` diário (cron, 03:00) de `revista` e `cofre` para `/opt/backups`, retenção de 14 dias, mais cópia fora da VPS quando houver destino.
- Teste de restauração em banco temporário antes de considerar o backup válido.
- Logs: `pm2 logs revista`; reinício automático do PM2 no boot (`pm2-root` já habilitado).

## 6. Teste de fumaça (em produção, após o certbot)
1. `/` e `/revista` abrem; imagens carregam leves.
2. Cadastro no Cofre → código → ativar conta na Revista → entrar.
3. Escrever e publicar um pensamento; abrir o link em janela anônima (conta como leitura); responder de outra conta.
4. Enviar um artigo, revisar e publicar pelo `/admin`.
5. Endereço inexistente mostra a página "indisponível", não 404 seco.
6. `/admin` como membro comum → 404.

## 7. Redeploy e rollback
- Redeploy: `git pull && npm ci && npm run db:migrate && npm run build && pm2 restart revista`.
- Rollback: `git checkout <commit anterior>` + build + restart. Migrações são só aditivas até aqui; restaurar o dump se alguma falhar.

## 8. Pendências conhecidas após o lançamento
Recuperação de senha, e-mails automáticos, denúncia de respostas, imagens nos artigos, textos legais (termos/privacidade), pagamentos (só após revisão jurídica).
