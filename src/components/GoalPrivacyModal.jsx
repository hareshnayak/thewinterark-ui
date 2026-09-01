import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Check, X, Loader2, Users, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function GoalPrivacyModal({ isOpen, onClose, goal }) {
  const [friends, setFriends] = useState([]);
  const [sharedMap, setSharedMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!isOpen || !goal?.id) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all accepted friends and current shares for this goal in parallel
        const [friendsRes, sharesRes] = await Promise.all([
          api.getFriends(),
          api.getGoalShares(goal.id)
        ]);

        const allFriends = friendsRes.data || [];
        const activeShares = sharesRes.data || [];

        // Build active shares map { [friendId]: true }
        const map = {};
        activeShares.forEach((s) => {
          map[s.id || s.friendId] = true;
        });

        setFriends(allFriends);
        setSharedMap(map);
      } catch (err) {
        console.error('Failed to load sharing permissions', err);
        setError('Could not load friends list.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, goal?.id]);

  if (!isOpen) return null;

  const handleToggleShare = async (friend) => {
    const friendId = friend.id;
    const currentlyShared = !!sharedMap[friendId];
    const newStatus = !currentlyShared;

    setTogglingId(friendId);
    // Optimistic local update
    setSharedMap((prev) => ({ ...prev, [friendId]: newStatus }));

    try {
      if (newStatus) {
        // Grant access
        await api.shareGoal(goal.id, friendId);
        setFeedback(`Granted view access to @${friend.username}`);
      } else {
        // Revoke access
        await api.revokeGoalAccess(goal.id, friendId);
        setFeedback(`Revoked access from @${friend.username}`);
      }
    } catch (err) {
      console.error('Failed to update share permission', err);
      // Rollback
      setSharedMap((prev) => ({ ...prev, [friendId]: currentlyShared }));
      alert('Error updating permission: ' + (err.response?.data?.message || err.message));
    } finally {
      setTogglingId(null);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const sharedCount = Object.values(sharedMap).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#EDF6F9] rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-[#83C5BE]/30 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#006D77]/10 flex items-center justify-center text-[#006D77]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#006D77] text-sm">Goal Privacy & Sharing</h3>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                {goal?.title || 'Active Goal'}
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
        <div className="p-4 overflow-y-auto space-y-3">
          {/* Summary Banner */}
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EDF6F9] flex items-center justify-center text-[#006D77]">
                {sharedCount > 0 ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800">
                  {sharedCount > 0 ? `${sharedCount} Partners Can View` : 'Private Tracker'}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {sharedCount > 0
                    ? 'Shared partners see your daily progress'
                    : 'Only you can see this tracker'}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                sharedCount > 0
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-gray-100 text-slate-500'
              }`}
            >
              {sharedCount > 0 ? 'SHARED' : 'PRIVATE'}
            </span>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center space-x-2 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Friends Permission List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-extrabold text-[#006D77] uppercase tracking-wider">
                Accountability Squad
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {friends.length} Connected
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#006D77]" />
                <p className="text-xs text-slate-400">Loading squad permissions...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
                <Users className="w-7 h-7 text-[#83C5BE] mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">No squad partners yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Connect with friends on the Squad tab to grant tracker access!
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl divide-y divide-gray-50 shadow-sm border border-gray-100 overflow-hidden">
                {friends.map((friend) => {
                  const isShared = !!sharedMap[friend.id];
                  const isToggling = togglingId === friend.id;

                  return (
                    <div
                      key={friend.id}
                      className="p-3 flex items-center justify-between hover:bg-[#EDF6F9]/30 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-xl bg-[#006D77] text-[#FFDDD2] font-black text-xs flex items-center justify-center shrink-0">
                          {friend.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-black text-slate-800 truncate">
                            @{friend.username}
                          </h5>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md inline-block ${
                              isShared
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-gray-100 text-slate-400'
                            }`}
                          >
                            {isShared ? 'Can View Tracker' : 'No Access'}
                          </span>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleShare(friend)}
                        disabled={isToggling}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                          isShared ? 'bg-[#006D77]' : 'bg-slate-200'
                        }`}
                        role="switch"
                        aria-checked={isShared}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isShared ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-white border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#006D77] hover:bg-[#04434B] text-white font-bold text-xs transition-all shadow-md active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
