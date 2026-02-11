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
  Shield,
  Gavel,
  BookOpen,
  UserPlus,
  LogIn,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Play,
  Zap
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/Landing.css';

const animatedFeatures = [
  'Search Legal Database',
  'Analyze Judgments',
  'Review Contracts',
  'Find Case Laws',
  'Research Family Law'
];

const Landing = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % animatedFeatures.length);
    }, 2500);
    return () => clearInterval(interval);
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
      icon: <Gavel size={40} />,
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
      icon: <BookOpen size={40} />,
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
            <ThemeToggle className="nav-theme-toggle" />
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
            <span>AI-Powered Civil Law Platform for Pakistan</span>
          </div>
          <h1 className="hero-title">
            AI-Powered <span className="gradient-text">Civil Law</span> Research
            <span className="gradient-text"> for Pakistan</span>
          </h1>
          <p className="hero-subtitle">
            Your comprehensive guide to Pakistani Civil Law. Specializing in Contract Law, Property Law, 
            Family Law, Tort Law, and more. Get instant access to legal knowledge with AI-powered precision.
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
          <div className="animated-text-container">
            <h2 className="static-text">Now you can</h2>
            <div className="animated-text-wrapper">
              <h2 className="animated-text" key={currentFeatureIndex}>
                {animatedFeatures[currentFeatureIndex]}
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* Civil Law Coverage Section */}
      <section className="civil-law-section">
        <div className="container">
          <div className="civil-law-header">
            <div className="civil-law-badge">
              <Shield size={18} />
              <span>Comprehensive Civil Law Coverage</span>
            </div>
            <h2 className="section-title">Specialized in Pakistani Civil Law</h2>
            <p className="section-subtitle">
              Our AI-powered platform covers all major areas of Civil Law in Pakistan, 
              providing you with accurate legal information and expert guidance
            </p>
          </div>

          <div className="civil-law-grid">
            <div className="civil-law-card">
              <div className="law-icon">
                <FileText size={28} />
              </div>
              <h3>Contract Law</h3>
              <ul className="law-topics">
                <li>Contract Act, 1872</li>
                <li>Sale of Goods Act, 1930</li>
                <li>Partnership Act, 1932</li>
                <li>Specific Relief Act, 1877</li>
              </ul>
            </div>

            <div className="civil-law-card">
              <div className="law-icon">
                <Gavel size={28} />
              </div>
              <h3>Property Law</h3>
              <ul className="law-topics">
                <li>Transfer of Property Act, 1882</li>
                <li>Registration Act, 1908</li>
                <li>Mortgage Laws</li>
                <li>Lease & Tenancy Rights</li>
              </ul>
            </div>

            <div className="civil-law-card">
              <div className="law-icon">
                <Shield size={28} />
              </div>
              <h3>Family Law</h3>
              <ul className="law-topics">
                <li>Muslim Family Laws Ordinance</li>
                <li>Guardians and Wards Act</li>
                <li>Succession & Inheritance</li>
                <li>Marriage & Divorce Laws</li>
              </ul>
            </div>

            <div className="civil-law-card">
              <div className="law-icon">
                <Scale size={28} />
              </div>
              <h3>Tort Law</h3>
              <ul className="law-topics">
                <li>Negligence Claims</li>
                <li>Defamation Laws</li>
                <li>Personal Injury</li>
                <li>Damages & Compensation</li>
              </ul>
            </div>

            <div className="civil-law-card">
              <div className="law-icon">
                <BookOpen size={28} />
              </div>
              <h3>Civil Procedure</h3>
              <ul className="law-topics">
                <li>Civil Procedure Code, 1908</li>
                <li>Limitation Act, 1908</li>
                <li>Court Fees Act, 1870</li>
                <li>Evidence Act, 1984</li>
              </ul>
            </div>

            <div className="civil-law-card">
              <div className="law-icon">
                <Sparkles size={28} />
              </div>
              <h3>Consumer Rights</h3>
              <ul className="law-topics">
                <li>Consumer Protection Laws</li>
                <li>Product Liability</li>
                <li>Service Contracts</li>
                <li>Dispute Resolution</li>
              </ul>
            </div>
          </div>

          <div className="civil-law-cta">
            <p>Access comprehensive information on all Pakistani Civil Laws</p>
            <button className="btn-primary" onClick={() => navigate('/auth?mode=register')}>
              Start Exploring Now
              <ChevronRight size={18} />
            </button>
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
              <h3>Your Trusted Guide to Pakistani Civil Law</h3>
              <p>
                <strong>Smart Lawyer</strong> is Pakistan's first AI-powered legal assistant exclusively designed 
                for Civil Law matters. Our platform specializes in Contract Law, Property Law, Family Law, Tort Law, 
                and Civil Procedure, combining cutting-edge artificial intelligence with Pakistan's comprehensive 
                civil law framework.
              </p>
              <p>
                Whether you're a legal professional researching case precedents, a law student studying civil statutes, 
                or a citizen seeking guidance on property rights, inheritance, or contract disputes, Smart Lawyer 
                provides instant, accurate, and citation-backed legal information. Our bilingual interface (English & Urdu) 
                ensures accessibility for all Pakistanis.
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
              <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
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

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <div className="tutorial-badge">
              <Play size={18} />
              <span>Quick Start Guide</span>
            </div>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Get started in just 3 simple steps and unlock the power of AI-driven legal research
            </p>
          </div>

          <div className="tutorial-timeline">
            <div className="tutorial-step step-1">
              <div className="step-number">
                <UserPlus size={28} />
                <span className="step-badge">Step 1</span>
              </div>
              <div className="step-content">
                <h3>Create Your Account</h3>
                <p>
                  Sign up in seconds with your email. No credit card required - start with our free tier 
                  and explore all features immediately.
                </p>
                <ul className="step-features">
                  <li><CheckCircle2 size={16} /> Free registration</li>
                  <li><CheckCircle2 size={16} /> Instant access</li>
                  <li><CheckCircle2 size={16} /> No hidden fees</li>
                </ul>
                <button className="btn-step" onClick={() => navigate('/auth?mode=register')}>
                  Sign Up Now
                  <ArrowRight size={18} />
                </button>
              </div>
              <div className="step-visual">
                <div className="visual-card animate-float">
                  <UserPlus size={64} />
                  <div className="pulse-ring"></div>
                </div>
              </div>
            </div>

            <div className="tutorial-step step-2">
              <div className="step-number">
                <LogIn size={28} />
                <span className="step-badge">Step 2</span>
              </div>
              <div className="step-content">
                <h3>Explore the Dashboard</h3>
                <p>
                  Access your personalized dashboard with all features at your fingertips. Choose from 
                  legal search, judgment analysis, contract review, or start a chat with our AI assistant.
                </p>
                <ul className="step-features">
                  <li><CheckCircle2 size={16} /> Intuitive interface</li>
                  <li><CheckCircle2 size={16} /> Multiple tools</li>
                  <li><CheckCircle2 size={16} /> Easy navigation</li>
                </ul>
                <button className="btn-step" onClick={() => navigate('/auth?mode=login')}>
                  Login to Dashboard
                  <ArrowRight size={18} />
                </button>
              </div>
              <div className="step-visual">
                <div className="visual-card animate-float" style={{ animationDelay: '0.5s' }}>
                  <LogIn size={64} />
                  <div className="pulse-ring"></div>
                </div>
              </div>
            </div>

            <div className="tutorial-step step-3">
              <div className="step-number">
                <MessageSquare size={28} />
                <span className="step-badge">Step 3</span>
              </div>
              <div className="step-content">
                <h3>Start Your Research</h3>
                <p>
                  Ask any legal question in plain English or Urdu. Our AI analyzes thousands of legal documents 
                  instantly and provides accurate, citation-backed answers from Pakistani civil law.
                </p>
                <ul className="step-features">
                  <li><CheckCircle2 size={16} /> Instant results</li>
                  <li><CheckCircle2 size={16} /> Bilingual support</li>
                  <li><CheckCircle2 size={16} /> Accurate citations</li>
                </ul>
                <button className="btn-step btn-step-primary" onClick={() => navigate('/auth?mode=register')}>
                  Get Started Free
                  <Zap size={18} />
                </button>
              </div>
              <div className="step-visual">
                <div className="visual-card animate-float" style={{ animationDelay: '1s' }}>
                  <MessageSquare size={64} />
                  <div className="pulse-ring"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="tutorial-cta">
            <div className="tutorial-cta-content">
              <Sparkles size={32} />
              <h3>Ready to Transform Your Legal Research?</h3>
              <p>Join hundreds of legal professionals already using Smart Lawyer</p>
              <button className="btn-tutorial-cta" onClick={() => navigate('/auth?mode=register')}>
                Start Free Trial
                <ChevronRight size={20} />
              </button>
            </div>
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
