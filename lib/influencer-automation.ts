export const POSTING_FREQUENCIES = ["DAILY", "THREE_TIMES_WEEKLY", "WEEKLY"] as const;

export type PostingFrequency = (typeof POSTING_FREQUENCIES)[number];

export const POSTING_FREQUENCY_LABELS: Record<PostingFrequency, string> = {
  DAILY: "Daily",
  THREE_TIMES_WEEKLY: "3x weekly",
  WEEKLY: "Weekly",
};

const DEFAULT_POST_TIME = "18:00";

export function isPostingFrequency(value: unknown): value is PostingFrequency {
  return typeof value === "string" && POSTING_FREQUENCIES.includes(value as PostingFrequency);
}

export function normalizePostTime(value: unknown) {
  if (typeof value !== "string") return DEFAULT_POST_TIME;
  const trimmed = value.trim();
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed) ? trimmed : DEFAULT_POST_TIME;
}

function setTime(date: Date, preferredPostTime: string) {
  const [hours, minutes] = normalizePostTime(preferredPostTime).split(":").map(Number);
  const nextDate = new Date(date);
  nextDate.setHours(hours, minutes, 0, 0);
  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function nextThreeTimesWeeklyDate(from: Date, preferredPostTime: string) {
  const allowedDays = new Set([1, 3, 5]);

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = setTime(addDays(from, offset), preferredPostTime);
    if (allowedDays.has(candidate.getDay()) && candidate > from) {
      return candidate;
    }
  }

  return setTime(addDays(from, 1), preferredPostTime);
}

export function calculateNextAutomatedPostAt({
  from = new Date(),
  postingFrequency,
  preferredPostTime = DEFAULT_POST_TIME,
}: {
  from?: Date;
  postingFrequency: PostingFrequency;
  preferredPostTime?: string | null;
}) {
  const postTime = normalizePostTime(preferredPostTime);

  if (postingFrequency === "THREE_TIMES_WEEKLY") {
    return nextThreeTimesWeeklyDate(from, postTime);
  }

  const todayAtPreferredTime = setTime(from, postTime);

  if (todayAtPreferredTime > from) {
    return todayAtPreferredTime;
  }

  return setTime(addDays(from, postingFrequency === "DAILY" ? 1 : 7), postTime);
}
