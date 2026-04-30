import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, ComposedChart, Line 
} from 'recharts';
import { Clock, Activity, Sun } from 'lucide-react';
import CustomTooltip from './CustomTooltip';

const SleepCharts = ({ visibleData }) => (
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
);

export default SleepCharts;
