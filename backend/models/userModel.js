const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true, 
            unique: true, 	
            trim: true 	
        },

        email: {
            type: String,
            required: true,
            unique: true, 	
            lowercase: true 
        },

        password: {
            type: String,
            required: true 
        },

        avatar: {
            type: String,
            default: '/images/default_avatar.png' 
        },

        bio: {
            type: String,
            default: '' 
        },

        followers: [
            {
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'User'
            }
        ],

        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
    },
    {
        timestamps: true
    }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model('User', userSchema);

module.exports = User;