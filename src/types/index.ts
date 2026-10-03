export interface VoiceProfile {
  id: string;
  name: string;
  anchorVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  gender: string;
  pitch: string;
  timbre: string;
  pacing: string;
  accent: string;
  systemStylePrompt: string;
  summary: string;
  transcription?: string;
  similarityScore: number;
  tags: string[];
  previewAudio?: string;
  sampleText?: string;
  originalAudioUrl?: string;
  createdAt: string;
  isCloned?: boolean;
}

export interface GeneratedAudioItem {
  id: string;
  title: string;
  textSnippet: string;
  fullText: string;
  voiceName: string;
  isClonedVoice: boolean;
  audioData: string; // base64
  mimeType: string;
  durationSeconds?: number;
  wordCount: number;
  createdAt: string;
  mode: 'single' | 'dialogue';
  styleUsed?: string;
  documentSource?: string; // e.g. 'Dokumen PDF', 'Naskah Teks', 'Berkas TXT/MD'
  fileName?: string;
}

export interface SpeakerConfig {
  speaker: string;
  voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  style: string;
}

export interface DocumentStats {
  wordCount: number;
  estSpeakingMinutes: number;
}
