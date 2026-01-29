export type HabitFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string; // 'green' | 'blue' | 'violet' | 'rose' | 'amber' | 'cyan'
  frequency: HabitFrequency;
  createdAt: string; // ISO Date
  logs: Record<string, boolean>; // Key is YYYY-MM-DD
}

export interface DayEntry {
  date: Date;
  dateString: string; // YYYY-MM-DD
  count: number; // 0 or 1 for habits, or higher for aggregate
  level: 0 | 1 | 2 | 3 | 4; // Intensity level for coloring
  isFuture: boolean;
}

export interface WeekEntry {
  days: DayEntry[];
}
