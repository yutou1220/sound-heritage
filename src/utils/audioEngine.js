let audioContext = null
let analyserNode = null

export function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

export function getAnalyser() {
  if (!analyserNode) {
    const ctx = getAudioContext()
    analyserNode = ctx.createAnalyser()
    analyserNode.fftSize = 256
    analyserNode.smoothingTimeConstant = 0.7
    analyserNode.connect(ctx.destination)
  }
  return analyserNode
}

// Connect an audio source node to the analyser and destination
export function connectSource(sourceNode) {
  const analyser = getAnalyser()
  const ctx = getAudioContext()
  sourceNode.connect(analyser)
  // analyser is already connected to destination
}
