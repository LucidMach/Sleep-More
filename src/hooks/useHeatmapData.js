import { useMemo } from "react";
import {
  parseISO,
  getYear,
  getDay,
  format,
  eachDayOfInterval,
  getMonth,
  endOfWeek,
  startOfWeek,
} from "date-fns";

export const useHeatmapData = (data, timeframe) => {
  const { yearGroups, allYears } = useMemo(() => {
    if (!data || data.length === 0) return { yearGroups: {}, allYears: [] };

    const years = [
      ...new Set(data.map((d) => getYear(parseISO(d.label)))),
    ].sort((a, b) => a - b);
    const groups = {};

    years.forEach((year) => {
      const yearData = data.filter((d) => getYear(parseISO(d.label)) === year);
      if (yearData.length === 0) return;

      const dates = yearData.map((d) => parseISO(d.label));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));

      const rangeStart = startOfWeek(minDate);
      const rangeEnd = endOfWeek(maxDate);
      const daysInRange = eachDayOfInterval({
        start: rangeStart,
        end: rangeEnd,
      });

      const dayMap = new Map();
      yearData.forEach((d) => {
        dayMap.set(d.label, d);
      });

      const weeks = [];
      let currentWeek = [];

      daysInRange.forEach((day, i) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const d = dayMap.get(dateStr);
        const dayOfWeek = getDay(day);

        currentWeek[dayOfWeek] = { date: day, data: d, dateStr };

        if (dayOfWeek === 6 || i === daysInRange.length - 1) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      });

      const months = [];
      let lastMonth = -1;
      weeks.forEach((week, weekIndex) => {
        const dayInYear = week.find((d) => d && getYear(d.date) === year);
        const referenceDay = dayInYear || week.find((d) => d);
        if (referenceDay) {
          const m = getMonth(referenceDay.date);
          if (m !== lastMonth) {
            months.push({ name: format(referenceDay.date, "MMM"), weekIndex });
            lastMonth = m;
          }
        }
      });

      groups[year] = { weeks, months };
    });

    return { yearGroups: groups, allYears: years };
  }, [data]);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return {};

    let filteredData = data;
    let label = "Overall Average";

    if (timeframe === "weekly") {
      filteredData = data.slice(-7);
      label = "Weekly Average";
    } else if (timeframe === "monthly") {
      filteredData = data.slice(-30);
      label = "Monthly Average";
    } else if (timeframe === "quarterly") {
      filteredData = data.slice(-90);
      label = "Quarterly Average";
    } else if (timeframe === "yearly") {
      filteredData = data.slice(-365);
      label = "Yearly Average";
    }

    const count = filteredData.length || 1;
    const avgQuality = Math.round(
      filteredData.reduce((acc, d) => acc + d.sleep_quality_score, 0) / count,
    );
    const avgMins = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_asleep, 0) / count,
    );
    const avgDeep = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_deep, 0) / count,
    );
    const avgRem = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_rem, 0) / count,
    );
    const avgCore = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_core, 0) / count,
    );
    const avgAwake = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_awake, 0) / count,
    );
    const avgMixed = Math.round(
      filteredData.reduce((acc, d) => acc + d.mins_mixed, 0) / count,
    );

    const avgHrvAsleep = Math.round(
      filteredData.reduce((acc, d) => acc + d.hrv_asleep_avg, 0) / count,
    );
    const avgHrvAwake = Math.round(
      filteredData.reduce((acc, d) => acc + d.hrv_awake_avg, 0) / count,
    );
    const avgRatio = Number((avgHrvAsleep / (avgHrvAwake || 1)).toFixed(2));

    return {
      sleep_quality_score: avgQuality,
      mins_asleep: avgMins,
      mins_deep: avgDeep,
      mins_rem: avgRem,
      mins_core: avgCore,
      mins_awake: avgAwake,
      mins_mixed: avgMixed,
      hrv_asleep_avg: avgHrvAsleep,
      hrv_awake_avg: avgHrvAwake,
      recovery_ratio: avgRatio,
      label,
    };
  }, [data, timeframe]);

  return { yearGroups, allYears, stats };
};
