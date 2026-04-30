import { useState, useEffect } from 'react';
import { 
  Moon, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { fetchData, aggregateData, calculateCorrelations } from './utils/dataProcessor';

// Components
import SleepHeatmap from './components/SleepHeatmap';
import StatCard from './components/StatCard';
import SleepCharts from './components/SleepCharts';
import HabitInsights from './components/HabitInsights';
import SleepInfo from './components/SleepInfo';

const Dashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [data, setData] = useState([]);
  const [timeframe, setTimeframe] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [correlations, setCorrelations] = useState([]);
  const [windowIndex, setWindowIndex] = useState(0);
  const windowSize = timeframe === 'daily' ? 30 : timeframe === 'weekly' ? 12 : 12;

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
      const daily = aggregateData(rawData, 'daily');
      const agg = timeframe === 'daily' ? daily : aggregateData(rawData, timeframe);
      
      setDailyData(daily);
      setData(agg);
      setCorrelations(calculateCorrelations(rawData));
      setWindowIndex(Math.max(0, agg.length - windowSize)); // Default to most recent window
    }
  }, [rawData, timeframe, windowSize]);

  const handleSelectDate = (index) => {
    const newStart = Math.max(0, Math.min(index - Math.floor(windowSize / 2), data.length - windowSize));
    setWindowIndex(newStart);
  };

  const visibleData = data.slice(windowIndex, windowIndex + windowSize);

  if (loading) return <div className="container">Loading data...</div>;

  const avgDeep = Math.round(visibleData.reduce((acc, d) => acc + d.mins_deep, 0) / (visibleData.length || 1));
  const avgQuality = Math.round(visibleData.reduce((acc, d) => acc + d.sleep_quality_score, 0) / (visibleData.length || 1));
  const avgConsistency = Math.round(visibleData.reduce((acc, d) => acc + d.consistency_score, 0) / (visibleData.length || 1));
  const avgRecovery = (visibleData.reduce((acc, d) => acc + parseFloat(d.recovery_ratio), 0) / (visibleData.length || 1)).toFixed(2);

  return (
    <div className="container">
      <header>
        <div className="logo">
          <Moon size={28} />
          SleepMore
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="timeframe-selector" style={{ marginRight: '1rem' }}>
            <button 
              className="timeframe-btn" 
              onClick={() => setWindowIndex(Math.max(0, windowIndex - windowSize))}
              disabled={windowIndex === 0}
            >
              <ChevronLeft size={18} />
            </button>
            <div style={{ padding: '0 0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {visibleData.length > 0 ? `${visibleData[0].label} — ${visibleData[visibleData.length-1].label}` : 'No Data'}
            </div>
            <button 
              className="timeframe-btn" 
              onClick={() => setWindowIndex(Math.min(data.length - windowSize, windowIndex + windowSize))}
              disabled={windowIndex + windowSize >= data.length}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="timeframe-selector">
            {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((tf) => (
              <button
                key={tf}
                className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </header>

      <SleepHeatmap data={dailyData} onSelectDate={handleSelectDate} />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard label="Sleep Quality" value={`${avgQuality}%`} trendLabel="Deep + REM focus" />
        <StatCard label="Consistency" value={`${avgConsistency}%`} trendLabel="Bedtime regularity" />
        <StatCard label="Recovery Ratio" value={`${avgRecovery}x`} trendLabel="Asleep vs Awake HRV" />
        <StatCard label="Deep Sleep Avg" value={`${avgDeep}m`} trendLabel="5% vs last period" />
      </div>

      <SleepCharts visibleData={visibleData} />

      <div className="grid">
        <HabitInsights correlations={correlations} />
        <SleepInfo />
      </div>
    </div>
  );
};

export default Dashboard;
