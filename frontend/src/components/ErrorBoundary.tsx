import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '../api/telemetry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logError('react_crash', error.message, {
      stack: error.stack?.slice(0, 500),
      componentStack: info.componentStack?.slice(0, 500),
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-amber-200">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-amber-400">
              Something went wrong
            </h1>
            <p className="mb-6 text-amber-200/80">
              An unexpected error occurred. Please refresh the page to continue your investigation.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
