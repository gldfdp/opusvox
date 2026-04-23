function buildWavBuffer(buffer: AudioBuffer): ArrayBuffer 
{
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const numSamples = buffer.length
  const dataLength = numSamples * numChannels * 2
  const wav = new ArrayBuffer(44 + dataLength)
  const view = new DataView(wav)
  const str = (off: number, s: string) => 
  {
    for (let i = 0; i < s.length; i++) 
    {
      view.setUint8(off + i, s.charCodeAt(i))
    } 
  }
  str(0, 'RIFF'); view.setUint32(4, 36 + dataLength, true); str(8, 'WAVE'); str(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * numChannels * 2, true)
  view.setUint16(32, numChannels * 2, true); view.setUint16(34, 16, true); str(36, 'data')
  view.setUint32(40, dataLength, true)
  let off = 44
  for (let i = 0; i < numSamples; i++) 
  {
    for (let ch = 0; ch < numChannels; ch++) 
    {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2
    }
  }
  return wav
}

export function audioBufferToWavBlob(buffer: AudioBuffer): Blob 
{
  return new Blob([buildWavBuffer(buffer)], { type: 'audio/wav' })
}

export function audioBufferToWavDataUrl(buffer: AudioBuffer): string 
{
  const bytes = new Uint8Array(buildWavBuffer(buffer))
  let binary = ''
  for (let i = 0; i < bytes.length; i++) 
  {
    binary += String.fromCharCode(bytes[i])
  }
  return `data:audio/wav;base64,${btoa(binary)}`
}

export function getAudioDuration(source: Blob | File): Promise<number> 
{
  return new Promise((resolve) => 
  {
    const audio = new Audio()
    audio.addEventListener('loadedmetadata', () => 
    {
      resolve(audio.duration * 1000)
      URL.revokeObjectURL(audio.src)
    })
    audio.src = URL.createObjectURL(source)
  })
}

export async function trimTrailingSeconds(blob: Blob, trimSeconds: number): Promise<Blob> 
{
  if (trimSeconds <= 0) 
  {
    return blob
  }
  try 
  {
    const arrayBuffer = await blob.arrayBuffer()
    const audioCtx = new AudioContext()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    await audioCtx.close()
    const newDuration = audioBuffer.duration - trimSeconds
    if (newDuration < 0.5) 
    {
      return blob
    }
    const newSamples = Math.floor(newDuration * audioBuffer.sampleRate)
    const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, newSamples, audioBuffer.sampleRate)
    const trimmed = offlineCtx.createBuffer(audioBuffer.numberOfChannels, newSamples, audioBuffer.sampleRate)
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) 
    {
      trimmed.getChannelData(ch).set(audioBuffer.getChannelData(ch).subarray(0, newSamples))
    }
    return audioBufferToWavBlob(trimmed)
  }
  catch 
  {
    return blob
  }
}

export async function trimAudioMiddle30s(audioDataUrl: string): Promise<{ dataUrl: string; trimmed: boolean }> 
{
  const MAX_DURATION = 30
  const base64 = audioDataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) 
  {
    bytes[i] = binary.charCodeAt(i)
  }

  const audioCtx = new AudioContext()
  try 
  {
    const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0))
    if (audioBuffer.duration <= MAX_DURATION) 
    {
      return { dataUrl: audioDataUrl, trimmed: false }
    }

    const sampleRate = audioBuffer.sampleRate
    const numChannels = audioBuffer.numberOfChannels
    const startTime = (audioBuffer.duration - MAX_DURATION) / 2
    const startSample = Math.floor(startTime * sampleRate)
    const trimSamples = Math.floor(MAX_DURATION * sampleRate)

    const trimmedBuffer = audioCtx.createBuffer(numChannels, trimSamples, sampleRate)
    for (let ch = 0; ch < numChannels; ch++) 
    {
      const src = audioBuffer.getChannelData(ch)
      const dst = trimmedBuffer.getChannelData(ch)
      for (let i = 0; i < trimSamples; i++) 
      {
        dst[i] = src[startSample + i]
      }
    }

    return { dataUrl: audioBufferToWavDataUrl(trimmedBuffer), trimmed: true }
  }
  finally 
  {
    audioCtx.close()
  }
}
