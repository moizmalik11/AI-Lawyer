import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Scale, FileText, Search, ArrowRight, TrendingUp, Users, Database, Zap, Award, CheckCircle, Clock } from 'lucide-react';
import '../styles/Dashboard.css';

export default function Dashboard() {
    const { user } = useAuth();

    const features = [
        {
            path: '/chatbot',
            icon: MessageSquare,
            title: 'AI Legal Chatbot',
            description: 'Ask questions in English or Urdu and get instant legal answers with citations from Pakistani law.',
            color: '#3b82f6',
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            features: ['Bilingual Support', 'Real-time Answers', 'Citation Links']
        },
        {
            path: '/judgments',
            icon: Scale,
            title: 'Judgment Summarization',
            description: 'Search and summarize complex court judgments into key points with AI-powered analysis.',
            color: '#d4af37',
            gradient: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
            features: ['Supreme Court Cases', 'High Court Cases', 'Smart Summaries']
        },
        {
            path: '/contracts',
            icon: FileText,
            title: 'Contract Analysis',
            description: 'Upload contracts to identify risks, loopholes, and key obligations with AI review.',
            color: '#A0522D',
            gradient: 'linear-gradient(135deg, #A0522D 0%, #8B4513 100%)',
            features: ['Risk Detection', 'Clause Analysis', 'Obligation Tracking']
        },
        {
            path: '/search',
            icon: Search,
            title: 'Advanced Legal Search',
            description: 'Search across all acts, laws, and judgments with advanced semantic filters.',
            color: '#8b5cf6',
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            features: ['Semantic Search', 'Multiple Sources', 'Smart Filters']
        }
    ];

    const guides = [
        {
            title: 'AI Legal Chatbot',
            icon: MessageSquare,
            steps: [
                'Navigate to the Chat section from the sidebar',
                'Type your legal question in English or Urdu',
                'Press Enter or click Send to get instant answers',
                'Review citations and sources provided with each answer'
            ]
        },
        {
            title: 'Judgment Summarization',
            icon: Scale,
            steps: [
                'Go to Judgments section from the sidebar',
                'Search for specific court cases or judgments',
                'Select a judgment to view full details',
                'Get AI-generated summaries highlighting key points'
            ]
        },
        {
            title: 'Contract Analysis',
            icon: FileText,
            steps: [
                'Access Contracts section via the sidebar',
                'Upload your contract document (PDF, DOCX)',
                'Wait for AI to analyze the document',
                'Review identified risks, loopholes, and obligations'
            ]
        },
        {
            title: 'Advanced Legal Search',
            icon: Search,
            steps: [
                'Open Search section from the sidebar',
                'Enter keywords related to laws, acts, or cases',
                'Apply filters for precise results',
                'Explore comprehensive legal database results'
            ]
        }
    ];

    return (
        <div className="dashboard-page">
            {/* Hero Section */}
            <section className="dashboard-hero fade-in">
                <div className="hero-background-pattern"></div>
                <div className="hero-content">
                    <div className="hero-badge">
                        <Zap size={16} />
                        <span>Powered by Advanced AI</span>
                    </div>
                    <h1 className="hero-title">
                        Welcome back, <span className="highlight">{user?.username || 'User'}</span>
                    </h1>
                    <p className="hero-subtitle">
                        Your AI-powered legal research assistant is ready to help you navigate Pakistani law
                    </p>
                    <div className="hero-stats">
                        <div className="hero-stat-item">
                            <Database size={20} />
                            <div>
                                <div className="stat-number">10,000+</div>
                                <div className="stat-label">Legal Documents</div>
                            </div>
                        </div>
                        <div className="hero-stat-item">
                            <TrendingUp size={20} />
                            <div>
                                <div className="stat-number">99.5%</div>
                                <div className="stat-label">Accuracy Rate</div>
                            </div>
                        </div>
                        <div className="hero-stat-item">
                            <Clock size={20} />
                            <div>
                                <div className="stat-number">24/7</div>
                                <div className="stat-label">Available</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="dashboard-container">
                    <div className="section-header">
                        <h2 className="section-title">Core Features</h2>
                        <p className="section-description">Professional legal tools powered by cutting-edge AI technology</p>
                    </div>
                    <div className="dashboard-grid">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <Link
                                    key={feature.path}
                                    to={feature.path}
                                    className="feature-card glass-card fade-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="feature-card-gradient" style={{ background: feature.gradient }}></div>
                                    <div className="feature-icon" style={{ color: feature.color }}>
                                        <Icon size={36} strokeWidth={1.5} />
                                    </div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                    <div className="feature-tags">
                                        {feature.features.map((tag, idx) => (
                                            <span key={idx} className="feature-tag">
                                                <CheckCircle size={12} />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="feature-footer">
                                        <span className="feature-link-text">Explore Feature</span>
                                        <ArrowRight size={18} className="feature-arrow" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How to Use Guide */}
            <section className="guide-section">
                <div className="dashboard-container">
                    <h2 className="section-title">How to Use</h2>
                    <p className="section-subtitle">
                        Master each tool with these step-by-step guides
                    </p>
                    
                    <div className="guide-grid">
                        {guides.map((guide, index) => {
                            const Icon = guide.icon;
                            return (
                                <div
                                    key={guide.title}
                                    className="guide-card glass-card fade-in"
                                    style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                                >
                                    <div className="guide-header">
                                        <Icon size={24} className="guide-icon" />
                                        <h3>{guide.title}</h3>
                                    </div>
                                    <ol className="guide-steps">
                                        {guide.steps.map((step, stepIndex) => (
                                            <li key={stepIndex}>{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="dashboard-container">
                    <div className="section-header">
                        <h2 className="section-title">Platform Statistics</h2>
                        <p className="section-description">Comprehensive legal database at your fingertips</p>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-card glass-card fade-in">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                                <Scale size={24} />
                            </div>
                            <div className="stat-value">10,000+</div>
                            <div className="stat-label">Court Judgments</div>
                            <div className="stat-growth">
                                <TrendingUp size={14} />
                                <span>Updated Daily</span>
                            </div>
                        </div>
                        <div className="stat-card glass-card fade-in">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #d4af37, #b8941f)' }}>
                                <FileText size={24} />
                            </div>
                            <div className="stat-value">5,000+</div>
                            <div className="stat-label">Pakistani Laws & Acts</div>
                            <div className="stat-growth">
                                <TrendingUp size={14} />
                                <span>Comprehensive Coverage</span>
                            </div>
                        </div>
                        <div className="stat-card glass-card fade-in">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #A0522D, #8B4513)' }}>
                                <Zap size={24} />
                            </div>
                            <div className="stat-value">99.5%</div>
                            <div className="stat-label">AI Accuracy Rate</div>
                            <div className="stat-growth">
                                <Award size={14} />
                                <span>Industry Leading</span>
                            </div>
                        </div>
                        <div className="stat-card glass-card fade-in">
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                                <Users size={24} />
                            </div>
                            <div className="stat-value">2</div>
                            <div className="stat-label">Languages Supported</div>
                            <div className="stat-growth">
                                <CheckCircle size={14} />
                                <span>English & Urdu</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
