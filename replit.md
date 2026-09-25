# NokariSetu Job Portal

NokariSetu helps job seekers find roles, recruiters manage hiring, and admins keep the marketplace trusted.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, HTML, CSS, JavaScript/TSX
- Preview API: Express 5
- Production backend starter: Java 17 + Spring Boot under `artifacts/nokarisetu/backend-java`
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/nokarisetu/src/App.tsx` — role-aware portal UI and client-side demo fallback
- `artifacts/nokarisetu/src/index.css` — NokariSetu visual theme
- `artifacts/nokarisetu/backend-java/` — Java/Spring Boot API starter, SQL schema, and environment template
- `lib/api-spec/openapi.yaml` — source of truth for the portal API contract
- `artifacts/api-server/src/routes/nokarisetu.ts` — preview API implementation

## Architecture decisions

- The first build keeps demo data available when the API is unavailable so the preview remains interactive.
- The Java backend keeps persistence and SMTP configuration as explicit follow-up integration points; credentials must come from environment secrets.
- GitHub pushes should be paced because the Replit GitHub connector proxy limits bursts to roughly 10 requests per second.

## Product

- Role switcher for seeker, recruiter, and admin views
- Job search and filtering, recruiter job posting, and seeker apply flow
- Application tracking with pending, accepted, and rejected controls
- Admin user moderation with accept/remove actions
- Language and notification preference controls
- API-backed data with an interactive demo fallback

## User preferences

- User requested HTML/CSS/JavaScript/React frontend, Java backend, SQL, API-key support, and GitHub publishing.

## Gotchas

- Keep real API keys, SMTP credentials, and database passwords out of source control; use Replit Secrets or an environment manager.
- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
