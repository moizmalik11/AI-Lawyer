import React from 'react';
import {
    IconStarFilled,
    IconStar,
    IconMoodSmile,
    IconMoodEmpty,
    IconTrendingUp
} from "@tabler/icons-react";
import { Skeleton } from '../ui/skeleton';

export const OverallExperience = ({ experience, isLoading }) => {
    const { averageRating, totalRatings, ratingDistribution } = experience;

    // Find the max count in distribution for scaling bars
    const maxCount = Math.max(...Object.values(ratingDistribution), 1);

    // Rating labels
    const ratingLabels = {
        5: 'Excellent',
        4: 'Very Good',
        3: 'Good',
        2: 'Fair',
        1: 'Poor'
    };

    // Get sentiment text based on average rating
    const getSentiment = (avg) => {
        if (avg >= 4.5) return { text: 'Outstanding', color: 'text-emerald-500' };
        if (avg >= 3.5) return { text: 'Great', color: 'text-[#d4af37]' };
        if (avg >= 2.5) return { text: 'Good', color: 'text-blue-500' };
        if (avg >= 1.5) return { text: 'Fair', color: 'text-amber-500' };
        if (avg > 0) return { text: 'Needs Improvement', color: 'text-rose-500' };
        return { text: 'No ratings yet', color: 'text-[var(--text-soft)]' };
    };

    const sentiment = getSentiment(averageRating);

    // Render star display for average rating
    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalf = rating - fullStars >= 0.3;

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(
                    <IconStarFilled key={i} size={22} className="text-[#d4af37] drop-shadow-sm" />
                );
            } else if (i === fullStars + 1 && hasHalf) {
                stars.push(
                    <div key={i} className="relative">
                        <IconStar size={22} className="text-[var(--card-border)]" stroke={1.5} />
                        <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                            <IconStarFilled size={22} className="text-[#d4af37] drop-shadow-sm" />
                        </div>
                    </div>
                );
            } else {
                stars.push(
                    <IconStar key={i} size={22} className="text-[var(--card-border)]" stroke={1.5} />
                );
            }
        }
        return stars;
    };

    return (
        <div className="bg-[var(--card-bg)] rounded-2xl p-6 md:p-8 shadow-sm border border-[var(--card-border)] flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--card-border)]">
                <div>
                    <h2 className="text-[18px] font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
                        Your Overall Experience
                    </h2>
                    <p className="text-[13px] text-[var(--text-soft)] mt-1 font-medium">Based on your feedback ratings across all conversations.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <Skeleton className="h-12 w-24 rounded-xl" />
                        <Skeleton className="h-6 w-32 rounded-lg" />
                        <Skeleton className="h-4 w-20 rounded-md" />
                    </div>
                    <div className="space-y-3 mt-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-6 w-full rounded-lg" />
                        ))}
                    </div>
                </div>
            ) : totalRatings === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] gap-4 border-2 border-dashed border-[var(--card-border)] rounded-2xl bg-black/5 dark:bg-white/5 min-h-[250px]">
                    <div className="h-16 w-16 rounded-2xl bg-[var(--card-border)] flex items-center justify-center">
                        <IconMoodEmpty className="h-8 w-8 text-[var(--text-muted)] opacity-60" stroke={1.5} />
                    </div>
                    <div className="text-center">
                        <p className="text-[14px] font-semibold text-[var(--foreground)] mb-1">No Feedback Yet</p>
                        <p className="text-[13px] font-medium max-w-[250px]">Rate AI responses in the chatbot to see your experience summary here.</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    {/* Average Rating Display */}
                    <div className="flex flex-col items-center gap-3 mb-8">
                        <div className="text-[48px] font-black text-[var(--foreground)] leading-none tracking-tighter">
                            {averageRating.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-1">
                            {renderStars(averageRating)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[14px] font-bold ${sentiment.color}`}>
                                {sentiment.text}
                            </span>
                            <span className="text-[12px] text-[var(--text-soft)] font-medium">
                                · {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
                            </span>
                        </div>
                    </div>

                    {/* Rating Distribution Bars */}
                    <div className="space-y-3 flex-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = ratingDistribution[star] || 0;
                            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                            return (
                                <div key={star} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-[75px] shrink-0 justify-end">
                                        <span className="text-[12px] font-bold text-[var(--foreground)]">{star}</span>
                                        <IconStarFilled size={13} className="text-[#d4af37]" />
                                    </div>
                                    <div className="flex-1 h-[10px] bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-[var(--card-border)]">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: `${percentage}%`,
                                                background: star >= 4
                                                    ? 'linear-gradient(90deg, #d4af37, #f0d060)'
                                                    : star === 3
                                                        ? 'linear-gradient(90deg, #60a5fa, #93c5fd)'
                                                        : 'linear-gradient(90deg, #f87171, #fca5a5)',
                                                minWidth: count > 0 ? '8px' : '0px'
                                            }}
                                        />
                                    </div>
                                    <div className="w-[50px] shrink-0 text-right">
                                        <span className="text-[12px] font-semibold text-[var(--text-soft)]">{count}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sentiment Footer */}
                    <div className="mt-6 pt-5 border-t border-[var(--card-border)] flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[var(--navbar-bg)] flex items-center justify-center border border-[#d4af37]/30">
                            {averageRating >= 3.5
                                ? <IconMoodSmile size={18} className="text-[#d4af37]" stroke={1.5} />
                                : <IconTrendingUp size={18} className="text-[#d4af37]" stroke={1.5} />
                            }
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-[var(--foreground)]">
                                {averageRating >= 4 ? 'Excellent experience!' : averageRating >= 3 ? 'Good experience overall' : 'We\'re working to improve'}
                            </p>
                            <p className="text-[11px] text-[var(--text-soft)] font-medium">
                                {averageRating >= 4
                                    ? 'Your ratings show high satisfaction with AI responses.'
                                    : 'Your feedback helps us continuously improve our service.'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
