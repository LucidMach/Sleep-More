import { format } from 'date-fns';
import HeatmapCell from './HeatmapCell';

const YearGrid = ({ year, weeks, months, getCellColor, setHovered, onSelectDate, data }) => (
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
    <div style={{ 
      writingMode: 'vertical-rl', 
      transform: 'rotate(180deg)', 
      fontSize: '1.5rem', 
      fontWeight: 900, 
      color: 'var(--accent-color)', 
      opacity: 0.15,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '24px',
      letterSpacing: '0.1em',
      userSelect: 'none',
      alignSelf: 'stretch'
    }}>
      {year}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', height: '20px', marginBottom: '4px', position: 'relative' }}>
        {months.map((m, i) => (
          <div key={i} style={{ 
            position: 'absolute', 
            left: 40 + (m.weekIndex * 18), 
            fontSize: '0.7rem', 
            color: 'var(--text-secondary)',
            fontWeight: 700,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap'
          }}>
            {m.name}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
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

        <div style={{ display: 'flex', gap: '4px' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Array.from({ length: 7 }).map((_, di) => {
                const dayData = week[di];
                return (
                  <HeatmapCell
                    key={di}
                    dayData={dayData}
                    style={getCellColor(dayData?.data)}
                    onMouseEnter={setHovered}
                    onMouseLeave={() => setHovered(null)}
                    onClick={(dateStr) => {
                      const idx = data.findIndex(d => d.label === dateStr);
                      if (idx !== -1) onSelectDate(idx);
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

export default YearGrid;
