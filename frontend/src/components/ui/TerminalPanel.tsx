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

import { ReactNode } from 'react';
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
}: TerminalPanelProps) {
  return (
    <div
      className={`
        font-mono bg-gray-900 text-gray-100 border border-gray-700 rounded-lg p-4
        ${className}
      `}
    >
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-white font-mono uppercase text-sm font-bold tracking-wide">
            {title}
          </h3>
          {subtitle && (
            <span className="text-gray-400 font-mono text-xs">
              {subtitle}
            </span>
          )}
        </div>
        {/* Separator line */}
        <div className="text-gray-600 font-mono text-xs mt-1">
          {TERMINAL_THEME.symbols.separator}
        </div>
      </div>

      {/* Content */}
      <div className="text-gray-200 font-mono text-sm">
        {children}
      </div>

      {/* Footer helper text */}
      {footer && (
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
