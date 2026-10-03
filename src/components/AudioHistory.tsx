import React, { useState } from 'react';
import {
  Library,
  Play,
  Pause,
  Download,
  Trash2,
  Search,
  Clock,
  Volume2,
  ArrowUpRight,
  Sparkles,
  Dna,
  FileText,
  Filter,
  Eye,
  X,
  Check,
  FileCheck2,
  Grid,
  List,
  Calendar,
  Layers,
  ArrowUpDown,
  AlertTriangle
} from 'lucide-react';
import { GeneratedAudioItem } from '../types';
import { downloadBase64Audio, base64ToBlobUrl, base64ToDataUrl, formatDuration } from '../utils/audio';

interface AudioHistoryProps {
  history: GeneratedAudioItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onPlayInStudio: (item: GeneratedAudioItem) => void;
}

export const AudioHistory: React.FC<AudioHistoryProps> = ({
  history,
  onDeleteItem,
  onClearAll,
  onPlayInStudio,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'cloned' | 'standard' | 'document'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'words' | 'duration'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<GeneratedAudioItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Filter items
  const filtered = history.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fullText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.voiceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.fileName && item.fileName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'cloned') return item.isClonedVoice;
    if (activeFilter === 'standard') return !item.isClonedVoice;
    if (activeFilter === 'document') return !!item.fileName || (item.documentSource && item.documentSource.toLowerCase().includes('dokumen'));

    return true;
  });

  // Sort items
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'words') return b.wordCount - a.wordCount;
    if (sortBy === 'duration') return (b.durationSeconds || b.wordCount) - (a.durationSeconds || a.wordCount);
    return 0;
  });

  // Calculate stats
  const totalWords = history.reduce((acc, curr) => acc + curr.wordCount, 0);
  const totalEstimatedMinutes = Math.round((totalWords / 140) * 10) / 10;
  const clonedCount = history.filter((h) => h.isClonedVoice).length;
  const standardCount = history.length - clonedCount;

  const handleDownloadItem = (item: GeneratedAudioItem) => {
    const safeTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 32);
    const filename = `${safeTitle || 'dokumen-audio'}-${item.id}.wav`;
    downloadBase64Audio(item.audioData, filename, item.mimeType);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Metrics Summary Bar */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold mb-2">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Manajemen Dokumen &amp; Audio Terkonversi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Riwayat Konversi Text to Speech</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-indigo-400 border border-slate-700">
                {history.length} Berkas
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Arsip seluruh naskah dan dokumen yang telah disintesis menjadi audio berkualitas studio 24kHz. Unduh kembali, putar, atau buka kembali naskah untuk penyuntingan.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                Total Dokumen
              </span>
              <span className="text-lg font-black text-slate-100">{history.length} File</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Tersimpan di sesi</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                Estimasi Durasi
              </span>
              <span className="text-lg font-black text-indigo-400">~{totalEstimatedMinutes} Menit</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{totalWords} kata terilis</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                Kloning AI vs Studio
              </span>
              <span className="text-lg font-black text-violet-400">
                {clonedCount} <span className="text-xs text-slate-500 font-normal">/ {standardCount}</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Rasio vokal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter, Search & Controls Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari judul dokumen, teks, suara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-300 text-xs py-1 pr-2 focus:outline-none cursor-pointer"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="words">Kata Terbanyak</option>
                <option value="duration">Durasi Terpanjang</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Kartu"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Daftar Tabel"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Clear All Trigger */}
            {history.length > 0 && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors ml-2"
              >
                Hapus Semua
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Kategori:</span>
          </span>

          <button
            onClick={() => setActiveFilter('all')}
            className={`text-xs px-3 py-1 rounded-lg transition-all ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Semua ({history.length})
          </button>

          <button
            onClick={() => setActiveFilter('cloned')}
            className={`text-xs px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              activeFilter === 'cloned'
                ? 'bg-violet-600 text-white font-medium shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Dna className="w-3 h-3 text-violet-400" />
            <span>Suara Kloning AI ({clonedCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('standard')}
            className={`text-xs px-3 py-1 rounded-lg transition-all ${
              activeFilter === 'standard'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Suara Studio Bawaan ({standardCount})
          </button>

          <button
            onClick={() => setActiveFilter('document')}
            className={`text-xs px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              activeFilter === 'document'
                ? 'bg-cyan-600 text-white font-medium shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3 h-3 text-cyan-400" />
            <span>Dari Dokumen Terunggah</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto mb-4">
            <Library className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-200 mb-1">
            {searchTerm || activeFilter !== 'all' ? 'Tidak Ada Dokumen yang Cocok' : 'Belum Ada Riwayat Dokumen'}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {searchTerm || activeFilter !== 'all'
              ? 'Coba ganti filter atau gunakan kata kunci pencarian yang lain.'
              : 'Konversi naskah teks atau unggah file dokumen (PDF/TXT) di Studio TTS untuk mulai mengumpulkan rekaman audio di galeri ini.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sorted.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/90 hover:border-slate-700/80 transition-all p-5 sm:p-6 shadow-xl flex flex-col justify-between group"
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <FileText className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="font-bold text-slate-100 text-sm sm:text-base truncate" title={item.title}>
                        {item.title}
                      </h4>
                    </div>

                    {item.fileName && (
                      <span className="text-[11px] text-cyan-400 block font-mono">
                        Sumber: {item.fileName}
                      </span>
                    )}
                  </div>

                  {item.isClonedVoice ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0 flex items-center gap-1">
                      <Dna className="w-3 h-3" />
                      <span>{item.voiceName}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      Suara: {item.voiceName}
                    </span>
                  )}
                </div>

                {/* Text Snippet with View Full Text shortcut */}
                <div className="relative mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-sans">
                    &quot;{item.fullText}&quot;
                  </p>
                  <button
                    onClick={() => setSelectedPreviewItem(item)}
                    className="mt-2 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Lihat Naskah Lengkap ({item.wordCount} kata)</span>
                  </button>
                </div>

                {/* Embedded HTML5 Audio Player */}
                <div className="mb-4">
                  <audio
                    controls
                    preload="auto"
                    src={base64ToDataUrl(item.audioData, item.mimeType)}
                    className="w-full h-8 accent-indigo-500 rounded-lg"
                  />
                </div>
              </div>

              {/* Action Buttons & Footer Stats */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span>{item.wordCount} kata</span>
                  <span>•</span>
                  <span>
                    {new Date(item.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Download WAV button */}
                  <button
                    onClick={() => handleDownloadItem(item)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-transform active:scale-95"
                    title="Unduh Berkas Audio WAV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh WAV</span>
                  </button>

                  {/* Re-open in Studio */}
                  <button
                    onClick={() => onPlayInStudio(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                    title="Buka &amp; Sunting di Studio"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Hapus dari Riwayat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table List View */
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Dokumen &amp; Judul Naskah</th>
                  <th className="py-3.5 px-4">Karakter Suara</th>
                  <th className="py-3.5 px-4">Jumlah Kata</th>
                  <th className="py-3.5 px-4">Waktu Dibuat</th>
                  <th className="py-3.5 px-4 text-center">Pemutar Audio</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sorted.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-200 truncate">{item.title}</div>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {item.fullText.slice(0, 70)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.isClonedVoice ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          🧬 {item.voiceName}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {item.voiceName}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-300">
                      {item.wordCount} kata
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] text-center">
                      <audio
                        controls
                        preload="auto"
                        src={base64ToDataUrl(item.audioData, item.mimeType)}
                        className="h-7 w-44 mx-auto accent-indigo-500"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadItem(item)}
                          className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                          title="Unduh WAV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onPlayInStudio(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                          title="Buka di Studio"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm">Hapus Berkas Audio?</h4>
                <p className="text-xs text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteItem(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm">Hapus Seluruh Riwayat?</h4>
                <p className="text-xs text-slate-400">
                  Semua {history.length} rekaman dokumen akan dihapus dari sesi ini.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onClearAll();
                  setIsClearAllModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Full Text Modal */}
      {selectedPreviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4 my-8">
            <button
              onClick={() => setSelectedPreviewItem(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">{selectedPreviewItem.title}</h3>
                <span className="text-xs text-slate-400">
                  {selectedPreviewItem.wordCount} kata • Suara: {selectedPreviewItem.voiceName}
                </span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-h-96 overflow-y-auto">
              <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {selectedPreviewItem.fullText}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handleDownloadItem(selectedPreviewItem)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Audio WAV</span>
              </button>

              <button
                onClick={() => {
                  onPlayInStudio(selectedPreviewItem);
                  setSelectedPreviewItem(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Buka di Studio TTS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
