import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[DeadlineVibe] Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0a0f1e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#f1f5f9",
            fontFamily: "Inter, sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "1rem",
            }}
          >
            🔥
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
              color: "#f43f5e",
            }}
          >
            DeadlineVibe Hit a Snag
          </h1>
          <p
            style={{
              color: "#94a3b8",
              marginBottom: "1.5rem",
              maxWidth: "480px",
              lineHeight: 1.6,
              fontSize: "0.875rem",
            }}
          >
            {this.state.error?.message || "An unexpected error occurred. Please refresh."}
          </p>
          <button
            onClick={() => {
              (this as any).setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            style={{
              background: "#f43f5e",
              color: "white",
              border: "none",
              borderRadius: "9999px",
              padding: "0.75rem 2rem",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            Reload App
          </button>
          {this.state.error && (
            <details
              style={{
                marginTop: "2rem",
                maxWidth: "600px",
                textAlign: "left",
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              <summary style={{ cursor: "pointer", color: "#94a3b8" }}>
                Technical Details
              </summary>
              <pre
                style={{
                  marginTop: "0.5rem",
                  padding: "1rem",
                  background: "#0f172a",
                  borderRadius: "0.5rem",
                  overflow: "auto",
                  border: "1px solid rgba(255,255,255,0.05)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return (this as any).props.children;
  }
}
