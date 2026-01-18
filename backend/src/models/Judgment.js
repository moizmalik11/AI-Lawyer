import mongoose from 'mongoose';

const judgmentSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        index: true
    },
    full_text: {
        type: String,
        required: true
    },
    court: {
        type: String
    },
    year: {
        type: Number
    },
    source_url: {
        type: String
    },
    source_page: {
        type: String
    },
    content_type: {
        type: String
    },
    language: {
        type: String
    },
    uploaded_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    strict: false // Allow other metadata fields to be stored
});

// Create text index for search
judgmentSchema.index({ title: 'text', full_text: 'text' });

const Judgment = mongoose.model('Judgment', judgmentSchema);

export default Judgment;
