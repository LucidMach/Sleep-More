const HeatmapLegend = ({ metric }) => {
  const getLegendColor = (q) => {
    if (metric === "quality") {
      return `rgba(67, 56, 202, ${q})`;
    } else {
      // Red to Green gradient for recovery
      const normalized = q;
      let r, g, b;
      if (normalized < 0.5) {
        const sub = normalized * 2;
        r = 255;
        g = Math.round(20 + 190 * sub);
        b = 20;
      } else {
        const sub = (normalized - 0.5) * 2;
        r = Math.round(255 - 210 * sub);
        g = Math.round(210 - 20 * sub);
        b = Math.round(20 + 90 * sub);
      }
      return `rgba(${r}, ${g}, ${b}, ${Math.max(0.85, q)})`;
    }
  };

  const getBorderColor = (q) => {
    if (metric === "quality") {
      return q > 0.8 ? "1px solid rgba(67, 56, 202, 0.8)" : "none";
    } else {
      // Use the same color logic for recovery border
      const normalized = q;
      let r, g, b;
      if (normalized < 0.5) {
        const sub = normalized * 2;
        r = 255;
        g = Math.round(20 + 190 * sub);
        b = 20;
      } else {
        const sub = (normalized - 0.5) * 2;
        r = Math.round(255 - 210 * sub);
        g = Math.round(210 - 20 * sub);
        b = Math.round(20 + 90 * sub);
      }
      return q > 0.8 ? `1px solid rgba(${r}, ${g}, ${b}, 0.8)` : "none";
    }
  };

  return (
    <div
      style={{
        marginTop: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.75rem",
        color: "var(--text-secondary)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>{metric === "quality" ? "Low Quality" : "Low Recovery"}</span>
        <div style={{ display: "flex", gap: "2px" }}>
          {[0.2, 0.4, 0.6, 0.8, 1].map((q) => (
            <div
              key={q}
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: getLegendColor(q),
                filter: `saturate(${40 + q * 45}%)`,
                border: getBorderColor(q),
              }}
            />
          ))}
        </div>
        <span>{metric === "quality" ? "High Quality" : "High Recovery"}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          borderLeft: "1px solid var(--card-border)",
          paddingLeft: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: "rgba(148, 163, 184, 1)",
              boxShadow:
                "inset 1.5px 1.5px 2px rgba(0,0,0,0.5), inset -0.5px -0.5px 1px rgba(255,255,255,0.1)",
            }}
          />
          <span style={{ fontSize: "0.65rem" }}>Indent: Under-sleep</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: "rgba(148, 163, 184, 1)",
              boxShadow:
                "inset 1.5px 1.5px 1px rgba(255,255,255,0.3), inset -1.5px -1.5px 1px rgba(0,0,0,0.4), 1px 1px 2px rgba(0,0,0,0.4)",
            }}
          />
          <span style={{ fontSize: "0.65rem" }}>Bevel: Over-sleep</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapLegend;
