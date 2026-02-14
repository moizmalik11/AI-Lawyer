import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';
import { MessageSquare, Scale, FileText, Search, ArrowRight, TrendingUp, Users, Database, Zap, Award, CheckCircle, Clock } from 'lucide-react';
import '../styles/Dashboard.css';

export default function Dashboard() {
    const { user } = useAuth();
    const featureSectionsRef = useRef([]);

    // Intersection Observer for scroll animations
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        featureSectionsRef.current.forEach(section => {
            if (section) {
                observer.observe(section);
            }
        });

        return () => {
            featureSectionsRef.current.forEach(section => {
                if (section) {
                    observer.unobserve(section);
                }
            });
        };
    }, []);

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

    const featureDetails = [
        {
            path: '/chatbot',
            icon: MessageSquare,
            title: 'AI Legal Chatbot',
            color: '#3b82f6',
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            domain: 'Civil Law Legal Assistance',
            whatItDoes: 'An intelligent conversational AI assistant specialized in Pakistani Civil Law, including Contract Law, Property Law, Family Law, and Tort Law. The chatbot provides instant legal guidance by analyzing thousands of legal documents and court judgments to deliver accurate, context-aware answers.',
             keyCapabilities: [
                'Bilingual support (English & Urdu) for accessible legal information',
                'Real-time answers with direct citations from Pakistani legal codes',
                'Context-aware responses based on civil law domain expertise',
                'Instant case law references from Supreme Court and High Court judgments'
            ],
            howToUse: [
                'Navigate to the "Chatbot" section from the sidebar menu',
                'Type your legal question in English or Urdu. Ask specific questions like "What are tenant rights in Pakistan?" or "عقد کی خلاف ورزی کے لیے کیا چارہ جوئی ہے؟"',
                'Press Enter or click Send button to submit your question',
                'Review the AI-generated response with relevant legal citations and references',
                'Click on citation links to explore source documents or ask follow-up questions for clarification'
            ]
        },
        {
            path: '/judgments',
            icon: Scale,
            title: 'Judgment Summarization',
            color: '#d4af37',
            gradient: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
            domain: 'Court Judgment Analysis',
            whatItDoes: 'An advanced AI-powered tool that transforms lengthy, complex court judgments into concise, easy-to-understand summaries. This feature extracts key legal principles, important facts, court holdings, and precedential value from Supreme Court and High Court decisions.',
             keyCapabilities: [
                'Access to 10,000+ court judgments from Pakistani Superior Courts',
                'AI-generated summaries highlighting ratio decidendi (legal reasoning)',
                'Extraction of key facts, legal issues, and court holdings',
                'Identification of important legal precedents and principles'
            ],
            howToUse: [
                'Access the "Judgments" section from the sidebar navigation',
                'Search for cases using case names, parties, or legal topics. For example: "Contract breach" or "Mst. Benazir Bhutto vs Federation"',
                'Browse search results and click on any judgment card to view details',
                'Read the AI-generated summary including case overview, key facts, legal issues, and court decision',
                'Scroll down to view full judgment text or explore related cases for similar precedents'
            ]
        },
        {
            path: '/contracts',
            icon: FileText,
            title: 'Contract Analysis',
            color: '#A0522D',
            gradient: 'linear-gradient(135deg, #A0522D 0%, #8B4513 100%)',
            domain: 'Contract Risk & Compliance Review',
            whatItDoes: 'A sophisticated AI contract analyzer that reviews legal agreements to identify potential risks, unfavorable clauses, legal loopholes, and compliance issues. The tool provides detailed analysis based on Pakistani Contract Law and highlights areas requiring attention or negotiation.',
              keyCapabilities: [
                'Automated risk detection in contract clauses',
                'Identification of unfavorable terms and one-sided obligations',
                'Compliance checking against Pakistani Contract Act 1872',
                'Extraction and categorization of key obligations for both parties'
            ],
            howToUse: [
                'Navigate to the "Contracts" section from the sidebar',
                'Click "Upload Contract" and select your document (PDF, DOCX, or TXT format)',
                'Wait 30-60 seconds for AI to analyze the contract for risks, obligations, and compliance issues',
                'Review the analysis report showing risk score, identified risks, key obligations, and unfavorable clauses',
                'Click on highlighted clauses for detailed explanations or download the report for reference'
            ]
        },
        {
            path: '/search',
            icon: Search,
            title: 'Advanced Legal Search',
            color: '#8b5cf6',
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            domain: 'Legal Database Search Engine',
            whatItDoes: 'A powerful semantic search engine that intelligently searches across Pakistan\'s entire legal database, including federal and provincial laws, acts, ordinances, and court judgments. Unlike traditional keyword search, our AI understands context and legal concepts to deliver more relevant results.',
              keyCapabilities: [
                'Semantic search that understands legal concepts and context',
                'Comprehensive coverage: Federal laws, Punjab, Sindh, KPK, Balochistan codes',
                'Advanced filtering by jurisdiction, date range, and legal domain',
                'Cross-reference discovery showing related laws and amendments'
            ],
            howToUse: [
                'Open the "Search" section from the sidebar menu',
                'Enter your search query using natural language or legal terms. For example: "inheritance laws" or "tenant eviction procedures"',
                'Apply filters to refine results: Select jurisdiction (Federal/Provincial), legal domain (Civil/Criminal), or date range',
                'Click "Search" or press Enter to browse relevant laws, acts, and judgments',
                'Click on any result to view full text, related provisions, or export results as PDF'
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
                        Specialized in Pakistani Civil Law - Your AI assistant for Contract Law, Property Law, Family Law, and Tort Law
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

            {/* Auto-Sliding Feature Carousel */}
            <section className="feature-slider-section">
                <div className="dashboard-container">
                    <div className="section-header">
                        <h2 className="section-title">Explore All Features</h2>
                        <p className="section-description">Professional legal tools powered by cutting-edge AI technology</p>
                    </div>
                    <div className="feature-slider-wrapper">
                        <div className="feature-slider">
                            {/* Duplicate cards for seamless loop */}
                            {[...features, ...features].map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <Link
                                        key={`${feature.path}-${index}`}
                                        to={feature.path}
                                        className="feature-slide-card"
                                    >
                                        <div className="slide-card-gradient" style={{ background: feature.gradient }}></div>
                                        <div className="slide-icon" style={{ color: feature.color }}>
                                            <Icon size={32} strokeWidth={1.5} />
                                        </div>
                                        <h3 className="slide-title">{feature.title}</h3>
                                        <p className="slide-description">{feature.description}</p>
                                        <div className="slide-features">
                                            {feature.features.map((tag, idx) => (
                                                <span key={idx} className="slide-tag">
                                                    <CheckCircle size={10} />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="slide-footer">
                                            <span className="slide-link-text">Explore</span>
                                            <ArrowRight size={16} className="slide-arrow" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* How to Use - Vertical Feature Explanation */}
            <section className="vertical-features-section">
                <div className="dashboard-container">
                    <div className="section-header">
                        <h2 className="section-title">How to Use Our Platform</h2>
                        <p className="section-description">Comprehensive guides to master each legal tool and maximize your productivity</p>
                    </div>
                    
                    <div className="vertical-features-container">
                        {featureDetails.map((feature, index) => {
                            const Icon = feature.icon;
                            
                            return (
                                <div
                                    key={feature.path}
                                    ref={el => featureSectionsRef.current[index] = el}
                                    className="vertical-feature-section"
                                    data-index={index}
                                >
                                    <div className="feature-content-wrapper">
                                        {/* Feature Header */}
                                        <div className="feature-header-section">
                                            <div className="feature-icon-large" style={{ background: feature.gradient }}>
                                                <Icon size={48} strokeWidth={1.5} />
                                            </div>
                                            <div className="feature-header-text">
                                                <div className="feature-category" style={{ color: feature.color }}>
                                                    {feature.domain}
                                                </div>
                                                <h3 className="feature-main-title">{feature.title}</h3>
                                            </div>
                                        </div>

                                        {/* What It Does */}
                                        <div className="feature-explanation-card glass-card">
                                            <h4 className="card-heading">What It Does</h4>
                                            <p className="feature-description-text">{feature.whatItDoes}</p>
                                            
                                            <div className="key-capabilities">
                                                <h5 className="capabilities-heading">Key Capabilities:</h5>
                                                <ul className="capabilities-list">
                                                    {feature.keyCapabilities.map((capability, idx) => (
                                                        <li key={idx}>
                                                            <CheckCircle size={18} />
                                                            <span>{capability}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* How to Use */}
                                        <div className="feature-steps-card glass-card">
                                            <h4 className="card-heading">How to Use</h4>
                                            <ol className="feature-steps-list">
                                                {feature.howToUse.map((step, stepIdx) => (
                                                    <li key={stepIdx}>
                                                        <span className="step-content">{step}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>

                                        {/* CTA Button */}
                                        <Link to={feature.path} className="feature-cta-btn" style={{ background: feature.gradient }}>
                                            <span>Try {feature.title}</span>
                                            <ArrowRight size={20} />
                                        </Link>
                                    </div>
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
