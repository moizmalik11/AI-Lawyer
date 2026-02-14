import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, User, ArrowLeft, Menu } from 'lucide-react';

export default function Navbar() {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { toggleMobileSidebar } = useSidebar();
    const navigate = useNavigate();
    const location = useLocation();
    
    const canGoBack = location.pathname !== '/dashboard';
    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <nav className="app-navbar">
            <div className="navbar-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Mobile Menu Button */}
                    <button 
                        onClick={toggleMobileSidebar}
                        className="mobile-nav-menu-btn"
                        aria-label="Toggle menu"
                    >
                        <Menu size={20} />
                    </button>

                    {canGoBack && (
                        <button 
                            onClick={handleBack}
                            className="professional-back-btn"
                            aria-label="Go back"
                        >
                            <ArrowLeft size={20} className="back-icon" />
                            <span className="back-text">Back</span>
                        </button>
                    )}
                    <div className="navbar-title">
                        AI Legal Assistant
                    </div>
                </div>
                
                <div className="navbar-actions">
                    <div className="user-info">
                        <User size={18} />
                        <span>{user?.username || 'User'}</span>
                    </div>
                    
                    <button 
                        onClick={toggleTheme} 
                        className="icon-btn theme-toggle-btn"
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    
                    <button 
                        onClick={logout} 
                        className="icon-btn logout-btn"
                        aria-label="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    );
}
