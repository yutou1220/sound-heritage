import { useSearchParams, Link } from 'react-router-dom'
import { getLabSoundById, getLabSounds } from '../utils/sounds'
import WhiteNoisePlayer from '../components/WhiteNoisePlayer'

export default function WhiteNoisePage() {
  const [searchParams] = useSearchParams()
  const soundId = searchParams.get('sound')

  const sound = soundId ? getLabSoundById(soundId) : null

  const labSounds = getLabSounds()
  const myUploads = labSounds.filter((s) => s.isUserUpload)
  const suitableBuiltin = labSounds.filter((s) =>
    !s.isUserUpload &&
    s.localAudio &&
    /织|打|锤|锻|鼓|风|水|溪|雨|流|烧|火|炉|敲|磨|纸|木|陶|瓷|铃|钟|竹|叶|沙/.test(
      (s.name || '') + (s.keywords || []).join(' ')
    )
  ).slice(0, 30)
  const suitableSounds = [...myUploads, ...suitableBuiltin]

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link to="/create" className="text-sm text-white/40 hover:text-white transition-colors">← 返回声音实验室</Link>
        <h1 className="mt-3 text-3xl font-bold">🎧 白噪音生成器</h1>
        <p className="mt-2 text-white/40">
          将非遗声音循环播放，叠加自然音效，自定定时——专为专注、助眠、冥想设计
        </p>
      </div>

      {sound ? (
        <WhiteNoisePlayer sound={sound} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <p className="text-sm text-white/50 mb-4">选择一个声音开始生成白噪音：</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {suitableSounds.map((s) => (
              <Link
                key={s.id}
                to={`/create/whitenoise?sound=${s.id}`}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/60 hover:border-amber-400/30 hover:text-amber-400 transition-all"
              >
                <span className="truncate block">
                  {s.isUserUpload && (
                    <span className="mr-1 rounded bg-amber-400/10 px-1 py-0.5 text-[10px] text-amber-400">我的</span>
                  )}
                  {s.name}
                </span>
                <span className="text-xs text-white/30">{s.category || '未分类'}</span>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/20">
            也可以从任意声音详情页点击"白噪音模式"直接进入
          </p>
        </div>
      )}
    </div>
  )
}
