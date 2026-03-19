import React, { useState, useRef, useEffect } from 'react';
import { IconStar, IconStarFilled, IconMessage, IconCheck, IconX } from '@tabler/icons-react';
import { useChat } from '../../context/ChatContext';

const FeedbackButton = ({ messageId, existingRating }) => {
    const { currentChatId, submitFeedback } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [selectedRating, setSelectedRating] = useState(existingRating || 0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(!!existingRating);
    const popupRef = useRef(null);

    // Close popup on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSubmit = async (rating) => {
        if (!currentChatId || !messageId || submitting) return;

        setSelectedRating(rating);
        setSubmitting(true);

        try {
            await submitFeedback(currentChatId, messageId, rating);
            setSubmitted(true);
            // Auto-close after a brief delay to show success
            setTimeout(() => setIsOpen(false), 800);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const starLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    // Don't show feedback button if there's no chatId (ephemeral messages)
    if (!currentChatId) return null;

    return (
        <div className="relative inline-block" ref={popupRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5
                    rounded-lg transition-all duration-200 cursor-pointer
                    ${submitted
                        ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/20'
                        : 'bg-transparent text-[var(--text-soft)] border border-[var(--card-border)] hover:border-[#d4af37]/50 hover:text-[#d4af37] hover:bg-[#d4af37]/5'
                    }
                `}
                title={submitted ? `Rated ${selectedRating}/5` : 'Give Feedback'}
            >
                {submitted ? (
                    <>
                        <IconStarFilled size={13} className="text-[#d4af37]" />
                        <span>{selectedRating}/5</span>
                    </>
                ) : (
                    <>
                        <IconMessage size={13} />
                        <span>Rate Response</span>
                    </>
                )}
            </button>

            {/* Rating Popup */}
            {isOpen && (
                <div
                    className={`
                        absolute bottom-full left-0 mb-2 z-50
                        bg-[var(--card-bg)] border border-[var(--card-border)]
                        rounded-2xl shadow-2xl p-4 min-w-[220px]
                        animate-[feedbackSlideUp_0.25s_ease-out]
                    `}
                    style={{
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(212,175,55,0.08)',
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-2 right-2 text-[var(--text-soft)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                    >
                        <IconX size={14} />
                    </button>

                    {submitted ? (
                        <div className="flex flex-col items-center gap-2 py-1">
                            <div className="h-10 w-10 rounded-full bg-[#d4af37]/15 flex items-center justify-center">
                                <IconCheck size={22} className="text-[#d4af37]" />
                            </div>
                            <p className="text-[13px] font-semibold text-[var(--foreground)]">
                                Thank you!
                            </p>
                            <p className="text-[11px] text-[var(--text-soft)] text-center">
                                Your feedback helps us improve
                            </p>
                            {/* Show stars even after submission for re-rating */}
                            <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleSubmit(star)}
                                        onMouseEnter={() => setHoveredStar(star)}
                                        onMouseLeave={() => setHoveredStar(0)}
                                        disabled={submitting}
                                        className="p-0.5 transition-transform duration-150 hover:scale-125 cursor-pointer disabled:opacity-50"
                                    >
                                        {star <= (hoveredStar || selectedRating) ? (
                                            <IconStarFilled
                                                size={20}
                                                className="text-[#d4af37] drop-shadow-sm"
                                            />
                                        ) : (
                                            <IconStar
                                                size={20}
                                                className="text-[var(--text-soft)] hover:text-[#d4af37]/60"
                                                stroke={1.5}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                                Rate this response
                            </p>

                            {/* Stars */}
                            <div className="flex gap-1 justify-center mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleSubmit(star)}
                                        onMouseEnter={() => setHoveredStar(star)}
                                        onMouseLeave={() => setHoveredStar(0)}
                                        disabled={submitting}
                                        className="p-1 transition-all duration-150 hover:scale-130 cursor-pointer disabled:opacity-50"
                                    >
                                        {star <= (hoveredStar || selectedRating) ? (
                                            <IconStarFilled
                                                size={26}
                                                className="text-[#d4af37] drop-shadow-sm"
                                            />
                                        ) : (
                                            <IconStar
                                                size={26}
                                                className="text-[var(--text-soft)] hover:text-[#d4af37]/60"
                                                stroke={1.5}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Label */}
                            <p className="text-center text-[12px] text-[var(--text-soft)] font-medium h-4 transition-opacity duration-150">
                                {hoveredStar > 0 ? starLabels[hoveredStar - 1] : '\u00A0'}
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default FeedbackButton;
