import React, { useState, useEffect } from 'react';
import { CheckSquare, BarChart3, Users, Flame, Sparkles } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Friends from './components/Friends';
import AuthModal from './components/AuthModal';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Fetch real goals for the authenticated user from Spring Boot API
  const loadUserGoals = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const response = await api.getUserGoals();
      if (response.data && response.data.length > 0) {
        setGoals(response.data);
        setActiveGoal(response.data[0]);
      } else {
        // If user is authenticated but has 0 goals, automatically create a default goal
        try {
          const createRes = await api.createGoal({
            title: 'Winter Ark 90-Day Challenge',
            tagLine: 'Forged in discipline'
          });
          const newGoal = createRes.data;
          await api.addPredefinedTask(newGoal.id, { taskContent: '60 Min Winter Morning Workout' });
          await api.addPredefinedTask(newGoal.id, { taskContent: 'Read 20 pages of Systems Architecture' });
          await api.addPredefinedTask(newGoal.id, { taskContent: 'Zero Processed Sugar Intake' });
          await api.addPredefinedTask(newGoal.id, { taskContent: 'Cold Shower & 10m Meditation' });
          
          setGoals([newGoal]);
          setActiveGoal(newGoal);
        } catch (createErr) {
          console.error('Failed to create initial goal', createErr);
        }
      }
    } catch (err) {
      console.warn('Authentication token expired or backend offline', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthOpen(true);
      }
    }
  };

  useEffect(() => {
    loadUserGoals();
  }, [user?.id]);

  const handleAuthSuccess = (userData) => {
    setUser({ id: userData.id, username: userData.username });
    loadUserGoals();
  };

  return (
    <div className="min-h-screen bg-[#04434B] flex items-center justify-center p-0 md:p-6 font-sans">
      {/* Mobile Device Frame (Google Pixel inspired) */}
      <div className="w-full max-w-md bg-[#EDF6F9] md:rounded-[40px] md:shadow-2xl overflow-hidden min-h-screen md:min-h-[844px] md:max-h-[890px] flex flex-col relative border-0 md:border-4 md:border-[#006D77]/40">
        
        {/* Top Speaker / Camera Notch simulation for Desktop */}
        <div className="hidden md:flex justify-center items-center h-4 bg-[#006D77]">
          <div className="w-16 h-1 bg-[#83C5BE]/40 rounded-full"></div>
        </div>

        {/* Dynamic Screen View */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              activeGoal={activeGoal}
              goals={goals}
              onSelectGoal={setActiveGoal}
              onOpenAuth={() => setIsAuthOpen(true)}
              user={user}
            />
          )}
          {currentTab === 'analytics' && <Analytics activeGoal={activeGoal} />}
          {currentTab === 'friends' && <Friends activeGoal={activeGoal} />}
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed md:absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-3 flex justify-around items-center z-40 shadow-lg">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center space-y-1 transition-all ${
              currentTab === 'dashboard'
                ? 'text-[#006D77] scale-105 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px] tracking-wide">Checklist</span>
          </button>

          <button
            onClick={() => setCurrentTab('analytics')}
            className={`flex flex-col items-center space-y-1 transition-all ${
              currentTab === 'analytics'
                ? 'text-[#006D77] scale-105 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] tracking-wide">Analytics</span>
          </button>

          <button
            onClick={() => setCurrentTab('friends')}
            className={`flex flex-col items-center space-y-1 transition-all ${
              currentTab === 'friends'
                ? 'text-[#006D77] scale-105 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] tracking-wide">Squad</span>
          </button>
        </nav>
      </div>

      {/* Real Live Backend Auth & Seed Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
