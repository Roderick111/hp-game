# Documentation Research: Phase 5.1 - Menu System Foundation

**Date**: 2026-01-12
**Phase**: Phase 5.1 - Main Menu System Foundation
**Docs Found**: 3 critical libraries (official sources)
**Project Context**: Terminal UI aesthetic, keyboard-first interaction, dark theme

---

## 1. Radix UI Primitives - Dialog Component

**URL**: https://www.radix-ui.com/docs/primitives
**Type**: Official Component Library Documentation
**Relevance**: Core accessibility framework for menu modal with focus management, ESC key handling, and keyboard navigation. Zero-dependency, production-ready, widely used in professional applications.

### Key Patterns Extracted

#### Pattern 1: Dialog with Proper Focus Management
```jsx
import * as Dialog from '@radix-ui/react-dialog';
import React from 'react';

export function MenuDialog() {
  const [open, setOpen] = React.useState(false);
  const closeButtonRef = React.useRef(null);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="px-4 py-2">Menu (ESC to close)</button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-amber-600 rounded"
          onOpenAutoFocus={(event) => {
            // Focus first menu item instead of close button
            closeButtonRef.current?.focus();
            event.preventDefault();
          }}
          onEscapeKeyDown={() => setOpen(false)}
        >
          <Dialog.Title className="text-amber-400 font-bold mb-4">MENU</Dialog.Title>

          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400">
              1. Resume Game
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400">
              2. Save Game
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400">
              3. Load Game
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400">
              4. Settings
            </button>
            <button
              ref={closeButtonRef}
              className="w-full text-left px-4 py-2 hover:bg-amber-600 focus-visible:ring-2 focus-visible:ring-amber-400"
              onClick={() => setOpen(false)}
            >
              5. Return to Game
            </button>
          </div>

          <Dialog.Close asChild>
            <button className="absolute top-2 right-2 text-amber-400 hover:text-white">✕</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

**Usage**: Opens menu modal with proper focus management. ESC key automatically closes via `onEscapeKeyDown`. Focus starts at close button (menu item 5) for immediate keyboard navigation.

**Gotcha**: Must use `Dialog.Portal` to render outside DOM hierarchy (prevents z-index issues). `onOpenAutoFocus` requires `event.preventDefault()` to override default behavior.

#### Pattern 2: ESC Key Automatic Handling
```jsx
// Radix Dialog handles ESC automatically via onEscapeKeyDown
<Dialog.Content
  onEscapeKeyDown={() => {
    // Fires when ESC pressed - automatic
    // No need for manual useEffect keyboard listener
    setOpen(false);
  }}
>
```

**Usage**: ESC key is handled by Radix Dialog component automatically—no manual `addEventListener` needed. Clean, accessible, follows WAI-ARIA standards.

**Gotcha**: This only works inside Dialog.Content. If you need ESC outside Dialog, use `useEffect` with keyboard listener.

#### Pattern 3: Focus Ring with Keyboard Navigation
```jsx
// Apply focus-visible ring to all menu buttons
<button className="px-4 py-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none">
  Menu Item
</button>
```

**Usage**: Tailwind's `focus-visible` only shows ring when navigating via keyboard (not mouse). Terminal aesthetic + accessibility.

**Gotcha**: Use `focus-visible`, NOT `focus`. `focus:` applies to both keyboard and mouse clicks (annoying for UX).

---

## 2. React 18 - Keyboard Event Handling & Effect Cleanup

**URL**: https://18.react.dev/reference/react-dom/components/common
**Type**: Official React Documentation
**Relevance**: Keyboard event API patterns, useEffect cleanup for event listeners, ESC key detection. Foundational for menu keyboard shortcuts and proper memory management.

### Key Patterns Extracted

#### Pattern 1: Global ESC Key Handler (Manual)
```jsx
import { useEffect, useState } from 'react';

export function useMenuKeyboard(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return; // Only listen when menu open

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      // Arrow navigation
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        // Handle menu item focus shifting
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    // CRITICAL: Cleanup to prevent memory leaks
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
}

// Usage in component
export function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  useMenuKeyboard(isOpen, () => setIsOpen(false));

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Menu</button>
      {isOpen && <MenuContent />}
    </>
  );
}
```

**Usage**: Listen for ESC key globally. CRITICAL: cleanup function removes listener (prevents duplicate listeners on re-renders).

**Gotcha 1**: Must check `isOpen` condition—otherwise listener runs even when menu closed (performance waste).

**Gotcha 2**: Must include `isOpen` in dependency array. If omitted, stale state captured in closure.

**Gotcha 3**: Always cleanup in return statement. Missing cleanup = memory leaks + double-trigger bugs.

#### Pattern 2: Keyboard Event Properties
```jsx
function handleKeyDown(e) {
  // e.key: "Escape", "Enter", "ArrowUp", "ArrowDown", etc.
  // e.code: "Escape", "Enter", "ArrowUp", "ArrowDown" (keyboard layout-independent)
  // e.ctrlKey, e.metaKey, e.shiftKey: modifier detection

  if (e.key === 'Escape') {
    e.preventDefault(); // Prevent default behavior
    onClose();
  }

  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    // Save game (Ctrl+S shortcut)
  }
}
```

**Usage**: `e.key` best for user-facing shortcuts. `e.code` for position-based shortcuts (WASD movement).

**Gotcha**: Use `e.key === 'Escape'`, NOT `e.key === 'Esc'` (wrong format). Use `e.code === 'Escape'` if checking keyboard position instead.

#### Pattern 3: Subscriber Pattern with Cleanup
```jsx
useEffect(() => {
  function handleScroll(e) {
    console.log(window.scrollX, window.scrollY);
  }

  // Subscribe
  window.addEventListener('scroll', handleScroll);

  // REQUIRED: Unsubscribe in cleanup
  return () => window.removeEventListener('scroll', handleScroll);
}, []); // Empty dependency = run once on mount
```

**Usage**: Standard pattern for all event listeners. Subscribe in effect, unsubscribe in cleanup.

**Gotcha**: Missing cleanup = listener never removed, accumulates with each component mount (critical bug).

---

## 3. Tailwind CSS V3 - Dark Mode & Focus States

**URL**: https://v3.tailwindcss.com/docs/dark-mode
**Type**: Official Framework Documentation
**Relevance**: Dark theme styling for menu modal (matches terminal aesthetic), keyboard focus ring visibility, accessible color contrast for amber/gray scheme.

### Key Patterns Extracted

#### Pattern 1: Dark Mode Menu Styling
```html
<!-- Base light mode (fallback) + dark mode override -->
<div class="bg-white dark:bg-gray-900
            border border-gray-200 dark:border-amber-600
            rounded-lg">
  <div class="text-gray-900 dark:text-white">Menu Title</div>
  <button class="text-gray-700 dark:text-amber-400
                 hover:bg-gray-100 dark:hover:bg-amber-900/30">
    Menu Item
  </button>
</div>
```

**Usage**: Apply light mode classes first, then add `dark:` variants for dark mode. When `class="dark"` on `<html>` or prefers-color-scheme=dark, dark: classes activate.

**Gotcha 1**: Tailwind doesn't apply dark mode automatically—must configure in `tailwind.config.js` with `darkMode: 'class'` or `'media'`.

**Gotcha 2**: Color contrast matters—gray-900 on amber-400 may fail WCAG. Use amber-400 text on gray-900 background (good), not reversed.

#### Pattern 2: Focus Ring with Dark Mode
```html
<!-- Keyboard focus ring, visible in both light + dark -->
<button class="focus:outline-none
               focus-visible:ring-2
               focus-visible:ring-amber-400">
  Menu Item
