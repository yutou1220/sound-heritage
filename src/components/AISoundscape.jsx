import { useState, useRef } from 'react'
import { loadBuffer, schedulePlay, getCtx } from '../utils/audioDSP'

// 每种氛围的生成参数：交叉淡化密度(overlap)、力度(baseGain)、滤波、选材倾向
const MOOD_CONFIG = {
  calm: {
    overlap: 1.5,
    baseGain: 0.4,
    filterFreq: 2200,
    softWords: /风|水|溪|流|飘|轻|柔|缓|慢|低|沉|静|鸣|唱|歌|鸟/,
    intenseWords: /打|敲|锤|锻|碎|裂|爆|炸|碰|撞|击|鼓|锣|锯/,
  },
  tense: {
    overlap: 0.5,
    baseGain: 0.55,
    filterFreq: 0,
    softWords: /风|水|流|飘|轻|柔|缓|鸣/,
    intenseWords: /打|敲|锤|锻|碎|裂|爆|炸|碰|撞|击|鼓|锣|锯|钟|铃/,
  },
  epic: {
    overlap: 0.8,
    baseGain: 0.6,
    filterFreq: 0,
    softWords: /风|水|流|飘|轻|缓/,
    intenseWords: /打|敲|锤|锻|击|鼓|锣|钟|响|鸣|锻/,
  },
  dreamy: {
    overlap: 2.0,
    baseGain: 0.35,
    filterFreq: 1500,
    softWords: /风|水|溪|流|飘|轻|柔|缓|慢|低|沉|静|鸣|唱|歌|鸟/,
    intenseWords: /打|敲|锤|锻|碎|裂|爆|炸|碰|撞|击|鼓/,
  },
}

export default function AISoundscape({ sounds }) {
  const [selected, setSelected] = useState([])
  const [mood, setMood] = useState('calm')
  const [duration, setDuration] = useState(30)
  const [generating, setGenerating] = useState(false)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef(null)

  const toggleSound = (sound) => {
    setSelected((prev) =>
      prev.find((s) => s.id === sound.id) ? prev.filter((s) => s.id !== sound.id) : [...prev, sound]
    )
  }

  const generateSoundscape = async () => {
    if (selected.length === 0) return
    setGenerating(true)
    getCtx().resume()

    const cfg = MOOD_CONFIG[mood] || MOOD_CONFIG.calm

    // 按当前氛围给声音打分：软声在前、强声在后，形成「起承转合」
    const textOf = (s) =>
      `${s.name || ''} ${s.soundCharacteristic || ''} ${(s.keywords || []).join(' ')}`
    const sorted = [...selected].sort((a, b) => {
      const ta = textOf(a)
      const tb = textOf(b)
      const aRank = cfg.softWords.test(ta) ? -1 : cfg.intenseWords.test(ta) ? 1 : 0
      const bRank = cfg.softWords.test(tb) ? -1 : cfg.intenseWords.test(tb) ? 1 : 0
      return aRank - bRank
    })

    stop()
    const step = duration / Math.max(sorted.length, 1)
    // 起承转合增益曲线：首尾弱、中段强
    const arcGain = (i) => {
      const t = sorted.length <= 1 ? 0.5 : i / (sorted.length - 1)
      return cfg.baseGain * (0.65 + 0.7 * Math.sin(t * Math.PI))
    }

    sorted.forEach(async (sound, i) => {
      if (!sound.localAudio) return
      const buffer = await loadBuffer(sound.localAudio)
      const startTime = getCtx().currentTime + i * step
      const playDuration = Math.min(buffer.duration, step * (1 + cfg.overlap))
      schedulePlay(buffer, startTime, {
        gain: arcGain(i),
        duration: playDuration,
        filterFreq: cfg.filterFreq || undefined,
        filterType: 'lowpass',
      })
    })

    // Audio context timer for play state
    const endTime = getCtx().currentTime + duration + step * cfg.overlap
    setPlaying(true)
    timerRef.current = setInterval(() => {
      if (getCtx().currentTime >= endTime) {
        setPlaying(false)
        clearInterval(timerRef.current)
      }
    }, 500)

    setTimeout(() => setGenerating(false), 500)
  }

  const stop = () => {
    clearInterval(timerRef.current)
    setPlaying(false)
  }

  const moods = [
    { key: 'calm', label: '宁静', emoji: '🍃' },
    { key: 'tense', label: '紧张', emoji: '⚡' },
    { key: 'epic', label: '宏大', emoji: '🌋' },
    { key: 'dreamy', label: '梦幻', emoji: '🌙' },
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">🤖 AI 音景生成</h3>
        <p className="mt-1 text-sm text-white/40">勾选短声音，AI自动拼接成一段有起承转合的声音场景</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sound selection */}
        <div>
          <p className="mb-2 text-sm text-white/50">选择声音素材（{selected.length} 已选）</p>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {sounds.slice(0, 20).map((s) => {
              const checked = selected.find((ss) => ss.id === s.id)
              return (
                <button key={s.id} onClick={() => toggleSound(s)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs ${
                    checked ? 'border-amber-400/50 bg-amber-400/10 text-amber-400' : 'border-white/10 text-white/60'
                  }`}>
                  <span className={`flex h-3 w-3 items-center justify-center rounded text-[8px] ${
                    checked ? 'bg-amber-400 text-black' : 'border border-white/20'
                  }`}>✓</span>
                  <span className="truncate">{s.name.slice(0, 10)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-5">
          {/* Mood */}
          <div>
            <p className="text-sm text-white/50 mb-2">氛围倾向</p>
            <div className="grid grid-cols-4 gap-2">
              {moods.map((m) => (
                <button key={m.key} onClick={() => setMood(m.key)}
                  className={`rounded-lg border p-2 text-center text-xs ${
                    mood === m.key ? 'border-amber-400/30 bg-amber-400/10 text-amber-400' : 'border-white/10 text-white/40'
                  }`}>
                  <span>{m.emoji}</span>
                  <span className="block mt-0.5">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>生成时长</span>
              <span className="text-amber-400">{duration}秒</span>
            </div>
            <input type="range" min="15" max="60" step="5" value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-1 accent-amber-400" />
          </div>

          <div className="flex gap-3">
            <button onClick={generateSoundscape} disabled={selected.length === 0 || generating}
              className="flex-1 rounded-lg bg-amber-400 py-2.5 text-sm font-medium text-black disabled:opacity-30">
              {generating ? '生成中…' : '🎵 生成音景'}
            </button>
            {playing && (
              <button onClick={stop} className="rounded-lg bg-red-400/20 px-4 py-2.5 text-sm text-red-400">
                ⏹ 停止
              </button>
            )}
          </div>

          {playing && (
            <p className="text-center text-xs text-green-400/60 animate-pulse">▶ 音景播放中…</p>
          )}
        </div>
      </div>
    </div>
  )
}
