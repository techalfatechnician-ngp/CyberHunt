# CyberHunt UI Migration Guide

This document outlines the visual, layout, styling, and component modifications introduced in the UI overhaul. It serves as a step-by-step blueprint to recreate these changes on another branch (such as `main`) without copying or affecting any backend, database, authentication, or API logic.

---

## 1. Project Overview
This update modernizes the **CyberHunt** player dashboard into a premium, immersive cyber warfare operations HUD. It transforms a basic web layout into a high-fidelity tactical command interface while maintaining strict backwards compatibility and preserving all existing state, React handlers, and hook structures.

---

## 2. Design Philosophy
The design follows a **Classified Cyber Operation Center** aesthetic:
* **Tactical Command HUD**: Dark background shades, low-opacity neon grid lines, and high-visibility status indicators emulate military monitor systems.
* **Cyberpunk Tactical Minimalism**: Flat structural components, thin glowing borders, and specialized monospaced text elements provide a dense, technical data-dashboard appearance.
* **Monospaced Data Readouts**: Monospaced typefaces are used for live scores, progress markers, and timers to reinforce a "live console terminal" feeling.

---

## 3. Global Theme Changes
* **Deepened Colors**: Dark backgrounds are updated from high-gray slate values to deep obsidian/pitch-black shades to create deep canvas contrast.
* **HUD Overlay Elements**: Added a moving grid (`.cyber-grid`), a subtle vignette (`.cyber-vignette`), and dark scanlines (`.cyber-scanlines`) to recreate a tactical CRT monitor layer.
* **High-Tech Glows**: Multiple custom glowing text shadow styles (`.text-glow-*`) are registered for green, red, amber, blue, cyan, and purple colors.
* **Interactive Hover States**: Upgraded buttons and panels to feature subtle scaling, glow transitions, and responsive border-color changes.
* **Refined Scrollbars**: The browser scrollbar is styled as a thin, glow-on-hover track in matching neon green.

---

## 4. File-by-File Changes

### [MODIFY] [globals.css](file:///c:/Project/Cyberhunt/CyberHunt/src/app/globals.css)
* **Purpose**: Declares global theme overrides (Tailwind v4 syntax), layout overlays, CRT animations, and custom scrollbar classes.
* **Changes**:
  * Customized `@theme` configurations for new backgrounds (`--color-bg0` to `--color-bg3`) and status accents (`--color-neon`, `--color-amber`, `--color-red`, etc.).
  * Added backwards-compatibility aliases (`--color-bg`, `--color-surface`, `--font-display`, etc.) to prevent legacy components from breaking.
  * Added tactical utilities: `.bg-grid-pattern`, `.text-glow-green`, `.text-glow-red`, `.text-glow-amber`, `.cyber-grid`, `.cyber-scanlines`, `.cyber-vignette`.
  * Implemented a custom scrollbar thumb matching the green neon style.
  * Added the `@keyframes gridMove` and `@keyframes scanShimmer` custom animations.

### [MODIFY] [layout.tsx](file:///c:/Project/Cyberhunt/CyberHunt/src/app/layout.tsx)
* **Purpose**: Configures the main page document structure and global browser SEO metadata.
* **Changes**:
  * Updated browser tab title from `"< CYBERHUNT /> — TechAlfa"` to `"Operation Vault | CyberHunt"`.

### [NEW] [icon.tsx](file:///c:/Project/Cyberhunt/CyberHunt/src/app/icon.tsx)
* **Purpose**: Generates a dynamic, high-quality, glowing favicon image via Next.js OG `ImageResponse`.
* **Changes**:
  * Outputs a `32x32` PNG favicon representing a glowing monospace green letter `"C"` in a rounded black square with a neon green border.

### [MODIFY] [page.tsx](file:///c:/Project/Cyberhunt/CyberHunt/src/app/dashboard/page.tsx)
* **Purpose**: Central HUD player dashboard cockpit.
* **Changes**:
  * Redesigned the main layout header to double in height and display multi-level details.
  * Reformatted level cards inside the left selector column to display `"MISSION 01"` instead of raw numbers.
  * Removed the redundant Fragment Status list from the right column.
  * Reallocated the Live Scoreboard from the left column into the right sidebar under the name `"LIVE NET STATUS"`, padding team rankings to 2 digits.
  * Updated labels to use high-fidelity military terminology (e.g. `"TARGET: MISSION 01"`).

