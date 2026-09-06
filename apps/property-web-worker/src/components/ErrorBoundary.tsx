import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="container" style={{ padding: "3rem 0" }}>
            <h1>Đã xảy ra lỗi</h1>
            <p>Vui lòng tải lại trang hoặc thử lại sau.</p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Tải lại
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
