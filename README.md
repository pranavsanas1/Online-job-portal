# NokariSetu

NokariSetu is an online job portal for job seekers, recruiters, and platform administrators.

## Included

- React JavaScript frontend with HTML and CSS-based UI
- Seeker, recruiter, and admin workspaces
- Job search and recruiter job posting
- Application tracking with pending, accepted, and rejected states
- Admin user acceptance and removal controls
- Language preference and automatic notification preference controls
- Typed API contract and preview API server
- Java 17 + Spring Boot backend starter under `artifacts/nokarisetu/backend-java`
- PostgreSQL schema under `artifacts/nokarisetu/backend-java/src/main/resources/schema.sql`
- Safe `.env.example` template for SMTP and third-party API keys

## Run the web app

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/nokarisetu run dev
```

## Run the Java API

```bash
cd artifacts/nokarisetu/backend-java
mvn spring-boot:run
```

Keep real API keys, database passwords, and SMTP credentials in Replit Secrets or an environment manager. Never commit them to source control.