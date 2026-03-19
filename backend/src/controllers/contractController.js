import fs from 'fs/promises';
import { existsSync } from 'fs';
import { PDFParse } from 'pdf-parse';
import llmService from '../services/llmService.js';
import UserActivity from '../models/UserActivity.js';

/**
 * Helper function to safely delete a file with retry logic
 * Handles EBUSY errors on Windows when file handles aren't released immediately
 */
const safeUnlink = async (filePath, retries = 3, delay = 100) => {
    for (let i = 0; i < retries; i++) {
        try {
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            if (error.code === 'EBUSY' && i < retries - 1) {
                // Wait and retry if file is busy
                await new Promise(resolve => setTimeout(resolve, delay));
            } else if (error.code !== 'ENOENT') {
                // Log error but don't throw (file might already be deleted)
                console.warn(`Warning: Could not delete file ${filePath}:`, error.message);
            }
        }
    }
    return false;
};

/**
 * Analyze and summarize a contract
 * POST /api/contracts/analyze
 */
export const analyzeContract = async (req, res) => {
    let filePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        filePath = req.file.path;
        let text = '';

        // Extract text based on file type
        if (req.file.mimetype === 'application/pdf') {
            // Read file into buffer
            const dataBuffer = await fs.readFile(filePath);

            // Using pdf-parse v2 API with PDFParse class
            const parser = new PDFParse({ data: dataBuffer });
            try {
                const result = await parser.getText();
                text = result.text;
            } finally {
                // Always destroy parser to release resources
                await parser.destroy();
            }
        } else if (req.file.mimetype === 'text/plain') {
            text = await fs.readFile(filePath, 'utf8');
        } else {
            // Clean up file for unsupported types
            await safeUnlink(filePath);
            return res.status(400).json({ success: false, error: 'Unsupported file type. Please upload PDF or TXT.' });
        }

        // Clean up file after reading
        await safeUnlink(filePath);
        filePath = null; // Mark as cleaned up

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Could not extract text from file' });
        }

        // Generate summary and analysis
        const analysis = await llmService.generateSummary(text, 'contract');

        // Track contract analysis for dashboard stats
        if (req.user?.userId) {
            try {
                await UserActivity.increment(req.user.userId, 'contractsAnalyzed');
            } catch (e) {
                console.warn('Failed to track contract activity:', e.message);
            }
        }

        res.json({
            success: true,
            filename: req.file.originalname,
            analysis
        });
    } catch (error) {
        console.error('Error analyzing contract:', error);
        // Ensure file is cleaned up in case of error
        if (filePath && existsSync(filePath)) {
            await safeUnlink(filePath);
        }
        res.status(500).json({ success: false, error: 'Failed to analyze contract' });
    }
};

export default {
    analyzeContract
};
