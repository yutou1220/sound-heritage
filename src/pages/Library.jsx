import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getAllSounds, getCategories, searchSounds } from '../utils/sounds'

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

export default function Library() {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category') || ''
  const initialQuery = searchParams.get('q') || ''
  const initialRegion = searchParams.get('region') || ''

  const [query, setQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedRegion, setSelectedRegion] = useState(initialRegion)
  const [page, setPage] = useState(1)
  const PER_PAGE = 24

  const categories = getCategories()
  const allSounds = getAllSounds()

  const filtered = useMemo(() => {
    let result = allSounds
    if (query) {
      result = searchSounds(query)
    }
    if (selectedCategory) {
      result = result.filter((s) => s.category === selectedCategory)
    }
    if (selectedRegion) {
      const fullName = PROVINCE_MAP[selectedRegion] || selectedRegion
      result = result.filter(
        (s) => s.region && (s.region.includes(selectedRegion) || s.region.includes(fullName))
      )
    }
    return result
  }, [query, selectedCategory, selectedRegion])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">声音库</h1>
        <p className="mt-2 text-white/40">
          按分类、地域、关键词自由探索
        </p>
      </div>

      {/* Search + Filter Bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="搜索声音名称、特色、关键词……"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-white placeholder-white/30 outline-none transition-all focus:border-amber-400/50"
        />
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value)
            setPage(1)
          }}
          className="rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-3 text-white outline-none transition-all focus:border-amber-400/50"
        >
          <option value="" className="text-white bg-[#1a1a1a]">全部分类</option>
          {categories.map((cat) => (
            <option key={cat.name} value={cat.name} className="text-white bg-[#1a1a1a]">
              {cat.name} ({cat.count})
            </option>
          ))}
        </select>
        {selectedRegion && (
          <button
            onClick={() => setSelectedRegion('')}
            className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-amber-400 whitespace-nowrap"
          >
            📍 {selectedRegion}
            <span className="hover:text-white transition-colors">✕</span>
          </button>
        )}
      </div>

      {/* Sound Cards Grid */}
      {paged.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paged.map((sound) => (
              <Link
                key={sound.id}
                to={`/sound/${sound.id}`}
                className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-amber-400/30 hover:bg-white/[0.04]"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                  🔊
                </div>
                <h3 className="font-medium text-white group-hover:text-amber-400 transition-colors">
                  {sound.name}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">
                    {sound.category}
                  </span>
                  {sound.region && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">
                      {sound.region}
                    </span>
                  )}
                </div>
                {sound.subcategory && (
                  <p className="mt-2 text-xs text-white/30">{sound.subcategory}</p>
                )}
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    page === i + 1
                      ? 'bg-amber-400 text-black'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 text-white/30">
          没有找到匹配的声音，试试其他关键词？
        </div>
      )}
    </div>
  )
}
