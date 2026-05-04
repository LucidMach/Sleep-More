import Papa from 'papaparse';
import fs from 'fs';

const csv = fs.readFileSync('public/data.csv', 'utf8');
const results = Papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
const data = results.data.filter(row => row.mins_asleep > 0);

let events = [];
data.forEach(row => {
  if (row.sleep_start && row.sleep_end) {
    const [h1, m1] = row.sleep_start.split(':').map(Number);
    const [h2, m2] = row.sleep_end.split(':').map(Number);
    let s1 = h1 * 60 + m1;
    let s2 = h2 * 60 + m2;
    if (s2 < s1) s2 += 1440;
    
    events.push({ start: s1, end: s2, duration: row.mins_asleep, date: row.date });
  }
});

let wrongEvents = events.filter(e => {
  const getBucket = (mins) => Math.floor((mins % 1440) / 60);
  const startBucket = getBucket(e.start);
  const endBucket = getBucket(e.end);
  // "I wake up before I sleep" -> endBucket < startBucket? No, that's normal for overnight.
  // Wait, what if duration is short but visual flow is long?
  return false;
});
console.log("Total events:", events.length);
events.slice(0, 10).forEach(e => {
  const getBucket = (mins) => Math.floor((mins % 1440) / 60);
  console.log(`Date: ${e.date}, Start: ${e.start} (${getBucket(e.start)}), End: ${e.end} (${getBucket(e.end)}), Duration: ${e.duration}`);
});
