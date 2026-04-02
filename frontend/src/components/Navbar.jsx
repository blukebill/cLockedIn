function Navbar({ page, setPage, role, onLogout }) {
  const navItems = ['dashboard', 'schedule', 'team', 'earnings', 'messages']

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '56px',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#ffffff',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Logo */}
      <img
        src="/clockedin-logo.svg"
        alt="cLockedIn"
        onClick={() => setPage('dashboard')}
        style={{ height: '64px', width: 'auto', cursor: 'pointer'}}
      />

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {navItems.map(item => (
          <button
            key={item}
            onClick={() => setPage(item)}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: page === item ? '600' : '400',
              color: page === item ? '#000' : '#666',
              backgroundColor: page === item ? '#f0f0f0' : 'transparent',
              textTransform: 'capitalize'
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Right icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '20px',
          padding: '4px'
        }}>
          🔔
        </button>
        <div 
          onClick={onLogout}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
        }}>
          {role === 'manager' ? 'M' : 'E'}
        </div>
      </div>
    </nav>
  )
}

export default Navbar