import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  CheckCircle2,
  Users,
  Shield,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  Target,
  ChevronRight
} from 'lucide-react';
import AuthModal from './AuthModal';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [defaultIsLogin, setDefaultIsLogin] = useState(false);
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();

  const handleOpenRegister = () => {
    setDefaultIsLogin(false);
    setIsAuthOpen(true);
  };

  const handleOpenLogin = () => {
    setDefaultIsLogin(true);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (userData) => {
    login(userData, userData.token);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="flex flex-col min-h-full pb-10 text-slate-800 space-y-4">
      {/* Hero Banner Header */}
      <div className="bg-gradient-to-b from-[#006D77] to-[#04434B] text-white pt-8 pb-8 px-6 rounded-b-3xl shadow-xl relative overflow-hidden">
        {/* Background Ambient Blur Rings */}
        <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-[#83C5BE]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-[#FFDDD2]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
              <Flame className="w-5 h-5 text-[#FFDDD2]" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white">THE WINTER ARK</h1>
              <p className="text-[10px] text-[#83C5BE] font-bold tracking-widest uppercase">
                DISCIPLINE & ACCOUNTABILITY
              </p>
            </div>
          </div>

          <span className="text-[10px] bg-white/20 text-[#FFDDD2] font-black px-2.5 py-1 rounded-xl">
            V1.0 LIVE
          </span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="my-5 space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#FFDDD2] text-[11px] font-bold border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-[#FFDDD2]" />
            <span>Winter Transformation 2026</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
            Forged in cold sweat. <br />
            <span className="text-[#83C5BE]">Driven by your squad.</span>
          </h2>
          <p className="text-xs text-[#EDF6F9]/80 font-medium leading-relaxed max-w-xs">
            A high-performance daily habit tracker and social accountability platform built to keep you relentless.
          </p>
        </div>

        {/* Hero Call to Action Buttons */}
        <div className="pt-2 space-y-2">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#E29578] hover:bg-[#d88465] text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
            >
              <span>Resume Dashboard (@{user?.username})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={handleOpenRegister}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#E29578] hover:bg-[#d88465] text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
              >
                <span>Join The Winter Ark</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleOpenLogin}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all backdrop-blur-md border border-white/20 active:scale-95 cursor-pointer"
              >
                Already a warrior? Sign In
              </button>
            </>
          )}
        </div>
      </div>

      {/* Feature Value Propositions */}
      <div className="px-4 space-y-3 -mt-2">
        <h3 className="text-xs font-black text-[#006D77] uppercase tracking-wider px-1">
          Architected for Relentless Discipline
        </h3>

        {/* Feature 1: Social Accountability */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FFDDD2]/50 flex items-center justify-center text-[#E29578] shrink-0 mt-0.5">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-slate-800">Squad Accountability & Nudges</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-normal">
              Connect with fellow accountability partners. Dispatch live Web Push nudges when friends lag behind.
            </p>
          </div>
        </div>

        {/* Feature 2: Granular Privacy */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-slate-800">Granular Privacy Control</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-normal">
              You own your data. Toggle per-goal sharing permissions to decide exactly which friends see each tracker.
            </p>
          </div>
        </div>

        {/* Feature 3: Live Progress & Checklists */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EDF6F9] flex items-center justify-center text-[#006D77] shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-slate-800">Real-Time Daily Checklists</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-normal">
              Predefined routines with ad-hoc task logging, optimistic task updates, and real-time PostgreSQL persistence.
            </p>
          </div>
        </div>

        {/* Feature 4: Analytics */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-slate-800">Visual Performance Curves</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-normal">
              Track 30-day completion rates, perfect consistency streaks, and share custom achievement cards.
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Auth Launch */}
      <div className="px-4 pt-2">
        <div className="bg-gradient-to-r from-[#006D77] to-[#04434B] rounded-3xl p-5 text-white text-center space-y-3 shadow-md">
          <h4 className="text-sm font-black">Ready to build unbreakable momentum?</h4>
          <button
            onClick={handleOpenRegister}
            className="w-full py-3 px-4 rounded-xl bg-white text-[#006D77] font-extrabold text-xs hover:bg-[#EDF6F9] transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Start Your Winter Ark Challenge
          </button>
        </div>
      </div>

      {/* Auth Modal with Close (X) button */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialIsLogin={defaultIsLogin}
      />
    </div>
  );
}
