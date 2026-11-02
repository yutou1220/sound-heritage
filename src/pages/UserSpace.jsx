import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserFavorites, getUserHistory, getUserUploads, removeFavorite } from '../utils/auth'
import { getAllSounds } from '../utils/sounds'

export default function UserSpace() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('favorites')

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">请先登录</h1>
        <p className="text-white/40 mb-6">登录后即可查看收藏、历史记录和上传管理</p>
        <Link to="/" className="inline-block rounded-xl bg-amber-400 px-6 py-3 font-medium text-black hover:bg-amber-300">
          返回首页
        </Link>
      </div>
    )
  }

  const favorites = getUserFavorites()
  const history = getUserHistory()
  const uploads = getUserUploads()
  const allSounds = getAllSounds()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👋 {user.name || user.email}</h1>
          <p className="mt-1 text-white/40">个人空间</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          退出登录
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 border-b border-white/10">
        {[
          { key: 'favorites', label: '❤ 收藏', count: favorites.length },
          { key: 'history', label: '🕐 历史', count: history.length },
          { key: 'uploads', label: '📤 我的上传', count: uploads.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-[1px] ${
              activeTab === tab.key
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <p className="py-12 text-center text-white/30">还没有收藏任何声音，去<a href="/library" className="text-amber-400 hover:underline">声音库</a>逛逛吧</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((soundId) => {
                const sound = allSounds.find((s) => s.id === soundId)
                if (!sound) return null
                return (
                  <div key={soundId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <Link to={'/sound/' + soundId} className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white hover:text-amber-400">{sound.name}</p>
                      <p className="text-xs text-white/40">{sound.category}</p>
                    </Link>
                    <button
                      onClick={() => { removeFavorite(soundId); window.location.reload() }}
                      className="shrink-0 rounded-lg p-1.5 text-white/30 hover:text-red-400 hover:bg-white/5"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <p className="py-12 text-center text-white/30">还没有浏览记录</p>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => {
                const sound = allSounds.find((s) => s.id === entry.id)
                if (!sound) return null
                return (
                  <Link
                    key={entry.id + entry.time}
                    to={'/sound/' + entry.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 hover:bg-white/[0.04] transition-colors"
                  >
                    <div>
                      <p className="text-sm text-white">{sound.name}</p>
                      <p className="text-xs text-white/40">{sound.category}</p>
                    </div>
                    <span className="text-xs text-white/20">
                      {new Date(entry.time).toLocaleDateString('zh-CN')}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Uploads Tab */}
      {activeTab === 'uploads' && (
        <div>
          <Link
            to="/user/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-medium text-black hover:bg-amber-300 mb-6"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            上传新声音
          </Link>

          {uploads.length === 0 ? (
            <p className="py-12 text-center text-white/30">还没有上传过声音</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {uploads.map((sound) => (
                <div key={sound.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-sm font-medium text-white">{sound.name}</p>
                  <p className="mt-1 text-xs text-white/40">{sound.category || '未分类'} · {sound.region || '未知区域'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-white/20">{new Date(sound.uploadedAt).toLocaleDateString('zh-CN')}</span>
                    {sound.audioDataUrl ? (
                      <Link
                        to={`/create/whitenoise?sound=${sound.id}`}
                        className="text-xs text-amber-400 hover:underline"
                      >
                        🎛 处理 →
                      </Link>
                    ) : (
                      <span className="text-xs text-white/20">未附音频</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