</button>
```

**Usage**: `focus-visible` shows ring only on keyboard focus (not mouse). Amber ring visible on dark gray background.

**Gotcha**: Use `focus-visible`, NOT `focus`. `focus:` fires on mouse click (annoying visual feedback in terminal UI).

#### Pattern 3: Terminal Aesthetic - Dark Gray + Amber
```html
<div class="bg-gray-900 dark:bg-gray-950">
  <!-- Dark background -->
  <h1 class="text-amber-400 dark:text-amber-300 font-mono font-bold">
    MENU
  </h1>
  <!-- Amber text for emphasis (terminal theme) -->
  <button class="text-gray-300 dark:text-gray-400
                 hover:text-white dark:hover:text-amber-400
                 focus-visible:ring-amber-400">
    Option
  </button>
</div>
```

**Usage**: Dark gray (900-950) background + amber (300-400) text = terminal aesthetic. Matches existing game UI.

**Gotcha**: Don't use pure black (#000). Use gray-900 or gray-950 for better text contrast and reduced eye strain.

---

## Quick Reference: Essential APIs

### Radix Dialog API
```jsx
<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Trigger>Trigger</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content
      onEscapeKeyDown={() => {}}
      onOpenAutoFocus={e => {}}
    >
      {children}
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### React Keyboard Listener Pattern
```jsx
useEffect(() => {
  function handle(e) {
    if (e.key === 'Escape') onClose();
  }
  window.addEventListener('keydown', handle);
  return () => window.removeEventListener('keydown', handle);
}, [onClose]);
```

### Tailwind Focus & Dark Mode
```jsx
// Focus ring visible only on keyboard nav
<button className="focus-visible:ring-2 focus-visible:ring-amber-400
                   dark:hover:bg-amber-900/20">
  Item
</button>
```

---

## Integration Checklist

- [ ] **Radix Dialog** installed: `bun add @radix-ui/react-dialog`
- [ ] Dialog wraps menu content (Modal.tsx enhanced)
- [ ] ESC closes menu via `onEscapeKeyDown` (no manual listener needed)
- [ ] First menu item focused via `onOpenAutoFocus` (keyboard nav starts immediately)
- [ ] Focus ring visible: `focus-visible:ring-2 focus-visible:ring-amber-400`
- [ ] Dark mode: `dark:bg-gray-900 dark:text-amber-400` (matches game theme)
- [ ] Menu items are buttons (semantic HTML)
- [ ] Keyboard shortcuts documented (1-5 for menu options, ESC to close)
- [ ] Tests: ESC closes, Tab navigates, Enter selects
- [ ] Accessibility: aria-labels on buttons, semantic heading

---

## Strong Patterns for RESEARCH.md

### Frontend: Menu Modal
- **Radix Dialog**: Focus management + ESC handling (official React primitive)
- **Pattern**: `Dialog.Root` + `Portal` for proper z-index, `onEscapeKeyDown` for ESC
- **Benefits**: Zero extra dependencies beyond Radix (already evaluate for Phase 4.5), WAI-ARIA compliant

### Frontend: Keyboard Navigation
- **React Hooks**: `useEffect` + `addEventListener` with cleanup
- **Pattern**: Check `isOpen` condition, include deps in array, cleanup in return
- **Benefits**: Simple, no external library needed for custom shortcuts

### Frontend: Styling
- **Tailwind Dark Mode**: `dark:` prefix for night theme
- **Pattern**: `focus-visible` for keyboard-only ring, not `focus:`
- **Benefits**: Matches existing terminal aesthetic (gray-900 + amber-400)

---

## Summary

**Total Patterns**: 8 extracted across all docs
**Confidence**: HIGH - all from official sources (Radix, React, Tailwind)
**Coverage**: Complete for Phase 5.1 requirements:
  - ✅ Dialog modal with ESC handling
  - ✅ Keyboard focus management
  - ✅ Dark theme styling
  - ✅ Accessibility patterns
  - ✅ Memory-safe event listeners

**KISS Applied**: Only critical APIs extracted, max 500 lines, actionable code examples

---

**Next Step**: fastapi-specialist will implement backend save/load endpoints. React-vite-specialist will build menu modal using Radix Dialog + keyboard patterns documented here.

