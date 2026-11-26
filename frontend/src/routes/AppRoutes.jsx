import { lazy } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useApp } from '../context/AppContext'

const Home = lazy(() => import('../pages/Home/HomePage'))
const AICompanion = lazy(() => import('../pages/AICompanion/AICompanionPage'))
const Explore = lazy(() => import('../pages/Explore/ExplorePage'))
const Connect = lazy(() => import('../pages/Connect/ConnectPage'))
const ProfessionalProfile = lazy(() => import('../pages/Connect/ProfessionalProfilePage'))
const Booking = lazy(() => import('../pages/Connect/BookingPage'))
const Session = lazy(() => import('../pages/Connect/SessionPage'))
const Rhythm = lazy(() => import('../pages/Rhythm/RhythmPage'))
const Routine = lazy(() => import('../pages/Rhythm/RoutinePage'))
const Sleep = lazy(() => import('../pages/Sleep/SleepPage'))
const Pause = lazy(() => import('../pages/Pause/PausePage'))
const Breathe = lazy(() => import('../pages/Pause/BreathePage'))
const Grounding = lazy(() => import('../pages/Pause/GroundingPage'))
const Relax = lazy(() => import('../pages/Pause/RelaxPage'))
const Game = lazy(() => import('../pages/Pause/GamePage'))
const Clarity = lazy(() => import('../pages/Clarity/ClarityPage'))
const TacWizard = lazy(() => import('../pages/Clarity/TacWizardPage'))
const Decision = lazy(() => import('../pages/Clarity/DecisionPage'))
const Pulse = lazy(() => import('../pages/Pulse/PulsePage'))
const Journal = lazy(() => import('../pages/Journal/JournalPage'))
const Insights = lazy(() => import('../pages/Insights/InsightsPage'))
const Learn = lazy(() => import('../pages/Learn/LearnPage'))
const Article = lazy(() => import('../pages/Learn/ArticlePage'))
const Profile = lazy(() => import('../pages/Profile/ProfilePage'))
const Settings = lazy(() => import('../pages/Settings/SettingsPage'))
const Notifications = lazy(() => import('../pages/Notifications/NotificationsPage'))
const Welcome = lazy(() => import('../pages/Auth/WelcomePage'))
const NotFound = lazy(() => import('../pages/NotFoundPage'))

function RequireAuth({ children }) {
  const { authed } = useApp()
  const loc = useLocation()
  if (!authed) return <Navigate to="/welcome" replace state={{ from: loc.pathname }} />
  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="ai" element={<AICompanion />} />
        <Route path="ai/:conversationId" element={<AICompanion />} />
        <Route path="explore" element={<Explore />} />
        <Route path="connect" element={<Connect />} />
        <Route path="connect/session/:bookingId" element={<Session />} />
        <Route path="connect/:id" element={<ProfessionalProfile />} />
        <Route path="connect/:id/book" element={<Booking />} />
        <Route path="rhythm" element={<Rhythm />} />
        <Route path="rhythm/routine" element={<Routine />} />
        <Route path="sleep" element={<Sleep />} />
        <Route path="pause" element={<Pause />} />
        <Route path="pause/breathe" element={<Breathe />} />
        <Route path="pause/grounding" element={<Grounding />} />
        <Route path="pause/relax/:kind" element={<Relax />} />
        <Route path="pause/play/:game" element={<Game />} />
        <Route path="clarity" element={<Clarity />} />
        <Route path="clarity/new" element={<TacWizard />} />
        <Route path="clarity/edit/:id" element={<TacWizard />} />
        <Route path="clarity/:id" element={<Decision />} />
        <Route path="pulse" element={<Pulse />} />
        <Route path="journal" element={<Journal />} />
        <Route path="insights" element={<Insights />} />
        <Route path="learn" element={<Learn />} />
        <Route path="learn/:id" element={<Article />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
