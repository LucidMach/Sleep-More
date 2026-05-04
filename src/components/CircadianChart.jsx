import { 
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line 
} from 'recharts';
import { Sun } from 'lucide-react';
import CustomTooltip from './CustomTooltip';

const CircadianChart = ({ data }) => {
  return (
    <div className="card chart-card">
      <h2><Sun size={20} /> Circadian Health & Recovery</h2>
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
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
            <Bar yAxisId="left" dataKey="mins_daylight" name="Daylight (mins)" fill="#FFBB00" radius={[4, 4, 0, 0]} opacity={0.9} />
            <Line yAxisId="right" type="monotone" dataKey="hrv_asleep_avg" name="Asleep HRV (ms)" stroke="var(--accent-color)" strokeWidth={3} dot={{ r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="hrv_awake_avg" name="Awake HRV (ms)" stroke="var(--core)" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CircadianChart;
