import { useState, useMemo, useEffect } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Activity } from "lucide-react";
import { format, parseISO } from "date-fns";

const RecoveryCorrelationChart = ({ data }) => {
  const [yAxisMode, setYAxisMode] = useState("recovery"); // 'bedtime', 'waketime', 'recovery'
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter for days with valid HRV and timing data
  const chartData = useMemo(() => {
    return data
      .filter(
        (d) =>
          d.hrv_asleep_avg > 0 &&
          d.hrv_awake_avg > 0 &&
          d.sleep_starts &&
          d.sleep_starts.length > 0,
      )
      .map((d) => {
        const bedtimeNum = d.sleep_starts[0];
        const wakeTimeNum = d.wake_times?.[0] || bedtimeNum + d.mins_in_bed;

        return {
          ...d,
          hours: Number((d.mins_asleep / 60).toFixed(1)),
          bedtimeNum,
          wakeTimeNum,
          ratio: Number(d.recovery_ratio),
        };
      })
      .sort((a, b) => a.hours - b.hours);
  }, [data]);

  const getStatusColor = (d) => {
    if (d.hrv_asleep_avg === 0 || d.hrv_awake_avg === 0)
      return "var(--text-secondary)"; // Neutral for partial data
    const ratio = d.ratio;
    if (ratio >= 1.25) return "var(--success)";
    if (ratio >= 1.05) return "var(--accent-color)";
    if (ratio >= 0.95) return "var(--warning)";
    return "var(--danger)";
  };

  const formatTime = (val) => {
    let mins = val % 1440;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const getYTicks = () => {
    if (yAxisMode === "recovery")
      return {
        dataKey: "ratio",
        name: "Recovery Ratio",
        unit: "x",
        label: "Recovery Multiplier",
        domain: ["auto", "auto"],
      };
    if (yAxisMode === "quality")
      return {
        dataKey: "sleep_quality_score",
        name: "Sleep Quality",
        unit: "%",
        label: "Sleep Quality Score",
        domain: [0, 100],
      };
    if (yAxisMode === "bedtime")
      return {
        dataKey: "bedtimeNum",
        name: "Bedtime",
        formatter: formatTime,
        label: "Bedtime",
        domain: ["auto", "auto"],
      };
    return {
      dataKey: "wakeTimeNum",
      name: "Wake Time",
      formatter: formatTime,
      label: "Wake Up Time",
      domain: ["auto", "auto"],
    };
  };

  const yConfig = getYTicks();

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            <Activity size={20} /> Recovery Dynamics
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginTop: "0.75rem",
            }}
          >
            <div
              className="timeframe-selector"
              style={{ width: isMobile ? "100%" : "auto" }}
            >
              {[
                {
                  id: "recovery",
                  label: isMobile ? "Recovery" : "vs Sleep Duration",
                },
                {
                  id: "quality",
                  label: isMobile ? "Quality" : "vs Sleep Quality",
                },
                { id: "bedtime", label: isMobile ? "Bedtime" : "vs Bedtime" },
                {
                  id: "waketime",
                  label: isMobile ? "Wake Time" : "vs Wake Time",
                },
              ].map((mode) => (
                <button
                  key={mode.id}
                  className={`timeframe-btn ${yAxisMode === mode.id ? "active" : ""}`}
                  onClick={() => setYAxisMode(mode.id)}
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.4rem 0.8rem",
                    flex: isMobile ? 1 : "none",
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="legend-container"
          style={{
            background: "rgba(255,255,255,0.02)",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            margin: 0,
          }}
        >
          {[
            { label: "Optimal", color: "var(--success)" },
            { label: "Neutral", color: "var(--accent-color)" },
            { label: "Borderline", color: "var(--warning)" },
            { label: "Low", color: "var(--danger)" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.65rem",
                color: "var(--text-secondary)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "2px",
                  background: item.color,
                }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", height: isMobile ? 300 : 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 10,
              right: isMobile ? 10 : 30,
              bottom: 40,
              left: isMobile ? 0 : 70,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              type="number"
              dataKey={yAxisMode === "quality" ? "ratio" : "hours"}
              name={yAxisMode === "quality" ? "Recovery Ratio" : "Sleep Length"}
              unit={yAxisMode === "quality" ? "x" : "h"}
              axisLine={true}
              tickLine={true}
              stroke="var(--card-border)"
              tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
              domain={["auto", "auto"]}
              label={
                isMobile
                  ? null
                  : {
                      value:
                        yAxisMode === "quality"
                          ? "Recovery Multiplier"
                          : "Duration",
                      position: "bottom",
                      offset: 25,
                      fill: "var(--text-secondary)",
                      fontSize: 10,
                    }
              }
            />
            <YAxis
              type="number"
              dataKey={yConfig.dataKey}
              name={yConfig.name}
              unit={yConfig.unit}
              axisLine={true}
              tickLine={true}
              stroke="var(--card-border)"
              tickFormatter={yConfig.formatter}
              tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
              domain={yConfig.domain}
              reversed={yAxisMode === "bedtime"}
              label={
                isMobile
                  ? null
                  : {
                      value: yConfig.label,
                      angle: -90,
                      position: "insideLeft",
                      offset: -45,
                      fill: "var(--text-secondary)",
                      fontSize: 10,
                    }
              }
              width={isMobile ? 40 : 60}
            />
            <ZAxis type="number" range={[64, 64]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const color = getStatusColor(d);
                  return (
                    <div className="custom-tooltip">
                      <div
                        className="tooltip-label"
                        style={{ marginBottom: "0.5rem" }}
                      >
                        {format(parseISO(d.label), "MMM d, yyyy")}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div
                          className="tooltip-row"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "1.5rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          <span style={{ color: "var(--text-secondary)" }}>
                            Bedtime:
                          </span>
                          <span style={{ fontWeight: 700 }}>
                            {formatTime(d.bedtimeNum)}
                          </span>
                        </div>
                        <div
                          className="tooltip-row"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "1.5rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          <span style={{ color: "var(--text-secondary)" }}>
                            Wake Time:
                          </span>
                          <span style={{ fontWeight: 700 }}>
                            {formatTime(d.wakeTimeNum)}
                          </span>
                        </div>
                        <div
                          className="tooltip-row"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "1.5rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          <span style={{ color: "var(--text-secondary)" }}>
                            Duration:
                          </span>
                          <span style={{ fontWeight: 700 }}>{d.hours}h</span>
                        </div>
                        <div
                          className="tooltip-row"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "1.5rem",
                            fontSize: "0.8rem",
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                            marginTop: "0.3rem",
                            paddingTop: "0.3rem",
                          }}
                        >
                          <span style={{ color: "var(--text-secondary)" }}>
                            Quality:
                          </span>
                          <span
                            style={{
                              fontWeight: 700,
                              color: "var(--accent-color)",
                            }}
                          >
                            {d.sleep_quality_score}%
                          </span>
                        </div>
                        <div
                          className="tooltip-row"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "1.5rem",
                            fontSize: "0.8rem",
                          }}
                        >
                          <span style={{ color: "var(--text-secondary)" }}>
                            Recovery:
                          </span>
                          <span style={{ fontWeight: 700, color }}>
                            {d.hrv_asleep_avg > 0 && d.hrv_awake_avg > 0
                              ? `${d.ratio}x`
                              : "Insufficient Data"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Recovery" data={chartData}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getStatusColor(entry)}
                  fillOpacity={0.6}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RecoveryCorrelationChart;
