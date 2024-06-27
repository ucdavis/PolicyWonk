'use client';
import React, { ErrorInfo } from 'react';

interface WonkyErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface WonkyErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundaries catch errors during rendering, in lifecycle methods, and in constructors of the whole tree below them. This is for **client components**
 * to catch unhandled errors and display a fallback UI instead of crashing the whole app.
 *
 * They do not catch errors within event handlers or asynchronous code.
 *
 * They should be placed outside of the component(s) you want to catch errors for, and should contain components that should crash together.
 * e.g. an input may not need to crash the whole modal, but it may need to crash the whole form.
 *
 * See: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
class WonkyErrorBoundary extends React.Component<
  WonkyErrorBoundaryProps,
  WonkyErrorBoundaryState
> {
  constructor(props: WonkyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Example "componentStack":
    //   in ComponentThatThrows (created by App)
    //   in wonkyErrorBoundary (created by App)
    //   in div (created by App)
    //   in App
    // TODO: log error to logging service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

export default WonkyErrorBoundary;
