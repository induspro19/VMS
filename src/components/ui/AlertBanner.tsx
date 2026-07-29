import React from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
}

export const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  ({ className, variant = 'info', icon, children, ...props }, ref) => {
    
    let defaultIcon;
    switch (variant) {
      case 'success': defaultIcon = <CheckCircle size={14} />; break;
      case 'warning': defaultIcon = <AlertTriangle size={14} />; break;
      case 'danger': defaultIcon = <XCircle size={14} />; break;
      case 'info':
      default: defaultIcon = <Info size={14} />; break;
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'ui-alert-banner',
          `ui-alert-banner-${variant}`,
          className
        )}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.25rem 0.75rem',
          borderRadius: '4px',
          border: `1px solid var(--${variant}-color)`,
          backgroundColor: `var(--bg-${variant}-light)`,
          color: `var(--${variant}-color)`,
          fontSize: '0.75rem',
          fontWeight: 600,
          whiteSpace: 'nowrap'
        }}
        {...props}
      >
        {icon || defaultIcon}
        {children}
      </div>
    );
  }
);
AlertBanner.displayName = 'AlertBanner';
