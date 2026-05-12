import { useState } from "react";
import { useHeatmapData } from "../hooks/useHeatmapData";
import {
  getCellColor,
  getBaseColor,
  getRecoveryColor,
  getQualityColor,
} from "../utils/heatmapUtils";

// Sub-components
import YearGrid from "./YearGrid";
import HeatmapLegend from "./HeatmapLegend";
import StatsSummary from "./StatsSummary";
import DetailPanel from "./DetailPanel";

const SleepHeatmap = ({ data, onSelectDate, timeframe }) => {
  const [hovered, setHovered] = useState(null);
  const [metric, setMetric] = useState("quantity"); // 'quality', 'recovery', or 'quantity'

  const { yearGroups, allYears, stats } = useHeatmapData(data, timeframe);

  const display = hovered || stats;
  const total = (display.mins_asleep || 0) + (display.mins_awake || 0);
  const hrs = (display.mins_asleep || 0) / 60;
  const isOptimal = hrs >= 6 && hrs <= 8;
  const isCritical = hrs < 4 || hrs > 10;
  const barWidth = isOptimal ? Math.min(100, (total / 480) * 100) : 100;

  const stages = [
    { label: "Deep", mins: display.mins_deep, color: "var(--deep)" },
    { label: "REM", mins: display.mins_rem, color: "var(--rem)" },
    { label: "Core", mins: display.mins_core, color: "var(--core)" },
    { label: "Mixed", mins: display.mins_mixed, color: "var(--mixed)" },
    { label: "Awake", mins: display.mins_awake, color: "var(--awake)" },
  ];

  return (
    <div style={{ position: "relative", marginBottom: "2rem" }}>
      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: window.innerWidth < 1024 ? "1fr" : "1fr 340px",
          gap: "2rem",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}
            >
              <div className="toggle-container">
                <div
                  className={`toggle-option ${metric === "quantity" ? "active" : ""}`}
                  onClick={() => setMetric("quantity")}
                >
                  Quantity
                </div>
                <div
                  className={`toggle-option ${metric === "quality" ? "active" : ""}`}
                  onClick={() => setMetric("quality")}
                >
                  Quality
                </div>
                <div
                  className={`toggle-option ${metric === "recovery" ? "active" : ""}`}
                  onClick={() => setMetric("recovery")}
                >
                  Recovery
                </div>
              </div>
            </div>
          </div>

          <div
            className="heatmap-scroll-wrapper"
            style={{ overflowX: "auto", paddingBottom: "1rem", cursor: "grab" }}
          >
            <div
              style={{
                display: "flex",
                gap: "1rem",
                width: "max-content",
                padding: "0.5rem",
              }}
            >
              {allYears.map((year) => (
                <YearGrid
                  key={year}
                  year={year}
                  weeks={yearGroups[year].weeks}
                  months={yearGroups[year].months}
                  getCellColor={(d) => getCellColor(d, metric)}
                  setHovered={setHovered}
                  onSelectDate={onSelectDate}
                  data={data}
                />
              ))}
            </div>
          </div>

          <HeatmapLegend metric={metric} />
          <StatsSummary display={display} />
        </div>

        <div style={{ minWidth: 0 }}>
          <DetailPanel
            display={display}
            total={total}
            hrs={hrs}
            isOptimal={isOptimal}
            isCritical={isCritical}
            barWidth={barWidth}
            stages={stages}
            durationColor={`rgb(${getBaseColor(hrs).join(",")})`}
            recoveryColor={`rgb(${getRecoveryColor(Math.max(0, Math.min(1, (display.recovery_ratio - 0.7) / 0.8))).join(",")})`}
            qualityColor={`rgb(${getQualityColor(Math.max(0, Math.min(1, (display.sleep_quality_score || 0) / 100))).join(",")})`}
          />
        </div>
      </div>
    </div>
  );
};

export default SleepHeatmap;
