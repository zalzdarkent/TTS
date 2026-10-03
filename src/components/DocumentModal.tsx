import React, { useState } from 'react';
import {
  X,
  FileText,
  Upload,
  Sparkles,
  Radio,
  Users,
  Languages,
  Check,
  RefreshCw,
  Clock,
  BookOpen
} from 'lucide-react';
import { blobToBase64 } from '../utils/audio';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScript: (text: string, isDialogue?: boolean, fileName?: string) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  onApplyScript,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>('clean_for_speech');
  const [targetLanguage, setTargetLanguage] = useState<string>('id');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedResult, setProcessedResult] = useState<{
    text: string;
    wordCount: number;
    estSpeakingMinutes: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMessage(null);
    setProcessedResult(null);

    // Read quick preview for text files or file name
    if (selected.type.includes('text') || selected.name.endsWith('.txt') || selected.name.endsWith('.md')) {
      const text = await selected.text();
      setFilePreview(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
    } else {
      setFilePreview(`File: ${selected.name} (${(selected.size / 1024).toFixed(1)} KB)`);
    }
  };

  const handleProcessDocument = async () => {
    if (!file) {
      setErrorMessage('Silakan pilih file dokumen terlebih dahulu.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      let fileDataBase64 = '';
      let mimeType = file.type;

      // Ensure proper MIME for common extensions
      if (!mimeType) {
        if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (file.name.endsWith('.txt')) mimeType = 'text/plain';
        else if (file.name.endsWith('.md')) mimeType = 'text/markdown';
        else if (file.name.endsWith('.png')) mimeType = 'image/png';
        else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) mimeType = 'image/jpeg';
      }

      // If text file, we can also send raw text
      let rawText = '';
      if (mimeType.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        rawText = await file.text();
      } else {
        fileDataBase64 = await blobToBase64(file);
      }

      const response = await fetch('/api/document/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: fileDataBase64 || undefined,
          mimeType,
          rawText: rawText || undefined,
          action: selectedAction,
          targetLanguage,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Gagal memproses dokumen.');
      }

      setProcessedResult({
        text: data.processedText,
        wordCount: data.stats.wordCount,
        estSpeakingMinutes: data.stats.estSpeakingMinutes,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengonversi dokumen.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!processedResult) return;
    const isDialogue = selectedAction === 'create_dialogue';
    onApplyScript(processedResult.text, isDialogue, file?.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 overflow-hidden my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Konversi Dokumen ke Audio TTS
            </h3>
            <p className="text-xs text-slate-400">
              Unggah PDF, Naskah, atau Gambar; AI Gemini akan memformatnya menjadi naskah suara yang hidup.
            </p>
          </div>
        </div>

        {/* Upload Dropzone */}
        {!file ? (
          <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all mb-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-slate-200">
              Pilih Dokumen Anda
            </span>
            <span className="text-xs text-slate-400 mt-1 text-center">
              Mendukung PDF, DOCX, TXT, Markdown, atau Gambar Dokumen (JPG, PNG)
            </span>
            <input
              type="file"
              accept=".pdf,.txt,.md,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-slate-200 block truncate">
                  {file.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setFilePreview(null);
                setProcessedResult(null);
              }}
              className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1"
            >
              Ganti File
            </button>
          </div>
        )}

        {/* Action Selection */}
        <div className="space-y-2 mb-5">
          <label className="block text-xs font-semibold text-slate-300">
            Pilih Mode Optimasi Naskah Suara:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Action 1: Clean & Speech-Ready */}
            <div
              onClick={() => setSelectedAction('clean_for_speech')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedAction === 'clean_for_speech'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">Rapikan untuk TTS</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Eja angka/singkatan, hapus footnote &amp; referensi, format tanda baca jeda napas.
              </p>
            </div>

            {/* Action 2: Summarize to Podcast */}
            <div
              onClick={() => setSelectedAction('summarize_podcast')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedAction === 'summarize_podcast'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold">Ringkas Jadi Podcast</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Rangkum dokumen panjang menjadi naskah audio briefing 2 menit yang memikat.
              </p>
            </div>

            {/* Action 3: Convert to 2-Person Dialogue */}
            <div
              onClick={() => setSelectedAction('create_dialogue')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedAction === 'create_dialogue'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold">Dialog 2 Pembicara</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Format skenario wawancara interaktif antara Host (Alex) &amp; Ahli (Sam).
              </p>
            </div>

            {/* Action 4: Translate */}
            <div
              onClick={() => setSelectedAction('translate')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedAction === 'translate'
                  ? 'bg-indigo-600/15 border-indigo-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Languages className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Terjemahkan Konten</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-200"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Process Button */}
        {file && !processedResult && (
          <button
            onClick={handleProcessDocument}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 mb-4"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memproses Dokumen dengan Gemini 3.5 Flash...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Mulai Proses Dokumen</span>
              </>
            )}
          </button>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-4">
            {errorMessage}
          </div>
        )}

        {/* Processed Result Preview */}
        {processedResult && (
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Pratinjau Naskah Siap Baca:
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>{processedResult.wordCount} kata</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-indigo-400">
                  <Clock className="w-3 h-3" />
                  ~{processedResult.estSpeakingMinutes} menit audio
                </span>
              </div>
            </div>

            <textarea
              readOnly
              value={processedResult.text}
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed font-mono focus:outline-none resize-none"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleProcessDocument}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Proses Ulang
              </button>
              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan ke Editor Studio</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
