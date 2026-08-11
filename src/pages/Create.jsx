import { getAllSounds } from '../utils/sounds'
import { Link } from 'react-router-dom'

export default function Create() {
  const allSounds = getAllSounds()
  const shortCount = allSounds.filter((s) =>
    /打|敲|锤|锻|鼓|锣|织|锯|刨|击|碎|裂|碰|撞|摔|砸|弹|响|叫|鸣|钟|铃/.test(
      (s.name || '') + (s.keywords || []).join('')
    )
  ).length
  const ambientCount = allSounds.filter((s) =>
    /风|水|溪|雨|流|吹|飘|林|叶|沙|燃|烧|火|炉|唱|腔|曲|歌/.test(
      (s.name || '') + (s.keywords || []).join('')
    )
  ).length

  const modules = [
    {
      icon: '🎧',
      title: '白噪音生成器',
      desc: '循环播放非遗声音，叠加雨声/风声/溪流，定时关闭——专注助眠利器',
      to: '/create/whitenoise',
      color: 'from-cyan-500/10 to-cyan-500/5',
      border: 'border-cyan-400/30',
      count: ambientCount,
    },
    {
      icon: '🥁',
      title: '节奏编排器',
      desc: '把短声音变成打击乐——网格编排、打击垫即兴、键盘演奏三种模式',
      to: '/create/rhythm',
      color: 'from-amber-500/10 to-amber-500/5',
      border: 'border-amber-400/30',
      count: shortCount,
    },
    {
      icon: '🎚',
      title: '声音特效处理器',
      desc: '滤波、失真、延迟、比特粉碎——把非遗声音变成电子音色',
      to: '/create/fx',
      color: 'from-purple-500/10 to-purple-500/5',
      border: 'border-purple-400/30',
      count: shortCount,
    },
    {
      icon: '🤖',
      title: 'AI 音景生成',
      desc: '勾选短声音，AI自动拼接成有起承转合的声音场景',
      to: '/create/soundscape',
      color: 'from-emerald-500/10 to-emerald-500/5',
      border: 'border-emerald-400/30',
      count: ambientCount,
    },
    {
      icon: '🌐',
      title: '3D 空间混音器',
      desc: '把声音放在三维空间中——带耳机体验环绕声场',
      to: '/create/spatial',
      color: 'from-rose-500/10 to-rose-500/5',
      border: 'border-rose-400/30',
      count: allSounds.length,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">声音实验室</h1>
        <p className="mt-2 text-white/40">
          让非遗声音变废为宝——选择你想要的创意玩法
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {modules.map((mod) => (
          <Link
            key={mod.to}
            to={mod.to}
            className={`group relative overflow-hidden rounded-2xl border ${mod.border} bg-gradient-to-br ${mod.color} p-8 transition-all hover:border-white/30 hover:shadow-xl hover:-translate-y-1`}
          >
            <span className="text-4xl">{mod.icon}</span>
            <h3 className="mt-4 text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
              {mod.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">{mod.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-white/20">{mod.count} 条可用声音</span>
              <span className="text-sm text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                进入 →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
