import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <>
            <Navbar />
            <div className="container">
                <div className="welcome-section fade-in">
                    <h1>Welcome back, <span style={{ color: 'var(--accent-color)' }}>{user?.username || 'User'}</span></h1>
                    <p>Select a module to get started with your legal research and analysis.</p>
                </div>

                <div className="dashboard-grid">
                    {/* Chatbot Module */}
                    <Link to="/chatbot" className="glass-card feature-card fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="icon">💬</div>
                        <h3>AI Legal Chatbot</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Ask questions in English or Urdu and get instant legal answers with citations.</p>
                    </Link>

                    {/* Judgment Summarization */}
                    <Link to="/judgments" className="glass-card feature-card fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="icon">📜</div>
                        <h3>Judgment Summarization</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Search and summarize complex court judgments into key points.</p>
                    </Link>

                    {/* Contract Summarization */}
                    <Link to="/contracts" className="glass-card feature-card fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="icon">📝</div>
                        <h3>Contract Analysis</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Upload contracts to identify risks, loopholes, and key obligations.</p>
                    </Link>

                    {/* Legal Search */}
                    <Link to="/search" className="glass-card feature-card fade-in" style={{ animationDelay: '0.4s' }}>
                        <div className="icon">🔍</div>
                        <h3>Advanced Legal Search</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Search across all acts, laws, and judgments with advanced filters.</p>
                    </Link>
                </div>
            </div>
            <style>{`
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .feature-card {
            padding: 2.5rem;
            text-align: center;
            transition: all 0.4s ease;
            cursor: pointer;
            text-decoration: none;
            display: block;
            height: 100%;
        }

        .feature-card:hover {
            transform: translateY(-10px);
            border-color: var(--accent-color);
            box-shadow: 0 12px 40px rgba(212, 175, 55, 0.15);
        }

        .icon {
            font-size: 3rem;
            margin-bottom: 1.5rem;
            display: inline-block;
            background: rgba(255, 255, 255, 0.1);
            width: 80px;
            height: 80px;
            line-height: 80px;
            border-radius: 50%;
            color: var(--accent-color);
        }

        .welcome-section {
            text-align: center;
            padding: 4rem 0 2rem;
        }

        .welcome-section h1 {
            font-size: 2.5rem;
        }

        .welcome-section p {
            color: var(--text-muted);
            font-size: 1.1rem;
        }
      `}</style>
        </>
    );
}
