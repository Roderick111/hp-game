import React, { forwardRef } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'terminal' | 'terminal-primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  /** Tooltip text shown on hover (native browser tooltip) */
  title?: string;
}

const variantStyles = {
  primary: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700 rounded-lg border-2',
  secondary: 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 rounded-lg border-2',
  ghost: 'bg-transparent hover:bg-amber-50 text-amber-700 border-transparent rounded-lg border-2',
  terminal: 'bg-gray-900 text-gray-100 border-gray-600 hover:!bg-gray-800 hover:!text-gray-100 hover:!border-gray-200 font-mono uppercase tracking-widest rounded-sm border transition-colors duration-200',
  'terminal-primary': 'bg-amber-900/60 text-white border-amber-600/70 hover:bg-amber-800 hover:border-amber-400 font-mono uppercase tracking-widest rounded-sm border shadow-[0_0_10px_rgba(217,119,6,0.1)] hover:shadow-[0_0_15px_rgba(217,119,6,0.2)]',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-4 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      onClick,
      disabled = false,
      variant = 'primary',
      size = 'md',
      className = '',
      type = 'button',
      title,
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`
          transition-colors duration-100
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        {children}
      </button>
    );
  }
);
