/**
 * Audio utilities for SuaraAI
 */

export function base64ToDataUrl(base64Data: string | null | undefined, mimeType: string = 'audio/wav'): string {
  if (!base64Data || typeof base64Data !== 'string' || !base64Data.trim()) {
    return '';
  }
  if (base64Data.startsWith('data:')) {
    return base64Data;
  }
  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  return `data:${mimeType};base64,${cleanBase64}`;
}

export function base64ToBlobUrl(base64Data: string | null | undefined, mimeType: string = 'audio/wav'): string {
  if (!base64Data || typeof base64Data !== 'string' || !base64Data.trim()) {
    return '';
  }
  try {
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Error creating Blob URL:', err);
    return '';
  }
}

export function downloadBase64Audio(base64Data: string, filename: string = 'suara-ai.wav', mimeType: string = 'audio/wav') {
  if (!base64Data) return;
  const url = base64ToBlobUrl(base64Data, mimeType);
  if (!url) return;
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
