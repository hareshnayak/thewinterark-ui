import React, { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Mon' },
  { key: 'TUESDAY', label: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wed' },
  { key: 'THURSDAY', label: 'Thu' },
  { key: 'FRIDAY', label: 'Fri' },
  { key: 'SATURDAY', label: 'Sat' },
  { key: 'SUNDAY', label: 'Sun' }
];

export default function GoalEditModal({ isOpen, onClose, goal, onGoalUpdated }) {
  const [title, setTitle] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [activeDays, setActiveDays] = useState([]);
  const [predefinedTasks, setPredefinedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !goal?.id) return;

    setTitle(goal.title || '');
    setTagLine(goal.tagLine || '');
    setActiveDays(goal.activeDays || DAYS_OF_WEEK.map((d) => d.key));

    const loadPredefined = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getPredefinedTasks(goal.id);
        setPredefinedTasks(res.data || []);
      } catch (err) {
        console.error('Failed to load predefined tasks', err);
        setError('Could not load predefined habits.');
      } finally {
        setLoading(false);
      }
    };

    loadPredefined();
  }, [isOpen, goal?.id]);

  if (!isOpen) return null;

  const toggleDay = (dayKey) => {
    setActiveDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  const handleSaveGoalMeta = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const res = await api.updateGoal(goal.id, {
        title: title.trim(),
        tagLine: tagLine.trim(),
        activeDays
      });
      setFeedback('Goal settings saved!');
      if (onGoalUpdated) onGoalUpdated(res.data);
    } catch (err) {
      console.error('Failed to update goal', err);
      setError(err.response?.data?.message || err.message || 'Error updating goal.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleAddPredefinedTask = async (e) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;

    try {
      const res = await api.addPredefinedTask(goal.id, {
        taskContent: newTaskContent.trim()
      });
      setPredefinedTasks((prev) => [...prev, res.data]);
      setNewTaskContent('');
      setFeedback('Habit added to global routine!');
      if (onGoalUpdated) onGoalUpdated({ ...goal, activeDays });
    } catch (err) {
      console.error('Failed to add predefined task', err);
      alert('Error adding task: ' + (err.response?.data?.message || err.message));
    } finally {
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setEditingContent(task.taskContent);
  };

  const handleSaveEdit = async (taskId) => {
    if (!editingContent.trim()) return;

    try {
      const res = await api.updatePredefinedTask(goal.id, taskId, {
        taskContent: editingContent.trim()
      });
      setPredefinedTasks((prev) =>
        prev.map((t) => (t.id === taskId ? res.data : t))
      );
      setEditingTaskId(null);
      setFeedback('Habit updated!');
      if (onGoalUpdated) onGoalUpdated({ ...goal, activeDays });
    } catch (err) {
      console.error('Failed to update predefined task', err);
      alert('Error updating task: ' + (err.response?.data?.message || err.message));
    } finally {
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to remove this habit from your global schedule?')) return;

    try {
      await api.deletePredefinedTask(goal.id, taskId);
      setPredefinedTasks((prev) => prev.filter((t) => t.id !== taskId));
      setFeedback('Habit removed from global routine.');
      if (onGoalUpdated) onGoalUpdated({ ...goal, activeDays });
    } catch (err) {
      console.error('Failed to delete predefined task', err);
      alert('Error deleting task: ' + (err.response?.data?.message || err.message));
    } finally {
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#EDF6F9] rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-[#83C5BE]/30 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#006D77]/10 flex items-center justify-center text-[#006D77]">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#006D77] text-sm">Goal & Habit Settings</h3>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                {goal?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3.5">
          {feedback && (
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-2 animate-fade-in">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Goal Details & Active Days */}
          <form onSubmit={handleSaveGoalMeta} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <h4 className="text-xs font-extrabold text-[#006D77] uppercase tracking-wider">
              Goal Schedule & Frequency
            </h4>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Goal Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#EDF6F9] border border-[#83C5BE]/30 text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Active Days ({activeDays.length}/7 Days Active)
              </label>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map((day) => {
                  const isActive = activeDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className={`py-1.5 rounded-lg text-[10px] font-black transition-all ${
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

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2 rounded-xl bg-[#006D77] hover:bg-[#04434B] text-white font-bold text-xs shadow-xs disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Update Schedule'}
            </button>
          </form>

          {/* Section 2: Global Predefined Habits List */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#006D77] uppercase tracking-wider">
                Global Daily Routine
              </h4>
              <span className="text-[10px] font-bold text-[#83C5BE] bg-[#006D77]/10 px-2 py-0.5 rounded-full">
                {predefinedTasks.length} Habits
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#006D77]" />
                <p className="text-xs text-slate-400">Loading routine...</p>
              </div>
            ) : predefinedTasks.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-gray-200 rounded-xl">
                <p className="text-xs font-bold text-slate-600">No predefined habits yet</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Add habits below to automatically generate on active days.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {predefinedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl bg-[#EDF6F9]/60 border border-[#83C5BE]/20 flex items-center justify-between space-x-2"
                  >
                    {editingTaskId === task.id ? (
                      <div className="flex items-center space-x-1.5 flex-1">
                        <input
                          type="text"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          autoFocus
                          className="flex-1 px-2.5 py-1 rounded-lg bg-white border border-[#006D77] text-xs font-medium text-slate-800"
                        />
                        <button
                          onClick={() => handleSaveEdit(task.id)}
                          className="p-1.5 rounded-lg bg-[#006D77] text-white hover:bg-[#04434B]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingTaskId(null)}
                          className="p-1.5 rounded-lg bg-gray-200 text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-slate-800 truncate flex-1">
                          {task.taskContent}
                        </span>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleStartEdit(task)}
                            className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-[#006D77]"
                            title="Edit Habit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                            title="Delete Habit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add New Habit */}
            <form onSubmit={handleAddPredefinedTask} className="flex space-x-2 pt-1">
              <input
                type="text"
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                placeholder="Add new habit to routine..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#EDF6F9] border border-[#83C5BE]/30 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006D77]"
              />
              <button
                type="submit"
                disabled={!newTaskContent.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#006D77] hover:bg-[#04434B] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#006D77] hover:bg-[#04434B] text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
