# WorkforceHub

Aplicația rulează acum pe:

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- DB: PostgreSQL
- ORM: Prisma
- Session store: Redis
- Orchestrare locală: Docker Compose

## Rulare rapidă (Docker)

1. Configurează `backend/.env.example` (minim `SESSION_SECRET`).
2. Rulează:

```bash
docker compose up --build
```

3. Acces:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
- Healthcheck API: `http://localhost:4000/health`

## Curățare Docker (doar proiectul acesta)

Important: evită comenzile globale `docker container prune` sau `docker system prune` dacă ai alte proiecte active.

- Curățare sigură doar pentru WorkforceHub:

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\safe-docker-clean.ps1
```

- Curățare + reset DB/cache:

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\safe-docker-clean.ps1 -ResetData
```

- Curățare + ștergere imagini proiect:

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\safe-docker-clean.ps1 -RemoveProjectImages
```

## Structură relevantă

- `backend/` – API Express, Prisma schema, sesiuni Redis
- `docker-compose.yml` – servicii `frontend`, `api`, `db`, `redis`
- `src/lib/apiClient.js` – client HTTP frontend -> API

## Documentație proiect

Documentele funcționale și non-tehnice rămân în `docs/`:

1. `01-arhitectura-aplicatiei.md`
2. `02-flow-aplicatie.md`
3. `03-prezentare-proiect.md`
4. `04-document-non-tehnic.md`
