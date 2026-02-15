# Project Guidelines

## Code Style
- Frontend is strict TypeScript; keep changes passing `npx tsc --noEmit` and preserve current semicolon + single-quote style.
- Use `@/` import alias and keep explicit `.ts`/`.tsx` suffixes in frontend imports (see `frontend/src/components/Canvas/Canvas.tsx`).
- Prefer existing type guards (for example `isTextElement`) before accessing type-specific fields on element unions.
- Backend is annotation-driven Spring style with Lombok + Jakarta validation (see `backend/src/main/java/com/excalidrawclone/dto/`).

## Architecture
- Frontend rendering uses two canvases: static scene + interactive overlays; keep redraw invalidation based on `sceneNonce` (`frontend/src/renderer/renderScene.ts`, `frontend/src/components/Canvas/Canvas.tsx`).
- Keep state split by concern: `canvasStore`, `historyStore`, `authStore`, `uiStore`.
- Element and tool contracts live in `frontend/src/types/element.ts` and `frontend/src/types/tool.ts`; add/modify fields there first.
- Backend follows Controller -> Service -> Repository -> Entity layering.
- Drawing payloads are persisted as JSONB (`elements`, `app_state`); backend treats drawing JSON as opaque (`backend/src/main/java/com/excalidrawclone/model/Drawing.java`).

## Build and Test
- Frontend (run from `frontend/`):
  - `npm run dev`
  - `npm run build`
  - `npx tsc --noEmit`
- Backend (run from `backend/`):
  - `mvn spring-boot:run`
  - `mvn package -DskipTests`
  - `mvn test`
- Docker:
  - `docker compose -f docker-compose.dev.yml up -d` (DB only)
  - `docker compose up --build` (full stack)

## Project Conventions
- Use soft delete for elements (`isDeleted`) instead of hard removal in normal editor flows (`frontend/src/store/canvasStore.ts`).
- For element mutations, keep `version` and `sceneNonce` behavior consistent with existing store patterns.
- Push history snapshots at meaningful boundaries (pointer-up, completed edits), not on every micro-update (`frontend/src/store/historyStore.ts`, `frontend/src/components/Canvas/Canvas.tsx`).
- Reuse typed defaults (`DEFAULT_ELEMENT_STYLE`, `DEFAULT_APP_STATE`) instead of ad-hoc literals.

## Integration Points
- Add frontend HTTP calls in `frontend/src/services/*` (not components), through `apiClient`.
- Dev proxy path is `/api` -> `http://localhost:8080` (`frontend/vite.config.ts`); container route is nginx `/api` -> backend (`frontend/nginx.conf`).
- Backend API roots: `/api/auth` and `/api/drawings`.
- Be careful with list response shape: backend returns `Page<...>` on list endpoints; keep frontend typing aligned.

## Security
- Backend security is stateless JWT; protected routes require `Authorization: Bearer <token>` (`backend/src/main/java/com/excalidrawclone/config/SecurityConfig.java`).
- Do not hardcode secrets/origins; use env-driven config in `backend/src/main/resources/application.yml`.
- Keep auth behavior centralized in security filter/provider and `AuthService`; do not bypass password hashing or token validation.
