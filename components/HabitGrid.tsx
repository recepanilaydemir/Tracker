import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { generateYearGrid, calculateLevels, generateWeeklyHeatmap, generateMonthlyData } from '../utils/dateUtils';
import { Habit } from '../types';

interface HabitGridProps {
  activeHabit: Habit | null;
  habits: Habit[];
  onToggleDate: (dateString: string) => void;
}

const COLOR_THEMES: Record<string, string[]> = {
  green:  ['bg-habit-0', 'bg-green-900',  'bg-green-700',  'bg-green-500',  'bg-green-400'],
  blue:   ['bg-habit-0', 'bg-blue-900',   'bg-blue-700',   'bg-blue-500',   'bg-blue-400'],
  violet: ['bg-habit-0', 'bg-violet-900', 'bg-violet-700', 'bg-violet-500', 'bg-violet-400'],
  rose:   ['bg-habit-0', 'bg-rose-900',   'bg-rose-700',   'bg-rose-500',   'bg-rose-400'],
  amber:  ['bg-habit-0', 'bg-amber-900',  'bg-amber-700',  'bg-amber-500',  'bg-amber-400'],
  cyan:   ['bg-habit-0', 'bg-cyan-900',   'bg-cyan-700',   'bg-cyan-500',   'bg-cyan-400'],
};

