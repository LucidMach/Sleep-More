import { useMemo, useState } from 'react';
import { 
  Sankey, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, ComposedChart, Line 
} from 'recharts';
import { Clock, Activity, Sun } from 'lucide-react';
import CustomTooltip from './CustomTooltip';

const formatBucketTime = (hour, use24Hour) => {
  const endHour = (hour + 1) % 24;
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
        fill={payload.fill} 
        rx="2"
        fillOpacity={0.9}
        style={{ 
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      <g transform={`translate(${isSleep ? x - 70 : x + width + 70}, ${y + height / 2})`}>
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-primary)"
          fontSize={11}
          fontWeight={700}
          letterSpacing="0.02em"
          style={{ pointerEvents: 'none' }}
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
  
  const gradientId = `link-gradient-${payload.source.name}-${payload.target.name}`.replace(/:/g, '-');
  
  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={payload.source.fill} stopOpacity={isHighlighted ? 0.8 : 0.25} />
          <stop offset="100%" stopColor={payload.target.fill} stopOpacity={isHighlighted ? 0.8 : 0.25} />
        </linearGradient>
      </defs>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        stroke={`url(#${gradientId})`}
        strokeWidth={Math.max(1, linkWidth)}
        fill="none"
        onMouseEnter={() => setSelfHovered(true)}
        onMouseLeave={() => setSelfHovered(false)}
        style={{ 
          transition: 'all 0.4s ease', 
          cursor: 'pointer',
          filter: isHighlighted ? 'saturate(1.2)' : 'saturate(0.4) grayscale(0.2)',
          opacity: isHighlighted ? 1 : 0.8
        }}
      />
      {isHighlighted && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-primary)"
          fontSize={11}
          fontWeight={800}
          style={{ pointerEvents: 'none' }}
        >
          {payload.originalValue}
        </text>
      )}
    </g>
  );
};

const getLinkColor = (durationMins) => {
  const hrs = durationMins / 60;
  if (hrs >= 6 && hrs <= 8) return '#6366F1'; // Indigo
  if (hrs < 6) return '#F43F5E'; // Rose
  return '#F59E0B'; // Amber
};

const getBucket = (mins) => Math.floor(mins / 60) % 24;

