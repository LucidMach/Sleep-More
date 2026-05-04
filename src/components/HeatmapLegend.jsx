const HeatmapLegend = () => (
  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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
);

export default HeatmapLegend;
