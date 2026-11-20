import React from 'react';

type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-theme-bg p-6">
          <div className="glass-panel max-w-md w-full rounded-2xl border border-theme-border p-6 text-center">
            <p className="text-base font-bold text-theme-text mb-2">Something went wrong</p>
            <p className="text-sm text-theme-muted mb-4">The app hit an unexpected error. Reload to continue.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-theme-primary px-4 py-2 text-sm font-bold text-theme-on-primary hover:bg-theme-primary-hover"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}