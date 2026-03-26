function Login({ onLogin }) {
    return (
        <div>
            <h1>cLockedIn</h1>
            <h2>Select your role</h2>
            <button onClick={() => onLogin('manager')}>Manager</button>
            <button onClick={() => onLogin('employee')}>Employee</button>
        </div>
    )
}

export default Login