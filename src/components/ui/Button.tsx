import React from 'react';
import { clsx, type ClassValue } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'ui-button',
          `ui-button-${variant}`,
          `ui-button-${size}`,
          isLoading && 'ui-button-loading',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="ui-button-spinner" />
        ) : leftIcon ? (
          <span className="ui-button-icon">{leftIcon}</span>
        ) : null}
        <span className="ui-button-text">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
