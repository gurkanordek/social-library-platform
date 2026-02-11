const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kayıtlı.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });

        if (user) {
            return res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Kayıt sırasında hata oluştu.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && await user.matchPassword(password)) { 
            return res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });

        } else {
            return res.status(401).json({ message: 'Geçersiz e-posta veya parola.' });
        }

    } catch (error) {
        console.error("LOGIN HATASI:", error); 
        res.status(500).json({ message: 'Giriş sırasında sunucu hatası oluştu.' });
    }
});

router.post('/follow/:targetUserId', protect, async (req, res) => {
    const followerId = req.userId; 
    const { targetUserId } = req.params; 

    if (followerId.toString() === targetUserId.toString()) {
        return res.status(400).json({ message: 'Kendinizi takip edemezsiniz.' });
    }

    try {
        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(followerId);

        if (!targetUser || !currentUser) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const isFollowing = currentUser.following.includes(targetUserId);

        if (isFollowing) {
            await User.findByIdAndUpdate(followerId, { $pull: { following: targetUserId } }); 
            await User.findByIdAndUpdate(targetUserId, { $pull: { followers: followerId } }); 
            
            return res.json({ message: 'Takipten başarıyla çıkıldı.', status: 'unfollowed' });

        } else {
            await User.findByIdAndUpdate(followerId, { $push: { following: targetUserId } }); 
            await User.findByIdAndUpdate(targetUserId, { $push: { followers: followerId } }); 
            
            return res.json({ message: 'Başarıyla takip edildi.', status: 'followed' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Takip işleminde hata oluştu.' });
    }
});

module.exports = router;