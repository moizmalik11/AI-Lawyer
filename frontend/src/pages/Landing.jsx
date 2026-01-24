import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  FileText, 
  Scale, 
  Languages, 
  Sparkles, 
  ChevronRight,
  Menu,
  X,
  Shield
} from 'lucide-react';
import '../styles/Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const features = [
    {
      icon: <Search size={40} />,
      title: 'Smart Legal Search',
      description: 'Advanced AI-powered semantic search across Pakistani civil laws and regulations with instant, accurate results.'
    },
    {
      icon: <Scale size={40} />,
      title: 'Judgment Analysis',
      description: 'Comprehensive analysis and summarization of Supreme Court and High Court judgments with key findings extraction.'
    },
    {
      icon: <FileText size={40} />,
      title: 'Contract Summarization',
      description: 'Intelligent contract analysis that extracts key terms, obligations, and potential legal implications automatically.'
    },
    {
      icon: <Languages size={40} />,
      title: 'Bilingual Support',
      description: 'Seamless support for both English and Urdu, making legal information accessible to everyone in Pakistan.'
    },
    {
      icon: <Shield size={40} />,
      title: 'Civil Law Expertise',
      description: 'Specialized in Pakistani civil law including Contract Act, Property Law, Family Law, and more.'
    },
    {
      icon: <Sparkles size={40} />,
      title: 'AI-Powered Insights',
      description: 'Leveraging cutting-edge AI technology to provide accurate, context-aware legal guidance and recommendations.'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-logo" onClick={() => scrollToSection('home')}>
            <Scale className="logo-icon" size={32} />
            <span className="logo-text">Smart Lawyer</span>
          </div>

          <div className={`nav-links ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
            <a onClick={() => scrollToSection('home')} className="nav-link">Home</a>
            <a onClick={() => scrollToSection('about')} className="nav-link">About</a>
            <a onClick={() => scrollToSection('features')} className="nav-link">Features</a>
          </div>

          <div className="nav-buttons">
            <button className="btn-secondary" onClick={() => navigate('/auth?mode=login')}>
              Login
            </button>
            <button className="btn-primary" onClick={() => navigate('/auth?mode=register')}>
              Register
            </button>
          </div>

          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Powered by Advanced AI Technology</span>
          </div>
          <h1 className="hero-title">
            AI-Powered Legal Research
            <span className="gradient-text"> for Everyone</span>
          </h1>
          <p className="hero-subtitle">
            Democratizing access to Pakistani legal knowledge through cutting-edge artificial intelligence. 
            Get instant answers, analyze judgments, and understand contracts in seconds.
          </p>
          <div className="hero-buttons">
            <button className="btn-hero-primary" onClick={() => navigate('/auth?mode=register')}>
              Get Started
              <ChevronRight size={20} />
            </button>
            <button className="btn-hero-secondary" onClick={() => scrollToSection('features')}>
              Explore Features
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <h3>10,000+</h3>
              <p>Legal Documents</p>
            </div>
            <div className="stat">
              <h3>5+</h3>
              <p>Core Features</p>
            </div>
            <div className="stat">
              <h3>24/7</h3>
              <p>AI Assistance</p>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">
            <Scale size={24} />
            <span>Legal Research</span>
          </div>
          <div className="floating-card card-2">
            <FileText size={24} />
            <span>Contract Analysis</span>
          </div>
          <div className="floating-card card-3">
            <Languages size={24} />
            <span>Bilingual Support</span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">About Smart Lawyer</h2>
            <p className="section-subtitle">Your AI-Powered Legal Companion</p>
          </div>
          <div className="about-content">
            <div className="about-text">
              <h3>Revolutionizing Legal Research in Pakistan</h3>
              <p>
                <strong>Smart Lawyer</strong> is an innovative AI-powered legal assistant designed specifically 
                for Pakistani civil law. Our platform combines the power of advanced artificial intelligence 
                with comprehensive legal databases to provide instant, accurate legal information.
              </p>
              <p>
                Whether you're a legal professional, student, or someone seeking legal guidance, Smart Lawyer 
                makes complex legal information accessible and understandable. Our bilingual interface supports 
                both English and Urdu, ensuring that legal knowledge is available to everyone.
              </p>
              <div className="about-features">
                <div className="about-feature-item">
                  <div className="feature-icon">✓</div>
                  <div>
                    <h4>RAG-Powered Accuracy</h4>
                    <p>Retrieval-Augmented Generation ensures precise, citation-backed responses</p>
                  </div>
                </div>
                <div className="about-feature-item">
                  <div className="feature-icon">✓</div>
                  <div>
                    <h4>Comprehensive Database</h4>
                    <p>Access to Supreme Court judgments, High Court decisions, and civil law statutes</p>
                  </div>
                </div>
                <div className="about-feature-item">
                  <div className="feature-icon">✓</div>
                  <div>
                    <h4>User-Friendly Interface</h4>
                    <p>Intuitive design that makes legal research simple and efficient</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="about-image">
              <div className="about-image-placeholder">
                <Scale size={80} className="placeholder-icon" />
                <p>AI-Powered Legal Intelligence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Powerful Features</h2>
            <p className="section-subtitle">Everything you need for comprehensive legal research</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Experience the Future of Legal Research?</h2>
            <p>Join thousands of users who are already leveraging AI for smarter legal work</p>
            <button className="btn-cta" onClick={() => navigate('/auth?mode=register')}>
              Start Your Free Account
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <Scale size={28} />
                <span>Smart Lawyer</span>
              </div>
              <p className="footer-description">
                AI-powered legal research platform for Pakistani civil law. 
                Making legal knowledge accessible to everyone.
              </p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><a onClick={() => scrollToSection('home')}>Home</a></li>
                <li><a onClick={() => scrollToSection('about')}>About</a></li>
                <li><a onClick={() => scrollToSection('features')}>Features</a></li>
                <li><a onClick={() => navigate('/auth')}>Login</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Features</h4>
              <ul className="footer-links">
                <li><a>Legal Search</a></li>
                <li><a>Judgment Analysis</a></li>
                <li><a>Contract Summarization</a></li>
                <li><a>Bilingual Support</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <ul className="footer-links">
                <li><a>Privacy Policy</a></li>
                <li><a>Terms of Service</a></li>
                <li><a>Disclaimer</a></li>
                <li><a>Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Smart Lawyer. All rights reserved.</p>
            <p className="footer-disclaimer">
              This platform provides AI-generated legal information for research purposes only. 
              It is not a substitute for professional legal advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
