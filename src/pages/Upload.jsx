import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addUpload } from '../utils/auth'
import { getCategories } from '../utils/sounds'

export default function Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const categories = getCategories()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [region, setRegion] = useState('')
  const [description, setDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">请先登录</h1>
        <Link to="/" className="inline-block rounded-xl bg-amber-400 px-6 py-3 font-medium text-black hover:bg-amber-300">
          返回首页
        </Link>
      </div>
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)

    // Store audio file as data URL if provided
    let audioDataUrl = null
    if (audioFile) {
      const reader = new FileReader()
      reader.onload = () => {
        audioDataUrl = reader.result
        saveUpload(audioDataUrl)
      }
      reader.readAsDataURL(audioFile)
    } else {
      saveUpload(null)
    }
  }

  const saveUpload = (audioDataUrl) => {
    addUpload({
      name,
      category,
      region,
      description,
      keywords: keywords.split(/[,，、]/).map((k) => k.trim()).filter(Boolean),
      audioDataUrl,
      originalFileName: audioFile?.name || null,
    })
    setDone(true)
    setTimeout(() => navigate('/user/me'), 1500)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">上传成功！</h1>
        <p className="text-white/40">正在跳转到个人空间…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <Link to="/user/me" className="text-sm text-white/40 hover:text-white">← 返回个人空间</Link>
        <h1 className="mt-3 text-3xl font-bold">上传声音</h1>
        <p className="mt-2 text-white/40">分享你采集的非遗声音，让它被更多人听见</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-white/60 mb-1">声音名称 *</label>
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)} required
            placeholder="如：云南白族扎染声音"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-amber-400/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">分类</label>
            <select
              value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-white outline-none focus:border-amber-400/50"
            >
              <option value="">选择分类</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name} className="text-white bg-[#1a1a1a]">{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">地域</label>
            <input
              type="text" value={region} onChange={(e) => setRegion(e.target.value)}
              placeholder="如：云南·大理"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-amber-400/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">描述</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="描述声音的来源、录制场景、文化背景……"
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-amber-400/50 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">关键词</label>
          <input
            type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)}
            placeholder="用逗号分隔，如：扎染,白族,布料,手工"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-amber-400/50"
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">音频文件</label>
          <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
            {audioFile ? (
              <div>
                <p className="text-sm text-white">{audioFile.name}</p>
                <p className="mt-1 text-xs text-white/30">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
                <button
                  type="button"
                  onClick={() => setAudioFile(null)}
                  className="mt-2 text-xs text-amber-400 hover:underline"
                >
                  重新选择
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <span className="text-3xl">🎤</span>
                <p className="mt-2 text-sm text-white/40">点击选择 MP3/WAV 文件</p>
                <input
                  type="file" accept="audio/*" className="hidden"
                  onChange={(e) => setAudioFile(e.target.files[0])}
                />
              </label>
            )}
          </div>
        </div>

        <button
          type="submit" disabled={submitting || !name.trim()}
          className="w-full rounded-xl bg-amber-400 py-3.5 font-medium text-black transition-all hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting ? '上传中…' : '提交上传'}
        </button>
      </form>
    </div>
  )
}
