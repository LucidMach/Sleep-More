const DetailPanel = ({ display, total, hrs, isOptimal, isCritical, barWidth, stages, baseColor }) => {
  const recoveryDelta = Math.abs(Math.round((display.recovery_ratio - 1) * 100));
  const isPositive = display.recovery_ratio >= 1;

  return (
    <div style={{ position: 'relative', borderLeft: '1px solid var(--card-border)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* Top Corner Badge */}
      {recoveryDelta > 0 && <div style={{ 
        position: 'absolute',
        top: 0,
        right: 0,
        fontSize: '0.75rem', 
        fontWeight: 900, 
        color: isPositive ? 'var(--success)' : 'var(--danger)',
        padding: '0.4rem 0.75rem',
        background: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderBottom: `1px solid ${isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
        borderLeft: `1px solid ${isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
        letterSpacing: '0.05em'
      }}>
        {isPositive ? '↑' : '↓'} {recoveryDelta}%
      </div>}

      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          fontSize: '0.65rem', 
          fontWeight: 900, 
          letterSpacing: '0.1em', 
          color: 'var(--accent-color)',
          marginBottom: '0.25rem',
          textTransform: 'uppercase'
        }}>
          {display.label}
        </div>
        <div className="stat-label" style={{ color: "var(--text-secondary)" }}>TOTAL DURATION</div>
        <div className="stat-value" style={{ fontSize: '2.5rem', margin: '0.25rem 0', color: baseColor }}>
          {display.mins_asleep ? `${Math.floor(display.mins_asleep / 60)}h ${display.mins_asleep % 60}m` : "-"}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div className="stat-label" style={{ color: "var(--text-secondary)", marginBottom: '0.25rem' }}>RECOVERY EFFECTIVENESS</div>
        <div className="stat-value" style={{ fontSize: '2.2rem', color: baseColor }}>
          {display.mins_asleep? display.recovery_ratio + "x" : "-"}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem', fontWeight: 500 }}>
          ASLEEP VS AWAKE HRV
        </div>
        <p style={{ margin: '10px 0', fontSize: '0.6rem', color: 'var(--text-secondary)', lineHeight: '1.4', maxWidth: '280px', opacity: 0.8 }}>
          *<strong>sustained HRV drop over 2-3 days</strong> often signals high physiological stress, illness, or incomplete recovery.
        </p>
      </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 700, textTransform: 'uppercase' }}>
          <span>Asleep HRV</span>
          <span style={{ color: 'var(--text-primary)' }}>{display.hrv_asleep_avg} ms</span>
        </div>
        <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${display.mins_asleep? Math.min(100, (display.hrv_asleep_avg / 150) * 100):0}%`, background: baseColor, borderRadius: 3 }} />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 700, textTransform: 'uppercase' }}>
          <span>Awake HRV</span>
          <span style={{ color: 'var(--text-primary)' }}>{display.hrv_awake_avg} ms</span>
        </div>
        <div style={{ height: 6, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${display.mins_asleep? Math.min(100, (display.hrv_awake_avg / 150) * 100):0}%`, background: 'var(--text-secondary)', opacity: 0.5, borderRadius: 3 }} />
        </div>
      </div>
    </div>
  </div>
  );
};

export default DetailPanel;
