import { useState, useRef, useEffect, useCallback } from 'react'
import { getCtx, loadBuffer, createSource } from '../utils/audioDSP'

// Ambient layers we can generate without external files
function generateAmbientBuffer(ctx, type, durationSec) {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * durationSec
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate
    let sample = 0

    if (type === 'rain') {
      // Filtered noise simulating rain
      let noise = 0
      for (let j = 0; j < 4; j++) {
        noise += (Math.random() * 2 - 1) * 0.25
      }
      const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.3 * t)
      sample = noise * 0.6 * lfo
    } else if (type === 'wind') {
      // Low-frequency wind
      sample = Math.sin(2 * Math.PI * (80 + Math.sin(2 * Math.PI * 0.15 * t) * 40) * t) * 0.3
        + Math.sin(2 * Math.PI * (120 + Math.cos(2 * Math.PI * 0.2 * t) * 60) * t) * 0.2
        + (Math.random() * 2 - 1) * 0.08
    } else if (type === 'fire') {
      // Crackling fire
      const crackle = Math.random() < 0.02 ? (Math.random() * 2 - 1) * 0.5 : 0
      const base = (Math.random() * 2 - 1) * 0.04
      sample = base + crackle
    } else if (type === 'stream') {
      // Gentle stream
      let waterNoise = 0
      for (let j = 0; j < 3; j++) {
        waterNoise += (Math.random() * 2 - 1) * 0.33
      }
      const flow = 0.3 + 0.3 * Math.sin(2 * Math.PI * 0.5 * t) + 0.1 * Math.sin(2 * Math.PI * 1.7 * t)
      sample = waterNoise * 0.4 * flow
    }

    // Fade in/out for smooth looping
    const fadeLen = Math.min(0.1, durationSec * 0.05)
    const fadeIn = Math.min(1, t / fadeLen)
    const fadeOut = Math.min(1, (durationSec - t) / fadeLen)
    data[i] = sample * fadeIn * fadeOut
  }
  return buffer
}

const AMBIENT_LAYERS = [
  { key: 'rain', label: '🌧 雨声', emoji: '🌧' },
  { key: 'wind', label: '💨 风声', emoji: '💨' },
  { key: 'fire', label: '🔥 篝火', emoji: '🔥' },
  { key: 'stream', label: '💧 溪流', emoji: '💧' },
]

