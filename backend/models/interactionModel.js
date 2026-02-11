const mongoose = require('mongoose');

const interactionSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        activity: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Activity'
        },
        interactionType: {
            type: String,
            required: true,
            enum: ['LIKE', 'COMMENT']
        },
        commentText: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

interactionSchema.index({ user: 1, activity: 1, interactionType: 1 }, { unique: true, partialFilterExpression: { interactionType: 'LIKE' } });

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;