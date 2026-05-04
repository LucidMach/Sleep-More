import { useMemo, useState } from 'react';
import { Activity, Clock, Moon, Sun } from 'lucide-react';
import SankeySection, { processSankeyData, getBucket } from './SankeySection';
import HabitsChart from './HabitsChart';
import CircadianChart from './CircadianChart';
import RecoveryCorrelationChart from './RecoveryCorrelationChart';

const SleepCharts = ({ visibleData, allDailyData }) => {
  const [use24Hour, setUse24Hour] = useState(true);

  const { nightSankey, daySankey } = useMemo(() => {
    const sourceData = (allDailyData && allDailyData.length > 0) ? allDailyData : visibleData;
    const nightEvents = [];
    const dayEvents = [];

    sourceData.forEach(d => {
      if (d.sleep_events) {
        d.sleep_events.forEach(event => {
          const hour = getBucket(event.start);
          const isNight = hour >= 18 || hour < 6;
          if (isNight) nightEvents.push(event);
          else dayEvents.push(event);
        });
      }
    });

    return {
      nightSankey: processSankeyData(nightEvents, 18),
      daySankey: processSankeyData(dayEvents, 6)
    };
  }, [visibleData, allDailyData]);

  return (
    <div className="grid">
      <SankeySection 
        title="Nocturnal Cycles" 
        icon={Moon} 
        data={nightSankey} 
        use24Hour={use24Hour} 
      />

      <SankeySection 
        title="Diurnal Patterns" 
        icon={Sun} 
        data={daySankey} 
        use24Hour={use24Hour} 
      />

      <HabitsChart data={visibleData} />
      <CircadianChart data={visibleData} />
      <div style={{ gridColumn: '1 / -1' }}>
        <RecoveryCorrelationChart data={allDailyData} />
      </div>
    </div>
  );
};

export default SleepCharts;
