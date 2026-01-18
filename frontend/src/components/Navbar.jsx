import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className="navbar">
            <div className="container">
                <div className="logo">
                    <span>⚖️</span> AI Lawyer
                </div>
                <ul className="nav-links">
                    <li><Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link></li>
                    <li><button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', fontWeight: 500, fontFamily: 'var(--font-main)' }}>Logout</button></li>
                </ul>
            </div>
        </nav>
    );
}
