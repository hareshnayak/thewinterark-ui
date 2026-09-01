import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Check, Loader2, Sparkles, AlertCircle, X } from 'lucide-react';
import { api } from '../services/api';

export default function UserSearch({ onRequestSent }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentMap, setSentMap] = useState({});
  const [sendingId, setSendingId] = useState(null);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await api.searchUsers(query.trim());
        setResults(response.data || []);
      } catch (err) {
        console.error('Failed to search users', err);
        setError('Error finding users. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSendRequest = async (targetUser) => {
    setSendingId(targetUser.id);
    try {
      await api.sendFriendRequest(targetUser.id);
      setSentMap((prev) => ({ ...prev, [targetUser.id]: true }));
      if (onRequestSent) onRequestSent(targetUser);
    } catch (err) {
      console.error('Failed to send friend request', err);
      alert('Could not send friend request: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username (e.g. alex_fitness)"
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006D77] focus:border-transparent shadow-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-3 p-0.5 rounded-full hover:bg-gray-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown / Card List */}
      {loading && (
        <div className="flex items-center justify-center py-6 space-x-2 text-slate-400 text-xs font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-[#006D77]" />
          <span>Searching accountability partners...</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-200">
          <Sparkles className="w-6 h-6 text-[#83C5BE] mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-700">No new users found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Users who are already in your squad or have pending requests are excluded.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 divide-y divide-gray-50">
          {results.map((user) => {
            const isSent = sentMap[user.id];
            const isSending = sendingId === user.id;

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-2.5 hover:bg-[#EDF6F9]/40 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#006D77] text-[#FFDDD2] font-black text-xs flex items-center justify-center shadow-sm">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">@{user.username}</h5>
                    <p className="text-[10px] text-slate-400 font-medium">Ready for accountability</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSendRequest(user)}
                  disabled={isSent || isSending}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 ${
                    isSent
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                      : 'bg-[#006D77] hover:bg-[#04434B] text-white disabled:opacity-50'
                  }`}
                >
                  {isSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isSent ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5 text-[#FFDDD2]" />
                  )}
                  <span>{isSending ? 'Sending...' : isSent ? 'Sent' : 'Add Partner'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
