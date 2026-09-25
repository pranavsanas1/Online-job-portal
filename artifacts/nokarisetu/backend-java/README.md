# NokariSetu Java backend

This Spring Boot service mirrors the portal API used by the frontend:

- `GET /api/dashboard?role=seeker|recruiter|admin`
- `GET/POST /api/jobs`
- `GET /api/applications`
- `PATCH /api/applications/{id}/status`
- `GET /api/users`
- `PATCH /api/users/{id}/status`

It uses in-memory demo data for the first build. Replace `PortalService` persistence with PostgreSQL repositories before production. SMTP properties are included in `application.properties` so recruiter and seeker notification events can be connected to automatic mail delivery without putting credentials in source control.

Run with Java 17 and Maven:

```bash
mvn spring-boot:run
```