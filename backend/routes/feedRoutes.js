const express = require('express');
const router = express.Router();
const Activity = require('../models/activityModel');
const { protect } = require('../middleware/authMiddleware'); 

router.get('/', protect, async (req, res) => {
    const pageSize = parseInt(req.query.limit) || 15; 
    const page = parseInt(req.query.page) || 1; 
    const followeeIds = []; 

    const filter = followeeIds.length > 0 
        ? { user: { $in: followeeIds } }
        : {}; 

    try {
        const activities = await Activity.find(filter)
            .sort({ createdAt: -1 }) 
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .populate('user', 'username avatar') 
            .populate('content', 'title imageUrl contentType externalId')
            .select('+likes');

        const count = await Activity.countDocuments(filter);

        res.json({
            activities,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sosyal akış yüklenirken hata oluştu.' });
    }
});

module.exports = router;