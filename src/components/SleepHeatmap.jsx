import { useState, useMemo } from "react";
import { Calendar, Info, Activity, Moon } from "lucide-react";
import {
  parseISO,
  getYear,
  getDay,
  format,
  eachDayOfInterval,
  getMonth,
  endOfWeek,
  startOfWeek,
} from "date-fns";

// Sub-components
import YearGrid from "./YearGrid";
import HeatmapLegend from "./HeatmapLegend";
import StatsSummary from "./StatsSummary";
import DetailPanel from "./DetailPanel";

const SleepHeatmap = ({ data, onSelectDate, timeframe }) => {
  const [hovered, setHovered] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [metric, setMetric] = useState("quality"); // 'quality', 'recovery', or 'quantity'

  const { yearGroups, allYears } = useMemo(() => {
    if (!data || data.length === 0) return { yearGroups: {}, allYears: [] };

    const years = [
      ...new Set(data.map((d) => getYear(parseISO(d.label)))),
    ].sort((a, b) => a - b);
    const groups = {};

    years.forEach((year) => {
      const yearData = data.filter((d) => getYear(parseISO(d.label)) === year);
      if (yearData.length === 0) return;

      const dates = yearData.map((d) => parseISO(d.label));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));

      const rangeStart = startOfWeek(minDate);
      const rangeEnd = endOfWeek(maxDate);
      const daysInRange = eachDayOfInterval({
        start: rangeStart,
        end: rangeEnd,
      });

      const dayMap = new Map();
      yearData.forEach((d) => {
        dayMap.set(d.label, d);
      });

      const weeks = [];
      let currentWeek = [];

      daysInRange.forEach((day, i) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const d = dayMap.get(dateStr);
        const dayOfWeek = getDay(day);

        currentWeek[dayOfWeek] = { date: day, data: d, dateStr };

        if (dayOfWeek === 6 || i === daysInRange.length - 1) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      });

      const months = [];
      let lastMonth = -1;
      weeks.forEach((week, weekIndex) => {
        const dayInYear = week.find((d) => d && getYear(d.date) === year);
        const referenceDay = dayInYear || week.find((d) => d);
        if (referenceDay) {
          const m = getMonth(referenceDay.date);
          if (m !== lastMonth) {
            months.push({ name: format(referenceDay.date, "MMM"), weekIndex });
            lastMonth = m;
          }
        }
      });

      groups[year] = { weeks, months };
    });

    return { yearGroups: groups, allYears: years };
  }, [data]);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return {};

    let filteredData = data;
    let label = "Overall Average";

    if (timeframe === "weekly") {
      filteredData = data.slice(-7);
      label = "Weekly Average";
    } else if (timeframe === "monthly") {
      filteredData = data.slice(-30);
      label = "Monthly Average";
    } else if (timeframe === "quarterly") {
      filteredData = data.slice(-90);
      label = "Quarterly Average";
    } else if (timeframe === "yearly") {
      filteredData = data.slice(-365);
      label = "Yearly Average";
    }

    const count = filteredData.length || 1;
    const avgQuality = Math.round(
      filteredData.reduce((acc, d) => acc + d.sleep_quality_score, 0) / count,
    );
    const avgMins = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_asleep, 0) / count,
    );
    const avgDeep = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_deep, 0) / count,
    );
    const avgRem = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_rem, 0) / count,
    );
    const avgCore = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_core, 0) / count,
    );
    const avgAwake = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_awake, 0) / count,
    );
    const avgMixed = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_mixed, 0) / count,
    );

    const avgHrvAsleep = Math.round(
      filteredData.reduce((acc, d) => acc + d.hrv_asleep_avg, 0) / count,
    );
    const avgHrvAwake = Math.round(
      filteredData.reduce((acc, d) => acc + d.hrv_awake_avg, 0) / count,
    );
    const avgRatio = Number((avgHrvAsleep / (avgHrvAwake || 1)).toFixed(2));

    return {
      sleep_quality_score: avgQuality,
      mins_asleep: avgMins,
      mins_deep: avgDeep,
      mins_rem: avgRem,
      mins_core: avgCore,
      mins_awake: avgAwake,
      mins_mixed: avgMixed,
      hrv_asleep_avg: avgHrvAsleep,
      hrv_awake_avg: avgHrvAwake,
      recovery_ratio: avgRatio,
      label,
    };
  }, [data, timeframe]);

  const display = hovered || stats;
  const total = display.mins_asleep + display.mins_awake;
  const hrs = display.mins_asleep / 60;
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

  const getBaseColor = (d) => {
    if (!d) return [148, 163, 184]; // Default secondary text color
    const hrs = d.mins_asleep / 60;
    let r, g, b;
    if (hrs >= 6 && hrs <= 8) {
      r = 67;
      g = 56;
      b = 202;
    } else if (hrs < 6) {
      const ratio = Math.min(1, hrs / 6);
      r = Math.round(239 + (245 - 239) * ratio);
      g = Math.round(68 + (158 - 68) * ratio);
      b = Math.round(68 + (11 - 68) * ratio);
    } else {
      const ratio = Math.min(1, (hrs - 8) / 4);
      r = Math.round(245 + (239 - 245) * ratio);
      g = Math.round(158 + (68 - 158) * ratio);
      b = Math.round(11 + (68 - 11) * ratio);
    }
    return [r, g, b];
  };

  const getRecoveryColor = (ratio) => {
    const normalized = Math.max(0, Math.min(1, (ratio - 0.7) / 0.8));
    let r, g, b;
    if (normalized < 0.5) {
      const sub = normalized * 2;
      // Proper Bright Red to Muted Yellow
      r = 255;
      g = Math.round(20 + 190 * sub);
      b = 20;
    } else {
      const sub = (normalized - 0.5) * 2;
      // Toned down Yellow to Emerald Green
      r = Math.round(255 - 210 * sub);
      g = Math.round(210 - 20 * sub);
      b = Math.round(20 + 90 * sub);
    }
    return [r, g, b];
  };

  const getCellColor = (d) => {
    if (!d)
      return {
        background: "rgba(255,255,255,0.03)",
        border: "none",
        boxShadow: "none",
      };

    let r, g, b, intensity, opacity;

    if (metric === "quality") {
      [r, g, b] = getBaseColor(d);
      intensity = d.sleep_quality_score / 100;
      opacity = Math.max(0.2, intensity);
    } else if (metric === "recovery") {
      const ratio = parseFloat(d.recovery_ratio) || 0;
      [r, g, b] = getRecoveryColor(ratio);
      intensity = Math.max(0, Math.min(1, (ratio - 0.7) / 0.8));
      // Full punchy opacity for recovery
      opacity = Math.max(0.85, intensity);
    } else {
      // Quantity mode - Uses the same Red-Orange-Purple theme as the quantity bar
      [r, g, b] = getBaseColor(d);
      
      const hrs = d.mins_asleep / 60;
      // High intensity for optimal (6-8h), lower for extremes
      if (hrs >= 6 && hrs <= 8) {
        intensity = 0.9;
      } else if (hrs < 6) {
        intensity = Math.max(0.3, hrs / 6);
      } else {
        intensity = Math.max(0.3, 1 - (hrs - 8) / 4);
      }
      
      opacity = Math.max(0.4, intensity);
    }

    const saturation = 40 + intensity * 45; // Max 85% saturation instead of 100%
    const filter = `saturate(${saturation}%)`;
    let borderColor = "none";
    let boxShadow = "none";

    const hrs = d.mins_asleep / 60;
    if (intensity > 0.85) {
      borderColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
      boxShadow = `0 0 8px rgba(${r}, ${g}, ${b}, 0.4)`;
    } else if (hrs < 6) {
      boxShadow =
        "inset 1.5px 1.5px 2px rgba(0,0,0,0.5), inset -0.5px -0.5px 1px rgba(255,255,255,0.1)";
    } else if (hrs > 8) {
      boxShadow =
        "inset 1.5px 1.5px 1px rgba(255,255,255,0.3), inset -1.5px -1.5px 1px rgba(0,0,0,0.4), 1px 1px 2px rgba(0,0,0,0.4)";
    }

    return {
      background: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      border:
        borderColor !== "none"
          ? `1px solid ${borderColor}`
          : "1px solid rgba(255,255,255,0.03)",
      boxShadow,
      filter,
    };
  };

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
                <div
                  className={`toggle-option ${metric === "quantity" ? "active" : ""}`}
                  onClick={() => setMetric("quantity")}
                >
                  Quantity
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
                  getCellColor={getCellColor}
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
            durationColor={`rgb(${getBaseColor(display).join(",")})`}
            recoveryColor={`rgb(${getRecoveryColor(display.recovery_ratio).join(",")})`}
          />
        </div>
      </div>
    </div>
  );
};

