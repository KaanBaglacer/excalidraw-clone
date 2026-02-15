Design and implement frontend UI for: $ARGUMENTS

## Context
This is an Excalidraw clone with a dark theme canvas-based whiteboard UI. The app uses:
- React 18 + TypeScript (Vite)
- HTML5 Canvas + Rough.js for the drawing surface
- Zustand + Immer for state management
- Lucide React for icons
- CSS variables defined in `frontend/src/styles/global.css`

## Reference UI Layout

The UI follows the Excalidraw layout with these major zones:

```
┌──────────────────────────────────────────────────────────┐
│ [≡]          [ Tool Toolbar (centered) ]    [+] [Share] [≡]│
│                                                          │
│ ┌──────────┐                                             │
│ │Properties│                                             │
│ │  Panel   │           Canvas                            │
│ │  (left)  │                                             │
│ └──────────┘                                             │
│                                                          │
│ [- 100% +] [↩ ↪]                                    [?] │
└──────────────────────────────────────────────────────────┘
```

### 1. Top Toolbar (center-top, horizontal)
- **Position**: `position: absolute; top: 1rem; left: 50%; transform: translateX(-50%); z-index: 100`
- **Style**: `--color-surface` bg, `--color-border` border, 8px border-radius, subtle drop shadow
- **Contents** (left to right, separated by vertical dividers where noted):
  1. **Lock tool** — toggles "keep tool active after drawing" vs "revert to Select after one shape"
  2. *divider*
  3. **Hand (pan)** tool
  4. **Selection** tool (shortcut: `1` or `V`)
  5. **Rectangle** (shortcut: `2` or `R`)
  6. **Diamond** (shortcut: `3` or `D`)
  7. **Ellipse** (shortcut: `4` or `O`)
  8. **Arrow** (shortcut: `5` or `A`)
  9. **Line** (shortcut: `6` or `L`)
  10. **Freedraw / Pen** (shortcut: `7` or `P`)
  11. **Text** (shortcut: `8` or `T`)
  12. **Image insert** (shortcut: `9`)
  13. **Eraser** (shortcut: `0` or `E`)
  14. *divider*
  15. **More/Library** button
- Each button is 40×40px, icon 20×20px
- Active tool gets `--color-primary` background + white icon color
- Shortcut number shown as a tiny subscript (8px, opacity 0.6) at bottom-right of each button
- Hover shows tooltip (tool name + shortcut) after 500ms delay

### 2. Properties Panel (left side)
- **Position**: `position: absolute; top: 5rem; left: 1rem; z-index: 90`
- **Style**: `--color-surface` bg, `--color-border` border, 8px border-radius, padding 12px, width ~180px
- **Visibility**: Shown when a drawing tool is active OR when element(s) are selected; hidden in hand/select mode with no selection
- **Sections** (top to bottom, each separated by visual spacing ~12px):

#### a. Stroke Color
- Label: "Stroke"
- 5–6 color swatches (24×24px rounded squares, 4px border-radius) from `STROKE_COLORS`
- Plus a "custom color" button (gear/palette icon) that opens a color picker
- Selected swatch gets a 2px ring in `--color-primary`

#### b. Background Color
- Label: "Background"
- 5–6 swatches from `BACKGROUND_COLORS` (first = transparent, shown with checkerboard pattern)
- Plus custom color button
- Selected swatch gets a 2px ring in `--color-primary`

#### c. Stroke Width
- Label: "Stroke width"
- 3 toggle buttons in a group (like radio chips):
  - **Thin** (1px) — icon: thin horizontal line
  - **Medium** (2px) — icon: medium horizontal line (default)
  - **Bold** (4px) — icon: thick horizontal line
- Active option gets `--color-primary` background

#### d. Stroke Style
- Label: "Stroke style"
- 3 toggle buttons:
  - **Solid** — icon: solid line
  - **Dashed** — icon: dashed line (`---`)
  - **Dotted** — icon: dotted line (`...`)
- Active option gets `--color-primary` background

#### e. Sloppiness / Roughness
- Label: "Sloppiness"
- 3 toggle buttons:
  - **Architect** (roughness: 0) — icon: clean wave
  - **Artist** (roughness: 1) — icon: slightly rough wave (default)
  - **Cartoonist** (roughness: 2) — icon: very rough wave
- Active option gets `--color-primary` background

#### f. Edges / Corners (for shapes only, not lines)
- Label: "Edges"
- 2 toggle buttons:
  - **Sharp** (roundness: 0) — icon: sharp-corner rectangle
  - **Round** (roundness: 1) — icon: rounded-corner rectangle
- Active option gets `--color-primary` background

#### g. Opacity
- Label: "Opacity"
- Custom slider: 0–100, `--color-primary` fill on the track
- Numeric labels "0" and "100" on the ends

#### h. Layers (z-ordering)
- Label: "Layers"
- 4 icon buttons in a row:
  - **Send to back** (⤓ ArrowDownToLine)
  - **Send backward** (↓ ArrowDown)
  - **Bring forward** (↑ ArrowUp)
  - **Bring to front** (⤒ ArrowUpToLine)

### 3. Top-Left Menu Button
- **Position**: `position: absolute; top: 1rem; left: 1rem; z-index: 100`
- Hamburger menu icon (☰ / `Menu` from Lucide)
- Opens a dropdown with: Open, Save, Export PNG, Export SVG, Reset Canvas, etc.
- 40×40px, same button style as toolbar

