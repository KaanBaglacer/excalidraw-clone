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


## Phase 1

### Change Requests
- 'rectangle' | 'ellipse' | 'diamond' | 'cloud'  | 'hexagon' | 'parallelogram' | 'line' | 'arrow' mark these element types shape element
- If shape element created change to select tool and select created element
- When double click action done on anywhere on the Canvas change to Text tool and start editing
    - Dont show any additional input field. It should be transparent and until clicked anyplace other than text stop editing.
    - Enter should work as newline and only ESC key stops editing
    - It should keep formatting of text when editing done.
    - If text created in Shape type component, text and shape behave as single component.
        - If text inside shape clicked then it is accepted as single component 
        - If it is within a shape type component, text's center should be center of shape.
        - Text should adapt to shape in terms of size. Text format should be same but it should be inside of shape
### Corrected Requests for to reach current changes

Use this exact Phase 1 spec for implementation.

#### Scope
- Only change frontend canvas/text interaction behavior.
- Do not add new panels, dialogs, routes, or backend integration.
- Keep existing styling/theme system; no new visual design system elements.

#### Required Behavior
1. Shape-element classification
- Treat these element types as shape elements for creation/selection behavior:
	- `rectangle`, `ellipse`, `diamond`, `cloud`, `hexagon`, `parallelogram`, `line`, `arrow`.

2. Post-creation tool flow
- After creating any shape element from the list above:
	- switch active tool to `select`
	- select the newly created element.

3. Double-click text entry flow
- Double-click anywhere on canvas must:
	- switch active tool to `text`
	- open inline text editing immediately.

4. Text editor overlay behavior
- Use transparent inline editing (no boxed input UI styling).
- Editing ends only when:
	- user presses `Escape`, or
	- focus leaves text editing (click outside text).
- `Enter` must insert newline (must not submit/finish editing).

5. Text visibility while editing
- When a text element is being edited, hide that same text in static canvas render so only the editor content is visible.

6. Tool state after editing
- On text edit finish (submit/cancel), switch active tool to `select`.

7. Bound text + shape coupling
- Text bound to shape behaves as part of shape interactions:
	- clicking bound text should resolve to/select its container shape for shape-level interactions.
- If text is inside a shape:
	- editing overlay position should be centered relative to shape center,
	- editing text should type left-aligned from line start,
	- text block should remain centered in shape after edit finalize.

8. Resize reflow behavior
- For bound text:
	- when container shrinks, wrap text tighter to fit,
	- when container expands, reflow from original typed content (not already wrapped lines) so formatting can expand back naturally.

#### Data/State Notes
- Keep soft-delete behavior (`isDeleted`) unchanged.
- Preserve undo/redo snapshot behavior.
- If needed, store original typed text source for bound-text reflow (for example `rawText`) while rendering wrapped `text`.

#### Acceptance Criteria
- Creating shape -> tool becomes `select` and created shape is selected.
- Double-click empty area -> transparent text editor opens, `Enter` adds newline, `Escape` ends edit.
- Double-click existing text -> canvas text hides during edit and reappears after finish.
- Bound text click is treated as shape interaction target.
- Bound text stays visually centered in shape after finalize.
- Shrink shape wraps text; expand shape restores wider line layout from original input.