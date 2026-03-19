import React, { useState } from 'react';
import { IconX, IconChevronDown, IconChevronUp, IconScale, IconExternalLink, IconFileText } from '@tabler/icons-react';

const SourcesModal = ({ isOpen, onClose, sources }) => {
    const [expandedIndex, setExpandedIndex] = useState(null);

    if (!isOpen) return null;

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Close when clicking outside modal content
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={handleOverlayClick}
        >
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-[var(--navbar-bg)] text-[#d4af37] border border-[#d4af37]/30 rounded-xl flex items-center justify-center">
                            <IconScale size={20} stroke={1.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">References & Sources</h2>
                            <p className="text-xs text-[var(--text-soft)] mt-0.5">Documents cited in this response</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                        <IconX size={20} stroke={1.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                    {sources && sources.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {sources.map((src, idx) => {
                                const isExpanded = expandedIndex === idx;
                                
                                // Backward compatibility (if string mapped to struct) & modern extraction
                                const docTitle = src?.document?.title || src?.title || "Unknown Document";
                                const isComplex = !!src?.chunk?.text;
                                
                                return (
                                    <div 
                                        key={idx} 
                                        className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                                            isExpanded 
                                            ? 'border-[#d4af37]/50 bg-black/5 dark:bg-white/5 shadow-md' 
                                            : 'border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[#d4af37]/30 hover:shadow-sm'
                                        }`}
                                    >
                                        <button 
                                            onClick={() => isComplex ? toggleExpand(idx) : null}
                                            className={`w-full flex items-center justify-between p-4 text-left ${isComplex ? 'cursor-pointer' : 'cursor-default'}`}
                                        >
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="mt-0.5 h-6 w-6 shrink-0 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--text-muted)] font-medium text-xs border border-[var(--card-border)]">
                                                    {src.index || (idx + 1)}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <h3 className="font-semibold text-[var(--foreground)] text-[15px] truncate">
                                                        {docTitle}
                                                    </h3>
                                                    {src?.document?.type && (
                                                        <span className="inline-flex mt-1.5 items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 text-[var(--text-soft)] border border-[var(--card-border)]">
                                                            {src.document.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {isComplex && (
                                                <div className="shrink-0 text-[#d4af37]">
                                                    {isExpanded ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                                                </div>
                                            )}
                                        </button>
                                        
                                        {/* Expanded Content */}
                                        {isExpanded && isComplex && (
                                            <div className="p-4 pt-0 border-t border-[var(--card-border)]/50 text-sm mt-1 animate-in slide-in-from-top-2 duration-200 fade-in">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4">
                                                    <div className="space-y-2">
                                                        {src.document?.year && (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Year</span>
                                                                <span className="text-[var(--foreground)]">{src.document.year}</span>
                                                            </div>
                                                        )}
                                                        {src.document?.court && (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Court</span>
                                                                <span className="text-[var(--foreground)]">{src.document.court}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {src.chunk?.title && src.chunk.title !== 'N/A' && (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Section / Part</span>
                                                                <span className="text-[var(--foreground)]">{src.chunk.title}</span>
                                                            </div>
                                                        )}
                                                        {src.relevance_score && (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Relevance Match</span>
                                                                <span className="text-[var(--foreground)]">{Math.round(src.relevance_score * 100)}%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <div className="flex items-center gap-2 mb-2 text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                                                        <IconFileText size={14} /> Relevant Excerpt
                                                    </div>
                                                    <div className="bg-black/5 dark:bg-black/20 p-4 rounded-xl text-[14px] leading-relaxed text-[var(--text-soft)] border border-[var(--card-border)] relative">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#d4af37]/50 rounded-l-xl"></div>
                                                        {src.chunk.text}
                                                    </div>
                                                </div>

                                                {(src.links?.document_url || src.links?.source_page) && (
                                                    <div className="flex flex-wrap gap-3 mt-4">
                                                        {src.links.source_page && (
                                                            <a 
                                                                href={src.links.source_page} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--navbar-bg)] border border-[#d4af37]/30 text-[#d4af37] text-xs font-medium hover:bg-[#d4af37]/10 transition-colors"
                                                            >
                                                                <IconExternalLink size={14} /> View Original Source
                                                            </a>
                                                        )}
                                                        {src.links.document_url && (
                                                            <a 
                                                                href={src.links.document_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--navbar-bg)] border border-[#d4af37]/30 text-[#d4af37] text-xs font-medium hover:bg-[#d4af37]/10 transition-colors"
                                                            >
                                                                <IconExternalLink size={14} /> View Original Document
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-[var(--text-muted)] py-10">
                            No detailed sources available for this response.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SourcesModal;
