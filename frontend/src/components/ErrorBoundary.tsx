import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ButtonAnchor } from './ui/Button';

type State = { hasError: boolean };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Nayacura] Unhandled interface error', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-midnight px-6">
          <div className="max-w-lg text-center">
            <p className="eyebrow mb-5 justify-center">A quiet pause</p>
            <h1 className="display text-4xl sm:text-5xl">Something interrupted this page.</h1>
            <p className="body-copy mt-5">
              No private information was submitted. Please reload the page, or return somewhere
              familiar while we reset the space.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex min-h-11 items-center rounded-full bg-gradient-to-r from-rose to-lavender px-6 font-sans text-sm font-semibold text-midnight"
              >
                Reload page
              </button>
              <ButtonAnchor href="/" variant="secondary" size="md">
                Return home
              </ButtonAnchor>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
