const express = require('express');
const router = express.Router();
const Interaction = require('../models/interactionModel');
const Activity = require('../models/activityModel');
const { protect } = require('../middleware/authMiddleware');

router.post('/:activityId/:type', protect, async (req, res) => {
    
    const userIdRaw = req.user._id; 
    
    const userId = userIdRaw ? userIdRaw.toString().trim().toLowerCase() : null;
    
    const { activityId, type } = req.params; 
    const { commentText } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Kullanıcı kimliği doğrulaması başarısız.' });
    }

    const interactionType = type.toUpperCase();

    if (interactionType === 'COMMENT' && !commentText) {
        return res.status(400).json({ message: 'Yorum metni gereklidir.' });
    }
    
    if (interactionType === 'LIKE') {
        try {
            const existingLike = await Interaction.findOne({ user: userId, activity: activityId, interactionType: 'LIKE' });

            if (existingLike) {
                await existingLike.deleteOne();

                await Activity.findOneAndUpdate(
                    { _id: activityId },
                    { $pull: { likes: userId } },
                    { new: true } 
                );
                
                return res.json({ status: 'unliked', message: 'Beğeni kaldırıldı.' });
            } else {
                const newLike = await Interaction.create({
                    user: userId,
                    activity: activityId,
                    interactionType: 'LIKE'
                });
                
                await Activity.findOneAndUpdate(
                    { _id: activityId },
                    { $push: { likes: userId } },
                    { new: true }
                );

                return res.status(201).json({ status: 'liked', message: 'Beğenildi.', interaction: newLike });
            }
        } catch (error) {
            console.error("Like/Unlike hatası:", error); 
            return res.status(500).json({ message: 'Beğeni işleminde hata oluştu.' });
        }
    }

    if (interactionType === 'COMMENT') {
        try {
            const newComment = await Interaction.create({
                user: userId,
                activity: activityId,
                interactionType: 'COMMENT',
                commentText: commentText
            });
            
            await Activity.findByIdAndUpdate(
                activityId,
                { $inc: { commentCount: 1 } },
                { new: true }
            );
            
            return res.status(201).json({ status: 'commented', message: 'Yorum eklendi.', interaction: newComment });
        } catch (error) {
            return res.status(500).json({ message: 'Yorum eklenirken hata oluştu.' });
        }
    }

    return res.status(400).json({ message: 'Geçersiz etkileşim türü.' });
});

router.get('/:activityId/comments', async (req, res) => {
    try {
        const comments = await Interaction.find({ 
            activity: req.params.activityId, 
            interactionType: 'COMMENT' 
        })
        .populate('user', 'username avatar')
        .sort({ createdAt: 1 });
        
        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Yorumlar getirilemedi.' });
    }
});

module.exports = router;