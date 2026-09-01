import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { CheckSquare, BarChart3, Users, Loader2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Friends from './components/Friends';
import Profile from './components/Profile';
import LandingPage from './components/LandingPage';
import OnboardingView from './components/OnboardingView';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';

function TrackerLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [goals, setGoals] = useState([]);
  const [activeGoal, setActiveGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUserGoals = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.getUserGoals();
      if (response.data && response.data.length > 0) {
        setGoals(response.data);
        setActiveGoal(response.data[0]);
      } else {
        setGoals([]);
        setActiveGoal(null);
      }
    } catch (err) {
      console.warn('Authentication token expired or backend offline', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUserGoals();
    }
  }, [user?.id, isAuthenticated]);

  const handleGoalCreated = (newGoal) => {
    setGoals([newGoal]);
    setActiveGoal(newGoal);
    setCurrentTab('dashboard');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-2 text-[#006D77]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading your Winter Ark...</p>
      </div>
    );
  }

  // If user has zero goals, present the Onboarding Setup flow
  if (goals.length === 0) {
    return <OnboardingView onGoalCreated={handleGoalCreated} user={user} />;
  }

  return (
    <div className="flex flex-col h-full flex-1">
      {/* Dynamic Screen View */}
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'dashboard' && (
          <Dashboard
            activeGoal={activeGoal}
            goals={goals}
            onSelectGoal={setActiveGoal}
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
          className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
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
          className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
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
          className={`flex flex-col items-center space-y-1 transition-all cursor-pointer ${
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
  );
}

function MainShell() {
  return (
    <div className="min-h-screen bg-[#04434B] flex items-center justify-center p-0 md:p-6 font-sans">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-md bg-[#EDF6F9] md:rounded-[40px] md:shadow-2xl overflow-hidden min-h-screen md:min-h-[844px] md:max-h-[890px] flex flex-col relative border-0 md:border-4 md:border-[#006D77]/40">
        {/* Top Speaker / Notch simulation */}
        <div className="hidden md:flex justify-center items-center h-4 bg-[#006D77]">
          <div className="w-16 h-1 bg-[#83C5BE]/40 rounded-full" />
        </div>

        {/* Application Routes */}
        <Routes>
          {/* Public Landing Page Route */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected Tracker Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <TrackerLayout />
              </ProtectedRoute>
            }
          />

          {/* Protected Dedicated User Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
