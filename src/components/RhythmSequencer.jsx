import { useState, useRef, useEffect } from 'react'
import { getCtx } from '../utils/audioDSP'

const STEPS = 16
const MAX_TRACKS = 6
const KEY_MAP = ['a', 's', 'd', 'f', 'g', 'h']

export default function RhythmSequencer({ sounds }) {
  const [bpm, setBpm] = useState(120)
  const [playing, setPlaying] = useState(false)
  const [tracks, setTracks] = useState([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [mode, setMode] = useState('grid') // 'grid' | 'pad' | 'keys'
  const timerRef = useRef(null)
  const stepRef = useRef(0)
  const bufferCache = useRef({})
  const tracksRef = useRef([]) // always reflects latest tracks

  // Keep tracksRef in sync with state
  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  // Preload audio buffers (sequential to avoid overwhelming the context)
  useEffect(() => {
    const preload = async () => {
      for (const t of tracks) {
        if (!bufferCache.current[t.sound.id] && t.sound.localAudio) {
          try {
            const { loadBuffer } = await import('../utils/audioDSP')
            bufferCache.current[t.sound.id] = await loadBuffer(t.sound.localAudio)
          } catch (_) {}
        }
      }
    }
    preload()
  }, [tracks])

  const addTrack = (sound) => {
    if (tracks.length >= MAX_TRACKS) return
    if (tracks.find((t) => t.sound.id === sound.id)) return
    setTracks([...tracks, { sound, pattern: new Array(STEPS).fill(false) }])
  }

  const removeTrack = (soundId) => {
    setTracks(tracks.filter((t) => t.sound.id !== soundId))
  }

  const toggleStep = (trackIdx, stepIdx) => {
    const newTracks = [...tracks]
    newTracks[trackIdx] = {
      ...newTracks[trackIdx],
      pattern: newTracks[trackIdx].pattern.map((v, i) => (i === stepIdx ? !v : v)),
    }
    setTracks(newTracks)
  }

  const triggerSound = async (sound) => {
    if (!sound.localAudio) return
    try {
      let buffer = bufferCache.current[sound.id]
      if (!buffer) {
        const { loadBuffer } = await import('../utils/audioDSP')
        buffer = await loadBuffer(sound.localAudio)
        bufferCache.current[sound.id] = buffer
      }
      const { schedulePlay } = await import('../utils/audioDSP')
      schedulePlay(buffer, 0, { gain: 0.5 })
    } catch (_) {}
  }

  // Grid mode: sequencer loop
  const startStopGrid = async () => {
    if (playing) {
      clearInterval(timerRef.current)
      timerRef.current = null
      stepRef.current = 0
      setPlaying(false)
      setCurrentStep(-1)
    } else {
      // Ensure AudioContext is running before we start
      await getCtx().resume()
      stepRef.current = 0
      setCurrentStep(0)
      setPlaying(true)

      // Play step 0 immediately (beat 1), then advance
      const currentTracks = tracksRef.current
      currentTracks.forEach((track) => {
        if (track.pattern[0]) triggerSound(track.sound)
      })

      const stepTime = (60 / bpm / 4) * 1000
      timerRef.current = setInterval(() => {
        stepRef.current = (stepRef.current + 1) % STEPS
        setCurrentStep(stepRef.current)
        const currentTracks = tracksRef.current
        currentTracks.forEach((track) => {
          if (track.pattern[stepRef.current]) triggerSound(track.sound)
        })
      }, stepTime)
    }
  }

  // Keyboard mode
  useEffect(() => {
    if (mode !== 'keys') return

    const handleKey = (e) => {
      const idx = KEY_MAP.indexOf(e.key.toLowerCase())
      if (idx >= 0 && idx < tracks.length) {
        e.preventDefault()
        triggerSound(tracks[idx].sound)
        // Flash effect
        const btn = document.getElementById('pad-' + tracks[idx].sound.id)
        if (btn) {
          btn.classList.add('bg-amber-400')
          setTimeout(() => btn.classList.remove('bg-amber-400'), 100)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mode, tracks])

  const stop = () => {
    clearInterval(timerRef.current)
    setPlaying(false)
    setCurrentStep(-1)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">🥁 节奏编排器</h3>
          <p className="mt-1 text-sm text-white/40">
            {mode === 'grid' && '在网格上编排节奏，自动循环播放'}
            {mode === 'pad' && '点击打击垫实时演奏'}
            {mode === 'keys' && '按键盘按键（A S D F G H）实时演奏'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode switcher */}
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            {[
              { key: 'grid', label: '网格' },
              { key: 'pad', label: '打击垫' },
              { key: 'keys', label: '键盘' },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => { stop(); setMode(m.key) }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === m.key ? 'bg-amber-400 text-black' : 'text-white/50 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {mode === 'grid' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">BPM</span>
                <input type="number" value={bpm} onChange={(e) => setBpm(Number(e.target.value))}
                  min="40" max="300" disabled={playing}
                  className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-white" />
              </div>
              <button onClick={startStopGrid}
                className={`rounded-lg px-5 py-2 text-sm font-medium ${playing ? 'bg-red-400/20 text-red-400' : 'bg-amber-400 text-black'}`}>
                {playing ? '⏹ 停止' : '▶ 播放'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sound selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {sounds.slice(0, 20).map((s) => (
          <button key={s.id} onClick={() => addTrack(s)}
            disabled={tracks.some((t) => t.sound.id === s.id)}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:border-amber-400/30 hover:text-amber-400 disabled:opacity-20">
            + {s.name.slice(0, 8)}
          </button>
        ))}
      </div>

      {/* === GRID MODE === */}
      {mode === 'grid' && (
        <div className="space-y-2">
          {tracks.length === 0 && (
            <p className="py-8 text-center text-sm text-white/20">点击上方声音添加轨道，然后在网格上点击来编排节奏</p>
          )}
          {tracks.map((track, ti) => (
            <div key={ti} className="flex items-center gap-2">
              <div className="w-28 shrink-0 flex items-center justify-between">
                <span className="truncate text-xs text-white/60">{track.sound.name.slice(0, 8)}</span>
                <button onClick={() => removeTrack(track.sound.id)} className="ml-1 text-white/20 hover:text-red-400 text-xs">✕</button>
              </div>
              <div className="flex gap-1 flex-1">
                {track.pattern.map((active, si) => (
                  <button key={si} onClick={() => toggleStep(ti, si)}
                    className={`h-8 flex-1 rounded transition-all ${
                      currentStep === si && playing ? 'ring-1 ring-amber-400/50' : ''
                    } ${
                      active ? 'bg-amber-400 shadow-sm' : 'bg-white/10 hover:bg-white/20'
                    } ${si % 4 === 0 ? 'ml-1' : ''}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === PAD MODE === */}
      {mode === 'pad' && (
        <div>
          {tracks.length === 0 && (
            <p className="py-8 text-center text-sm text-white/20">先添加声音，然后点击下方打击垫实时演奏</p>
          )}
          <div className="grid grid-cols-3 gap-4">
            {tracks.map((track, ti) => (
              <button
                key={ti}
                id={'pad-' + track.sound.id}
                onClick={() => triggerSound(track.sound)}
                className="relative aspect-square rounded-2xl border-2 border-white/20 bg-white/[0.04] flex flex-col items-center justify-center transition-all active:scale-95 active:border-amber-400 active:bg-amber-400/20 hover:border-white/40"
              >
                <span className="text-3xl mb-1">
                  {['🔨','🪵','🪨','🔔','💥','🎵'][ti] || '🔊'}
                </span>
                <span className="text-xs text-white/60">{track.sound.name.slice(0, 6)}</span>
                {mode === 'keys' && (
                  <span className="mt-1 rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-amber-400">
                    {KEY_MAP[ti]?.toUpperCase()}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeTrack(track.sound.id) }}
                  className="absolute top-1.5 right-1.5 text-white/20 hover:text-red-400 text-[10px]">✕</button>
              </button>
            ))}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, MAX_TRACKS - tracks.length) }).map((_, i) => (
              <div key={'empty-' + i} className="aspect-square rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-white/10 text-sm">
                +
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === KEYS MODE === */}
      {mode === 'keys' && (
        <div>
          {tracks.length === 0 && (
            <p className="py-8 text-center text-sm text-white/20">先添加声音，然后用键盘按键实时演奏</p>
          )}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {tracks.map((track, ti) => (
              <div key={ti} className="relative rounded-2xl border-2 border-white/10 bg-white/[0.02] flex flex-col items-center justify-center py-8 transition-all">
                <span className="text-3xl mb-2">
                  {['🔨','🪵','🪨','🔔','💥','🎵'][ti] || '🔊'}
                </span>
                <span className="text-sm text-white/60 mb-1">{track.sound.name.slice(0, 8)}</span>
                <span className="rounded-lg bg-amber-400/20 px-4 py-2 text-lg font-bold font-mono text-amber-400 border border-amber-400/30">
                  {KEY_MAP[ti]?.toUpperCase()}
                </span>
                <button
                  onClick={() => removeTrack(track.sound.id)}
                  className="absolute top-1.5 right-1.5 text-white/20 hover:text-red-400 text-[10px]">✕</button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/30">⌨ 按下键盘上的对应按键来演奏声音</p>
        </div>
      )}
    </div>
  )
}
