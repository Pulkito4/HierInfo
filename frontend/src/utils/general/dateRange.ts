/**
 * Produce the start and end of the day for the provided reference date.
 */
export function getDayBoundaries(reference: Date = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}
