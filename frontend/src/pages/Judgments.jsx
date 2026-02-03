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

    const itemsPerPage = 12;

    useEffect(() => {
        const timer = setTimeout(() => {
            loadJudgments();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, page]);

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
            <div className="page-header">
                <div>
                    <h1>Case Law Database</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Browse and summarize recent judgments</p>
                </div>
                <div className="search-bar">
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
                    <div className="judgments-grid">
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
                        <div className="pagination-controls">
                            <button className="btn-icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Page {page} of {totalPages}</span>
                            <button className="btn-icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                        </div>
                    )}
                </>
            )}
        </div>

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
        .page-header {
            padding: 2rem 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .search-bar {
            width: 100%;
            max-width: 500px;
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
            border-color: #22c55e;
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(34, 197, 94, 0.25);
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
        
        @media (max-width: 768px) {
            .page-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1.5rem;
            }
            
            .search-bar {
                max-width: 100%;
            }
            
            .judgments-grid {
                grid-template-columns: 1fr;
            }
        }
      `}</style>
        </>
    );
}
