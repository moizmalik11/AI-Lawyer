import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { fetchWithAuth } from '../utils/api';

export default function Judgments() {
    const [judgments, setJudgments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [modalSummary, setModalSummary] = useState(null);
    const [modalTitle, setModalTitle] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [showCompletion, setShowCompletion] = useState(false);

    const itemsPerPage = 12;

    // Tutorial steps (5 steps with visualization)
    const tutorialSteps = [
        {
            title: "Welcome to Case Law Database! 👋",
            description: "Let me show you how to search and view judgment summaries in just 5 simple steps. This powerful tool helps you quickly find and understand legal cases.",
            highlight: null,
            icon: "👋"
        },
        {
            title: "Step 1: Search for Cases 🔍",
            description: "Use the search bar at the top to find judgments. Type keywords like 'Supreme Court', 'civil rights', 'criminal', or any legal term. Results update automatically as you type.",
            highlight: "search-bar",
            icon: "🔍"
        },
        {
            title: "Step 2: Browse Judgment Cards 📋",
            description: "Scroll through the judgment cards below. Each card displays the court name, year, and case title. All judgments are organized for easy browsing.",
            highlight: "judgments-grid",
            icon: "📋"
        },
        {
            title: "Step 3: View AI Summaries 🤖",
            description: "Click on any judgment card to instantly get an AI-powered summary. This saves time by highlighting key points without reading the full judgment text.",
            highlight: "judgments-grid",
            icon: "🤖"
        },
        {
            title: "Step 4: Navigate Pages 📄",
            description: "Use the arrow buttons at the bottom to browse through multiple pages of results. Move forward or backward to explore more judgments.",
            highlight: "pagination",
            icon: "📄"
        }
    ];

    // Check if tutorial has been seen (for first-time users)
    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('judgmentsTutorialSeen');
        if (!hasSeenTutorial) {
            // Small delay to ensure page is rendered
            setTimeout(() => {
                setShowTutorial(true);
            }, 500);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadJudgments();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, page]);

    const handleNextStep = () => {
        if (tutorialStep < tutorialSteps.length - 1) {
            setTutorialStep(tutorialStep + 1);
        } else if (!showCompletion) {
            setShowCompletion(true);
        } else {
            completeTutorial();
        }
    };

    const handleSkipTutorial = () => {
        completeTutorial();
    };

    const handleRestartTutorial = () => {
        setTutorialStep(0);
        setShowCompletion(false);
        setShowTutorial(true);
    };

    const completeTutorial = () => {
        localStorage.setItem('judgmentsTutorialSeen', 'true');
        setShowTutorial(false);
        setTutorialStep(0);
        setShowCompletion(false);
    };

    const loadJudgments = async () => {
        setLoading(true);
        try {
            const response = await fetchWithAuth(`/judgments?search=${encodeURIComponent(search)}&page=${page}&limit=${itemsPerPage}`);
            const data = await response.json();
            if (data.success) {
                setJudgments(data.data);
                if (data.pagination) {
                    setTotalPages(Math.ceil(data.pagination.total / data.pagination.limit) || 1);
                }
            } else {
                setJudgments([]);
            }
        } catch (error) {
            console.error('Failed to load judgments:', error);
        } finally {
            setLoading(false);
        }
    };

    const openSummary = async (title) => {
        setModalTitle(title);
        setModalSummary(null);
        setSummaryLoading(true);

        try {
            const response = await fetchWithAuth(`/judgments/${encodeURIComponent(title)}/summary`);
            const data = await response.json();
            if (data.success) {
                setModalSummary(data.summary);
            } else {
                setModalSummary('Failed to generate summary: ' + data.error);
            }
        } catch (error) {
            setModalSummary('An error occurred.');
        } finally {
            setSummaryLoading(false);
        }
    };

    return (
        <>
        <div className="container">
            <button 
                className="help-tutorial-btn"
                onClick={handleRestartTutorial}
                title="Show Tutorial"
            >
                <span style={{ fontSize: '1.1rem' }}>❓</span>
                
            </button>
            
            <div className="page-header">
                <div>
                    <h1>Case Law Database</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Browse and summarize recent judgments</p>
                </div>
                <div className="search-bar" id="search-bar-element">
                    <input
                        type="text"
                        placeholder="Search judgments by title or keyword..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                    <button onClick={loadJudgments}>🔍</button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <div className="spinner"></div>
                </div>
            ) : (
                <>
                    <div className="judgments-grid" id="judgments-grid-element">
                            {judgments.length > 0 ? judgments.map((judgment, idx) => (
                            <div key={idx} className="glass-card judgment-card fade-in" onClick={() => openSummary(judgment.title)}>
                                <div className="judgment-meta">
                                    <span>{judgment.court || 'Court N/A'}</span>
                                    <span>•</span>
                                    <span>{judgment.year || 'Year N/A'}</span>
                                </div>
                                <div className="judgment-title">{judgment.title}</div>
                                <div style={{ marginTop: 'auto' }}>
                                    <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.9rem' }}>View Summary</button>
                                </div>
                            </div>
                        )) : (
                            <p style={{ textAlign: 'center', gridColumn: '1/-1', color: 'var(--text-muted)' }}>No judgments found. Try searching for keywords like "civil", "criminal", or "tax".</p>
                        )}
                    </div>

                    {judgments.length > 0 && (
                        <div className="pagination-controls" id="pagination-element">
                            <button className="btn-icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Page {page} of {totalPages}</span>
                            <button className="btn-icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                        </div>
                    )}
                </>
            )}
        </div>

            {/* Tutorial/Onboarding Modal */}
            {showTutorial && (
                <div className="tutorial-overlay">
                    <div className={`tutorial-spotlight ${tutorialSteps[tutorialStep].highlight ? tutorialSteps[tutorialStep].highlight : ''}`}>
                        {tutorialSteps[tutorialStep].highlight && (
                            <div className="spotlight-indicator">
                                <div className="indicator-arrow">↓</div>
                                <div className="indicator-text">Look Here!</div>
                            </div>
                        )}
                    </div>
                    <div className="tutorial-modal">
                        <div className="tutorial-content">
                            {!showCompletion && (
                                <div className="tutorial-header">
                                    <div className="tutorial-icon-large">
                                        {tutorialSteps[tutorialStep].icon}
                                    </div>
                                    <h2>{tutorialSteps[tutorialStep].title}</h2>
                                    <div className="tutorial-progress">
                                        <div className="step-indicators">
                                            {tutorialSteps.map((_, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`step-dot ${index === tutorialStep ? 'active' : ''} ${index < tutorialStep ? 'completed' : ''}`}
                                                >
                                                    {index < tutorialStep ? '✓' : index + 1}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="step-text">Step {tutorialStep + 1} of {tutorialSteps.length}</span>
                                    </div>
                                </div>
                            )}
                            <div className="tutorial-body">
                                {!showCompletion && <p>{tutorialSteps[tutorialStep].description}</p>}
                                {showCompletion && (
                                    <div className="tutorial-complete-msg">
                                        <div className="checkmark-circle">✓</div>
                                        <p className="complete-text">You're all set! Start exploring the Case Law Database now.</p>
                                    </div>
                                )}
                            </div>
                            <div className="tutorial-footer">
                                <button className="btn-skip" onClick={handleSkipTutorial}>
                                    {showCompletion ? 'Get Started ✨' : 'Skip Tutorial'}
                                </button>
                                <button className="btn-next" onClick={handleNextStep}>
                                    {showCompletion ? 'Finish ✓' : 'Next →'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(modalTitle || summaryLoading) && (
                <div className="modal active" onClick={() => { setModalTitle(''); setModalSummary(null); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{modalTitle}</h2>
                            <button className="close-modal" onClick={() => { setModalTitle(''); setModalSummary(null); }}>×</button>
                        </div>
                        <div className="modal-body">
                            {summaryLoading ? (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>
                                    <div className="spinner"></div>
                                    <p style={{ marginTop: '1rem' }}>Generating AI Summary...</p>
                                </div>
                            ) : (
                                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(modalSummary || '') }} />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .help-tutorial-btn {
            position: fixed;
            top: 2rem;
            right: 2rem;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.4rem 0.7rem;
            background: linear-gradient(135deg, rgba(160, 82, 45, 0.15), rgba(139, 69, 19, 0.1));
            border: 2px solid rgba(160, 82, 45, 0.4);
            border-radius: 8px;
            color: var(--text-color);
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .help-tutorial-btn:hover {
            background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
            border-color: #A0522D;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(160, 82, 45, 0.4);
        }

        .help-tutorial-btn:active {
            transform: translateY(0);
        }

        .help-text {
            display: inline;
        }

        .page-header {
            padding: 2rem 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .search-bar {
            width: 100%;
            max-width: 700px;
            position: relative;
        }

        .search-bar input {
            width: 100%;
            padding: 1rem 1.5rem;
            padding-right: 3rem;
            border-radius: 2rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            color: var(--text-color);
            font-size: 1rem;
        }

        .search-bar button {
            position: absolute;
            right: 0.5rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--accent-color);
            cursor: pointer;
            padding: 0.5rem;
        }

        .judgments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }

        .judgment-card {
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .judgment-card:hover {
            border-color: #A0522D;
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(160, 82, 45, 0.4);
        }

        .judgment-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-bottom: 1rem;
        }

        .judgment-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-color);
            flex: 1;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            backdrop-filter: blur(5px);
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }

        .modal.active {
            display: flex;
            animation: fadeIn 0.3s ease;
        }

        .modal-content {
            background: var(--primary-color);
            border: 1px solid var(--glass-border);
            border-radius: 1rem;
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--glass-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(15, 23, 42, 0.95);
            position: sticky;
            top: 0;
        }

        .modal-body {
            padding: 2rem;
            line-height: 1.8;
        }

        .close-modal {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 1.5rem;
            cursor: pointer;
        }

        .close-modal:hover {
            color: var(--error-color);
        }

        .pagination-controls {
            margin-top: 2rem;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
        }

        .btn-icon {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid var(--glass-border);
            color: var(--text-color);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 1.2rem;
        }

        .btn-icon:hover:not(:disabled) {
            background: var(--accent-color);
            border-color: var(--accent-color);
        }

        .btn-icon:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
        
        @media (max-width: 1024px) {
            .judgments-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 768px) {
            .help-tutorial-btn {
                top: 1rem;
                right: 1rem;
                padding: 0.35rem 0.65rem;
                font-size: 0.75rem;
            }

            .page-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1.5rem;
                padding: 1.5rem 0;
            }

            .page-header > div:first-child {
                width: 100%;
            }

            .search-bar {
                max-width: 100%;
            }

            .container h1 {
                font-size: 1.75rem;
            }

            .container p {
                font-size: 0.95rem;
            }

            .search-bar input {
                padding: 0.875rem 1.25rem;
                padding-right: 3rem;
                font-size: 0.95rem;
            }
            
            .judgments-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }

            .judgment-card {
                padding: 1.25rem;
            }

            .judgment-title {
                font-size: 1.1rem;
            }

            .judgment-meta {
                font-size: 0.8rem;
            }

            .pagination-controls {
                margin-top: 1.5rem;
                gap: 0.75rem;
            }

            .btn-icon {
                width: 36px;
                height: 36px;
            }

            .modal {
                padding: 1rem;
            }

            .modal-content {
                max-width: 95%;
                border-radius: 16px;
            }

            .modal-header {
                padding: 1.25rem;
            }

            .modal-header h2 {
                font-size: 1.125rem;
            }

            .modal-body {
                padding: 1.5rem;
            }
        }

        @media (max-width: 480px) {
            .help-tutorial-btn {
                top: 0.75rem;
                right: 0.75rem;
                padding: 0.3rem 0.5rem;
                font-size: 0.7rem;
            }

            .help-text {
                display: none;
            }

            .container h1 {
                font-size: 1.5rem;
                padding-right: 3rem;
            }

            .page-header {
                padding: 1rem 0;
            }

            .help-tutorial-btn {
                padding: 0.75rem 1rem;
                font-size: 0.9rem;
            }

            .help-text {
                display: none;
            }

            .search-bar input {
                padding: 0.75rem 1rem;
                padding-right: 2.5rem;
            }

            .judgment-card {
                padding: 1rem;
            }

            .judgment-title {
                font-size: 1rem;
            }

            .btn {
                font-size: 0.875rem;
                padding: 0.625rem 1rem;
            }

            .modal-body {
                padding: 1.25rem;
            }
        }
        
        /* Tutorial/Onboarding Styles */
        .tutorial-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            animation: fadeIn 0.3s ease;
        }

        .tutorial-spotlight {
            position: fixed;
            pointer-events: none;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8);
            border: 3px solid rgba(160, 82, 45, 0.8);
            border-radius: 16px;
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 10001;
            animation: spotlightPulse 2s infinite;
        }

        @keyframes spotlightPulse {
            0%, 100% {
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8), 
                            0 0 40px rgba(160, 82, 45, 0.6),
                            inset 0 0 20px rgba(160, 82, 45, 0.2);
            }
            50% {
                box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8), 
                            0 0 60px rgba(160, 82, 45, 0.9),
                            inset 0 0 30px rgba(160, 82, 45, 0.3);
            }
        }

        .tutorial-spotlight.search-bar {
            top: 140px;
            right: 5%;
            width: 50%;
            max-width: 700px;
            height: 70px;
            border-radius: 40px;
        }

        .tutorial-spotlight.judgments-grid {
            top: 200px;
            left: 0;
            right: 0;
            bottom: 120px;
            border-radius: 16px;
        }

        .tutorial-spotlight.pagination {
            bottom: 0;
            left: 0;
            right: 0;
            height: 120px;
            border-radius: 16px 16px 0 0;
        }

        .spotlight-indicator {
            display: none;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translate(0, -50%);
            }
            40% {
                transform: translate(5px, -50%);
            }
            60% {
                transform: translate(2px, -50%);
            }
        }

        .indicator-arrow {
            font-size: 2rem;
            color: #A0522D;
            text-shadow: 0 0 20px rgba(160, 82, 45, 0.8);
            animation: arrowPulse 1.5s infinite;
            transform: rotate(-90deg);
        }

        @keyframes arrowPulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.6;
                transform: scale(1.2);
            }
        }

        .indicator-text {
            margin-top: 0.5rem;
            padding: 0.4rem 0.8rem;
            background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
            color: white;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.8rem;
            box-shadow: 0 4px 20px rgba(160, 82, 45, 0.6);
            animation: textPulse 2s infinite;
        }

        @keyframes textPulse {
            0%, 100% {
                box-shadow: 0 4px 20px rgba(160, 82, 45, 0.6);
            }
            50% {
                box-shadow: 0 6px 30px rgba(160, 82, 45, 0.9);
            }
        }

        .tutorial-spotlight.search-bar .spotlight-indicator {
            top: 50%;
            left: auto;
            right: -80px;
            transform: translate(0, -50%);
        }

        .tutorial-spotlight.pagination .spotlight-indicator {
            top: 50%;
        }

        .tutorial-modal {
            position: relative;
            z-index: 10002;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .tutorial-content {
            background: linear-gradient(135deg, rgba(15, 20, 30, 0.98), rgba(10, 15, 25, 0.98));
            border: 2px solid rgba(160, 82, 45, 0.5);
            border-radius: 20px;
            padding: 0;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(160, 82, 45, 0.3);
            backdrop-filter: blur(20px);
            max-height: 90vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }

        .tutorial-header {
            padding: 2rem 2rem 1.5rem;
            border-bottom: 2px solid rgba(160, 82, 45, 0.3);
            background: linear-gradient(135deg, rgba(160, 82, 45, 0.1), rgba(139, 69, 19, 0.05));
            text-align: center;
        }

        .tutorial-icon-large {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounceIn 0.6s ease;
            filter: drop-shadow(0 4px 12px rgba(160, 82, 45, 0.4));
        }

        @keyframes bounceIn {
            0% {
                opacity: 0;
                transform: scale(0.3) rotate(-10deg);
            }
            50% {
                opacity: 1;
                transform: scale(1.1) rotate(5deg);
            }
            100% {
                transform: scale(1) rotate(0deg);
            }
        }

        .tutorial-header h2 {
            margin: 0 0 1.5rem 0;
            font-size: 1.75rem;
            font-weight: 700;
            background: linear-gradient(135deg, #A0522D 0%, #D2B48C 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-family: var(--font-heading);
        }

        .tutorial-progress {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            align-items: center;
        }

        .step-indicators {
            display: flex;
            gap: 0.75rem;
            align-items: center;
            justify-content: center;
        }

        .step-dot {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid rgba(160, 82, 45, 0.3);
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.9rem;
            color: var(--text-muted);
            transition: all 0.4s ease;
        }

        .step-dot.active {
            background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
            border-color: #A0522D;
            color: #ffffff;
            transform: scale(1.2);
            box-shadow: 0 0 20px rgba(160, 82, 45, 0.6);
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0%, 100% {
                box-shadow: 0 0 20px rgba(160, 82, 45, 0.6);
            }
            50% {
                box-shadow: 0 0 30px rgba(160, 82, 45, 0.9);
            }
        }

        .step-dot.completed {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            border-color: #4CAF50;
            color: #ffffff;
            font-size: 1.1rem;
        }

        .step-text {
            font-size: 0.9rem;
            color: var(--text-muted);
            font-weight: 500;
        }

        .tutorial-body {
            padding: 2rem;
            flex: 1;
            overflow-y: auto;
        }

        .tutorial-body p {
            margin: 0;
            font-size: 1.1rem;
            line-height: 1.8;
            color: var(--text-color);
        }

        .tutorial-complete-msg {
            margin-top: 2rem;
            padding: 1.5rem;
            background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(69, 160, 73, 0.05));
            border: 2px solid rgba(76, 175, 80, 0.3);
            border-radius: 12px;
            text-align: center;
            animation: slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideInUp {
            0% {
                opacity: 0;
                transform: translateY(30px) scale(0.9);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .checkmark-circle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            font-size: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.5);
            animation: scaleIn 0.5s ease;
        }

        @keyframes scaleIn {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        .complete-text {
            font-size: 1rem;
            font-weight: 600;
            color: #4CAF50;
            margin: 0;
        }

        .tutorial-footer {
            padding: 1.5rem 2rem 2rem;
            display: flex;
            gap: 1rem;
            justify-content: space-between;
            align-items: center;
        }

        .btn-skip {
            padding: 0.875rem 1.75rem;
            background: transparent;
            border: 2px solid rgba(160, 82, 45, 0.3);
            border-radius: 12px;
            color: var(--text-muted);
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-skip:hover {
            background: rgba(160, 82, 45, 0.1);
            border-color: rgba(160, 82, 45, 0.5);
            color: var(--text-color);
            transform: translateY(-2px);
        }

        .btn-next {
            padding: 0.875rem 2rem;
            background: linear-gradient(135deg, #A0522D 0%, #8B4513 100%);
            border: none;
            border-radius: 12px;
            color: #ffffff;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(160, 82, 45, 0.4);
        }

        .btn-next:hover {
            background: linear-gradient(135deg, #B8713D 0%, #9D5520 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(160, 82, 45, 0.6);
        }

        .btn-next:active {
            transform: translateY(0);
        }

        @media (max-width: 768px) {
            .tutorial-overlay {
                padding: 1rem;
            }

            .tutorial-modal {
                max-width: 100%;
            }

            .tutorial-header {
                padding: 1.5rem 1.5rem 1rem;
            }

            .tutorial-icon-large {
                font-size: 3rem;
            }

            .tutorial-header h2 {
                font-size: 1.4rem;
            }

            .step-indicators {
                gap: 0.5rem;
            }

            .step-dot {
                width: 36px;
                height: 36px;
                font-size: 0.85rem;
            }

            .step-dot.active {
                transform: scale(1.15);
            }

            .tutorial-body {
                padding: 1.5rem;
            }

            .tutorial-body p {
                font-size: 1rem;
            }

            .checkmark-circle {
                width: 50px;
                height: 50px;
                font-size: 1.75rem;
            }

            .tutorial-footer {
                padding: 1rem 1.5rem 1.5rem;
                flex-direction: column-reverse;
                gap: 0.75rem;
            }

            .btn-skip,
            .btn-next {
                width: 100%;
                padding: 0.875rem 1.5rem;
            }

            .tutorial-spotlight.search-bar {
                top: 120px;
                height: 60px;
                width: 60%;
                right: 2%;
            }

            .tutorial-spotlight.judgments-grid {
                top: 200px;
                bottom: 100px;
            }

            .tutorial-spotlight.pagination {
                height: 100px;
            }

            .tutorial-modal {
                max-height: 85vh;
            }

            .indicator-arrow {
                font-size: 2.5rem;
            }

            .indicator-text {
                font-size: 0.85rem;
                padding: 0.4rem 0.875rem;
            }
        }

        @media (max-width: 480px) {
            .tutorial-icon-large {
                font-size: 2.5rem;
            }

            .tutorial-header h2 {
                font-size: 1.2rem;
            }

            .tutorial-body p {
                font-size: 0.95rem;
                line-height: 1.6;
            }

            .step-text {
                font-size: 0.85rem;
            }

            .step-dot {
                width: 32px;
                height: 32px;
                font-size: 0.8rem;
            }

            .checkmark-circle {
                width: 45px;
                height: 45px;
                font-size: 1.5rem;
            }

            .complete-text {
                font-size: 0.9rem;
            }

            .indicator-arrow {
                font-size: 2rem;
            }

            .indicator-text {
                font-size: 0.8rem;
                padding: 0.35rem 0.75rem;
            }

            .tutorial-modal {
                max-height: 80vh;
            }

            .tutorial-spotlight.search-bar {
                top: 100px;
                height: 55px;
                width: 70%;
                right: 1%;
            }

            .tutorial-spotlight.search-bar .spotlight-indicator {
                right: -60px;
                font-size: 0.75rem;
            }

            .tutorial-complete-msg {
                padding: 1rem;
                margin-top: 1.5rem;
            }
        }
      `}</style>
        </>
    );
}
