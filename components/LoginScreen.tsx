import React, { useState, useEffect } from 'react';
import { Zap, User } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [recentUsers, setRecentUsers] = useState<string[]>([]);

  useEffect(() => {
    try {
      const users = JSON.parse(localStorage.getItem('orbit_users') || '[]');
      setRecentUsers(users);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-gray-300 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-habit-3/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md bg-canvas-card border border-canvas-border rounded-xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
           <div className="w-12 h-12 bg-habit-3 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(57,211,83,0.3)] mb-4">
              <Zap size={28} fill="currentColor" />
           </div>
           <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to Orbit</h1>
           <p className="text-gray-500 text-sm mt-1">Track your habits, build your future.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 ml-1">Username</label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-canvas border border-canvas-border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-habit-3 focus:ring-1 focus:ring-habit-3 transition-all"
                  autoFocus
                />
            </div>
          </div>
          <button 
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-habit-3 text-white font-semibold py-3 rounded-lg hover:bg-habit-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(38,166,65,0.2)]"
          >
            Start Tracking
          </button>
        </form>

        {recentUsers.length > 0 && (
           <div className="mt-8 pt-6 border-t border-canvas-border">
              <p className="text-xs text-gray-500 mb-3 ml-1">Recent accounts</p>
              <div className="flex flex-wrap gap-2">
                {recentUsers.map(u => (
                  <button
                    key={u}
                    onClick={() => onLogin(u)}
                    className="flex items-center gap-2 px-3 py-2 bg-canvas border border-canvas-border rounded-lg text-xs hover:border-gray-500 hover:text-white transition-all group"
                  >
                    <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-gray-700">
                        {u.charAt(0).toUpperCase()}
                    </div>
                    {u}
                  </button>
                ))}
              </div>
           </div>
        )}
      </div>
      
      <p className="mt-8 text-xs text-gray-600">
         Data is stored locally on this device.
      </p>
    </div>
  );
};

export default LoginScreen;