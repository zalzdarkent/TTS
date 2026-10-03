import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  Play,
  Pause,
  Sparkles,
  Dna,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sliders,
  Volume2,
  ArrowRight,
  ShieldCheck,
  FileAudio,
  BookOpen,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VoiceProfile } from '../types';
import { blobToBase64, formatDuration, base64ToBlobUrl, base64ToDataUrl } from '../utils/audio';
import { VoiceCloneTutorialModal } from './VoiceCloneTutorialModal';

interface VoiceCloneStudioProps {
  clonedVoices: VoiceProfile[];
  onSaveClone: (profile: VoiceProfile) => void;
  onDeleteClone: (id: string) => void;
  onSelectForTTS: (profile: VoiceProfile) => void;
}

const READING_PROMPTS = [
  {
    title: 'Percakapan Santai & Hangat',
    category: 'Kasual',
    text: 'Halo semuanya! Hari ini cuacanya sangat menyenangkan. Saya sedang mencoba fitur kloning suara cerdas berbasis kecerdasan buatan. Rasanya sangat menarik melihat teknologi bisa mereplikasi karakter vokal kita secara alami.',
  },
  {
    title: 'Prolog Narasi Audiobook',
    category: 'Naratif',
    text: 'Di balik bukit berkabut itu, sebuah lentera tua masih menyala di serambi rumah kayu. Angin malam berhembus perlahan, membawa aroma tanah basah dan desiran dedaunan pinus yang menenangkan.',
  },
  {
    title: 'Presentasi Bisnis & Berita',
    category: 'Profesional',
    text: 'Selamat pagi rekan-rekan. Pada kuartal ini, kita melihat pertumbuhan adopsi teknologi otomatisasi yang signifikan. Kolaborasi yang solid dan komunikasi yang efektif adalah kunci keberhasilan tim kita.',
  },
  {
    title: 'Edukasi & Motivasi Inspiratif',
    category: 'Inspiratif',
    text: 'Kunci dari setiap pencapaian besar adalah ketekunan dan keberanian untuk terus melangkah. Ketika kita memadukan rasa ingin tahu dengan teknologi cerdas, batas-batas kemungkinan baru akan terbuka lebar di hadapan kita.',
  },
];

