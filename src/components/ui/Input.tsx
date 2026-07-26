import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="ui-form-group">
        <input
          ref={ref}
          className={clsx(
            'ui-input',
            error && 'border-danger-color',
            className
          )}
          placeholder={props.placeholder || ' '}
          {...props}
        />
        {label && <label className="ui-label-floating">{label}</label>}
        {error && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
