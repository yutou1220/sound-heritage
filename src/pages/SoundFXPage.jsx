import { getLabSounds } from '../utils/sounds'
import SoundFXProcessor from '../components/SoundFXProcessor'
import { Link } from 'react-router-dom'

export default function SoundFXPage() {
  const labSounds = getLabSounds()
  const myUploads = labSounds.filter((s) => s.isUserUpload)
  const builtin = labSounds.filter((s) => !s.isUserUpload)
  const shortSounds = builtin.filter((s) =>
    /打|敲|锤|锻|鼓|锣|织|锯|刨|击|碎|裂|碰|撞|摔|砸|弹|响|叫|鸣|钟|铃/.test(
      (s.name || '') + (s.keywords || []).join('')
    )
  )
  const sounds = [...myUploads, ...(shortSounds.length > 0 ? shortSounds : builtin)]

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <Link to="/create" className="text-sm text-white/40 hover:text-white transition-colors">← 返回声音实验室</Link>
        <h1 className="mt-3 text-3xl font-bold">🎚 声音特效处理器</h1>
        <p className="mt-2 text-white/40">
          滤波、失真、延迟、比特粉碎——把非遗声音变成电子音色调色盘
        </p>
      </div>
      <SoundFXProcessor sounds={sounds} />
    </div>
  )
}