### 4. Top-Right Actions
- **Position**: `position: absolute; top: 1rem; right: 1rem; z-index: 100`
- Buttons (right to left):
  - **Library/Sidebar toggle** — opens a right-side library panel (future)
  - **Share** button — pill-shaped, `--color-primary` bg, white text
  - **Brand button** ("Excalidraw+") — outlined, future feature link

### 5. Bottom-Left Controls
- **Position**: `position: absolute; bottom: 1rem; left: 1rem; z-index: 100`
- Two groups side by side:
  - **Zoom controls**: `[-]` `100%` `[+]` — three buttons in a connected group
    - Minus: zoom out by 10%
    - Center: shows current zoom %, click to reset to 100%
    - Plus: zoom in by 10%
  - **Undo/Redo**: `[↩]` `[↪]` — two buttons
    - Undo: `Ctrl+Z`
    - Redo: `Ctrl+Shift+Z` or `Ctrl+Y`
- Same panel styling: `--color-surface` bg, `--color-border` border, 8px radius

### 6. Bottom-Right Help
- **Position**: `position: absolute; bottom: 1rem; right: 1rem; z-index: 100`
- Small circular help button (?) / `HelpCircle` icon
- Opens help overlay/dialog

## Design System

### Color Palette (CSS Variables)
- `--color-bg`: #121212 (app background / canvas background)
- `--color-surface`: #1e1e2e (panels, toolbars, dialogs)
- `--color-surface-hover`: #2a2a3e (hover states)
- `--color-border`: #363652 (borders, dividers)
- `--color-text`: #e0e0e0 (primary text)
- `--color-text-secondary`: #a0a0b0 (secondary/muted text, labels)
- `--color-primary`: #6366f1 (active state, selection, primary buttons)
- `--color-primary-hover`: #818cf8 (primary hover)
- `--color-danger`: #ef4444 (destructive actions)

### Stroke/Fill Colors (from `utils/color.ts`)
- Stroke: `#1e1e1e`, `#e03131`, `#2f9e44`, `#1971c2`, `#f08c00`, `#6741d9`
- Background fills: `transparent`, `#ffc9c9`, `#b2f2bb`, `#a5d8ff`, `#ffec99`, `#d0bfff`

### Typography
- Font: system-ui, -apple-system, sans-serif
- Labels in panels: 12px, `--color-text-secondary`, font-weight 500
- Tooltip text: 12px, white on dark bg

### Layout Constants
- `--toolbar-width`: 48px (not currently used for vertical toolbar)
- `--panel-width`: 200px

### UI Principles
1. **Excalidraw-inspired**: Follow the Excalidraw UI patterns — compact toolbar with icon buttons, side panels that appear contextually, minimal chrome
2. **Dark theme first**: All components use the dark color palette above
3. **Compact controls**: Use icon buttons (36-40px), small toggles, and chip-style selectors rather than large form elements
4. **Hover tooltips**: All icon buttons should show tooltips with the action name and keyboard shortcut
5. **Active state**: Selected tools/options use `--color-primary` background with white icon
6. **Panel style**: Panels have `--color-surface` background, `--color-border` border, 8px border-radius, subtle box-shadow
7. **No external UI library**: Build components with plain CSS/inline styles + Lucide icons
8. **Floating UI**: All panels/toolbars float over the canvas with `position: absolute` and appropriate z-index

### Component Patterns
- **Icon buttons**: 36-40px square, border-radius 6-8px, transparent bg, hover: `--color-surface-hover`, active: `--color-primary` bg + white icon
- **Toggle button groups**: Row of icon buttons, active one gets `--color-primary` bg; styled like connected chips
- **Panels**: position absolute, `--color-surface` bg, 1px `--color-border` border, 8px border-radius, 8-12px padding, subtle box-shadow
- **Color swatches**: 24×24px with 4px border-radius, 2px border (`--color-border`), selected: 2px ring in `--color-primary`
- **Sliders**: Custom styled with `--color-primary` track fill, 14px circular thumb
- **Dividers**: 1px `--color-border`, 8px vertical margin
- **Section labels**: 12px, `--color-text-secondary`, margin-bottom 6px

### Z-Index Layers
- Canvas: 0
- Properties panel: 90
- Toolbar / top-bar actions: 100
- Tooltips: 101
- Dialogs/modals: 200
- Context menus: 150

## State Integration

### Zustand Stores
- **`canvasStore`**: `activeTool`, `currentStyle`, `selectedElementIds`, `elements`, `zoom`, `scrollX/Y` — use `setActiveTool()`, `setCurrentStyle()`, `setZoom()`, z-order actions (`bringToFront`, `sendToBack`, etc.)
- **`historyStore`**: `undo()`, `redo()`, `canUndo`, `canRedo`
- **`uiStore`**: `showPropertiesPanel`, `showExportDialog`, `showFileMenu` — toggle visibility of panels/dialogs

### Connecting Properties Panel to State
- On mount: read `currentStyle` from canvasStore to populate controls
- When user changes a property: call `setCurrentStyle({ property: newValue })`
- When elements are selected: also update selected elements via `updateElement()` to apply style changes immediately
- Properties panel should reflect the style of the currently selected element(s), or `currentStyle` when nothing is selected

## Instructions
1. Read existing components in `frontend/src/components/` to understand current patterns
2. Check the Zustand stores in `frontend/src/store/` for available state and actions
3. Use Lucide React icons (import from 'lucide-react')
4. Use CSS variables from the design system above
5. Keep components self-contained with CSS files (one per component) or inline styles
6. Ensure the component integrates with the existing Canvas and store architecture
7. Verify the build passes after implementation (`npx tsc --noEmit && npm run build`)
