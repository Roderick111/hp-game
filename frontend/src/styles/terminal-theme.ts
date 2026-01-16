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
      /** Narrator (gray) */
      narrator: {
        text: 'text-gray-300',
        border: 'border-gray-400',
        bg: 'bg-gray-800/30',
      },
      /** Tom Riddle's ghost (amber with special styling) */
      tom: {
        text: 'text-gray-300',
        prefix: 'text-amber-500',
        border: 'border-amber-600',
        bg: 'bg-amber-900/20',
        label: 'text-amber-500',
      },
    },
    /** State-based colors for feedback */
    state: {
      /** Error states */
      error: {
        text: 'text-red-400',
        border: 'border-red-700',
        bg: 'bg-red-900/30',
        bgLight: 'bg-red-900/10',
      },
      /** Success states */
      success: {
        text: 'text-green-400',
        border: 'border-green-700',
        bg: 'bg-green-900/30',
      },
      /** Warning states */
      warning: {
        text: 'text-yellow-400',
        border: 'border-yellow-700',
        bg: 'bg-yellow-900/30',
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
    /** Bracket close for terminal patterns */
    closeButton: '[X]',
    /** Input prefix for player actions */
    inputPrefix: '>',
    /** Separator line (32 chars) */
    separator: '\u2500'.repeat(32), // ────────────────────────────────
    /** Short separator (20 chars) */
    separatorShort: '\u2500'.repeat(20),
    /** Filled block for progress bars */
    blockFilled: '\u2588', // █
    /** Empty block for progress bars */
    blockEmpty: '\u2591', // ░
    /** Arrow up */
    arrowUp: '\u2191', // ↑
    /** Arrow down */
    arrowDown: '\u2193', // ↓
    /** Arrow right */
    arrowRight: '\u2192', // →
    /** Double arrow right */
    doubleArrowRight: '\u00bb', // »
    /** Checkmark */
    checkmark: '\u2713', // ✓
    /** Warning */
    warning: '\u26a0', // ⚠
  },
  /** Speaker label formats for consistent dialogue */
  speakers: {
    /** Player/Detective format */
    detective: {
      prefix: '>',
      label: 'DETECTIVE',
      format: (text: string) => `> ${text}`,
    },
    /** Witness format */
    witness: {
      format: (name: string) => `:: ${name.toUpperCase()} ::`,
    },
    /** Tom Riddle format */
    tom: {
      prefix: 'TOM:',
      label: 'TOM',
    },
    /** System messages */
    system: {
      prefix: '!',
    },
  },
  /** System message templates */
  messages: {
    /** Error message format */
    error: (msg: string) => `[ SYSTEM_ERROR ] ${msg}`,
    /** Secret discovered format */
    secretDiscovered: '[ SECRET DISCOVERED ]',
    /** Spirit resonance format */
    spiritResonance: (name: string) => `[ SPIRIT RESONANCE: ${name.toUpperCase()} ]`,
    /** Evidence discovered format */
    evidenceDiscovered: (id: string) => `+ Evidence: ${id}`,
  },
  /** Visual effects */
  effects: {
    /** Scanline overlay for CRT effect */
    scanlines: 'bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50',
    /** Corner bracket decorations */
    cornerBrackets: {
      topLeft: 'absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-400',
      topRight: 'absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-400',
      bottomLeft: 'absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-400',
      bottomRight: 'absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-400',
    },
    /** Text glow effects */
    glow: {
      amber: 'terminal-glow-amber',
      green: 'terminal-glow-green',
    },
  },
  /** Animation classes */
  animation: {
    /** Fade in */
    fadeIn: 'animate-fadeIn',
    /** Pulse subtle */
    pulse: 'animate-pulse',
    /** Pulse very subtle */
    pulseSubtle: 'animate-pulse-subtle',
    /** Cursor blink */
    cursorBlink: 'animate-cursor-blink',
    /** Screen flicker */
    screenFlicker: 'animate-screen-flicker',
    /** Slide up (for dropups) */
    slideUp: 'animate-slide-up',
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
      /** Terminal-style action button */
      terminalAction: 'py-2.5 px-4 flex items-center gap-3 border border-gray-600 bg-gray-900 text-gray-300 transition-all duration-200 font-mono text-xs uppercase tracking-widest group hover:border-amber-500/50 hover:text-amber-400 hover:bg-gray-800 rounded-sm',
    },
    /** Card/Panel base styles */
    card: {
      base: 'font-mono bg-gray-900 text-gray-100 border-gray-700',
    },
    /** Input field with terminal prefix */
    input: {
      /** Container wrapper */
      wrapper: 'relative group w-full',
      /** Prefix styling (absolute positioned) */
      prefix: 'absolute top-3 left-3 text-gray-500 font-bold select-none',
      /** Base textarea/input field */
      field: 'w-full bg-gray-900 text-gray-100 border rounded-sm p-3 pl-8 pr-10 placeholder-gray-600 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-mono tracking-wide',
      /** Default border state */
      borderDefault: 'border-gray-600 focus:border-gray-400 focus:bg-gray-800',
      /** Special border (Tom/amber) */
      borderSpecial: 'border-amber-600/50 focus:border-amber-500 focus:bg-gray-800',
      /** Send button */
      sendButton: 'absolute right-3 bottom-3 px-3 py-1 border border-gray-600 rounded-sm bg-gray-800 text-gray-400 hover:border-amber-500 hover:text-amber-400 hover:bg-gray-800 text-xs uppercase font-bold tracking-wide disabled:opacity-0 transition-all duration-200',
    },
    /** Message bubbles for conversations */
    message: {
      /** Player message */
      player: {
        wrapper: 'border-l border-blue-500 pl-3 py-1',
        text: 'text-blue-400 text-sm',
        prefix: 'text-gray-500',
      },
      /** Narrator message */
      narrator: {
        wrapper: 'border-l border-gray-400 pl-3 py-1',
        text: 'text-gray-300 text-sm leading-relaxed whitespace-pre-line',
      },
      /** Tom's ghost message */
      tom: {
        wrapper: 'border-l border-amber-600 pl-3 py-1',
        text: 'text-sm leading-relaxed text-gray-300',
        label: 'text-amber-500 font-bold mr-2',
      },
      /** Evidence tag */
      evidence: {
        wrapper: 'border-l border-gray-700 pl-3 py-1',
        tag: 'inline-block bg-gray-800 text-gray-200 px-2 py-0.5 rounded border border-gray-600 mr-1',
      },
      /** Witness conversation bubble */
      witness: {
        wrapperPlayer: 'max-w-[85%] border-l border-blue-500 pl-3 py-1',
        wrapperWitness: 'max-w-[85%] border-l border-amber-600 pl-3 py-1 bg-gray-900/30',
        label: 'text-xs uppercase tracking-widest font-bold',
        text: 'text-sm text-gray-200 leading-relaxed whitespace-pre-line',
      },
    },
    /** Section separator with centered label */
    sectionSeparator: {
      wrapper: 'flex items-center gap-3 mb-2 opacity-60',
      line: 'h-px bg-gray-600 flex-1',
      label: 'text-[10px] text-gray-400 uppercase tracking-widest font-bold',
    },
    /** Trust meter thresholds */
    trustMeter: {
      /** Get color based on trust level */
      getColor: (level: number): string => {
        if (level < 30) return 'text-red-400';
        if (level < 70) return 'text-yellow-400';
        return 'text-green-400';
      },
      wrapper: 'w-full font-mono mt-4 mb-6 text-center',
      container: 'text-xs text-gray-500 tracking-widest border border-gray-700 bg-gray-800/30 p-2 rounded',
      label: 'font-bold mr-2 text-gray-400',
    },
  },
} as const;

/**
 * Helper to generate ASCII progress bar
 * @param value - Current value (0-100)
 * @param total - Total segments (default 10)
 * @returns ASCII bar like "████░░░░░░"
 * @example
 * generateAsciiBar(75, 10) // "███████░░░"
 */
export function generateAsciiBar(value: number, total = 10): string {
  const filled = Math.floor((value / 100) * total);
  const empty = total - filled;
  return TERMINAL_THEME.symbols.blockFilled.repeat(filled) +
    TERMINAL_THEME.symbols.blockEmpty.repeat(empty);
}

export type TerminalTheme = typeof TERMINAL_THEME;
