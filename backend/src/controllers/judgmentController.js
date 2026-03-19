import Judgment from '../models/Judgment.js';
import llmService from '../services/llmService.js';
import UserActivity from '../models/UserActivity.js';

/**
 * List all judgments with pagination
 * GET /api/judgments
 */
export const listJudgments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const query = {};

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Fetch judgments from the new collection
        const judgments = await Judgment.find(query)
            .select('id title court year source_url uploaded_at') // Select only necessary fields for listing
            .sort({ uploaded_at: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Judgment.countDocuments(query);

        res.json({
            success: true,
            data: judgments,
            pagination: {
                page,
                limit,
                total
            }
        });
    } catch (error) {
        console.error('Error listing judgments:', error);
        res.status(500).json({ success: false, error: 'Failed to list judgments' });
    }
};

/**
 * Get judgment summary
 * GET /api/judgments/:title/summary
 */
export const summarizeJudgment = async (req, res) => {
    try {
        const { title } = req.params;

        // Find the judgment by title
        // Note: Using findOne with regex for flexibility, or exact match if preferred
        // The previous implementation used decodeURIComponent(title)
        const judgment = await Judgment.findOne({
            title: decodeURIComponent(title)
        });

        if (!judgment) {
            return res.status(404).json({ success: false, error: 'Judgment not found' });
        }

        if (!judgment.full_text) {
            return res.status(404).json({ success: false, error: 'Judgment text not available' });
        }

        // Generate summary using the full text from DB
        const summary = await llmService.generateSummary(judgment.full_text, 'judgment');

        // Track judgment summarization for dashboard stats
        if (req.user?.userId) {
            try {
                await UserActivity.increment(req.user.userId, 'judgmentsSummarized');
            } catch (e) {
                console.warn('Failed to track judgment activity:', e.message);
            }
        }

        res.json({
            success: true,
            title: judgment.title,
            summary
        });
    } catch (error) {
        console.error('Error summarizing judgment:', error);
        res.status(500).json({ success: false, error: 'Failed to summarize judgment' });
    }
};

export default {
    listJudgments,
    summarizeJudgment
};
