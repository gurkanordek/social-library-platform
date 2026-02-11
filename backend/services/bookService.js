const axios = require('axios');
const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const { stripHtml } = require('string-strip-html');

const getImageUrl = (imageLinks) => {
    if (!imageLinks) return null;
    
    const rawUrl = imageLinks.thumbnail || imageLinks.smallThumbnail || null; 
    
    if (rawUrl) {
        return rawUrl.replace('http://', 'https://');
    }

    return null;
};

const searchBooks = async (query) => {
    try {
        const response = await axios.get(`${GOOGLE_BOOKS_API_BASE}?q=${encodeURIComponent(query)}`);
        
        return response.data.items.map(item => ({
            title: item.volumeInfo.title,
            externalId: item.id,
            
            avgRating: item.volumeInfo.averageRating ? parseFloat(item.volumeInfo.averageRating.toFixed(1)) : 0,
            totalRatings: item.volumeInfo.ratingsCount || 0,

            imageUrl: item.volumeInfo.imageLinks?.thumbnail,
            releaseDate: item.volumeInfo.publishedDate?.substring(0, 4) || 'N/A',
            authors: item.volumeInfo.authors || ['Bilinmiyor'],
            contentType: 'book'
        }));

    } catch (error) {
        console.error("Google Books Arama Hatası:", error.message);
        return [];
    }
};

const getBookDetails = async (volumeId) => {
    try {
        const response = await axios.get(`${GOOGLE_BOOKS_API_BASE}/${volumeId}`);
        const data = response.data; 
        
        const volumeInfo = data.volumeInfo; 

        if (!volumeInfo) {
            console.warn(`Google Books'tan ${volumeId} için volumeInfo alınamadı.`);
            throw new Error('Detay bilgisi eksik.');
        }

        let bookAuthor = 'Yazar Bilinmiyor';
        if (volumeInfo.authors && Array.isArray(volumeInfo.authors) && volumeInfo.authors.length > 0) {
            bookAuthor = volumeInfo.authors.join(', ');
        }

        const bookPublishedDate = volumeInfo.publishedDate || null;
        const bookPageCount = volumeInfo.pageCount || null;
        const bookAvgRating = volumeInfo.averageRating || 0;
        const bookTotalRatings = volumeInfo.ratingsCount || 0;

        const rawDescription = volumeInfo.description || volumeInfo.subtitle || 'Özet yok';
        const cleanSummary = stripHtml(rawDescription).result;
        
        return {
            title: volumeInfo.title || 'Başlık Bilinmiyor',
            summary: cleanSummary,
            author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Yazar Bilinmiyor',
            publishedDate: volumeInfo.publishedDate || null, 
            pageCount: volumeInfo.pageCount || null, 
            avgRating: volumeInfo.averageRating || 0,
            totalRatings: volumeInfo.ratingsCount || 0,
            
            imageUrl: getImageUrl(volumeInfo.imageLinks), 
            
            genres: volumeInfo.categories || [],
            externalId: volumeId, 
            contentType: 'book'
        };

    } catch (error) {
        console.error(`Google Books API'den detay çekilemedi: ${volumeId}`, error.message);
        throw new Error('Kitap detayları çekilemedi.');
    }
};

module.exports = { searchBooks, getBookDetails };