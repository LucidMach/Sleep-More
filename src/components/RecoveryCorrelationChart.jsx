import { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  CartesianGrid,
  Cell
} from 'recharts';
import { Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const RecoveryCorrelationChart = ({ data }) => {
  const [yAxisMode, setYAxisMode] = useState('recovery'); // 'bedtime', 'waketime', 'recovery'
  const [timeRange, setTimeRange] = useState({ min: 0, max: 2880 }); // 0 to 48 hours in minutes

  // Initialize time range based on data when mode changes
  useEffect(() => {
    if (yAxisMode === 'recovery') return;
    
    const key = yAxisMode === 'bedtime' ? 'bedtimeNum' : 'wakeTimeNum';
    const vals = data
      .filter(d => d.sleep_starts && d.sleep_starts.length > 0)
      .map(d => {
        if (yAxisMode === 'bedtime') return d.sleep_starts[0];
        return d.wake_times?.[0] || (d.sleep_starts[0] + d.mins_in_bed);
      });
    
    if (vals.length > 0) {
      const min = Math.min(...vals) - 30;
      const max = Math.max(...vals) + 30;
      setTimeRange({ min, max });
    }
  }, [yAxisMode, data]);

  // Filter for days with valid HRV and timing data
  const chartData = useMemo(() => {
    return data
      .filter(d => d.hrv_asleep_avg > 0 && d.hrv_awake_avg > 0 && d.sleep_starts && d.sleep_starts.length > 0)
      .map(d => {
        const bedtimeNum = d.sleep_starts[0];
        const wakeTimeNum = d.wake_times?.[0] || (bedtimeNum + d.mins_in_bed);
        
        return {
          ...d,
          hours: Number((d.mins_asleep / 60).toFixed(1)),
          bedtimeNum,
          wakeTimeNum,
          ratio: Number(d.recovery_ratio)
        };
      })
      .filter(d => {
        if (yAxisMode === 'recovery') return true;
        const val = yAxisMode === 'bedtime' ? d.bedtimeNum : d.wakeTimeNum;
        return val >= timeRange.min && val <= timeRange.max;
      })
      .sort((a, b) => a.hours - b.hours);
  }, [data, yAxisMode, timeRange]);

  const getStatusColor = (ratio) => {
    if (ratio >= 1.25) return 'var(--success)';
    if (ratio >= 1.05) return 'var(--accent-color)';
    if (ratio >= 0.95) return 'var(--warning)';
    return 'var(--danger)';
  };

  const formatTime = (val) => {
    let mins = val % 1440;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const getYTicks = () => {
    if (yAxisMode === 'recovery') return { dataKey: 'ratio', name: 'Recovery Ratio', unit: 'x', label: 'Recovery Multiplier', domain: [0.5, 'auto'] };
    if (yAxisMode === 'bedtime') return { dataKey: 'bedtimeNum', name: 'Bedtime', formatter: formatTime, label: 'Bedtime', domain: [timeRange.min, timeRange.max] };
    return { dataKey: 'wakeTimeNum', name: 'Wake Time', formatter: formatTime, label: 'Wake Up Time', domain: [timeRange.min, timeRange.max] };
  };

  const yConfig = getYTicks();

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}><Activity size={20} /> Recovery Dynamics</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
            <div className="timeframe-selector">
              {[
                { id: 'recovery', label: 'vs Recovery' },
                { id: 'bedtime', label: 'vs Bedtime' },
                { id: 'waketime', label: 'vs Wake Time' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  className={`timeframe-btn ${yAxisMode === mode.id ? 'active' : ''}`}
                  onClick={() => setYAxisMode(mode.id)}
                  style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {yAxisMode !== 'recovery' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700 }}>RANGE</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="range" 
                    min={timeRange.min - 120} 
                    max={timeRange.max + 120} 
                    value={timeRange.min} 
                    onChange={(e) => setTimeRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                    style={{ width: '60px', accentColor: 'var(--accent-color)' }}
                  />
                  <span style={{ fontSize: '0.65rem', minWidth: '45px', color: 'var(--text-primary)', fontWeight: 600 }}>{formatTime(timeRange.min)}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>to</span>
                  <input 
                    type="range" 
                    min={timeRange.min} 
                    max={timeRange.max + 240} 
                    value={timeRange.max} 
                    onChange={(e) => setTimeRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                    style={{ width: '60px', accentColor: 'var(--accent-color)' }}
                  />
                  <span style={{ fontSize: '0.65rem', minWidth: '45px', color: 'var(--text-primary)', fontWeight: 600 }}>{formatTime(timeRange.max)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
          {[
            { label: 'Optimal', color: 'var(--success)' },
            { label: 'Neutral', color: 'var(--accent-color)' },
            { label: 'Borderline', color: 'var(--warning)' },
            { label: 'Low', color: 'var(--danger)' }
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '2px', background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              type="number" 
              dataKey="hours" 
              name="Sleep Length" 
              unit="h" 
              axisLine={true} 
              tickLine={true} 
              stroke="var(--card-border)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              domain={['auto', 'auto']}
              label={{ value: 'Duration', position: 'bottom', offset: 0, fill: 'var(--text-secondary)', fontSize: 10 }}
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
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              domain={['auto', 'auto']}
              reversed={yAxisMode === 'bedtime'}
              label={{ value: yConfig.label, angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 10 }}
            />
            <ZAxis type="number" range={[64, 64]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const color = getStatusColor(d.ratio);
                  return (
                    <div className="custom-tooltip">
                      <div className="tooltip-label" style={{ marginBottom: '0.5rem' }}>
                        {format(parseISO(d.label), 'MMM d, yyyy')}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div className="tooltip-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Bedtime:</span>
                          <span style={{ fontWeight: 700 }}>{formatTime(d.bedtimeNum)}</span>
                        </div>
                        <div className="tooltip-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Wake Time:</span>
                          <span style={{ fontWeight: 700 }}>{formatTime(d.wakeTimeNum)}</span>
                        </div>
                        <div className="tooltip-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Duration:</span>
                          <span style={{ fontWeight: 700 }}>{d.hours}h</span>
                        </div>
                        <div className="tooltip-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.3rem', paddingTop: '0.3rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Recovery:</span>
                          <span style={{ fontWeight: 700, color }}>{d.ratio}x</span>
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
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.ratio)} fillOpacity={0.6} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RecoveryCorrelationChart;