export default function WhiteNoisePlayer({ sound }) {
  // Main sound
  const [mainVolume, setMainVolume] = useState(0.6)
  const [mainActive, setMainActive] = useState(false)
  const mainSourceRef = useRef(null)
  const mainGainRef = useRef(null)
  const mainBufferRef = useRef(null)

  // Ambient layers
  const [layers, setLayers] = useState({})
  const layerRefs = useRef({})
  const layerBuffers = useRef({})

  // Timer
  const [timerMinutes, setTimerMinutes] = useState(30)
  const [timerRunning, setTimerRunning] = useState(false)
  const [remaining, setRemaining] = useState(null)
  const timerRef = useRef(null)

  // Loading state
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Preload main sound buffer
  useEffect(() => {
    if (!sound?.localAudio) return
    setLoading(true)
    loadBuffer(sound.localAudio)
      .then(buf => {
        mainBufferRef.current = buf
        setLoaded(true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => {
      stopMain()
      Object.values(layerRefs.current).forEach(l => {
        try { l.source?.stop() } catch (_) {}
      })
    }
  }, [sound?.localAudio])

  // Create ambient layer buffer on demand
  const getLayerBuffer = (type) => {
    if (!layerBuffers.current[type]) {
      const ctx = getCtx()
      layerBuffers.current[type] = generateAmbientBuffer(ctx, type, 4) // 4-second loop
    }
    return layerBuffers.current[type]
  }

  // Stop main sound
  const stopMain = useCallback(() => {
    if (mainSourceRef.current) {
      try { mainSourceRef.current.stop() } catch (_) {}
      mainSourceRef.current = null
    }
    if (mainGainRef.current) {
      try { mainGainRef.current.disconnect() } catch (_) {}
      mainGainRef.current = null
    }
    setMainActive(false)
  }, [])

  // Start main sound looping
  const startMain = useCallback(async () => {
    if (!mainBufferRef.current) return
    const ctx = getCtx()
    await ctx.resume()

    stopMain()
    const buf = mainBufferRef.current

    const source = ctx.createBufferSource()
    source.buffer = buf
    source.loop = true

    const gain = ctx.createGain()
    gain.gain.value = mainVolume

    source.connect(gain)
    gain.connect(ctx.destination)
    source.start(0)

    mainSourceRef.current = source
    mainGainRef.current = gain
    setMainActive(true)
  }, [mainVolume, stopMain])

  // Toggle main sound
  const toggleMain = () => {
    if (mainActive) {
      stopMain()
    } else {
      startMain()
    }
  }

  // Update main volume
  useEffect(() => {
    if (mainGainRef.current) {
      mainGainRef.current.gain.value = mainVolume
    }
  }, [mainVolume])

  // Toggle ambient layer
  const toggleLayer = async (type) => {
    const ctx = getCtx()
    await ctx.resume()

    const current = layerRefs.current[type]
    if (current?.source) {
      // Stop layer
      try { current.source.stop() } catch (_) {}
      try { current.gain.disconnect() } catch (_) {}
      layerRefs.current[type] = null
      setLayers(prev => { const n = { ...prev }; delete n[type]; return n })
    } else {
      // Start layer
      const buffer = getLayerBuffer(type)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true

      const gain = ctx.createGain()
      gain.gain.value = 0.25

      source.connect(gain)
      gain.connect(ctx.destination)
      source.start(0)

      layerRefs.current[type] = { source, gain }
      setLayers(prev => ({ ...prev, [type]: 0.25 }))
    }
  }

  // Change layer volume
  const setLayerVolume = (type, vol) => {
    const ref = layerRefs.current[type]
    if (ref?.gain) {
      ref.gain.gain.value = vol
    }
    setLayers(prev => ({ ...prev, [type]: vol }))
  }

  // Timer
  const startTimer = () => {
    setRemaining(timerMinutes * 60)
    setTimerRunning(true)
  }
  const stopTimer = () => {
    setTimerRunning(false)
    setRemaining(null)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => {
    if (!timerRunning || remaining === null) return
    if (remaining <= 0) {
      // Time's up — fade everything out
      fadeAllAndStop()
      stopTimer()
      return
    }
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          fadeAllAndStop()
          stopTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerRunning, remaining])

  const fadeAllAndStop = () => {
    // Fade out main
    if (mainGainRef.current) {
      const g = mainGainRef.current
      const start = g.gain.value
      const fadeStart = getCtx().currentTime
      g.gain.setValueAtTime(start, fadeStart)
      g.gain.linearRampToValueAtTime(0, fadeStart + 2)
    }
    // Fade out layers
    Object.entries(layerRefs.current).forEach(([_, ref]) => {
      if (ref?.gain) {
        const g = ref.gain
        const start = g.gain.value
        const fadeStart = getCtx().currentTime
        g.gain.setValueAtTime(start, fadeStart)
        g.gain.linearRampToValueAtTime(0, fadeStart + 2)
      }
    })
    setTimeout(() => {
      stopMain()
      Object.entries(layerRefs.current).forEach(([key, ref]) => {
        try { ref?.source?.stop() } catch (_) {}
        layerRefs.current[key] = null
      })
      setLayers({})
      setMainActive(false)
    }, 2500)
  }

  const formatTime = (sec) => {
    if (sec === null) return '--:--'
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // No audio available
  if (!sound?.localAudio) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <div className="text-center py-12">
          <span className="text-5xl">🎧</span>
          <h2 className="mt-4 text-xl font-bold">白噪音模式</h2>
          <p className="mt-2 text-white/40">
            该声音暂未导入音频文件，无法使用白噪音模式。
          </p>
          {sound?.url && (
            <p className="mt-4 text-sm">
              <span className="text-white/40">源链接：</span>
              <a href={sound.url} target="_blank" rel="noopener noreferrer"
                className="text-amber-400 hover:underline break-all">
                {sound.url}
              </a>
            </p>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-3 text-white/30">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            加载音频…
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🎧 白噪音模式
        </h2>
        <p className="mt-1 text-sm text-white/40">
          将「{sound.name}」设为循环背景音，叠加自然环境音，定时关闭
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Main sound control */}
        <div className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white">🔊 主声源</p>
                <p className="text-xs text-white/30 mt-0.5 truncate max-w-[200px]">{sound.name}</p>
              </div>
              <button
                onClick={toggleMain}
                disabled={!loaded}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                  mainActive
                    ? 'bg-red-400/20 text-red-400 border border-red-400/30'
                    : 'bg-amber-400 text-black hover:bg-amber-300'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {mainActive ? '⏹ 停止' : '▶ 播放'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/30">音量</span>
              <input
                type="range" min="0" max="1" step="0.01" value={mainVolume}
                onChange={e => setMainVolume(Number(e.target.value))}
                className="flex-1 h-1 accent-amber-400"
              />
              <span className="text-xs text-amber-400 w-8 text-right">{Math.round(mainVolume * 100)}%</span>
            </div>
            {mainActive && (
              <p className="mt-2 text-xs text-green-400/60">♻ 循环播放中</p>
            )}
          </div>

          {/* Ambient layers */}
          <div>
            <p className="text-sm text-white/50 mb-2">🌿 环境音叠加</p>
            <div className="grid grid-cols-2 gap-2">
              {AMBIENT_LAYERS.map(layer => {
                const active = !!layers[layer.key]
                const vol = layers[layer.key] || 0.25
                return (
                  <div key={layer.key}
                    className={`rounded-xl border p-3 transition-all ${
                      active ? 'border-amber-400/30 bg-amber-400/5' : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => toggleLayer(layer.key)}
                        className={`text-xs font-medium ${active ? 'text-amber-400' : 'text-white/50'}`}
                      >
                        {layer.emoji} {layer.label}
                      </button>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                      )}
                    </div>
                    {active && (
                      <input
                        type="range" min="0" max="1" step="0.01" value={vol}
                        onChange={e => setLayerVolume(layer.key, Number(e.target.value))}
                        className="w-full h-1 accent-amber-400"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Timer + Status */}
        <div className="space-y-5">
          {/* Timer */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/50 mb-3">⏱ 定时关闭</p>
            {timerRunning && remaining !== null ? (
              <div className="text-center py-4">
                <p className="text-4xl font-mono font-bold text-amber-400">{formatTime(remaining)}</p>
                <p className="mt-1 text-xs text-white/30">后自动停止所有声音</p>
                <button
                  onClick={stopTimer}
                  className="mt-3 rounded-lg border border-red-400/30 px-4 py-1.5 text-xs text-red-400 hover:bg-red-400/5"
                >
                  取消定时
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="number" min="1" max="180" value={timerMinutes}
                    onChange={e => setTimerMinutes(Math.max(1, Math.min(180, Number(e.target.value))))}
                    className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-sm text-white outline-none focus:border-amber-400/50"
                  />
                  <span className="text-sm text-white/40">分钟</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[15, 30, 60, 90].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setTimerMinutes(mins)}
                      className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
                        timerMinutes === mins
                          ? 'border-amber-400/30 bg-amber-400/10 text-amber-400'
                          : 'border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      {mins}分钟
                    </button>
                  ))}
                </div>
                <button
                  onClick={startTimer}
                  disabled={!mainActive && Object.keys(layers).length === 0}
                  className="mt-4 w-full rounded-lg bg-amber-400 py-2.5 text-sm font-medium text-black hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {mainActive || Object.keys(layers).length > 0 ? '▶ 启动定时' : '请先开启声音'}
                </button>
              </div>
            )}
          </div>

          {/* Active status */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/50 mb-2">📋 当前状态</p>
            <div className="space-y-1.5 text-xs">
              <p className="text-white/50">
                主声源：{mainActive
                  ? <span className="text-green-400">播放中</span>
                  : <span className="text-white/20">已停止</span>}
              </p>
              {AMBIENT_LAYERS.map(layer => (
                <p key={layer.key} className="text-white/50">
                  {layer.label}：{layers[layer.key] !== undefined
                    ? <span className="text-green-400">开启 ({Math.round((layers[layer.key] || 0) * 100)}%)</span>
                    : <span className="text-white/20">关闭</span>}
                </p>
              ))}
              <p className="text-white/50 mt-2 pt-2 border-t border-white/5">
                定时器：{timerRunning
                  ? <span className="text-amber-400">剩余 {formatTime(remaining)}</span>
                  : <span className="text-white/20">未开启</span>}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
