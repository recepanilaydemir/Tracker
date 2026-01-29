import React, { useState, useEffect } from 'react';
import HabitGrid from './components/HabitGrid';
import HabitList from './components/HabitList';
import LoginScreen from './components/LoginScreen';
import DriveSync from './components/DriveSync';
import { Habit, HabitFrequency } from './types';
import { getHabitPeriodKey } from './utils/dateUtils';
import { Zap, CheckCircle, Circle, Calendar, LogOut, User as UserIcon, Cloud } from 'lucide-react';
import { format } from 'date-fns';

const HABIT_COLORS = ['green', 'blue', 'violet', 'rose', 'amber', 'cyan'];

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);

  // Initialize User from local storage
  useEffect(() => {
    const savedUser = localStorage.getItem('orbit_current_user');
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  // Load Habits when User changes
  useEffect(() => {
    if (!user) {
        setHabits([]);
        setIsLoaded(false);
        return;
    }
    
    setIsLoaded(false);
    const userKey = `orbit_habits_${user}`;
    const savedHabits = localStorage.getItem(userKey);
    
    if (savedHabits) {
        try {
            setHabits(JSON.parse(savedHabits));
        } catch(e) { console.error(e); }
    } else {
        // Default dummy data for new users (first time login for this username)
        const dummyHabits: Habit[] = [
             { id: '1', name: 'Exercise', description: '', color: 'rose', frequency: 'DAILY', createdAt: new Date().toISOString(), logs: {} },
             { id: '2', name: 'Read Book', description: '', color: 'blue', frequency: 'WEEKLY', createdAt: new Date().toISOString(), logs: {} }
        ];
        setHabits(dummyHabits);
    }
    setActiveHabitId(null);
    setIsLoaded(true);
  }, [user]);

  // Save Habits to User specific key
  useEffect(() => {
    // Critical: Only save if we have a user AND we have finished loading their data.
    // This prevents overwriting a user's data with empty state during the loading phase.
    if (!user || !isLoaded) return;
    
    const userKey = `orbit_habits_${user}`;
    localStorage.setItem(userKey, JSON.stringify(habits));
  }, [habits, user, isLoaded]);

  const handleLogin = (username: string) => {
    // Update global user list for "Recent Users" feature
    const users = JSON.parse(localStorage.getItem('orbit_users') || '[]');
    if (!users.includes(username)) {
        localStorage.setItem('orbit_users', JSON.stringify([...users, username]));
    }
    
    localStorage.setItem('orbit_current_user', username);
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('orbit_current_user');
    setUser(null);
  };

  const handleAddHabit = (name: string, frequency: HabitFrequency) => {
    const randomColor = HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)];
    
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      description: '',
      color: randomColor,
      frequency,
      createdAt: new Date().toISOString(),
      logs: {}
    };
    setHabits([...habits, newHabit]);
    setActiveHabitId(newHabit.id);
  };

  const handleDeleteHabit = (id: string) => {
    if (confirm('Are you sure you want to delete this habit and all its history?')) {
      setHabits(habits.filter(h => h.id !== id));
      if (activeHabitId === id) setActiveHabitId(null);
    }
  };

  const handleToggleDate = (key: string) => {
    if (!activeHabitId) return;

    setHabits(prevHabits => prevHabits.map(h => {
      if (h.id !== activeHabitId) return h;
      
      const newLogs = { ...h.logs };
      if (newLogs[key]) {
        delete newLogs[key];
      } else {
        newLogs[key] = true;
      }
      
      return { ...h, logs: newLogs };
    }));
  };

  const handleToggleToday = () => {
    if (!activeHabit) return;
    const key = getHabitPeriodKey(new Date(), activeHabit.frequency || 'DAILY');
    handleToggleDate(key);
  };

  const handleRestoreHabits = (restoredHabits: Habit[]) => {
      if (confirm('This will overwrite your current local data with the backup. Continue?')) {
          setHabits(restoredHabits);
          setIsSyncOpen(false);
      }
  };

  // --- Render Logic ---

  if (!user) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  const activeHabit = habits.find(h => h.id === activeHabitId) || null;
  const totalContributions = activeHabit 
    ? Object.keys(activeHabit.logs).length
    : habits.reduce((acc, h) => acc + Object.keys(h.logs).length, 0);

  const getContributionText = () => {
    if (activeHabit) {
        return `${totalContributions} ${activeHabit.frequency ? activeHabit.frequency.toLowerCase() : 'daily'} records`;
    }
    return `${totalContributions} total records`;
  };

  const currentPeriodKey = activeHabit ? getHabitPeriodKey(new Date(), activeHabit.frequency || 'DAILY') : '';
  const isTodayComplete = activeHabit?.logs[currentPeriodKey];

  const getButtonStyles = (color: string) => {
      switch(color) {
          case 'blue': return 'text-blue-500 bg-blue-900/30 hover:bg-blue-900/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]';
          case 'violet': return 'text-violet-500 bg-violet-900/30 hover:bg-violet-900/50 shadow-[0_0_15px_rgba(139,92,246,0.4)]';
          case 'rose': return 'text-rose-500 bg-rose-900/30 hover:bg-rose-900/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]';
          case 'amber': return 'text-amber-500 bg-amber-900/30 hover:bg-amber-900/50 shadow-[0_0_15px_rgba(245,158,11,0.4)]';
          case 'cyan': return 'text-cyan-500 bg-cyan-900/30 hover:bg-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]';
          default: return 'text-habit-4 bg-habit-4/10 hover:bg-habit-4/20 shadow-[0_0_15px_rgba(57,211,83,0.4)]';
      }
  };

  const getButtonLabel = () => {
      if (!activeHabit) return 'Mark Today';
      if (activeHabit.frequency === 'WEEKLY') return 'Mark Week';
      if (activeHabit.frequency === 'MONTHLY') return 'Mark Month';
      return 'Mark Today';
  };

  return (
    <div className="min-h-screen bg-canvas text-gray-300 font-sans selection:bg-habit-3 selection:text-white">
      <DriveSync 
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        user={user}
        currentHabits={habits}
        onRestore={handleRestoreHabits}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <header className="mb-10 flex items-center justify-between border-b border-canvas-border pb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-habit-3 rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(57,211,83,0.3)]">
                <Zap size={24} fill="currentColor" />
             </div>
             <div>
               <h1 className="text-2xl font-bold text-white tracking-tight">Orbit Habits</h1>
               <p className="text-gray-500 text-sm">Track your consistency.</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSyncOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-canvas-card rounded-lg transition-colors flex items-center gap-2"
                title="Sync with Google Drive"
              >
                  <Cloud size={20} />
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-400 bg-canvas-card px-3 py-1.5 rounded-full border border-canvas-border">
                  <UserIcon size={14} />
                  <span>{user}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white hover:bg-canvas-card rounded-lg transition-colors"
                title="Logout"
              >
                  <LogOut size={20} />
              </button>
          </div>
        </header>

        {/* Main Content Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <HabitList 
            habits={habits}
            activeHabitId={activeHabitId}
            onSelectHabit={setActiveHabitId}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
          />

          {/* Main Grid Area */}
          <div className="flex-1 overflow-hidden">
            <div className="mb-4 flex items-end justify-between">
               <div className="flex flex-col gap-1">
                 <h2 className="text-lg font-medium text-gray-200">
                    {getContributionText()}
                 </h2>
                 <div className="text-xs text-gray-500 flex items-center gap-1">
                   <Calendar size={12} />
                   {format(new Date(), 'MMM yyyy')}
                 </div>
               </div>

               {activeHabit && (
                 <button
                   onClick={handleToggleToday}
                   className={`
                     flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                     ${isTodayComplete
                       ? getButtonStyles(activeHabit.color)
                       : 'bg-canvas-border text-gray-300 hover:bg-gray-700 hover:text-white'}
                   `}
                 >
                   {isTodayComplete ? (
                      <>
                        <CheckCircle size={18} />
                        Completed
                      </>
                   ) : (
                      <>
                        <Circle size={18} />
                        {getButtonLabel()}
                      </>
                   )}
                 </button>
               )}
            </div>

            <HabitGrid 
              activeHabit={activeHabit}
              habits={habits}
              onToggleDate={handleToggleDate}
            />

            <div className="mt-6 p-4 rounded-lg bg-canvas-card border border-canvas-border">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">How to use</h3>
              <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
                <li>Select a habit from the left sidebar to focus on it.</li>
                <li><strong>Overview</strong> shows daily activity across all habits.</li>
                <li><strong>Daily</strong> habits show a daily tracking grid.</li>
                <li><strong>Weekly</strong> habits show one block per week.</li>
                <li><strong>Monthly</strong> habits show one block per month.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;