const mongoose = require('mongoose');

const listSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },

        name: {
            type: String,
            required: true
        },

        description: {
            type: String
        },

        contents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Content'
            }
        ],
    },
    {
        timestamps: true
    }
);

listSchema.index({ user: 1, name: 1 }, { unique: true });

const List = mongoose.model('List', listSchema);

module.exports = List;