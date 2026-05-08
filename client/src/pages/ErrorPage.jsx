export default function ErrorPage({ onRetry }) {
  return (
    <div className="full-page">
      <span style={{ fontSize: 48 }}>🛴</span>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Service unavailable</h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: 0, maxWidth: 300 }}>
        We couldn't reach the server. Check your connection and try again.
      </p>
      <button className="full-page-btn" onClick={onRetry}>Retry</button>
    </div>
  );
}
