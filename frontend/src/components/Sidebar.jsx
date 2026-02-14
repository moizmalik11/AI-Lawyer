import { Link, useLocation } from 'react-router-dom';
import { useState, useRef } from 'react';
import { 
  Home, 
  MessageSquare, 
  Scale, 
  FileText, 
  Search,
  Settings,
  X
} from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

export default function Sidebar() {
  const location = useLocation();
  const { setIsExpanded, isMobileOpen, closeMobileSidebar } = useSidebar();
  const hoverTimeoutRef = useRef(null);
  
  const isActive = (path) => location.pathname === path;
  
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(true);
      document.querySelector('.app-layout')?.classList.add('sidebar-hover');
    }, 100);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      document.querySelector('.app-layout')?.classList.remove('sidebar-hover');
    }, 100);
  };

  const handleNavClick = () => {
    closeMobileSidebar();
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };
  
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/chatbot', icon: MessageSquare, label: 'Chat' },
    { path: '/judgments', icon: Scale, label: 'Judgments' },
    { path: '/contracts', icon: FileText, label: 'Contracts' },
    { path: '/search', icon: Search, label: 'Search' }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && <div className="sidebar-overlay-main" onClick={closeMobileSidebar}></div>}
      
      <aside 
        className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="sidebar-content">
          {/* Mobile Close Button */}
          <button className="sidebar-close-btn" onClick={closeMobileSidebar}>
            <X size={24} />
          </button>

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
                onClick={handleNavClick}
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
            onClick={handleNavClick}
          >
            <Settings className="nav-icon" size={20} />
            <span className="nav-label">Settings</span>
          </Link>
        </div>
      </div>
    </aside>
    </>
  );
}
