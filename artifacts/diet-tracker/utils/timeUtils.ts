/**
 * Time window definitions and access helpers for the diet plan app.
 *
 * Each meal/activity has an allowed time window during which the photo
 * upload section is unlocked. After END_OF_DAY_HOUR (21:00 / 9 PM),
 * all sections for the current day unlock so users can catch up.
 *
 * For any past day (not today), all sections are always unlocked.
 */

export interface TimeWindow {
  startHour: number; // inclusive, 24h format
  endHour: number;   // exclusive, 24h format
  label: string;
  reminder: string;
}

export const MEAL_WINDOWS: Record<"breakfast" | "lunch" | "dinner", TimeWindow> = {
  breakfast: {
    startHour: 7,
    endHour: 11,
    label: "7:00 AM – 11:00 AM",
    reminder: "It's your Breakfast Time! Don't forget to log your morning meal.",
  },
  lunch: {
    startHour: 11,
    endHour: 14,
    label: "11:00 AM – 2:00 PM",
    reminder: "Lunchtime! Your lunch window is open — log your meal.",
  },
  dinner: {
    startHour: 18,
    endHour: 21,
    label: "6:00 PM – 9:00 PM",
    reminder: "Dinner time! Log your evening meal before the window closes.",
  },
};

// Exercise has two windows: morning walk + evening walk
export const EXERCISE_WINDOWS: TimeWindow[] = [
  {
    startHour: 6,
    endHour: 11,
    label: "6:00 AM – 11:00 AM",
    reminder: "Time for your morning walk! Aim for 6000–7000 steps.",
  },
  {
    startHour: 15,
    endHour: 21,
    label: "3:00 PM – 9:00 PM",
    reminder: "Evening walk & snack time! Have your almonds and tea, then walk.",
  },
];

export const END_OF_DAY_HOUR = 21; // 9 PM — all sections unlock after this

/** Returns current hour (0–23) in local time. */
function currentHour(): number {
  return new Date().getHours();
}

/** Returns true if today's date matches the given ISO date string (date portion). */
export function isToday(dateIso: string | null | undefined): boolean {
  if (!dateIso) return false;
  const now = new Date();
  const d = new Date(dateIso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Returns true if it's end-of-day (after 9 PM), meaning all
 * sections unlock so users can catch up on missed uploads.
 */
export function isEndOfDay(): boolean {
  return currentHour() >= END_OF_DAY_HOUR;
}

/**
 * Returns whether photo upload is allowed right now for a meal.
 *
 * Rules:
 *  - Past days: always allowed
 *  - Today + within meal's time window: allowed
 *  - Today + after 9 PM (end of day): allowed (catch-up mode)
 *  - Today + outside window and not end-of-day: locked
 *  - Future days: locked
 */
export function isMealUploadAllowed(
  mealType: "breakfast" | "lunch" | "dinner",
  dayNumber: number,
  currentDay: number
): { allowed: boolean; reason: string } {
  if (dayNumber < currentDay) {
    return { allowed: true, reason: "" };
  }
  if (dayNumber > currentDay) {
    return { allowed: false, reason: "This day hasn't started yet." };
  }
  // Same day
  if (isEndOfDay()) {
    return { allowed: true, reason: "end-of-day" };
  }
  const window = MEAL_WINDOWS[mealType];
  const hour = currentHour();
  if (hour >= window.startHour && hour < window.endHour) {
    return { allowed: true, reason: "" };
  }
  if (hour < window.startHour) {
    return {
      allowed: false,
      reason: `Opens at ${formatHour(window.startHour)}`,
    };
  }
  // Hour is past window but before 9 PM
  return {
    allowed: false,
    reason: `Window closed at ${formatHour(window.endHour)}. Re-opens after 9 PM.`,
  };
}

/**
 * Returns whether photo upload is allowed for a specific exercise.
 * Exercise index 0 & 1 = morning slots, 2 & 3 = evening slots.
 */
export function isExerciseUploadAllowed(
  exerciseIndex: number,
  dayNumber: number,
  currentDay: number
): { allowed: boolean; reason: string } {
  if (dayNumber < currentDay) {
    return { allowed: true, reason: "" };
  }
  if (dayNumber > currentDay) {
    return { allowed: false, reason: "This day hasn't started yet." };
  }
  if (isEndOfDay()) {
    return { allowed: true, reason: "end-of-day" };
  }
  // Map exercise index to window: 0,1 → morning; 2,3 → evening
  const windowIdx = exerciseIndex <= 1 ? 0 : 1;
  const window = EXERCISE_WINDOWS[windowIdx];
  const hour = currentHour();
  if (hour >= window.startHour && hour < window.endHour) {
    return { allowed: true, reason: "" };
  }
  if (hour < window.startHour) {
    return {
      allowed: false,
      reason: `Opens at ${formatHour(window.startHour)}`,
    };
  }
  return {
    allowed: false,
    reason: `Window closed at ${formatHour(window.endHour)}. Re-opens after 9 PM.`,
  };
}

function formatHour(hour: number): string {
  if (hour === 0) return "12:00 AM";
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

/** Human-readable current time status for the home screen. */
export function getActiveMealTime(): "breakfast" | "lunch" | "dinner" | "exercise" | "rest" | "end-of-day" {
  const hour = currentHour();
  if (isEndOfDay()) return "end-of-day";
  if (hour >= 6 && hour < 7) return "exercise";
  if (hour >= 7 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 14) return "lunch";
  if (hour >= 15 && hour < 21) return hour >= 18 ? "dinner" : "exercise";
  return "rest";
}
