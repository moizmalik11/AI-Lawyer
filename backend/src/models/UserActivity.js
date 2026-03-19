import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    contractsAnalyzed: {
        type: Number,
        default: 0
    },
    judgmentsSummarized: {
        type: Number,
        default: 0
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

userActivitySchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

/**
 * Static helper to increment a counter for a user.
 * Creates the document if it doesn't exist yet.
 */
userActivitySchema.statics.increment = async function (userId, field) {
    return this.findOneAndUpdate(
        { user: userId },
        { $inc: { [field]: 1 }, $set: { updated_at: new Date() } },
        { upsert: true, new: true }
    );
};

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

export default UserActivity;
