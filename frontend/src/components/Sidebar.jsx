import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Scale, 
  FileText, 
  Search,
  Settings
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

export default function Sidebar() {
  const location = useLocation();
  const { toggleSidebar } = useSidebar();
  
  const isActive = (path) => location.pathname === path;
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/chatbot', icon: MessageSquare, label: 'Chat' },
    { path: '/judgments', icon: Scale, label: 'Judgments' },
    { path: '/contracts', icon: FileText, label: 'Contracts' },
    { path: '/search', icon: Search, label: 'Search' }
  ];

  return (
    <aside 
      className="sidebar"
      onMouseEnter={() => toggleSidebar()}
      onMouseLeave={() => toggleSidebar()}
    >
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
          <Link 
            to="/settings"
            className={`sidebar-settings-btn ${isActive('/settings') ? 'active' : ''}`}
            title="Settings"
          >
            <Settings className="nav-icon" size={20} />
            <span className="nav-label">Settings</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
