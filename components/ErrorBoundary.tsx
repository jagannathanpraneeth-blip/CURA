import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
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
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
            <div className="bg-red-50 p-6 rounded-2xl max-w-md w-full border border-red-100 shadow-lg">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
                <p className="text-slate-600 mb-6">
                    An unexpected error occurred. Please try reloading the application.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center gap-2 w-full bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Reload Application
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;