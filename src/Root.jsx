import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import Home from './pages/Home'
import Library from './pages/Library'
import SoundDetail from './pages/SoundDetail'
import SoundMap from './pages/SoundMap'
import Create from './pages/Create'
import RhythmSeqPage from './pages/RhythmSeqPage'
import SoundFXPage from './pages/SoundFXPage'
import AISoundscapePage from './pages/AISoundscapePage'
import SpatialMixerPage from './pages/SpatialMixerPage'
import WhiteNoisePage from './pages/WhiteNoisePage'
import UserSpace from './pages/UserSpace'
import Upload from './pages/Upload'
import './index.css'

export default function Root() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<App />}>
            <Route index element={<Home />} />
            <Route path="library" element={<Library />} />
            <Route path="sound/:id" element={<SoundDetail />} />
            <Route path="map" element={<SoundMap />} />
            <Route path="create" element={<Create />} />
            <Route path="create/rhythm" element={<RhythmSeqPage />} />
            <Route path="create/fx" element={<SoundFXPage />} />
            <Route path="create/soundscape" element={<AISoundscapePage />} />
            <Route path="create/spatial" element={<SpatialMixerPage />} />
            <Route path="create/whitenoise" element={<WhiteNoisePage />} />
            <Route path="user/me" element={<UserSpace />} />
            <Route path="user/upload" element={<Upload />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
