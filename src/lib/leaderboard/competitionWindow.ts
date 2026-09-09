/**
 * The monthly competition runs the 2nd Sunday of the month through the following Saturday
 * (7 days), UTC. This must stay in sync with the external scraping pipeline's own competition-window
 * logic, which defines the same window on its side.
 */
export function getSecondSundayWindow(year: number, monthIndex: number): { start: Date; end: Date } {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex, 1));
  const daysToFirstSunday = (7 - firstOfMonth.getUTCDay()) % 7;
  const firstSunday = new Date(Date.UTC(year, monthIndex, 1 + daysToFirstSunday));
  const start = new Date(firstSunday);
  start.setUTCDate(firstSunday.getUTCDate() + 7);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

/** The current or, if this month's window has already ended, the next month's window. */
export function computeCompetitionWindow(now: Date): { start: Date; end: Date } {
  let { start, end } = getSecondSundayWindow(now.getUTCFullYear(), now.getUTCMonth());
  if (now > end) {
    let nextMonth = now.getUTCMonth() + 1;
    let nextYear = now.getUTCFullYear();
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    ({ start, end } = getSecondSundayWindow(nextYear, nextMonth));
  }
  return { start, end };
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type CompetitionPhase =
  | { phase: "starts-in"; target: Date }
  | { phase: "ends-in"; target: Date }
  | { phase: "dormant" };

/** Countdown clock only shows from 7 days before start through the end of the competition. */
export function getCompetitionPhase(now: Date): CompetitionPhase {
  const { start, end } = computeCompetitionWindow(now);
  const oneWeekBefore = new Date(start.getTime() - ONE_WEEK_MS);

  if (now >= oneWeekBefore && now < start) return { phase: "starts-in", target: start };
  if (now >= start && now <= end) return { phase: "ends-in", target: end };
  return { phase: "dormant" };
}

export function isCompetitionActive(now: Date): boolean {
  const { start, end } = computeCompetitionWindow(now);
  return now >= start && now <= end;
}

/** "Ended" banner: shown from the moment a window ends until 7 days before the next one starts. */
export function isEndedBannerVisible(now: Date): boolean {
  const currentWindow = getSecondSundayWindow(now.getUTCFullYear(), now.getUTCMonth());
  if (now <= currentWindow.end) return false;
  const { start: nextStart } = computeCompetitionWindow(now);
  const oneWeekBeforeNext = new Date(nextStart.getTime() - ONE_WEEK_MS);
  return now < oneWeekBeforeNext;
}
