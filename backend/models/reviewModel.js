const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },

        content: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Content' 
        },

        comment: {
            type: String,
            required: false 
        },

        likes: {
            type: Number,
            default: 0
        },

        rating: {
            type: Number,
            min: 1,
            max: 10,
            required: false 
        }
    },
    {
        timestamps: true 
    }
);

reviewSchema.index({ user: 1, content: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;