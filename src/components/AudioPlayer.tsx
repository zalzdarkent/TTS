import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Check,
  FastForward,
  Rewind,
  Sparkles,
  AlertCircle,
  Headphones
} from 'lucide-react';
import { formatDuration, downloadBase64Audio, base64ToDataUrl } from '../utils/audio';

interface AudioPlayerProps {
  audioData: string | null;
  mimeType?: string;
  title?: string;
  voiceName?: string;
  isClonedVoice?: boolean;
  onDownload?: () => void;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioData,
  mimeType = 'audio/wav',
  title = 'Hasil Sintesis Suara AI',
  voiceName = 'Kore',
  isClonedVoice = false,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Web Audio fallback refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const webAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isWebAudioPlayingRef = useRef<boolean>(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [copied, setCopied] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Derive stable data URL without blob lifecycle or revocation issues
  const audioSrc = useMemo(() => {
    if (!audioData) return '';
    return base64ToDataUrl(audioData, mimeType);
  }, [audioData, mimeType]);

  // Handle source changes and autoPlay
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackError(null);

    // Stop any ongoing Web Audio source
    if (webAudioSourceRef.current) {
      try {
        webAudioSourceRef.current.stop();
      } catch (_) {}
      webAudioSourceRef.current = null;
      isWebAudioPlayingRef.current = false;
    }

    const audio = audioRef.current;
    if (audio && audioSrc) {
      audio.pause();
      audio.currentTime = 0;
      audio.load();

      if (autoPlay) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Autoplay policy prevented playback, user can click play
              setIsPlaying(false);
            });
        }
      }
    }
  }, [audioSrc, autoPlay]);

  // Audio listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.warn('Audio tag load error, will use Web Audio fallback if played.');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioSrc]);

  // Waveform visualization canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 64;
    const phases = Array.from({ length: bars }, (_, i) => Math.sin(i * 0.2));

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / bars - 2;
      const progress = duration > 0 ? currentTime / duration : 0;
      const activeBarIndex = Math.floor(progress * bars);

      for (let i = 0; i < bars; i++) {
        const x = i * (barWidth + 2);
        let barHeight = 0;
        if (isPlaying) {
          const t = Date.now() * 0.005;
          const dynamicFactor = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.18 + t + phases[i]));
          barHeight = Math.max(6, dynamicFactor * (height * 0.85));
        } else {
          const pseudoFreq = Math.abs(Math.sin(i * 0.15)) * 0.6 + Math.abs(Math.cos(i * 0.35)) * 0.4;
          barHeight = Math.max(4, pseudoFreq * (height * 0.7));
        }

        const y = (height - barHeight) / 2;
        const isPassed = i <= activeBarIndex;

        if (isPassed) {
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, '#818cf8'); // Indigo
          grad.addColorStop(1, '#06b6d4'); // Cyan
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = '#334155'; // Slate 700
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, duration]);

  // Web Audio Fallback Player
  const playViaWebAudio = async () => {
    try {
      if (!audioData) return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) throw new Error('Web Audio API tidak didukung pada browser ini.');

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const cleanBase64 = audioData.includes(',') ? audioData.split(',')[1] : audioData;
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));

      if (webAudioSourceRef.current) {
        try { webAudioSourceRef.current.stop(); } catch (_) {}
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackRate;

      const gainNode = ctx.createGain();
      gainNode.gain.value = isMuted ? 0 : volume;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        isWebAudioPlayingRef.current = false;
      };

      source.start(0);
      webAudioSourceRef.current = source;
      isWebAudioPlayingRef.current = true;
      setIsPlaying(true);
      setDuration(audioBuffer.duration);
      setPlaybackError(null);
    } catch (err: any) {
      console.error('Web Audio Fallback Error:', err);
      setPlaybackError('Tidak dapat memutar audio di browser ini. Silakan unduh file WAV untuk memutarnya.');
    }
  };

  // Primary toggle play
  const togglePlay = async () => {
    setPlaybackError(null);

    // If Web Audio is active, stop it
    if (isWebAudioPlayingRef.current && webAudioSourceRef.current) {
      try {
        webAudioSourceRef.current.stop();
      } catch (_) {}
      webAudioSourceRef.current = null;
      isWebAudioPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      playViaWebAudio();
      return;
    }

    audio.volume = volume;
    audio.muted = isMuted;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err: any) {
        console.warn('HTML5 Audio.play() failed, trying Web Audio API:', err);
        playViaWebAudio();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current && duration > 0) {
      const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleRateChange = () => {
    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const handleDownload = () => {
    if (!audioData) return;
    const cleanFilename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)}-${Date.now()}.wav`;
    downloadBase64Audio(audioData, cleanFilename, mimeType);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!audioData) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3">
          <Play className="w-6 h-6 ml-0.5" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300 mb-1">Studio Pemutar Audio</h4>
        <p className="text-xs text-slate-500 max-w-sm">
          Tulis naskah teks atau unggah dokumen di atas, lalu klik tombol &quot;Sintesis Audio Suara AI&quot; untuk menghasilkan audio.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 sm:p-6 shadow-2xl shadow-indigo-950/20 backdrop-blur-md">
      {/* Invisible HTML5 Audio with Data URL */}
      <audio
        ref={audioRef}
        src={audioSrc || undefined}
        preload="auto"
        playsInline
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>{title}</span>
              {isClonedVoice ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  🧬 Kloning AI
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Suara: {voiceName}
                </span>
              )}
            </h4>
            <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span>Format: 24kHz Studio WAV (Gemini 3.8 Flash TTS)</span>
              {isPlaying && <span className="text-emerald-400 font-bold animate-pulse">• Sedang Diputar</span>}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
            title="Download Audio WAV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh WAV</span>
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
            title="Bagikan Tautan"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {playbackError && (
        <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{playbackError}</span>
          </div>
          <button
            onClick={handleDownload}
            className="underline font-bold text-amber-200 hover:text-white ml-2"
          >
            Unduh Berkas Audio
          </button>
        </div>
      )}

      {/* Waveform Canvas */}
      <div className="relative mb-3 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={640}
          height={68}
          className="w-full h-16 block cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            if (duration > 0) {
              const targetTime = pct * duration;
              if (audioRef.current) {
                audioRef.current.currentTime = targetTime;
              }
              setCurrentTime(targetTime);
            }
          }}
        />

        {/* Scrubber slider overlay */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-x-3 bottom-0 opacity-0 cursor-pointer h-full"
        />
      </div>

      {/* Time and Duration Indicators */}
      <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-4 px-1">
        <span>{formatDuration(currentTime)}</span>
        <span className="text-slate-500">/</span>
        <span>{formatDuration(duration)}</span>
      </div>

      {/* Playback Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          {/* Rewind 5s */}
          <button
            onClick={() => handleSkip(-5)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Mundur 5 detik"
          >
            <Rewind className="w-4 h-4" />
          </button>

          {/* Main Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'Jeda Audio' : 'Putar Audio'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Forward 5s */}
          <button
            onClick={() => handleSkip(5)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Maju 5 detik"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Reset to Start */}
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
              }
              setCurrentTime(0);
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Mulai Ulang"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed and Volume Controls */}
        <div className="flex items-center gap-3">
          {/* Playback Speed Pill */}
          <button
            onClick={handleRateChange}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Kecepatan Pemutaran"
          >
            {playbackRate}x
          </button>

          {/* Volume Group */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 accent-indigo-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
