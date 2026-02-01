import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Moon, Sun, LogOut, Mail, Lock, Bell, Shield } from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p className="settings-subtitle">Manage your account and preferences</p>
        </div>

        <div className="settings-content">
          {/* Tabs */}
          <div className="settings-tabs">
            <button 
              className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={20} />
              <span>Profile</span>
            </button>
            <button 
              className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              <span>Appearance</span>
            </button>
            <button 
              className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={20} />
              <span>Security</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="settings-panel">
            {activeTab === 'profile' && (
              <div className="settings-section">
                <h2 className="section-title">Profile Information</h2>
                
                {/* User Avatar */}
                <div className="profile-avatar-section">
                  <div className="profile-avatar">
                    <User size={48} />
                  </div>
                  <div className="profile-info">
                    <h3>{user?.username || 'User'}</h3>
                    <p className="profile-email">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="settings-form">
                  <div className="form-group">
                    <label>Username</label>
                    <div className="input-with-icon">
                      <User size={18} />
                      <input 
                        type="text" 
                        value={user?.username || ''} 
                        disabled
                        placeholder="Username"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={18} />
                      <input 
                        type="email" 
                        value={user?.email || ''} 
                        disabled
                        placeholder="email@example.com"
                      />
                    </div>
                    <p className="form-hint">Your email is verified and secure</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="settings-section">
                <h2 className="section-title">Appearance</h2>
                <p className="section-description">Customize how the application looks</p>

                <div className="theme-selector">
                  <div className="theme-option">
                    <div className="theme-preview light-theme">
                      <Sun size={32} />
                    </div>
                    <div className="theme-details">
                      <h3>Light Mode</h3>
                      <p>Clean and bright interface</p>
                    </div>
                    <button 
                      className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => theme === 'dark' && toggleTheme()}
                    >
                      {theme === 'light' ? 'Active' : 'Select'}
                    </button>
                  </div>

                  <div className="theme-option">
                    <div className="theme-preview dark-theme">
                      <Moon size={32} />
                    </div>
                    <div className="theme-details">
                      <h3>Dark Mode</h3>
                      <p>Easy on the eyes</p>
                    </div>
                    <button 
                      className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => theme === 'light' && toggleTheme()}
                    >
                      {theme === 'dark' ? 'Active' : 'Select'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-section">
                <h2 className="section-title">Security</h2>
                <p className="section-description">Manage your password and account security</p>

                <div className="settings-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} />
                      <input 
                        type="password" 
                        placeholder="Enter current password"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} />
                      <input 
                        type="password" 
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="input-with-icon">
                      <Lock size={18} />
                      <input 
                        type="password" 
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <button className="btn-primary">Update Password</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Section */}
        <div className="settings-footer">
          <button className="logout-btn" onClick={logout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <style>{`
        .settings-page {
          padding: 3rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .settings-container {
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
        }

        .settings-header {
          padding: 2rem;
          border-bottom: 1px solid var(--border-color);
        }

        .settings-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text-color);
        }

        .settings-subtitle {
          color: var(--text-muted);
          font-size: 1rem;
        }

        .settings-content {
          display: grid;
          grid-template-columns: 250px 1fr;
          min-height: 500px;
        }

        .settings-tabs {
          border-right: 1px solid var(--border-color);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .settings-tab {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .settings-tab:hover {
          background: var(--glass-bg);
          color: var(--text-color);
        }

        .settings-tab.active {
          background: linear-gradient(135deg, rgba(13, 110, 31, 0.2), rgba(10, 85, 24, 0.1));
          color: var(--accent-color);
          border-left: 3px solid var(--accent-color);
        }

        .settings-panel {
          padding: 2rem;
        }

        .settings-section {
          max-width: 700px;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text-color);
        }

        .section-description {
          color: var(--text-muted);
          margin-bottom: 2rem;
        }

        .profile-avatar-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          background: var(--glass-bg);
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
        }

        .profile-info h3 {
          font-size: 1.25rem;
          margin-bottom: 0.25rem;
          color: var(--text-color);
        }

        .profile-email {
          color: var(--text-muted);
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: var(--text-color);
          font-size: 0.9rem;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon svg {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
        }

        .input-with-icon input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background: var(--glass-bg);
          color: var(--text-color);
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .input-with-icon input:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(13, 110, 31, 0.1);
        }

        .input-with-icon input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-hint {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .btn-primary {
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 110, 31, 0.3);
        }

        .theme-selector {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .theme-option {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          background: var(--glass-bg);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .theme-option:hover {
          border-color: var(--accent-color);
        }

        .theme-preview {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .theme-preview.light-theme {
          background: linear-gradient(135deg, #ffffff, #f8fafc);
          color: #1e293b;
        }

        .theme-preview.dark-theme {
          background: linear-gradient(135deg, #0a0f1e, #1a2332);
          color: #ffffff;
        }

        .theme-details {
          flex: 1;
        }

        .theme-details h3 {
          font-size: 1.1rem;
          margin-bottom: 0.25rem;
          color: var(--text-color);
        }

        .theme-details p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .theme-btn {
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          border: 2px solid var(--border-color);
          background: transparent;
          color: var(--text-color);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .theme-btn:hover {
          border-color: var(--accent-color);
          background: var(--glass-bg);
        }

        .theme-btn.active {
          background: var(--accent-color);
          color: #ffffff;
          border-color: var(--accent-color);
        }

        .settings-footer {
          padding: 2rem;
          border-top: 1px solid var(--border-color);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.5rem;
          background: rgba(220, 38, 38, 0.1);
          color: var(--error-color);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          background: var(--error-color);
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        @media (max-width: 768px) {
          .settings-page {
            padding: 1rem;
          }

          .settings-content {
            grid-template-columns: 1fr;
          }

          .settings-tabs {
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            flex-direction: row;
            overflow-x: auto;
          }

          .settings-tab span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
