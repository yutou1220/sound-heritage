import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as echarts from 'echarts'
import { getAllSounds } from '../utils/sounds'

// Map province names from data to GeoJSON names
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

export default function SoundMap() {
  const chartRef = useRef(null)
  const instanceRef = useRef(null)
  const navigate = useNavigate()
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Load GeoJSON
    fetch('/china.json')
      .then((res) => res.json())
      .then((geoJson) => {
        echarts.registerMap('china', geoJson)
        setMapLoaded(true)
      })
      .catch((err) => console.error('Failed to load map:', err))
  }, [])

  useEffect(() => {
    if (!mapLoaded || !chartRef.current) return

    if (instanceRef.current) {
      instanceRef.current.dispose()
    }

    const chart = echarts.init(chartRef.current, null, { renderer: 'canvas' })
    instanceRef.current = chart

    // Count sounds per province
    const sounds = getAllSounds()
    const provinceData = {}
    sounds.forEach((s) => {
      const prov = extractProvince(s.region)
      if (prov) {
        provinceData[prov] = (provinceData[prov] || 0) + 1
      }
    })

    const mapData = Object.entries(provinceData).map(([name, value]) => ({
      name,
      value,
    }))

    // Build list of sounds per province for tooltip
    const provinceSounds = {}
    sounds.forEach((s) => {
      const prov = extractProvince(s.region)
      if (prov) {
        if (!provinceSounds[prov]) provinceSounds[prov] = []
        provinceSounds[prov].push(s)
      }
    })

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1a1a1a',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: (params) => {
          if (!params.data || params.data.value === undefined) return params.name
          const list = provinceSounds[params.name] || []
          const items = list.slice(0, 5).map((s) => `  ▶ ${s.name}`).join('<br/>')
          const more = list.length > 5 ? `<br/>  ... 还有 ${list.length - 5} 条` : ''
          return `<strong style="color:#f59e0b">${params.name}</strong> · ${list.length} 条声音<br/>${items}${more}`
        },
      },
      visualMap: {
        min: 0,
        max: Math.max(...mapData.map((d) => d.value), 1),
        text: ['多', '少'],
        realtime: false,
        calculable: true,
        inRange: { color: ['#1a1a1a', '#3d2e0a', '#f59e0b'] },
        textStyle: { color: '#fff6' },
        left: 'left',
        bottom: 20,
      },
      series: [
        {
          name: '非遗声音',
          type: 'map',
          map: 'china',
          roam: true,
          zoom: 1.2,
          center: [104.5, 36],
          scaleLimit: { min: 1, max: 5 },
          emphasis: {
            label: { show: true, color: '#f59e0b', fontSize: 14 },
            itemStyle: { areaColor: '#f59e0b', borderColor: '#fff' },
          },
          itemStyle: {
            borderColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1,
            areaColor: '#1a1a1a',
          },
          label: {
            show: true,
            color: 'rgba(255,255,255,0.3)',
            fontSize: 10,
          },
          data: mapData,
        },
      ],
    }

    chart.setOption(option)

    // Click handler
    chart.on('click', (params) => {
      if (params.componentType === 'series') {
        // Navigate to library filtered by region
        const provName = params.name
        for (const [short, full] of Object.entries(PROVINCE_MAP)) {
          if (full === provName) {
            navigate(`/library?region=${encodeURIComponent(short)}`)
            return
          }
        }
      }
    })

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      instanceRef.current = null
    }
  }, [mapLoaded, navigate])

  if (!mapLoaded) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">声音地图</h1>
          <p className="mt-2 text-white/40">加载地图中…</p>
        </div>
        <div className="flex h-[500px] items-center justify-center rounded-2xl border border-white/10 text-white/20">
          ⏳ 正在加载中国地图…
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">声音地图</h1>
        <p className="mt-2 text-white/40">
          在中国地图上漫游，听见每一寸土地的声音记忆
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div
          ref={chartRef}
          className="h-[600px] w-full"
        />
      </div>

      <p className="mt-4 text-center text-sm text-white/30">
        点击省份查看当地非遗声音 · 滚轮缩放地图
      </p>
    </div>
  )
}
