# Ent'artes — Dance School Management Web Application

A full-stack web application for managing a dance school, covering students, teachers, schedules, events, coaching sessions, and notifications.

<!-- TODO: add live demo link once deployed on Render
**Live demo:** https://... — log in with one of the [demo accounts](#demo-accounts). Hosted on a free tier, so the first load may take up to a minute.
-->

---
## Team

Academic project developed by a team of 5 Computer Systems Engineering students at IPCA.
Original repository: [rogerio-picas/entartes-web-app](https://github.com/rogerio-picas/entartes-web-app)

| Name              | GitHub                                                   |
| ----------------- | ---------------------------------------------------------|
| Rogério Picas     | [@rogerio-picas](https://github.com/rogerio-picas)       |
| Ivo Fernandes     | [@ivofernandes8819](https://github.com/ivofernandes8819) |
| Matheus Delgado   | [@matheusrdelgado](https://github.com/matheusrdelgado)   |
| José Sousa        | [@JoseSousa31552](https://github.com/JoseSousa31552)     |
| Hugo Gomes        | [@hugo31545](https://github.com/hugo31545)               |

## Contributions — Hugo Gomes (full-stack)

This section covers my own contributions only; see the commit history for the work of the whole team.

**Frontend (React)**
- Role-based dashboards (student, teacher, coordinator), schedule calendar and class management
- Event management: creation, editing, search, pagination, groups and participants per dance style

**Backend (Node.js / Express / Prisma)**
- User profile and personal data services with password validation
- Server-side pagination for events and CSV report export fixes
- Database schema updates and refactoring of controllers into services

**Testing and quality**
- Unit and integration tests with Jest and Vitest
- Date and timezone handling fixes

## Technologies

| Layer        | Stack                              |
| ------------ | ---------------------------------- |
| Frontend     | React 18, React Router v6, Vite    |
| Styling      | Tailwind CSS, PostCSS              |
| Backend      | Node.js, Express                   |
| Database     | PostgreSQL (NeonDB) via Prisma ORM |
| Auth         | JWT (8h expiration), RBAC (3 roles)|

---

## Architecture

### Backend

```
Route → Middleware (auth/role) → Controller → Service → Prisma → Response
```

- All routes are mounted under `/api/`
- Interactive API documentation is available at `/api-docs` (Swagger)
- The coaching module is decoupled by role: `coachingAlunoService`, `coachingDocenteService`, `coachingCoordenacaoService`

### Frontend

```
View → Service file → services/api.js (injects JWT) → Backend API
```

- `services/api.js` acts as the central HTTP client — it automatically injects the Bearer token into all requests and redirects the user to the login page upon encountering a 401 status code.
- `DashboardLayout` provides a `NotificationContext` that handles notification polling every 60 seconds.
- Authenticated routes are secured using a `<ProtectedRoute>` component, which validates JWT expiration prior to rendering.

### Core Database Models

- `utilizador` — Base user record; extended by `aluno` (student), `docente` (teacher), or `coordenadora` (coordinator).
- `marcacao` — Coaching sessions featuring a state machine mechanism (`marcacao_estado_historico`).
- `evento` + `evento_aluno` / `evento_docente` — Events associated with strictly typed participants.
- `horario_letivo` / `disponibilidade` — Academic schedules and teacher availability slots.
- `notificacao` / `anuncio` — Individual user notifications and targeted group announcements.

---

## Testing

| Layer    | Framework | Type                    | File                        |
| -------- | --------- | ----------------------- | --------------------------- |
| Backend  | Jest      | Unit (Service)          | `modalidadeService.test.js` |
| Backend  | Jest      | Unit (Middleware)       | `authMiddleware.test.js`    |
| Frontend | Vitest    | Integration (Service)   | `horarioService.test.js`    |
| Frontend | Vitest    | Unit (Utility)          | `dateUtils.test.js`         |
| Frontend | Vitest    | Unit (HTTP Client)      | `api.test.js`               |

---

## Key Libraries

| Library                                | Purpose                          |
| -------------------------------------- | -------------------------------- |
| `prisma`                               | ORM and database access layer    |
| `jsonwebtoken` + `bcrypt`              | Authentication and password hashing |
| `express-rate-limit`                   | Brute-force protection middleware |
| `swagger-jsdoc` + `swagger-ui-express` | API documentation engine         |
| `react-big-calendar` + `date-fns`      | Scheduling calendar components   |
| `lucide-react`                         | Icon system                      |

---

## Routes and Permissions

Roles: **C** = Coordinator · **D** = Teacher (Docente) · **A** = Student (Aluno)

### Auth

| Method | Route             | Access |
| ------ | ----------------- | ------ |
| POST   | `/api/auth/login` | Public |
| GET    | `/api/auth/me`    | Public |

### Users

| Method | Route                                  | Access  |
| ------ | -------------------------------------- | ------- |
| GET    | `/api/users/`                          | C       |
| POST   | `/api/users/`                          | C       |
| GET    | `/api/users/:id`                       | C, D, A |
| PUT    | `/api/users/:id`                       | C       |
| DELETE | `/api/users/:id`                       | C       |
| PUT    | `/api/users/perfil/password/:id`       | C, D, A |
| PUT    | `/api/users/perfil/dados-pessoais/:id` | C, D, A |

### Schedules

| Method | Route                           | Access  |
| ------ | ------------------------------- | ------- |
| GET    | `/api/horario/minhas-aulas`     | C, D, A |
| GET    | `/api/horario/disponiveis`      | C, D, A |
| GET    | `/api/horario/minhas-aulas/:id` | C, D, A |
| POST   | `/api/horario/inscrever`        | A       |

### Coaching

| Method | Route                                        | Access |
| ------ | -------------------------------------------- | ------ |
| GET    | `/api/coaching/disponibilidades/consultar`   | A      |
| POST   | `/api/coaching/marcacao/solicitar`           | A      |
| GET    | `/api/coaching/meus-pedidos`                 | A      |
| DELETE | `/api/coaching/pedido/:id/cancelar`          | A      |
| POST   | `/api/coaching/presenca-grupo`               | A      |
| POST   | `/api/coaching/aluno/conclusao-sessao/:id`   | A      |
| GET    | `/api/coaching/colegas`                      | A      |
| GET    | `/api/coaching/minhas-aulas`                 | D      |
| POST   | `/api/coaching/docente/conclusao-sessao/:id` | D      |
| POST   | `/api/coaching/cancelar-marcacao/:id`        | D      |
| GET    | `/api/coaching/pedidos-pendentes`            | C      |
| POST   | `/api/coaching/confirmar-marcacao`           | C      |
| POST   | `/api/coaching/rejeitar-marcacao`            | C      |
| POST   | `/api/coaching/cancelar-marcacao`            | C      |
| POST   | `/api/coaching/concluir-marcacao`            | C      |
| POST   | `/api/coaching/reatribuir-sala`              | C      |
| GET    | `/api/coaching/salas-disponiveis`            | C      |
| GET    | `/api/coaching/historico-marcacao/:id`       | C      |

### Availability (Teacher)

| Method | Route                   | Access |
| ------ | ----------------------- | ------ |
| GET    | `/api/availability/`    | D      |
| POST   | `/api/availability/`    | D      |
| PUT    | `/api/availability/:id` | D      |
| DELETE | `/api/availability/:id` | D      |

### Events & Groups

| Method | Route                                         | Access  |
| ------ | --------------------------------------------- | ------- |
| GET    | `/api/events/`                                | C, D, A |
| GET    | `/api/events/meus-eventos`                    | D, A    |
| POST   | `/api/events/`                                | C       |
| PUT    | `/api/events/:id`                             | C       |
| DELETE | `/api/events/:id`                             | C       |
| POST   | `/api/events/:id/concluir`                    | C       |
| GET    | `/api/events/:id/participantes`               | C, D, A |
| POST   | `/api/events/:id/participantes`               | C       |
| DELETE | `/api/events/:id/participantes/alunos/:aid`   | C       |
| DELETE | `/api/events/:id/participantes/docentes/:did` | C       |
| POST   | `/api/events/:id/grupos`                      | C       |
| GET    | `/api/events/:id/grupos`                      | C, D, A |
| PUT    | `/api/events/:id/grupos/:gid`                 | C       |
| DELETE | `/api/events/:id/grupos/:gid`                 | C       |
| POST   | `/api/events/:id/grupos/:gid/alunos/:aid`     | C, D    |
| DELETE | `/api/events/:id/grupos/:gid/alunos/:aid`     | C, D    |
| POST   | `/api/events/:id/grupos/:gid/docentes/:did`   | C       |
| DELETE | `/api/events/:id/grupos/:gid/docentes/:did`   | C       |

### Dance Styles / Disciplines (Modalidades)

| Method | Route                                       | Access  |
| ------ | ------------------------------------------- | ------- |
| GET    | `/api/modalidades/`                         | C, D, A |
| GET    | `/api/modalidades/:id`                      | C, D, A |
| POST   | `/api/modalidades/`                         | C       |
| PUT    | `/api/modalidades/:id`                      | C       |
| DELETE | `/api/modalidades/:id`                      | C       |
| POST   | `/api/modalidades/:id/docentes`             | C       |
| DELETE | `/api/modalidades/:id/docentes/:id_docente` | C       |

### Notifications

| Method | Route                        | Access  |
| ------ | ---------------------------- | ------- |
| GET    | `/api/notificacoes/`         | C, D, A |
| PATCH  | `/api/notificacoes/:id/lida` | C, D, A |

### Announcements

| Method | Route                               | Access  |
| ------ | ----------------------------------- | ------- |
| GET    | `/api/anuncios/`                    | C, D, A |
| POST   | `/api/anuncios/`                    | C       |
| GET    | `/api/anuncios/:id`                 | C, D, A |
| PUT    | `/api/anuncios/:id`                 | C, D, A |
| DELETE | `/api/anuncios/:id`                 | C       |
| GET    | `/api/anuncios/anuncios/:id_evento` | C, D, A |
| GET    | `/api/anuncios/grupo/:id_grupo`     | C, D, A |

### Reports

| Method | Route                           | Access |
| ------ | ------------------------------- | ------ |
| GET    | `/api/relatorios/sessoes`       | C      |
| GET    | `/api/relatorios/horas-docente` | C      |
| GET    | `/api/relatorios/alunos`        | C      |
| GET    | `/api/relatorios/docentes`      | C      |
| GET    | `/api/relatorios/exportar`      | C      |

### Rooms (Salas)

| Method | Route            | Access |
| ------ | ---------------- | ------ |
| GET    | `/api/salas/`    | C      |
| DELETE | `/api/salas/:id` | C      |

---

## Local Setup

### Prerequisites

- Node.js v20+
- A PostgreSQL database — a free [Neon](https://neon.tech) project works out of the box

### 1. Backend (`backend/`)

Create a `backend/.env` file:

```env
DATABASE_URL='postgresql://user:password@host/dbname?sslmode=require'
JWT_SECRET="any-long-random-string"
```

Then install dependencies, create the tables and load the demo data:

```bash
npm install
npx prisma db push    # creates the database tables from schema.prisma
npx prisma db seed    # creates the demo accounts and sample data
npm run dev           # http://localhost:3000 (API docs at /api-docs)
```

The seed is idempotent — running it again resets the demo account passwords without duplicating data.

### 2. Frontend (`frontend/`)

```bash
npm install
npm run dev           # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:3000`, so both servers must be running at the same time.

### Production build (single server)

From the repository root, the backend serves the compiled frontend, so the whole app runs as one process:

```bash
npm run build
npm start             # http://localhost:3000
```

---

## Demo Accounts

Created by the seed script (`backend/prisma/seed.js`):

| Role         | Username  | Password     |
| ------------ | --------- | ------------ |
| Coordinator  | `admin`   | `admin123`   |
| Teacher      | `docente` | `docente123` |
| Student      | `aluno`   | `aluno123`   |
