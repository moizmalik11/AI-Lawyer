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

                <div className="theme-toggle-container">
                  <div className="theme-toggle-info">
                    <div className="theme-icon">
                      {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
                    </div>
                    <div>
                      <h3>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</h3>
                      <p>{theme === 'dark' ? 'Easy on the eyes in low light' : 'Clean and bright interface'}</p>
                    </div>
                  </div>
                  
                  <label className="theme-toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={theme === 'dark'} 
                      onChange={toggleTheme}
                    />
                    <span className="toggle-slider">
                      <span className="toggle-icon">
                        {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                      </span>
                    </span>
                  </label>
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
          background: linear-gradient(135deg, rgba(160, 82, 45, 0.2), rgba(139, 69, 19, 0.1));
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
          box-shadow: 0 0 0 3px rgba(160, 82, 45, 0.15);
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
          box-shadow: 0 4px 12px rgba(160, 82, 45, 0.4);
        }

        .theme-toggle-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem;
          background: var(--glass-bg);
          border: 2px solid var(--border-color);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .theme-toggle-container:hover {
          border-color: var(--accent-color);
          box-shadow: 0 4px 16px rgba(160, 82, 45, 0.15);
        }

        .theme-toggle-info {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .theme-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(160, 82, 45, 0.3);
        }

        .theme-toggle-info h3 {
          font-size: 1.15rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: var(--text-color);
        }

        .theme-toggle-info p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .theme-toggle-switch {
          position: relative;
          display: inline-block;
          width: 68px;
          height: 36px;
          cursor: pointer;
        }

        .theme-toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(160, 82, 45, 0.2);
          border: 2px solid var(--border-color);
          border-radius: 34px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          height: 28px;
          width: 28px;
          left: 2px;
          bottom: 2px;
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          border-radius: 50%;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .toggle-icon {
          position: absolute;
          top: 50%;
          left: 8px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }

        .theme-toggle-switch input:checked + .toggle-slider {
          background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
          border-color: var(--accent-color);
        }

        .theme-toggle-switch input:checked + .toggle-slider::before {
          transform: translateX(32px);
          background: linear-gradient(135deg, #ffffff, #f8fafc);
        }

        .theme-toggle-switch input:checked + .toggle-slider .toggle-icon {
          left: 42px;
          color: #ffffff;
        }

        .theme-toggle-switch:hover .toggle-slider {
          box-shadow: 0 0 16px rgba(160, 82, 45, 0.3);
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

        @media (max-width: 1024px) {
          .settings-content {
            grid-template-columns: 200px 1fr;
          }

          .settings-panel {
            padding: 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .settings-page {
            padding: 1rem;
          }

          .settings-header {
            padding: 1.5rem;
          }

          .settings-header h1 {
            font-size: 1.75rem;
          }

          .settings-subtitle {
            font-size: 0.95rem;
          }

          .settings-content {
            grid-template-columns: 1fr;
          }

          .settings-tabs {
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            flex-direction: row;
            overflow-x: auto;
            padding: 0.75rem;
            gap: 0.75rem;
          }

          .settings-tab {
            flex-shrink: 0;
            padding: 0.75rem;
            min-width: 44px;
            justify-content: center;
          }

          .settings-tab span {
            display: none;
          }

          .settings-panel {
            padding: 1.5rem;
          }

          .section-title {
            font-size: 1.375rem;
          }

          .section-description {
            font-size: 0.95rem;
          }

          .profile-avatar-section {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem;
          }

          .profile-avatar {
            width: 64px;
            height: 64px;
          }

          .theme-option {
            padding: 1.25rem;
            gap: 1rem;
          }

          .theme-preview {
            width: 48px;
            height: 48px;
          }

          .theme-details h3 {
            font-size: 1rem;
          }

          .theme-details p {
            font-size: 0.85rem;
          }

          .theme-btn {
            padding: 0.5rem 1.25rem;
            font-size: 0.9rem;
          }

          .settings-footer {
            padding: 1.5rem;
          }

          .logout-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .settings-page {
            padding: 0.75rem;
          }

          .settings-header {
            padding: 1.25rem;
          }

          .settings-header h1 {
            font-size: 1.5rem;
          }

          .settings-panel {
            padding: 1.25rem;
          }

          .section-title {
            font-size: 1.25rem;
          }

          .profile-avatar-section {
            padding: 1.25rem;
          }

          .profile-avatar {
            width: 56px;
            height: 56px;
          }

          .profile-info h3 {
            font-size: 1.125rem;
          }

          .form-group label {
            font-size: 0.875rem;
          }

          .input-with-icon input {
            padding: 0.75rem 0.875rem 0.75rem 2.75rem;
            font-size: 16px; /* Prevents iOS zoom */
          }

          .btn-primary {
            padding: 0.75rem 1.25rem;
            font-size: 0.95rem;
          }

          .theme-option {
            padding: 1rem;
            flex-direction: column;
            text-align: center;
          }

          .theme-btn {
            width: 100%;
          }

          .logout-btn {
            padding: 0.75rem 1.25rem;
            font-size: 0.95rem;
          }
        }
      `}</style>
    </div>
  );
}
