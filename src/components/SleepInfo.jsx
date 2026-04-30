import { Info } from 'lucide-react';

const SleepInfo = () => (
  <div className="card">
    <h2><Info size={20} /> About Sleep Quality Score</h2>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
      The <strong>Sleep Quality Score</strong> is a restorative health metric calculated by measuring the efficiency of your sleep cycles. 
      Unlike total duration, this score focuses on the <em>depth</em> of your rest.
    </p>
    <div style={{ margin: '1rem 0', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', borderLeft: '4px solid var(--accent-color)' }}>
      <code style={{ color: 'var(--accent-color)', fontWeight: 600 }}>
        Quality = (Core + REM + Deep) / Total Sleep
      </code>
    </div>
    <ul style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <li><strong>Deep Sleep:</strong> Responsible for physical restoration and immune health.</li>
      <li><strong>REM Sleep:</strong> Essential for memory consolidation and emotional processing.</li>
      <li><strong>Core Sleep:</strong> The baseline sleep stage for cognitive maintenance.</li>
      <li><strong>Goal:</strong> Aim for a score above 85% with this revised metric.</li>
    </ul>
  </div>
);

export default SleepInfo;
