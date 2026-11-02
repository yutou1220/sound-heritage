import { useParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { getSoundById } from '../utils/sounds'
import { addHistory, addFavorite, removeFavorite, isFavorite } from '../utils/auth'
import { downloadPoster } from '../utils/poster'
import AudioPlayer from '../components/AudioPlayer'
import SpectrumVisualizer from '../components/SpectrumVisualizer'
import { useState } from 'react'

export default function SoundDetail() {
  const { id } = useParams()
  const sound = getSoundById(id)
  const [fav, setFav] = useState(false)

  useEffect(() => {
    if (id) {
      addHistory(id)
      setFav(isFavorite(id))
    }
  }, [id])

  if (!sound) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold">🔍</h1>
        <p className="mt-4 text-xl text-white/50">未找到该声音</p>
        <Link to="/library" className="mt-6 inline-block text-amber-400 hover:underline">
          返回声音库 →
        </Link>
      </div>
    )
  }

  const audioExt = sound.localAudio ? (sound.localAudio.split('.').pop() || 'mp3') : 'mp3'

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2 text-sm text-white/40">
        <Link to="/" className="hover:text-white">首页</Link>
        <span>/</span>
        <Link to="/library" className="hover:text-white">声音库</Link>
        <span>/</span>
        <span className="text-white/70">{sound.name}</span>
      </div>

      {/* Sound Header */}
      <div className="mb-10">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-400">
            {sound.category}
          </span>
          {sound.subcategory && (
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
              {sound.subcategory}
            </span>
          )}
          {sound.region && (
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
              📍 {sound.region}
            </span>
          )}
        </div>
        <h1 className="text-4xl font-bold">{sound.name}</h1>
        {/* Favorite button */}
        <button
          onClick={() => {
            if (fav) {
              removeFavorite(id)
              setFav(false)
            } else {
              addFavorite(id)
              setFav(true)
            }
          }}
          className={`mt-3 inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm transition-all ${
            fav
              ? 'border-red-400/30 bg-red-400/10 text-red-400'
              : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'
          }`}
        >
          {fav ? '❤ 已收藏' : '♡ 收藏'}
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left: Player + Visualizer */}
        <div className="lg:col-span-3">
          <div className="sticky top-24 space-y-6">
            {/* Audio Player */}
            <AudioPlayer sound={sound} />

            {/* Spectrum Visualizer */}
            <SpectrumVisualizer />

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Link
                to={`/create/whitenoise?sound=${sound.id}`}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/70 transition-colors hover:border-amber-400/30 hover:text-amber-400"
              >
                🎧 白噪音模式
              </Link>
              {sound.localAudio ? (
                <a
                  href={sound.localAudio}
                  download={`${sound.name}.${audioExt}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/70 transition-colors hover:border-amber-400/30 hover:text-amber-400"
                >
                  📥 下载采样
                </a>
              ) : (
                <button
                  disabled
                  title="该声音暂未导入本地音频"
                  className="cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/30"
                >
                  📥 下载采样
                </button>
              )}
              <button
                onClick={() => downloadPoster(sound)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition-colors hover:border-amber-400/30 hover:text-amber-400"
              >
                🖼 生成海报
              </button>
            </div>
          </div>
        </div>

        {/* Right: Info Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cultural Story Card */}
          {sound.culturalStory && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.03] p-6">
              {sound.culturalStory.image && (
                <div className="mb-4 overflow-hidden rounded-xl">
                  <img
                    src={sound.culturalStory.image}
                    alt={sound.culturalStory.title}
                    className="w-full h-40 object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
              <h3 className="text-lg font-semibold text-amber-400 mb-3">
                {sound.culturalStory.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/70">
                {sound.culturalStory.story}
              </p>
              {sound.culturalStory.link && (
                <a
                  href={sound.culturalStory.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
                >
                  查看更多资料 →
                </a>
              )}
            </div>
          )}

          {/* Sound Info */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-lg font-semibold mb-4">声音信息</h3>
            <dl className="space-y-3 text-sm">
              {sound.description && (
                <div>
                  <dt className="text-white/30">内容描述</dt>
                  <dd className="mt-1 text-white/70 leading-relaxed">{sound.description}</dd>
                </div>
              )}
              {sound.soundCharacteristic && (
                <div>
                  <dt className="text-white/30">声音特点</dt>
                  <dd className="mt-1 text-white/70 leading-relaxed">{sound.soundCharacteristic}</dd>
                </div>
              )}
              <div>
                <dt className="text-white/30">来源平台</dt>
                <dd className="mt-1 text-white/70">{sound.source || '未知'}</dd>
              </div>
              <div>
                <dt className="text-white/30">使用协议</dt>
                <dd className="mt-1 text-white/70">{sound.license || '未知'}</dd>
              </div>
            </dl>
          </div>

          {/* Keywords */}
          {sound.keywords && sound.keywords.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-lg font-semibold mb-3">关键词</h3>
              <div className="flex flex-wrap gap-2">
                {sound.keywords.map((kw, i) => (
                  <Link
                    key={i}
                    to={`/library?q=${encodeURIComponent(kw)}`}
                    className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50 transition-colors hover:bg-amber-400/10 hover:text-amber-400"
                  >
                    {kw}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Source Link */}
          {sound.url && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-lg font-semibold mb-3">源链接</h3>
              <a
                href={sound.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm text-amber-400 hover:underline"
              >
                {sound.url}
              </a>
              <p className="mt-2 text-xs text-white/30">点击跳转至源网站收听原始音频</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
