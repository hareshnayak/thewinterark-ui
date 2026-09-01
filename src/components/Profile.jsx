import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Key,
  LogOut,
  ArrowLeft,
  Flame,
  ShieldCheck,
  Calendar,
  Sparkles,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const username = user?.username || 'warrior';
  const email = user?.email || `${username}@winterark.com`;
  const userId = user?.id || 'Unknown';

  return (
    <div className="flex flex-col min-h-full pb-10 text-slate-800 space-y-4">
      {/* Top Header */}
      <div className="bg-[#006D77] text-white pt-6 pb-6 px-5 rounded-b-3xl shadow-lg relative">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all backdrop-blur-md flex items-center space-x-1 text-xs font-bold active:scale-95"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <span className="text-[10px] bg-white/20 text-[#FFDDD2] font-black px-2.5 py-1 rounded-xl">
            WARRIOR PROFILE
          </span>
        </div>

        {/* User Hero Banner */}
        <div className="flex items-center space-x-3.5">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl font-black shadow-inner backdrop-blur-md">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">@{username}</h2>
            <div className="flex items-center space-x-1.5 text-xs text-[#83C5BE] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Account • PostgreSQL Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 -mt-2">
        {/* Account Details Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-xs font-extrabold text-[#006D77] uppercase tracking-wider">
            Account Credentials
          </h3>

          <div className="space-y-3">
            {/* Username */}
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#EDF6F9]/60 border border-[#83C5BE]/20">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#006D77] shadow-xs shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Username</p>
                <p className="text-xs font-extrabold text-slate-800 truncate">@{username}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#EDF6F9]/60 border border-[#83C5BE]/20">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#006D77] shadow-xs shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                <p className="text-xs font-extrabold text-slate-800 truncate">{email}</p>
              </div>
            </div>

            {/* User UUID */}
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-[#EDF6F9]/60 border border-[#83C5BE]/20">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#006D77] shadow-xs shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Account Identifier</p>
                <p className="text-[11px] font-mono font-bold text-slate-700 truncate">{userId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* System & Storage Status */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-800">Live Session Active</h4>
              <p className="text-[11px] text-slate-400">JWT stored securely in browser</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            CONNECTED
          </span>
        </div>

        {/* Prominent Log Out Action */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-xs transition-all shadow-xs flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out of The Winter Ark</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
            Clears your authentication token and returns to the Landing Page.
          </p>
        </div>
      </div>
    </div>
  );
}
