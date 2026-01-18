import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { fetchWithAuth } from '../utils/api';
import Navbar from '../components/Navbar';

export default function Chatbot() {
    const [chats, setChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([{
        role: 'assistant',
        content: 'Hello! I am your AI Legal Assistant. You can ask me questions about Pakistani laws, acts, and judgments. How can I help you today?'
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalSource, setModalSource] = useState(null);

    const messagesEndRef = useRef(null);

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
        setMessages([{
            role: 'assistant',
            content: 'Hello! I am your AI Legal Assistant. You can ask me questions about Pakistani laws, acts, and judgments. How can I help you today?'
        }]);
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
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Navbar />
            <div className="chat-layout">
                <aside className="sidebar">
                    <button className="btn btn-primary new-chat-btn" onClick={createNewChat}>
                        <span>+</span> New Chat
                    </button>
                    <div id="chat-history-list">
                        {chats.map(chat => (
                            <div key={chat._id} className={`chat-history-item ${currentChatId === chat._id ? 'active' : ''}`} onClick={() => loadChat(chat._id)}>
                                <span>{chat.title}</span>
                                <span className="delete-chat" onClick={(e) => deleteChat(chat._id, e)}>×</span>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="main-chat-area">
                    <div className="chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role}`}>
                                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }} />
                                {msg.sources && msg.sources.length > 0 && (
                                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem' }}>
                                        <small style={{ color: 'var(--text-muted)' }}>Sources:</small><br />
                                        {msg.sources.map((source, i) => (
                                            <span key={i} className="source-badge" onClick={() => setModalSource(source)}>
                                                [{i + 1}] {source.document?.title || source.title || 'Source'}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="message assistant">
                                <div className="spinner"></div> Generating response...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="input-area">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            className="chat-input"
                            placeholder="Type your legal question here..."
                            rows="1"
                        />
                        <button className="btn btn-primary send-btn" onClick={sendMessage}>➤</button>
                    </div>
                </main>
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
        .chat-layout {
            display: flex;
            flex: 1;
            overflow: hidden;
            margin-top: 0;
            height: calc(100vh - 73px);
        }

        .sidebar {
            width: 300px;
            background: rgba(15, 23, 42, 0.9);
            border-right: 1px solid var(--glass-border);
            display: flex;
            flex-direction: column;
            padding: 1rem;
            overflow-y: auto;
        }

        .new-chat-btn {
            width: 100%;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .chat-history-item {
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            color: var(--text-muted);
            transition: all 0.2s;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chat-history-item:hover,
        .chat-history-item.active {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-color);
        }

        .delete-chat {
            opacity: 0;
            color: var(--error-color);
            padding: 0.2rem;
        }

        .chat-history-item:hover .delete-chat {
            opacity: 1;
        }

        .main-chat-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
            scroll-behavior: smooth;
        }

        .message {
            margin-bottom: 1.5rem;
            max-width: 85%;
            animation: fadeIn 0.3s ease;
        }

        .message.user {
            margin-left: auto;
            background: var(--accent-color);
            color: var(--primary-color);
            padding: 1rem 1.5rem;
            border-radius: 1rem 1rem 0 1rem;
            font-weight: 500;
        }

        .message.assistant {
            margin-right: auto;
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid var(--glass-border);
            padding: 1.5rem;
            border-radius: 1rem 1rem 1rem 0;
        }

        .input-area {
            padding: 1.5rem;
            background: rgba(15, 23, 42, 0.95);
            border-top: 1px solid var(--glass-border);
            display: flex;
            gap: 1rem;
            align-items: flex-end;
        }

        .chat-input {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            border-radius: 0.75rem;
            padding: 1rem;
            color: var(--text-color);
            font-family: var(--font-main);
            resize: none;
            max-height: 150px;
            min-height: 50px;
        }

        .chat-input:focus {
            outline: none;
            border-color: var(--accent-color);
        }

        .send-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            padding: 0;
        }

        .source-badge {
            display: inline-block;
            font-size: 0.75rem;
            background: rgba(255, 255, 255, 0.1);
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            margin-top: 0.5rem;
            margin-right: 0.5rem;
            cursor: pointer;
        }

        .source-badge:hover {
            background: rgba(255, 255, 255, 0.2);
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
      `}</style>
        </div>
    );
}
