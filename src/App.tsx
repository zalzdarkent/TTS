import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TTSStudio } from './components/TTSStudio';
import { VoiceCloneStudio } from './components/VoiceCloneStudio';
import { AudioHistory } from './components/AudioHistory';
import { VoiceProfile, GeneratedAudioItem } from './types';
import { Sparkles, Dna, Radio, ShieldCheck, Cpu } from 'lucide-react';
import { DEMO_CLONE_AUDIO, DEMO_DOC_1_AUDIO, DEMO_DOC_2_AUDIO } from './data/demoAudio';

const LOCAL_STORAGE_KEY_CLONES = 'suara_ai_cloned_voices_v2';
const LOCAL_STORAGE_KEY_HISTORY = 'suara_ai_audio_history_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tts' | 'clone' | 'history'>('tts');
  const [clonedVoices, setClonedVoices] = useState<VoiceProfile[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CLONES);
      if (saved && JSON.parse(saved).length > 0) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default demo cloned profile with real 24kHz synthesized audio
    return [
      {
        id: 'clone_demo_budi',
        name: 'Suara Budi - Santai & Hangat',
        anchorVoice: 'Charon',
        gender: 'Pria',
        pitch: 'Baritone bersuara hangat',
        timbre: 'Resonan dan tenang',
        pacing: 'Teratur dengan jeda artikulatif',
        accent: 'Aksen Indonesia natural & santai',
        systemStylePrompt: 'Warm, calm, deep baritone Indonesian speaker with friendly and measured conversational cadence',
        summary: 'Karakter suara pria dewasa bersahabat dengan nada tenang dan artikulasi jernih, ideal untuk podcast dan narasi dokumen.',
        similarityScore: 96,
        tags: ['Hangat', 'Tenang', 'Artikulasi Jernih', 'Podcast'],
        previewAudio: DEMO_CLONE_AUDIO,
        sampleText: 'Halo! Ini adalah suara hasil kloning AI saya untuk profil Suara Budi. Suara ini siap digunakan untuk membacakan dokumen dan naskah Anda.',
        createdAt: new Date().toISOString(),
        isCloned: true,
      },
    ];
  });

  const [history, setHistory] = useState<GeneratedAudioItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);
      if (saved && JSON.parse(saved).length > 0) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Initial sample conversion items with real 24kHz studio WAV audio
    return [
      {
        id: 'hist_demo_doc_1',
        title: 'Ringkasan Laporan AI & Otomasi 2026',
        textSnippet: 'Laporan ini membahas adopsi teknologi kecerdasan buatan dalam pemrosesan audio berkecepatan tinggi...',
        fullText: 'Selamat datang dalam ringkasan eksekutif Laporan AI dan Otomasi 2026. Adopsi model suara cerdas seperti Gemini 3.8 Flash TTS telah meningkat pesat untuk pembacaan dokumen.',
        voiceName: 'Kore',
        isClonedVoice: false,
        audioData: DEMO_DOC_1_AUDIO,
        mimeType: 'audio/wav',
        wordCount: 52,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        mode: 'single',
        styleUsed: 'Clear, professional news anchor',
        documentSource: 'Dokumen PDF',
        fileName: 'Laporan-Otomasi-AI-2026.pdf',
      },
      {
        id: 'hist_demo_doc_2',
        title: 'Prolog Cerita Lembah Pinus (Suara Kloning)',
        textSnippet: 'Halo! Ini adalah suara hasil kloning AI saya untuk profil Suara Budi...',
        fullText: 'Halo! Ini adalah suara hasil kloning AI saya untuk profil Suara Budi. Suara ini siap digunakan untuk membacakan dokumen dan naskah Anda.',
        voiceName: 'Suara Budi - Santai & Hangat',
        isClonedVoice: true,
        audioData: DEMO_CLONE_AUDIO,
        mimeType: 'audio/wav',
        wordCount: 45,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        mode: 'single',
        styleUsed: 'Warm, calm, deep baritone Indonesian speaker with friendly cadence',
        documentSource: 'Naskah Naratif',
        fileName: 'Naskah-Cerita-Lembah.txt',
      },
    ];
  });

  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<VoiceProfile | null>(null);
  const [activeHistoryItem, setActiveHistoryItem] = useState<GeneratedAudioItem | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CLONES, JSON.stringify(clonedVoices));
    } catch (e) {
      console.error(e);
    }
  }, [clonedVoices]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  const handleSaveClone = (newProfile: VoiceProfile) => {
    setClonedVoices((prev) => [newProfile, ...prev.filter((p) => p.id !== newProfile.id)]);
  };

  const handleDeleteClone = (id: string) => {
    setClonedVoices((prev) => prev.filter((p) => p.id !== id));
    if (selectedVoiceProfile?.id === id) {
      setSelectedVoiceProfile(null);
    }
  };

  const handleSelectForTTS = (profile: VoiceProfile) => {
    setSelectedVoiceProfile(profile);
    setActiveTab('tts');
  };

  const handleAudioGenerated = (item: GeneratedAudioItem) => {
    setHistory((prev) => [item, ...prev]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clonedVoicesCount={clonedVoices.length}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'tts' && (
          <TTSStudio
            clonedVoices={clonedVoices}
            selectedVoiceProfile={selectedVoiceProfile}
            setSelectedVoiceProfile={setSelectedVoiceProfile}
            onAudioGenerated={handleAudioGenerated}
            onNavigateToClone={() => setActiveTab('clone')}
            activeHistoryItem={activeHistoryItem}
          />
        )}

        {activeTab === 'clone' && (
          <VoiceCloneStudio
            clonedVoices={clonedVoices}
            onSaveClone={handleSaveClone}
            onDeleteClone={handleDeleteClone}
            onSelectForTTS={handleSelectForTTS}
          />
        )}

        {activeTab === 'history' && (
          <AudioHistory
            history={history}
            onDeleteItem={handleDeleteHistoryItem}
            onClearAll={handleClearHistory}
            onPlayInStudio={(item) => {
              setActiveHistoryItem(item);
              setActiveTab('tts');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">SuaraAI Studio</span>
            <span>•</span>
            <span>Bertenaga Google Gemini 3.8 Flash TTS &amp; 3.5 Flash</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>Output Audio 24kHz Studio RIFF WAV</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-indigo-400">
              <Dna className="w-3.5 h-3.5" />
              <span>Acoustic Neural Cloning</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
