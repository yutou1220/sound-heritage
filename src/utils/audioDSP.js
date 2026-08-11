// Audio DSP utility functions for sound lab modules

let audioCtx = null
export function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

// Load audio file into buffer
export async function loadBuffer(url) {
  const ctx = getCtx()
  const resp = await fetch(url)
  const arrayBuffer = await resp.arrayBuffer()
  return ctx.decodeAudioData(arrayBuffer)
}

// Create a buffer source node with optional effects chain
export function createSource(buffer, opts = {}) {
  const ctx = getCtx()
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = opts.playbackRate || 1
  source.loop = opts.loop || false

  let lastNode = source

  // Gain
  const gain = ctx.createGain()
  gain.gain.value = opts.gain ?? 0.7
  lastNode.connect(gain)
  lastNode = gain

  // Filter
  if (opts.filterType) {
    const filter = ctx.createBiquadFilter()
    filter.type = opts.filterType
    filter.frequency.value = opts.filterFreq || 1000
    filter.Q.value = opts.filterQ || 1
    lastNode.connect(filter)
    lastNode = filter
  }

  // Delay
  if (opts.delayTime && opts.delayFeedback) {
    const delay = ctx.createDelay(2)
    delay.delayTime.value = opts.delayTime
    const feedback = ctx.createGain()
    feedback.gain.value = opts.delayFeedback
    delay.connect(feedback)
    feedback.connect(delay)
    lastNode.connect(delay)
    lastNode = delay
  }

  // Distortion via Waveshaper
  if (opts.distortion) {
    const shaper = ctx.createWaveShaper()
    shaper.curve = makeDistortionCurve(opts.distortion)
    lastNode.connect(shaper)
    lastNode = shaper
  }

  // Panner for spatial audio
  if (opts.panX !== undefined || opts.panZ !== undefined) {
    const panner = ctx.createPanner()
    panner.panningModel = 'HRTF'
    panner.distanceModel = 'inverse'
    panner.refDistance = 1
    panner.positionX.value = opts.panX || 0
    panner.positionY.value = opts.panY || 0
    panner.positionZ.value = opts.panZ || 0
    lastNode.connect(panner)
    lastNode = panner
  }

  return { source, output: lastNode, gain }
}

function makeDistortionCurve(amount) {
  const samples = 44100
  const curve = new Float32Array(samples)
  const deg = Math.PI / 180
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
  }
  return curve
}

// Schedule a buffer to play at a specific time
export function schedulePlay(buffer, when, opts = {}) {
  const ctx = getCtx()
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = opts.rate || 1

  const gain = ctx.createGain()
  gain.gain.value = opts.gain ?? 0.7

  let lastNode = source
  if (opts.filterFreq) {
    const filter = ctx.createBiquadFilter()
    filter.type = opts.filterType || 'lowpass'
    filter.frequency.value = opts.filterFreq
    lastNode.connect(filter)
    lastNode = filter
  }
  lastNode.connect(gain)
  gain.connect(ctx.destination)
  source.start(when, opts.offset || 0, opts.duration)
  return { source, gain }
}

// Render a rhythm pattern to an offline buffer
export async function renderRhythm(buffers, pattern, bpm, barCount) {
  const ctx = getCtx()
  const beatDuration = 60 / bpm
  const totalDuration = barCount * 16 * beatDuration / 4  // 16 steps per bar, 4 beats per bar
  const stepDuration = beatDuration / 4

  const offlineCtx = new OfflineAudioContext(2, ctx.sampleRate * totalDuration, ctx.sampleRate)

  pattern.forEach((track, trackIdx) => {
    if (!buffers[trackIdx]) return
    track.forEach((active, stepIdx) => {
      if (!active) return
      const source = offlineCtx.createBufferSource()
      source.buffer = buffers[trackIdx]
      const gain = offlineCtx.createGain()
      gain.gain.value = 0.6
      source.connect(gain)
      gain.connect(offlineCtx.destination)
      source.start(stepIdx * stepDuration)
    })
  })

  return offlineCtx.startRendering()
}
