# Loja de Cosméticos Fortnite — Processo Seletivo

Eu fiz este projeto com foco em simplicidade e clareza. O catálogo funciona sem login, os filtros ajudam de verdade, e as regras de compra/devolução são objetivas. No backend, preferi decisões pragmáticas e uma sincronização estável com a API do Fortnite para marcar itens “NOVO” e “À VENDA”.

## O que tem aqui
- Catálogo sem login, com paginação e ordenação por nome.
- Filtros: nome, tipo, raridade, datas, “NOVO”, “À VENDA” e “EM PROMOÇÃO”.
- Cartões com estados: “NOVO”, “À VENDA”, “ADQUIRIDO” e preço promocional quando houver.
- Detalhes do cosmético com imagem e estados sincronizados.
- Autenticação: registro com 10.000 V-Bucks e login via JWT.
- Compra que respeita promoção e bloqueia recompra ativa.
- Devolução com reembolso integral e atualização de saldo/posse.
- Histórico do usuário e saldo no perfil.
- Lista pública de usuários e perfis públicos.
- Sincronização periódica de “NOVO” e “À VENDA” com fallback.

## Tecnologias que usei
- Frontend: React + Vite + TypeScript + React Router.
- Backend: Node.js + Express + TypeScript.
- Banco de dados: SQLite (via `better-sqlite3`).
- Docker: Dockerfile para frontend e backend + `docker-compose.yml`.

## Estrutura do repositório
- `frontend/` — SPA em React (pages, componentes, estilos).
- `backend/` — API REST em Express (rotas, sync, regras de negócio).
- `docker-compose.yml` — orquestra frontend e backend.

## Como rodar (Docker)
Pré-requisito: Docker Desktop.

- Na raiz: `docker compose up --build`
- Acessos:
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:8080/api`

Variáveis (Docker):
- Backend:
  - `JWT_SECRET` (default: `supersecret`)
  - `DB_PATH` (default: `/app/data/app.db`)
  - `EXTERNAL_API_BASE_URL` (default: `https://fortnite-api.com`)
- Frontend:
  - `VITE_API_BASE_URL` (default: `http://localhost:8080/api`)

## Como rodar localmente
Pré-requisito: Node.js/npm.

- Backend: `cd backend && npm install && npm run dev`
- Frontend: `cd frontend && npm install && npm run dev`

## Endpoints (resumo)
- `POST /api/auth/register` — cria usuário e concede 10.000 créditos.
- `POST /api/auth/login` — autentica e retorna JWT.
- `GET /api/cosmetics` — paginação e filtros (nome, tipo, raridade, datas, “NOVO”, “À VENDA”, “EM PROMOÇÃO”).
- `GET /api/cosmetics/:id` — detalhes.
- `POST /api/purchases` — compra cosmético (auth).
- `POST /api/returns` — devolve cosmético (auth).
- `GET /api/me/purchases` — compras do usuário (auth).
- `GET /api/me/transactions` — histórico de transações (auth).
- `POST /api/me/change-password` — alteração de senha (auth).
- `GET /api/users` — perfis públicos paginados.
- `GET /api/users/:id` — cosméticos ativos de um usuário.

## Autor
Feito por Gustavo Menezes — meu GitHub: https://github.com/https-gustavo