const HabitGrid: React.FC<HabitGridProps> = ({ activeHabit, habits, onToggleDate }) => {
  const activeColor = activeHabit ? activeHabit.color : 'green';
  const theme = COLOR_THEMES[activeColor] || COLOR_THEMES['green'];

  const getLevelColor = (level: number) => {
    return theme[level] || theme[0];
  };

  // --- DAILY VIEW (Default / Overview) ---
  const renderDailyView = () => {
      const { weeks: rawWeeks, months } = useMemo(() => generateYearGrid(), []);
      const processedWeeks = useMemo(() => 
        calculateLevels(rawWeeks, activeHabit, habits), 
        [rawWeeks, activeHabit, habits]
      );

      const getDayName = (index: number) => {
        switch(index) {
          case 1: return 'Mon';
          case 3: return 'Wed';
          case 5: return 'Fri';
          default: return '';
        }
      };

      return (
        <div className="min-w-[800px]">
            {/* Month Labels */}
            <div className="flex mb-2 text-xs text-gray-400 pl-8 relative h-4">
                {months.map((month, i) => (
                   <span 
                    key={i} 
                    style={{ 
                        position: 'absolute', 
                        left: `${(month.index * 14) + 32}px` 
                    }}
                   >
                     {month.name}
                   </span>
                ))}
            </div>
    
            <div className="flex">
              {/* Day Labels */}
              <div className="flex flex-col gap-1 pr-2 mt-[2px] text-xs text-gray-400 w-8">
                 {[0, 1, 2, 3, 4, 5, 6].map(i => (
                   <span key={i} className="h-[10px] leading-[10px]">
                     {getDayName(i)}
                   </span>
                 ))}
              </div>
    
              {/* Grid */}
              <div className="flex gap-1">
                {processedWeeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col gap-1">
                    {week.days.map((day, dIndex) => (
                      <div
                        key={`${wIndex}-${dIndex}`}
                        onClick={() => {
                            if (activeHabit && !day.isFuture) {
                                onToggleDate(day.dateString);
                            }
                        }}
                        className={`
                          w-[10px] h-[10px] rounded-[2px] transition-colors duration-200
                          ${day.isFuture ? 'invisible' : getLevelColor(day.level)}
                          ${activeHabit && !day.isFuture ? 'cursor-pointer hover:ring-1 hover:ring-gray-400 hover:z-10' : ''}
                        `}
                        title={day.isFuture ? '' : `${day.dateString}: ${day.count} contributions`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
        </div>
      );
  };

  // --- WEEKLY VIEW (Table: Month Columns x Week Rows) ---
  const renderWeeklyView = () => {
    if (!activeHabit) return null;
    const monthlyGroups = generateWeeklyHeatmap(activeHabit);
    
    return (
        <div className="min-w-[800px] pb-2">
            <div className="flex gap-4">
                {/* Row Headers (Week Numbers) - Optional, mimicking the table structure */}
                <div className="flex flex-col gap-1 pt-6 text-xs text-gray-400">
                    <span className="h-6 flex items-center">W1</span>
                    <span className="h-6 flex items-center">W2</span>
                    <span className="h-6 flex items-center">W3</span>
                    <span className="h-6 flex items-center">W4</span>
                    <span className="h-6 flex items-center">W5</span>
                </div>

                {/* Columns */}
                <div className="flex gap-2">
                    {monthlyGroups.map((group, i) => (
                        <div key={i} className="flex flex-col gap-2 w-8">
                            {/* Header */}
                            <span className="text-xs text-gray-400 text-center h-4">{group.monthLabel}</span>
                            
                            {/* Weeks */}
                            <div className="flex flex-col gap-1">
                                {group.weeks.map((week, wIndex) => (
                                    <div 
                                        key={week.key}
                                        className="group relative"
                                        onClick={() => {
                                            if (!week.isFuture) onToggleDate(week.key);
                                        }}
                                    >
                                        <div 
                                            className={`
                                                w-8 h-6 rounded-[2px] transition-colors flex items-center justify-center
                                                ${week.isFuture ? 'bg-habit-0 opacity-20 cursor-default' : `${getLevelColor(week.level)} cursor-pointer hover:ring-1 hover:ring-white hover:z-10`}
                                            `}
                                        />
                                        
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 shadow-lg border border-gray-700 pointer-events-none">
                                            {week.label}
                                            {week.completed ? ' (Completed)' : ''}
                                        </div>
                                    </div>
                                ))}
                                {/* Pad empty slots if < 5 weeks to keep alignment? 
                                    Usually months have 4 or 5. If we don't pad, W5 labels might misalign for short months.
                                    But visual gaps are honest. Let's leave it unpadded.
                                */}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  // --- MONTHLY VIEW ---
  const renderMonthlyView = () => {
    if (!activeHabit) return null;
    const months = generateMonthlyData(activeHabit);
    
    return (
        <div className="flex flex-wrap gap-4 py-4">
            {months.map((month, i) => (
                 <div 
                    key={i} 
                    className="flex flex-col items-center gap-2 group relative"
                    onClick={() => {
                        if (!month.isFuture) onToggleDate(month.key);
                    }}
                 >
                    <div 
                        className={`
                            w-12 h-12 rounded-lg transition-colors shadow-sm
                            ${month.isFuture ? 'bg-habit-0 opacity-20 cursor-default' : `${getLevelColor(month.level)} cursor-pointer hover:ring-1 hover:ring-white`}
                        `}
                    />
                    <span className="text-[10px] text-gray-400">{month.label.split(' ')[0]}</span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded whitespace-nowrap z-20">
                        {month.label}
                    </div>
                 </div>
            ))}
        </div>
    );
  };

  const frequency = activeHabit ? activeHabit.frequency || 'DAILY' : 'DAILY';

  return (
    <div className="w-full overflow-x-auto custom-scroll p-4 bg-canvas-card border border-canvas-border rounded-lg shadow-sm">
        {frequency === 'DAILY' && renderDailyView()}
        {frequency === 'WEEKLY' && renderWeeklyView()}
        {frequency === 'MONTHLY' && renderMonthlyView()}

        {/* Legend */}
        <div className="flex justify-between items-center mt-6 text-xs text-gray-400 border-t border-canvas-border pt-4">
           <div>
             {frequency === 'DAILY' ? (
                activeHabit ? (
                    <span className="text-gray-500 italic">Click a square to toggle status</span>
                ) : (
                    <span className="text-gray-500 italic">Select a habit to edit history</span>
                )
             ) : (
                <span className="text-gray-500 italic">Click a block to toggle {frequency.toLowerCase()} status</span>
             )}
           </div>
           <div className="flex items-center gap-2">
             <span>Less</span>
             <div className="flex gap-1">
               <div className={`w-[10px] h-[10px] ${theme[0]} rounded-[2px]`}></div>
               <div className={`w-[10px] h-[10px] ${theme[1]} rounded-[2px]`}></div>
               <div className={`w-[10px] h-[10px] ${theme[2]} rounded-[2px]`}></div>
               <div className={`w-[10px] h-[10px] ${theme[3]} rounded-[2px]`}></div>
               <div className={`w-[10px] h-[10px] ${theme[4]} rounded-[2px]`}></div>
             </div>
             <span>More</span>
           </div>
        </div>
    </div>
  );
};

export default HabitGrid;