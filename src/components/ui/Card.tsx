import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'official' | 'selected' | 'collected' | 'disabled' | 'success' | 'warning' | 'speech';
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-amber-50 border border-amber-200',
  official: 'bg-amber-50 border-2 border-amber-700 shadow-md',
  selected: 'bg-amber-100 border-2 border-amber-500 shadow-md',
  collected: 'bg-green-50 border border-green-300',
  disabled: 'bg-gray-100 border border-gray-300 opacity-60',
  success: 'bg-green-50 border border-green-400',
  warning: 'bg-amber-100 border border-amber-400',
  speech: 'bg-amber-100/50 border-l-4 border-amber-600',
};

export function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
}: CardProps) {
  return (
    <div
      className={`rounded-lg p-4 ${variantStyles[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
