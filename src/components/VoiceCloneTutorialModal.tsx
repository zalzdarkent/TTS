import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Mic,
  Volume2,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Headphones,
  Check
} from 'lucide-react';

interface VoiceCloneTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartRecording: () => void;
}

const TUTORIAL_STEPS = [
  {
    stepNumber: 1,
    title: 'Pilih Ruangan yang Tenang & Bebas Gema',
    badge: 'Akustik Ruangan',
    description:
      'Kualitas kloning suara AI Gemini berakar dari kebersihan audio sampel awal Anda. Ruangan tanpa gema menghasilkan kloning vokal paling akurat.',
    tips: [
      {
        type: 'do',
        text: 'Gunakan ruangan dengan banyak peredam alami seperti kamar tidur (adanya gorden tebal, kasur, karpet, atau bantal).',
      },
      {
        type: 'do',
        text: 'Tutup jendela dan pintu rapat-rapat untuk memblokir kebisingan kendaraan atau aktivitas luar.',
      },
      {
        type: 'dont',
        text: 'Jangan merekam di ruangan berlantai ubin kosong, berdinding keramik, atau kamar mandi yang memantulkan suara (echo).',
      },
      {
        type: 'dont',
        text: 'Matikan sementara kipas angin atau AC bising yang meniup langsung ke arah meja/mikrofon Anda.',
      },
    ],
  },
  {
    stepNumber: 2,
    title: 'Posisi & Jarak Mikrofon yang Ideal',
    badge: 'Kalibrasi Perangkat',
    description:
      'Posisi mikrofon menentukan ketebalan frekuensi dasar vokal Anda dan mencegah distorsi audio atau suara desah napas.',
    tips: [
      {
        type: 'do',
        text: 'Jaga jarak bibir dengan mikrofon sekitar 10–15 cm (kira-kira satu jengkal tangan terbuka).',
      },
      {
        type: 'do',
        text: 'Arahkan mikrofon sedikit ke samping sudut bibir (45 derajat) agar hembusan napas konsonan "P" dan "B" tidak menghantam kapsul mic secara langsung.',
      },
      {
        type: 'dont',
        text: 'Hindari berbicara terlalu jauh (>30 cm) karena audio akan terdengar tipis, hampa, dan tenggelam oleh desis ruangan.',
      },
      {
        type: 'dont',
        text: 'Jangan menempelkan mikrofon terlalu dekat ke bibir karena memicu distorsi frekuensi rendah (proximity boom) dan suara desah nafas.',
      },
    ],
  },
  {
    stepNumber: 3,
    title: 'Intonasi, Tempo, & Ritme Bicara Alami',
    badge: 'Penghayatan Vokal',
    description:
      'AI Gemini akan mempelajari karakter, ekspresi, dan kehangatan suara Anda. Bicaralah seperti sedang mengobrol santai.',
    tips: [
      {
        type: 'do',
        text: 'Gunakan nada bicara yang rileks dan bersahabat, seperti sedang bercerita kepada seorang sahabat karib.',
      },
      {
        type: 'do',
        text: 'Berikan jeda napas yang wajar di setiap tanda koma dan titik. Biarkan alur kalimat mengalir alami tanpa dipaksakan.',
      },
      {
        type: 'do',
        text: 'Jaga volume suara agar stabil dan konsisten dari awal hingga akhir rekaman.',
      },
      {
        type: 'dont',
        text: 'Hindari membaca dengan nada kaku, monoton, atau terburu-buru seperti sedang membaca teks ujian.',
      },
    ],
  },
  {
    stepNumber: 4,
    title: 'Durasi Rekaman & Variasi Fonetik',
    badge: 'Kecukupan Data AI',
    description:
      'AI membutuhkan spektrum vokal lengkap (A, I, U, E, O) dan konsonan artikulatif untuk membentuk model sintesis vokal 24kHz yang presisi.',
    tips: [
      {
        type: 'do',
        text: 'Rekam dengan durasi optimal antara 15 hingga 30 detik (jangan kurang dari 10 detik).',
      },
      {
        type: 'do',
        text: 'Gunakan naskah latihan baca yang kami sediakan di studio karena telah dirancang mencakup variasi fonetik bahasa Indonesia terlengkap.',
      },
      {
        type: 'do',
        text: 'Jika Anda tersedak atau salah mengucap kata, tekan tombol "Rekam Ulang" untuk hasil yang sempurna.',
      },
      {
        type: 'dont',
        text: 'Jangan merekam sampel yang terlalu pendek (di bawah 8 detik), karena AI tidak memiliki cukup data frekuensi untuk memetakan formants suara Anda.',
      },
    ],
  },
];

