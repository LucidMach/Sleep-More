import Papa from 'papaparse';
import { 
  startOfWeek, 
  startOfMonth, 
  startOfQuarter, 
  startOfYear, 
  format, 
  parseISO,
  eachDayOfInterval,
  isSameDay
} from 'date-fns';

export const fetchData = async () => {
  const response = await fetch('/data.csv');
  const reader = response.body.getReader();
  const result = await reader.read();
  const decoder = new TextDecoder('utf-8');
  const csv = decoder.decode(result.value);
  
  return new Promise((resolve) => {
    Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Filter out records with no sleep data
        const filtered = results.data.filter(row => row.mins_asleep > 0);
        resolve(filtered);
      },
    });
  });
};

export const aggregateData = (data, timeframe) => {
  const grouped = {};
  
  data.forEach((row) => {
    if (!row.date) return;
    const date = parseISO(row.date);
    let key;
    
    switch (timeframe) {
      case 'weekly':
        key = format(startOfWeek(date), 'yyyy-MM-dd');
        break;
      case 'monthly':
        key = format(startOfMonth(date), 'yyyy-MM');
        break;
      case 'quarterly':
        key = format(startOfQuarter(date), 'yyyy-[Q]Q');
        break;
      case 'yearly':
        key = format(startOfYear(date), 'yyyy');
        break;
      default:
        key = row.date;
    }
    
    if (!grouped[key]) {
      grouped[key] = {
        label: key,
        count: 0,
        mins_asleep: 0,
        mins_core: 0,
        mins_deep: 0,
        mins_rem: 0,
        steps: 0,
        active_kcal: 0,
        hrv_asleep_avg: 0,
        hrv_awake_avg: 0,
        mins_daylight: 0,
        mins_in_bed: 0,
        sleep_starts: [],
      };
    }
    
    const g = grouped[key];
    g.count++;
    g.mins_asleep += row.mins_asleep || 0;
    g.mins_core += row.mins_core || 0;
    g.mins_deep += row.mins_deep || 0;
    g.mins_rem += row.mins_rem || 0;
    g.steps += row.steps || 0;
    g.active_kcal += row.active_kcal || 0;
    g.hrv_asleep_avg += row.hrv_asleep_avg || 0;
    g.hrv_awake_avg += row.hrv_awake_avg || 0;
    g.mins_daylight += row.mins_daylight || 0;
    
    if (row.sleep_start && row.sleep_end) {
      const [h1, m1] = row.sleep_start.split(':').map(Number);
      const [h2, m2] = row.sleep_end.split(':').map(Number);
      let s1 = h1 * 60 + m1;
      let s2 = h2 * 60 + m2;
      
      // If sleep end is early morning and start is late night
      if (s2 < s1) s2 += 1440;
      
      g.mins_in_bed += (s2 - s1);
      
      let mins = s1;
      if (h1 < 12) mins += 1440; 
      g.sleep_starts.push(mins);
    }
  });
  
  return Object.values(grouped).map(g => {
    const avgSleep = g.mins_asleep / g.count;
    const avgInBed = g.mins_in_bed / g.count;
    const avgDeep = g.mins_deep / g.count;
    const avgRem = g.mins_rem / g.count;
    const avgCore = g.mins_core / g.count;
    const avgDeepRem = (g.mins_deep + g.mins_rem) / g.count;
    
    // Calculate bedtime consistency (std deviation of sleep starts)
    const avgStart = g.sleep_starts.reduce((a, b) => a + b, 0) / (g.sleep_starts.length || 1);
    const variance = g.sleep_starts.reduce((a, b) => a + Math.pow(b - avgStart, 2), 0) / (g.sleep_starts.length || 1);
    const consistency = Math.sqrt(variance);

    return {
      ...g,
      mins_asleep: Math.round(avgSleep),
      mins_in_bed: Math.round(avgInBed),
      mins_awake: Math.round(Math.max(0, avgInBed - avgSleep)),
      mins_core: Math.round(avgCore),
      mins_deep: Math.round(avgDeep),
      mins_rem: Math.round(avgRem),
      mins_mixed: Math.round(Math.max(0, avgSleep - (avgCore + avgDeep + avgRem))),
      steps: Math.round(g.steps / g.count),
      active_kcal: Math.round(g.active_kcal / g.count),
      hrv_asleep_avg: Math.round(g.hrv_asleep_avg / g.count),
      hrv_awake_avg: Math.round(g.hrv_awake_avg / g.count),
      mins_daylight: Math.round(g.mins_daylight / g.count),
      sleep_quality_score: Math.round(Math.min(100, ((avgDeep + avgRem) / (avgSleep * 0.5 || 1)) * 100)),
      consistency_score: Math.round(Math.max(0, 100 - (consistency / 60) * 20)), // Scale consistency to 0-100
      recovery_ratio: (g.hrv_asleep_avg / (g.hrv_awake_avg || 1)).toFixed(2),
    };
  });
};

export const calculateCorrelations = (data) => {
  // Simple correlation analysis
  // Higher steps vs deep sleep
  // Higher daylight vs rem sleep
  // etc.
  
  const correlations = [
    { name: 'Steps vs Deep Sleep', factor1: 'steps', factor2: 'mins_deep' },
    { name: 'Daylight vs Sleep Quality', factor1: 'mins_daylight', factor2: 'mins_asleep' },
    { name: 'Activity vs HRV', factor1: 'active_kcal', factor2: 'hrv_asleep_avg' },
  ];
  
  return correlations.map(corr => {
    const values = data.filter(d => d[corr.factor1] > 0 && d[corr.factor2] > 0);
    if (values.length < 2) return { ...corr, strength: 0 };
    
    // Simple Pearson correlation placeholder or just trend check
    const avg1 = values.reduce((sum, d) => sum + d[corr.factor1], 0) / values.length;
    const avg2 = values.reduce((sum, d) => sum + d[corr.factor2], 0) / values.length;
    
    let num = 0;
    let den1 = 0;
    let den2 = 0;
    
    values.forEach(d => {
      const d1 = d[corr.factor1] - avg1;
      const d2 = d[corr.factor2] - avg2;
      num += d1 * d2;
      den1 += d1 * d1;
      den2 += d2 * d2;
    });
    
    const strength = num / Math.sqrt(den1 * den2);
    return { ...corr, strength: isNaN(strength) ? 0 : strength };
  });
};
