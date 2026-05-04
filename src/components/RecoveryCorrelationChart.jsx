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
  // Filter for days with valid HRV data
  const chartData = data
    .filter(d => d.hrv_asleep_avg > 0 && d.hrv_awake_avg > 0)
    .map(d => ({
      ...d,
      hours: Number((d.mins_asleep / 60).toFixed(1)),
      ratio: Number(d.recovery_ratio)
    }))
    .sort((a, b) => a.hours - b.hours);

  const getStatusColor = (ratio) => {
    if (ratio >= 1.25) return 'var(--success)';
    if (ratio >= 1.05) return 'var(--accent-color)';
    if (ratio >= 0.95) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}><Activity size={20} /> Recovery Rate vs Sleep Length</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[
            { label: 'Optimal', color: 'var(--success)' },
            { label: 'Neutral', color: 'var(--accent-color)' },
            { label: 'Borderline', color: 'var(--warning)' },
            { label: 'Low', color: 'var(--danger)' }
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px', background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              type="number" 
              dataKey="hours" 
              name="Sleep Length" 
              unit="h" 
              axisLine={true} 
              tickLine={true} 
              stroke="var(--card-border)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <YAxis 
              type="number" 
              dataKey="ratio" 
              name="Recovery" 
              unit="x"
              axisLine={true} 
              tickLine={true} 
              stroke="var(--card-border)"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              domain={[0.5, 'auto']}
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
                      <div className="tooltip-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Sleep Duration:</span>
                        <span style={{ fontWeight: 700 }}>{d.hours}h</span>
                      </div>
                      <div className="tooltip-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Recovery Ratio:</span>
                        <span style={{ fontWeight: 700, color }}>{d.ratio}x</span>
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