const SleepCharts = ({ visibleData, allDailyData }) => {
  const [use24Hour, setUse24Hour] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);

  const sankeyData = useMemo(() => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    const nodeDurations = new Map();
    
    const uniqueBuckets = new Set();
    const sourceData = (allDailyData && allDailyData.length > 0) ? allDailyData : visibleData;

    sourceData.forEach(d => {
      if (d.sleep_events) {
        d.sleep_events.forEach(event => {
          const sleepBucket = getBucket(event.start);
          const wakeBucket = getBucket(event.end);
          
          // Skip self-loops and nonsensical evening wake times
          if (sleepBucket === wakeBucket || wakeBucket >= 18) return;

          uniqueBuckets.add(`Sleep:${sleepBucket}`);
          uniqueBuckets.add(`Wake:${wakeBucket}`);
        });
      }
    });

    // 2. Sort them chronologically (Sleep-cycle aware: starts at 18:00 / 6 PM)
    const getSortValue = (key) => {
      const [type, hourStr] = key.split(':');
      const hour = parseInt(hourStr);
      return (hour - 18 + 24) % 24;
    };

    const sortedNames = Array.from(uniqueBuckets).sort((a, b) => {
      const [typeA] = a.split(':');
      const [typeB] = b.split(':');
      if (typeA !== typeB) return typeA === 'Wake' ? 1 : -1;
      return getSortValue(a) - getSortValue(b);
    });

    // 3. Initialize nodes in sorted order
    sortedNames.forEach(key => {
      const [type, hour] = key.split(':');
      nodeMap.set(key, nodes.length);
      nodes.push({ name: key, type, hour: parseInt(hour) });
    });

    const linkMap = new Map();
    
    sourceData.forEach(d => {
      if (d.sleep_events) {
        d.sleep_events.forEach(event => {
          const sleepBucket = getBucket(event.start);
          const wakeBucket = getBucket(event.end);
          
          // Skip self-loops and nonsensical evening wake times
          if (sleepBucket === wakeBucket || wakeBucket >= 18) return;

          const sleepKey = `Sleep:${sleepBucket}`;
          const wakeKey = `Wake:${wakeBucket}`;
          
          const source = nodeMap.get(sleepKey);
          const target = nodeMap.get(wakeKey);
          
          if (source === undefined || target === undefined) return;
          
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

    for (const link of linkMap.values()) {
      const avgDuration = link.durations.reduce((a, b) => a + b, 0) / link.durations.length;
      links.push({
        source: link.source,
        target: link.target,
        // Minimal boost to ensure visibility without distortion
        value: link.value + 0.3, 
        originalValue: link.value,
        fill: getLinkColor(avgDuration),
        avgDuration
      });
    }

    nodes.forEach((node, i) => {
      const connectedLinks = links.filter(l => l.source === i || l.target === i);
      let dominantLink = null;
      let maxVal = -1;
      
      connectedLinks.forEach(l => {
        if (l.value > maxVal) {
          maxVal = l.value;
          dominantLink = l;
        }
      });

      if (dominantLink) {
        node.fill = dominantLink.fill;
        node.avgDuration = dominantLink.avgDuration;
      } else {
        const durations = nodeDurations.get(i) || [];
        const avgDuration = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);
        node.fill = getLinkColor(avgDuration);
        node.avgDuration = avgDuration;
      }
    });

    const totalOriginalEvents = links.reduce((sum, l) => sum + l.originalValue, 0);
    return { nodes, links, totalEvents: totalOriginalEvents };
  }, [visibleData, allDailyData]);

  const dynamicHeight = useMemo(() => {
    if (!sankeyData.links.length) return 600;
    const minNodeHeight = 13; // for 11px font
    const padding = 12;
    
    const sleepNodes = sankeyData.nodes.filter(n => n.type === 'Sleep').length;
    const wakeNodes = sankeyData.nodes.filter(n => n.type === 'Wake').length;
    const maxNodesSide = Math.max(sleepNodes, wakeNodes);
    const totalBoostedValue = sankeyData.links.reduce((sum, l) => sum + l.value, 0);
    
    const vMin = 1.3; // (1 original + 0.3 boost)
    const requiredHeight = (minNodeHeight * totalBoostedValue / vMin) + (maxNodesSide * padding) + 150;
    
    return Math.max(500, Math.min(1000, requiredHeight));
  }, [sankeyData]);

  return (
    <div className="grid">
      <div className="card chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0 }}><Clock size={20} /> Sleep Dynamics</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7, marginTop: '0.3rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Analyzing {sankeyData.totalEvents} historical nights
            </div>
          </div>
          <button 
            className="timeframe-btn"
            onClick={() => setUse24Hour(!use24Hour)}
            style={{ fontSize: '0.65rem', padding: '0.35rem 0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}
          >
            {use24Hour ? 'Switch to 12H Clock' : 'Switch to 24H Clock'}
          </button>
        </div>
        <div style={{ width: '100%', height: dynamicHeight, position: 'relative' }}>
          {/* Column Headers */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: 'var(--text-secondary)',
            opacity: 0.8,
            textTransform: 'uppercase',
            pointerEvents: 'none'
          }}>
            <div style={{ width: 140, textAlign: 'center' }}>Bedtime</div>
            <div style={{ width: 140, textAlign: 'center' }}>Wake Up</div>
          </div>
          
          <ResponsiveContainer>
            <Sankey
              data={sankeyData}
              node={<SankeyNode use24Hour={use24Hour} setHoveredNode={setHoveredNode} />}
              link={<SankeyLink hoveredNode={hoveredNode} />}
              margin={{ top: 20, right: 140, bottom: 20, left: 140 }}
              nodeWidth={14}
              nodePadding={14}
              iterations={64}
            />
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div style={{ 
          marginTop: '1rem', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '2rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-secondary)',
          opacity: 0.6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F43F5E' }} />
            <span>Insufficient (&lt; 6h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1' }} />
            <span>Optimal (6-8h)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
            <span>Excessive (&gt; 8h)</span>
          </div>
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
