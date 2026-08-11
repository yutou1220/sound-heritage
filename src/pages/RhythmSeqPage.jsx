import { getAllSounds } from '../utils/sounds'
import RhythmSequencer from '../components/RhythmSequencer'
import { Link } from 'react-router-dom'

export default function RhythmSeqPage() {
  const allSounds = getAllSounds()
  const shortSounds = allSounds.filter((s) =>
    /打|敲|锤|锻|鼓|锣|织|锯|刨|击|碎|裂|碰|撞|摔|砸|弹|响|叫|鸣|钟|铃/.test(
      (s.name || '') + (s.keywords || []).join('')
    )
  )

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <Link to="/create" className="text-sm text-white/40 hover:text-white transition-colors">← 返回声音实验室</Link>
        <h1 className="mt-3 text-3xl font-bold">🥁 节奏编排器</h1>
        <p className="mt-2 text-white/40">
          把短声音变成打击乐——三种模式：网格编排循环播放、打击垫即兴敲击、键盘实时演奏
        </p>
      </div>
      <RhythmSequencer sounds={shortSounds.length > 0 ? shortSounds : allSounds} />
    </div>
  )
}
