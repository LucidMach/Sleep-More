import { useState, useMemo } from 'react';
import { Calendar, Info } from 'lucide-react';
import { 
  parseISO, 
  getYear, 
  getDay, 
  format, 
  eachDayOfInterval, 
  getMonth,
  endOfWeek,
  startOfWeek,
} from 'date-fns';

// Sub-components
import YearGrid from './YearGrid';
import HeatmapLegend from './HeatmapLegend';
import StatsSummary from './StatsSummary';
import DetailPanel from './DetailPanel';

const SleepHeatmap = ({ data, onSelectDate, timeframe }) => {
  const [hovered, setHovered] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const { yearGroups, allYears } = useMemo(() => {
    if (!data || data.length === 0) return { yearGroups: {}, allYears: [] };

    const years = [...new Set(data.map(d => getYear(parseISO(d.label))))].sort((a, b) => a - b);
    const groups = {};

    years.forEach(year => {
      const yearData = data.filter(d => getYear(parseISO(d.label)) === year);
      if (yearData.length === 0) return;

      const dates = yearData.map(d => parseISO(d.label));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      
      const rangeStart = startOfWeek(minDate);
      const rangeEnd = endOfWeek(maxDate);
      const daysInRange = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      
      const dayMap = new Map();
      yearData.forEach(d => {
        dayMap.set(d.label, d);
      });

      const weeks = [];
      let currentWeek = [];
      
      daysInRange.forEach((day, i) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const d = dayMap.get(dateStr);
        const dayOfWeek = getDay(day);
        
        currentWeek[dayOfWeek] = { date: day, data: d, dateStr };

        if (dayOfWeek === 6 || i === daysInRange.length - 1) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      });

      const months = [];
      let lastMonth = -1;
      weeks.forEach((week, weekIndex) => {
        const dayInYear = week.find(d => d && getYear(d.date) === year);
        const referenceDay = dayInYear || week.find(d => d);
        if (referenceDay) {
          const m = getMonth(referenceDay.date);
          if (m !== lastMonth) {
            months.push({ name: format(referenceDay.date, 'MMM'), weekIndex });
            lastMonth = m;
          }
        }
      });

      groups[year] = { weeks, months };
    });

    return { yearGroups: groups, allYears: years };
  }, [data]);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return {};

    let filteredData = data;
    let label = 'Overall Average';

    if (timeframe === 'weekly') {
      filteredData = data.slice(-7);
      label = 'Weekly Average';
    } else if (timeframe === 'monthly') {
      filteredData = data.slice(-30);
      label = 'Monthly Average';
    } else if (timeframe === 'quarterly') {
      filteredData = data.slice(-90);
      label = 'Quarterly Average';
    } else if (timeframe === 'yearly') {
      filteredData = data.slice(-365);
      label = 'Yearly Average';
    }

    const count = filteredData.length || 1;
    const avgQuality = Math.round(filteredData.reduce((acc, d) => acc + d.sleep_quality_score, 0) / count);
    const avgMins = Math.round(filteredData.reduce((acc, d) => acc + d.mins_asleep, 0) / count);
    const avgDeep = Math.round(filteredData.reduce((acc, d) => acc + d.mins_deep, 0) / count);
    const avgRem = Math.round(filteredData.reduce((acc, d) => acc + d.mins_rem, 0) / count);
    const avgCore = Math.round(filteredData.reduce((acc, d) => acc + d.mins_core, 0) / count);
    const avgAwake = Math.round(filteredData.reduce((acc, d) => acc + d.mins_awake, 0) / count);
    const avgMixed = Math.round(filteredData.reduce((acc, d) => acc + d.mins_mixed, 0) / count);

    const avgHrvAsleep = Math.round(filteredData.reduce((acc, d) => acc + d.hrv_asleep_avg, 0) / count);
    const avgHrvAwake = Math.round(filteredData.reduce((acc, d) => acc + d.hrv_awake_avg, 0) / count);
    const avgRatio = Number((avgHrvAsleep / (avgHrvAwake || 1)).toFixed(2));

    return {
      sleep_quality_score: avgQuality,
      mins_asleep: avgMins,
      mins_deep: avgDeep,
      mins_rem: avgRem,
      mins_core: avgCore,
      mins_awake: avgAwake,
      mins_mixed: avgMixed,
      hrv_asleep_avg: avgHrvAsleep,
      hrv_awake_avg: avgHrvAwake,
      recovery_ratio: avgRatio,
      label
    };
  }, [data, timeframe]);

  const display = hovered || stats;
  const total = display.mins_asleep + display.mins_awake;
  const hrs = display.mins_asleep / 60;
  const isOptimal = hrs >= 6 && hrs <= 8;
  const isCritical = hrs < 4 || hrs > 10;
  const barWidth = isOptimal ? Math.min(100, (total / 480) * 100) : 100;
  
  const stages = [
    { label: 'Deep', mins: display.mins_deep, color: 'var(--deep)' },
    { label: 'REM', mins: display.mins_rem, color: 'var(--rem)' },
    { label: 'Core', mins: display.mins_core, color: 'var(--core)' },
    { label: 'Mixed', mins: display.mins_mixed, color: '#64748b' },
    { label: 'Awake', mins: display.mins_awake, color: 'var(--awake)' },
  ];

  const getBaseColor = (d) => {
    if (!d) return [148, 163, 184]; // Default secondary text color
    const hrs = d.mins_asleep / 60;
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
    return [r, g, b];
  };

  const getCellColor = (d) => {
    if (!d) return { background: 'rgba(255,255,255,0.03)', border: 'none', boxShadow: 'none' };
    const [r, g, b] = getBaseColor(d);
    const opacity = Math.max(0.2, d.sleep_quality_score / 100);
    const saturation = 30 + (d.sleep_quality_score * 0.7);
    const filter = `saturate(${saturation}%)`;
    let borderColor = 'none';
    let boxShadow = 'none';
    
    const hrs = d.mins_asleep / 60;
    if (d.sleep_quality_score > 85) {
      borderColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
      boxShadow = `0 0 8px rgba(${r}, ${g}, ${b}, 0.4)`;
    } else if (hrs < 6) {
      boxShadow = 'inset 2px 2px 3px rgba(0,0,0,0.6), inset -1px -1px 2px rgba(255,255,255,0.05)';
    } else if (hrs > 8) {
      boxShadow = '2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(255,255,255,0.05)';
    }

    return { 
      background: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      border: borderColor !== 'none' ? `1px solid ${borderColor}` : '1px solid rgba(255,255,255,0.03)',
      boxShadow,
      filter
    };
  };

  return (
    <div style={{ position: 'relative', marginBottom: '2rem' }}>
      {showInfo && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ maxWidth: '600px', width: '100%', position: 'relative' }}>
             <button 
              onClick={() => setShowInfo(false)}
              style={{ position: 'absolute', top: '-1rem', right: '-1rem', width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'var(--accent-color)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 101 }}
            >
              ×
            </button>
            <SleepInfo />
          </div>
        </div>
      )}

      <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}><Calendar size={20} /> Sleep Quality History</h2>
            <button 
              onClick={() => setShowInfo(true)}
              className="timeframe-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}
            >
              <Info size={16} /> Guide
            </button>
          </div>

          <div className="heatmap-scroll-wrapper" style={{ overflowX: 'auto', paddingBottom: '1rem', cursor: 'grab' }}>
            <div style={{ display: 'flex', gap: '1rem', width: 'max-content', padding: '0.5rem' }}>
              {allYears.map(year => (
                <YearGrid 
                  key={year}
                  year={year}
                  weeks={yearGroups[year].weeks}
                  months={yearGroups[year].months}
                  getCellColor={getCellColor}
                  setHovered={setHovered}
                  onSelectDate={onSelectDate}
                  data={data}
                />
              ))}
            </div>
          </div>

          <HeatmapLegend />
          <StatsSummary display={display} />
        </div>

        <DetailPanel 
          display={display}
          total={total}
          hrs={hrs}
          isOptimal={isOptimal}
          isCritical={isCritical}
          barWidth={barWidth}
          stages={stages}
          baseColor={`rgb(${getBaseColor(display).join(',')})`}
        />
      </div>
    </div>
  );
};

export default SleepHeatmap;
