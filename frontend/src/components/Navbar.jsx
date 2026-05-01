function Navbar({ page, setPage, role, onLogout, messageUnreadCount = 0, onOpenAnnouncementInbox }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'team', label: 'Team' },
    { id: 'timeOff', label: 'Time Off' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'messages', label: 'Messages' },
  ]

  return (
    <nav className="flex items-center justify-between px-6 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-50">

      {/* Logo */}
      <div className="flex items-center cursor-pointer" onClick={() => setPage('dashboard')}>
        <picture>
          <source srcSet="/clockedin-logo-nav-dark.svg" media="(prefers-color-scheme: dark)" />
          <img src="/clockedin-logo-nav.svg" alt="cLockedIn" className="h-10 w-auto" />
        </picture>
      </div>

      {/* Nav links */}
      <div className="flex gap-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`relative px-3 py-1.5 rounded-md text-sm transition-colors
              ${page === item.id
                ? 'bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-gray-100'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            {item.label}
            {item.id === 'messages' && messageUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] leading-5 font-semibold">
                {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onOpenAnnouncementInbox}
          className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Inbox
        </button>
        <div
          onClick={onLogout}
          className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white text-sm font-semibold cursor-pointer transition-colors"
        >
          {role === 'manager' ? 'M' : 'E'}
        </div>
      </div>

    </nav>
  )
}

export default Navbar
