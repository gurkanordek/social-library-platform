const mongoose = require('mongoose');

const contentSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true
        },

        externalId: {
            type: String,
            required: true,
            unique: true,
        },

        contentType: {
            type: String,
            required: true,
            enum: ['movie', 'book'] 
        },

        summary: {
            type: String
        },

        releaseDate: {
            type: Date 
        },

        imageUrl: {
            type: String
        },

        genres: [
            { type: String } 
        ],

        director: {
            type: String
        },

        author: {
            type: String
        },

        pageCount: {
            type: Number
        },

        avgRating: {
            type: Number,
            default: 0
        },

        totalRatings: {
            type: Number,
            default: 0
        },

        publishedDate: {
            type: String
        },

        authors: [
            { type: String }
        ],

        releaseDate: {
            type: String
        },

        runtime: {
            type: Number
        }
    },
    {
        timestamps: true
    }
);

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;