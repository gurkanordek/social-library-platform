const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/reviewModel');
const Activity = require('../models/activityModel');
const { protect } = require('../middleware/authMiddleware');
const Content = require('../models/contentModel');

const updateContentRating = async (contentId) => {
    try {
        const stats = await Review.aggregate([
            { $match: { content: contentId, rating: { $exists: true, $ne: null } } },
            { 
                $group: {
                    _id: '$content',
                    totalRatingSum: { $sum: '$rating' },
                    totalRatingCount: { $sum: 1 } 
                }
            }
        ]);

        const totalRatingCount = stats[0]?.totalRatingCount || 0;
        const totalRatingSum = stats[0]?.totalRatingSum || 0;
        
        const newAvgRating = totalRatingCount > 0 ? (totalRatingSum / totalRatingCount) : 0;
        
        await Content.findByIdAndUpdate(
            contentId, 
            {
                avgRating: parseFloat(newAvgRating.toFixed(1)), 
                totalRatings: totalRatingCount
            },
            { new: true }
        );

    } catch (error) {
        console.error("Content Puan Güncelleme Hatası:", error);
    }
};

router.post('/', protect, async (req, res) => {
    const userId = req.userId; 
    const { contentId, comment, rating } = req.body; 

    const finalComment = comment?.trim() || null; 
    const finalRating = rating || null; 

    if (!userId || !contentId || (!finalComment && !finalRating)) {
        return res.status(400).json({ message: 'Lütfen bir yorum metni girin veya bir puan verin.' });
    }

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
          return res.status(400).json({ message: 'Geçersiz içerik kimliği formatı.' });
    }

    try {
        let review = await Review.findOne({ user: userId, content: contentId });
        let isNewReview = false;
        
        if (review) {
            review.comment = finalComment || review.comment;
            review.rating = finalRating || review.rating;
            await review.save();
        } else {
            review = await Review.create({
                user: userId,
                content: contentId,
                comment: finalComment,
                rating: finalRating
            });
            isNewReview = true;
        }

        if (review.rating) {
              await updateContentRating(review.content);
        }

        if (review.rating || finalComment) {
            const actionText = finalComment 
                                ? `bir yorum yaptı ve ${review.rating ? `${review.rating}/10 puan verdi.` : 'oyladı.'}` 
                                : `bir içeriği ${review.rating}/10 puanla oyladı.`;

            const activityType = finalComment ? 'REVIEW' : 'RATING';

            let activity = await Activity.findOne({ 
                relatedReview: review._id,
                user: userId
            });

            if (activity) {
                activity.actionText = actionText;
                activity.activityType = activityType;
                await activity.save();
            } else if (isNewReview) {
                await Activity.create({
                    user: review.user,
                    content: review.content,
                    activityType: activityType,
                    relatedReview: review._id,
                    actionText: actionText,
                });
            }
        }

        const status = isNewReview ? 201 : 200;

        return res.status(status).json({ 
            message: `Yorum/Puan ${isNewReview ? 'eklendi' : 'güncellendi'} ve aktivite kaydedildi.`, 
            review 
        });

    } catch (error) {
        console.error("Yorum POST İşlem Hatası (500):", error.message);
        
        if (error.name === 'ValidationError' || error.code === 11000) {
            return res.status(400).json({ message: `Doğrulama Hatası: ${error.message}` });
        }
        
        res.status(500).json({ message: 'Yorum işleminde beklenmedik bir sunucu hatası oluştu.' });
    }
});

router.get('/:contentId', async (req, res) => {
    const contentParam = req.params.contentId; 
    let contentMongoId = contentParam;

    try {
        if (!mongoose.Types.ObjectId.isValid(contentParam)) { 
            const contentDoc = await Content.findOne({ externalId: contentParam });

            if (!contentDoc) {
                return res.json([]);
            }
            contentMongoId = contentDoc._id;
        }

        const reviews = await Review.find({ content: contentMongoId })
            .sort({ createdAt: -1 })
            .populate('user', 'username avatar'); 

        res.json(reviews);

    } catch (error) {
        console.error("Yorum Getirme Hatası (ReviewRoutes):", error);
        res.status(500).json({ message: 'Yorum listesi getirilemedi.' });
    }
});

router.delete('/:reviewId', async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Yorum bulunamadı.' });
        }
        
        if (review.rating) {
            await updateContentRating(review.content);
        }

        res.json({ message: 'Yorum başarıyla silindi.' });

    } catch (error) {
        res.status(500).json({ message: 'Yorum silinirken hata oluştu.' });
    }
});

module.exports = router;