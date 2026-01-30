import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';

export default function Search() {
    const [query, setQuery] = useState('');
    const [type, setType] = useState('');
    const [year, setYear] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [documentTypes, setDocumentTypes] = useState([]);

    useEffect(() => {
        fetchDocumentTypes();
        performSearch();
    }, []);

    useEffect(() => {
        performSearch();
    }, [page]);

    const fetchDocumentTypes = async () => {
        try {
            const response = await fetchWithAuth('/search/types');
            const data = await response.json();
            if (data.success) {
                setDocumentTypes(data.types);
            }
        } catch (error) {
            console.error('Error fetching document types:', error);
        }
    };

    const performSearch = async (newPage) => {
        const targetPage = newPage || page;
        setLoading(true);
        setResults([]);

        const params = new URLSearchParams();
        params.append('page', targetPage);
        params.append('limit', 10);
        if (query) params.append('query', query);
        if (type) params.append('document_type', type);
        if (year) params.append('year', year);

        try {
            const response = await fetchWithAuth(`/search?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setResults(data.results);
                setTotalPages(data.totalPages || 1);
                setPage(data.page || 1);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchClick = () => {
        setPage(1);
        performSearch(1);
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, page + 2);

        if (startPage === 1) endPage = Math.min(totalPages, 5);
        if (endPage === totalPages) startPage = Math.max(1, totalPages - 4);

        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                {startPage > 1 && (
                    <>
                        <button className="page-btn" onClick={() => setPage(1)}>1</button>
                        {startPage > 2 && <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>...</span>}
                    </>
                )}
                {pages.map(p => (
                    <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>...</span>}
                        <button className="page-btn" onClick={() => setPage(totalPages)}>{totalPages}</button>
                    </>
                )}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
        );
    };

    return (
        <div className="container" style={{ paddingTop: '3rem' }}>
            <div className="search-container">
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1>Search Legal Database</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Find acts, sections, and judgments across all jurisdictions.</p>
                </div>

                <div className="search-box">
                    <input
                        type="text"
                        placeholder="e.g., 'punishment for theft' or 'employee rights'"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
                    />
                    <button className="btn btn-primary" onClick={handleSearchClick}>Search</button>
                </div>

                <div className="filters-grid">
                    <div className="input-group" style={{ margin: 0 }}>
                        <label>Document Type</label>
                        <select value={type} onChange={(e) => { setType(e.target.value); handleSearchClick(); }}>
                            <option value="">All Types</option>
                            {documentTypes.map(t => (
                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                        <label>Year</label>
                        <input
                            type="number"
                            placeholder="e.g. 2023"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            onBlur={handleSearchClick}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        <div className="results-list">
                                {results.length > 0 ? results.map((result, idx) => (
                                    <div key={idx} className="result-item fade-in">
                                        <div className="result-title">{result.title || 'Untitled Document'}</div>
                                        <div className="result-meta">
                                            <span>{result.metadata.document_type || 'Document'}</span>
                                            <span>•</span>
                                            <span>{result.metadata.year || 'Year N/A'}</span>
                                            <span>•</span>
                                            <span>{result.metadata.court || 'Jurisdiction N/A'}</span>
                                        </div>
                                        <div className="result-links" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                                            {result.metadata.source_page && (
                                                <a href={result.metadata.source_page} target="_blank" style={{ color: 'var(--accent-color)', marginRight: '1rem', textDecoration: 'none' }}>🌐 Original Web Page</a>
                                            )}
                                            {result.metadata.source_url && (
                                                <a href={result.metadata.source_url} target="_blank" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>📄 PDF Document</a>
                                            )}
                                        </div>
                                        <div className="result-snippet">
                            {result.text ? result.text.substring(0, 300) + '...' : ''}
                        </div>
                    </div>
                )) : (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No results found.</p>
                )}
            </div>
            {renderPagination()}
        </>
    )}
</div>

            <style>{`
        .search-container {
            max-width: 800px;
            margin: 0 auto;
        }

        .search-box {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .search-box input {
            flex: 1;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            color: var(--text-color);
            font-size: 1.1rem;
        }

        .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
            background: rgba(15, 23, 42, 0.5);
            padding: 1.5rem;
            border-radius: 1rem;
            border: 1px solid var(--glass-border);
        }

        .results-list {
            margin-top: 2rem;
        }

        .result-item {
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid var(--glass-border);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 1rem;
            transition: all 0.2s;
        }

        .result-item:hover {
            background: rgba(30, 41, 59, 0.8);
            border-color: var(--accent-color);
        }

        .result-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--accent-color);
            margin-bottom: 0.5rem;
            display: block;
        }

        .result-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-bottom: 1rem;
        }

        .result-snippet {
            color: var(--text-color);
            font-size: 0.95rem;
            line-height: 1.6;
        }

        .pagination {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin-top: 2rem;
            flex-wrap: wrap;
        }

        .page-btn {
            padding: 0.5rem 1rem;
            border: 1px solid var(--glass-border);
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-color);
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .page-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
            border-color: var(--accent-color);
        }

        .page-btn.active {
            background: var(--accent-color);
            color: #fff;
            border-color: var(--accent-color);
        }

        .page-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
            .search-section {
                margin-bottom: 1.5rem;
            }
            
            .search-input {
                font-size: 1rem;
                padding: 0.875rem 1.25rem;
            }
            
            .filters-grid {
                grid-template-columns: 1fr;
                padding: 1rem;
            }
            
            .result-meta {
                flex-direction: column;
                gap: 0.5rem;
            }
        }
      `}</style>
        </div>
    );
}
