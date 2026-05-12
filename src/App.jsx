import { useState, useEffect } from "react";
import { Moon } from "lucide-react";
import {
  fetchData,
  aggregateData,
  calculateCorrelations,
} from "./utils/dataProcessor";

// Components
import SleepHeatmap from "./components/SleepHeatmap";
import SleepCharts from "./components/SleepCharts";
import HabitInsights from "./components/HabitInsights";

const Dashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [data, setData] = useState([]);
  const [timeframe, setTimeframe] = useState("daily");
  const [loading, setLoading] = useState(true);
  const [correlations, setCorrelations] = useState([]);
  const [windowIndex, setWindowIndex] = useState(0);
  const windowSize =
    timeframe === "daily" ? 30 : timeframe === "weekly" ? 12 : 12;

  useEffect(() => {
    const load = async () => {
      const result = await fetchData();
      setRawData(result);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (rawData.length > 0) {
      const daily = aggregateData(rawData, "daily");
      const agg =
        timeframe === "daily" ? daily : aggregateData(rawData, timeframe);

      setDailyData(daily);
      setData(agg);
      setCorrelations(calculateCorrelations(rawData));
      setWindowIndex(Math.max(0, agg.length - windowSize)); // Default to most recent window
    }
  }, [rawData, timeframe, windowSize]);

  const handleSelectDate = (index) => {
    const newStart = Math.max(
      0,
      Math.min(index - Math.floor(windowSize / 2), data.length - windowSize),
    );
    setWindowIndex(newStart);
  };

  const handleShiftWindow = (direction) => {
    setWindowIndex((prev) => {
      const step = Math.max(1, Math.floor(windowSize / 3));
      const next = prev + direction * step;
      return Math.max(0, Math.min(next, data.length - windowSize));
    });
  };

  const canShiftLeft = windowIndex > 0;
  const canShiftRight = windowIndex < data.length - windowSize;

  const visibleData = data.slice(windowIndex, windowIndex + windowSize);

  if (loading) return <div className="container">Loading data...</div>;

  return (
    <div className="container">
      <header>
        <div className="logo">
          <Moon size={28} />
          SleepMore
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="timeframe-selector">
            {["daily", "weekly", "monthly", "quarterly", "yearly"].map((tf) => (
              <button
                key={tf}
                className={`timeframe-btn ${timeframe === tf ? "active" : ""}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </header>

      <SleepHeatmap
        data={dailyData}
        onSelectDate={handleSelectDate}
        timeframe={timeframe}
      />
      <SleepCharts
        visibleData={visibleData}
        allDailyData={dailyData}
        timeframe={timeframe}
        onShiftWindow={handleShiftWindow}
        canShiftLeft={canShiftLeft}
        canShiftRight={canShiftRight}
      />
    </div>
  );
};

export default Dashboard;
