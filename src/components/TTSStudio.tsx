import React, { useState } from 'react';
import {
  FileUp,
  Sparkles,
  Play,
  RotateCcw,
  Users,
  Mic,
  Volume2,
  Clock,
  Type,
  Wand2,
  BookOpen,
  MessageSquare,
  CheckCircle,
  Dna,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { VoiceProfile, GeneratedAudioItem, SpeakerConfig } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { DocumentModal } from './DocumentModal';
import { DEMO_DOC_1_AUDIO } from '../data/demoAudio';

interface TTSStudioProps {
  clonedVoices: VoiceProfile[];
  selectedVoiceProfile: VoiceProfile | null;
  setSelectedVoiceProfile: (voice: VoiceProfile | null) => void;
  onAudioGenerated: (item: GeneratedAudioItem) => void;
  onNavigateToClone: () => void;
  activeHistoryItem?: GeneratedAudioItem | null;
}

const STANDARD_VOICE_LIST: {
  id: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  name: string;
  gender: 'Pria' | 'Wanita';
  description: string;
  tags: string[];
}[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Wanita',
    description: 'Hangat, artikulasi jernih, ramah, dan sangat natural untuk bahasa Indonesia.',
    tags: ['Hangat', 'Jernih', 'Populer'],
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Pria',
    description: 'Cerah, bersahabat, energik, dan ekspresif untuk podcast atau konten kreatif.',
    tags: ['Energik', 'Ekspresif', 'Podcast'],
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Pria',
    description: 'Tenang, dewasa, berwibawa, dan santai untuk narasi mendalam.',
    tags: ['Tenang', 'Baritone', 'Naratif'],
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Pria',
    description: 'Nada rendah, tegas, percaya diri, cocok untuk pengumuman atau trailer.',
    tags: ['Tegas', 'Deep Voice', 'Wibawa'],
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Wanita',
    description: 'Lembut, menenangkan, penuh empati, sangat pas untuk relaksasi atau meditasi.',
    tags: ['Lembut', 'Teduh', 'Meditatif'],
  },
];

const STYLE_PRESETS = [
  {
    label: 'Hangat & Ramah',
    value: 'Warm, friendly, relaxed and conversational tone with natural Indonesian cadence',
  },
  {
    label: 'Penyiar Berita Formal',
    value: 'Authoritative, clear, and professional news broadcast anchor style',
  },
  {
    label: 'Podcast Santai',
    value: 'Engaging, thoughtful and natural podcast host with conversational flow',
  },
  {
    label: 'Audiobook Naratif',
    value: 'Immersive, captivating, emotional and soft pacing for storytelling audiobook',
  },
  {
    label: 'Semangat & Inspiratif',
    value: 'Upbeat, inspiring, confident, and energetic motivational speaker',
  },
];

const SAMPLE_SCRIPTS = [
  {
    title: 'Berita AI Terkini',
    mode: 'single',
    text: 'Selamat pagi pendengar setia SuaraAI. Perkembangan teknologi sintesis suara kini telah mencapai babak baru. Dengan Gemini 3.8 Flash TTS, pemrosesan audio berkecepatan tinggi kini mampu menghasilkan karakter suara dengan fidelitas tinggi hingga 24 kilohertz. Mari kita nantikan berbagai inovasi mendatang.',
  },
  {
    title: 'Kisah Alam Nusantara',
    mode: 'single',
    text: 'Mentari pagi perlahan menyapa rimbunnya hutan tropis di lereng gunung. <breath> Kabut tipis yang menyelimuti dedaunan basah perlahan menguap, meninggalkan kilauan embun di setiap kelopak bunga liar. Keheningan alam adalah simfoni terindah.',
  },
  {
    title: 'Podcast Diskusi 2 Orang',
    mode: 'dialogue',
    text: `Alex: Selamat datang kembali di TechTalk! <breath> Hari ini kita kedatangan Sam untuk membahas model suara cerdas.
Sam: Terima kasih Alex! |yeah| Menyenangkan sekali bisa hadir di sini. Perkembangan sintesis suara minggu ini benar-benar luar biasa.
Alex: Betul sekali. <laugh> Banyak yang terkejut karena kualitasnya sangat mirip percakapan manusia sungguhan!
Sam: Tepat, apalagi dengan dukungan ekspresi vokal seperti jeda napas dan penegasan natural, hasilnya jadi sangat hidup.`,
  },
];

