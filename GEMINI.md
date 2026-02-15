# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

Excalidraw clone - a virtual whiteboard with hand-drawn aesthetic. Single-user (v1), save/load to backend, export PNG/SVG.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, HTML5 Canvas + Rough.js, Zustand + Immer
- **Backend**: Spring Boot 3.4, Java 21, Maven, Spring Security (JWT + OAuth2)
- **Database**: PostgreSQL 16 with JSONB for drawing element storage
- **Containerization**: Docker + Docker Compose

## Commands

### Frontend (`frontend/`)
```bash
npm run dev          # Start dev server on port 5173
npm run build        # Type-check + production build
npx tsc --noEmit     # Type-check only
```

### Backend (`backend/`)
```bash
mvn spring-boot:run                    # Start backend on port 8080
mvn package -DskipTests                # Build JAR
mvn test                               # Run tests
mvn test -Dtest=ClassName              # Run single test class
mvn test -Dtest=ClassName#methodName   # Run single test method
```

### Docker
```bash
docker compose -f docker-compose.dev.yml up -d   # Start PostgreSQL for development
docker compose up --build                         # Start full stack (frontend + backend + DB)
```

## Implementation Status

**Phase 1 (Scaffolding)**: COMPLETE — all directories, types, stores, services, backend entities, migrations, Docker files.

**Phase 2 (Canvas Rendering)**: COMPLETE — two-canvas system with Rough.js, shape cache, all element types render (rectangle with optional rounded corners, ellipse, diamond, line, arrow with arrowheads, freedraw with curve smoothing, text with font families), grid rendering, interactive overlays (selection outline, resize handles, rotation handle, group bounding box, marquee selection box).

**Phase 3 (Drawing Tools)**: PARTIAL — basic inline drawing logic in `Canvas.tsx` handles shape creation via pointer events for all element types. `Tool` interface defined in `types/tool.ts` but `tools/` directory is empty (no formal Tool class instances or registry yet). No `usePointerEvents` hook — `Canvas.tsx` handles pointer routing directly.

**Not yet started**: Selection/move/resize tool, properties panel UI, zoom/undo/redo UI, history integration, keyboard shortcuts, backend integration, auth UI, export.

## Architecture

### Frontend

**Rendering**: Two-canvas layer system. Static canvas renders elements via Rough.js with `renderStaticScene()` — only redraws when `sceneNonce` changes. Interactive canvas renders selection handles, resize handles, rotation handles, group bounds, and marquee selection every frame via `renderInteractiveScene()`. Shape cache (`Map<id, {version, Drawable}>`) in `renderer/shapeCache.ts` avoids expensive Rough.js regeneration. DPR-aware sizing via `useCanvas` hook with ResizeObserver.

**Supported element rendering** (all in `renderer/renderElement.ts`):
- Rectangle (with optional rounded corners via SVG path), Ellipse, Diamond — via Rough.js primitives
- Line, Arrow — via Rough.js `linearPath` + custom arrowhead rendering (start/end)
- Freedraw — custom quadratic curve smoothing, respects stroke style
- Text — multi-line with font family mapping (hand-drawn/normal/code), text alignment

**State**: Zustand stores split by concern:
- `canvasStore` — elements, selection, active tool, viewport (scroll/zoom), current style, z-order actions (bringToFront/sendToBack/bringForward/sendBackward), `sceneNonce` for render invalidation
- `historyStore` — undo/redo stacks (snapshot-based, capped at 100), not yet wired to UI
- `authStore` — JWT token, user info, localStorage persistence
- `uiStore` — panel/dialog visibility (showPropertiesPanel, showExportDialog, showFileMenu)

**Tools**: `Tool` interface defined in `types/tool.ts` with `onPointerDown/onPointerMove/onPointerUp/onKeyDown`. The `tools/` directory exists but is empty — no formal tool class implementations yet. Currently, `Canvas.tsx` has inline pointer event handlers that create/update elements directly. This should be refactored to use the Tool interface with a registry pattern.

**Canvas component** (`components/Canvas/Canvas.tsx`): Initializes Rough.js canvas. Runs a `requestAnimationFrame` render loop. Handles pointer events inline for shape creation. Uses `useCanvas` hook for DPR-aware canvas sizing.

