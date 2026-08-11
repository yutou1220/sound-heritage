import { useState, useRef, useCallback } from 'react'
import { loadBuffer, createSource, getCtx } from '../utils/audioDSP'

export default function SpatialMixer({ sounds }) {
  const [placed, setPlaced] = useState([])
  const [draggingId, setDraggingId] = useState(null)
  const canvasRef = useRef(null)

  const addSound = async (sound) => {
    if (!sound.localAudio) return
    if (placed.find((p) => p.sound.id === sound.id)) return
    getCtx().resume()

    const buffer = await loadBuffer(sound.localAudio)
    const { source, output, gain } = createSource(buffer, {
      gain: 0.4, panX: 0, panZ: 0, loop: true,
    })
    output.connect(getCtx().destination)
    source.start(0)

    // Random starting position so they don't all stack
    const rx = 30 + Math.random() * 40
    const ry = 30 + Math.random() * 40
    setPlaced([...placed, { sound, x: rx, y: ry, gain: gain.gain, source }])
  }

  const removeAll = () => {
    placed.forEach((p) => { try { p.source.stop() } catch (_) {} })
    setPlaced([])
  }

  // Drag handlers — using mouse/touch on the canvas
  const getCanvasPos = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 50, y: 50 }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
  }, [])

  const handleCanvasDown = useCallback((e) => {
    // Only start drag if clicking on the canvas background (not on a ball)
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-bg')) {
      return // click on empty space, do nothing
    }
  }, [])

  const handleBallDown = useCallback((e, soundId) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingId(soundId)
  }, [])

  const handleMove = useCallback((e) => {
    if (!draggingId) return
    e.preventDefault()
    const { x, y } = getCanvasPos(e)
    setPlaced((prev) =>
      prev.map((p) => {
        if (p.sound.id !== draggingId) return p
        const panX = (x - 50) / 25
        const panZ = (y - 50) / 50
        const gainVal = 0.3 + (50 - Math.abs(y - 50)) / 100
        p.gain.value = gainVal
        return { ...p, x, y }
      })
    )
  }, [draggingId, getCanvasPos])

  const handleUp = useCallback(() => {
    setDraggingId(null)
  }, [])

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-8"
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchMove={handleMove}
      onTouchEnd={handleUp}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold">🌐 3D空间混音器</h3>
        <p className="mt-1 text-sm text-white/40">
          {draggingId
            ? '🖐 拖拽中…松开放置声源'
            : '拖拽球体改变声音的空间位置——带耳机体验环绕声场'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sound picker */}
        <div>
          <p className="mb-2 text-sm text-white/50">添加声源</p>
          <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
            {sounds.slice(0, 15).map((s) => (
              <button key={s.id} onClick={() => addSound(s)}
                disabled={placed.some((p) => p.sound.id === s.id)}
                className="rounded border border-white/10 px-2 py-1.5 text-left text-[11px] text-white/50 hover:border-amber-400/30 hover:text-amber-400 disabled:opacity-20">
                + {s.name.slice(0, 8)}
              </button>
            ))}
          </div>

          {placed.length > 0 && (
            <button onClick={removeAll}
              className="mt-3 w-full rounded-lg border border-red-400/20 py-1.5 text-xs text-red-400/60 hover:bg-red-400/5">
              清除全部
            </button>
          )}
        </div>

        {/* Spatial canvas */}
        <div className="md:col-span-2">
          <div
            ref={canvasRef}
            className="canvas-bg relative h-72 rounded-xl border border-white/10 bg-black/30 overflow-hidden cursor-crosshair select-none"
            style={{ touchAction: 'none' }}
          >
            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {[25, 50, 75].map((p) => (
                <div key={'v'+p} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: p + '%' }} />
              ))}
              {[25, 50, 75].map((p) => (
                <div key={'h'+p} className="absolute left-0 right-0 border-t border-white/5" style={{ top: p + '%' }} />
              ))}
            </div>

            {/* Labels */}
            <span className="absolute top-1 left-2 text-[10px] text-white/20 pointer-events-none">前方</span>
            <span className="absolute top-1 right-2 text-[10px] text-white/20 pointer-events-none">近</span>
            <span className="absolute bottom-1 left-2 text-[10px] text-white/20 pointer-events-none">左</span>
            <span className="absolute bottom-1 right-2 text-[10px] text-white/20 pointer-events-none">右</span>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400/30 pointer-events-none" />

            {/* Draggable sound balls */}
            {placed.map((p) => (
              <div
                key={p.sound.id}
                onMouseDown={(e) => handleBallDown(e, p.sound.id)}
                onTouchStart={(e) => handleBallDown(e, p.sound.id)}
                onDoubleClick={() => {
                  try { p.source.stop() } catch (_) {}
                  setPlaced(placed.filter((x) => x.sound.id !== p.sound.id))
                }}
                className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-sm transition-shadow ${
                  draggingId === p.sound.id
                    ? 'bg-amber-400/40 border-2 border-amber-400 shadow-lg shadow-amber-400/20 z-20 scale-110'
                    : 'bg-amber-400/15 border border-amber-400/30 hover:bg-amber-400/25 z-10'
                } ${draggingId ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ left: p.x + '%', top: p.y + '%' }}
                title={p.sound.name + '\n拖拽移动 · 双击移除'}
              >
                <span className="pointer-events-none">
                  {['🔨','🪵','🪨','🔔','💥','🎵','🔊'][placed.indexOf(p)] || '🔊'}
                </span>
              </div>
            ))}

            {/* Drop indicator */}
            {placed.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-white/10 text-sm">添加声源后拖拽球体移动位置</span>
              </div>
            )}
          </div>

          <p className="mt-2 text-center text-xs text-white/20">
            💡 拖拽球体移动声源位置 · 双击球体移除 · 带耳机体验环绕效果
          </p>

          {/* Active sounds list */}
          {placed.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {placed.map((p, i) => (
                <span key={p.sound.id} className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-white/40">
                  {['🔨','🪵','🪨','🔔','💥','🎵','🔊'][i] || '🔊'} {p.sound.name.slice(0, 10)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
