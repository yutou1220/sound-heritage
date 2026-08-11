import { useState, useRef } from 'react'
import { loadBuffer, createSource, getCtx } from '../utils/audioDSP'

export default function SoundFXProcessor({ sounds }) {
  const [selected, setSelected] = useState(null)
  const [filterFreq, setFilterFreq] = useState(2000)
  const [filterType, setFilterType] = useState('lowpass')
  const [distortion, setDistortion] = useState(0)
  const [delayTime, setDelayTime] = useState(0)
  const [delayFeedback, setDelayFeedback] = useState(0)
  const [bitcrush, setBitcrush] = useState(0)
  const [playing, setPlaying] = useState(false)
  const sourceRef = useRef(null)
  const bufferRef = useRef(null)

  const play = async () => {
    if (!selected?.localAudio) return
    getCtx().resume()
    if (!bufferRef.current) {
      bufferRef.current = await loadBuffer(selected.localAudio)
    }

    const { source, output } = createSource(bufferRef.current, {
      gain: 0.6,
      filterType: filterFreq < 19900 ? filterType : undefined,
      filterFreq,
      distortion: distortion > 0 ? distortion * 200 : 0,
      delayTime: delayTime > 0 ? delayTime : undefined,
      delayFeedback,
      loop: true,
    })
    output.connect(getCtx().destination)
    source.start(0)
    sourceRef.current = source
    setPlaying(true)
  }

  const stop = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch (_) {}
      sourceRef.current = null
    }
    setPlaying(false)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">🎚 声音特效处理器</h3>
        <p className="mt-1 text-sm text-white/40">滤波、失真、延迟、粒子化——把非遗声音变成电子音色</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Sound picker */}
        <div>
          <p className="mb-2 text-sm text-white/50">选择声音</p>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {sounds.slice(0, 12).map((s) => (
              <button
                key={s.id}
                onClick={() => { stop(); setSelected(s); bufferRef.current = null }}
                className={`rounded-lg border px-2 py-1.5 text-left text-xs ${
                  selected?.id === s.id ? 'border-amber-400/50 bg-amber-400/10 text-amber-400' : 'border-white/10 text-white/60'
                }`}
              >
                {s.name.slice(0, 12)}
              </button>
            ))}
          </div>
          <button
            onClick={playing ? stop : play}
            disabled={!selected}
            className="mt-4 w-full rounded-lg bg-amber-400 py-2 text-sm font-medium text-black disabled:opacity-30"
          >
            {playing ? '⏹ 停止' : '▶ 试听效果'}
          </button>
        </div>

        {/* Effects controls */}
        <div className="space-y-5">
          {/* Filter */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>滤波</span>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-transparent text-amber-400 text-xs">
                <option value="lowpass" className="bg-[#1a1a1a]">低通</option>
                <option value="highpass" className="bg-[#1a1a1a]">高通</option>
                <option value="bandpass" className="bg-[#1a1a1a]">带通</option>
              </select>
              <span className="text-amber-400">{filterFreq}Hz</span>
            </div>
            <input type="range" min="50" max="20000" step="10" value={filterFreq}
              onChange={(e) => setFilterFreq(Number(e.target.value))}
              className="w-full h-1 accent-amber-400" />
          </div>

          {/* Distortion */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>失真</span>
              <span className="text-amber-400">{Math.round(distortion * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={distortion}
              onChange={(e) => setDistortion(Number(e.target.value))}
              className="w-full h-1 accent-amber-400" />
          </div>

          {/* Delay */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>延迟时间</span>
              <span className="text-amber-400">{delayTime.toFixed(2)}s</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={delayTime}
              onChange={(e) => setDelayTime(Number(e.target.value))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>延迟反馈</span>
              <span className="text-amber-400">{Math.round(delayFeedback * 100)}%</span>
            </div>
            <input type="range" min="0" max="0.9" step="0.05" value={delayFeedback}
              onChange={(e) => setDelayFeedback(Number(e.target.value))}
              className="w-full h-1 accent-amber-400" />
          </div>

          {/* Bitcrush */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>比特粉碎</span>
              <span className="text-amber-400">{Math.round(bitcrush * 100)}%</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" value={bitcrush}
              onChange={(e) => setBitcrush(Number(e.target.value))}
              className="w-full h-1 accent-amber-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
