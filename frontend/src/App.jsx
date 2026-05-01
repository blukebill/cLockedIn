import { useEffect, useState } from 'react'
import Login from './pages/Login'
import ScheduleGrid from './components/ScheduleGrid'
import Navbar from './components/Navbar'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import TeamPage from './pages/TeamPage'
import TimeOffPage from './pages/TimeOffPage'
import MessagesPage from './pages/MessagesPage'
import { announcementsApi, authApi, getMessagesWebSocketUrl, getStoredToken, messagesApi } from './services/api'
import { toAppRole } from './utils/apiScheduleAdapter'
import './App.css'

function formatAnnouncementTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function App() {
  const [user, setUser] = useState(null)
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(getStoredToken()))
  const [page, setPage] = useState('dashboard')
  const [isPublished, setIsPublished] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [publishedWeek, setPublishedWeek] = useState ('')
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)
  const [scheduleVersion, setScheduleVersion] = useState(0)
  const [messageUnreadCount, setMessageUnreadCount] = useState(0)
  const [activeAnnouncement, setActiveAnnouncement] = useState(null)
  const [isAnnouncementInboxOpen, setIsAnnouncementInboxOpen] = useState(false)
  const [announcementHistory, setAnnouncementHistory] = useState([])
  const [isAnnouncementHistoryLoading, setIsAnnouncementHistoryLoading] = useState(false)
  const [announcementHistoryError, setAnnouncementHistoryError] = useState('')

  const role = toAppRole(user?.role)

  useEffect(() => {
    if (!getStoredToken()) return

    authApi.me()
      .then(setUser)
      .catch(() => {
        authApi.logout()
        setUser(null)
      })
      .finally(() => setIsBootstrapping(false))
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    messagesApi.unreadCount()
      .then(count => setMessageUnreadCount(Number(count) || 0))
      .catch(() => setMessageUnreadCount(0))
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    let active = true
    const socket = new WebSocket(getMessagesWebSocketUrl())

    socket.onmessage = (event) => {
      if (!active) return

      try {
        const payload = JSON.parse(event.data)
        if (
          payload.type === 'ANNOUNCEMENT' &&
          payload.announcement &&
          payload.announcement.senderId !== user.userId
        ) {
          setActiveAnnouncement(payload.announcement)
          setAnnouncementHistory(current => (
            current.some(announcement => announcement.id === payload.announcement.id)
              ? current
              : [payload.announcement, ...current]
          ))
        }
      } catch {
        // Ignore malformed websocket payloads; authenticated REST calls still own durable state.
      }
    }

    return () => {
      active = false
      socket.close()
    }
  }, [user])

  useEffect(() => {
    if (!isAnnouncementInboxOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsAnnouncementInboxOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isAnnouncementInboxOpen])

  const handleLogin = (nextUser) => {
    setUser(nextUser)
    setPage('dashboard')
  }

  const handleLogout = () => {
    authApi.logout()
    setUser(null)
    setPage('dashboard')
    setIsGenerated(false)
    setIsPublished(false)
    setPublishedWeek('')
    setIsBannerDismissed(false)
    setMessageUnreadCount(0)
    setActiveAnnouncement(null)
    setIsAnnouncementInboxOpen(false)
    setAnnouncementHistory([])
    setAnnouncementHistoryError('')
  }

  const openAnnouncementInbox = async () => {
    setIsAnnouncementInboxOpen(true)
    setAnnouncementHistoryError('')
    setIsAnnouncementHistoryLoading(true)
    try {
      const data = await announcementsApi.list()
      setAnnouncementHistory(Array.isArray(data) ? data : [])
    } catch (err) {
      setAnnouncementHistoryError(err.message || 'Unable to load announcements.')
    } finally {
      setIsAnnouncementHistoryLoading(false)
    }
  }

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    )
  }

  if (user === null) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar
        page={page}
        setPage={setPage}
        role={role}
        onLogout={handleLogout}
        messageUnreadCount={messageUnreadCount}
        onOpenAnnouncementInbox={openAnnouncementInbox}
      />
      
      {/* Notification Banner - only shows for employees after publish */}
      {isPublished && role === 'employee' && !isBannerDismissed && (
        <div className="bg-green-600 text-white px-6 py-3 text-sm flex items-center justify-between">
          <span> A new schedule for {publishedWeek} has been posted. Check your schedule!</span>
          <button
            onClick={() => setIsBannerDismissed(true)}
            className="text-white hover:text-green-200 transition-colors ml-4 text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {activeAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                Announcement
              </p>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                {activeAnnouncement.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                From {activeAnnouncement.senderName}
              </p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                {activeAnnouncement.body}
              </p>
              <button
                type="button"
                onClick={() => setActiveAnnouncement(null)}
                className="mt-5 w-full px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {isAnnouncementInboxOpen && (
        <div
          className="fixed left-0 right-0 bottom-0 top-14 z-40 flex items-start justify-end bg-black/30"
          onClick={() => setIsAnnouncementInboxOpen(false)}
        >
          <div
            className="h-full w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col"
            onClick={event => event.stopPropagation()}
          >
            <div className="relative z-10 p-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-4 bg-white dark:bg-gray-900">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                  Inbox
                </p>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  Announcement History
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAnnouncementInboxOpen(false)}
                aria-label="Close announcement inbox"
                className="w-9 h-9 rounded-md border border-gray-200 dark:border-gray-700 text-xl leading-none font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                x
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {isAnnouncementHistoryLoading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading announcements...</p>
              )}
              {announcementHistoryError && (
                <p className="text-sm text-red-600 dark:text-red-400">{announcementHistoryError}</p>
              )}
              {!isAnnouncementHistoryLoading && !announcementHistoryError && announcementHistory.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No announcements yet.</p>
              )}
              {announcementHistory.map(announcement => (
                <article
                  key={announcement.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {announcement.title}
                    </h3>
                    <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                      {formatAnnouncementTime(announcement.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    From {announcement.senderName}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words mt-3">
                    {announcement.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {page === 'dashboard' && role === 'employee' && <EmployeeDashboard setPage={setPage} user={user} scheduleVersion={scheduleVersion} />}
        {page === 'dashboard' && role === 'manager' && <ManagerDashboard setPage={setPage} user={user} scheduleVersion={scheduleVersion} />}
        {page === 'schedule' && <ScheduleGrid role={role} isGenerated={isGenerated} setIsGenerated={setIsGenerated} isPublished={isPublished} setIsPublished={setIsPublished} publishedWeek={publishedWeek} setPublishedWeek={setPublishedWeek} onScheduleChanged={() => setScheduleVersion(version => version + 1)} />}
        {page === 'team' && <TeamPage role={role} />}
        {page === 'timeOff' && <TimeOffPage role={role} />}
        {page === 'earnings' && <h1>Earnings</h1>}
        {page === 'messages' && <MessagesPage role={role} user={user} onUnreadCountChange={setMessageUnreadCount} />} 
      </div>
    </div>
  )
}

export default App
