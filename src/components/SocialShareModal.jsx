import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, CheckCircle2, Flame, Sparkles, X, Copy, Check } from 'lucide-react';

export default function SocialShareModal({
  isOpen,
  onClose,
  goalTitle = 'Winter Ark Accountability',
  date = new Date().toISOString().split('T')[0],
  tasks = [],
  streak = 0
}) {
  const cardRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!isOpen) return null;

  const completedCount = tasks.filter((t) => t.isCompleted || t.completed).length;
  const totalCount = tasks.length || 1;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const generateCardImageBlob = async () => {
    if (!cardRef.current) return null;
    setIsCapturing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#006D77'
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      const blob = await generateCardImageBlob();
      if (!blob) return;

      const file = new File([blob], `winterark-achievement-${date}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Daily Goal Completed! 🔥',
          text: `Crushed 100% of my goals on OneGoal today! Current streak: ${streak} days! ❄️✨`
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else if (navigator.share) {
        await navigator.share({
          title: 'Daily Goal Completed! 🔥',
          text: `Crushed 100% of my goals on OneGoal today! Current streak: ${streak} days! ❄️✨`,
          url: window.location.origin
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        handleDownloadImage();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Sharing failed:', err);
      }
    }
  };

  const handleDownloadImage = async () => {
    const blob = await generateCardImageBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `onegoal-completed-${date}.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyText = () => {
    const text = `🎯 OneGoal Daily Achievement: 100% Completed on ${date}!\n🔥 Streak: ${streak} Days\n❄️ The Winter Ark Accountability Tracker`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#EDF6F9] rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-[#83C5BE]/30 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#006D77]" />
            <h3 className="font-bold text-[#006D77] text-base">Share Achievement</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Exportable Card Container */}
        <div className="p-4 overflow-y-auto flex flex-col items-center">
          {/* Capture Card */}
          <div
            ref={cardRef}
            className="w-full rounded-2xl p-5 text-white relative overflow-hidden shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #006D77 0%, #04434B 60%, #83C5BE 100%)'
            }}
          >
            {/* Background Decorative Rings */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-6 -top-6 w-24 h-24 bg-[#FFDDD2]/15 rounded-full blur-lg pointer-events-none" />

            {/* Top Brand Banner */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Flame className="w-4 h-4 text-[#FFDDD2]" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#FFDDD2]">
                    ONEGOAL • WINTER ARK
                  </h4>
                  <p className="text-[11px] text-[#EDF6F9]/80 font-medium">{date}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 px-2.5 py-1 bg-white/15 rounded-full backdrop-blur-md">
                <Flame className="w-3.5 h-3.5 text-[#E29578] fill-[#E29578]" />
                <span className="text-xs font-bold text-white">{streak}d Streak</span>
              </div>
            </div>

            {/* Main Badge & Title */}
            <div className="text-center my-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 mb-2 shadow-inner">
                <CheckCircle2 className="w-9 h-9 text-[#83C5BE]" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">{goalTitle}</h2>
              <p className="text-xs font-semibold text-[#83C5BE] mt-0.5">
                {percentage}% ALL GOALS CRUSHED TODAY!
              </p>
            </div>

            {/* Completed Tasks Snippet */}
            <div className="bg-black/20 rounded-xl p-3 my-3 backdrop-blur-sm border border-white/10 space-y-1.5 max-h-32 overflow-hidden">
              {tasks.slice(0, 4).map((task, idx) => (
                <div key={task.id || idx} className="flex items-center space-x-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#83C5BE] shrink-0" />
                  <span className="truncate text-[#EDF6F9] font-medium">
                    {task.taskContent || task.title || 'Completed Task'}
                  </span>
                </div>
              ))}
              {tasks.length > 4 && (
                <p className="text-[10px] text-center text-[#FFDDD2] font-semibold pt-1">
                  +{tasks.length - 4} more completed today
                </p>
              )}
            </div>

            {/* Motivational Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-[#EDF6F9]/75">
              <span>Accountability & Discipline</span>
              <span className="font-semibold text-[#FFDDD2]">#WinterArk</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-2">
          <button
            onClick={handleNativeShare}
            disabled={isCapturing}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#006D77] hover:bg-[#04434B] text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>{isCapturing ? 'Preparing Image...' : 'Share to Instagram / WhatsApp'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadImage}
              disabled={isCapturing}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-[#EDF6F9] hover:bg-[#83C5BE]/20 text-[#006D77] font-semibold text-xs rounded-xl transition-all border border-[#83C5BE]/40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Image</span>
            </button>
            <button
              onClick={handleCopyText}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-[#EDF6F9] hover:bg-[#83C5BE]/20 text-[#006D77] font-semibold text-xs rounded-xl transition-all border border-[#83C5BE]/40"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>

          {shareSuccess && (
            <p className="text-center text-xs text-emerald-600 font-bold animate-pulse">
              Shared successfully!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
