export default function StatusBar({ lastUpdated, count, feedErrors, onRefresh }) {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "4px 12px",
        padding: "6px 16px",
        paddingBottom: "calc(6px + env(safe-area-inset-bottom, 0px))",
        background: "#f5f5f5",
        borderTop: "1px solid #ddd",
        fontSize: 12,
        color: "#666",
        flexShrink: 0,
      }}
    >
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {count} scooters &nbsp;·&nbsp; {timeStr}
        {feedErrors && feedErrors.length > 0 && (
          <span style={{ color: "#c0392b", marginLeft: 8 }}>
            ⚠ {feedErrors.map((e) => e.operator).join(", ")} unavailable
          </span>
        )}
      </span>
      <button
        onClick={onRefresh}
        style={{
          background: "none",
          border: "1px solid #ccc",
          borderRadius: 4,
          padding: "4px 12px",
          cursor: "pointer",
          fontSize: 12,
          color: "#444",
          flexShrink: 0,
          touchAction: "manipulation",
          minHeight: 30,
        }}
      >
        Refresh
      </button>
    </div>
  );
}
