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

import { ReactNode, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

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
  className = "",
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
        return saved === "true";
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

  const { theme } = useTheme();

  return (
    <div
      className={`
        font-mono ${theme.colors.bg.primary} ${theme.colors.text.secondary} border ${theme.colors.border.default} rounded-lg p-4
        ${className}
      `}
    >
      {/* Header */}
      <div
        className={`${isCollapsed ? "mb-0" : "mb-3"} ${collapsible ? "cursor-pointer group select-none" : ""}`}
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
                className={`transform transition-transform duration-200 ${theme.colors.text.muted} group-hover:text-white ${isCollapsed ? "" : "rotate-180"}`}
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            )}
            <h3
              className={`font-mono uppercase text-sm font-bold tracking-wide transition-colors ${collapsible ? `group-hover:text-amber-400` : theme.colors.text.primary}`}
            >
              {title}
            </h3>
          </div>

          {subtitle && (
            <span className={`${theme.colors.text.tertiary} font-mono text-xs`}>{subtitle}</span>
          )}
        </div>

        {/* Separator line - Hide when collapsed */}
        {!isCollapsed && (
          <div className={`${theme.colors.text.separator} font-mono text-xs mt-1`}>
            {theme.symbols.separator}
          </div>
        )}
      </div>

      {/* Content - Conditionally Hidden */}
      {!isCollapsed && (
        <div className={`${theme.colors.text.secondary} font-mono text-sm animate-in fade-in slide-in-from-top-1 duration-200`}>
          {children}
        </div>
      )}

      {/* Footer helper text - Hide when collapsed */}
      {!isCollapsed && footer && (
        <div className={`mt-3 pt-3 ${theme.colors.border.default}`}>
          <p className={`${theme.colors.text.muted} font-mono text-xs`}>* {footer}</p>
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
  className = "",
}: TerminalListItemProps) {
  const { theme } = useTheme();
  const defaultPrefix = isActive
    ? theme.symbols.current
    : theme.symbols.other;

  const itemPrefix = prefix ?? defaultPrefix;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full text-left p-2 rounded border transition-colors
          ${
            isActive
              ? `${theme.colors.bg.hover} ${theme.colors.border.hover} cursor-default`
              : `${theme.colors.bg.semiTransparent} ${theme.colors.border.default} ${theme.colors.border.hoverClass} ${theme.colors.bg.hoverClass}`
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          <span className={isActive ? theme.colors.text.primary : theme.colors.text.tertiary}>
            {itemPrefix}
          </span>
          {children}
        </div>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-2 ${className}`}>
      <span className={isActive ? theme.colors.text.primary : theme.colors.text.tertiary}>
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
  valueClass,
}: TerminalDataRowProps) {
  const { theme } = useTheme();
  return (
    <div className="flex justify-between text-xs">
      <span className={theme.colors.text.muted}>{label}:</span>
      <span className={valueClass ?? theme.colors.text.secondary}>{value}</span>
    </div>
  );
}
