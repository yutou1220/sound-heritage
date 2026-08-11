import { useRef, useEffect } from 'react'
import { getAudioContext, getAnalyser } from '../utils/audioEngine'

export default function SpectrumVisualizer() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')
    const analyser = getAnalyser()

    const W = canvas.width
    const H = canvas.height
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    function draw() {
      rafRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      // Clear with slight fade for motion blur effect
      ctx2d.fillStyle = 'rgba(15, 15, 15, 0.3)'
      ctx2d.fillRect(0, 0, W, H)

      const barCount = 128
      const barWidth = (W / barCount) * 0.85
      const gap = (W / barCount) * 0.15
      const step = Math.floor(bufferLength / barCount)

      // Gradient from amber to white
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255
        const barH = Math.max(2, value * H * 0.9)
        const x = i * (barWidth + gap)

        // Color gradient based on height
        const hue = 42 // amber
        const saturation = 80
        const lightness = 40 + value * 50
        ctx2d.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
        ctx2d.globalAlpha = 0.5 + value * 0.5

        // Rounded top
        const radius = Math.min(barWidth / 2, 2)
        ctx2d.beginPath()
        ctx2d.moveTo(x, H)
        ctx2d.lineTo(x, H - barH + radius)
        ctx2d.quadraticCurveTo(x, H - barH, x + radius, H - barH)
        ctx2d.lineTo(x + barWidth - radius, H - barH)
        ctx2d.quadraticCurveTo(x + barWidth, H - barH, x + barWidth, H - barH + radius)
        ctx2d.lineTo(x + barWidth, H)
        ctx2d.fill()
      }

      ctx2d.globalAlpha = 1
    }

    draw()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <canvas
        ref={canvasRef}
        width={600}
        height={140}
        className="w-full h-auto"
      />
    </div>
  )
}
