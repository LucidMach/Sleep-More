import { useState } from 'react';
import { Calendar } from 'lucide-react';

const SleepHeatmap = ({ data, onSelectDate }) => {
  const [hovered, setHovered] = useState(null);

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

  return (
    <div className="card" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
      <div>
        <h2><Calendar size={20} /> Sleep Quality History</h2>
        <div className="heatmap-container">
          {data.map((d, i) => {
            const hrs = d.mins_asleep / 60;
            const opacity = Math.max(0.1, d.sleep_quality_score / 100);
            let background = '';
            let borderColor = 'none';
            let boxShadow = 'none';

            let r, g, b;
            if (hrs >= 6 && hrs <= 8) {
              r = 99; g = 102; b = 241; // Purple
              if (d.sleep_quality_score > 80) borderColor = `rgb(${r}, ${g}, ${b})`;
            } else if (hrs < 6) {
              const ratio = Math.min(1, hrs / 6);
              r = Math.round(239 + (245 - 239) * ratio);
              g = Math.round(68 + (158 - 68) * ratio);
              b = Math.round(68 + (11 - 68) * ratio);
              if (d.sleep_quality_score > 80) borderColor = `rgb(${r}, ${g}, ${b})`;
              boxShadow = 'inset 2px 2px 3px rgba(0,0,0,0.6), inset -1px -1px 2px rgba(255,255,255,0.05)'; // Indent
            } else {
              const ratio = Math.min(1, (hrs - 8) / 4);
              r = Math.round(245 + (239 - 245) * ratio);
              g = Math.round(158 + (68 - 158) * ratio);
              b = Math.round(11 + (68 - 11) * ratio);
              if (d.sleep_quality_score > 80) borderColor = `rgb(${r}, ${g}, ${b})`;
              boxShadow = '2px 2px 4px rgba(0,0,0,0.5), -1px -1px 2px rgba(255,255,255,0.05)'; // Bulge
            }
            background = `rgba(${r}, ${g}, ${b}, ${opacity})`;

            return (
              <div 
                key={i} 
                className="heatmap-cell" 
                style={{ 
                  background: background,
                  border: borderColor !== 'none' ? `1px solid ${borderColor}` : 'none',
                  boxShadow: boxShadow
                }}
                onMouseEnter={() => setHovered({ ...d, index: i })}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectDate(i)}
              />
            );
          })}
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Low Quality</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[0.2, 0.4, 0.6, 0.8, 1].map(o => <div key={o} style={{ width: 12, height: 12, borderRadius: 2, background: `rgba(99, 102, 241, ${o})` }} />)}
              </div>
              <span>High Quality</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--card-border)', paddingLeft: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(148, 163, 184, 0.2)', boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.5)' }} />
                <span style={{ fontSize: '0.65rem' }}>Indent: Under-sleep</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(148, 163, 184, 0.2)', boxShadow: '1px 1px 2px rgba(0,0,0,0.5)' }} />
                <span style={{ fontSize: '0.65rem' }}>Bulge: Over-sleep</span>
              </div>
            </div>
          </div>

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

        <div style={{ paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '1px solid var(--card-border)', marginTop: '1.5rem' }}>
          <div>
            <div className="stat-label" style={{ marginBottom: '0.2rem', fontSize: '0.65rem' }}>SLEEP QUALITY</div>
            <div style={{ display: 'flex', direction: "column", alignItems: 'baseline', gap: '0.75rem' }}>
              <div className="stat-value" style={{ fontSize: '1.75rem' }}>{display.sleep_quality_score}%</div>
            </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-color)', opacity: 0.8 }}>
                (Core + REM + Deep) / Time Asleep
              </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="stat-label" style={{ marginBottom: '0.2rem', fontSize: '0.65rem' }}>SLEEP EFFICIENCY</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <div className="stat-value" style={{ fontSize: '1.75rem', color: 'var(--success)' }}>{efficiency}%</div>
            </div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--success)', opacity: 0.8 }}>
                Time Asleep / <span style={{color: "rgba(250, 50, 50, 0.75)"}}>Time in Bed</span>
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
