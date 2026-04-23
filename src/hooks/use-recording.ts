import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { RecordingState } from '@/lib/types'
import { getSupportedAudioMimeType } from '@/lib/media'

const SILENCE_THRESHOLD = 0.01
const SILENCE_DELAY_MS = 3000

interface UseRecordingOptions {
  onComplete: (audioBlob: Blob, trailingSilenceMs: number, mimeType: string, ext: string) => Promise<void>
  toastStarted: string
  toastPermissionDenied: string
}

export function useRecording({ onComplete, toastStarted, toastPermissionDenied }: UseRecordingOptions) 
{
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasSpeechRef = useRef(false)
  const trailingSilenceMsRef = useRef(0)

  const stopRecordingRef = useRef<() => void>(() => 
  {})
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const stopSilenceDetection = () => 
  {
    if (analyserIntervalRef.current) 
    {
      clearInterval(analyserIntervalRef.current); analyserIntervalRef.current = null 
    }
    if (silenceTimerRef.current) 
    {
      clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null 
    }
    if (audioSourceRef.current) 
    {
      audioSourceRef.current.disconnect(); audioSourceRef.current = null 
    }
    if (audioCtxRef.current) 
    {
      audioCtxRef.current.close(); audioCtxRef.current = null 
    }
  }

  const stopRecording = () => 
  {
    stopSilenceDetection()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') 
    {
      mediaRecorderRef.current.stop()
      setRecordingState('processing')
    }
  }
  stopRecordingRef.current = stopRecording

  const startRecording = async () => 
  {
    try 
    {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const { mimeType, ext } = getSupportedAudioMimeType()
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      hasSpeechRef.current = false
      trailingSilenceMsRef.current = 0

      mediaRecorder.ondataavailable = (event) => 
      {
        if (event.data.size > 0) 
        {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => 
      {
        stream.getTracks().forEach(track => track.stop())
        stopSilenceDetection()
        const blobType = mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType })
        const trailingSilenceMs = trailingSilenceMsRef.current
        trailingSilenceMsRef.current = 0
        await onCompleteRef.current(audioBlob, trailingSilenceMs, mimeType || '', ext || 'webm')
      }

      const audioCtx = new AudioContext()
      await audioCtx.resume()
      audioCtxRef.current = audioCtx
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      const sourceNode = audioCtx.createMediaStreamSource(stream)
      audioSourceRef.current = sourceNode
      sourceNode.connect(analyser)
      const dataArray = new Float32Array(analyser.fftSize)

      let silenceStart: number | null = null

      analyserIntervalRef.current = setInterval(() => 
      {
        analyser.getFloatTimeDomainData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) 
        {
          sum += dataArray[i] * dataArray[i]
        }
        const rms = Math.sqrt(sum / dataArray.length)

        if (rms >= SILENCE_THRESHOLD) 
        {
          hasSpeechRef.current = true
          silenceStart = null
          if (silenceTimerRef.current) 
          {
            clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null 
          }
        }
        else if (hasSpeechRef.current && silenceStart === null) 
        {
          silenceStart = Date.now()
          silenceTimerRef.current = setTimeout(() => 
          {
            trailingSilenceMsRef.current = Date.now() - (silenceStart ?? Date.now())
            stopRecordingRef.current()
          }, SILENCE_DELAY_MS)
        }
      }, 100)

      mediaRecorder.start()
      setRecordingState('recording')
      toast.info(toastStarted)
    }
    catch (error) 
    {
      toast.error(toastPermissionDenied)
      console.error('Error accessing microphone:', error)
    }
  }

  return { recordingState, setRecordingState, startRecording, stopRecording }
}
