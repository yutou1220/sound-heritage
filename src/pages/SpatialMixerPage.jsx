import { getLabSounds } from '../utils/sounds'
import SpatialMixer from '../components/SpatialMixer'
import { Link } from 'react-router-dom'

export default function SpatialMixerPage() {
  const allSounds = getLabSounds()

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <Link to="/create" className="text-sm text-white/40 hover:text-white transition-colors">← 返回声音实验室</Link>
        <h1 className="mt-3 text-3xl font-bold">🌐 3D 空间混音器</h1>
        <p className="mt-2 text-white/40">
          把声音放在三维空间中——在画布上拖拽声源位置，带耳机体验环绕立体声场
        </p>
      </div>
      <SpatialMixer sounds={allSounds} />
    </div>
  )
}
