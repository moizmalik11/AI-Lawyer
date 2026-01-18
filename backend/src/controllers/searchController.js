import embeddingService from '../services/embeddingService.js';
import qdrantService from '../services/qdrantService.js';
import llmService from '../services/llmService.js';

/**
 * Global search across legal documents
 * GET /api/search
 */
import { Embeddings } from '../models/index.js';

/**
 * Global search across legal documents
 * GET /api/search
 */
export const globalSearch = async (req, res) => {
    try {
        const { query, document_type, year, court, source_website, limit, page } = req.query;
        const limitVal = parseInt(limit) || 50;
        const pageVal = parseInt(page) || 1;
        const skip = (pageVal - 1) * limitVal;

        // Build filter query
        const filterQuery = { chunk_index: 1 }; // Ensure unique documents by selecting the first chunk

        // Apply filters
        if (document_type) filterQuery.document_type = document_type;
        if (year) filterQuery.year = parseInt(year);
        if (court) filterQuery.court = court;
        if (source_website) filterQuery.source_website = source_website;

        // If query is provided, perform text search on title
        if (query) {
            // Translate if needed (optional, but good for Urdu queries)
            // For now, we'll assume the user might type in English or Urdu.
            // If we want to support Urdu titles, we might need to translate.
            // But the titles in DB are likely English.
            // Let's try to translate if it looks like Urdu, or just search.
            // We'll skip translation for now to keep it fast and simple as per "keyword relates to title"
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filterQuery.title = { $regex: escapedQuery, $options: 'i' };
        }

        // Count total documents matching criteria
        const totalDocs = await Embeddings.countDocuments(filterQuery);

        // Fetch documents
        const docs = await Embeddings.find(filterQuery)
            .sort({ year: -1, title: 1 }) // Sort by year descending
            .skip(skip)
            .limit(limitVal)
            .lean();

        const results = docs.map(doc => ({
            id: doc.id,
            title: doc.title,
            text: doc.chunk_title || doc.title, // Use chunk title or doc title as snippet header
            metadata: {
                document_type: doc.document_type,
                year: doc.year,
                court: doc.court,
                source_page: doc.source_page,
                source_url: doc.source_url,
                source_website: doc.source_website
            }
        }));

        res.json({
            success: true,
            query: query || '',
            count: totalDocs,
            page: pageVal,
            totalPages: Math.ceil(totalDocs / limitVal),
            results: results
        });
    } catch (error) {
        console.error('Error in global search:', error);
        res.status(500).json({ success: false, error: 'Search failed' });
    }
};

export const getDocumentTypes = async (req, res) => {
    try {
        const types = await Embeddings.distinct('document_type');
        res.json({
            success: true,
            types: types.filter(type => type).sort() // Filter out null/empty and sort
        });
    } catch (error) {
        console.error('Error fetching document types:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch document types' });
    }
};

export default {
    globalSearch,
    getDocumentTypes
};
