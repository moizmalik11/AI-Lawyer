import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Scale, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ArrowLeft,
  Shield,
  Sparkles,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/Auth.css';

export default function Auth() {
    const [searchParams] = useSearchParams();
    const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
    const [activeTab, setActiveTab] = useState(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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
        setSuccess('');
        setLoading(true);
        
        const result = await login(email, password);
        setLoading(false);
        
        if (!result.success) {
            setError(result.error || 'Login failed. Please check your credentials.');
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        
        setLoading(true);
        const result = await register(username, email, password);
        setLoading(false);
        
        if (result.success) {
            setSuccess('Account created successfully! Please login to continue.');
            setActiveTab('login');
            setEmail(email);
            setPassword('');
            setUsername('');
        } else {
            setError(result.error || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            {/* Back Button */}
            <button 
                onClick={() => navigate('/')}
                className="auth-back-btn"
                aria-label="Back to home"
            >
                <ArrowLeft size={20} />
            </button>
            
            {/* Left Side - Branding */}
            <div className="auth-brand-section">
                <div className="auth-logo-section">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            <Scale size={32} />
                        </div>
                        <span className="auth-logo-text">Smart Lawyer</span>
                    </div>
                    <ThemeToggle className="auth-theme-toggle" />
                </div>

                <div className="auth-brand-content">
                    <h1>
                        Welcome to the <span className="highlight">Future</span> of Legal Research
                    </h1>
                    <p>
                        Access comprehensive Pakistani legal knowledge powered by advanced AI technology. 
                        Get instant answers, analyze judgments, and understand contracts with ease.
                    </p>
                </div>

                <div className="auth-features">
                    <div className="auth-feature-item">
                        <div className="auth-feature-icon">
                            <Sparkles size={24} />
                        </div>
                        <div className="auth-feature-text">
                            <h4>AI-Powered Intelligence</h4>
                            <p>Advanced RAG technology for accurate legal research</p>
                        </div>
                    </div>
                    <div className="auth-feature-item">
                        <div className="auth-feature-icon">
                            <Shield size={24} />
                        </div>
                        <div className="auth-feature-text">
                            <h4>Comprehensive Database</h4>
                            <p>10,000+ legal documents and judgments at your fingertips</p>
                        </div>
                    </div>
                    <div className="auth-feature-item">
                        <div className="auth-feature-icon">
                            <Zap size={24} />
                        </div>
                        <div className="auth-feature-text">
                            <h4>Instant Results</h4>
                            <p>Get answers in seconds with bilingual support</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="auth-form-section">
                <div className="auth-form-container">
                    <div className="auth-form-header">
                        <h2>{activeTab === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                        <p>
                            {activeTab === 'login' 
                                ? 'Enter your credentials to access your account' 
                                : 'Sign up to start your legal research journey'
                            }
                        </p>
                    </div>

                    <div className="auth-tabs">
                        <button 
                            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('login');
                                setError('');
                                setSuccess('');
                            }}
                        >
                            Login
                        </button>
                        <button 
                            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab('register');
                                setError('');
                                setSuccess('');
                            }}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="success-message">
                            <CheckCircle size={18} />
                            <span>{success}</span>
                        </div>
                    )}

                    {activeTab === 'login' ? (
                        <form className="auth-form" onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <Mail className="input-icon" size={18} />
                                    <input
                                        id="email"
                                        type="email"
                                        className="form-input"
                                        placeholder="your.email@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" size={18} />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-extras">
                                <label className="remember-me">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span>Remember me</span>
                                </label>
                                <span className="forgot-password">Forgot Password?</span>
                            </div>

                            <button type="submit" className="btn-auth" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="btn-auth-loading"></span>
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form className="auth-form" onSubmit={handleSignup}>
                            <div className="form-group">
                                <label htmlFor="username">Full Name</label>
                                <div className="input-wrapper">
                                    <User className="input-icon" size={18} />
                                    <input
                                        id="username"
                                        type="text"
                                        className="form-input"
                                        placeholder="John Doe"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reg-email">Email Address</label>
                                <div className="input-wrapper">
                                    <Mail className="input-icon" size={18} />
                                    <input
                                        id="reg-email"
                                        type="email"
                                        className="form-input"
                                        placeholder="your.email@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reg-password">Password</label>
                                <div className="input-wrapper">
                                    <Lock className="input-icon" size={18} />
                                    <input
                                        id="reg-password"
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-auth" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="btn-auth-loading"></span>
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="auth-footer">
                        {activeTab === 'login' ? (
                            <p>
                                Don't have an account?{' '}
                                <a onClick={() => {
                                    setActiveTab('register');
                                    setError('');
                                    setSuccess('');
                                }}>
                                    Sign up now
                                </a>
                            </p>
                        ) : (
                            <p>
                                Already have an account?{' '}
                                <a onClick={() => {
                                    setActiveTab('login');
                                    setError('');
                                    setSuccess('');
                                }}>
                                    Sign in
                                </a>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
