"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
            background: "#fef2f2",
            color: "#991b1b",
            padding: "2rem",
          }}
        >
          <div style={{ maxWidth: "480px", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ marginBottom: "1rem", color: "#7f1d1d" }}>
              An unexpected error occurred. Please try again.
            </p>
            {error.digest && (
              <p style={{ fontSize: "0.75rem", color: "#b91c1c", marginBottom: "1rem" }}>
                Error reference: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1.5rem",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