export const TTSStudio: React.FC<TTSStudioProps> = ({
  clonedVoices,
  selectedVoiceProfile,
  setSelectedVoiceProfile,
  onAudioGenerated,
  onNavigateToClone,
  activeHistoryItem,
}) => {
  const [text, setText] = useState<string>(SAMPLE_SCRIPTS[0].text);
  const [mode, setMode] = useState<'single' | 'dialogue'>('single');
  const [selectedStandardVoice, setSelectedStandardVoice] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'>('Kore');
  const [useClonedVoice, setUseClonedVoice] = useState<boolean>(false);
  const [activeClonedVoiceId, setActiveClonedVoiceId] = useState<string>('');
  const [currentDocumentName, setCurrentDocumentName] = useState<string | null>(null);

  // Style customization
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLE_PRESETS[0].value);
  const [customStyle, setCustomStyle] = useState<string>('');
  const [isCustomStyleOpen, setIsCustomStyleOpen] = useState<boolean>(false);

  // Dual-speaker config
  const [speakers, setSpeakers] = useState<SpeakerConfig[]>([
    { speaker: 'Alex', voice: 'Puck', style: 'Enthusiastic podcast host' },
    { speaker: 'Sam', voice: 'Kore', style: 'Articulate, friendly co-host' },
  ]);

  // Audio generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestAudio, setLatestAudio] = useState<{
    audioData: string;
    title: string;
    voiceName: string;
    isCloned: boolean;
  } | null>({
    audioData: DEMO_DOC_1_AUDIO,
    title: 'Berita AI Terkini (Audio Sampel Siap Putar)',
    voiceName: 'Kore',
    isCloned: false,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Document modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isEnhancingText, setIsEnhancingText] = useState(false);

  // Sync selectedVoiceProfile if passed from parent
  React.useEffect(() => {
    if (selectedVoiceProfile) {
      setUseClonedVoice(true);
      setActiveClonedVoiceId(selectedVoiceProfile.id);
    }
  }, [selectedVoiceProfile]);

  // Load history item if requested from History Gallery
  React.useEffect(() => {
    if (activeHistoryItem) {
      setText(activeHistoryItem.fullText);
      setMode(activeHistoryItem.mode);
      if (activeHistoryItem.fileName) {
        setCurrentDocumentName(activeHistoryItem.fileName);
      }
      setLatestAudio({
        audioData: activeHistoryItem.audioData,
        title: activeHistoryItem.title,
        voiceName: activeHistoryItem.voiceName,
        isCloned: activeHistoryItem.isClonedVoice,
      });
    }
  }, [activeHistoryItem]);

  const activeClonedVoice = clonedVoices.find((v) => v.id === activeClonedVoiceId) || clonedVoices[0] || null;

  // Text statistics
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const estMinutes = Math.max(0.1, Math.round((wordCount / 140) * 10) / 10);

  // Generate TTS Audio
  const handleGenerateTTS = async () => {
    if (!text || text.trim().length === 0) {
      setErrorMsg('Silakan masukkan teks naskah terlebih dahulu.');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg(null);

      let effectiveVoice = selectedStandardVoice;
      let effectiveStyle = isCustomStyleOpen && customStyle.trim() ? customStyle.trim() : selectedStyle;
      let effectiveVoiceName: string = selectedStandardVoice;
      let isCloned = false;

      if (mode === 'single' && useClonedVoice && activeClonedVoice) {
        effectiveVoice = activeClonedVoice.anchorVoice;
        effectiveStyle = activeClonedVoice.systemStylePrompt || effectiveStyle;
        effectiveVoiceName = activeClonedVoice.name;
        isCloned = true;
      }

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: effectiveVoice,
          style: effectiveStyle,
          mode,
          speakerConfigs: mode === 'dialogue' ? speakers : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Gagal menyintesis audio TTS.');
      }

      const title = text.slice(0, 36).trim() + (text.length > 36 ? '...' : '');

      const generatedItem: GeneratedAudioItem = {
        id: `audio_${Date.now()}`,
        title,
        textSnippet: text.slice(0, 120),
        fullText: text,
        voiceName: mode === 'dialogue' ? `${speakers[0].speaker} & ${speakers[1].speaker}` : effectiveVoiceName,
        isClonedVoice: isCloned,
        audioData: data.audioData,
        mimeType: data.mimeType || 'audio/wav',
        wordCount,
        createdAt: new Date().toISOString(),
        mode,
        styleUsed: effectiveStyle,
        fileName: currentDocumentName || undefined,
        documentSource: currentDocumentName ? 'Dokumen Terunggah' : 'Naskah Teks Studio',
      };

      setLatestAudio({
        audioData: data.audioData,
        title,
        voiceName: generatedItem.voiceName,
        isCloned,
      });

      onAudioGenerated(generatedItem);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses audio TTS.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Enhance text with Gemini Flash Lite
  const handleEnhanceText = async (goal: string) => {
    if (!text.trim()) return;
    try {
      setIsEnhancingText(true);
      setErrorMsg(null);
      const res = await fetch('/api/text/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, goal }),
      });
      const data = await res.json();
      if (data.enhancedText) {
        setText(data.enhancedText);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal menyempurnakan teks.');
    } finally {
      setIsEnhancingText(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Mode Sintesis:</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMode('single')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === 'single'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Single Speaker
            </button>
            <button
              onClick={() => {
                setMode('dialogue');
                if (!text.includes('Alex:') && !text.includes('Sam:')) {
                  setText(SAMPLE_SCRIPTS[2].text);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === 'dialogue'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Dialog 2 Pembicara</span>
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 hidden md:inline">Contoh Naskah:</span>
          {SAMPLE_SCRIPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setText(item.text);
                if (item.mode === 'dialogue') setMode('dialogue');
                else setMode('single');
              }}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left (Editor) & Right (Voice & Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Text & Document Editor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md flex flex-col justify-between min-h-[460px]">
            <div>
              {/* Editor Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">
                    {mode === 'dialogue' ? 'Naskah Percakapan Dialog (Alex &amp; Sam)' : 'Naskah Teks TTS'}
                  </span>
                </div>

                {/* Document Upload Button */}
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Unggah PDF / Dokumen</span>
                </button>
              </div>

              {/* Active Document Badge */}
              {currentDocumentName && (
                <div className="mb-3 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-semibold truncate">Dokumen Terpasang: {currentDocumentName}</span>
                  </div>
                  <button
                    onClick={() => setCurrentDocumentName(null)}
                    className="text-cyan-400 hover:text-cyan-200 text-[11px] underline ml-2 shrink-0 cursor-pointer"
                  >
                    Hapus Tautan
                  </button>
                </div>
              )}

              {/* Textarea */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  mode === 'dialogue'
                    ? "Tulis naskah dialog dengan format:\nAlex: Halo semuanya, selamat datang!\nSam: Hai Alex, senang sekali bisa bergabung hari ini."
                    : "Ketik atau tempel teks dokumen di sini. Gemini 3.8 Flash TTS akan mengonversinya menjadi audio berkualitas tinggi..."
                }
                rows={11}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed font-sans resize-y"
              />

              {/* AI Quick Polish Toolbar */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Wand2 className="w-3 h-3 text-cyan-400" />
                  <span>Sempurnakan Naskah (Gemini 3.1 Flash Lite):</span>
                </span>

                <button
                  onClick={() => handleEnhanceText('add_expression')}
                  disabled={isEnhancingText}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors disabled:opacity-50"
                  title="Sisipkan jeda napas <breath>, tawa <laugh>, dan reaksi |yeah|"
                >
                  ✨ Tambah Ekspresi Suara
                </button>
                <button
                  onClick={() => handleEnhanceText('formal_anchor')}
                  disabled={isEnhancingText}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors disabled:opacity-50"
                >
                  🎙️ Pembaca Berita
                </button>
                <button
                  onClick={() => handleEnhanceText('storyteller')}
                  disabled={isEnhancingText}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors disabled:opacity-50"
                >
                  📖 Pendongeng
                </button>
                <button
                  onClick={() => setText('')}
                  className="text-[11px] px-2 py-1 text-slate-500 hover:text-rose-400 ml-auto"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Editor Footer / Stats */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono mt-3">
              <div className="flex items-center gap-3">
                <span>{charCount} karakter</span>
                <span>•</span>
                <span>{wordCount} kata</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Estimasi ~{estMinutes} menit audio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Voice Selection, Tone & Synthesize CTA */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md space-y-5">
            {/* Voice Source Selector (Single Mode) */}
            {mode === 'single' && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <span>Pilihan Karakter Suara:</span>
                  </label>

                  {/* Switch between Cloned vs Standard */}
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setUseClonedVoice(false)}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        !useClonedVoice
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Suara Studio
                    </button>
                    <button
                      onClick={() => {
                        if (clonedVoices.length === 0) {
                          onNavigateToClone();
                        } else {
                          setUseClonedVoice(true);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                        useClonedVoice
                          ? 'bg-violet-600 text-white font-medium'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Dna className="w-3 h-3" />
                      <span>Suara Kloning AI ({clonedVoices.length})</span>
                    </button>
                  </div>
                </div>

                {/* Option A: Use Cloned Voice */}
                {useClonedVoice ? (
                  <div className="space-y-2">
                    {clonedVoices.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-violet-800/60 bg-violet-950/20 text-center space-y-2">
                        <p className="text-xs text-violet-300">
                          Anda belum memiliki profil kloning suara.
                        </p>
                        <button
                          onClick={onNavigateToClone}
                          className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                        >
                          Rekam Suara Saya Sekarang
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {clonedVoices.map((voice) => (
                          <div
                            key={voice.id}
                            onClick={() => setActiveClonedVoiceId(voice.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              activeClonedVoiceId === voice.id || (!activeClonedVoiceId && clonedVoices[0]?.id === voice.id)
                                ? 'bg-violet-950/50 border-violet-500 text-white shadow-md'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold text-xs">
                                🧬
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-100">{voice.name}</h5>
                                <span className="text-[10px] text-slate-400">
                                  Akurasi: {voice.similarityScore}% • Base: {voice.anchorVoice}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-violet-400 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                              Aktif
                            </span>
                          </div>
                        ))}

                        <button
                          onClick={onNavigateToClone}
                          className="w-full py-1.5 text-center text-xs text-violet-400 hover:text-violet-300 hover:underline"
                        >
                          + Tambah / Kalibrasi Kloning Suara Baru
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Option B: Standard Studio Voices */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STANDARD_VOICE_LIST.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => setSelectedStandardVoice(v.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          selectedStandardVoice === v.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{v.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {v.gender}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                          {v.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dialogue Mode Speaker Configuration */}
            {mode === 'dialogue' && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-200 block">
                  Konfigurasi 2 Pembicara Dialog Podcast:
                </span>

                {/* Speaker 1 (Alex) */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">Pembicara 1: Alex</span>
                    <select
                      value={speakers[0].voice}
                      onChange={(e) => {
                        const newVoice = e.target.value as any;
                        setSpeakers([
                          { ...speakers[0], voice: newVoice },
                          speakers[1],
                        ]);
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      {STANDARD_VOICE_LIST.map((v) => (
                        <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={speakers[0].style}
                    onChange={(e) => {
                      setSpeakers([
                        { ...speakers[0], style: e.target.value },
                        speakers[1],
                      ]);
                    }}
                    placeholder="Gaya vokal Alex (misal: Host antusias)"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
                  />
                </div>

                {/* Speaker 2 (Sam) */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">Pembicara 2: Sam</span>
                    <select
                      value={speakers[1].voice}
                      onChange={(e) => {
                        const newVoice = e.target.value as any;
                        setSpeakers([
                          speakers[0],
                          { ...speakers[1], voice: newVoice },
                        ]);
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      {STANDARD_VOICE_LIST.map((v) => (
                        <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={speakers[1].style}
                    onChange={(e) => {
                      setSpeakers([
                        speakers[0],
                        { ...speakers[1], style: e.target.value },
                      ]);
                    }}
                    placeholder="Gaya vokal Sam (misal: Narasumber ramah)"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* Vocal Tone & Emotion Presets */}
            {mode === 'single' && !useClonedVoice && (
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-2">
                  Emosi &amp; Gaya Penyampaian:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STYLE_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedStyle(p.value);
                        setIsCustomStyleOpen(false);
                      }}
                      className={`text-[11px] p-2 rounded-lg text-left transition-all border ${
                        selectedStyle === p.value && !isCustomStyleOpen
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 font-medium'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="mt-2">
                  <button
                    onClick={() => setIsCustomStyleOpen(!isCustomStyleOpen)}
                    className="text-[11px] text-slate-400 hover:text-indigo-400 underline"
                  >
                    {isCustomStyleOpen ? '- Gunakan Preset Gaya' : '+ Kustomisasi Prompt Gaya Vokal'}
                  </button>
                  {isCustomStyleOpen && (
                    <input
                      type="text"
                      value={customStyle}
                      onChange={(e) => setCustomStyle(e.target.value)}
                      placeholder="Contoh: Sangat ramah, santai dengan jeda napas teratur..."
                      className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Big Action CTA Button */}
            <button
              onClick={handleGenerateTTS}
              disabled={isGenerating || !text.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Menyintesis Suara 24kHz...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Sintesis Audio Suara AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Audio Player Section */}
      {latestAudio && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Hasil Sintesis Terkini</h3>
          </div>

          <AudioPlayer
            audioData={latestAudio.audioData}
            title={latestAudio.title}
            voiceName={latestAudio.voiceName}
            isClonedVoice={latestAudio.isCloned}
            autoPlay={true}
          />
        </div>
      )}

      {/* Document Ingestion Modal */}
      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onApplyScript={(newText, isDialogue, fileName) => {
          setText(newText);
          if (isDialogue) setMode('dialogue');
          setCurrentDocumentName(fileName || null);
        }}
      />
    </div>
  );
};
