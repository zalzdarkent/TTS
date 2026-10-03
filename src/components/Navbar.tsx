import React from 'react';
import { Mic2, Radio, Sparkles, Library, Dna, Volume2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'tts' | 'clone' | 'history';
  setActiveTab: (tab: 'tts' | 'clone' | 'history') => void;
  clonedVoicesCount: number;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  clonedVoicesCount,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('tts')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 shadow-lg shadow-indigo-500/20 text-white font-bold">
              <Mic2 className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Suara<span className="text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Studio Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Text to Speech & Kloning Suara AI
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('tts')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tts'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span className="hidden sm:inline">Studio TTS & Dokumen</span>
              <span className="sm:hidden">Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('clone')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'clone'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Dna className="w-4 h-4 text-violet-400" />
              <span>Kloning Suara</span>
              {clonedVoicesCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-violet-400/20 text-violet-300 border border-violet-400/30">
                  {clonedVoicesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Library className="w-4 h-4" />
              <span className="hidden md:inline">Galeri Audio</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>

          {/* Model Status Badge */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono bg-slate-900/90 text-slate-300 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400">Model:</span>
            <span className="text-indigo-300 font-semibold">gemini-3.8-flash-tts</span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-medium">24kHz WAV</span>
          </div>
        </div>
      </div>
    </header>
  );
};
