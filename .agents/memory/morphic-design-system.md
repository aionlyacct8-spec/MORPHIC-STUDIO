---
name: Morphic Studio Design System
description: Design tokens, color palette, typography, component library, UX philosophy, and screen layout patterns
---

# Morphic Studio Design System

## UX Philosophy
- **"Invisible Interface"** — the UI disappears into the creative work; tools surface only when needed
- **Progressive Disclosure** — advanced options hidden until relevant; beginners not overwhelmed
- **Creator-First** — every interaction optimized for creative flow, not feature demonstration
- **Persistent Context** — the app always knows where you are in your project; no lost state
- **AI as Co-Pilot** — AI suggestions appear inline, non-intrusively; always dismissible

## Visual Identity
- **Aesthetic:** Dark, cinematic, professional — inspired by professional video/film editing suites
- **Mood:** Premium, focused, immersive — workspace that feels like a creative studio
- **Brand tone:** Confident, enabling, creative-professional

## Color Palette (Design Tokens)
- **Background primary:** Deep dark (near-black) — `#0A0A0F` or similar
- **Background secondary:** Dark surface — `#12121A`
- **Background tertiary:** Elevated card surface — `#1A1A26`
- **Accent primary:** Electric purple/violet — brand signature color
- **Accent secondary:** Cyan/teal — interactive highlights
- **Success:** Green
- **Warning:** Amber
- **Error:** Red
- **Text primary:** Near-white `#F0F0F8`
- **Text secondary:** Muted gray `#8888AA`
- **Border:** Subtle `#2A2A3A`

## Typography
- **Display/Heading:** Modern geometric sans-serif (e.g., Inter, Satoshi, or similar)
- **Body:** Clean readable sans-serif at 14–16px base
- **Monospace:** Code/script editor uses monospace font
- **Scale:** Modular type scale — H1 through H6 + body + caption
- **Weight range:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

## Layout Patterns
- **Studio Layout:** Three-panel — left sidebar (tools/layers), center canvas/editor, right panel (properties/AI)
- **Dashboard:** Card grid with project thumbnails, status badges, quick actions
- **Navigation:** Persistent top nav with project context; collapsible left sidebar
- **Modal/Dialogs:** Centered overlays with backdrop blur for focus tasks
- **Panels:** Resizable, collapsible — user controls their workspace layout

## Component Library
- **Buttons:** Primary (filled accent), Secondary (outlined), Ghost (text-only), Icon buttons
- **Inputs:** Text, Textarea, Select, Slider, Toggle, Color picker, File upload
- **Cards:** Project card, Asset card, Character card — all with thumbnail + metadata
- **Panels:** Collapsible sidebar panels with section headers
- **Toolbars:** Horizontal strip with icon buttons + active state indicators
- **Canvas:** Main editing area — zoomable, pannable, with grid overlay option
- **Timeline:** Horizontal scrollable timeline (for Animation Studio)
- **Modals:** Confirmation dialogs, settings panels, AI generation progress
- **Toast/Notifications:** Non-blocking corner notifications for job completions
- **Progress indicators:** Linear progress bars, circular spinners, step indicators
- **AI Suggestion Cards:** Inline suggestion bubbles with accept/dismiss/modify actions

## Interaction Patterns
- **Drag and drop:** Assets from library onto canvas
- **Context menus:** Right-click on canvas elements
- **Keyboard shortcuts:** Comprehensive shortcut system (Photoshop/Premiere-inspired)
- **Undo/Redo:** Full history stack per session + Creative Timeline checkpoints
- **Zoom:** Scroll to zoom on canvas; fit-to-screen shortcut
- **Multi-select:** Shift+click, lasso select on canvas

## Accessibility
- WCAG AA contrast ratios enforced for text on dark backgrounds
- Keyboard navigation for all core flows
- ARIA labels on interactive elements
- Focus indicators visible

## Responsive Strategy
- **Primary target:** Desktop (1440px+) — pro creative tools need screen space
- **Secondary:** Laptop (1280px) — condensed panels, preserved functionality
- **Mobile:** View-only / review mode — not a creation surface
