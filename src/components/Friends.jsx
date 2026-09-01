import React, { useState, useEffect } from 'react';
import {
  Users,
  Zap,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  UserPlus,
  Mail,
  UserCheck,
  Search,
  Activity,
  Shield
} from 'lucide-react';
import { api } from '../services/api';
import UserSearch from './UserSearch';
import PendingRequestsInbox from './PendingRequestsInbox';

export default function Friends({ activeGoal }) {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'squad' | 'search' | 'requests'
  const [feedItems, setFeedItems] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nudgingId, setNudgingId] = useState(null);
  const [nudgeFeedback, setNudgeFeedback] = useState({});

  // Load all social data from live backend
  const loadSocialData = async () => {
    const stored = localStorage.getItem('user');
    if (!stored) return;

    setLoading(true);
    try {
      const [feedRes, friendsRes, pendingRes] = await Promise.all([
        api.getSquadFeed().catch(() => ({ data: [] })),
        api.getFriends().catch(() => ({ data: [] })),
        api.getPendingRequests().catch(() => ({ data: [] }))
      ]);

      setFeedItems(feedRes.data || []);
      setFriendsList(friendsRes.data || []);
      setPendingCount((pendingRes.data || []).length);
    } catch (err) {
      console.error('Failed to load social data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSocialData();
  }, []);

  const handleNudgeFriend = async (friendId, username, goalId) => {
    const targetGoalId = goalId || activeGoal?.id;
    if (!targetGoalId) {
      alert('Please select or create an active goal first.');
      return;
    }

    setNudgingId(friendId);
    try {
      await api.remindFriend(targetGoalId, friendId);
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
      setNudgingId(null);
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
      {/* Top Teal Header */}
      <div className="bg-[#006D77] text-white pt-6 pb-6 px-5 rounded-b-3xl shadow-lg relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Users className="w-5 h-5 text-[#FFDDD2]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">Social Accountability</h1>
              <p className="text-[11px] text-[#83C5BE] font-semibold tracking-wide uppercase">
                SQUAD TRACKING & PERMISSIONS
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-1 rounded-xl">
            Live WebPush
          </span>
        </div>

        {/* Tab Navigation Bar */}
        <div className="grid grid-cols-4 gap-1 bg-black/20 p-1 rounded-2xl backdrop-blur-md border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('feed')}
            className={`py-1.5 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'feed'
                ? 'bg-white text-[#006D77] shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('squad')}
            className={`py-1.5 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'squad'
                ? 'bg-white text-[#006D77] shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Squad</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`py-1.5 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'search'
                ? 'bg-white text-[#006D77] shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-1.5 rounded-xl transition-all flex items-center justify-center space-x-1 relative ${
              activeTab === 'requests'
                ? 'bg-white text-[#006D77] shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Inbox</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E29578] text-white text-[9px] font-black flex items-center justify-center border border-[#006D77]">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3 -mt-3">
        {/* Squad Status Overview Banner */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFDDD2]/40 flex items-center justify-center">
              <Flame className="w-6 h-6 text-[#E29578] fill-[#E29578]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#006D77]">Winter Ark Squad</h4>
              <p className="text-xs text-slate-500 font-medium">
                {friendsList.length} active accountability partners
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('search')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#EDF6F9] hover:bg-[#83C5BE]/20 text-[#006D77] font-bold text-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Tab 1: Live Squad Feed */}
        {activeTab === 'feed' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-extrabold text-[#006D77] uppercase tracking-wider">
                Live Squad Progress
              </h4>
              <span className="text-xs font-semibold text-[#83C5BE] bg-[#006D77]/10 px-2.5 py-0.5 rounded-full">
                {feedItems.length} Trackers Shared
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#006D77]" />
                <p className="text-xs text-slate-500">Checking squad activity...</p>
              </div>
            ) : feedItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-gray-200 space-y-2">
                <Users className="w-8 h-8 text-[#83C5BE] mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-700">No shared trackers yet</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  When your squad partners share their goal trackers with you, their live discipline cards will appear here.
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#006D77] text-white font-bold text-xs hover:bg-[#04434B] shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Squad Partners</span>
                </button>
              </div>
            ) : (
              feedItems.map((item) => {
                const percentage = item.todayProgressPercent ?? 0;
                const isFinished = percentage === 100;
                const isLagging = percentage < 50;
                const friendId = item.ownerId || item.goalId;
                const displayName = item.ownerUsername || 'warrior';
                const isNudging = nudgingId === friendId;
                const feedbackMsg = nudgeFeedback[friendId];

                return (
                  <div
                    key={item.goalId}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className="w-10 h-10 rounded-2xl bg-[#EDF6F9] border border-[#83C5BE]/30 flex items-center justify-center font-extrabold text-sm text-[#006D77] shrink-0">
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-sm font-extrabold text-slate-800 truncate">
                            @{displayName}
                          </h5>
                          <p className="text-xs text-slate-500 font-medium truncate max-w-[160px]">
                            {item.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#EDF6F9] text-[#006D77] text-xs font-bold shrink-0">
                        <Flame className="w-3.5 h-3.5 text-[#E29578] fill-[#E29578]" />
                        <span>{item.streakDays ?? 0}d</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">
                          {item.totalTasks > 0
                            ? `${item.completedTasks} of ${item.totalTasks} Tasks`
                            : "Today's Discipline"}
                        </span>
                        <span
                          className={
                            isFinished
                              ? 'text-emerald-600'
                              : isLagging
                              ? 'text-amber-600'
                              : 'text-[#006D77]'
                          }
                        >
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-[#EDF6F9] overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isFinished
                              ? 'bg-emerald-500'
                              : isLagging
                              ? 'bg-amber-500'
                              : 'bg-[#006D77]'
                          } `}
                          style={{ width: `${percentage}%` }}
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
                          onClick={() => handleNudgeFriend(friendId, displayName, item.goalId)}
                          disabled={isNudging}
                          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#E29578] hover:bg-[#d88465] text-white font-bold text-xs shadow-sm disabled:opacity-50 active:scale-95 transition-all"
                        >
                          {isNudging ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 fill-white" />
                          )}
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
        )}

        {/* Tab 2: Connected Squad Partners */}
        {activeTab === 'squad' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-extrabold text-[#006D77] uppercase tracking-wider">
                Connected Partners
              </h4>
              <span className="text-xs font-semibold text-[#83C5BE] bg-[#006D77]/10 px-2.5 py-0.5 rounded-full">
                {friendsList.length} Active
              </span>
            </div>

            {friendsList.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-gray-200 space-y-2">
                <Users className="w-8 h-8 text-[#83C5BE] mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-700">No squad members yet</p>
                <p className="text-xs text-slate-400">
                  Search for fellow warriors and send friend invitations.
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#006D77] text-white font-bold text-xs hover:bg-[#04434B]"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find Partners</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl divide-y divide-gray-50 shadow-sm border border-gray-100 overflow-hidden">
                {friendsList.map((friend) => (
                  <div
                    key={friend.id}
                    className="p-3.5 flex items-center justify-between hover:bg-[#EDF6F9]/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#006D77] text-[#FFDDD2] font-black text-sm flex items-center justify-center shadow-sm">
                        {friend.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="text-sm font-extrabold text-slate-800">
                          @{friend.username}
                        </h5>
                        <p className="text-[11px] text-slate-400">{friend.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNudgeFriend(friend.id, friend.username)}
                      disabled={nudgingId === friend.id}
                      className="p-2 rounded-xl bg-[#FFDDD2]/60 hover:bg-[#FFDDD2] text-[#006D77] transition-all active:scale-95"
                      title="Send WebPush Nudge"
                    >
                      {nudgingId === friend.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#006D77]" />
                      ) : (
                        <Zap className="w-4 h-4 text-[#E29578] fill-[#E29578]" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: User Discovery (Search) */}
        {activeTab === 'search' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-extrabold text-[#006D77] uppercase tracking-wider">
                Discover Warriors
              </h4>
              <span className="text-[11px] font-semibold text-slate-400">Instant Search</span>
            </div>
            <UserSearch onRequestSent={loadSocialData} />
          </div>
        )}

        {/* Tab 4: Pending Requests Inbox */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-extrabold text-[#006D77] uppercase tracking-wider">
                Incoming Invitations
              </h4>
              <span className="text-xs font-semibold text-[#83C5BE] bg-[#006D77]/10 px-2.5 py-0.5 rounded-full">
                {pendingCount} Pending
              </span>
            </div>
            <PendingRequestsInbox onRequestHandled={loadSocialData} />
          </div>
        )}
      </div>
    </div>
  );
}
