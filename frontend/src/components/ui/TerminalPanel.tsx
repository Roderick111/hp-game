/**
 * TerminalPanel Component
 *
 * Reusable panel wrapper for consistent minimal B&W terminal aesthetic.
 * Provides standardized header, separator, content area, and optional footer.
 *
 * Structure:
 * ```
 * SECTION TITLE
 * ────────────────────────────────
 * content here
 *
 * * helper text (optional footer)
 * ```
 *
 * @module components/ui/TerminalPanel
 * @since Phase 5.3.1 (Design System)
 */

import { ReactNode, useState } from 'react';
import { TERMINAL_THEME } from '../../styles/terminal-theme';

// ============================================
// Types
// ============================================

interface TerminalPanelProps {
  /** Panel title (displayed uppercase) */
  title: string;
  /** Panel content */
  children: ReactNode;
  /** Optional footer helper text (prefixed with *) */
  footer?: string;
  /** Optional additional CSS classes */
  className?: string;
  /** Optional subtitle/count display */
  subtitle?: string;
  /** Whether panel can be collapsed (default: false) */
  collapsible?: boolean;
  /** Initial collapsed state if collapsible (default: false) */
  defaultCollapsed?: boolean;
  /** Optional key to persist collapsed state in localStorage */
  persistenceKey?: string;
}

// ============================================
// Component
// ============================================

export function TerminalPanel({
  title,
  children,
  footer,
  className = '',
  subtitle,
  collapsible = false,
  defaultCollapsed = false,
  persistenceKey,
}: TerminalPanelProps) {
  // Initialize state from localStorage if key exists, otherwise use default
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (persistenceKey) {
      const saved = localStorage.getItem(persistenceKey);
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return defaultCollapsed;
  });

  const toggleCollapsed = () => {
    if (collapsible) {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      // Save to localStorage if key provided
      if (persistenceKey) {
        localStorage.setItem(persistenceKey, String(newState));
      }
    }
  };

  return (
    <div
      className={`
        font-mono bg-gray-900 text-gray-100 border border-gray-700 rounded-lg p-4
        ${className}
      `}
    >
      {/* Header */}
      <div
        className={`${isCollapsed ? 'mb-0' : 'mb-3'} ${collapsible ? 'cursor-pointer group select-none' : ''}`}
        onClick={toggleCollapsed}
      >
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            {collapsible && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transform transition-transform duration-200 text-gray-500 group-hover:text-white ${isCollapsed ? '' : 'rotate-180'}`}
              >
                {/* Up/Down Arrow (Chevron Up by default, rotated 180 for down/open) */}
                {/* Actually, user requested: "arrow directed up to indicate [...] expand". So COLLAPSED = UP ARROW. */}
                {/* When open (not collapsed), maybe point DOWN to close? */}
                {/* Let's double check user req: "arrow directed up to indicate that the user can expand". */}
                {/* Chevron Up is standard "collapse" icon usually, but user specific "Up to Expand" means: Collapsed state = Up Arrow. */}
                {/* Open state = Down Arrow? Or just rotate. */}
                {/* Let's aim for: Collapsed (Up Arrow), Open (Down Arrow). */}
                {/* Default Chevron Up: d="m18 15-6-6-6 6" */}
                {/* If isCollapsed (needs expansion) -> Show Up. */}
                {/* If !isCollapsed (open) -> Show Down (Rotate 180). */}
                <path d="m18 15-6-6-6 6" />
              </svg>
            )}
            <h3 className={`font-mono uppercase text-sm font-bold tracking-wide transition-colors ${collapsible ? 'group-hover:text-amber-400' : 'text-white'}`}>
              {title}
            </h3>
          </div>

          {subtitle && (
            <span className="text-gray-400 font-mono text-xs">
              {subtitle}
            </span>
          )}
        </div>

        {/* Separator line - Hide when collapsed */}
        {!isCollapsed && (
          <div className="text-gray-600 font-mono text-xs mt-1">
            {TERMINAL_THEME.symbols.separator}
          </div>
        )}
      </div>

      {/* Content - Conditionally Hidden */}
      {!isCollapsed && (
        <div className="text-gray-200 font-mono text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}

      {/* Footer helper text - Hide when collapsed */}
      {!isCollapsed && footer && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-gray-500 font-mono text-xs">
            * {footer}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Sub-components for common patterns
// ============================================

interface TerminalListItemProps {
  /** Item content */
  children: ReactNode;
  /** Whether item is currently selected/active */
  isActive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether item is disabled */
  disabled?: boolean;
  /** Prefix symbol (defaults to bullet or active indicator) */
  prefix?: string;
  /** Additional CSS classes */
  className?: string;
}

export function TerminalListItem({
  children,
  isActive = false,
  onClick,
  disabled = false,
  prefix,
  className = '',
}: TerminalListItemProps) {
  const defaultPrefix = isActive
    ? TERMINAL_THEME.symbols.current
    : TERMINAL_THEME.symbols.other;

  const itemPrefix = prefix ?? defaultPrefix;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full text-left p-2 rounded border transition-colors
          ${isActive
            ? 'bg-gray-800 border-gray-500 cursor-default'
            : 'bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          <span className={isActive ? 'text-white' : 'text-gray-400'}>
            {itemPrefix}
          </span>
          {children}
        </div>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-2 ${className}`}>
      <span className={isActive ? 'text-white' : 'text-gray-400'}>
        {itemPrefix}
      </span>
      {children}
    </div>
  );
}

interface TerminalDataRowProps {
  /** Label/key */
  label: string;
  /** Value */
  value: string | number;
  /** Value color class (defaults to text-gray-200) */
  valueClass?: string;
}

export function TerminalDataRow({
  label,
  value,
  valueClass = 'text-gray-200',
}: TerminalDataRowProps) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}:</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
