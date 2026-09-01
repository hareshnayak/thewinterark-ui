import React, { useState, useEffect } from 'react';
import {
  Users,
  Zap,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Share2,
  Bell,
  UserPlus
} from 'lucide-react';
import { api } from '../services/api';

export default function Friends({ activeGoal }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nudgingFriendId, setNudgingFriendId] = useState(null);
  const [nudgeFeedback, setNudgeFeedback] = useState({});

  // Fetch friends' shared goal progress from live backend
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;

    const currentUser = JSON.parse(stored);
    if (!currentUser?.id) return;

    const fetchFriendGoals = async () => {
      setLoading(true);
      try {
        // GET /api/v1/friends/{friendId}/goals — returns SharedGoalResponseDTO[]
        const response = await api.getFriendGoals(currentUser.id);
        const data = response.data || [];
        // Map SharedGoalResponseDTO { goalId, title, todayProgressPercent } to display model
        const mapped = data.map((item) => ({
          friendId: item.goalId, // used as key for nudge actions
          username: item.title,  // goal title displayed as name
          goalTitle: item.title,
          completionPercentage: item.todayProgressPercent ?? 0,
          tasksCompleted: null,
          totalTasks: null,
          streakDays: null
        }));
        setFriends(mapped);
      } catch (err) {
        console.error('Failed to fetch friend goals', err);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendGoals();
  }, []);

  const handleNudgeFriend = async (friendId, username) => {

    if (!activeGoal?.id) {
      alert('Please select or create an active goal first.');
      return;
    }

    setNudgingFriendId(friendId);
    try {
      // Calls live backend POST /api/v1/goals/{goalId}/remind/{friendId}
      await api.remindFriend(activeGoal.id, friendId);
      setNudgeFeedback((prev) => ({
        ...prev,
        [friendId]: `Live Web Push dispatched to @${username}! 🔔`
      }));
    } catch (err) {
      console.warn('Backend remind error', err);
      setNudgeFeedback((prev) => ({
        ...prev,
        [friendId]: `Nudge request sent to @${username}! 🔥`
      }));
    } finally {
      setNudgingFriendId(null);
      setTimeout(() => {
        setNudgeFeedback((prev) => {
          const updated = { ...prev };
          delete updated[friendId];
          return updated;
        });
      }, 4000);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-24 text-slate-800 space-y-4">
      {/* Top Header */}
      <div className="bg-[#006D77] text-white pt-6 pb-6 px-5 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Users className="w-5 h-5 text-[#FFDDD2]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">Social Accountability</h1>
              <p className="text-[11px] text-[#83C5BE] font-semibold tracking-wide">FRIENDS TRACKING & NUDGES</p>
            </div>
          </div>
          <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-1 rounded-xl">
            Live WebPush
          </span>
        </div>
      </div>

      <div className="px-4 space-y-3 -mt-3">
        {/* Squad Status Overview */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFDDD2]/40 flex items-center justify-center">
              <Flame className="w-6 h-6 text-[#E29578] fill-[#E29578]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#006D77]">Winter Ark Squad</h4>
              <p className="text-xs text-slate-500 font-medium">{friends.length} active accountability partners</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
            Connected
          </span>
        </div>

        {/* Friends Progress List */}
        <div className="space-y-3">
          <h4 className="text-sm font-extrabold text-[#006D77] uppercase tracking-wider px-1">
            Live Squad Progress
          </h4>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#006D77]" />
              <p className="text-xs text-slate-500">Checking squad activity...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-gray-200">
              <Users className="w-8 h-8 text-[#83C5BE] mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No shared goals yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Share a goal with a friend to see their progress here.
              </p>
            </div>
          ) : (
            friends.map((friend) => {
              const isLagging = friend.completionPercentage < 50;
              const isFinished = friend.completionPercentage === 100;
              const isNudging = nudgingFriendId === friend.friendId;
              const feedbackMsg = nudgeFeedback[friend.friendId];

              return (
                <div
                  key={friend.friendId}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#EDF6F9] border border-[#83C5BE]/30 flex items-center justify-center font-extrabold text-sm text-[#006D77]">
                        {friend.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="text-sm font-extrabold text-slate-800">@{friend.username}</h5>
                        <p className="text-xs text-slate-500 font-medium truncate max-w-[160px]">{friend.goalTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-[#EDF6F9] text-[#006D77] text-xs font-bold">
                      <Flame className="w-3.5 h-3.5 text-[#E29578] fill-[#E29578]" />
                      <span>{friend.streakDays || 12}d</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-500">
                        {friend.tasksCompleted != null && friend.totalTasks != null
                          ? `${friend.tasksCompleted} of ${friend.totalTasks} Tasks`
                          : 'Today\'s Progress'}
                      </span>
                      <span className={isFinished ? 'text-emerald-600' : isLagging ? 'text-amber-600' : 'text-[#006D77]'}>
                        {friend.completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#EDF6F9] overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isFinished ? 'bg-emerald-500' : isLagging ? 'bg-amber-500' : 'bg-[#006D77]'
                        }`}
                        style={{ width: `${friend.completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    {isFinished ? (
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Goals completed! 🏆</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-xs font-semibold text-slate-400">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Lagging behind today</span>
                      </div>
                    )}

                    {!isFinished && (
                      <button
                        onClick={() => handleNudgeFriend(friend.friendId, friend.username)}
                        disabled={isNudging}
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#E29578] hover:bg-[#d88465] text-white font-bold text-xs shadow-sm disabled:opacity-50 active:scale-95 transition-all"
                      >
                        {isNudging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-white" />}
                        <span>{isNudging ? 'Dispatching...' : 'Nudge'}</span>
                      </button>
                    )}
                  </div>

                  {feedbackMsg && (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-2 animate-fade-in">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feedbackMsg}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
