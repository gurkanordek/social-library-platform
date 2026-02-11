const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            
            req.userId = req.user._id;

            next();

        } catch (error) {
            console.error('Token doğrulama hatası:', error.message);
            res.status(401).json({ message: 'Yetkilendirme başarısız, token geçersiz.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Yetkilendirme başarısız, token bulunamadı.' });
    }
};

module.exports = { protect };