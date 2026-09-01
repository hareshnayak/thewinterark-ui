import React, { useState, useEffect } from 'react';
import { Flame, Lock, User, Mail, Sparkles, Loader2, ShieldAlert, X } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialIsLogin = false }) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [username, setUsername] = useState('winter_warrior');
  const [email, setEmail] = useState('warrior@winterark.com');
  const [password, setPassword] = useState('winter1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLogin(initialIsLogin);
  }, [initialIsLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin) {
      const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!email || !emailRegex.test(email.trim())) {
        setError('Please enter a valid email address (e.g. name@example.com)');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let res;
      if (isLogin) {
        res = await api.login({ username, password });
      } else {
        res = await api.register({ username, email, password });
      }

      const { token, id, username: uname } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id, username: uname, email }));

      onAuthSuccess({ token, id, username: uname, email });
      onClose();
    } catch (err) {
      console.error('Auth failed', err);
      if (!isLogin && err.response?.status === 500) {
        try {
          const loginRes = await api.login({ username, password });
          const { token, id, username: uname } = loginRes.data;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify({ id, username: uname, email }));
          onAuthSuccess({ token, id, username: uname, email });
          onClose();
          return;
        } catch (loginErr) {
          setError('User already exists. Please switch to Login.');
        }
      } else {
        setError(err.response?.data?.message || 'Authentication failed. Please check backend connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSeedDemo = async () => {
    setLoading(true);
    setError(null);
    const demoUser = `warrior_${Math.floor(1000 + Math.random() * 9000)}`;
    const demoEmail = `${demoUser}@winterark.com`;
    const demoPass = 'password123';

    try {
      // 1. Register User in PostgreSQL
      const authRes = await api.register({
        username: demoUser,
        email: demoEmail,
        password: demoPass
      });

      const { token, id, username: uname } = authRes.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id, username: uname, email: demoEmail }));

      // 2. Create Real Goal in PostgreSQL
      const goalRes = await api.createGoal({
        title: 'Winter Ark 90-Day Challenge',
        tagLine: 'Forged in discipline and cold sweat'
      });

      const goalId = goalRes.data.id;

      // 3. Attach Real Predefined Tasks in PostgreSQL
      await api.addPredefinedTask(goalId, { taskContent: '60 Min Winter Morning Workout' });
      await api.addPredefinedTask(goalId, { taskContent: 'Read 20 pages of Systems Architecture' });
      await api.addPredefinedTask(goalId, { taskContent: 'Zero Processed Sugar Intake' });
      await api.addPredefinedTask(goalId, { taskContent: 'Cold Shower & 10m Meditation' });

      // 4. Initialize Today's Daily Log
      const today = new Date().toISOString().split('T')[0];
      await api.getDailyLog(goalId, today);

      onAuthSuccess({ token, id, username: uname, email: demoEmail, activeGoalId: goalId });
      onClose();
    } catch (err) {
      console.error('Quick seed failed', err);
      setError(err.response?.data?.message || err.message || 'Could not connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 relative">
        {/* Close Button (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#006D77] flex items-center justify-center mx-auto mb-2 text-white shadow-md">
            <Flame className="w-6 h-6 text-[#FFDDD2]" />
          </div>
          <h2 className="text-xl font-black text-[#006D77]">
            {isLogin ? 'Sign In to Winter Ark' : 'Join The Winter Ark'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Connect live to Spring Boot & PostgreSQL
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="winter_warrior"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#EDF6F9] border border-[#83C5BE]/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#006D77]"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="warrior@winterark.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#EDF6F9] border border-[#83C5BE]/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#006D77]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#EDF6F9] border border-[#83C5BE]/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#006D77]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#006D77] hover:bg-[#04434B] text-white font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        {/* Quick Demo Initializer Button */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleQuickSeedDemo}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#E29578] to-[#006D77] text-white font-bold text-xs hover:opacity-95 transition-all shadow-sm flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#FFDDD2]" />
            <span>One-Click Live Backend Setup</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1.5 font-medium">
            Registers user, creates goal & tasks directly in PostgreSQL DB
          </p>
        </div>

        {/* Toggle Login/Register */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs font-bold text-[#006D77] hover:underline cursor-pointer"
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
