import {
  getBaseColor,
  getRecoveryColor,
  getQualityColor,
} from "../utils/heatmapUtils";

const HeatmapLegend = ({ metric }) => {
  const getLegendColor = (q) => {
    let r, g, b, opacity;
    if (metric === "quality") {
      [r, g, b] = getQualityColor(q);
      opacity = Math.max(0.85, q);
    } else if (metric === "recovery") {
      [r, g, b] = getRecoveryColor(q);
      opacity = Math.max(0.92, q);
    } else {
      const hrs = q * 14;
      [r, g, b] = getBaseColor(hrs);
      const intensity = 1 - Math.abs(hrs - 7) / 7;
      opacity = Math.max(0.7, intensity);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getBorderColor = (q) => {
    if (q <= 0.8) return "none";
    let r, g, b;
    if (metric === "quality") {
      [r, g, b] = getQualityColor(q);
    } else if (metric === "recovery") {
      [r, g, b] = getRecoveryColor(q);
    } else {
      const hrs = q * 14;
      [r, g, b] = getBaseColor(hrs);
    }
    return `1px solid rgba(${r}, ${g}, ${b}, 0.8)`;
  };

  return (
    <div className="legend-container">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>
          {metric === "quality"
            ? "Low Quality"
            : metric === "recovery"
              ? "Low Recovery"
              : "SubOptimal"}
        </span>
        <div style={{ display: "flex", gap: "2px" }}>
          {[0, 0.2, 0.4, 0.5, 0.6, 0.8, 1].map((q) => (
            <div
              key={q}
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: getLegendColor(q),
                filter: `saturate(${
                  metric === "quantity"
                    ? 75 + (1 - Math.abs(q - 0.5) * 2) * 75
                    : metric === "quality"
                      ? 75 + q * 20
                      : 90 + q * 10
                }%)`,
                border: getBorderColor(q),
              }}
            />
          ))}
        </div>
        <span>
          {metric === "quality"
            ? "High Quality"
            : metric === "recovery"
              ? "High Recovery"
              : "SubOptimal"}
        </span>
      </div>

      <div
        className="legend-extra"
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