const SleepInfo = () => (
  <div
    className="card"
    style={{
      background: "#1e293b",
      border: "1px solid rgba(255,255,255,0.1)",
      padding: "2rem",
      color: "var(--text-primary)",
    }}
  >
    <h3
      style={{
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <Info size={20} className="text-accent" />
      Sleep Quality & Recovery Guide
    </h3>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        fontSize: "0.9rem",
        lineHeight: "1.6",
      }}
    >
      <p>
        Toggle between <strong>Quality</strong>, <strong>Recovery</strong> and{" "}
        <strong>Quantity</strong> to visualize different aspects of your sleep
        health.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginTop: "0.5rem",
        }}
      >
        <div
          style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0.75rem",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "var(--accent-color)",
              marginBottom: "0.25rem",
            }}
          >
            SLEEP QUALITY
          </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            Ratio of REM and Deep sleep relative to total duration. Focuses on
            sleep architecture.
          </p>
        </div>
        <div
          style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0.75rem",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "var(--success)",
              marginBottom: "0.25rem",
            }}
          >
            RECOVERY RATIO
          </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            Ratio of HRV during sleep vs awake. A higher ratio indicates better
            autonomic recovery. Low HRV implies high stress or fatigue.
          </p>
        </div>
        <div
          style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0.75rem",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#a855f7", // Purple
              marginBottom: "0.25rem",
            }}
          >
            SLEEP QUANTITY
          </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            Total duration of sleep in hours. Colors match the quantity bar:
            Red (Insufficient/Excessive), Orange (Borderline), Purple (Optimal).
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0.75rem",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "var(--deep)",
              marginBottom: "0.25rem",
            }}
          >
            DEEP SLEEP
          </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            Physical recovery, tissue growth, and immune system repair.
          </p>
        </div>
        <div
          style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0.75rem",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "var(--rem)",
              marginBottom: "0.25rem",
            }}
          >
            REM SLEEP
          </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            Cognitive recovery, memory consolidation, and emotional processing.
          </p>
        </div>
      </div>
      <p
        style={{
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          fontStyle: "italic",
          marginTop: "0.5rem",
        }}
      >
        * Aim for 6-8 hours of total sleep. Durations outside this range are
        marked with distinct cell textures (Indent/Bevel).
      </p>
    </div>
  </div>
);

export default SleepHeatmap;
