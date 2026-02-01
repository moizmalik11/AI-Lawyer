import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { marked } from 'marked';
import { fetchWithAuth } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

export default function Chatbot() {
    const [chats, setChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalSource, setModalSource] = useState(null);
    const { theme } = useTheme();

    const messagesEndRef = useRef(null);
    const hasMessages = messages.length > 0;

    useEffect(() => {
        // Hide main sidebar when component mounts
        const mainSidebar = document.querySelector('.sidebar:not(.chat-sidebar)');
        const mainContent = document.querySelector('.main-content');
        if (mainSidebar) {
            mainSidebar.style.transform = 'translateX(-100%)';
        }
        if (mainContent) {
            mainContent.style.marginLeft = '0';
        }

        // Show main sidebar when component unmounts
        return () => {
            if (mainSidebar) {
                mainSidebar.style.transform = 'translateX(0)';
            }
            if (mainContent) {
                mainContent.style.marginLeft = '280px';
            }
        };
    }, []);

    useEffect(() => {
        loadChatHistory();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadChatHistory = async () => {
        try {
            const response = await fetchWithAuth('/chat/history');
            const data = await response.json();
            if (data.success) {
                setChats(data.chats);
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const loadChat = async (chatId) => {
        try {
            const response = await fetchWithAuth(`/chat/${chatId}`);
            const data = await response.json();
            if (data.success) {
                setCurrentChatId(chatId);
                setMessages(data.chat.messages);
            }
        } catch (error) {
            console.error('Failed to load chat:', error);
        }
    };

    const createNewChat = () => {
        setCurrentChatId(null);
        setMessages([]);
    };

    const deleteChat = async (chatId, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this chat?')) return;
        try {
            await fetchWithAuth(`/chat/${chatId}`, { method: 'DELETE' });
            if (currentChatId === chatId) createNewChat();
            loadChatHistory();
        } catch (error) {
            console.error('Failed to delete chat:', error);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        let chatId = currentChatId;

        // Create new chat if needed
        if (!chatId) {
            try {
                const createRes = await fetchWithAuth('/chat/new', {
                    method: 'POST',
                    body: JSON.stringify({ title: input.substring(0, 30) + '...' })
                });
                const createData = await createRes.json();
                if (createData.success) {
                    chatId = createData.chat._id;
                    setCurrentChatId(chatId);
                    loadChatHistory();
                }
            } catch (e) {
                console.error('Error creating chat:', e);
            }
        }

        try {
            const response = await fetchWithAuth('/chat/ask', {
                method: 'POST',
                body: JSON.stringify({ query: userMessage.content, chatId })
            });
            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.answer, sources: data.sources }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error: ' + data.error }]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <aside className="chat-sidebar">
            <div className="chat-sidebar-header">
                <Link to="/dashboard" className="chat-back-btn">
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </Link>
                <div className="sidebar-logo-section">
                    <span className="sidebar-logo-icon">⚖️</span>
                    <h2 className="chat-sidebar-title">AI Legal Assistant</h2>
                </div>
            </div>
                <button className="new-chat-btn" onClick={createNewChat}>
                    <svg className="new-chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>New Chat</span>
                </button>
                <div className="chat-history-section">
                    <div className="chat-history-header">Recent Chats</div>
                    <div id="chat-history-list">
                        {chats.length === 0 ? (
                            <div className="empty-history">
                                <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                <p>No chat history yet</p>
                            </div>
                        ) : (
                            chats.map(chat => (
                                <div 
                                    key={chat._id} 
                                    className={`chat-history-item ${currentChatId === chat._id ? 'active' : ''}`} 
                                    onClick={() => loadChat(chat._id)}
                                >
                                    <svg className="chat-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <span className="chat-item-title">{chat.title}</span>
                                    <button 
                                        className="delete-chat-btn" 
                                        onClick={(e) => deleteChat(chat._id, e)}
                                        aria-label="Delete chat"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </aside>

            <div className="main-chat-area">
                {!hasMessages ? (
                    <div className="welcome-screen">
                        <div className="welcome-content">
                            <div className="welcome-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <circle cx="12" cy="17" r="0.5" fill="currentColor" />
                                </svg>
                            </div>
                            <h1 className="welcome-title">Your AI Legal Assistant is here</h1>
                            <p className="welcome-subtitle">How can I help you today?</p>
                        </div>
                        <div className="input-area-centered">
                            <div className="input-wrapper">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { 
                                        if (e.key === 'Enter' && !e.shiftKey) { 
                                            e.preventDefault(); 
                                            sendMessage(); 
                                        } 
                                    }}
                                    className="chat-input-centered"
                                    placeholder="Ask your legal question..."
                                    rows="1"
                                />
                                <button 
                                    className="send-btn-centered" 
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="chat-messages">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`message-wrapper ${msg.role}`}>
                                    <div className={`message ${msg.role}`}>
                                        <div className="message-content">
                                            {msg.role === 'user' ? (
                                                <p className="user-message-text">{msg.content}</p>
                                            ) : (
                                                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
                                            )}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="sources-section">
                                                    <div className="sources-header">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                        </svg>
                                                        <span>Sources</span>
                                                    </div>
                                                    <div className="sources-list">
                                                        {msg.sources.map((source, i) => (
                                                            <button key={i} className="source-badge-new" onClick={() => setModalSource(source)}>
                                                                <span className="source-number">{i + 1}</span>
                                                                <span className="source-title">{source.document?.title || source.title || 'Source'}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="message-wrapper assistant">
                                    <div className="message assistant">
                                        <div className="message-content">
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="input-area">
                            <div className="input-wrapper">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { 
                                        if (e.key === 'Enter' && !e.shiftKey) { 
                                            e.preventDefault(); 
                                            sendMessage(); 
                                        } 
                                    }}
                                    className="chat-input"
                                    placeholder="Type your legal question..."
                                    rows="1"
                                />
                                <button 
                                    className="send-btn" 
                                    onClick={sendMessage}
                                    disabled={!input.trim() || loading}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </>
                )}
                </div>

            {modalSource && (
                <div className="modal active" onClick={() => setModalSource(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ color: 'var(--accent-color)', margin: 0 }}>Source Details</h3>
                            <button className="close-modal" onClick={() => setModalSource(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <h4 style={{ marginBottom: '1rem' }}>{modalSource.document?.title || modalSource.title}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                <div><strong>Type:</strong> {modalSource.document?.type || modalSource.type || 'N/A'}</div>
                                <div><strong>Year:</strong> {modalSource.document?.year || modalSource.year || 'N/A'}</div>
                                <div><strong>Court:</strong> {modalSource.document?.court || modalSource.court || 'N/A'}</div>
                                <div><strong>Score:</strong> {modalSource.relevance_score || modalSource.score || 'N/A'}</div>
                            </div>

                            {modalSource.links && (
                                <div style={{ marginBottom: '1rem' }}>
                                    {modalSource.links.document_url && (
                                        <a href={modalSource.links.document_url} target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', marginRight: '0.5rem' }}>📄 View Original PDF</a>
                                    )}
                                    {modalSource.links.source_page && (
                                        <a href={modalSource.links.source_page} target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>🌐 View Source Page</a>
                                    )}
                                </div>
                            )}

                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Excerpt:</h4>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{modalSource.chunk?.text || modalSource.text || modalSource.content || 'No excerpt available.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        /* Sidebar Styling */
        .chat-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: 260px;
            height: 100vh;
            background: ${theme === 'dark' 
                ? 'var(--glass-bg)' 
                : 'rgba(255, 255, 255, 0.98)'};
            backdrop-filter: blur(12px);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            padding: 0;
            overflow: hidden;
            z-index: 100;
            flex-shrink: 0;
            box-shadow: ${theme === 'dark' 
                ? '2px 0 12px rgba(0, 0, 0, 0.2)' 
                : '2px 0 12px rgba(15, 23, 42, 0.06)'};
        }
        
        .chat-sidebar-header {
            padding: 1.5rem 1.5rem 1rem;
            border-bottom: 1px solid var(--glass-border);
            background: ${theme === 'dark' 
                ? 'rgba(10, 15, 30, 0.9)' 
                : 'rgba(255, 255, 255, 0.9)'};
            position: sticky;
            top: 0;
            z-index: 20;
        }

        .chat-back-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            margin-bottom: 1rem;
            background: transparent;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            width: fit-content;
        }

        .chat-back-btn:hover {
            color: var(--accent-color);
            border-color: var(--accent-color);
            background: ${theme === 'dark' 
                ? 'rgba(13, 110, 31, 0.1)' 
                : 'rgba(13, 110, 31, 0.05)'};
            transform: translateX(-3px);
        }

        .chat-back-btn:active {
            transform: translateX(-1px) scale(0.98);
        }

        .sidebar-logo-section {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0 0.25rem;
        }

        .sidebar-logo-icon {
            font-size: 2rem;
            filter: drop-shadow(0 2px 8px rgba(212, 175, 55, 0.3));
        }
        
        .chat-sidebar-title {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-family: var(--font-heading);
            letter-spacing: 0.02em;
        }

        .new-chat-btn {
            margin: 1rem 1rem;
            padding: 0.75rem 1rem;
            background: ${theme === 'dark'
                ? 'linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%)'
                : 'linear-gradient(135deg, var(--accent-color) 0%, var(--accent-dark) 100%)'};
            color: ${theme === 'dark' ? 'var(--primary-color)' : '#ffffff'};
            border: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 8px rgba(13, 110, 31, 0.2);
            flex-shrink: 0;
        }

        .new-chat-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(13, 110, 31, 0.3);
        }

        .new-chat-icon {
            width: 18px;
            height: 18px;
        }

        .chat-history-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .chat-history-header {
            padding: 0.75rem 1rem 0.5rem;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-muted);
        }
        
        #chat-history-list {
            flex: 1;
            overflow-y: auto;
            padding: 0 1rem 1rem;
        }

        #chat-history-list::-webkit-scrollbar {
            width: 6px;
        }

        #chat-history-list::-webkit-scrollbar-track {
            background: transparent;
        }

        #chat-history-list::-webkit-scrollbar-thumb {
            background: ${theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(0, 0, 0, 0.2)'};
            border-radius: 3px;
        }

        #chat-history-list::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.3)' 
                : 'rgba(0, 0, 0, 0.3)'};
        }

        .empty-history {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 1rem;
            text-align: center;
            color: var(--text-muted);
        }

        .empty-icon {
            width: 48px;
            height: 48px;
            margin-bottom: 1rem;
            opacity: 0.5;
        }

        .empty-history p {
            font-size: 0.9rem;
        }

        .chat-history-item {
            padding: 0.75rem 0.875rem;
            margin-bottom: 0.5rem;
            border-radius: 10px;
            cursor: pointer;
            color: var(--text-color);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: ${theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.03)' 
                : 'rgba(15, 23, 42, 0.03)'};
            border: 1px solid transparent;
        }

        .chat-history-item:hover {
            background: ${theme === 'dark' 
                ? 'rgba(13, 110, 31, 0.12)' 
                : 'rgba(13, 110, 31, 0.08)'};
            border-color: ${theme === 'dark' 
                ? 'rgba(13, 110, 31, 0.25)' 
                : 'rgba(13, 110, 31, 0.15)'};
            transform: translateX(2px);
        }

        .chat-history-item.active {
            background: ${theme === 'dark'
                ? 'linear-gradient(135deg, rgba(13, 110, 31, 0.2) 0%, rgba(10, 85, 24, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(13, 110, 31, 0.15) 0%, rgba(10, 85, 24, 0.1) 100%)'};
            border-color: var(--accent-color);
            box-shadow: 0 2px 8px rgba(13, 110, 31, 0.15);
            border-left: 3px solid var(--accent-color);
        }

        .chat-item-icon {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
            opacity: 0.7;
        }

        .chat-item-title {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 0.9rem;
        }

        .delete-chat-btn {
            opacity: 0;
            background: ${theme === 'dark' 
                ? 'rgba(220, 38, 38, 0.1)' 
                : 'rgba(220, 38, 38, 0.08)'};
            border: none;
            color: var(--error-color);
            width: 28px;
            height: 28px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .delete-chat-btn svg {
            width: 16px;
            height: 16px;
        }

        .chat-history-item:hover .delete-chat-btn {
            opacity: 1;
        }

        .delete-chat-btn:hover {
            background: var(--error-color);
            color: white;
            transform: scale(1.1);
        }

        /* Main Chat Area */
        .main-chat-area {
            margin-left: 260px;
            height: 100vh;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            background: ${theme === 'dark'
                ? 'var(--background-primary)'
                : 'var(--background-secondary)'};
        }

        /* Welcome Screen */
        .welcome-screen {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            position: relative;
        }

        .welcome-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            margin-bottom: 3rem;
            animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .welcome-icon {
            width: 64px;
            height: 64px;
            margin-bottom: 1.5rem;
            color: var(--accent-color);
            animation: float 3s ease-in-out infinite;
        }

        .welcome-icon svg {
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 4px 12px rgba(13, 110, 31, 0.3));
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }

        .welcome-title {
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 0.75rem;
            background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-family: var(--font-heading);
            line-height: 1.3;
        }

        .welcome-subtitle {
            font-size: 1.125rem;
            text-align: center;
            color: var(--text-muted);
            margin-bottom: 0;
        }

        /* Input Area Centered */
        .input-area-centered {
            width: 100%;
            max-width: 700px;
            padding: 0;
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .input-wrapper {
            position: relative;
            display: flex;
            align-items: flex-end;
            gap: 0.75rem;
        }

        .chat-input-centered,
        .chat-input {
            flex: 1;
            background: ${theme === 'dark'
                ? 'rgba(26, 35, 50, 0.8)'
                : 'rgba(255, 255, 255, 0.9)'};
            border: 2px solid ${theme === 'dark'
                ? 'rgba(13, 110, 31, 0.2)'
                : 'rgba(13, 110, 31, 0.15)'};
            border-radius: 14px;
            padding: 0.75rem 1rem;
            color: var(--text-color);
            font-family: var(--font-main);
            font-size: 0.95rem;
            resize: none;
            max-height: 120px;
            min-height: 42px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .chat-input-centered:focus,
        .chat-input:focus {
            outline: none;
            border-color: var(--accent-color);
            box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
        }

        .chat-input-centered::placeholder,
        .chat-input::placeholder {
            color: var(--text-muted);
        }

        .send-btn-centered,
        .send-btn {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%);
            border: none;
            color: ${theme === 'dark' ? 'var(--primary-color)' : '#ffffff'};
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(13, 110, 31, 0.25);
            flex-shrink: 0;
        }

        .send-btn-centered:hover:not(:disabled),
        .send-btn:hover:not(:disabled) {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 4px 16px rgba(13, 110, 31, 0.35);
        }

        .send-btn-centered:disabled,
        .send-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .send-btn-centered svg,
        .send-btn svg {
            width: 20px;
            height: 20px;
        }

        /* Chat Messages */
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem 2rem;
            scroll-behavior: smooth;
            display: flex;
            flex-direction: column;
            max-height: calc(100vh - 80px);
        }

        .chat-messages::-webkit-scrollbar {
            width: 8px;
        }

        .chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }

        .chat-messages::-webkit-scrollbar-thumb {
            background: ${theme === 'dark'
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(0, 0, 0, 0.2)'};
            border-radius: 4px;
        }

        .message-wrapper {
            margin-bottom: 1rem;
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message-wrapper.user {
            flex-direction: row-reverse;
        }

        .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.2s ease;
            position: relative;
        }

        .assistant-avatar {
            background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-light) 100%);
            color: ${theme === 'dark' ? 'var(--primary-color)' : '#ffffff'};
            box-shadow: 0 2px 8px rgba(13, 110, 31, 0.3);
        }

        .user-avatar {
            background: ${theme === 'dark'
                ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.5), rgba(71, 85, 105, 0.5))'
                : 'linear-gradient(135deg, rgba(15, 23, 42, 0.15), rgba(30, 41, 59, 0.15))'};
            color: var(--text-color);
            box-shadow: 0 2px 8px ${theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(15, 23, 42, 0.08)'};
        }

        .message-avatar svg {
            width: 18px;
            height: 18px;
        }

        .message {
            max-width: 80%;
            position: relative;
        }

        .message.user {
            margin-left: auto;
        }

        .message.assistant {
            margin-right: auto;
        }

        .message-content {
            padding: 0.875rem 1rem;
            border-radius: 16px;
            line-height: 1.6;
            position: relative;
        }

        .message.user .message-content {
            background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%);
            color: ${theme === 'dark' ? 'var(--primary-color)' : '#ffffff'};
            border-bottom-right-radius: 4px;
            box-shadow: 0 2px 8px rgba(13, 110, 31, 0.25);
        }

        .message.assistant .message-content {
            background: ${theme === 'dark'
                ? 'rgba(26, 35, 50, 0.8)'
                : 'rgba(255, 255, 255, 0.9)'};
            border: 1px solid ${theme === 'dark' ? 'rgba(13, 110, 31, 0.15)' : 'rgba(13, 110, 31, 0.1)'};
            border-bottom-left-radius: 4px;
            box-shadow: 0 2px 8px ${theme === 'dark'
                ? 'rgba(0, 0, 0, 0.2)'
                : 'rgba(15, 23, 42, 0.08)'};
        }

        .user-message-text {
            margin: 0;
            font-size: 1rem;
            font-weight: 500;
        }

        .markdown-content {
            color: var(--text-color);
        }

        .markdown-content p {
            margin-bottom: 1rem;
        }

        .markdown-content p:last-child {
            margin-bottom: 0;
        }

        .markdown-content ul,
        .markdown-content ol {
            margin: 1rem 0;
            padding-left: 1.5rem;
        }

        .markdown-content li {
            margin-bottom: 0.5rem;
        }

        .markdown-content code {
            background: ${theme === 'dark'
                ? 'rgba(13, 110, 31, 0.15)'
                : 'rgba(13, 110, 31, 0.08)'};
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-size: 0.9em;
            border: 1px solid ${theme === 'dark' ? 'rgba(13, 110, 31, 0.2)' : 'rgba(13, 110, 31, 0.15)'};
            font-family: 'Fira Code', 'Consolas', monospace;
        }

        .markdown-content pre {
            background: ${theme === 'dark'
                ? 'rgba(0, 0, 0, 0.4)'
                : 'rgba(15, 23, 42, 0.05)'};
            padding: 1.25rem;
            border-radius: 12px;
            overflow-x: auto;
            margin: 1rem 0;
            border: 1px solid ${theme === 'dark' ? 'rgba(13, 110, 31, 0.2)' : 'rgba(13, 110, 31, 0.1)'};
            box-shadow: inset 0 2px 8px ${theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
        }

        .markdown-content pre code {
            background: transparent;
            padding: 0;
            border: none;
        }

        /* Typing Indicator */
        .typing-indicator {
            display: flex;
            gap: 0.5rem;
            padding: 0.5rem 0;
        }

        .typing-indicator span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent-color);
            animation: bounce 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) {
            animation-delay: -0.32s;
        }

        .typing-indicator span:nth-child(2) {
            animation-delay: -0.16s;
        }

        @keyframes bounce {
            0%, 80%, 100% {
                transform: scale(0);
                opacity: 0.5;
            }
            40% {
                transform: scale(1);
                opacity: 1;
            }
        }

        /* Sources Section */
        .sources-section {
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid ${theme === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(15, 23, 42, 0.1)'};
        }

        .sources-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-muted);
            margin-bottom: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .sources-header svg {
            width: 16px;
            height: 16px;
        }

        .sources-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .source-badge-new {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.875rem;
            background: ${theme === 'dark'
                ? 'rgba(212, 175, 55, 0.1)'
                : 'rgba(212, 175, 55, 0.08)'};
            border: 1px solid ${theme === 'dark'
                ? 'rgba(212, 175, 55, 0.2)'
                : 'rgba(212, 175, 55, 0.15)'};
            border-radius: 8px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s;
            color: var(--text-color);
        }

        .source-badge-new:hover {
            background: ${theme === 'dark'
                ? 'rgba(212, 175, 55, 0.2)'
                : 'rgba(212, 175, 55, 0.15)'};
            border-color: var(--accent-color);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(212, 175, 55, 0.2);
        }

        .source-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            background: var(--accent-color);
            color: ${theme === 'dark' ? 'var(--primary-color)' : '#ffffff'};
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 700;
        }

        .source-title {
            font-weight: 500;
        }

        /* Input Area at Bottom */
        .input-area {
            padding: 1.5rem 2rem;
            background: ${theme === 'dark'
                ? 'rgba(10, 15, 30, 0.95)'
                : 'rgba(255, 255, 255, 0.95)'};
            border-top: 1px solid var(--glass-border);
            flex-shrink: 0;
            backdrop-filter: blur(10px);
        }

        /* Modal */
        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            backdrop-filter: blur(8px);
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }

        .modal.active {
            display: flex;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .modal-content {
            background: ${theme === 'dark'
                ? 'var(--primary-color)'
                : 'var(--background-primary)'};
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
            padding: 2rem;
            border-bottom: 1px solid var(--glass-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: ${theme === 'dark'
                ? 'rgba(10, 15, 30, 0.9)'
                : 'rgba(248, 250, 252, 0.9)'};
            position: sticky;
            top: 0;
            backdrop-filter: blur(10px);
            z-index: 10;
        }

        .modal-header h3 {
            color: var(--accent-color);
            margin: 0;
            font-size: 1.5rem;
        }

        .modal-body {
            padding: 2rem;
            line-height: 1.8;
        }

        .modal-body h4 {
            color: var(--text-color);
            margin-bottom: 1.5rem;
        }

        .close-modal {
            background: ${theme === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(15, 23, 42, 0.1)'};
            border: none;
            color: var(--text-color);
            width: 40px;
            height: 40px;
            border-radius: 10px;
            font-size: 1.5rem;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-modal:hover {
            background: var(--error-color);
            color: white;
            transform: rotate(90deg);
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
            .welcome-title {
                font-size: 2rem;
            }

            .welcome-subtitle {
                font-size: 1.1rem;
            }

            .suggestion-cards {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 768px) {
            .chat-layout {
                flex-direction: column;
                height: 100vh;
            }
            
            .chat-sidebar {
                width: 100%;
                height: auto;
                max-height: 40vh;
                border-right: none;
                border-bottom: 1px solid var(--glass-border);
            }
            
            .chat-sidebar-header {
                padding: 1rem 1.5rem;
            }

            .sidebar-logo-icon {
                font-size: 1.5rem;
            }
            
            .chat-sidebar-title {
                font-size: 1.1rem;
            }

            .new-chat-btn {
                margin: 1rem;
                padding: 0.875rem;
            }

            .welcome-screen {
                padding: 2rem 1rem 1rem;
            }

            .welcome-title {
                font-size: 1.75rem;
            }

            .welcome-subtitle {
                font-size: 1rem;
                margin-bottom: 2rem;
            }

            .welcome-icon {
                width: 60px;
                height: 60px;
                margin-bottom: 1.5rem;
            }

            .suggestion-cards {
                grid-template-columns: 1fr;
                gap: 0.75rem;
            }

            .suggestion-card {
                padding: 1.25rem;
            }
            
            .message {
                max-width: 90%;
            }

            .message-wrapper {
                gap: 0.5rem;
            }

            .message-avatar {
                width: 32px;
                height: 32px;
            }

            .message-avatar svg {
                width: 20px;
                height: 20px;
            }

            .message-content {
                padding: 1rem 1.25rem;
            }
            
            .input-area,
            .input-area-centered {
                padding: 1rem;
            }
            
            .chat-input,
            .chat-input-centered {
                font-size: 16px; /* Prevents zoom on iOS */
                padding: 1rem 1.25rem;
            }

            .send-btn,
            .send-btn-centered {
                width: 48px;
                height: 48px;
            }

            .send-btn svg,
            .send-btn-centered svg {
                width: 20px;
                height: 20px;
            }

            .modal-content {
                max-width: 95%;
                border-radius: 16px;
            }

            .modal-header,
            .modal-body {
                padding: 1.5rem;
            }
        }
      `}</style>
        </>
    );
}
