import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Loader2, Mail, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function PendingRequestsInbox({ onRequestHandled }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getPendingRequests();
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to load pending requests', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleAccept = async (req) => {
    setActioningId(req.requesterId);
    try {
      await api.acceptFriendRequest(req.requesterId);
      setRequests((prev) => prev.filter((r) => r.requesterId !== req.requesterId));
      setFeedback(`Connected with @${req.requesterUsername}! 🎉`);
      if (onRequestHandled) onRequestHandled();
    } catch (err) {
      console.error('Failed to accept friend request', err);
      alert('Could not accept request: ' + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDecline = async (req) => {
    setActioningId(req.requesterId);
    try {
      await api.declineFriendRequest(req.requesterId);
      setRequests((prev) => prev.filter((r) => r.requesterId !== req.requesterId));
      setFeedback(`Declined request from @${req.requesterUsername}.`);
      if (onRequestHandled) onRequestHandled();
    } catch (err) {
      console.error('Failed to decline friend request', err);
      alert('Could not decline request: ' + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#006D77]" />
        <p className="text-xs text-slate-400 font-medium">Checking incoming invitations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
          <Mail className="w-7 h-7 text-[#83C5BE] mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-700">No pending invitations</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            When other winter warriors send you squad invites, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => {
            const isProcessing = actioningId === req.requesterId;

            return (
              <div
                key={req.requestId || req.requesterId}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 flex items-center justify-between space-x-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#FFDDD2]/60 border border-[#E29578]/30 flex items-center justify-center font-black text-sm text-[#006D77] shrink-0">
                    {req.requesterUsername.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-slate-800 truncate">
                      @{req.requesterUsername}
                    </h5>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {req.createdAt
                          ? new Date(req.createdAt).toLocaleDateString()
                          : 'Pending invitation'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {/* Accept Button */}
                  <button
                    onClick={() => handleAccept(req)}
                    disabled={isProcessing}
                    className="p-2 rounded-xl bg-[#006D77] hover:bg-[#04434B] text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    title="Accept Invitation"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-[#FFDDD2]" />
                    )}
                  </button>

                  {/* Decline Button */}
                  <button
                    onClick={() => handleDecline(req)}
                    disabled={isProcessing}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-all active:scale-95 disabled:opacity-50 border border-gray-200"
                    title="Decline Invitation"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
