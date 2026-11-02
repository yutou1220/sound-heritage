// 生成可分享的非遗声音海报（canvas → PNG 下载）
export function downloadPoster(sound) {
  const W = 1080
  const H = 1440
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const font = (weight, size) =>
    `${weight} ${size}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#181818')
  bg.addColorStop(0.55, '#0f0f0f')
  bg.addColorStop(1, '#1a1206')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 顶部光晕
  const glow = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, 460)
  glow.addColorStop(0, 'rgba(245, 158, 11, 0.10)')
  glow.addColorStop(1, 'rgba(245, 158, 11, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // 品牌
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(245, 158, 11, 0.95)'
  ctx.font = font(600, 40)
  ctx.fillText('声纹遗产库', 72, 100)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.font = font(400, 22)
  ctx.fillText('INTANGIBLE SOUND ARCHIVE', 72, 136)

  // 声纹波形装饰
  const cy = H * 0.42
  for (let layer = 0; layer < 7; layer++) {
    ctx.beginPath()
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.28 - layer * 0.033})`
    ctx.lineWidth = layer === 0 ? 3 : 2
    const amp = 54 + layer * 30
    const freq = 0.016 + layer * 0.005
    const phase = layer * 0.9
    for (let x = 0; x <= W; x += 3) {
      const t = x * freq + phase
      const y = cy + Math.sin(t) * amp * (0.55 + 0.45 * Math.sin(t * 0.33))
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // 声音名（长名自动换行）
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  const name = sound.name || '未命名声音'
  if (name.length > 11) {
    ctx.font = font(700, 60)
    const mid = Math.ceil(name.length / 2)
    ctx.fillText(name.slice(0, mid), W / 2, H * 0.66)
    ctx.fillText(name.slice(mid), W / 2, H * 0.66 + 84)
  } else {
    ctx.font = font(700, 76)
    ctx.fillText(name, W / 2, H * 0.66)
  }

  // 类别 + 地域
  ctx.fillStyle = 'rgba(245, 158, 11, 0.9)'
  ctx.font = font(500, 30)
  ctx.fillText(sound.category || '', W / 2, H * 0.76)
  if (sound.region) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.font = font(400, 28)
    ctx.fillText('📍 ' + sound.region, W / 2, H * 0.76 + 52)
  }

  // 底部
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
  ctx.font = font(300, 26)
  ctx.fillText('听见正在消失的中国声音', W / 2, H - 100)
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(72, H - 64)
  ctx.lineTo(W - 72, H - 64)
  ctx.stroke()

  // 导出下载
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sound.name || '声纹海报'}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}
