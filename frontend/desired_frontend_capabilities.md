# Current Frontend Capabilities (as implemented)

## 1) App shell and routing
- Routes exist for `/draw`, `/draw/:id`, `/dashboard`, and `/login`.
- The drawing editor page is functional and mounts:
	- `Toolbar`
	- `PropertiesPanel`
	- `TextActionPanel`
	- `ActionPanel`
	- `Canvas`
- `/dashboard` and `/login` are currently placeholder views (text-only), not full feature pages.

## 2) Canvas rendering and interaction model
- Two-layer canvas rendering is implemented:
	- Static scene canvas for elements
	- Interactive overlay canvas for selection UI and previews
- Static redraw is nonce-driven (`sceneNonce`) to reduce unnecessary full redraw work.
- Supports viewport transforms (scroll + zoom) and device pixel ratio handling.

## 3) Drawing tools currently available
- Tool selection and keyboard shortcuts are implemented in the toolbar.
- Available tools in UI/type system:
	- Select
	- Hand (pan)
	- Rectangle, Diamond, Ellipse, Hexagon, Parallelogram, Cloud
	- Arrow, Line, Freedraw
	- Text
	- Eraser
- Element rendering includes rough-style primitives, freehand smoothing, arrowheads, and text rendering.

## 4) Selection, move, resize, and z-order
- Single and multi-select are implemented.
- Marquee selection is implemented.
- Drag-move selection is implemented, including movement of bound text with its container.
- Shape resize via handles is implemented for resizable shape elements.
- Z-order actions are available (bring to front/back, bring forward/backward) and wired to state updates.
- Rotation handle is rendered visually in the overlay, but active rotation interaction is not implemented yet.

## 5) Text capabilities
- Text creation modes:
	- Standalone text
	- Bound text on shape/line/arrow containers
- Inline text editing overlay is implemented.
- Double-click editing is implemented.
- Text editing supports:
	- Font size changes
	- Font family (hand-drawn / normal / code)
	- Alignment (left/center/right)
	- Text color
- Bound text is re-centered/reflowed on relevant container resize/edit flows.

## 6) Connectors and links
- Arrow connector workflow is implemented:
	- Click shape as source
	- Preview connector while moving pointer
	- Click target shape to create bound arrow
- Bound line/arrow endpoints are recomputed when connected shapes move/resize.
- Element linking is implemented:
	- `Ctrl/Cmd + K` opens link dialog for selected element
	- Link target selection and removal supported
	- `Ctrl/Cmd + Click` navigates viewport to linked element
	- Link indicator is rendered for linked elements

## 7) Keyboard and editor shortcuts
- Implemented shortcuts include:
	- Tool switches (`1..9`, plus `v`/`h` for select/hand)
	- Delete/Backspace for deletion
	- Escape to clear selection/connector preview
	- Ctrl/Cmd + A (select all)
	- Ctrl/Cmd + Z / Ctrl/Cmd + Shift + Z (undo/redo)
	- Ctrl/Cmd + K (open link dialog)

## 8) History and state behavior
- Snapshot-based history is implemented with undo/redo stacks and max size cap.
- History entries are pushed at meaningful interaction boundaries (e.g., end of drag/resize/edit), not every micro-move.
- Deletion is soft-delete (`isDeleted`) rather than immediate hard removal.
- Bound text attached to deleted containers is deleted together.

## 9) Styling/properties panel
- Properties panel supports editing current style and selected elements for:
	- Stroke color
	- Background color
	- Fill style
	- Stroke width/style
	- Roundness
	- Opacity
- Panel also provides selected-element actions:
	- Bring to front
	- Send to back
	- Delete

## 10) Zoom and viewport controls
- Mouse wheel pan/zoom behavior is implemented (with modifier-based zoom).
- Action panel provides explicit zoom controls (`+`, `-`, reset) and shows current zoom percent.

## 11) API/auth frontend integration status
- API client is implemented with:
	- Base URL config
	- JWT header injection
	- Central 401 handling (logout + redirect to `/login`)
- `authService` and `drawingService` endpoint wrappers are implemented.
- `authStore` persistence helpers are implemented.
- Current status: service modules are mostly scaffolding and are not yet wired into active UI workflows (no usage sites beyond definitions/interceptors).

## 12) Known frontend gaps (current state)
- Login page UI/flow not implemented (placeholder route only).
- Dashboard page UI/flow not implemented (placeholder route only).
- No active save/load drawing UX wired to backend yet.
- Export/file menu dialogs are represented in state but no complete UI flow is currently mounted.
- Tool registry architecture (`Tool` interface) exists by type, but pointer logic is still centralized in `Canvas.tsx`.
