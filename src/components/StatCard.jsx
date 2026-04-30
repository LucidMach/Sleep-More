import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ label, value, trend = 'up', trendLabel }) => {
  const Icon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendClass = trend === 'up' ? 'trend-up' : 'trend-down';

  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-trend ${trendClass}`}>
        <Icon size={16} /> {trendLabel}
      </div>
    </div>
  );
};

export default StatCard;
