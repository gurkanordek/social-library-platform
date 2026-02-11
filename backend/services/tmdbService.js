const axios = require('axios');

// TMDB API KEY'i doğrudan process.env'den alıp globalde tutuyoruz.
// Eğer bu yine çalışmazsa, ENV değişkenini tekrar kontrol edin.
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const searchMovies = async (query) => {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
                // KRİTİK KONTROL: Anahtarın burada doğru kullanıldığından emin ol
                api_key: TMDB_API_KEY, 
                query: query,
                language: 'tr-TR' 
            }
        });
        
        // ... (Rest of searchMovies logic remains the same)
        return response.data.results.map(movie => ({
            externalId: movie.id.toString(),
            title: movie.title,
            releaseDate: movie.release_date,
            contentType: 'movie',
            avgRating: movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : 0,
            totalRatings: movie.vote_count || 0,
            imageUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            summary: movie.overview
        }));

    } catch (error) {
        console.error("TMDB Arama Hatası:", error.message);
        return [];
    }
};

// *** GÜNCELLENMİŞ FONKSİYON: TMDB Puanı ve Oy Sayısı Eklendi ***
const getMovieDetails = async (externalId) => {
    try {
        // Filmin ana detaylarını çekme
        const detailsRes = await axios.get(`${TMDB_BASE_URL}/movie/${externalId}`, {
            params: {
                api_key: TMDB_API_KEY, // KRİTİK KONTROL: Anahtar burada da kullanılıyor
                language: 'tr-TR' 
            }
        });

        const movie = detailsRes.data;

        // Yönetmen bilgisini çekmek için credits rotası
        const creditsRes = await axios.get(`${TMDB_BASE_URL}/movie/${externalId}/credits`, {
            params: { api_key: TMDB_API_KEY } // KRİTİK KONTROL: Anahtar burada da kullanılıyor
        });

        const director = creditsRes.data.crew.find(member => member.job === 'Director');

        return {
            externalId: movie.id.toString(),
            title: movie.title,
            releaseDate: movie.release_date,
            runtime: movie.runtime, 
            contentType: 'movie',
            avgRating: movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : 0,
            totalRatings: movie.vote_count || 0,
            imageUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            summary: movie.overview,
            genres: movie.genres ? movie.genres.map(g => g.name) : [],
            director: director ? director.name : null,
        };

    } catch (error) {
        console.error(`TMDB Detay Çekme Hatası (${externalId}):`, error.message);
        return null;
    }
};

// Modül dışa aktarımlarını güncelliyoruz
module.exports = { searchMovies, getMovieDetails };