import { getLabSounds } from '../utils/sounds'
import AISoundscape from '../components/AISoundscape'
import { Link } from 'react-router-dom'

export default function AISoundscapePage() {
  const labSounds = getLabSounds()
  const myUploads = labSounds.filter((s) => s.isUserUpload)
  const builtin = labSounds.filter((s) => !s.isUserUpload)
  const ambientSounds = builtin.filter((s) =>
    /风|水|溪|雨|流|吹|飘|林|叶|沙|燃|烧|火|炉|唱|腔|曲|歌/.test(
      (s.name || '') + (s.keywords || []).join('')
    )
  )
  const sounds = [...myUploads, ...(ambientSounds.length > 0 ? ambientSounds : builtin)]

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <Link to="/create" className="text-sm text-white/40 hover:text-white transition-colors">← 返回声音实验室</Link>
        <h1 className="mt-3 text-3xl font-bold">🤖 AI 音景生成</h1>
        <p className="mt-2 text-white/40">
          勾选短声音，AI自动拼接成一段有起承转合的声音场景
        </p>
      </div>
      <AISoundscape sounds={sounds} />
    </div>
  )
}