**UI components**: Toolbar (`components/Toolbar/`) — center-top horizontal bar with tool buttons + keyboard shortcut hints + CSS tooltips. No properties panel, zoom controls, undo/redo buttons, or menu implemented yet.

**Coordinate system**: Scene-space coordinates for elements. `screenToScene()`/`sceneToScreen()` in `scene/coordinateTransforms.ts` handle viewport transforms. Linear/freedraw element `points[]` are relative to element origin `(x, y)`.

**Element model**: Defined in `types/element.ts`. Every element has: id, type, position (x/y/width/height/angle), visual style (strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity, roundness), seed (Rough.js deterministic rendering), index (z-order), version, isDeleted (soft delete for undo).

**Path alias**: `@/` maps to `src/` (configured in tsconfig + vite.config.ts).

### Backend

**Layered architecture**: Controller -> Service -> Repository -> JPA Entity.

**Database schema** (Flyway migrations in `src/main/resources/db/migration/`):
- `users` - UUID PK, email (unique), provider/provider_id for OAuth2
- `drawings` - UUID PK, owner_id FK, `elements` JSONB (the full element array), `app_state` JSONB

**Auth flow**: JWT in `Authorization: Bearer <token>` header. `JwtAuthenticationFilter` validates on every request. OAuth2 success handler generates JWT and redirects to frontend with token as query param.

**JSONB handling**: Drawing elements stored as raw JSON string in the entity using Hypersistence Utils `@Type(JsonType.class)`. Frontend owns the element schema; backend treats it as opaque JSON.

### API Endpoints

| Path | Method | Auth | Purpose |
|------|--------|------|---------|
| `/api/auth/register` | POST | No | Create account |
| `/api/auth/login` | POST | No | Get JWT |
| `/api/auth/me` | GET | Yes | Current user |
| `/api/drawings` | GET | Yes | List user's drawings |
| `/api/drawings` | POST | Yes | Create drawing |
| `/api/drawings/{id}` | GET | Partial | Get drawing (public or owner) |
| `/api/drawings/{id}` | PUT | Owner | Update drawing |
| `/api/drawings/{id}` | DELETE | Owner | Delete drawing |

## Key Files

### Frontend
- `frontend/src/types/element.ts` — Core element type definitions (all modules depend on this)
- `frontend/src/types/tool.ts` — Tool interface and ToolType union
- `frontend/src/store/canvasStore.ts` — Central state hub for elements, tools, viewport, z-order
- `frontend/src/store/historyStore.ts` — Undo/redo stack management
- `frontend/src/store/uiStore.ts` — Panel/dialog visibility toggles
- `frontend/src/components/Canvas/Canvas.tsx` — Main canvas component with rendering loop and inline pointer event handling
- `frontend/src/components/Toolbar/Toolbar.tsx` — Top toolbar with tool buttons
- `frontend/src/renderer/renderElement.ts` — Per-element rendering (Rough.js shapes, freedraw, text, arrowheads)
- `frontend/src/renderer/renderScene.ts` — Static scene rendering + interactive overlays (selection, handles, marquee)
- `frontend/src/renderer/shapeCache.ts` — Version-based Rough.js Drawable cache
- `frontend/src/renderer/renderGrid.ts` — Grid line rendering
- `frontend/src/hooks/useCanvas.ts` — DPR-aware canvas sizing with ResizeObserver
- `frontend/src/scene/coordinateTransforms.ts` — screenToScene/sceneToScreen viewport math
- `frontend/src/utils/createElement.ts` — Element factory function
- `frontend/src/utils/color.ts` — Stroke/background/canvas color palettes
- `frontend/src/tools/` — Empty, planned for formal Tool class implementations

### Backend
- `backend/.../config/SecurityConfig.java` — Spring Security filter chain
- `backend/.../security/JwtTokenProvider.java` — JWT generation/validation
- `backend/.../controller/DrawingController.java` — Drawing CRUD endpoints
- `backend/.../controller/AuthController.java` — Auth endpoints (register, login, me)
- `backend/src/main/resources/db/migration/` — Flyway SQL migrations

## Configuration

Frontend Vite dev server proxies `/api` to `http://localhost:8080`. In Docker, nginx handles this proxy.

Backend config in `application.yml` uses env vars with defaults:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` (min 256-bit)
- `CORS_ORIGINS`
- `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` (optional OAuth2)
