export default function FilterBar({ operators, activeOperators, onToggle, isDark }) {
  return (
    <div className="filter-bar">
      {operators.map((op) => {
        const active = activeOperators.has(op.id);
        const inactiveColor = isDark ? "rgba(255,255,255,0.75)" : op.color;
        return (
          <button
            key={op.id}
            onClick={() => onToggle(op.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 20,
              border: `2px solid ${active ? op.color : inactiveColor}`,
              background: active ? op.color : "transparent",
              color: active ? "white" : inactiveColor,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.15s",
              flexShrink: 0,
              minHeight: 36,
              touchAction: "manipulation",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: active ? "white" : inactiveColor,
                flexShrink: 0,
              }}
            />
            {op.name}
          </button>
        );
      })}
    </div>
  );
}
