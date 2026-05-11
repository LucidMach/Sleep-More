import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line 
} from 'recharts';
import { Sun } from 'lucide-react';
import CustomTooltip from './CustomTooltip';

const CircadianChart = ({ data, timeframe }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDaily = timeframe === 'daily';
  const isWeekly = timeframe === 'weekly';
  const tickInterval = isMobile ? 'preserveStartEnd' : isDaily ? 6 : isWeekly ? 1 : 0;
  const showDots = !isDaily;

  return (
    <div className="card chart-card">
      <h2><Sun size={20} /> Circadian Health & Recovery</h2>
      <div style={{ width: '100%', height: isMobile ? 300 : 350 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
              interval={tickInterval}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
              width={isMobile ? 30 : 40}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
              width={isMobile ? 30 : 40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px' }}/>
            <Bar yAxisId="left" dataKey="mins_daylight" name="Daylight (mins)" fill="#FFBB00" radius={[4, 4, 0, 0]} opacity={0.9} />
            <Line yAxisId="right" type="monotone" dataKey="hrv_asleep_avg" name="Asleep HRV (ms)" stroke="var(--accent-color)" strokeWidth={3} dot={showDots ? { r: 4 } : false} />
            <Line yAxisId="right" type="monotone" dataKey="hrv_awake_avg" name="Awake HRV (ms)" stroke="var(--core)" strokeWidth={3} dot={showDots ? { r: 4 } : false} strokeDasharray="3 3" />
            <Line yAxisId="right" type="monotone" dataKey="sleep_quality_score" name="Sleep Quality" stroke="var(--rem)" strokeWidth={2} dot={showDots ? { r: 3 } : false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CircadianChart;
