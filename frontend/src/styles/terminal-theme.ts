/**
 * Terminal Theme Design Tokens
 *
 * Centralized design system for consistent minimal B&W terminal aesthetic.
 * All panels should use these tokens for colors, spacing, and typography.
 *
 * @module styles/terminal-theme
 * @since Phase 5.3.1 (Design System)
 */

export const TERMINAL_THEME = {
  colors: {
    text: {
      /** Primary text - headers, important content */
      primary: 'text-white',
      /** Secondary text - body content */
      secondary: 'text-gray-200',
      /** Tertiary text - supporting content */
      tertiary: 'text-gray-400',
      /** Muted text - helper/footer text */
      muted: 'text-gray-500',
      /** Separator line color */
      separator: 'text-gray-600',
    },
    bg: {
      /** Primary background */
      primary: 'bg-gray-900',
      /** Hover state background */
      hover: 'bg-gray-800',
      /** Active/selected state */
      active: 'bg-gray-700',
      /** Semi-transparent background */
      semiTransparent: 'bg-gray-800/50',
    },
    border: {
      /** Default border */
      default: 'border-gray-700',
      /** Hover state border */
      hover: 'border-gray-500',
      /** Separator line */
      separator: 'border-gray-700',
    },
    /** Amber/gold for interactive elements (magical terminal style) */
    interactive: {
      /** Amber text for clickable items */
      text: 'text-amber-400',
      /** Brighter amber on hover */
      hover: 'hover:text-amber-300',
      /** Amber border */
      border: 'border-amber-500/50',
      /** Amber border on hover */
      borderHover: 'hover:border-amber-400',
    },
    /** Character-specific colors for dialogue differentiation */
    character: {
      /** Blue for the Detective (Player) */
      detective: {
        text: 'text-blue-300',
        prefix: 'text-blue-500',
        border: 'border-blue-500',
        bg: 'bg-blue-900/10',
      },
      /** Amber for Witnesses */
      witness: {
        text: 'text-amber-400',
        prefix: 'text-amber-500',
        border: 'border-amber-600',
        bg: 'bg-amber-900/10',
      },
      /** Purple for System/Secrets */
      system: {
        text: 'text-purple-300',
        prefix: 'text-purple-500',
        border: 'border-purple-900',
        bg: 'bg-purple-900/10',
      },
    },
  },
  spacing: {
    /** Gap between major panels */
    panelGap: 'mb-6',
    /** Gap between sections within a panel */
    sectionGap: 'mb-3',
    /** Gap between individual items */
    itemGap: 'mb-2',
    /** Internal padding for panels */
    panelPadding: 'p-4',
  },
  typography: {
    /** Panel headers - uppercase, white, tracking */
    header: 'text-white font-mono uppercase text-sm tracking-wide',
    /** Large headers */
    headerLg: 'text-white font-mono uppercase text-xl font-bold tracking-wide',
    /** Body text */
    body: 'text-gray-200 font-mono text-sm',
    /** Small body text */
    bodySm: 'text-gray-200 font-mono text-xs',
    /** Caption/label text */
    caption: 'text-gray-400 font-mono text-xs uppercase tracking-wider',
    /** Helper/footer text with asterisk prefix */
    helper: 'text-gray-500 font-mono text-xs',
    /** Separator line text */
    separator: 'text-gray-600 font-mono text-xs',
  },
  symbols: {
    /** Current/active item indicator */
    current: '\u25b8', // ▸
    /** Inactive/other item indicator */
    other: '\u00b7', // ·
    /** Bullet point */
    bullet: '\u2022', // •
    /** Prefix symbol for list items */
    prefix: '\u25b8', // ▸
    /** Block symbol for headers/titles */
    block: '\u2588', // █
    /** Cross/X symbol for exit/close actions */
    cross: '\u00d7', // ×
    /** Separator line (32 chars) */
    separator: '\u2500'.repeat(32), // ────────────────────────────────
    /** Short separator (20 chars) */
    separatorShort: '\u2500'.repeat(20),
    /** Filled block for progress bars */
    blockFilled: '\u2588', // █
    /** Empty block for progress bars */
    blockEmpty: '\u2591', // ░
  },
  /** Component-specific styles */
  components: {
    /** Button base styles */
    button: {
      base: 'w-full text-left p-3 rounded border transition-colors',
      default: 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800',
      selected: 'bg-gray-800 border-gray-500 cursor-default',
      disabled: 'opacity-50 cursor-not-allowed',
      focus: 'focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none',
    },
    /** Card/Panel base styles */
    card: {
      base: 'font-mono bg-gray-900 text-gray-100 border-gray-700',
    },
  },
} as const;

/**
 * Helper to generate ASCII progress bar
 * @param value - Current value (0-100)
 * @param total - Total segments (default 10)
 * @returns ASCII bar like "████░░░░░░"
 */
export function generateAsciiBar(value: number, total = 10): string {
  const filled = Math.floor((value / 100) * total);
  const empty = total - filled;
  return TERMINAL_THEME.symbols.blockFilled.repeat(filled) +
    TERMINAL_THEME.symbols.blockEmpty.repeat(empty);
}

export type TerminalTheme = typeof TERMINAL_THEME;
