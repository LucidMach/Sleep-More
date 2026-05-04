import { useMemo, useState } from 'react';
import { 
  Sankey, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, ComposedChart, Line 
} from 'recharts';
import { Clock, Activity, Sun } from 'lucide-react';
import CustomTooltip from './CustomTooltip';

const formatBucketTime = (hour, use24Hour) => {
  const endHour = (hour + 2) % 24;
  if (use24Hour) {
    return `${hour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
  }
  const format12 = (h) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };
  return `${format12(hour)} - ${format12(endHour)}`;
};

const SankeyNode = (props) => {
  const { x, y, width, height, payload, use24Hour, setHoveredNode } = props;
  const isSleep = payload.type === 'Sleep';
  
  return (
    <g
      onMouseEnter={() => setHoveredNode(payload.name)}
      onMouseLeave={() => setHoveredNode(null)}
      style={{ cursor: 'pointer' }}
    >
      <rect 
        x={x} y={y} width={width} height={height} 
        fill={payload.fill || 'var(--text-secondary)'} 
        rx="3" 
        fillOpacity={1}
        style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      <g transform={`translate(${isSleep ? x - 55 : x + width + 55}, ${y + height / 2})`}>
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-primary)"
          fontSize={10}
          fontWeight={700}
          letterSpacing="0.01em"
          style={{ pointerEvents: 'none', opacity: 0.8 }}
        >
          {formatBucketTime(payload.hour, use24Hour)}
        </text>
      </g>
    </g>
  );
};

const SankeyLink = (props) => {
  const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload, hoveredNode } = props;
  const [selfHovered, setSelfHovered] = useState(false);
  
  const isRelated = hoveredNode && (payload.source.name === hoveredNode || payload.target.name === hoveredNode);
  const isHighlighted = selfHovered || isRelated;
  
  return (
    <path
      d={`
        M${sourceX},${sourceY}
        C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
      `}
      stroke={isHighlighted ? '#fff' : 'rgba(148, 163, 184, 0.1)'}
      strokeWidth={Math.max(1, linkWidth)}
      fill="none"
      strokeOpacity={isHighlighted ? 0.8 : 0.2}
      onMouseEnter={() => setSelfHovered(true)}
      onMouseLeave={() => setSelfHovered(false)}
      style={{ transition: 'stroke 0.3s ease, stroke-opacity 0.3s ease', cursor: 'pointer' }}
    />
  );
};

const getLinkColor = (durationMins) => {
  const hrs = durationMins / 60;
  let r, g, b;
  if (hrs >= 6 && hrs <= 8) {
    r = 99; g = 102; b = 241;
  } else if (hrs < 6) {
    const ratio = Math.min(1, hrs / 6);
    r = Math.round(239 + (245 - 239) * ratio);
    g = Math.round(68 + (158 - 68) * ratio);
    b = Math.round(68 + (11 - 68) * ratio);
  } else {
    const ratio = Math.min(1, (hrs - 8) / 4);
    r = Math.round(245 + (239 - 245) * ratio);
    g = Math.round(158 + (68 - 158) * ratio);
    b = Math.round(11 + (68 - 11) * ratio);
  }
  return `rgb(${r}, ${g}, ${b})`;
};

const getBucket = (mins) => {
  const m = mins % 1440;
  const h = Math.floor(m / 60);
  return Math.floor(h / 2) * 2;
};

const SleepCharts = ({ visibleData }) => {
  const [use24Hour, setUse24Hour] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

  const sankeyData = useMemo(() => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    const nodeDurations = new Map();
    
    const uniqueBuckets = new Set();
    visibleData.forEach(d => {
      if (d.sleep_events) {
        d.sleep_events.forEach(event => {
          uniqueBuckets.add(`Sleep:${getBucket(event.start)}`);
          uniqueBuckets.add(`Wake:${getBucket(event.end)}`);
        });
      }
    });

    const sortedNames = Array.from(uniqueBuckets).sort((a, b) => {
      const [typeA, hourA] = a.split(':');
      const [typeB, hourB] = b.split(':');
      if (typeA !== typeB) return typeA === 'Wake' ? 1 : -1;
      return parseInt(hourA) - parseInt(hourB);
    });

    sortedNames.forEach(key => {
      const [type, hour] = key.split(':');
      nodeMap.set(key, nodes.length);
      nodes.push({ name: key, type, hour: parseInt(hour) });
    });

    const linkMap = new Map();
    
    visibleData.forEach(d => {
      if (d.sleep_events) {
        d.sleep_events.forEach(event => {
          const sleepKey = `Sleep:${getBucket(event.start)}`;
          const wakeKey = `Wake:${getBucket(event.end)}`;
          
          const source = nodeMap.get(sleepKey);
          const target = nodeMap.get(wakeKey);
          
          if (!nodeDurations.has(source)) nodeDurations.set(source, []);
          if (!nodeDurations.has(target)) nodeDurations.set(target, []);
          nodeDurations.get(source).push(event.duration);
          nodeDurations.get(target).push(event.duration);
          
          const key = `${source}-${target}`;
          if (!linkMap.has(key)) {
            linkMap.set(key, { source, target, value: 0, durations: [] });
          }
          const link = linkMap.get(key);
          link.value += 1;
          link.durations.push(event.duration);
        });
      }
    });

    nodes.forEach((node, i) => {
      const durations = nodeDurations.get(i) || [];
      const avgDuration = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);
      node.fill = getLinkColor(avgDuration);
    });

    for (const link of linkMap.values()) {
      links.push({
        source: link.source,
        target: link.target,
        value: link.value,
      });
    }

    if (nodes.length === 0 || links.length === 0) {
      return { nodes: [{ name: 'No Data', type: 'Sleep', hour: 0 }, { name: 'Empty', type: 'Wake', hour: 0 }], links: [{ source: 0, target: 1, value: 1 }] };
    }

    return { nodes, links };
  }, [visibleData]);

  return (
    <div className="grid">
      <div className="card chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}><Clock size={20} /> Sleep Dynamics</h2>
          <button 
            className="timeframe-btn"
            onClick={() => setUse24Hour(!use24Hour)}
            style={{ fontSize: '0.65rem', padding: '0.35rem 0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}
          >
            {use24Hour ? '12H Clock' : '24H Clock'}
          </button>
        </div>
        <div style={{ width: '100%', height: 420, padding: '1rem 0', position: 'relative' }}>
          {/* Column Headers */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '0.65rem',
            fontWeight: 800,
            letterSpacing: '0.15em',
            color: 'var(--text-secondary)',
            opacity: 0.4,
            textTransform: 'uppercase',
            pointerEvents: 'none'
          }}>
            <span style={{ width: 100, textAlign: 'center' }}>Bedtime</span>
            <span style={{ width: 100, textAlign: 'center' }}>Wake Up</span>
          </div>
          
          <ResponsiveContainer>
            <Sankey
              data={sankeyData}
              node={<SankeyNode use24Hour={use24Hour} setHoveredNode={setHoveredNode} />}
              link={<SankeyLink hoveredNode={hoveredNode} />}
              margin={{ top: 30, right: 100, bottom: 20, left: 100 }}
              nodePadding={28}
              iterations={64}
            />
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
};

export default SleepCharts;
