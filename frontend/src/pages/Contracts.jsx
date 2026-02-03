import { useState } from 'react';
import { marked } from 'marked';
import { fetchWithAuth } from '../utils/api';

export default function Contracts() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        if (file && (file.type === 'application/pdf' || file.type === 'text/plain')) {
            setSelectedFile(file);
        } else {
            alert('Please upload a valid PDF or TXT file.');
        }
    };

    const analyzeContract = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setAnalysis('');

        const formData = new FormData();
        formData.append('contract', selectedFile);

        try {
            const response = await fetchWithAuth('/contracts/analyze', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                setAnalysis(data.analysis);
            } else {
                alert('Analysis failed: ' + data.error);
            }
        } catch (error) {
            alert('An error occurred during analysis.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1>AI Contract Review</h1>
                <p style={{ color: 'var(--text-muted)' }}>Upload your contract (PDF or TXT) to identify risks, loopholes, and key terms.</p>
            </div>

            <div className="glass-card fade-in">
                    <div
                        className={`upload-area ${dragActive ? 'dragover' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <div className="upload-icon">📂</div>
                        <h3>Click to upload or drag and drop</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Supported formats: PDF, TXT (Max 10MB)</p>
                        <input
                            type="file"
                            id="file-input"
                            hidden
                            accept=".pdf,.txt"
                            onChange={handleChange}
                        />
                        {selectedFile && <div className="file-info">Selected: {selectedFile.name}</div>}
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={!selectedFile || loading}
                        onClick={analyzeContract}
                    >
                        {loading ? <><span className="spinner"></span> Analyzing...</> : 'Analyze Contract'}
                </button>
            </div>

            {analysis && (
                <div className="glass-card fade-in" style={{ marginTop: '2rem' }}>
                    <h2 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '2rem' }}>Analysis Report</h2>
                    <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(analysis) }} />
                </div>
            )}

            <style>{`
        .upload-area {
            border: 2px dashed var(--glass-border);
            border-radius: 1rem;
            padding: 4rem 2rem;
            text-align: center;
            background: rgba(255, 255, 255, 0.02);
            transition: all 0.3s;
            cursor: pointer;
            margin-bottom: 2rem;
        }

        .upload-area:hover,
        .upload-area.dragover {
            border-color: #22c55e;
            background: rgba(34, 197, 94, 0.1);
            box-shadow: 0 0 24px rgba(34, 197, 94, 0.15);
        }

        .upload-icon {
            font-size: 3rem;
            color: var(--text-muted);
            margin-bottom: 1rem;
        }

        .file-info {
            margin-top: 1rem;
            color: var(--accent-color);
            font-weight: 500;
        }
        
        @media (max-width: 768px) {
            .upload-area {
                padding: 2rem 1rem;
            }
            
            .upload-icon {
                font-size: 2rem;
            }
        }
      `}</style>
        </div>
    );
}
