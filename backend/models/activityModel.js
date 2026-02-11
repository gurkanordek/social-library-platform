const mongoose = require('mongoose');

const activitySchema = mongoose.Schema(
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

        activityType: {
            type: String,
            required: true,
            enum: ['RATING', 'REVIEW', 'LIST_ADD']
        },

        relatedReview: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review'
        },

        actionText: {
            type: String,
            required: true
        },

        commentCount: {
            type: Number,
            default: 0
        },
        
        likes: [ 
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],

        listStatus: {
            type: String,
            enum: ['watched', 'to_watch', 'read', 'to_read']
        }
    },
    {
        timestamps: true
    }
);

activitySchema.set('toJSON', {
    virtuals: true,
    transform: (document, returnedObject) => {
        if (returnedObject._id) {
            returnedObject.id = returnedObject._id.toString();
        }
        
        if (returnedObject.likes && Array.isArray(returnedObject.likes)) {
            returnedObject.likes = returnedObject.likes.map(id => id.toString());
        }

        delete returnedObject._id;
        delete returnedObject.__v;
        return returnedObject;
    }
});


const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;