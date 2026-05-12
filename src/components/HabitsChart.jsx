import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import CustomTooltip from "./CustomTooltip";

const HabitsChart = ({
  data,
  timeframe,
  onShift,
  canShiftLeft,
  canShiftRight,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDaily = timeframe === "daily";
  const isWeekly = timeframe === "weekly";
  const tickInterval = isMobile ? "preserveStartEnd" : isDaily ? 6 : isWeekly ? 1 : 0;
  const showDots = !isDaily;

  return (
    <div className="card chart-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ marginBottom: 0 }}>
          <Activity size={20} /> Activity & Sleep Correlation
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`timeframe-btn ${!canShiftLeft ? "disabled" : ""}`}
            onClick={() => canShiftLeft && onShift(-1)}
            disabled={!canShiftLeft}
            style={{ padding: "0.4rem", opacity: canShiftLeft ? 1 : 0.3 }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className={`timeframe-btn ${!canShiftRight ? "disabled" : ""}`}
            onClick={() => canShiftRight && onShift(1)}
            disabled={!canShiftRight}
            style={{ padding: "0.4rem", opacity: canShiftRight ? 1 : 0.3 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div style={{ width: "100%", height: isMobile ? 300 : 350 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
              interval={tickInterval}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
              width={isMobile ? 30 : 40}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
              width={isMobile ? 30 : 40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconSize={10}
              wrapperStyle={{ fontSize: "10px" }}
            />
            <Bar
              yAxisId="left"
              dataKey="steps"
              name="Steps"
              fill="var(--accent-color)"
              radius={[4, 4, 0, 0]}
              opacity={0.6}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="mins_asleep"
              name="Total Sleep (mins)"
              stroke="var(--success)"
              strokeWidth={3}
              dot={showDots ? { r: 4 } : false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HabitsChart;
