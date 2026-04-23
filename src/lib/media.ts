/**
 * Detects the best supported audio MIME type for MediaRecorder
 * at runtime, accounting for differences across browsers and
 * native WebViews (iOS WKWebView supports mp4/aac, not webm).
 */
export interface AudioMimeInfo {
  mimeType: string
  /** File extension to use when sending to transcription APIs */
  ext: string
}

const CANDIDATES: AudioMimeInfo[] = [
  { mimeType: 'audio/webm;codecs=opus', ext: 'webm' },
  { mimeType: 'audio/webm', ext: 'webm' },
  { mimeType: 'audio/mp4', ext: 'mp4' },
  { mimeType: 'audio/ogg;codecs=opus', ext: 'ogg' },
  { mimeType: 'audio/ogg', ext: 'ogg' },
]

let cached: AudioMimeInfo | null = null

export function getSupportedAudioMimeType(): AudioMimeInfo 
{
  if (cached) 
  {
    return cached
  }

  if (typeof MediaRecorder === 'undefined') 
  {
    cached = { mimeType: '', ext: 'audio' }
    return cached
  }

  for (const candidate of CANDIDATES) 
  {
    if (MediaRecorder.isTypeSupported(candidate.mimeType)) 
    {
      cached = candidate
      return cached
    }
  }

  // Let the browser pick — use empty mimeType option
  cached = { mimeType: '', ext: 'audio' }
  return cached
}

export function isMediaRecorderSupported(): boolean 
{
  return typeof MediaRecorder !== 'undefined'
}
