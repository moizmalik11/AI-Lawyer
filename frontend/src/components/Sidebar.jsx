import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Scale, 
  FileText, 
  Search,
  Settings,
  User,
  Moon,
  Sun,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  
  const isActive = (path) => location.pathname === path;
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/chatbot', icon: MessageSquare, label: 'Chat' },
    { path: '/judgments', icon: Scale, label: 'Judgments' },
    { path: '/contracts', icon: FileText, label: 'Contracts' },
    { path: '/search', icon: Search, label: 'Search' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-logo">
          <span className="logo-icon">⚖️</span>
          <span className="logo-text">AI Lawyer</span>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
                title={item.label}
              >
                <Icon className="nav-icon" size={20} />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Settings Section */}
        <div className="sidebar-settings">
          <button 
            className="sidebar-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="nav-icon" size={20} />
            <span className="nav-label">Settings</span>
          </button>
        </div>
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h3>Settings</h3>
              <button className="settings-close-btn" onClick={() => setShowSettings(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="settings-modal-body">
              {/* User Info */}
              <div className="settings-section">
                <h4 className="settings-section-title">Profile</h4>
                <div className="settings-user-info">
                  <div className="settings-user-avatar">
                    <User size={24} />
                  </div>
                  <div className="settings-user-details">
                    <p className="settings-user-name">{user?.username || 'User'}</p>
                    <p className="settings-user-email">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>
              </div>
              
              {/* Theme Toggle */}
              <div className="settings-section">
                <h4 className="settings-section-title">Appearance</h4>
                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-icon">
                      {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div>
                      <p className="settings-item-label">Theme</p>
                      <p className="settings-item-desc">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                    </div>
                  </div>
                  <button className="settings-toggle-btn" onClick={toggleTheme}>
                    <div className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}>
                      <div className="toggle-thumb"></div>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Logout Button */}
              <div className="settings-section">
                <button className="settings-logout-btn" onClick={logout}>
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
