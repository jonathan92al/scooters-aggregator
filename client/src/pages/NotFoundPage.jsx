export default function NotFoundPage() {
  return (
    <div className="full-page">
      <span style={{ fontSize: 72, fontWeight: 800, color: "rgba(255,255,255,0.15)", lineHeight: 1 }}>404</span>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Page not found</h1>
      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: 0 }}>There's nothing here.</p>
      <a href="/" className="full-page-btn">Go to map</a>
    </div>
  );
}
