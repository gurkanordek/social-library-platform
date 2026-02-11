const mongoose = require('mongoose');

const librarySchema = mongoose.Schema(
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

        listStatus: {
            type: String,
            required: true,
            enum: ['watched', 'to_watch', 'read', 'to_read'] 
        },

        userRating: {
            type: Number,
            min: 1,
            max: 10
        },
    },
    {
        timestamps: true 
    }
);

librarySchema.index({ user: 1, content: 1 }, { unique: true });

const Library = mongoose.model('Library', librarySchema);

module.exports = Library;