import React, { useState } from 'react';
import {
  Flame,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Loader2,
  Shield,
  Zap
} from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_SUGGESTIONS = [
  { id: '1', text: '60 Min Winter Morning Workout', defaultChecked: true },
  { id: '2', text: 'Read 20 pages of Systems Architecture', defaultChecked: true },
  { id: '3', text: 'Cold Shower & 10m Meditation', defaultChecked: true },
  { id: '4', text: 'Zero Processed Sugar Intake', defaultChecked: true },
  { id: '5', text: '10,000 Daily Steps', defaultChecked: false },
  { id: '6', text: '2h Deep Work Session', defaultChecked: false },
  { id: '7', text: 'Daily Journal & Reflection', defaultChecked: false }
];

const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Mon' },
  { key: 'TUESDAY', label: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wed' },
  { key: 'THURSDAY', label: 'Thu' },
  { key: 'FRIDAY', label: 'Fri' },
  { key: 'SATURDAY', label: 'Sat' },
  { key: 'SUNDAY', label: 'Sun' }
];

export default function OnboardingView({ onGoalCreated, user }) {
  const [title, setTitle] = useState('Winter Ark 90-Day Challenge');
  const [tagLine, setTagLine] = useState('Forged in cold sweat & discipline');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });

  const [activeDays, setActiveDays] = useState(DAYS_OF_WEEK.map((d) => d.key));
  const [selectedTasks, setSelectedTasks] = useState(
    DEFAULT_SUGGESTIONS.filter((s) => s.defaultChecked).map((s) => s.text)
  );
  const [customTaskInput, setCustomTaskInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const toggleDay = (dayKey) => {
    setActiveDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  const toggleTask = (taskText) => {
    setSelectedTasks((prev) =>
      prev.includes(taskText) ? prev.filter((t) => t !== taskText) : [...prev, taskText]
    );
  };

  const handleAddCustomTask = (e) => {
    e.preventDefault();
    if (!customTaskInput.trim()) return;
    const task = customTaskInput.trim();
    if (!selectedTasks.includes(task)) {
      setSelectedTasks((prev) => [...prev, task]);
    }
    setCustomTaskInput('');
  };

  const handleRemoveTask = (taskText) => {
    setSelectedTasks((prev) => prev.filter((t) => t !== taskText));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a goal name.');
      return;
    }
    if (activeDays.length === 0) {
      setError('Please select at least one active day per week.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create Goal with scheduling & timezone
      const goalRes = await api.createGoal({
        title: title.trim(),
        tagLine: tagLine.trim(),
        startDate,
        endDate,
        activeDays,
        timezone
      });

      const newGoal = goalRes.data;

      // 2. Add user-selected predefined tasks
      for (const taskContent of selectedTasks) {
        await api.addPredefinedTask(newGoal.id, { taskContent });
      }

      // 3. Initialize today's log
      const today = new Date().toISOString().split('T')[0];
      await api.getDailyLog(newGoal.id, today);

      onGoalCreated(newGoal);
    } catch (err) {
      console.error('Failed to complete onboarding', err);
      setError(err.response?.data?.message || err.message || 'Error creating challenge setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-12 text-slate-800 space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-b from-[#006D77] to-[#04434B] text-white pt-7 pb-6 px-5 rounded-b-3xl shadow-lg relative">
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md text-[#FFDDD2]">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Challenge Setup</h1>
            <p className="text-[11px] text-[#83C5BE] font-semibold tracking-wide">
              STEP 1 OF 1 • ONBOARDING
            </p>
          </div>
        </div>
        <p className="text-xs text-[#EDF6F9]/80 font-medium mt-1">
          Welcome, {user ? `@${user.username}` : 'Warrior'}! Configure your challenge schedule and choose your daily habits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 space-y-4 -mt-2">
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 1. Goal Identity */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h3 className="text-xs font-extrabold text-[#006D77] uppercase tracking-wider">
            1. Challenge Name & Focus
          </h3>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Goal Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Winter Ark 90-Day Challenge"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#EDF6F9] border border-[#83C5BE]/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#006D77]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Motto / Subtitle
              </label>
              <input
                type="text"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                placeholder="e.g., Forged in cold sweat & discipline"
                className="w-full px-4 py-2.5 rounded-2xl bg-[#EDF6F9] border border-[#83C5BE]/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#006D77]"
              />
            </div>
          </div>
        </div>

        {/* 2. Schedule & Active Days */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-[#006D77] uppercase tracking-wider">
              2. Schedule & Active Days
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Auto-skips Rest Days</span>
          </div>

          {/* Day Pills Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Weekly Frequency ({activeDays.length}/7 Days Active)
            </label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((day) => {
                const isActive = activeDays.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      isActive
                        ? 'bg-[#006D77] text-white shadow-xs'
                        : 'bg-[#EDF6F9] text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#EDF6F9] border border-[#83C5BE]/30 text-xs font-semibold text-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#EDF6F9] border border-[#83C5BE]/30 text-xs font-semibold text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* 3. Opt-in Starter Habits */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-[#006D77] uppercase tracking-wider">
              3. Opt-In Daily Habits ({selectedTasks.length} Selected)
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              Opt-In Model
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            Select the non-negotiable habits you commit to executing on active days:
          </p>

          <div className="space-y-2">
            {DEFAULT_SUGGESTIONS.map((suggestion) => {
              const isSelected = selectedTasks.includes(suggestion.text);
              return (
                <div
                  key={suggestion.id}
                  onClick={() => toggleTask(suggestion.text)}
                  className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#EDF6F9] border-[#83C5BE]/50 text-slate-800 font-semibold'
                      : 'bg-white border-gray-100 text-slate-400 hover:border-gray-200'
                  }`}
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-[#006D77] shrink-0 fill-[#83C5BE]/30" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                  )}
                  <span className="text-xs">{suggestion.text}</span>
                </div>
              );
            })}

            {/* Custom Tasks Added */}
            {selectedTasks
              .filter((t) => !DEFAULT_SUGGESTIONS.some((s) => s.text === t))
              .map((customTask, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#EDF6F9] border border-[#83C5BE]/50 text-slate-800 text-xs font-semibold"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <CheckCircle2 className="w-5 h-5 text-[#006D77] shrink-0 fill-[#83C5BE]/30" />
                    <span className="truncate">{customTask}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(customTask)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>

          {/* Add Custom Task Input */}
          <div className="flex space-x-2 pt-1">
            <input
              type="text"
              value={customTaskInput}
              onChange={(e) => setCustomTaskInput(e.target.value)}
              placeholder="Add your own custom habit..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#EDF6F9] border border-[#83C5BE]/30 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#006D77]"
            />
            <button
              type="button"
              onClick={handleAddCustomTask}
              disabled={!customTaskInput.trim()}
              className="px-3 py-2 rounded-xl bg-[#006D77] hover:bg-[#04434B] text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Launch CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || selectedTasks.length === 0}
            className="w-full py-4 px-6 rounded-2xl bg-[#006D77] hover:bg-[#04434B] text-white font-black text-sm shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#FFDDD2]" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-[#FFDDD2]" />
                <span>Ignite Challenge & Launch Dashboard</span>
                <ArrowRight className="w-5 h-5 text-[#FFDDD2]" />
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
            Timezone auto-configured to {timezone} for accurate midnight auto-skipping.
          </p>
        </div>
      </form>
    </div>
  );
}
