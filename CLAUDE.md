# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo for "NIT Course", an online course/exam platform, with three independently deployable pieces:

- `frontend/` — React 19 + Vite + TypeScript SPA (Tailwind v4).
- `backend/` — an Express API gateway plus two independent microservices:
  - `backend/apigateway.ts` — a thin reverse proxy (`/iam/*` → iam service, `/core/*` → core service). Runs on port 3000 (`GATEWAY_PORT`).
  - `backend/iam/` — authentication/identity service (login, sign-up, OTP email verification, password reset). Runs on port 4000 by default (`IAM_PORT`).
  - `backend/core/` — the main domain service (courses, exams, admin, owner, payments, search). Runs on port 5000 by default (`CORE_PORT`).

Each backend service has its own `package.json`, `tsconfig.json`, `Dockerfile`, and Prisma schema/migrations — treat them as separate projects, not a shared workspace. There is no top-level script that runs everything; each piece is started independently (see Commands below).

## Commands

Run these from within the relevant directory (`frontend/`, `backend/`, `backend/iam/`, `backend/core/`) — there is no root-level package.json script that spans all of them.

### Frontend (`frontend/`)
- `npm run dev` — start Vite dev server on port 5170.
- `npm run build` — production build.
- `npm run lint` — ESLint.
- `npm run preview` — preview a production build.

### API gateway (`backend/`)
- `npm start` — runs `apigateway.ts` via nodemon.

### IAM service (`backend/iam/`)
- `npm start` — runs `app.ts` via nodemon.
- `npm test` — runs Jest e2e tests (`NODE_ENV=test`, `--runInBand`).
- `npm run test:watch` — Jest in watch mode.
- `npx jest tests/iam.e2e.test.ts -t "<test name>"` — run a single test.
- `npm run prisma:deploy` / `npm run prisma:push` — apply Prisma migrations / push schema without a migration.

### Core service (`backend/core/`)
- `npm start` — runs `app.ts` via nodemon.
- `npm test` — runs Jest e2e tests (`NODE_ENV=test`, `--runInBand`).
- `npx jest tests/core.e2e.test.ts -t "<test name>"` — run a single test.
- `npx prisma migrate dev` / `npx prisma generate` — standard Prisma workflow (no npm script wrapper exists here, unlike iam).

Both backend services test against a single e2e file (`tests/iam.e2e.test.ts`, `tests/core.e2e.test.ts`) that mocks Prisma (via a `prisma-singleton`/`jest-mock-extended` pattern) and mocks outbound `axios`/`nodemailer` calls — tests do not hit a real database or the other microservice.

### Docker
- `backend/docker-compose.yml` brings up all three backend pieces (`iam`, `core`, `api-gateway`) on a shared `app-network`, with `iam` and `core` each reading their own `.env` file. There's no compose file wiring in the frontend.

## Architecture notes

**Two independent Postgres schemas, not a shared DB.** `backend/iam/prisma/schema.prisma` and `backend/core/prisma/schema.prisma` both define an overlapping but separately-migrated `User`/`Course`/`Exam`/etc. set of models against different databases (`DATABASE_URL` differs per service). `iam` owns credentials/identity; `core` owns the richer domain data (courses, exams, payments, certificates) and duplicates just enough of the `User` shape to relate to it locally. When changing a shared-looking model (e.g. `User`), check whether the change needs to be mirrored in both schemas.

**Auth is delegated via HTTP, not shared JWT verification.** Only `iam` holds `JWT_SECRET_KEY` verification logic (`backend/iam/src/controllers/authController.ts`, `getUserInfo`). `core` does not verify JWTs itself: every protected controller in `backend/core/src/controllers/*` forwards the caller's `Authorization` header to `` http://localhost:${IAM_PORT}/login/user-info `` via `axios.get` and trusts the returned `{ username, userType }` to make authorization decisions. This means core's local dev/test setup calls out to iam over HTTP by convention (mocked in tests) — there's no shared auth middleware/package.

**`core` has a secondary Mongo-backed model alongside Postgres.** `backend/core/models/courseImage.ts` is a Mongoose model (`CourseImage`) used by `courseControll.ts`/`searchControll.ts`, separate from the Prisma-managed Postgres data. Uploaded files themselves are written to disk via `multer` (`backend/core/middleware/upload.ts` → `backend/core/uploads/`) and served statically at `/uploads`.

**Frontend talks to iam/core directly in dev, bypassing the gateway.** `frontend/src/lib/api.ts` creates two axios instances, `iamApi` and `coreApi`, pointed at `VITE_IAM_API_BASE_URL`/`VITE_CORE_API_URL` (defaulting to `localhost:4000`/`localhost:5000`), each with a request interceptor that attaches `Authorization: Bearer <token>` from `localStorage`. The `apigateway.ts` proxy exists but isn't what the frontend hits by default — check `.env` when tracing a network call.

**Auth/session state is centralized in one context.** `frontend/src/context/AuthContext.tsx` owns `authStatus` (`"loading" | "authenticated" | "anonymous"`), `userType` (`"normal" | "admin" | "owner"`), and the token, persisting only the token to `localStorage` and re-deriving identity on load via `iamApi.get("/login/user-info")`. `frontend/src/components/ProtectedRoute.tsx` gates routes by `allow: UserRole[]` and redirects to a role-specific home (see `homeByRole`) or `/login`. All route-level access control lives in `frontend/src/App.tsx`'s route table — check there first when adding a page that needs auth.

**Role-based route structure**: `/user/*` (normal), `/admin/*` (admin), `/owner` (owner), plus shared `/exam/:eid` and `/watchCourse/:cid` for admin+owner. New pages should follow this existing role prefix convention and be wrapped in `ProtectedRoute`.

**Comments and user-facing strings are Persian (RTL).** Both frontend and backend code mix Persian comments/strings with English identifiers; match this convention when editing nearby code rather than converting to English.