export const VoiceCloneStudio: React.FC<VoiceCloneStudioProps> = ({
  clonedVoices,
  onSaveClone,
  onDeleteClone,
  onSelectForTTS,
}) => {
  // Mode: 'record' | 'upload'
  const [inputMode, setInputMode] = useState<'record' | 'upload'>('record');
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [cloneName, setCloneName] = useState('Suara Pribadi Saya');

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  // Upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Processing & result
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [clonedResult, setClonedResult] = useState<VoiceProfile | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Audio preview players
  const [playingOriginal, setPlayingOriginal] = useState(false);
  const [playingCloned, setPlayingCloned] = useState(false);
  const originalAudioRef = useRef<HTMLAudioElement | null>(null);
  const clonedAudioRef = useRef<HTMLAudioElement | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [recordedUrl, uploadedUrl]);

  // Start recording
  const startRecording = async () => {
    try {
      setAnalysisError(null);
      setClonedResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Determine supported mimeType
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setRecordedUrl(url);

        // Stop all mic tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setAnalysisError('Tidak dapat mengakses mikrofon. Pastikan Anda telah memberikan izin mikrofon di browser.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Handle uploaded audio
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setAnalysisError('Harap pilih file audio yang valid (WAV, MP3, M4A, OGG, WEBM).');
      return;
    }

    setUploadedFile(file);
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
    const url = URL.createObjectURL(file);
    setUploadedUrl(url);
    setClonedResult(null);
    setAnalysisError(null);
  };

  // Analyze and clone voice with Gemini
  const handleAnalyzeAndClone = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      let base64Audio = '';
      let mimeType = '';

      if (inputMode === 'record' && recordedBlob) {
        base64Audio = await blobToBase64(recordedBlob);
        mimeType = recordedBlob.type;
      } else if (inputMode === 'upload' && uploadedFile) {
        base64Audio = await blobToBase64(uploadedFile);
        mimeType = uploadedFile.type;
      } else {
        throw new Error('Silakan rekam atau unggah sampel suara terlebih dahulu.');
      }

      const response = await fetch('/api/voice-clone/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType,
          cloneName: cloneName.trim() || 'Suara Saya',
          referenceText: inputMode === 'record' ? READING_PROMPTS[selectedPromptIndex].text : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Gagal memproses kloning suara.');
      }

      const profile: VoiceProfile = {
        ...data.profile,
        isCloned: true,
        originalAudioUrl: inputMode === 'record' ? recordedUrl! : uploadedUrl!,
      };

      setClonedResult(profile);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      console.error('Clone error:', err);
      setAnalysisError(err.message || 'Terjadi kesalahan saat mengkloning suara.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToCollection = () => {
    if (!clonedResult) return;
    onSaveClone(clonedResult);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/70 via-slate-900 to-indigo-950/60 border border-violet-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold mb-4">
            <Dna className="w-3.5 h-3.5" />
            <span>Kloning Suara AI Terintegrasi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ciptakan TTS Dengan <span className="bg-gradient-to-r from-violet-400 via-pink-300 to-indigo-300 bg-clip-text text-transparent">Suara Anda Sendiri</span>
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Cukup rekam suara Anda membaca paragraf pendek selama 15–30 detik. Sistem bertenaga Gemini akan membedah profil akustik biologis, resonansi, dan kadensi vokal Anda, lalu menghasilkan klon suara AI yang dapat membaca naskah apa pun.
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Privasi Terjaga di Sesi Anda</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Didukung Gemini 3.8 Flash TTS &amp; 3.5 Flash</span>
            </div>
          </div>

          {/* Action to open Tutorial */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsTutorialOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40 text-xs font-semibold shadow-lg shadow-violet-950/40 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-violet-300" />
              <span>Buka Panduan Tutorial Rekam Vokal Optimal</span>
            </button>
            <span className="text-xs text-slate-400">
              💡 Rekomendasi 4 langkah praktis agar akurasi klon mencapai 98%
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recording Console */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-md">
            {/* Step 1 Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-violet-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <div>
                  <h3 className="font-semibold text-slate-100 text-base">
                    Rekam atau Unggah Sampel Suara
                  </h3>
                </div>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTutorialOpen(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-950/40 border border-slate-800 transition-colors"
                  title="Lihat Panduan Tutorial"
                >
                  <BookOpen className="w-4 h-4 text-violet-400" />
                </button>

                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setInputMode('record')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      inputMode === 'record'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mikrofon Langsung
                  </button>
                  <button
                    onClick={() => setInputMode('upload')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      inputMode === 'upload'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Unggah File Audio
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Tips Ribbon */}
            <div className="mt-4 p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-violet-300">
              <span className="flex items-center gap-1.5">
                <span className="text-violet-400">🔇</span> Ruangan tenang tanpa gema
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-violet-400">📏</span> Jarak mic 10-15 cm
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-violet-400">🗣️</span> Bicara santai &amp; jelas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-violet-400">⏱️</span> Durasi 15–30 detik
              </span>
              <button
                onClick={() => setIsTutorialOpen(true)}
                className="text-violet-400 hover:text-violet-200 underline font-semibold cursor-pointer"
              >
                Pelajari Detail →
              </button>
            </div>

            {/* Clone Name Input */}
            <div className="mt-5">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nama Profil Suara Kloning
              </label>
              <input
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="Contoh: Suara Budi - Santai &amp; Hangat"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Mode 1: Live Record */}
            {inputMode === 'record' && (
              <div className="mt-5 space-y-4">
                {/* Reading Prompts Tabs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-300">
                      Pilih Teks Latihan Baca (Direkomendasikan):
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Durasi saran: 10 - 30 detik
                    </span>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {READING_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedPromptIndex(idx)}
                        className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${
                          selectedPromptIndex === idx
                            ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 font-medium'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {prompt.title}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2.5 p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 text-sm text-slate-200 leading-relaxed font-normal italic relative">
                    &ldquo;{READING_PROMPTS[selectedPromptIndex].text}&rdquo;
                  </div>
                </div>

                {/* Recording Console Bar */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 text-center">
                  {isRecording ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3">
                        <span className="relative flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                        </span>
                        <span className="text-lg font-mono font-bold text-rose-400">
                          {formatDuration(recordingSeconds)}
                        </span>
                        <span className="text-xs text-slate-400">Sedang merekam suara Anda...</span>
                      </div>

                      {/* Animated audio bar indicator */}
                      <div className="flex items-center justify-center gap-1 h-8">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 bg-rose-500 rounded-full animate-pulse"
                            style={{
                              height: `${20 + (i % 6) * 12}px`,
                              animationDelay: `${i * 0.05}s`,
                            }}
                          />
                        ))}
                      </div>

                      <button
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>Selesai Merekam</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recordedUrl ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-3 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Sampel suara berhasil direkam ({formatDuration(recordingSeconds)})</span>
                          </div>

                          <div className="flex items-center justify-center gap-3">
                            <audio
                              controls
                              src={recordedUrl}
                              className="h-10 max-w-xs rounded-lg accent-violet-500"
                            />
                            <button
                              onClick={startRecording}
                              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                              title="Rekam Ulang"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-400 mb-3">
                            Klik tombol di bawah dan bacakan naskah di atas dengan intonasi wajar Anda.
                          </p>
                          <button
                            onClick={startRecording}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 transition-transform active:scale-95"
                          >
                            <Mic className="w-5 h-5" />
                            <span>Mulai Rekam Suara</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode 2: File Upload */}
            {inputMode === 'upload' && (
              <div className="mt-5 space-y-4">
                <label className="border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-200">
                    {uploadedFile ? uploadedFile.name : 'Pilih atau Tarik File Audio ke Sini'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Mendukung WAV, MP3, M4A, OGG, WEBM (Maks 15MB)
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {uploadedUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <FileAudio className="w-4 h-4 text-violet-400" />
                      <span>{uploadedFile?.name}</span>
                    </div>
                    <audio controls src={uploadedUrl} className="h-8 max-w-[200px]" />
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {analysisError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {analysisError}
              </div>
            )}

            {/* Step 2 Trigger: Analyze with AI */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Langkah 2: Ekstraksi Akustik &amp; Model Synthesis
              </span>

              <button
                onClick={handleAnalyzeAndClone}
                disabled={isAnalyzing || (inputMode === 'record' ? !recordedBlob : !uploadedFile)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-600/30"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Akustik AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Mulai Kloning Suara</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis Result & Comparison */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-md min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="font-semibold text-slate-100 text-base">
                  Hasil Kloning &amp; Profil Akustik
                </h3>
              </div>

              {isAnalyzing && (
                <div className="py-16 text-center space-y-4">
                  <div className="relative mx-auto w-16 h-16">
                    <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                    <Dna className="w-7 h-7 text-violet-400 absolute inset-0 m-auto" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-200">
                      Gemini 3.5 Flash Sedang Menganalisis Vokal
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Mengekstraksi timbre biologis, resonansi dada, intonasi, dan mensintesis naskah perdana via Gemini 3.8 Flash TTS...
                    </p>
                  </div>
                </div>
              )}

              {!isAnalyzing && !clonedResult && (
                <div className="py-20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-medium text-slate-300">Menunggu Sampel Rekaman</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Rekam suara Anda di panel sebelah kiri lalu klik &quot;Mulai Kloning Suara&quot; untuk melihat perbandingan akustik dan mendengarkan suara tiruan AI.
                  </p>
                </div>
              )}

              {!isAnalyzing && clonedResult && (
                <div className="mt-4 space-y-4">
                  {/* Fidelity Gauge */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border border-violet-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Skor Kemiripan Akustik</span>
                      <h4 className="text-xl font-extrabold text-white flex items-center gap-1.5">
                        <span>{clonedResult.similarityScore}%</span>
                        <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          Akurasi Tinggi
                        </span>
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Base Voice Gemini</span>
                      <p className="text-sm font-bold text-violet-300">{clonedResult.anchorVoice}</p>
                    </div>
                  </div>

                  {/* Audio Comparison Players */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-semibold text-slate-300">
                      Dengar &amp; Bandingkan Suara:
                    </span>

                    {/* Original Audio Card */}
                    {clonedResult.originalAudioUrl && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-medium text-slate-300">Suara Rekaman Asli</span>
                        </div>
                        <audio controls src={clonedResult.originalAudioUrl} className="h-7 max-w-[190px]" />
                      </div>
                    )}

                    {/* Synthesized Cloned Audio Card */}
                    {clonedResult.previewAudio && (
                      <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-400" />
                          <div>
                            <span className="text-xs font-bold text-violet-200">Suara Kloning AI</span>
                            <span className="block text-[10px] text-violet-400">Gemini 3.8 Flash TTS</span>
                          </div>
                        </div>
                        <audio
                          controls
                          preload="auto"
                          src={base64ToDataUrl(clonedResult.previewAudio)}
                          className="h-7 max-w-[190px] accent-violet-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* Vocal Characteristics Tags */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300">Parameter Akustik Terdeteksi:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Register Nada</span>
                        <span className="text-slate-200 font-medium">{clonedResult.pitch}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Warna Vokal (Timbre)</span>
                        <span className="text-slate-200 font-medium">{clonedResult.timbre}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Tempo &amp; Jeda</span>
                        <span className="text-slate-200 font-medium">{clonedResult.pacing}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 text-[10px] block">Aksen &amp; Dialek</span>
                        <span className="text-slate-200 font-medium">{clonedResult.accent}</span>
                      </div>
                    </div>

                    {clonedResult.summary && (
                      <p className="text-xs text-slate-400 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                        &quot;{clonedResult.summary}&quot;
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {clonedResult && (
              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={handleSaveToCollection}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Simpan ke Galeri Profil</span>
                </button>
                <button
                  onClick={() => onSelectForTTS(clonedResult)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/30 transition-transform active:scale-95"
                >
                  <span>Gunakan di Studio TTS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cloned Voices Library Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-violet-400" />
            <h3 className="font-bold text-slate-100 text-lg">
              Koleksi Suara Kloning Saya
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {clonedVoices.length} Profil Tersimpan
            </span>
          </div>
        </div>

        {clonedVoices.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center">
            <p className="text-sm text-slate-400">
              Belum ada profil kloning suara yang disimpan. Rekam sampel suara Anda di atas untuk mulai membuat kloning pertama!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clonedVoices.map((voice) => (
              <div
                key={voice.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 hover:border-violet-500/40 transition-all shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{voice.name}</h4>
                      <span className="text-[11px] text-slate-400">
                        Akurasi Akustik: {voice.similarityScore}% • Base: {voice.anchorVoice}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      Kloning AI
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {voice.summary || 'Profil suara kustom terintegrasi dengan gaya dan intonasi khas Anda.'}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {voice.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {voice.previewAudio && (
                    <div className="mb-4">
                      <audio
                        controls
                        preload="auto"
                        src={base64ToDataUrl(voice.previewAudio)}
                        className="w-full h-8 accent-violet-400"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => onDeleteClone(voice.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Hapus Profil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectForTTS(voice)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-transform active:scale-95"
                  >
                    <span>Gunakan untuk TTS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tutorial Modal */}
      <VoiceCloneTutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onStartRecording={() => {
          setIsTutorialOpen(false);
          setInputMode('record');
          startRecording();
        }}
      />
    </div>
  );
};
