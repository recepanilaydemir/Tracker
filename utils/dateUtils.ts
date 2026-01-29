import { 
  format, 
  subDays, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  getDate, 
  startOfToday,
  startOfMonth,
  subMonths,
  isAfter,
  isSameDay,
  isSameWeek,
  isSameMonth as isSameMonthFns,
  eachMonthOfInterval,
  endOfMonth
} from 'date-fns';
import { Habit, WeekEntry, HabitFrequency } from '../types';

export const formatDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

/**
 * Returns the storage key for a habit log based on frequency.
 * Daily: YYYY-MM-DD
 * Weekly: YYYY-MM-DD (Monday of the week)
 * Monthly: YYYY-MM-DD (1st of the month)
 */
export const getHabitPeriodKey = (date: Date, frequency: HabitFrequency): string => {
    let targetDate = date;
    if (frequency === 'WEEKLY') {
        targetDate = startOfWeek(date, { weekStartsOn: 1 });
    } else if (frequency === 'MONTHLY') {
        targetDate = startOfMonth(date);
    }
    return formatDateKey(targetDate);
};

export const generateYearGrid = (endDate: Date = new Date()): { weeks: WeekEntry[], months: { name: string, index: number }[] } => {
  const startDate = subDays(endDate, 365);
  const alignedStartDate = startOfWeek(startDate, { weekStartsOn: 1 }); 
  const alignedEndDate = endOfWeek(endDate, { weekStartsOn: 1 });

  const days = eachDayOfInterval({
    start: alignedStartDate,
    end: alignedEndDate
  });

  const weeks: WeekEntry[] = [];
  let currentWeek: WeekEntry = { days: [] };
  const months: { name: string, index: number }[] = [];
  const today = startOfToday();

  days.forEach((day, index) => {
    currentWeek.days.push({
      date: day,
      dateString: formatDateKey(day),
      count: 0,
      level: 0,
      isFuture: isAfter(day, today)
    });

    // Add month label logic
    if (currentWeek.days.length === 1) { 
       const prevWeekFirstDay = weeks.length > 0 ? weeks[weeks.length - 1].days[0].date : null;
       if (!prevWeekFirstDay || !isSameMonth(prevWeekFirstDay, day)) {
         if (getDate(day) < 15) { 
            months.push({ name: format(day, 'MMM'), index: weeks.length });
         }
       }
    }

    if (currentWeek.days.length === 7) {
      weeks.push(currentWeek);
      currentWeek = { days: [] };
    }
  });

  return { weeks, months };
};

export const calculateLevels = (weeks: WeekEntry[], activeHabit: Habit | null, allHabits: Habit[]) => {
  return weeks.map(week => ({
    ...week,
    days: week.days.map(day => {
      let count = 0;
      
      if (activeHabit) {
        // For Daily habits, check the exact date
        count = activeHabit.logs[day.dateString] ? 1 : 0;
      } else {
        // Overview mode: Sum all logs on this specific day
        allHabits.forEach(h => {
          if (h.logs[day.dateString]) count++;
        });
      }

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      
      if (activeHabit) {
        level = count > 0 ? 4 : 0;
      } else {
        const maxDaily = allHabits.length || 1;
        const ratio = count / maxDaily;
        if (count === 0) level = 0;
        else if (ratio <= 0.25) level = 1;
        else if (ratio <= 0.5) level = 2;
        else if (ratio <= 0.75) level = 3;
        else level = 4;
      }

      return {
        ...day,
        count,
        level
      };
    })
  }));
};

// Generators for specific frequencies

export interface PeriodEntry {
    date: Date;
    key: string;
    label: string;
    isFuture: boolean;
    level: 0 | 1 | 2 | 3 | 4;
    completed: boolean;
}

export interface WeeklyHeatmapColumn {
    monthLabel: string;
    weeks: PeriodEntry[];
}

export const generateWeeklyHeatmap = (activeHabit: Habit): WeeklyHeatmapColumn[] => {
    const today = startOfToday();
    const endDate = endOfMonth(today);
    // Show last 12 months (roughly a year)
    const startDate = subMonths(startOfMonth(today), 11);

    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    
    return months.map(monthStart => {
        // Get all Mondays in this month
        const mondays = eachDayOfInterval({ 
            start: monthStart, 
            end: endOfMonth(monthStart) 
        }).filter(day => day.getDay() === 1); // Monday

        const weeks = mondays.map(monday => {
            const key = getHabitPeriodKey(monday, 'WEEKLY');
            const completed = !!activeHabit.logs[key];
            const isFutureWeek = isAfter(monday, today);
            
            return {
                date: monday,
                key,
                label: `Week of ${format(monday, 'MMM d')}`,
                isFuture: isFutureWeek,
                completed,
                level: (completed ? 4 : 0) as 0 | 1 | 2 | 3 | 4
            };
        });

        return {
            monthLabel: format(monthStart, 'MMM'),
            weeks
        };
    });
};

export const generateMonthlyData = (activeHabit: Habit): PeriodEntry[] => {
    const today = startOfToday();
    const currentMonthStart = startOfMonth(today);
    
    // Show last 12 months
    const months: PeriodEntry[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = subMonths(currentMonthStart, i);
        const key = getHabitPeriodKey(d, 'MONTHLY');
        const completed = !!activeHabit.logs[key];
        
        months.push({
            date: d,
            key,
            label: format(d, 'MMMM yyyy'),
            isFuture: isAfter(d, currentMonthStart),
            completed,
            level: completed ? 4 : 0
        });
    }
    return months;
};