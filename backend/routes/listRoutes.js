const express = require('express');
const router = express.Router();
const List = require('../models/listModel');
const Content = require('../models/contentModel');
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware'); 

router.post('/', protect, async (req, res) => {
    const userId = req.userId;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Liste adı zorunludur.' });
    }

    try {
        const list = await List.create({
            user: userId,
            name,
            description,
        });

        res.status(201).json(list);

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Bu isimde bir listeniz zaten var.' });
        }
        
        res.status(500).json({ message: 'Liste oluşturma hatası.' });
    }
});


router.get('/', protect, async (req, res) => {
    const userId = req.userId;

    try {
        const lists = await List.find({ user: userId }).sort({ updatedAt: -1 });
        res.json(lists);

    } catch (error) {
        res.status(500).json({ message: 'Listeler getirilemedi.' });
    }
});


router.get('/:listId', protect, async (req, res) => {
    const userId = req.userId;
    const { listId } = req.params;

    try {
        const list = await List.findOne({ _id: listId, user: userId })
            .populate({
                path: 'contents',
                model: 'Content', 
                select: 'title externalId contentType imageUrl' 
            })
            .lean();

        if (!list) {
            return res.status(404).json({ message: 'Liste bulunamadı veya size ait değil.' });
        }

        res.json(list); 

    } catch (error) {
        if (error.kind === 'ObjectId') {
              return res.status(400).json({ message: 'Geçersiz liste ID formatı.' });
        }
        res.status(500).json({ message: 'Liste detayları çekilemedi.' });
    }
});


router.put('/:listId/content', protect, async (req, res) => {
    const userId = req.userId;
    const { listId } = req.params;
    const { contentId, action } = req.body;

    if (!contentId || !action || (action !== 'add' && action !== 'remove')) {
        return res.status(400).json({ message: 'İçerik ID ve geçerli aksiyon (add/remove) gereklidir.' });
    }
    
    let mongoContentId = contentId;

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
        const cleanedExternalId = contentId.startsWith('/') ? contentId.substring(1) : contentId;

        const contentDoc = await Content.findOne({ externalId: cleanedExternalId });

        if (!contentDoc) {
            return res.status(404).json({ message: 'İçerik veritabanında bulunamadı.' });
        }
        
        mongoContentId = contentDoc._id;
    }

    try {
        const list = await List.findOne({ _id: listId, user: userId });

        if (!list) {
            return res.status(404).json({ message: 'Liste bulunamadı veya size ait değil.' });
        }

        if (action === 'add') {
            if (!list.contents.includes(mongoContentId)) {
                list.contents.push(mongoContentId);
            }
            
            await list.save();
            return res.json({ message: 'İçerik listeye eklendi.' });
        }

        if (action === 'remove') {
            list.contents = list.contents.filter(id => id.toString() !== mongoContentId.toString());
            await list.save();
            return res.json({ message: 'İçerik listeden çıkarıldı.' });
        }

    } catch (error) {
        if (error.kind === 'ObjectId') {
              return res.status(400).json({ message: 'Geçersiz liste ID formatı.' });
        }
        res.status(500).json({ message: 'Liste güncelleme hatası.' });
    }
});

module.exports = router;