import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Scale, FileText, Search, ArrowRight } from 'lucide-react';
import '../styles/Dashboard.css';

export default function Dashboard() {
    const { user } = useAuth();

    const features = [
        {
            path: '/chatbot',
            icon: MessageSquare,
            title: 'AI Legal Chatbot',
            description: 'Ask questions in English or Urdu and get instant legal answers with citations.',
            color: '#3b82f6'
        },
        {
            path: '/judgments',
            icon: Scale,
            title: 'Judgment Summarization',
            description: 'Search and summarize complex court judgments into key points.',
            color: '#d4af37'
        },
        {
            path: '/contracts',
            icon: FileText,
            title: 'Contract Analysis',
            description: 'Upload contracts to identify risks, loopholes, and key obligations.',
            color: '#10b981'
        },
        {
            path: '/search',
            icon: Search,
            title: 'Advanced Legal Search',
            description: 'Search across all acts, laws, and judgments with advanced filters.',
            color: '#8b5cf6'
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
                <div className="hero-content">
                    <h1 className="hero-title">
                        Welcome back, <span className="highlight">{user?.username || 'User'}</span>
                    </h1>
                    <p className="hero-subtitle">
                        Your AI-powered legal research assistant is ready to help
                    </p>
                </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
                <div className="dashboard-container">
                    <h2 className="section-title">Quick Access</h2>
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
                                    <div className="feature-icon" style={{ color: feature.color }}>
                                        <Icon size={32} />
                                    </div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                    <div className="feature-arrow">
                                        <ArrowRight size={20} />
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
                    <div className="stats-grid">
                        <div className="stat-card glass-card fade-in">
                            <div className="stat-value">1000+</div>
                            <div className="stat-label">Legal Judgments</div>
                        </div>
                        <div className="stat-card glass-card fade-in">
                            <div className="stat-value">500+</div>
                            <div className="stat-label">Pakistani Laws</div>
                        </div>
                        <div className="stat-card glass-card fade-in">
                            <div className="stat-value">24/7</div>
                            <div className="stat-label">AI Assistance</div>
                        </div>
                        <div className="stat-card glass-card fade-in">
                            <div className="stat-value">2</div>
                            <div className="stat-label">Languages</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
