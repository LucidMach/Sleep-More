import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line 
} from 'recharts';
import { Activity } from 'lucide-react';
import CustomTooltip from './CustomTooltip';

const HabitsChart = ({ data }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="card chart-card">
      <h2><Activity size={20} /> Habits & Sleep Correlation</h2>
      <div style={{ width: '100%', height: isMobile ? 300 : 350 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
              interval={isMobile ? 'preserveStartEnd' : 0}
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
            <Bar yAxisId="left" dataKey="steps" name="Steps" fill="var(--accent-color)" radius={[4, 4, 0, 0]} opacity={0.6} />
            <Line yAxisId="right" type="monotone" dataKey="mins_asleep" name="Total Sleep (mins)" stroke="var(--success)" strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HabitsChart;
