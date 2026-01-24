import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get('mode') || 'login';
    const [activeTab, setActiveTab] = useState(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (!result.success) {
            setError(result.error || 'Login failed');
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await register(username, email, password);
        setLoading(false);
        if (result.success) {
            setActiveTab('login');
            setError('Account created! Please login.');
            // Optional: Auto-fill email
        } else {
            setError(result.error || 'Signup failed');
        }
    };

    return (
        <div className="hero">
            <div className="hero-content fade-in">
                <h1>Legal Intelligence <br /><span>Reimagined</span></h1>
                <p>Access instant legal insights, summarize complex judgments, and analyze contracts with the power of AI. Tailored for Pakistani Law.</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--accent-color)' }}>✓</span> RAG Technology
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--accent-color)' }}>✓</span> Bilingual Support
                    </div>
                </div>
            </div>

            <div className="glass-card auth-card fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="auth-tabs">
                    <div className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>Login</div>
                    <div className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`} onClick={() => setActiveTab('signup')}>Sign Up</div>
                </div>

                {activeTab === 'login' && (
                    <div className="form-container active">
                        <form onSubmit={handleLogin}>
                            <div className="input-group">
                                <label>Email Address</label>
                                <input type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                {loading ? <span className="spinner"></span> : 'Login to Dashboard'}
                            </button>
                            {error && <p style={{ color: error.includes('created') ? 'var(--success-color)' : 'var(--error-color)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
                        </form>
                    </div>
                )}

                {activeTab === 'signup' && (
                    <div className="form-container active">
                        <form onSubmit={handleSignup}>
                            <div className="input-group">
                                <label>Username</label>
                                <input type="text" required placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Email Address</label>
                                <input type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                {loading ? <span className="spinner"></span> : 'Create Account'}
                            </button>
                            {error && <p style={{ color: 'var(--error-color)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
                        </form>
                    </div>
                )}
            </div>

            <style>{`
        .hero {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
            text-align: center;
        }

        .hero-content {
            max-width: 600px;
            margin-right: 4rem;
            text-align: left;
        }

        .hero h1 {
            font-size: 3.5rem;
            line-height: 1.2;
            margin-bottom: 1.5rem;
            background: linear-gradient(to right, #fff, var(--accent-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero p {
            font-size: 1.2rem;
            color: var(--text-muted);
            margin-bottom: 2rem;
        }

        .auth-card {
            width: 100%;
            max-width: 400px;
        }

        .auth-tabs {
            display: flex;
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--glass-border);
        }

        .auth-tab {
            flex: 1;
            padding: 1rem;
            text-align: center;
            cursor: pointer;
            color: var(--text-muted);
            font-weight: 600;
            transition: all 0.3s;
        }

        .auth-tab.active {
            color: var(--accent-color);
            border-bottom: 2px solid var(--accent-color);
        }

        .form-container {
            display: none;
        }

        .form-container.active {
            display: block;
            animation: fadeIn 0.5s ease;
        }

        @media (max-width: 768px) {
            .hero {
                flex-direction: column;
            }
            .hero-content {
                margin-right: 0;
                margin-bottom: 3rem;
                text-align: center;
            }
        }
      `}</style>
        </div>
    );
}
