import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  Flame,
  Award,
  CalendarCheck,
  Zap,
  Loader2,
  Database,
  AlertCircle,
  FastForward,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react';
import { api } from '../services/api';

export default function Analytics({ activeGoal }) {
  const [daysRange, setDaysRange] = useState(30);
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Skipped Tasks State
  const [showSkipped, setShowSkipped] = useState(false);
  const [skippedTasks, setSkippedTasks] = useState([]);
  const [skippedLoading, setSkippedLoading] = useState(false);

  useEffect(() => {
    if (!activeGoal?.id) {
      setStatsData([]);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getGoalStats(activeGoal.id, daysRange);
        if (response.data && response.data.length > 0) {
          const formatted = response.data.map((item) => ({
            date: item.date ? (typeof item.date === 'string' ? item.date.slice(5) : item.date) : '',
            percentage: item.completionPercent ?? 0,
            fullDate: item.date
          }));

          setStatsData(formatted);
        } else {
          setStatsData([]);
        }
      } catch (err) {
        console.error('Failed to fetch stats from backend', err);
        setError('Could not load stats from backend.');
        setStatsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [activeGoal?.id, daysRange]);

  // Fetch Skipped Tasks when toggle is activated
  const handleToggleSkipped = async () => {
    const nextState = !showSkipped;
    setShowSkipped(nextState);

    if (nextState && activeGoal?.id) {
      setSkippedLoading(true);
      try {
        const res = await api.getSkippedTasks(activeGoal.id);
        setSkippedTasks(res.data || []);
      } catch (err) {
        console.error('Failed to load skipped tasks', err);
      } finally {
        setSkippedLoading(false);
      }
    }
  };

  // Group skipped tasks by date
  const groupedSkipped = skippedTasks.reduce((acc, task) => {
    const d = task.targetDate || 'Past';
    if (!acc[d]) acc[d] = [];
    acc[d].push(task);
    return acc;
  }, {});

  const avgCompletion = statsData.length
    ? Math.round(statsData.reduce((acc, curr) => acc + curr.percentage, 0) / statsData.length)
    : 0;

  const perfectDaysCount = statsData.filter((d) => d.percentage === 100).length;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-2xl shadow-xl border border-[#83C5BE]/30 text-xs">
          <p className="font-bold text-[#006D77] mb-1">Date: {label}</p>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006D77]" />
            <span className="font-extrabold text-slate-800 text-sm">
              {payload[0].value}% Completed
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col min-h-full pb-24 text-slate-800 space-y-4">
      {/* Top Banner Header */}
      <div className="bg-[#006D77] text-white pt-6 pb-6 px-5 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <TrendingUp className="w-5 h-5 text-[#FFDDD2]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">Performance Analytics</h1>
              <p className="text-[11px] text-[#83C5BE] font-semibold tracking-wide truncate max-w-[180px]">
                {activeGoal ? activeGoal.title : 'NO ACTIVE GOAL'}
              </p>
            </div>
          </div>

          <div className="flex bg-black/20 rounded-xl p-1 backdrop-blur-md">
            {[7, 30].map((range) => (
              <button
                key={range}
                onClick={() => setDaysRange(range)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  daysRange === range
                    ? 'bg-white text-[#006D77] shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {range}D
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 -mt-3">
        {!activeGoal ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100">
            <AlertCircle className="w-8 h-8 text-[#83C5BE] mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No active goal selected</p>
            <p className="text-xs text-slate-400 mt-1">Please select or create a goal on the Checklist tab.</p>
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#EDF6F9] flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-[#006D77]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Rate</p>
                  <h4 className="text-xl font-black text-[#006D77]">{avgCompletion}%</h4>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFDDD2]/40 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-[#E29578] fill-[#E29578]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Logged Days</p>
                  <h4 className="text-xl font-black text-[#E29578]">{statsData.length} Days</h4>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">100% Days</p>
                  <h4 className="text-xl font-black text-emerald-600">{perfectDaysCount} Days</h4>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Data Source</p>
                  <h4 className="text-xs font-black text-slate-800">PostgreSQL Live</h4>
                </div>
              </div>
            </div>

            {/* Completion Trend Area Chart */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-[#006D77] uppercase tracking-wider">
                    Discipline Trend
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Daily completion percentages</p>
                </div>
                <span className="text-xs font-bold text-[#006D77] bg-[#EDF6F9] px-2.5 py-1 rounded-xl">
                  {daysRange}D Window
                </span>
              </div>

              {loading ? (
                <div className="h-56 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#006D77]" />
                  <p className="text-xs text-slate-400">Querying live backend stats...</p>
                </div>
              ) : statsData.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-100 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">No logs recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Complete daily tasks on the Checklist tab to populate your graph!
                  </p>
                </div>
              ) : (
                <div className="h-56 w-full -ml-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#006D77" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#83C5BE" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF6F9" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        tickLine={false}
                        axisLine={false}
                        ticks={[0, 50, 100]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="percentage"
                        stroke="#006D77"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTeal)"
                        dot={{ r: 3, fill: '#006D77' }}
                        activeDot={{ r: 5, fill: '#E29578' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Skipped Tasks History Section */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <FastForward className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Historical Skipped Tasks
                    </h4>
                    <p className="text-[10px] text-slate-400">Past missed or intentionally skipped goals</p>
                  </div>
                </div>

                <button
                  onClick={handleToggleSkipped}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#EDF6F9] hover:bg-[#83C5BE]/20 text-[#006D77] font-bold text-xs transition-all cursor-pointer"
                >
                  <span>{showSkipped ? 'Hide' : 'Show Skipped'}</span>
                  {showSkipped ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showSkipped && (
                <div className="pt-2 border-t border-gray-100 space-y-3 animate-fade-in">
                  {skippedLoading ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#006D77]" />
                      <p className="text-xs text-slate-400">Loading historical skipped tasks...</p>
                    </div>
                  ) : Object.keys(groupedSkipped).length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#EDF6F9]/50 text-center border border-dashed border-[#83C5BE]/30">
                      <p className="text-xs font-bold text-[#006D77]">Zero Skipped Tasks! 🔥</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        You have completed all scheduled tasks or have no skipped logs recorded.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(groupedSkipped).map(([dateStr, items]) => (
                        <div
                          key={dateStr}
                          className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 text-xs font-extrabold text-amber-800">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{dateStr}</span>
                            </div>
                            <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                              {items.length} Skipped
                            </span>
                          </div>

                          <div className="space-y-1 pl-1">
                            {items.map((task) => (
                              <div
                                key={task.taskId}
                                className="flex items-center space-x-2 text-xs text-slate-600"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                <span className="line-through text-slate-500">{task.taskContent}</span>
                                {task.isAdHoc && (
                                  <span className="text-[9px] font-bold text-[#E29578] bg-[#FFDDD2]/60 px-1.5 py-0.2 rounded">
                                    Ad-Hoc
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
