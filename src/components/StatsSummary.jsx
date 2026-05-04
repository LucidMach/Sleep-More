const StatsSummary = ({ display }) => (
  <div style={{ paddingTop: '1.5rem', display: 'flex', gap: '5rem', borderTop: '1px solid var(--card-border)', marginTop: '1.5rem' }}>
    <div style={{ flexGrow: 0.1 }}>
      <div className="stat-label" style={{ marginBottom: '0.2rem', fontSize: '0.65rem' }}>SLEEP QUALITY</div>
      <div style={{ display: 'flex', direction: "column", alignItems: 'baseline', gap: '0.75rem' }}>
        <div className="stat-value" style={{ fontSize: '1.75rem' }}>{display.sleep_quality_score}%</div>
      </div>
      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-color)', opacity: 0.8 }}>
        (REM + Deep) / Time Asleep
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', marginTop: "0.75rem" }}>
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
);

export default StatsSummary;
