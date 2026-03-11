import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import NotificationBanner from './components/NotificationBanner'
import Login from './pages/Login'
import Home from './pages/Home'
import Scores from './pages/Scores'
import ScoreEntry from './pages/ScoreEntry'
import Teams from './pages/Teams'
import Stats from './pages/Stats'
import Itinerary from './pages/Itinerary'
import Hotel from './pages/Hotel'
import Gallery from './pages/Gallery'
import Chat from './pages/Chat'
import Challenges from './pages/Challenges'
import Course from './pages/Course'

function AppShell() {
  const { player } = useAuth()

  if (!player) return <Login />

  return (
    <div className="flex flex-col h-full">
      <NotificationBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/scores"     element={<Scores />} />
          <Route path="/entry"      element={<ScoreEntry />} />
          <Route path="/teams"      element={<Teams />} />
          <Route path="/stats"      element={<Stats />} />
          <Route path="/schedule"   element={<Itinerary />} />
          <Route path="/hotel"      element={<Hotel />} />
          <Route path="/gallery"    element={<Gallery />} />
          <Route path="/chat"       element={<Chat />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/course"     element={<Course />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="h-full flex justify-center" style={{ background: '#060e06' }}>
          <div className="w-full max-w-[520px] h-full flex flex-col" style={{ background: '#0a1a0a' }}>
            <AppShell />
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
