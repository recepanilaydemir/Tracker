import React, { useState } from 'react';
import { Habit, HabitFrequency } from '../types';
import { Plus, Trash2, Activity, Calendar, Clock } from 'lucide-react';

interface HabitListProps {
  habits: Habit[];
  activeHabitId: string | null;
  onSelectHabit: (id: string | null) => void;
  onAddHabit: (name: string, frequency: HabitFrequency) => void;
  onDeleteHabit: (id: string) => void;
}

const colorMap: Record<string, string> = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500'
};

const HabitList: React.FC<HabitListProps> = ({ 
  habits, 
  activeHabitId, 
  onSelectHabit, 
  onAddHabit,
  onDeleteHabit
}) => {
  const [newHabitName, setNewHabitName] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('DAILY');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim()) {
      onAddHabit(newHabitName, frequency);
      setNewHabitName('');
      setFrequency('DAILY');
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full md:w-64 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-200">Habits</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 bg-canvas-card p-3 rounded-lg border border-canvas-border">
          <div className="space-y-3">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Habit name..."
                autoFocus
                className="w-full bg-canvas border border-canvas-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-habit-3"
              />
              
              <div className="flex gap-2">
                  {(['DAILY', 'WEEKLY', 'MONTHLY'] as HabitFrequency[]).map(freq => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setFrequency(freq)}
                        className={`
                            flex-1 text-[10px] py-1.5 rounded border transition-colors
                            ${frequency === freq 
                                ? 'bg-habit-3 text-white border-habit-3' 
                                : 'bg-canvas text-gray-400 border-canvas-border hover:border-gray-500'}
                        `}
                      >
                          {freq}
                      </button>
                  ))}
              </div>

              <button 
                type="submit"
                className="w-full bg-white text-black text-xs font-semibold py-2 rounded hover:bg-gray-200 transition-colors"
              >
                  Add Habit
              </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSelectHabit(null)}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
            ${activeHabitId === null 
              ? 'bg-blue-900/30 text-blue-400 border border-blue-800' 
              : 'bg-canvas-card text-gray-400 border border-canvas-border hover:border-gray-600'}
          `}
        >
          <Activity size={18} />
          Overview
        </button>

        {habits.map(habit => (
          <div 
            key={habit.id}
            className={`
              group flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer border
              ${activeHabitId === habit.id 
                ? 'bg-gray-800 text-white border-gray-600' 
                : 'bg-canvas-card text-gray-400 border-canvas-border hover:border-gray-600'}
            `}
            onClick={() => onSelectHabit(habit.id)}
          >
            <div className="flex items-center gap-3 truncate">
                <span className={`w-2 h-2 rounded-full ${colorMap[habit.color] || 'bg-gray-400'}`} />
                <div className="flex flex-col truncate">
                    <span className="truncate">{habit.name}</span>
                    <span className="text-[10px] text-gray-500 font-normal lowercase">{habit.frequency || 'daily'}</span>
                </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteHabit(habit.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {habits.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-600 text-sm">
            No habits yet. Click + to add one.
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitList;