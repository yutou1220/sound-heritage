import { useState, useRef, useCallback, useEffect } from 'react'
import { getAudioContext } from '../utils/audioEngine'

export default function AudioPlayer({ sound }) {
  if (!sound?.localAudio) {
    return <AudioPlayerPlaceholder />
  }
  return <AudioPlayerReal sound={sound} />
}

function AudioPlayerPlaceholder() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
      {/* Static waveform placeholder */}
      <div className="relative mb-6 flex h-48 items-center justify-center overflow-hidden rounded-xl bg-white/[0.03]">
        <div className="flex items-end gap-[2px] h-24 opacity-20">
          {Array.from({ length: 64 }).map((_, i) => {
            const h = 20 + Math.sin(i * 0.3) * 30 + Math.cos(i * 0.7) * 20
            return (
              <div
                key={i}
                className="w-[3px] rounded-full bg-amber-400/40"
                style={{ height: `${h}px` }}
              />
            )
          })}
        </div>
      </div>

      {/* Controls — disabled */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 w-10 text-right">0:00</span>
          <div className="relative flex-1 h-1.5 rounded-full bg-white/10" />
          <span className="text-xs text-white/40 w-10">0:00</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button disabled className="rounded-full p-2 text-white/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>
            <div className="rounded-full bg-white/10 p-3.5 text-white/20 relative group">
              <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {/* Tooltip: 暂未导入 */}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                暂未导入
              </span>
            </div>
            <button disabled className="rounded-full p-2 text-white/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 opacity-20">
            <svg className="h-4 w-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.8l-2.7 2.7H1.5v1h2.3l2.7 2.7h1.3V7.5H6.5z" />
            </svg>
            <input type="range" min="0" max="1" disabled className="w-20 h-1" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AudioPlayerReal({ sound }) {
  const audioUrl = sound.localAudio

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [bufferReady, setBufferReady] = useState(false)

  const sourceRef = useRef(null)
  const bufferRef = useRef(null)
  const rafRef = useRef(null)
  const gainRef = useRef(null)
  const startTimeRef = useRef(0)
  const pauseOffsetRef = useRef(0)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (sourceRef.current) {
        try { sourceRef.current.stop() } catch (_) {}
        sourceRef.current = null
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (gainRef.current) {
        try { gainRef.current.disconnect() } catch (_) {}
        gainRef.current = null
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch (_) {}
      sourceRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setPlaying(false)
  }, [])

  const updateTime = useCallback(() => {
    if (!startTimeRef.current) return
    const ctx = getAudioContext()
    const elapsed = ctx.currentTime - startTimeRef.current + pauseOffsetRef.current
    setCurrentTime(Math.min(elapsed, duration))
    rafRef.current = requestAnimationFrame(updateTime)
  }, [duration])

  // Load audio buffer once on mount (no auto-play)
  useEffect(() => {
    let cancelled = false
    async function load() {
      const ctx = getAudioContext()
      try {
        const response = await fetch(audioUrl)
        if (!response.ok) throw new Error('Fetch failed')
        const arrayBuffer = await response.arrayBuffer()
        if (!cancelled) {
          bufferRef.current = await ctx.decodeAudioData(arrayBuffer)
          setDuration(bufferRef.current.duration)
          setBufferReady(true)
        }
      } catch (e) {
        console.warn('Failed to load audio:', audioUrl, e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [audioUrl])

  const play = useCallback(async () => {
    const ctx = getAudioContext()
    await ctx.resume()

    if (!bufferRef.current) return
    if (sourceRef.current) stop()

    const source = ctx.createBufferSource()
    source.buffer = bufferRef.current

    if (!gainRef.current) {
      gainRef.current = ctx.createGain()
      gainRef.current.gain.value = volume
      gainRef.current.connect(ctx.destination)
    }

    source.connect(gainRef.current)
    source.start(0, pauseOffsetRef.current)
    startTimeRef.current = ctx.currentTime
    sourceRef.current = source

    source.onended = () => {
      if (sourceRef.current === source) {
        sourceRef.current = null
        setPlaying(false)
        setCurrentTime(0)
        pauseOffsetRef.current = 0
        cancelAnimationFrame(rafRef.current)
      }
    }

    setPlaying(true)
    rafRef.current = requestAnimationFrame(updateTime)
  }, [stop, updateTime, volume])

  const togglePlay = () => {
    if (playing) {
      pauseOffsetRef.current += getAudioContext().currentTime - startTimeRef.current
      stop()
    } else {
      play()
    }
  }

  const handleSeek = (e) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = ratio * duration
    pauseOffsetRef.current = newTime
    setCurrentTime(newTime)
    if (playing) {
      stop()
      play()
    }
  }

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (gainRef.current) gainRef.current.gain.value = v
  }

  const formatTime = (t) => {
    if (!t || !isFinite(t)) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
      {/* Waveform area */}
      <div
        className="relative mb-6 flex h-48 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-white/[0.03]"
        onClick={handleSeek}
      >
        <div className="flex items-end gap-[2px] h-24">
          {Array.from({ length: 64 }).map((_, i) => {
            const baseH = 20 + Math.sin(i * 0.3) * 30 + Math.cos(i * 0.7) * 20
            const animH = playing ? baseH * (0.5 + 0.5 * Math.random()) : baseH
            return (
              <div
                key={i}
                className="w-[3px] rounded-full bg-amber-400/60 transition-all duration-75"
                style={{ height: `${animH}px`, opacity: playing ? 0.4 + Math.random() * 0.6 : 0.3 }}
              />
            )
          })}
        </div>

        {/* Play button overlay when paused */}
        {!playing && bufferReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/90 text-black shadow-lg transition-transform hover:scale-105">
              <svg className="ml-1 h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!bufferReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex items-center gap-2 text-white/30 text-sm">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              加载中…
            </div>
          </div>
        )}

        {/* Real audio badge */}
        {bufferReady && (
          <div className="absolute top-3 right-3 rounded-md bg-green-400/10 px-2 py-0.5 text-[10px] text-green-400">
            真实音频
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 w-10 text-right">{formatTime(currentTime)}</span>
          <div className="relative flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer group" onClick={handleSeek}>
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 6px)` }}
            />
          </div>
          <span className="text-xs text-white/40 w-10">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button disabled className="rounded-full p-2 text-white/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>
            <button
              onClick={togglePlay}
              disabled={!bufferReady}
              className="rounded-full bg-amber-400 p-3.5 text-black shadow-lg transition-transform hover:scale-105 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-amber-400"
            >
              {playing ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button disabled className="rounded-full p-2 text-white/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.8l-2.7 2.7H1.5v1h2.3l2.7 2.7h1.3V7.5H6.5z" />
            </svg>
            <input
              type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolume}
              className="w-20 h-1 rounded-full appearance-none bg-white/10 cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
