const express = require('express');
const router = express.Router();
const Content = require('../models/contentModel');
const mongoose = require('mongoose');

const { searchMovies, getMovieDetails } = require('../services/tmdbService'); 
const { searchBooks, getBookDetails } = require('../services/bookService'); 

router.post('/add', async (req, res) => {
    try {
        const content = await Content.create(req.body);
        res.status(201).json(content); 
    } catch (error) {
        console.error("Content Ekleme Hatası:", error);
        res.status(500).json({ 
            message: 'İçerik eklenirken sunucu hatası oluştu.', 
            error: error.message 
        });
    }
});

router.get('/search', async (req, res) => {
    const { q, genre, year_min, year_max, rating_min, rating_max } = req.query; 

    if (!q && !genre && !year_min && !year_max && !rating_min && !rating_max) {
          return res.status(400).json({ message: 'Arama sorgusu veya filtre parametresi gereklidir.' });
    }

    let dbQuery = {};
    let mongoFilters = [];
    let apiResults = [];
    
    if (genre) {
        const genreArray = genre.split(',').map(g => g.trim());
        dbQuery.genres = { $in: genreArray }; 
    }
    
    if (year_min || year_max) {
        let minQuery = [];
        let maxQuery = [];

        if (year_min && year_min.length === 4) {
            minQuery.push({ $or: [{ releaseDate: { $gte: year_min } }, { publishedDate: { $gte: year_min } }] });
        }
        if (year_max && year_max.length === 4) {
              maxQuery.push({ $or: [{ releaseDate: { $lte: year_max } }, { publishedDate: { $lte: year_max } }] });
        }
        
        if (minQuery.length > 0) mongoFilters.push({ $and: minQuery });
        if (maxQuery.length > 0) mongoFilters.push({ $and: maxQuery });
    }
    
    if (mongoFilters.length > 0) {
        dbQuery.$and = [...(dbQuery.$and || []), ...mongoFilters];
    }
    
    try {
        let dbFilteredResults = [];

        if (q) {
            const [movies, books] = await Promise.all([
                searchMovies(q),
                searchBooks(q)
            ]);
            
            apiResults = [...movies, ...books];
            
            const apiExternalIds = apiResults.map(item => item.externalId);
            
            if (apiExternalIds.length > 0) {
                  dbQuery.externalId = { $in: apiExternalIds };
            } else {
                  dbQuery.externalId = { $in: ['NONEXISTENT'] };
            }
        } 
        
        dbFilteredResults = await Content.find(dbQuery).limit(50).lean();
        
        const contentMap = new Map();

        dbFilteredResults.forEach(item => {
            contentMap.set(item.externalId, item);
        });

        apiResults.forEach(apiItem => {
            const externalId = apiItem.externalId;
            const dbItem = contentMap.get(externalId);
            
            if (dbItem) {
                const mergedItem = { ...dbItem, ...apiItem }; 
                contentMap.set(externalId, mergedItem); 
            } else {
                contentMap.set(externalId, apiItem);
            }
        });
        
        const combinedUniqueResults = Array.from(contentMap.values());
        
        const finalFilteredResults = combinedUniqueResults.filter(item => {
            
            const itemRating = item.avgRating || 0; 
            const itemYear = parseInt(item.releaseDate?.substring(0, 4) || item.publishedDate?.substring(0, 4) || 0);
            
            if (rating_min && itemRating < parseFloat(rating_min)) return false;
            if (rating_max && itemRating > parseFloat(rating_max)) return false;
            
            if (year_min && itemYear < parseInt(year_min)) return false;
            if (year_max && itemYear > parseInt(year_max)) return false;

            if (genre) {
                const requiredGenres = genre.split(',').map(g => g.trim().toLowerCase());
                const itemGenres = item.genres?.map(g => g.toLowerCase()) || [];
                const itemHasRequiredGenre = requiredGenres.some(reqGenre => itemGenres.includes(reqGenre));
                if (!itemHasRequiredGenre) return false;
            }
            
            return true;
        });

        res.json({
            count: finalFilteredResults.length,
            results: finalFilteredResults
        });

    } catch (error) {
        console.error("Gelişmiş Filtreleme Hatası:", error);
        res.status(500).json({ message: 'Filtreleme sırasında sunucu hatası oluştu.' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const encodedId = req.params.id;
        let externalId = decodeURIComponent(encodedId); 

        const standardizedExternalId = externalId.startsWith('/') ? externalId.substring(1) : externalId;
        
        let content = await Content.findOne({ 
            externalId: standardizedExternalId 
        });
        
        let fetchedDetails = null;

        if (content) {
            
            const contentType = content.contentType;
            const apiId = content.externalId; 
            
            if (contentType === 'movie') {
                fetchedDetails = await getMovieDetails(apiId);
            } else if (contentType === 'book') {
                fetchedDetails = await getBookDetails(apiId);
            }

            if (fetchedDetails) {
                
                const updatePayload = {
                    director: fetchedDetails.director,
                    author: fetchedDetails.author,
                    runtime: fetchedDetails.runtime,
                    pageCount: fetchedDetails.pageCount,
                    releaseDate: fetchedDetails.releaseDate || fetchedDetails.publishedDate,
                    summary: fetchedDetails.summary || fetchedDetails.description,
                    genres: fetchedDetails.genres,
                    avgRating: fetchedDetails.avgRating,
                    totalRatings: fetchedDetails.totalRatings
                };

                const updatedDbContent = await Content.findByIdAndUpdate(
                    content._id, 
                    updatePayload, 
                    { new: true, runValidators: true }
                ).lean(); 
                
                const finalResponse = Object.assign({}, updatedDbContent, fetchedDetails);
                
                finalResponse.imageUrl = content.imageUrl; 

                return res.json(finalResponse);
            }
            
            return res.json(content);


        } else {
            
            let apiId = standardizedExternalId; 
            const isNumericId = !isNaN(parseInt(apiId)); 

            if (!isNumericId || apiId.startsWith('OL') || apiId.includes('-')) { 
                try {
                    fetchedDetails = await getBookDetails(apiId);
                } catch (e) {
                    console.warn(`Kitap detayı çekme başarısız: ${apiId}. Hata: ${e.message}`);
                }
            } 
            
            if (!fetchedDetails && isNumericId) {
                fetchedDetails = await getMovieDetails(apiId); 
            }
            
            if (fetchedDetails && fetchedDetails.title) {
                fetchedDetails.externalId = standardizedExternalId; 
                fetchedDetails.contentType = fetchedDetails.contentType || (isNumericId ? 'movie' : 'book');
                
                content = await Content.create(fetchedDetails);
                console.log(`Yeni içerik MongoDB'ye kaydedildi: ${content.title}`);
                return res.json(content);
            } else {
                return res.status(404).json({ message: 'İçerik harici API\'lerde bulunamadı veya detayları çekilemedi.' });
            }
        }
    } catch (error) {
        console.error("Tekil İçerik Getirme Hatası (Genel):", error);
        res.status(500).json({ message: 'İçerik detayı çekilirken genel sunucu hatası oluştu.' });
    }
});
module.exports = router;