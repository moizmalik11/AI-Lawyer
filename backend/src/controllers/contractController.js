import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import llmService from '../services/llmService.js';

/**
 * Analyze and summarize a contract
 * POST /api/contracts/analyze
 */
export const analyzeContract = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        let text = '';

        // Extract text based on file type
        if (req.file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(req.file.path);
            const data = await pdf(dataBuffer);
            text = data.text;
        } else if (req.file.mimetype === 'text/plain') {
            text = fs.readFileSync(req.file.path, 'utf8');
        } else {
            // Clean up file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, error: 'Unsupported file type. Please upload PDF or TXT.' });
        }

        // Clean up file immediately after reading
        fs.unlinkSync(req.file.path);

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Could not extract text from file' });
        }

        // Generate summary and analysis
        const analysis = await llmService.generateSummary(text, 'contract');

        res.json({
            success: true,
            filename: req.file.originalname,
            analysis
        });
    } catch (error) {
        console.error('Error analyzing contract:', error);
        // Ensure file is cleaned up in case of error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, error: 'Failed to analyze contract' });
    }
};

export default {
    analyzeContract
};
