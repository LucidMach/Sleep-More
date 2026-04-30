import { useState, useEffect } from 'react';
import { 
  Moon, 
  Sun, 
  Activity, 
  TrendingUp, 
  Calendar,
  Info,
  Clock,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, ComposedChart, Line
} from 'recharts';
import { fetchData, aggregateData, calculateCorrelations } from './utils/dataProcessor';

const SleepHeatmap = ({ data, onSelectDate }) => {
  const [hovered, setHovered] = useState(null);

  const avgQuality = Math.round(data.reduce((acc, d) => acc + d.sleep_quality_score, 0) / (data.length || 1));
  const avgMins = Math.round(data.reduce((acc, d) => acc + d.mins_asleep, 0) / (data.length || 1));
  const avgDeep = Math.round(data.reduce((acc, d) => acc + d.mins_deep, 0) / (data.length || 1));
  const avgRem = Math.round(data.reduce((acc, d) => acc + d.mins_rem, 0) / (data.length || 1));
  const avgCore = Math.round(data.reduce((acc, d) => acc + d.mins_core, 0) / (data.length || 1));
  const avgAwake = Math.round(data.reduce((acc, d) => acc + d.mins_awake, 0) / (data.length || 1));
  const avgMixed = Math.round(data.reduce((acc, d) => acc + d.mins_mixed, 0) / (data.length || 1));

  const display = hovered || {
    sleep_quality_score: avgQuality,
    mins_asleep: avgMins,
    mins_deep: avgDeep,
    mins_rem: avgRem,
    mins_core: avgCore,
    mins_awake: avgAwake,
    mins_mixed: avgMixed,
    label: 'Overall Average'
  };

  const total = display.mins_asleep + display.mins_awake;
  const efficiency = Math.round((display.mins_asleep / (total || 1)) * 100);
  const hrs = display.mins_asleep / 60;
  const isOptimal = hrs >= 6 && hrs <= 8;
  const isSubOptimal = (hrs > 8 && hrs <= 10) || (hrs >= 4 && hrs < 6);
  const isCritical = hrs < 4 || hrs > 10;
  
  // barWidth is absolute (scaled to 8h) for optimal sleep, relative (100%) for others
  const barWidth = isOptimal ? Math.min(100, (total / 480) * 100) : 100;
  
  // Calculate X in X/3 of the day (1/3 of day = 8 hours = 480 mins)
  const dayFraction = (display.mins_asleep / 480).toFixed(1);

  const stages = [
    { label: 'Deep', mins: display.mins_deep, color: 'var(--deep)' },
    { label: 'REM', mins: display.mins_rem, color: 'var(--rem)' },
    { label: 'Core', mins: display.mins_core, color: 'var(--core)' },
    { label: 'Mixed', mins: display.mins_mixed, color: '#64748b' },
    { label: 'Awake', mins: display.mins_awake, color: 'var(--awake)' },
  ];

  return (
    <div className="card" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
      <div>
        <h2><Calendar size={20} /> Sleep Quality History</h2>
        <div className="heatmap-container">
          {data.map((d, i) => {
            const hrs = d.mins_asleep / 60;
            const opacity = Math.max(0.1, d.sleep_quality_score / 100);
            let background = '';
            let borderColor = 'none';
            let boxShadow = 'none';

            let r, g, b;
            if (hrs >= 6 && hrs <= 8) {
              r = 99; g = 102; b = 241; // Purple
              if (d.sleep_quality_score > 80) borderColor = `rgb(${r}, ${g}, ${b})`;
            } else if (hrs < 6) {
              // Red to Orange gradient logic
              const ratio = Math.min(1, hrs / 6);
              r = Math.round(239 + (245 - 239) * ratio);
              g = Math.round(68 + (158 - 68) * ratio);
              b = Math.round(68 + (11 - 68) * ratio);
              if (d.sleep_quality_score > 80) borderColor = `rgb(${r}, ${g}, ${b})`;
              boxShadow = 'inset 2px 2px 3px rgba(0,0,0,0.6), inset -1px -1px 2px rgba(255,255,255,0.05)'; // Indent
            } else {
              // hrs > 8: Orange to Red gradient logic
              const ratio = Math.min(1, (hrs - 8) / 4);
              r = Math.round(245 + (239 - 245) * ratio);
              g = Math.round(158 + (68 - 158) * ratio);
              b = Math.round(11 + (68 - 11) * ratio);
              if (d.sleep_quality_score > 80) borderColor = `rgb(${r}, ${g}, ${b})`;
              boxShadow = '2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(255,255,255,0.05)'; // Bulge
            }
            background = `rgba(${r}, ${g}, ${b}, ${opacity})`;

            return (
              <div 
                key={i} 
                className="heatmap-cell" 
                style={{ 
                  background: background,
                  border: borderColor !== 'none' ? `1px solid ${borderColor}` : 'none',
                  boxShadow: boxShadow
                }}
                onMouseEnter={() => setHovered({ ...d, index: i })}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectDate(i)}
              />
            );
          })}
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Low Quality</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[0.2, 0.4, 0.6, 0.8, 1].map(o => <div key={o} style={{ width: 12, height: 12, borderRadius: 2, background: `rgba(99, 102, 241, ${o})` }} />)}
              </div>
              <span>High Quality</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--card-border)', paddingLeft: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(148, 163, 184, 0.2)', boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.5)' }} />
                <span style={{ fontSize: '0.65rem' }}>Indent: Under-sleep</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(148, 163, 184, 0.2)', boxShadow: '1px 1px 2px rgba(0,0,0,0.5)' }} />
                <span style={{ fontSize: '0.65rem' }}>Bulge: Over-sleep</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
            <div style={{ 
              height: 10, 
              width: '100%', 
              borderRadius: 5, 
              background: 'linear-gradient(to right, var(--danger) 0%, var(--warning) 45%, var(--accent-color) 50%, var(--accent-color) 66%, var(--warning) 72%, var(--danger) 100%)',
              position: 'relative',
              marginBottom: '1rem'
            }}>
              {/* Duration Indicator */}
              <div style={{ 
                position: 'absolute', 
                left: `${Math.min(100, (display.mins_asleep / 60 / 12) * 100)}%`, 
                top: -3, 
                height: 16, 
                width: 2, 
                background: '#fff', 
                boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                borderRadius: 1,
                zIndex: 10,
                transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />

              {[0, 2, 4, 6, 8, 10, 12].map(h => (
                <div key={h} style={{ position: 'absolute', left: `${(h / 12) * 100}%`, top: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
                  <div style={{ width: 1, height: 4, background: 'var(--card-border)' }} />
                  <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>{h}h</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', opacity: 0.8, marginTop: '0.25rem' }}>
              <span>Insufficient</span>
              <span>Optimal</span>
              <span>Excessive</span>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '1px solid var(--card-border)', marginTop: '1.5rem' }}>
          <div>
            <div className="stat-label" style={{ marginBottom: '0.2rem', fontSize: '0.65rem' }}>SLEEP QUALITY</div>
            <div style={{ display: 'flex', direction: "column", alignItems: 'baseline', gap: '0.75rem' }}>
              <div className="stat-value" style={{ fontSize: '1.75rem' }}>{display.sleep_quality_score}%</div>
            </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-color)', opacity: 0.8 }}>
                (Core + REM + Deep) / Time Asleep
              </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="stat-label" style={{ marginBottom: '0.2rem', fontSize: '0.65rem' }}>SLEEP EFFICIENCY</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <div className="stat-value" style={{ fontSize: '1.75rem', color: 'var(--success)' }}>{efficiency}%</div>
            </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--success)', opacity: 0.8 }}>
                Time Asleep / <span style={{color: "rgba(250, 50, 50, 0.75)"}}>Time in Bed</span>
              </div>
          </div>
        </div>
      </div>

      <div style={{ borderLeft: '1px solid var(--card-border)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="stat-label">TOTAL DURATION</div>
          <div className="stat-value" style={{ fontSize: '2.5rem', margin: '0.25rem 0', color: 'var(--accent-color)' }}>
            {Math.floor(display.mins_asleep / 60)}h {display.mins_asleep % 60}m
          </div>
        </div>
        
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {display.label}
        </div>

        <div style={{ position: 'relative', height: 44, marginBottom: '1.5rem' }}>
          {isOptimal && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
              {[...Array(9)].map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                  <div style={{ width: 1, height: '100%', background: 'rgba(255,255,255,0.05)' }} />
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{i}h</span>
                </div>
              ))}
            </div>
          )}
          
          {!isOptimal && (
            <div style={{ position: 'absolute', top: -18, left: 0, fontSize: '0.6rem', color: isCritical ? 'var(--danger)' : 'var(--warning)', fontWeight: 600, letterSpacing: '0.05em' }}>
              {hrs > 8 ? 'RELATIVE VIEW (EXCESSIVE)' : 'RELATIVE VIEW (INSUFFICIENT)'}
            </div>
          )}

          <div style={{ position: 'absolute', top: 6, left: 0, width: '100%', height: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ height: '100%', width: `${barWidth}%`, display: 'flex', borderRadius: 6, overflow: 'hidden', transition: 'width 0.3s ease' }}>
              {stages.map(stage => (
                <div 
                  key={stage.label} 
                  style={{ 
                    width: `${(stage.mins / (total || 1)) * 100}%`, 
                    background: stage.color,
                    height: '100%'
                  }} 
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '1rem', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Deep', mins: display.mins_deep, color: 'var(--deep)' },
              { label: 'REM', mins: display.mins_rem, color: 'var(--rem)' },
              { label: 'Core', mins: display.mins_core, color: 'var(--core)' },
            ].map(stage => (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: stage.color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{stage.label}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{Math.floor(stage.mins / 60)}h {stage.mins % 60}m</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--card-border)', height: '100%', width: 1 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Awake', mins: display.mins_awake, color: 'var(--awake)' },
              { label: 'Mixed', mins: display.mins_mixed, color: '#64748b' },
            ].map(stage => (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: stage.color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{stage.label}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{Math.floor(stage.mins / 60)}h {stage.mins % 60}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  }, [rawData, timeframe]);

  const handleSelectDate = (index) => {
    const newStart = Math.max(0, Math.min(index - Math.floor(windowSize / 2), data.length - windowSize));
    setWindowIndex(newStart);
  };

  const visibleData = data.slice(windowIndex, windowIndex + windowSize);

  if (loading) return <div className="container">Loading data...</div>;

  const avgSleep = Math.round(visibleData.reduce((acc, d) => acc + d.mins_asleep, 0) / (visibleData.length || 1));
  const avgDeep = Math.round(visibleData.reduce((acc, d) => acc + d.mins_deep, 0) / (visibleData.length || 1));
  const avgHRV = Math.round(visibleData.reduce((acc, d) => acc + d.hrv_asleep_avg, 0) / (visibleData.length || 1));
  const avgQuality = Math.round(visibleData.reduce((acc, d) => acc + d.sleep_quality_score, 0) / (visibleData.length || 1));
  const avgConsistency = Math.round(visibleData.reduce((acc, d) => acc + d.consistency_score, 0) / (visibleData.length || 1));
  const avgRecovery = (visibleData.reduce((acc, d) => acc + parseFloat(d.recovery_ratio), 0) / (visibleData.length || 1)).toFixed(2);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span>{entry.value} {entry.name.includes('mins') ? 'm' : ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

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
        <div className="card stat-card">
          <div className="stat-label">Sleep Quality</div>
          <div className="stat-value">{avgQuality}%</div>
          <div className="stat-trend trend-up">
            <TrendingUp size={16} /> Deep + REM focus
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Consistency</div>
          <div className="stat-value">{avgConsistency}%</div>
          <div className="stat-trend trend-up">
            <TrendingUp size={16} /> Bedtime regularity
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Recovery Ratio</div>
          <div className="stat-value">{avgRecovery}x</div>
          <div className="stat-trend trend-up">
            <TrendingUp size={16} /> Asleep vs Awake HRV
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Deep Sleep Avg</div>
          <div className="stat-value">{avgDeep}m</div>
          <div className="stat-trend trend-up">
            <TrendingUp size={16} /> 5% vs last period
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="card chart-card">
          <h2><Clock size={20} /> Sleep Stages Over Time</h2>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={visibleData}>
                <defs>
                  <linearGradient id="colorDeep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--deep)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--deep)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorREM" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--rem)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--rem)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="mins_deep" 
                  name="Deep" 
                  stackId="1" 
                  stroke="var(--deep)" 
                  fillOpacity={1} 
                  fill="url(#colorDeep)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="mins_rem" 
                  name="REM" 
                  stackId="1" 
                  stroke="var(--rem)" 
                  fillOpacity={1} 
                  fill="url(#colorREM)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="mins_core" 
                  name="Core" 
                  stackId="1" 
                  stroke="var(--core)" 
                  fillOpacity={0.1} 
                  fill="var(--core)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <h2><Activity size={20} /> Habits & Sleep Correlation</h2>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <ComposedChart data={visibleData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36}/>
                <Bar yAxisId="left" dataKey="steps" name="Steps" fill="var(--accent-color)" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Line yAxisId="right" type="monotone" dataKey="mins_asleep" name="Total Sleep (mins)" stroke="var(--success)" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <h2><Sun size={20} /> Circadian Health & Recovery</h2>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <ComposedChart data={visibleData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36}/>
                <Bar yAxisId="left" dataKey="mins_daylight" name="Daylight (mins)" fill="var(--warning)" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Line yAxisId="right" type="monotone" dataKey="hrv_asleep_avg" name="Asleep HRV (ms)" stroke="var(--accent-color)" strokeWidth={3} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="sleep_quality_score" name="Quality Score" stroke="var(--core)" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2><Zap size={20} /> Habit Insights</h2>
          <div className="correlation-grid">
            {correlations.map((corr, idx) => (
              <div key={idx} className="correlation-item">
                <div className="stat-label">{corr.name}</div>
                <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                  {corr.strength > 0.3 ? 'Strong Positive' : corr.strength < -0.3 ? 'Strong Negative' : 'Low Correlation'}
                </div>
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ width: `${Math.abs(corr.strength) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
            <Info size={16} />
            Data suggests that your Deep sleep is most impacted by your daily step count.
          </div>
        </div>

        <div className="card">
          <h2><Info size={20} /> About Sleep Quality Score</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            The <strong>Sleep Quality Score</strong> is a restorative health metric calculated by measuring the efficiency of your sleep cycles. 
            Unlike total duration, this score focuses on the <em>depth</em> of your rest.
          </p>
          <div style={{ margin: '1rem 0', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', borderLeft: '4px solid var(--accent-color)' }}>
            <code style={{ color: 'var(--accent-color)', fontWeight: 600 }}>
              Quality = (Core + REM + Deep) / Total Sleep
            </code>
          </div>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Deep Sleep:</strong> Responsible for physical restoration and immune health.</li>
            <li><strong>REM Sleep:</strong> Essential for memory consolidation and emotional processing.</li>
            <li><strong>Core Sleep:</strong> The baseline sleep stage for cognitive maintenance.</li>
            <li><strong>Goal:</strong> Aim for a score above 85% with this revised metric.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
