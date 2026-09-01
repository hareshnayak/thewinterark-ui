import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellRing,
  Sparkles,
  Share2,
  Loader2,
  AlertCircle,
  Database,
  User,
  Target,
  Shield
} from 'lucide-react';
import { api } from '../services/api';
import { subscribeUserToPush, isPushSubscribed } from '../utils/push';
import SocialShareModal from './SocialShareModal';
import GoalPrivacyModal from './GoalPrivacyModal';

export default function Dashboard({
  activeGoal,
  goals = [],
  onSelectGoal,
  onOpenAuth,
  user
}) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyLog, setDailyLog] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  // Modals & UI States
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [adHocContent, setAdHocContent] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [hasSubscribedPush, setHasSubscribedPush] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // Check push subscription on mount
  useEffect(() => {
    isPushSubscribed().then(setHasSubscribedPush).catch(() => {});
  }, []);

  // Fetch Daily Log & Tasks from live Spring Boot backend
  const fetchTasks = async () => {
    if (!activeGoal?.id) {
      setTasks([]);
      setDailyLog(null);
      return;
    }

    setLoading(true);
    try {
      const response = await api.getDailyLog(activeGoal.id, selectedDate);
      setDailyLog(response.data);
      setTasks(response.data.tasks || []);
      setBackendConnected(true);
    } catch (err) {
      console.error('Failed to fetch from backend', err);
      setBackendConnected(false);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedDate, activeGoal?.id]);

  // Task Toggle with Optimistic UI Update -> PATCH /api/v1/tasks/{taskId}/toggle
  const handleToggleTask = async (task) => {
    const taskId = task.taskId || task.id;
    const currentCompleted = task.isCompleted;
    const targetStatus = !currentCompleted;

    // 1. Optimistic local update
    const previousTasks = [...tasks];
    const updatedTasks = tasks.map((t) =>
      (t.taskId === taskId || t.id === taskId) ? { ...t, isCompleted: targetStatus } : t
    );
    setTasks(updatedTasks);

    // Trigger Social Share modal if all are completed
    const allDone = updatedTasks.length > 0 && updatedTasks.every((t) => t.isCompleted);
    if (allDone && !currentCompleted) {
      setTimeout(() => setShowShareModal(true), 400);
    }

    // 2. Call backend PATCH endpoint
    try {
      await api.toggleTask(taskId, targetStatus);
      setBackendConnected(true);
    } catch (err) {
      console.error('Failed to toggle task, rolling back', err);
      setTasks(previousTasks);
    }
  };

  // Add Ad-Hoc Task -> POST /api/v1/logs/{logId}/tasks/ad-hoc
  const handleAddAdHocTask = async (e) => {
    e.preventDefault();
    if (!adHocContent.trim() || !dailyLog?.logId) return;

    setIsSubmittingTask(true);
    try {
      const response = await api.addAdHocTask(dailyLog.logId, adHocContent.trim());
      setTasks((prev) => [...prev, response.data]);
      setAdHocContent('');
      setShowAddModal(false);
      setBackendConnected(true);
    } catch (err) {
      console.error('Failed to add ad-hoc task to backend', err);
      alert('Error creating task on backend: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Create Goal -> POST /api/v1/goals
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    try {
      const res = await api.createGoal({ title: newGoalTitle.trim() });
      const newGoal = res.data;
      // Add default starter tasks
      await api.addPredefinedTask(newGoal.id, { taskContent: '60 Min Morning Workout' });
      await api.addPredefinedTask(newGoal.id, { taskContent: 'Read 20 pages' });
      await api.addPredefinedTask(newGoal.id, { taskContent: 'Zero Processed Sugar' });
      
      onSelectGoal(newGoal);
      setShowCreateGoalModal(false);
      setNewGoalTitle('');
      setBackendConnected(true);
    } catch (err) {
      console.error('Failed to create goal', err);
      alert('Could not create goal: ' + (err.response?.data?.message || err.message));
    }
  };

  // Push Subscription Trigger -> POST /api/v1/notifications/subscribe
  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      await subscribeUserToPush();
      setHasSubscribedPush(true);
      alert('Web Push notifications enabled successfully!');
    } catch (err) {
      alert('Web Push error: ' + (err.message || err));
    } finally {
      setPushLoading(false);
    }
  };

  // Calculations
  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const shiftDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  return (
    <div className="flex flex-col min-h-full pb-24 text-slate-800">
      {/* Top App Header */}
      <div className="bg-[#006D77] text-white pt-6 pb-6 px-5 rounded-b-3xl shadow-lg relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Flame className="w-5 h-5 text-[#FFDDD2]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">The Winter Ark</h1>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-[#83C5BE] font-bold tracking-wide uppercase">
                  {user ? `@${user.username}` : 'GUEST'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-[10px] text-emerald-300 font-semibold">PostgreSQL Live</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* User Account / Login Button */}
            <button
              onClick={onOpenAuth}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all backdrop-blur-md flex items-center space-x-1 text-xs font-bold"
              title="Account & Live DB Setup"
            >
              <User className="w-4 h-4" />
              <span>{user ? 'Account' : 'Sign In'}</span>
            </button>

            {/* Web Push Action Bell */}
            <button
              onClick={handleEnablePush}
              disabled={pushLoading || hasSubscribedPush}
              className={`p-2.5 rounded-full transition-all backdrop-blur-md flex items-center justify-center ${
                hasSubscribedPush
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-white/15 text-white hover:bg-white/25 active:scale-95'
              }`}
              title={hasSubscribedPush ? 'Push Notifications Active' : 'Enable Web Push Notifications'}
            >
              {pushLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : hasSubscribedPush ? (
                <BellRing className="w-4 h-4 text-emerald-300" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Goal Selector Header */}
        {goals.length > 0 && (
          <div className="flex items-center justify-between bg-white/10 rounded-2xl px-3 py-1.5 mb-3 backdrop-blur-md border border-white/15 text-xs font-semibold">
            <div className="flex items-center space-x-2 truncate">
              <Target className="w-3.5 h-3.5 text-[#FFDDD2] shrink-0" />
              <select
                value={activeGoal?.id || ''}
                onChange={(e) => {
                  const selected = goals.find((g) => g.id === e.target.value);
                  if (selected) onSelectGoal(selected);
                }}
                className="bg-transparent text-white font-bold outline-none cursor-pointer truncate max-w-[150px]"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id} className="text-slate-800 font-medium">
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="flex items-center space-x-1 text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded-xl transition-all active:scale-95"
                title="Goal Privacy & Squad Sharing"
              >
                <Shield className="w-3 h-3 text-[#FFDDD2]" />
                <span>Share Settings</span>
              </button>
              <button
                onClick={() => setShowCreateGoalModal(true)}
                className="text-[11px] font-bold text-[#FFDDD2] hover:underline"
              >
                + New Goal
              </button>
            </div>
          </div>
        )}

        {/* Date Selector Navigation Bar */}
        <div className="flex items-center justify-between bg-black/20 rounded-2xl p-2 backdrop-blur-md border border-white/10">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#FFDDD2]" />
            <span className="text-xs font-bold text-white tracking-wide">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          <button
            onClick={() => shiftDate(1)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 -mt-4 space-y-4">
        {/* If no goals exist yet */}
        {!activeGoal ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EDF6F9] flex items-center justify-center mx-auto text-[#006D77]">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#006D77]">Connect to Live Backend</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Sign in and create a goal to begin real-time task tracking with PostgreSQL.
            </p>
            <button
              onClick={onOpenAuth}
              className="w-full py-3 px-4 rounded-xl bg-[#006D77] text-white font-bold text-xs hover:bg-[#04434B] transition-all shadow-md active:scale-95"
            >
              Sign In / Setup Live Database
            </button>
          </div>
        ) : (
          <>
            {/* Progress & Stats Hero Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#83C5BE]/20 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#EDF6F9] text-[#006D77] text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#E29578]" />
                  <span>Today's Discipline</span>
                </div>
                <h3 className="text-2xl font-black text-[#006D77] tracking-tight">
                  {completedCount} of {totalCount} Done
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {percentage === 100
                    ? 'All goals crushed! Time to celebrate 🏆'
                    : `${totalCount - completedCount} tasks remaining today`}
                </p>

                {percentage === 100 && (
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#E29578] hover:bg-[#d88465] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Card</span>
                  </button>
                )}
              </div>

              {/* Circular Progress Bar */}
              <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    className="text-[#EDF6F9]"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r={radius}
                    className="text-[#006D77] transition-all duration-700 ease-out"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-[#006D77]">{percentage}%</span>
                </div>
              </div>
            </div>

            {/* Task List Header */}
            <div className="flex items-center justify-between pt-2">
              <h4 className="text-sm font-extrabold text-[#006D77] uppercase tracking-wider">
                Live Daily Checklist
              </h4>
              <span className="text-xs font-semibold text-[#83C5BE] bg-[#006D77]/10 px-2.5 py-0.5 rounded-full">
                {totalCount} Active
              </span>
            </div>

            {/* Tasks List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#006D77]" />
                <p className="text-xs text-slate-500 font-medium">Syncing with PostgreSQL...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <AlertCircle className="w-8 h-8 text-[#83C5BE] mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No tasks logged for today</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tap the (+) button below to add a live ad-hoc goal!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task) => {
                  const taskId = task.taskId || task.id;
                  return (
                    <div
                      key={taskId}
                      onClick={() => handleToggleTask(task)}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer select-none border ${
                        task.isCompleted
                          ? 'bg-[#EDF6F9]/60 border-[#83C5BE]/30 text-slate-500'
                          : 'bg-white border-gray-100 hover:border-[#83C5BE]/50 shadow-sm text-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                        <div className="shrink-0 transition-transform active:scale-90">
                          {task.isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-[#006D77] fill-[#83C5BE]/40" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-300 hover:text-[#006D77]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.taskContent || task.title}
                          </p>
                          {task.isAdHoc && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E29578] bg-[#FFDDD2]/40 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                              AD-HOC
                            </span>
                          )}
                        </div>
                      </div>

                      {task.isCompleted && (
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shrink-0">
                          DONE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) for Ad-Hoc Tasks */}
      {activeGoal && dailyLog && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-[#006D77] hover:bg-[#04434B] text-white shadow-xl flex items-center justify-center transition-transform active:scale-90 z-30 border-2 border-white"
          aria-label="Add Ad-Hoc Task"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Ad-Hoc Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100">
            <h3 className="text-base font-extrabold text-[#006D77] mb-1">Add Live Ad-Hoc Goal</h3>
            <p className="text-xs text-slate-500 mb-4">
              Persists directly into PostgreSQL for {selectedDate}.
            </p>

            <form onSubmit={handleAddAdHocTask} className="space-y-4">
              <input
                type="text"
                value={adHocContent}
                onChange={(e) => setAdHocContent(e.target.value)}
                placeholder="e.g., 5km Run, 2h Deep Work, Cold Bath"
                autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-[#EDF6F9] border border-[#83C5BE]/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#006D77]"
              />

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 font-semibold text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!adHocContent.trim() || isSubmittingTask}
                  className="flex-1 py-2.5 rounded-xl bg-[#006D77] text-white font-bold text-xs hover:bg-[#04434B] disabled:opacity-50"
                >
                  {isSubmittingTask ? 'Saving...' : 'Save to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Goal Modal */}
      {showCreateGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100">
            <h3 className="text-base font-extrabold text-[#006D77] mb-1">Create New Goal</h3>
            <p className="text-xs text-slate-500 mb-4">
              Start a new accountability challenge in PostgreSQL.
            </p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="e.g., Winter Discipline 2026"
                autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-[#EDF6F9] border border-[#83C5BE]/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#006D77]"
              />

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGoalModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 font-semibold text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGoalTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#006D77] text-white font-bold text-xs hover:bg-[#04434B] disabled:opacity-50"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Social Share Modal */}
      <SocialShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        date={selectedDate}
        tasks={tasks}
        goalTitle={activeGoal?.title || 'Winter Ark Daily Goal'}
        streak={18}
      />

      {/* Granular Goal Privacy Modal */}
      <GoalPrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        goal={activeGoal}
      />
    </div>
  );
}
