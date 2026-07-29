import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  minimal?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', minimal = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'ui-badge',
          `ui-badge-${variant}`,
          minimal && 'ui-badge-minimal',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
