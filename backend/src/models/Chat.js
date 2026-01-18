import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sources: [{
        title: String,
        section: String,
        relevance_score: Number,
        document: {
            title: String,
            type: { type: String },
            year: String,
            court: String
        },
        chunk: {
            title: String,
            type: { type: String },
            text: String
        },
        links: {
            document_url: String,
            source_page: String
        }
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    messages: [messageSchema],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update updated_at on save
chatSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
