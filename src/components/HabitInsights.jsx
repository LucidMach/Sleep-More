import { Zap, Info } from 'lucide-react';

const HabitInsights = ({ correlations }) => (
  <div className="card">
    <h2><Zap size={20} /> Habit Insights</h2>
    <div className="correlation-grid">
      {correlations.map((corr, idx) => (
        <div key={idx} className="correlation-item">
          <div className="stat-label">{corr.name}</div>
          <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
            {corr.strength > 0.3 ? 'Strong Positive' : corr.strength < -0.3 ? 'Strong Negative' : 'Low Correlation'}
          </div>
          <div className="strength-bar">
            <div 
              className="strength-fill" 
              style={{ width: `${Math.abs(corr.strength) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
      <Info size={16} />
      Data suggests that your Deep sleep is most impacted by your daily step count.
    </div>
  </div>
);

export default HabitInsights;
