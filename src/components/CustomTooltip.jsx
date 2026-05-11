const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="tooltip-item" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span>{entry.value}{
              entry.name.includes('mins') || entry.name.includes('duration') ? 'm' : 
              entry.name.includes('Quality') || entry.name.includes('score') ? '%' : ''
            }</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
