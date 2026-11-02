import { useState } from 'react'
import { Link } from 'react-router-dom'
import { searchSounds, getCategories, getAllSounds } from '../utils/sounds'

// Compact province map for the mini-map on homepage
const PROVINCE_MAP = {
  '北京': '北京市', '上海': '上海市', '天津': '天津市', '重庆': '重庆市',
  '河北': '河北省', '山西': '山西省', '辽宁': '辽宁省', '吉林': '吉林省',
  '黑龙江': '黑龙江省', '江苏': '江苏省', '浙江': '浙江省', '安徽': '安徽省',
  '福建': '福建省', '江西': '江西省', '山东': '山东省', '河南': '河南省',
  '湖北': '湖北省', '湖南': '湖南省', '广东': '广东省', '海南': '海南省',
  '四川': '四川省', '贵州': '贵州省', '云南': '云南省', '陕西': '陕西省',
  '甘肃': '甘肃省', '青海': '青海省', '台湾': '台湾省',
  '内蒙古': '内蒙古自治区', '广西': '广西壮族自治区', '西藏': '西藏自治区',
  '宁夏': '宁夏回族自治区', '新疆': '新疆维吾尔自治区',
  '香港': '香港特别行政区', '澳门': '澳门特别行政区',
}

function extractProvince(region) {
  if (!region) return null
  for (const [short, full] of Object.entries(PROVINCE_MAP)) {
    if (region.includes(short)) return full
  }
  return null
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const searchResults = searchQuery ? searchSounds(searchQuery).slice(0, 6) : []
  const categories = getCategories()
  const sounds = getAllSounds()

  // Count sounds per province
  const provinceData = {}
  sounds.forEach((s) => {
    const prov = extractProvince(s.region)
    if (prov) provinceData[prov] = (provinceData[prov] || 0) + 1
  })

  return (
    <div>
      {/* Hero + Search */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/5 to-transparent pointer-events-none" />
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-amber-400/[0.02] blur-[100px] pointer-events-none" />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-amber-400 animate-fade-in">
            声纹遗产库
          </p>
          <h1 className="mb-4 text-5xl font-bold leading-tight tracking-tight md:text-6xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            听见正在消失的
            <br />
            <span className="text-amber-400">中国声音</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/50 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            非遗声音 · 覆盖手工艺、戏曲、民歌、日常生活
            <br />
            不只是聆听，更是发现、创作与传承
          </p>

          {/* Search Box */}
          <div className="relative mx-auto max-w-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={'搜索声音名称、特色、地域……如「打铁」「侗族」「河北」'}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white placeholder-white/30 outline-none transition-all focus:border-amber-400/50 focus:bg-white/[0.07]"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-10 rounded-xl border border-white/10 bg-[#1a1a1a] p-2 shadow-2xl">
                {searchResults.map((s) => (
                  <Link
                    key={s.id}
                    to={`/sound/${s.id}`}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="shrink-0 text-sm text-amber-400">▶</span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{s.name}</p>
                      <p className="text-xs text-white/40">
                        {s.category}{s.region ? ` · ${s.region}` : ''}
                      </p>
                    </div>
                  </Link>
                ))}
                <Link
                  to={`/library?q=${encodeURIComponent(searchQuery)}`}
                  className="block rounded-lg px-4 py-2 text-center text-sm text-amber-400 transition-colors hover:bg-white/5"
                >
                  查看全部搜索结果 →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Entry Cards */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold">探索声音的四种方式</h2>
          <p className="mt-2 text-white/40">发现 · 转化 · 创作 · 传承</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {[
            {
              icon: '🗺️',
              title: '声音地图',
              desc: '在中国地图上漫游，听见每一寸土地的声音记忆',
              to: '/map',
              color: 'from-emerald-500/10 to-emerald-500/5',
            },
            {
              icon: '📚',
              title: '声音库',
              desc: '浏览精选非遗声音，分类筛选、自由探索',
              to: '/library',
              color: 'from-sky-500/10 to-sky-500/5',
            },
            {
              icon: '🎛️',
              title: '声音实验室',
              desc: '将非遗声音变成白噪音、采样素材、互动装置',
              to: '/create',
              color: 'from-purple-500/10 to-purple-500/5',
            },
            {
              icon: '🤖',
              title: 'AI 音景生成',
              desc: '勾选非遗声音，自动拼成一段有起承转合的场景',
              to: '/create/soundscape',
              color: 'from-emerald-500/10 to-emerald-500/5',
            },
          ].map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${card.color} p-6 transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:-translate-y-1`}
            >
              <span className="text-3xl">{card.icon}</span>
              <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {card.desc}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-amber-400 opacity-0 transition-opacity group-hover:opacity-100">
                进入 →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* China Map Section */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold">声音地图</h2>
          <p className="mt-2 text-white/40">点击省份探寻当地的声音记忆</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <MiniChinaMap provinceData={provinceData} />
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/map"
            className="inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            查看完整地图 →
          </Link>
        </div>
      </section>

      {/* Category Quick Links */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="mb-6 text-center text-xl font-bold">按分类浏览</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.slice(0, 10).map((cat) => (
            <Link
              key={cat.name}
              to={`/library?category=${encodeURIComponent(cat.name)}`}
              className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/60 transition-all hover:border-amber-400/30 hover:text-amber-400 hover:bg-amber-400/5"
            >
              {cat.name}
              <span className="ml-2 text-white/20">{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Story Cards */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold">精选声音故事</h2>
          <p className="mt-2 text-white/40">每一条声音背后，都是一个人、一门手艺、一段记忆</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          {getAllSounds()
            .filter((s) => s.description || s.soundCharacteristic)
            .slice(0, 6)
            .map((sound) => (
              <Link
                key={sound.id}
                to={`/sound/${sound.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all duration-300 hover:border-amber-400/20 hover:bg-white/[0.04] hover:-translate-y-1"
              >
                {/* Card image */}
                <div className="h-32 overflow-hidden">
                  {sound.culturalStory?.image ? (
                    <img
                      src={sound.culturalStory.image}
                      alt={sound.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                  ) : null}
                  <div
                    className={`h-full items-center justify-center bg-gradient-to-r from-amber-400/5 via-amber-400/10 to-transparent ${sound.culturalStory?.image ? 'hidden' : 'flex'}`}
                  >
                    <span className="text-sm tracking-[0.3em] text-amber-400/40">
                      ∿∿∿∿∿∿∿∿
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                    {sound.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50">
                    {sound.description || sound.soundCharacteristic || '暂无描述'}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-4">
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/40">
                      {sound.category}
                    </span>
                    {sound.region && (
                      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/40">
                        📍 {sound.region}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 px-6 py-8">
        <div className="mx-auto max-w-7xl text-center">
          <VisitorCounter />
          <p className="mt-3 text-xs text-white/20">
            声纹遗产库 © 2026 — 听见正在消失的中国声音
          </p>
        </div>
      </footer>
    </div>
  )
}

// Visit counter component
function VisitorCounter() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('sw_visit_count')
    let visits = stored ? parseInt(stored) : 0
    const lastVisit = localStorage.getItem('sw_last_visit')
    const now = Date.now()
    const hourAgo = now - 3600000

    if (!lastVisit || parseInt(lastVisit) < hourAgo) {
      visits += 1
      localStorage.setItem('sw_visit_count', visits.toString())
      localStorage.setItem('sw_last_visit', now.toString())
    }
    setCount(visits)
  }, [])

  if (count === null) return null

  return (
    <p className="text-sm text-white/30">
      <span className="inline-flex items-center gap-1.5">
        <svg className="h-4 w-4 text-amber-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        累计访问 <span className="font-mono text-amber-400/70">{count.toLocaleString()}</span> 次
      </span>
    </p>
  )
}

// Mini China map component for homepage
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as echarts from 'echarts'

function MiniChinaMap({ provinceData }) {
  const chartRef = useRef(null)
  const navigate = useNavigate()
  const [geoLoaded, setGeoLoaded] = useState(false)

  useEffect(() => {
    fetch('/china.json')
      .then((res) => res.json())
      .then((geo) => {
        echarts.registerMap('china', geo)
        setGeoLoaded(true)
      })
  }, [])

  useEffect(() => {
    if (!geoLoaded || !chartRef.current) return

    const chart = echarts.init(chartRef.current, null, { renderer: 'canvas' })
    const mapData = Object.entries(provinceData).map(([name, value]) => ({ name, value }))
    const maxVal = Math.max(...mapData.map((d) => d.value), 1)

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1a1a1a',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (p) =>
          p.data?.value
            ? `<strong style="color:#f59e0b">${p.name}</strong> · ${p.data.value} 条声音`
            : p.name,
      },
      visualMap: {
        show: false,
        min: 0,
        max: maxVal,
        inRange: { color: ['#1a1a1a', '#3d2e0a', '#f59e0b'] },
      },
      series: [
        {
          type: 'map',
          map: 'china',
          roam: false,
          zoom: 1.15,
          center: [104.5, 36],
          emphasis: {
            label: { show: true, color: '#f59e0b', fontSize: 12 },
            itemStyle: { areaColor: '#f59e0b', borderColor: '#fff' },
          },
          itemStyle: {
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            areaColor: '#1a1a1a',
          },
          label: { show: false },
          data: mapData,
        },
      ],
    })

    chart.on('click', (params) => {
      if (params.componentType === 'series' && params.name) {
        for (const [short, full] of Object.entries(PROVINCE_MAP)) {
          if (full === params.name) {
            navigate(`/library?region=${encodeURIComponent(short)}`)
            return
          }
        }
        navigate('/map')
      }
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
    }
  }, [geoLoaded, provinceData, navigate])

  return (
    <div
      ref={chartRef}
      className="h-[420px] w-full"
    />
  )
}