---

## 5. Component Changes

### Dashboard Top Bar Header
* **Old Behavior**: Compact `52px` height, standard tracking, simple text stats, and sharp red sign-out button.
* **New Appearance**: High-density `88px` tall bar containing an animated glowing green status dot, tactical sub-caption (`// CLASSIFIED OPERATIONS CENTRE`), vertical column stats (Hints Used, AI Strikes, Sector, Keys Secured), and a redesigned disconnect button with a red glow transition on hover.

### Mission Selector Cards (Left Sidebar)
* **Old Behavior**: Displayed simple level index values (e.g., `01`, `02`).
* **New Appearance**: Displayed as `MISSION 01` etc., styled with `Share Tech Mono` lettering inside aspect-ratio bounding boxes.

### Scoreboard (Right Sidebar)
* **Old Behavior**: Basic list layout titled `LIVE SCOREBOARD` showing basic single-digit rankings.
* **New Appearance**: Titled `LIVE NET STATUS` with a Lucide `Tv` monitor icon header. Individual items contain 2-digit rankings (`01`, `02`) in `Share Tech Mono` with updated colors.

---

## 6. Layout Changes
* **Top Bar Header Expansion**: Height increased from `52px` to `88px` with customized paddings.
* **Sidebar Swaps & Removal**:
  * Left Column: Simplified to strictly display the 10 Mission selector boxes.
  * Right Column: Modified to display the `LIVE NET STATUS` scoreboard. The old Fragment Status checklist was removed completely.
* **Center Control Panel Alignment**: The center column margins were cleaned up (changed `mt-auto pt-4` to `mt-2 pt-2` around the solution input wrapper) to provide consistent spacing for varying screen heights.

---

## 7. Color System
The updated colors are declared in `globals.css` using Tailwind v4 theme directives:

| Variable Name | Hex Code / Value | Usage |
| :--- | :--- | :--- |
| `--color-bg0` | `#04060A` | Deep Pitch Black (Main Canvas) |
| `--color-bg1` | `#080C12` | Dark Obsidian (Sidebar Backgrounds) |
| `--color-bg2` | `#0E141D` | Surface Black (Cards & Panels) |
| `--color-bg3` | `#131B27` | Soft Dark Slate (Dropdowns & Accents) |
| `--color-neon` | `#00FF88` | Bright Neon Green (Primary Accents) |
| `--color-border-g` | `rgba(0, 255, 136, 0.12)` | Low-glow Green Borders |
| `--color-border-g2` | `rgba(0, 255, 136, 0.25)` | Mid-glow Green Borders |
| `--color-amber` | `#FFC857` | Golden Warning Amber |
| `--color-red` | `#FF4D6D` | Crimson / AI Strikes Red |
| `--color-cyan` | `#00E5FF` | Cyber Cyan (Information Readouts) |
| `--color-blue` | `#3B82F6` | Secondary Navy Blue |
| `--color-purple` | `#8B5CF6` | Sector Purple Accent |
| `--color-text` | `#E2E8F0` | High-visibility White Text |
| `--color-text2` | `#94A3B8` | Muted Gray-blue Captions |

---

## 8. Typography
* **Primary Display**: `'Orbitron', sans-serif` (uppercase, wide tracking `[3px]` - `[5px]`) for names, titles, and headers.
* **Secondary Labels**: `'Rajdhani', sans-serif` (bold, tracking `[1px]`) for buttons, descriptions, and selectors.
* **Data & Consoles**: `'Share Tech Mono', monospace` for counts, times, code logs, and lists.

---

## 9. Animation System
* **Pulse Glowing Light**: `animate-pulse shadow-[0_0_12px_#00FF88]` on the top-left status node.
* **Infinite Grid Scroll**: `@keyframes gridMove` shifts background vectors along axes:
  ```css
  @keyframes gridMove {
    0% { background-position: 0 0; }
    100% { background-position: 48px 48px; }
  }
  ```
