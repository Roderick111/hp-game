/**
 * MetricCard Component
 *
 * Displays a case review metric with tooltips and educational explanations.
 * Features visual performance indicators with color coding.
 *
 * Features:
 * - Metric name, value, and explanation display
 * - Hover tooltip with educational content
 * - Performance level color coding (excellent/good/fair/poor)
 * - Accessible keyboard navigation
 *
 * @module components/ui/MetricCard
 * @since Milestone 6
 */

import { useState, useRef, useEffect, useCallback } from 'react';

export type PerformanceLevel = 'excellent' | 'good' | 'fair' | 'poor';

export interface MetricCardProps {
  /** Metric name (e.g., "Calibration Score") */
  name: string;
  /** Metric value (e.g., "85%", "7/10") */
  value: number | string;
  /** Brief explanation of what this metric measures */
  explanation: string;
  /** Educational note for tooltip (longer explanation) */
  educationalNote?: string;
  /** Performance level for color coding */
  performanceLevel?: PerformanceLevel;
  /** Progress bar percentage (0-100) */
  progressValue?: number;
}

/**
 * Information icon for tooltip trigger
 */
function InfoIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Performance level configurations
 */
const performanceConfig: Record<
  PerformanceLevel,
  {
    borderColor: string;
    bgColor: string;
    textColor: string;
    progressColor: string;
    label: string;
  }
> = {
  excellent: {
    borderColor: 'border-green-300',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    progressColor: 'bg-green-500',
    label: 'Excellent',
  },
  good: {
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    progressColor: 'bg-blue-500',
    label: 'Good',
  },
  fair: {
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    progressColor: 'bg-amber-500',
    label: 'Fair',
  },
  poor: {
    borderColor: 'border-red-300',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    progressColor: 'bg-red-500',
    label: 'Needs Work',
  },
};

/**
 * MetricCard displays investigation metrics with educational context.
 *
 * @example Basic usage
 * ```tsx
 * <MetricCard
 *   name="Calibration Score"
 *   value="85%"
 *   explanation="How accurate were your probability estimates?"
 *   performanceLevel="excellent"
 * />
 * ```
 *
 * @example With educational tooltip
 * ```tsx
 * <MetricCard
 *   name="Confirmation Bias"
 *   value="23%"
 *   explanation="Did you investigate your favorite theory too much?"
 *   educationalNote="Confirmation bias is the tendency to seek evidence..."
 *   performanceLevel="good"
 *   progressValue={23}
 * />
 * ```
 */
export function MetricCard({
  name,
  value,
  explanation,
  educationalNote,
  performanceLevel = 'fair',
  progressValue,
}: MetricCardProps): JSX.Element {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const config = performanceConfig[performanceLevel];

  // Close tooltip on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setShowTooltip((prev) => !prev);
    } else if (event.key === 'Escape') {
      setShowTooltip(false);
    }
  }, []);

  return (
    <div
      className={`
        relative rounded-lg border-2 p-4 transition-all duration-200
        ${config.borderColor} ${config.bgColor}
      `}
    >
      {/* Header with name and info button */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <h4
            className={`font-bold text-sm uppercase tracking-wide ${config.textColor}`}
          >
            {name}
          </h4>
        </div>

        {/* Value display */}
        <div className={`text-2xl font-bold ${config.textColor}`}>{value}</div>
      </div>

      {/* Explanation */}
      <p className="text-sm text-gray-600 mb-2">{explanation}</p>

      {/* Progress bar (if provided) */}
      {progressValue !== undefined && (
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${config.progressColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
            role="progressbar"
            aria-valuenow={progressValue}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${name}: ${progressValue}%`}
          />
        </div>
      )}

      {/* Performance indicator badge */}
      <div className="flex items-center justify-between">
        <span
          className={`
            inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
            ${config.bgColor} ${config.textColor} border ${config.borderColor}
          `}
        >
          {config.label}
        </span>

        {/* Educational tooltip trigger */}
        {educationalNote && (
          <button
            ref={triggerRef}
            type="button"
            className={`
              p-1 rounded-full hover:bg-white/50 focus:outline-none
              focus:ring-2 focus:ring-offset-1 ${config.textColor}
            `}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            onClick={() => setShowTooltip((prev) => !prev)}
            onKeyDown={handleKeyDown}
            aria-label={`More information about ${name}`}
            aria-expanded={showTooltip}
            aria-describedby={`tooltip-${name.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <InfoIcon />
          </button>
        )}
      </div>

      {/* Tooltip */}
      {educationalNote && showTooltip && (
        <div
          ref={tooltipRef}
          id={`tooltip-${name.replace(/\s+/g, '-').toLowerCase()}`}
          role="tooltip"
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            w-72 max-w-sm p-3 bg-gray-900 text-white text-sm rounded-lg
            shadow-lg z-10
          "
        >
          <p>{educationalNote}</p>
          {/* Tooltip arrow */}
          <div
            className="
              absolute top-full left-1/2 -translate-x-1/2
              border-8 border-transparent border-t-gray-900
            "
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

export default MetricCard;
