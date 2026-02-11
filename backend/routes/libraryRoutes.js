const express = require('express');
const router = express.Router();
const Library = require('../models/libraryModel');
const Activity = require('../models/activityModel');
const Content = require('../models/contentModel');
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, async (req, res) => {
    const userId = req.userId; 
    const { contentId, listStatus, userRating } = req.body;

    if (!userId || !contentId || !listStatus) {
        return res.status(400).json({ message: 'Eksik bilgi: İçerik ve liste durumu gereklidir.' });
    }

    let mongoContentId = contentId;

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        
        const cleanedExternalId = contentId.startsWith('/') ? contentId.substring(1) : contentId;

        const contentDoc = await Content.findOne({ externalId: cleanedExternalId });

        if (!contentDoc) {
            return res.status(404).json({ message: 'Bu içeriğin MongoDB kaydı bulunamadı. Lütfen içeriği yeniden arayınız.' });
        }
        
        mongoContentId = contentDoc._id;
    }

    const listMap = { 
        'watched': 'İzledikleri arasına ekledi.', 
        'to_watch': 'İzlenecekler listesine ekledi.', 
        'read': 'Okudukları arasına ekledi.', 
        'to_read': 'Okunacaklar listesine ekledi.' 
    };
    
    try {
        let item = await Library.findOne({ user: userId, content: mongoContentId });
        let isNewItem = false; 

        if (item) {
            item.listStatus = listStatus;

            if (userRating !== undefined) {
                item.userRating = userRating;
            }
            
            await item.save();

        } else {
            item = await Library.create({
                user: userId,
                content: mongoContentId,
                listStatus,
                userRating
            });

            isNewItem = true;
        }
        
        await Activity.create({
            user: item.user,
            content: item.content,
            activityType: 'LIST_ADD',
            actionText: listMap[item.listStatus], 
            listStatus: item.listStatus
        });

        const message = isNewItem ? 'Kütüphane kaydı başarıyla eklendi.' : 'Kütüphane kaydı güncellendi.';
        const status = isNewItem ? 201 : 200;

        return res.status(status).json({ message: `${message} ve aktivite kaydedildi.`, item });

    } catch (error) {
        if (error.kind === 'ObjectId' || error.name === 'CastError') {
              console.error("Cast Error Library:", error.value);
              return res.status(400).json({ message: `Geçersiz içerik ID formatı. ${error.value}` });
        }
        
        console.error(error);
        res.status(500).json({ message: 'Kütüphane işleminde beklenmedik bir hata oluştu.' });
    }
});

router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { status } = req.query; 

    let filter = { user: userId };

    if (status) {
        filter.listStatus = status;
    }

    try {
        const libraryItems = await Library.find(filter)
            .populate('content', 'title imageUrl contentType summary genres'); 

        res.json(libraryItems);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Kütüphane sorgulama hatası.' });
    }
});

module.exports = router;