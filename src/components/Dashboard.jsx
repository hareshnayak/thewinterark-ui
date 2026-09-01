import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Shield,
  FastForward,
  RotateCcw,
  Settings,
  Moon,
  Coffee,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { subscribeUserToPush, isPushSubscribed } from '../utils/push';
import { useAuth } from '../context/AuthContext';
import SocialShareModal from './SocialShareModal';
import GoalPrivacyModal from './GoalPrivacyModal';
import GoalEditModal from './GoalEditModal';

export default function Dashboard({
  activeGoal,
  goals = [],
  onSelectGoal,
  onOpenAuth,
  user: propUser
}) {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();
  const user = authUser || propUser;

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyLog, setDailyLog] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  // Modals & UI States
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showGoalEditModal, setShowGoalEditModal] = useState(false);
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

  // Task Completion Toggle -> PATCH /api/v1/tasks/{taskId}/status
  const handleToggleTask = async (task) => {
    const taskId = task.taskId || task.id;
    const isCurrentlyDone = task.status === 'COMPLETED' || task.isCompleted;
    const targetStatus = isCurrentlyDone ? 'PENDING' : 'COMPLETED';

    // Optimistic local update
    const previousTasks = [...tasks];
    const updatedTasks = tasks.map((t) =>
      (t.taskId === taskId || t.id === taskId)
        ? { ...t, status: targetStatus, isCompleted: targetStatus === 'COMPLETED' }
        : t
    );
    setTasks(updatedTasks);

    // Trigger Social Share modal if all active tasks are completed
    const allDone =
      updatedTasks.length > 0 &&
      updatedTasks.every((t) => t.status === 'COMPLETED' || t.isCompleted);
    if (allDone && !isCurrentlyDone) {
      setTimeout(() => setShowShareModal(true), 400);
    }

    try {
      await api.updateTaskStatus(taskId, targetStatus);
      setBackendConnected(true);
    } catch (err) {
      console.error('Failed to toggle task status, rolling back', err);
      setTasks(previousTasks);
    }
  };

  // Task Skip Action -> PATCH /api/v1/tasks/{taskId}/status (SKIPPED)
  const handleSkipTask = async (task, e) => {
    e.stopPropagation();
    const taskId = task.taskId || task.id;
    const isCurrentlySkipped = task.status === 'SKIPPED';
    const targetStatus = isCurrentlySkipped ? 'PENDING' : 'SKIPPED';

    const previousTasks = [...tasks];
    const updatedTasks = tasks.map((t) =>
      (t.taskId === taskId || t.id === taskId)
        ? { ...t, status: targetStatus, isCompleted: false }
        : t
    );
    setTasks(updatedTasks);

    try {
      await api.updateTaskStatus(taskId, targetStatus);
      setBackendConnected(true);
    } catch (err) {
      console.error('Failed to skip task, rolling back', err);
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

  // Push Subscription Trigger
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
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED' || t.isCompleted).length;
  const skippedCount = tasks.filter((t) => t.status === 'SKIPPED').length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isRestDay = Boolean(dailyLog?.isRestDay || dailyLog?.restDay);

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
            {/* User Account / Profile Navigation Button */}
            <button
              onClick={() => {
                if (user || isAuthenticated) {
                  navigate('/profile');
                } else if (onOpenAuth) {
                  onOpenAuth();
                } else {
                  navigate('/');
                }
              }}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all backdrop-blur-md flex items-center space-x-1 text-xs font-bold cursor-pointer active:scale-95"
              title={user ? 'View Warrior Profile' : 'Sign In'}
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
                className="bg-transparent text-white font-bold outline-none cursor-pointer truncate max-w-[130px]"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id} className="text-slate-800 font-medium">
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Manage Routine / Predefined Tasks */}
              <button
                onClick={() => setShowGoalEditModal(true)}
                className="flex items-center space-x-1 text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded-xl transition-all active:scale-95"
                title="Edit Goal Schedule & Predefined Routine"
              >
                <Settings className="w-3 h-3 text-[#FFDDD2]" />
                <span>Routine</span>
              </button>

              {/* Share Settings */}
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="flex items-center space-x-1 text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded-xl transition-all active:scale-95"
                title="Goal Privacy & Permissions"
              >
                <Shield className="w-3 h-3 text-[#FFDDD2]" />
                <span>Share</span>
              </button>

              <button
                onClick={() => setShowCreateGoalModal(true)}
                className="text-[11px] font-bold text-[#FFDDD2] hover:underline pl-0.5"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Date Selector Navigation Bar */}
        <div className="flex items-center justify-between bg-black/20 rounded-2xl p-2 backdrop-blur-md border border-white/10">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
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
            className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 -mt-4 space-y-4">
        {!activeGoal ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EDF6F9] flex items-center justify-center mx-auto text-[#006D77]">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#006D77]">No Goals Configured</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Create a goal to begin real-time task tracking with PostgreSQL.
            </p>
            <button
              onClick={() => setShowCreateGoalModal(true)}
              className="w-full py-3 px-4 rounded-xl bg-[#006D77] text-white font-bold text-xs hover:bg-[#04434B] transition-all shadow-md active:scale-95"
            >
              Create New Goal
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
                  {isRestDay
                    ? 'Scheduled Rest Day 🌙'
                    : percentage === 100
                    ? 'All goals crushed! Time to celebrate 🏆'
                    : `${totalCount - completedCount} tasks remaining today`}
                </p>

                {percentage === 100 && !isRestDay && (
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#E29578] hover:bg-[#d88465] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
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

            {/* Live Checklist Header */}
            <div className="flex items-center justify-between pt-2">
              <h4 className="text-sm font-extrabold text-[#006D77] uppercase tracking-wider">
                Live Daily Checklist
              </h4>
              <div className="flex items-center space-x-1.5 text-xs font-semibold">
                {skippedCount > 0 && (
                  <span className="text-[#E29578] bg-[#FFDDD2]/40 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {skippedCount} Skipped
                  </span>
                )}
                <span className="text-[#83C5BE] bg-[#006D77]/10 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  {totalCount} Total
                </span>
              </div>
            </div>

            {/* Smart Tasks / Rest Day Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#006D77]" />
                <p className="text-xs text-slate-500 font-medium">Syncing schedule with PostgreSQL...</p>
              </div>
            ) : isRestDay ? (
              /* Rest Day Empty State */
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[#EDF6F9] text-[#006D77] flex items-center justify-center mx-auto shadow-inner">
                  <Moon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#006D77]">Rest Day: No Tasks Scheduled</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium mt-1 leading-relaxed">
                    Scheduled recovery day according to your weekly frequency. Rebuild your energy and prepare for tomorrow's discipline.
                  </p>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EDF6F9] text-[#006D77] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#E29578]" />
                  <span>Intentional Recovery & Clarity</span>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <AlertCircle className="w-8 h-8 text-[#83C5BE] mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No tasks logged for today</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tap the (+) button below to add an ad-hoc goal or edit your routine!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task) => {
                  const taskId = task.taskId || task.id;
                  const isCompleted = task.status === 'COMPLETED' || task.isCompleted;
                  const isSkipped = task.status === 'SKIPPED';

                  return (
                    <div
                      key={taskId}
                      onClick={() => handleToggleTask(task)}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer select-none border ${
                        isCompleted
                          ? 'bg-[#EDF6F9]/70 border-[#83C5BE]/40 text-slate-500'
                          : isSkipped
                          ? 'bg-amber-50/40 border-amber-200/60 text-slate-400'
                          : 'bg-white border-gray-100 hover:border-[#83C5BE]/50 shadow-sm text-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                        {/* Toggle Checkbox Button */}
                        <div className="shrink-0 transition-transform active:scale-90">
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-[#006D77] fill-[#83C5BE]/40" />
                          ) : isSkipped ? (
                            <FastForward className="w-6 h-6 text-amber-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-300 hover:text-[#006D77]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isCompleted || isSkipped
                                ? 'line-through text-slate-400'
                                : 'text-slate-800'
                            }`}
                          >
                            {task.taskContent || task.title}
                          </p>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            {task.isAdHoc && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#E29578] bg-[#FFDDD2]/40 px-1.5 py-0.5 rounded-md">
                                AD-HOC
                              </span>
                            )}
                            {isSkipped && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded-md">
                                SKIPPED
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Done Badge or Skip Action Button */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {isCompleted ? (
                          <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            DONE
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleSkipTask(task, e)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all active:scale-95 ${
                              isSkipped
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60'
                            }`}
                            title={isSkipped ? 'Reactivate Task' : 'Skip Task for Today'}
                          >
                            {isSkipped ? 'Unskip' : 'Skip'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) for Ad-Hoc Tasks */}
      {activeGoal && dailyLog && !isRestDay && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-[#006D77] hover:bg-[#04434B] text-white shadow-xl flex items-center justify-center transition-transform active:scale-90 z-30 border-2 border-white cursor-pointer"
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
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 font-semibold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!adHocContent.trim() || isSubmittingTask}
                  className="flex-1 py-2.5 rounded-xl bg-[#006D77] text-white font-bold text-xs hover:bg-[#04434B] disabled:opacity-50 cursor-pointer"
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
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-slate-600 font-semibold text-xs hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newGoalTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#006D77] text-white font-bold text-xs hover:bg-[#04434B] disabled:opacity-50 cursor-pointer"
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

      {/* Goal & Predefined Routine Edit Modal */}
      <GoalEditModal
        isOpen={showGoalEditModal}
        onClose={() => setShowGoalEditModal(false)}
        goal={activeGoal}
        onGoalUpdated={(updated) => {
          onSelectGoal(updated);
          fetchTasks();
        }}
      />
    </div>
  );
}
