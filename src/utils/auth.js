import { createClient } from '@supabase/supabase-js'

// These are public keys - safe to include in frontend code
const SUPABASE_URL = 'https://your-project-id.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

let supabase = null

export function getSupabase() {
  if (!supabase) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    } catch (e) {
      console.warn('Supabase not configured yet, using localStorage fallback')
      return null
    }
  }
  return supabase
}

// Check if real Supabase is configured
export function isSupabaseConfigured() {
  return !SUPABASE_URL.includes('your-project-id')
}

// ========== LocalStorage fallback auth (works without backend) ==========

export function localRegister(email, password, name) {
  const users = JSON.parse(localStorage.getItem('sw_users') || '{}')
  if (users[email]) {
    return { success: false, error: '该邮箱已注册' }
  }
  users[email] = { email, password, name, createdAt: new Date().toISOString() }
  localStorage.setItem('sw_users', JSON.stringify(users))
  loginLocal(email, password)
  return { success: true }
}

export function loginLocal(email, password) {
  const users = JSON.parse(localStorage.getItem('sw_users') || '{}')
  const user = users[email]
  if (!user || user.password !== password) {
    return { success: false, error: '邮箱或密码错误' }
  }
  const session = { email: user.email, name: user.name, loginAt: Date.now() }
  localStorage.setItem('sw_session', JSON.stringify(session))
  return { success: true, user: session }
}

export function logoutLocal() {
  localStorage.removeItem('sw_session')
}

export function getSession() {
  const raw = localStorage.getItem('sw_session')
  if (!raw) return null
  const session = JSON.parse(raw)
  // Session expires after 7 days
  if (Date.now() - session.loginAt > 7 * 24 * 3600000) {
    localStorage.removeItem('sw_session')
    return null
  }
  return session
}

// ========== User data storage ==========

export function getUserFavorites() {
  const session = getSession()
  if (!session) return []
  const key = 'sw_favorites_' + session.email
  return JSON.parse(localStorage.getItem(key) || '[]')
}

export function addFavorite(soundId) {
  const session = getSession()
  if (!session) return false
  const key = 'sw_favorites_' + session.email
  const favs = JSON.parse(localStorage.getItem(key) || '[]')
  if (!favs.includes(soundId)) {
    favs.unshift(soundId)
    localStorage.setItem(key, JSON.stringify(favs))
  }
  return true
}

export function removeFavorite(soundId) {
  const session = getSession()
  if (!session) return false
  const key = 'sw_favorites_' + session.email
  let favs = JSON.parse(localStorage.getItem(key) || '[]')
  favs = favs.filter((id) => id !== soundId)
  localStorage.setItem(key, JSON.stringify(favs))
  return true
}

export function isFavorite(soundId) {
  const session = getSession()
  if (!session) return false
  const key = 'sw_favorites_' + session.email
  const favs = JSON.parse(localStorage.getItem(key) || '[]')
  return favs.includes(soundId)
}

export function getUserHistory() {
  const session = getSession()
  if (!session) return []
  const key = 'sw_history_' + session.email
  return JSON.parse(localStorage.getItem(key) || '[]')
}

export function addHistory(soundId) {
  const session = getSession()
  if (!session) return
  const key = 'sw_history_' + session.email
  let history = JSON.parse(localStorage.getItem(key) || '[]')
  history = history.filter((h) => h.id !== soundId)
  history.unshift({ id: soundId, time: Date.now() })
  // Keep last 100
  history = history.slice(0, 100)
  localStorage.setItem(key, JSON.stringify(history))
}

export function getUserUploads() {
  const session = getSession()
  if (!session) return []
  const key = 'sw_uploads_' + session.email
  return JSON.parse(localStorage.getItem(key) || '[]')
}

export function addUpload(soundData) {
  const session = getSession()
  if (!session) return false
  const key = 'sw_uploads_' + session.email
  const uploads = JSON.parse(localStorage.getItem(key) || '[]')
  uploads.unshift({ ...soundData, id: 'user_' + Date.now(), uploadedAt: new Date().toISOString() })
  localStorage.setItem(key, JSON.stringify(uploads))
  return true
}
