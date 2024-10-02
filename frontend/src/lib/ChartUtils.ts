export function getDateFromDayAndPercent(startDate: Date, daysToAdd, percentOfDay = 0) {
  const hoursToAdd = Math.floor(24 * percentOfDay);
  const minutesToAdd = Math.floor((24 * percentOfDay - hoursToAdd) * 60);
  const secondsToAdd = Math.floor(((24 * percentOfDay - hoursToAdd) * 60 - minutesToAdd) * 60);
  const millisecondsToAdd = Math.floor((((24 * percentOfDay - hoursToAdd) * 60 - minutesToAdd) * 60 - secondsToAdd) * 1000);
  const newDate = new Date(startDate);
  newDate.setDate(startDate.getDate() + daysToAdd);
  newDate.setHours(hoursToAdd);
  newDate.setMinutes(minutesToAdd);
  newDate.setSeconds(secondsToAdd);
  newDate.setMilliseconds(millisecondsToAdd);
  return newDate;
}

const _MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateDaysDiff(a: Date, b: Date) {
  if (!a || !b) return 365;

  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return (utc2 - utc1) / _MS_PER_DAY;
}