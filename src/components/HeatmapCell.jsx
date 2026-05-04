const HeatmapCell = ({ dayData, style, onMouseEnter, onMouseLeave, onClick }) => {
  if (!dayData) return <div className="heatmap-cell" style={style} />;
  
  return (
    <div 
      className="heatmap-cell"
      style={style}
      onMouseEnter={() => onMouseEnter({ ...dayData.data, label: dayData.dateStr })}
      onMouseLeave={onMouseLeave}
      onClick={() => onClick(dayData.dateStr)}
    />
  );
};

export default HeatmapCell;
