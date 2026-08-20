const isFuelStop = (evt) => evt.type === 'ON' && /fuel/i.test(evt.remarks || '');

const EMPTY_STATS = {
  miles: 0,
  driveMs: 0,
  elapsedMs: 0,
  breaks: 0,
  resets: 0,
  fuelStops: 0,
  days: 0,
  departure: null,
  cycleRemaining: null,
  cycleUsed: null,
};

export function deriveTripStats(data) {
  const events = Array.isArray(data?.events) ? data.events : [];

  if (events.length === 0) return { ...EMPTY_STATS };

  const stamps = events.flatMap((e) => [new Date(e.start).getTime(), new Date(e.end).getTime()]);
  const dayKeys = new Set(
    events.flatMap((e) => [
      new Date(e.start).toDateString(),
      new Date(new Date(e.end).getTime() - 1).toDateString(),
    ])
  );

  return {
    miles: events.reduce((sum, e) => sum + (e.miles || 0), 0),
    driveMs: events
      .filter((e) => e.type === 'D')
      .reduce((sum, e) => sum + (new Date(e.end) - new Date(e.start)), 0),
    elapsedMs: Math.max(...stamps) - Math.min(...stamps),
    breaks: events.filter((e) => /30-min/i.test(e.remarks || '')).length,
    resets: events.filter((e) => e.type === 'SB' || /34-hr/i.test(e.remarks || '')).length,
    fuelStops: events.filter(isFuelStop).length,
    days: dayKeys.size,
    departure: new Date(Math.min(...stamps)),
    cycleRemaining: data?.cycle?.cycle_remaining_hours ?? null,
    cycleUsed: data?.cycle?.cycle_used_hours ?? null,
  };
}

export function formatDuration(ms) {
  if (!ms || ms < 0) return '0h';
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatClock(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function eventTone(evt) {
  if (evt.type === 'D') return 'drive';
  if (evt.type === 'SB' || /10-hr|34-hr/i.test(evt.remarks || '')) return 'rest';
  if (evt.type === 'OFF') return 'break';
  if (isFuelStop(evt)) return 'fuel';
  return 'duty';
}

export { isFuelStop };
