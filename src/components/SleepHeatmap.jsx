import { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { 
  parseISO, 
  getYear, 
  getDay, 
  format, 
  startOfYear, 
  endOfYear, 
  eachDayOfInterval, 
  isSameDay,
  getMonth,
  startOfMonth,
  addWeeks,
  differenceInWeeks,
  endOfWeek,
  startOfWeek,
  endOfMonth
} from 'date-fns';

const SleepHeatmap = ({ data, onSelectDate }) => {
  const [hovered, setHovered] = useState(null);

  // Group data by year and fill gaps
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

      // Prepare weeks and months
      const weeks = [];
      let currentWeek = [];
      
      daysInRange.forEach((day, i) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const d = dayMap.get(dateStr);
        const dayOfWeek = getDay(day);
        
        currentWeek[dayOfWeek] = { 
          date: day, 
          data: d, 
          dateStr 
        };

        if (dayOfWeek === 6 || i === daysInRange.length - 1) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      });

      // Get month positions
      const months = [];
      let lastMonth = -1;
      weeks.forEach((week, weekIndex) => {
        // Find a day in this week that belongs to the current year to get the correct month name
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
  
  const barWidth = isOptimal ? Math.min(100, (total / 480) * 100) : 100;
  
  const stages = [
    { label: 'Deep', mins: display.mins_deep, color: 'var(--deep)' },
    { label: 'REM', mins: display.mins_rem, color: 'var(--rem)' },
    { label: 'Core', mins: display.mins_core, color: 'var(--core)' },
    { label: 'Mixed', mins: display.mins_mixed, color: '#64748b' },
    { label: 'Awake', mins: display.mins_awake, color: 'var(--awake)' },
  ];

  const getCellColor = (d) => {
    if (!d) return { background: 'rgba(255,255,255,0.03)', border: 'none', boxShadow: 'none' };
    const hrs = d.mins_asleep / 60;
    const opacity = Math.max(0.2, d.sleep_quality_score / 100);
    const saturation = 30 + (d.sleep_quality_score * 0.7); // 30% to 100% saturation
    const filter = `saturate(${saturation}%)`;
    let r, g, b;
    let borderColor = 'none';
    let boxShadow = 'none';
    
    if (hrs >= 6 && hrs <= 8) {
      r = 99; g = 102; b = 241; // Purple
      if (d.sleep_quality_score > 85) {
        borderColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
        boxShadow = `0 0 8px rgba(${r}, ${g}, ${b}, 0.4)`;
      }
    } else if (hrs < 6) {
      const ratio = Math.min(1, hrs / 6);
      r = Math.round(239 + (245 - 239) * ratio);
      g = Math.round(68 + (158 - 68) * ratio);
      b = Math.round(68 + (11 - 68) * ratio);
      if (d.sleep_quality_score > 85) {
        borderColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
        boxShadow = `0 0 8px rgba(${r}, ${g}, ${b}, 0.4)`;
      } else {
        boxShadow = 'inset 2px 2px 3px rgba(0,0,0,0.6), inset -1px -1px 2px rgba(255,255,255,0.05)';
      }
    } else {
      const ratio = Math.min(1, (hrs - 8) / 4);
      r = Math.round(245 + (239 - 245) * ratio);
      g = Math.round(158 + (68 - 158) * ratio);
      b = Math.round(11 + (68 - 11) * ratio);
      if (d.sleep_quality_score > 85) {
        borderColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
        boxShadow = `0 0 8px rgba(${r}, ${g}, ${b}, 0.4)`;
      } else {
        boxShadow = '2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(255,255,255,0.05)';
      }
    }
    return { 
      background: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      border: borderColor !== 'none' ? `1px solid ${borderColor}` : '1px solid rgba(255,255,255,0.03)',
      boxShadow,
      filter
    };
  };

  return (
    <div className="card" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
      <div style={{ minWidth: 0 }}>
        <h2><Calendar size={20} /> Sleep Quality History</h2>
        <div className="heatmap-scroll-wrapper" style={{ overflowX: 'auto', paddingBottom: '1rem', cursor: 'grab' }}>
          <div style={{ display: 'flex', gap: '1rem', width: 'max-content', padding: '0.5rem' }}>
            {allYears.map(year => {
              const { weeks, months } = yearGroups[year];
              return (
                <div key={year} style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                  {/* Vertical Year Label */}
                  <div style={{ 
                    writingMode: 'vertical-rl', 
                    transform: 'rotate(180deg)', 
                    fontSize: '1.5rem', 
                    fontWeight: 900, 
                    color: 'var(--text-secondary)', 
                    opacity: 0.1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: '24px', // Align with grid start (below month labels)
                    letterSpacing: '0.1em',
                    userSelect: 'none',
                    alignSelf: 'stretch'
                  }}>
                    {year}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Month Labels */}
                    <div style={{ display: 'flex', height: '20px', marginBottom: '4px', position: 'relative' }}>
                      {months.map((m, i) => (
                        <div key={i} style={{ 
                          position: 'absolute', 
                          left: 40 + (m.weekIndex * 18), 
                          fontSize: '0.7rem', 
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap'
                        }}>
                          {m.name}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      {/* Weekday Labels */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', marginRight: '8px' }}>
                        {['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'].map((day, i) => (
                          <div key={i} style={{ 
                            height: 14, 
                            width: 32,
                            fontSize: '0.55rem', 
                            color: 'var(--text-secondary)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 600,
                            opacity: 0.4 
                          }}>
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* The Grid */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {weeks.map((week, wi) => (
                          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {Array.from({ length: 7 }).map((_, di) => {
                              const dayData = week[di];
                              const style = getCellColor(dayData?.data);
                              return (
                                <div 
                                  key={di}
                                  className="heatmap-cell"
                                  style={style}
                                  onMouseEnter={() => dayData?.data && setHovered({ ...dayData.data, label: dayData.dateStr })}
                                  onMouseLeave={() => setHovered(null)}
                                  onClick={() => {
                                    if (dayData?.data) {
                                      // Find index in original data
                                      const idx = data.findIndex(d => d.label === dayData.dateStr);
                                      if (idx !== -1) onSelectDate(idx);
                                    }
                                  }}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Low Quality</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[0.2, 0.4, 0.6, 0.8, 1].map(q => (
                  <div 
                    key={q} 
                    style={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: 2, 
                      background: `rgba(99, 102, 241, ${q})`,
                      filter: `saturate(${30 + q * 70}%)`,
                      border: q > 0.8 ? '1px solid rgba(99, 102, 241, 0.8)' : 'none'
                    }} 
                  />
                ))}
              </div>
              <span>High Quality</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--card-border)', paddingLeft: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(148, 163, 184, 1)', boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.5)' }} />
                <span style={{ fontSize: '0.65rem' }}>Indent: Under-sleep</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(148, 163, 184, 1)', boxShadow: '1px 1px 2px rgba(0,0,0,0.5)' }} />
                <span style={{ fontSize: '0.65rem' }}>Bulge: Over-sleep</span>
              </div>
            </div>
          </div>

          
        </div>

        <div style={{ paddingTop: '1.5rem',display: 'flex', gap: '5rem', borderTop: '1px solid var(--card-border)', marginTop: '1.5rem' }}>
          <div style={{flexGrow: 0.1}}>
            <div className="stat-label" style={{ marginBottom: '0.2rem', fontSize: '0.65rem' }}>SLEEP QUALITY</div>
            <div style={{ display: 'flex', direction: "column", alignItems: 'baseline', gap: '0.75rem' }}>
              <div className="stat-value" style={{ fontSize: '1.75rem' }}>{display.sleep_quality_score}%</div>
            </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-color)', opacity: 0.8 }}>
                (REM + Deep) / Time Asleep
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', marginTop: "0.75rem"}}>
              *normalised to a scale of 0-100
                </p>
          </div>
          <div style={{ width: '1px', background: 'rgba(148, 163, 184, 0.4)', alignSelf: 'stretch' }}></div>
          <div style={{ flexGrow: 0.9 }}>
            <div className="stat-label" style={{ marginBottom: '0.2rem', fontSize: '0.65rem' }}>SLEEP QUANTITY</div>
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

export default SleepHeatmap;
