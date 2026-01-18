import express from 'express';
import multer from 'multer';
import contractController from '../controllers/contractController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure Multer for file uploads
const upload = multer({
    dest: 'uploads/', // Temporary storage
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and TXT files are allowed!'), false);
        }
    }
});

// POST /api/contracts/analyze
router.post('/analyze', authMiddleware, upload.single('contract'), contractController.analyzeContract);

export default router;