* **Blinking Indicator**: `animate-blink` for critical time indicators under 10 minutes.
* **Scroll Shimmer effect**: `animate-scan-shimmer` on grid background overlays.

---

## 10. Icons
* Added **`Tv`** from `lucide-react` to denote the `LIVE NET STATUS` scoreboard container header.

---

## 11. Responsive Changes
* **Desktop Layout**: Wide triple-column layout: Left column = 10 Missions, Center column = Mission content & solution submit, Right column = Scoreboard logs.
* **Mobile / Tablet Layout**: Collapses columns to a single-column layout with vertical flow. Sidebar columns collapse to full-width cards beneath the main Mission panel.

---

## 12. Browser Metadata
* **Document Title**: Updated in [layout.tsx](file:///c:/Project/Cyberhunt/CyberHunt/src/app/layout.tsx) to `"Operation Vault | CyberHunt"`.
* **Favicon**: Managed dynamically by Next.js in [icon.tsx](file:///c:/Project/Cyberhunt/CyberHunt/src/app/icon.tsx).

---

## 13. Assets
* Dynamic Favicon asset generation inside the Next.js compilation boundary via `src/app/icon.tsx`.
* CSS radial grid-gradients constructed through utility classes (no external static images required).

---

## 14. CSS Changes
We introduced several global classes at the bottom of `globals.css`:
* **`.bg-grid-pattern`**: Renders grid lines.
* **`.cyber-bg`**, **`.cyber-grid`**, **`.cyber-scanlines`**, **`.cyber-vignette`**: Combine to form the main tactical container background.
* **`.cyber-tactical-panel`**: General card structure styled with low-opacity green borders, hover states, and smooth shadows.
* **`.text-glow-green` / `.text-glow-red` / `.text-glow-amber`**: Adds text luminescence.

---

## 15. Dependencies
No new external npm packages were installed for this UI update. Standard next-generation package setups are assumed:
* `@import "tailwindcss"` (Tailwind v4 syntax support).
* `lucide-react` (icons library).

---

## 16. Migration Checklist

- [ ] **Step 1: CSS Theme Overrides**
  - Update [globals.css](file:///c:/Project/Cyberhunt/CyberHunt/src/app/globals.css) with new `@theme` colors, custom text-glow rules, CRT scan lines, scrollbars, and helper animations.
- [ ] **Step 2: Title Updates**
  - Change metadata title to `"Operation Vault | CyberHunt"` in [layout.tsx](file:///c:/Project/Cyberhunt/CyberHunt/src/app/layout.tsx).
- [ ] **Step 3: Add Favicon Creator**
  - Create the dynamic OG image favicon in [icon.tsx](file:///c:/Project/Cyberhunt/CyberHunt/src/app/icon.tsx).
- [ ] **Step 4: Restructure Top Bar**
  - Increase header height, insert status indicators, and adjust flex grid parameters in [page.tsx](file:///c:/Project/Cyberhunt/CyberHunt/src/app/dashboard/page.tsx).
- [ ] **Step 5: Modify Level Grid**
  - Replace numeric layout buttons with text identifiers (`MISSION 01` etc.) inside the left sidebar.
- [ ] **Step 6: Reposition Scoreboard**
  - Relocate the scoreboard map function from the left sidebar to the right sidebar, renaming the heading to `LIVE NET STATUS` and applying two-digit padding.
- [ ] **Step 7: Strip Fragment List**
  - Delete the old vertical fragment secure/pending check list from the right column layout.
- [ ] **Step 8: Clean Center Column Margins**
  - Update margin spacings (`mt-2 pt-2`) on the transmit solution form container.

---

## 17. Files That Should NOT Be Copied
Do **NOT** copy or migrate any backend files from this branch:
* 🚫 `src/app/api/admin/auth/route.ts` (Handles admin credentials normalization)
* 🚫 `src/app/api/auth/login/route.ts` (Handles session cookie configurations)
* 🚫 `middleware.ts` (Access validation middleware)
* 🚫 `scripts/` (Database seed and operational scripts)
* 🚫 `.env.local` / `.env.example` (Server access keys and secret keys)
