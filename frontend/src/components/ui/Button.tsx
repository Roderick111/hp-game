import React, { forwardRef } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles = {
  primary: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700',
  secondary: 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300',
  ghost: 'bg-transparent hover:bg-amber-50 text-amber-700 border-transparent',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
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
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`
          font-semibold rounded-lg border-2 transition-colors duration-200
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
