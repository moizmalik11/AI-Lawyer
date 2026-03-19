/**
 * Dashboard Controller
 * Provides real stats computed from the database for the current user.
 */

import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import UserActivity from '../models/UserActivity.js';

/**
 * GET /api/dashboard/stats
 * Returns real metrics for the authenticated user:
 *   - aiConsultations: number of user messages across all chats
 *   - contractsAnalyzed: from UserActivity collection
 *   - judgmentsSummarized: from UserActivity collection
 *   - hoursSaved: estimated (consultations * 0.5 + contracts * 2 + judgments * 1.5)
 */
export const getStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        // 1. Count total user messages (queries) across all chats
        const chatAggregation = await Chat.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            { $unwind: '$messages' },
            { $match: { 'messages.role': 'user' } },
            { $count: 'totalQueries' }
        ]);
        const aiConsultations = chatAggregation.length > 0 ? chatAggregation[0].totalQueries : 0;

        // 2. Get contracts analyzed & judgments summarized from UserActivity
        const activity = await UserActivity.findOne({ user: userId });
        const contractsAnalyzed = activity?.contractsAnalyzed || 0;
        const judgmentsSummarized = activity?.judgmentsSummarized || 0;

        // 3. Estimate hours saved
        // ~3 min per AI consultation, ~20 min per contract analysis, ~15 min per judgment summary
        const totalMinutes = (aiConsultations * 3) + (contractsAnalyzed * 20) + (judgmentsSummarized * 15);
        const hours = totalMinutes / 60;
        let hoursSaved;
        if (hours < 1) {
            hoursSaved = `${totalMinutes}m`;
        } else {
            hoursSaved = `${hours.toFixed(1)}h`;
        }

        res.json({
            success: true,
            aiConsultations,
            contractsAnalyzed,
            judgmentsViewed: judgmentsSummarized,
            hoursSaved
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard stats'
        });
    }
};

/**
 * GET /api/dashboard/experience
 * Returns the user's overall experience based on feedback ratings.
 *   - averageRating: average of all ratings given
 *   - totalRatings: how many ratings the user has given
 *   - ratingDistribution: { 1: count, 2: count, ... 5: count }
 */
export const getExperience = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Aggregate ratings from all chat messages belonging to this user
        const ratingAggregation = await Chat.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            { $unwind: '$messages' },
            { $match: { 'messages.rating': { $ne: null } } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$messages.rating' },
                    totalRatings: { $sum: 1 },
                    star1: { $sum: { $cond: [{ $eq: ['$messages.rating', 1] }, 1, 0] } },
                    star2: { $sum: { $cond: [{ $eq: ['$messages.rating', 2] }, 1, 0] } },
                    star3: { $sum: { $cond: [{ $eq: ['$messages.rating', 3] }, 1, 0] } },
                    star4: { $sum: { $cond: [{ $eq: ['$messages.rating', 4] }, 1, 0] } },
                    star5: { $sum: { $cond: [{ $eq: ['$messages.rating', 5] }, 1, 0] } }
                }
            }
        ]);

        if (ratingAggregation.length === 0) {
            return res.json({
                success: true,
                averageRating: 0,
                totalRatings: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            });
        }

        const data = ratingAggregation[0];
        res.json({
            success: true,
            averageRating: Math.round(data.averageRating * 10) / 10,
            totalRatings: data.totalRatings,
            ratingDistribution: {
                1: data.star1,
                2: data.star2,
                3: data.star3,
                4: data.star4,
                5: data.star5
            }
        });
    } catch (error) {
        console.error('Error fetching experience data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch experience data'
        });
    }
};

/**
 * GET /api/dashboard/system-status
 * Returns system health info
 */
export const getSystemStatus = async (req, res) => {
    try {
        res.json({
            success: true,
            databaseIndexing: 100,
            usageQuotaPercentage: 10,
            statusMessage: 'Your legal assistant is fully operational and ready to assist.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch system status'
        });
    }
};
