import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col justify-center items-center h-screen w-full bg-background p-6">
          <div className="ui-card flex flex-col items-center text-center p-8 max-w-md">
            <ShieldAlert size={64} className="text-danger mb-4" />
            <h1 className="text-2xl font-bold mb-2">Unexpected Error</h1>
            <p className="text-secondary mb-6">
              The application encountered an unexpected error. Our team has been notified.
            </p>
            <div className="flex gap-4">
              <Button variant="primary" onClick={() => window.location.reload()}>Reload Page</Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>Go Home</Button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-6 p-4 bg-input text-left text-xs overflow-x-auto w-full rounded-md text-danger">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