export const VoiceCloneTutorialModal: React.FC<VoiceCloneTutorialModalProps> = ({
  isOpen,
  onClose,
  onStartRecording,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [checklist, setChecklist] = useState({
    quietRoom: false,
    micDistance: false,
    naturalTone: false,
    duration15s: false,
  });

  if (!isOpen) return null;

  const currentTutorial = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const allChecked = Object.values(checklist).every(Boolean);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-violet-800/40 shadow-2xl p-6 sm:p-8 overflow-hidden my-8">
        {/* Decorative blur */}
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                Panduan Kloning Suara Optimal
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Langkah {currentStep + 1} dari {TUTORIAL_STEPS.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pelajari trik perekaman profesional agar suara AI tiruan Anda memiliki kemiripan hingga 98%.
            </p>
          </div>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-2 mb-6">
          {TUTORIAL_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all ${
                currentStep === idx
                  ? 'w-10 bg-violet-500'
                  : idx < currentStep
                  ? 'w-4 bg-violet-400/50'
                  : 'w-4 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Card Content */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30">
              {currentTutorial.badge}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Langkah {currentTutorial.stepNumber}
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-100">
            {currentTutorial.title}
          </h4>

          <p className="text-xs text-slate-300 leading-relaxed">
            {currentTutorial.description}
          </p>

          {/* Do's and Don'ts */}
          <div className="grid grid-cols-1 gap-2.5 pt-2">
            {currentTutorial.tips.map((tip, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  tip.type === 'do'
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                }`}
              >
                {tip.type === 'do' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Readiness Checklist on the Last Step */}
        {isLastStep && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-6 space-y-2.5">
            <h5 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span>Checklist Kesiapan Sebelum Rekam:</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                onClick={() => toggleCheck('quietRoom')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    checklist.quietRoom ? 'bg-violet-600 border-violet-500 text-white' : 'border-slate-600'
                  }`}
                >
                  {checklist.quietRoom && <Check className="w-3 h-3" />}
                </div>
                <span className="text-slate-300">Ruangan tenang &amp; bebas gema</span>
              </label>

              <label
                onClick={() => toggleCheck('micDistance')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    checklist.micDistance ? 'bg-violet-600 border-violet-500 text-white' : 'border-slate-600'
                  }`}
                >
                  {checklist.micDistance && <Check className="w-3 h-3" />}
                </div>
                <span className="text-slate-300">Jarak mic 10-15 cm</span>
              </label>

              <label
                onClick={() => toggleCheck('naturalTone')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    checklist.naturalTone ? 'bg-violet-600 border-violet-500 text-white' : 'border-slate-600'
                  }`}
                >
                  {checklist.naturalTone && <Check className="w-3 h-3" />}
                </div>
                <span className="text-slate-300">Intonasi santai &amp; percaya diri</span>
              </label>

              <label
                onClick={() => toggleCheck('duration15s')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    checklist.duration15s ? 'bg-violet-600 border-violet-500 text-white' : 'border-slate-600'
                  }`}
                >
                  {checklist.duration15s && <Check className="w-3 h-3" />}
                </div>
                <span className="text-slate-300">Siap rekam 15-30 detik</span>
              </label>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          <div className="flex items-center gap-2">
            {!isLastStep ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(TUTORIAL_STEPS.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-transform active:scale-95"
              >
                <span>Lanjut</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onStartRecording();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-transform active:scale-95"
              >
                <Mic className="w-4 h-4" />
                <span>Mulai Rekam Suara Sekarang</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
