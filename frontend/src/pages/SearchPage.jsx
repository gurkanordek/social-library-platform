import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext'; 

const ResultCard = ({ content, onDetailClick }) => {
    const isMovie = content.contentType === 'movie';
    const imageUrl = content.imageUrl && content.imageUrl.startsWith('/')
        ? `https://image.tmdb.org/t/p/w500${content.imageUrl}`
        : content.imageUrl;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex transform transition duration-200 hover:scale-[1.02] hover:shadow-lg">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={content.title}
                    className="w-24 h-36 object-cover flex-shrink-0"
                />
            ) : (
                <div className="w-24 h-36 bg-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                    Kapak Yok
                </div>
            )}
            <div className="p-3 flex-1">
                <h3 className="text-lg font-semibold text-indigo-700">{content.title}</h3>
                <p className="text-sm text-gray-500 mb-2">
                    {isMovie ? 'Film' : 'Kitap'}
                </p>
            </div>
            <div className="flex items-center p-3">
                <button
                    onClick={() => onDetailClick(content.externalId)}
                    className="bg-indigo-500 text-white text-xs px-3 py-1 rounded hover:bg-indigo-600 transition"
                >
                    Detay
                </button>
            </div>
        </div>
    );
};


const SearchPage = () => {
    const { searchQuery, searchResults, setResults, setSearchLoading, searchLoading } = useSearch();
    
    const [query, setQuery] = useState(searchQuery); 
    const [results, setResultsLocal] = useState(searchResults); 
    const [loading, setLoading] = useState(searchLoading);
    const [searchError, setSearchError] = useState(null);

    const [filterParams, setFilterParams] = useState({
        genres: [],
        yearMin: '',
        yearMax: '',
        ratingMin: 0,
        ratingMax: 10,
    });
    
    const navigate = useNavigate();

    const availableGenres = [
        'Aksiyon', 'Bilim Kurgu', 'Tarih', 'Roman', 'Biyografi', 'Polisiye', 'Macera', 'Fantastik', 'Gerilim', 'Dram'
    ];

    useEffect(() => {
        setQuery(searchQuery);
        setResultsLocal(searchResults);
        setLoading(searchLoading);
    }, [searchQuery, searchResults, searchLoading]);

    const handleGenreChange = (genre) => {
        setFilterParams(prev => {
            const newGenres = prev.genres.includes(genre)
                ? prev.genres.filter(g => g !== genre)
                : [...prev.genres, genre];
            return { ...prev, genres: newGenres };
        });
    };
    
    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!query.trim() && filterParams.genres.length === 0 && !filterParams.yearMin && filterParams.ratingMin === 0) {
            setSearchError('Lütfen bir arama sorgusu girin veya filtre seçin.');
            return;
        }

        setSearchLoading(true);
        setLoading(true);
        setSearchError(null);
        setResultsLocal([]); 

        const params = {};
        if (query.trim()) params.q = query.trim();
        if (filterParams.genres.length > 0) params.genre = filterParams.genres.join(',');
        if (filterParams.yearMin) params.year_min = filterParams.yearMin;
        if (filterParams.yearMax) params.year_max = filterParams.yearMax;
        if (filterParams.ratingMin > 0) params.rating_min = filterParams.ratingMin;
        if (filterParams.ratingMax < 10) params.rating_max = filterParams.ratingMax;

        try {
            const response = await axios.get(`http://localhost:5000/api/content/search`, { params });
            
            setResults(query, response.data.results); 
            
            if (response.data.results.length === 0) {
                setSearchError("Aradığınız kriterlere uygun içerik bulunamadı.");
            }

        } catch (err) {
            console.error("Gelişmiş Filtreleme Hatası:", err);
            setSearchError("Filtreleme sırasında sunucu hatası oluştu.");
            setResults(query, []); 
        } finally {
            setSearchLoading(false);
            setLoading(false);
        }
    };


    const handleDetailClick = (externalId) => {
        const cleanId = externalId; 
        const encodedId = encodeURIComponent(cleanId);
        navigate(`/content/${encodedId}`);
    };


    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
                🔍 İçerik Ara & Keşfet
            </h1>

            <div className="flex flex-col md:flex-row gap-6">

                <div className="w-full md:w-64 flex-shrink-0 bg-white p-4 rounded-lg shadow-xl h-fit border border-indigo-100">
                    <h3 className="text-xl font-bold border-b pb-2 mb-4 text-indigo-600">Filtreler</h3>
                    
                    <div className="mb-4 pt-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Puan Aralığı</label>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Min: {filterParams.ratingMin.toFixed(1)}</span>
                            <span>Max: {filterParams.ratingMax.toFixed(1)}</span>
                        </div>
                        <div className="flex space-x-2 items-center">
                            <input 
                                type="range" 
                                min="0" 
                                max="10" 
                                step="0.5" 
                                value={filterParams.ratingMin} 
                                onChange={(e) => setFilterParams(p => ({ ...p, ratingMin: parseFloat(e.target.value) }))} 
                                className="w-1/2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <input 
                                type="range" 
                                min="0" 
                                max="10" 
                                step="0.5" 
                                value={filterParams.ratingMax} 
                                onChange={(e) => setFilterParams(p => ({ ...p, ratingMax: parseFloat(e.target.value) }))} 
                                className="w-1/2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                        {filterParams.ratingMin > filterParams.ratingMax && <p className="text-red-500 text-xs mt-1">Min, Max'tan büyük olamaz!</p>}
                    </div>
                    
                    <div className="mb-4 border-t pt-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Yayın Yılı Aralığı</label>
                        <div className="flex space-x-2">
                            <input 
                                type="number" 
                                placeholder="Min Yıl"
                                value={filterParams.yearMin}
                                onChange={(e) => setFilterParams(p => ({ ...p, yearMin: e.target.value }))} 
                                className="w-1/2 p-2 border border-gray-300 rounded text-sm"
                            />
                            <input 
                                type="number" 
                                placeholder="Max Yıl"
                                value={filterParams.yearMax}
                                onChange={(e) => setFilterParams(p => ({ ...p, yearMax: e.target.value }))} 
                                className="w-1/2 p-2 border border-gray-300 rounded text-sm"
                            />
                        </div>
                    </div>

                    <div className="mb-4 border-t pt-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tür Seçimi</label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {availableGenres.map(genre => (
                                <div key={genre} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={genre}
                                        checked={filterParams.genres.includes(genre)}
                                        onChange={() => handleGenreChange(genre)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <label htmlFor={genre} className="ml-2 text-sm text-gray-700">{genre}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSearch} 
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Filtreleniyor...' : 'Filtrele / Ara'}
                    </button>
                    
                    <button
                        onClick={() => {
                            setFilterParams({ genres: [], yearMin: '', yearMax: '', ratingMin: 0, ratingMax: 10 });
                            setQuery('');
                            handleSearch({ preventDefault: () => {} });
                        }}
                        className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mt-2"
                    >
                        Filtreleri Temizle
                    </button>
                </div>

                <div className="flex-1">
                    <form onSubmit={handleSearch} className="mb-6 flex shadow-lg rounded-lg overflow-hidden">
                        <input
                            type="text"
                            placeholder="Film veya kitap adı ile arama yapın..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex-1 p-4 border-none focus:ring-0 focus:outline-none text-gray-700"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 text-white px-6 py-4 hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Aranıyor...' : 'Ara'}
                        </button>
                    </form>
                    
                    {searchError && (
                        <div className="bg-red-100 text-red-700 p-4 rounded-md text-center mb-4">
                            {searchError}
                        </div>
                    )}
                    
                    {loading ? (
                        <p className="text-center text-indigo-500 pt-10">İçerikler yükleniyor...</p>
                    ) : (
                        <div className="space-y-4">
                            {results.length > 0 ? (
                                results.map((content) => (
                                    <ResultCard 
                                        key={`${content.contentType}-${content.externalId}`} 
                                        content={content} 
                                        onDetailClick={handleDetailClick}
                                    />
                                ))
                            ) : (
                                !searchError && (
                                    <p className="text-center text-gray-500 pt-10">
                                        Lütfen bir arama yapın veya filtreleri uygulayın.
                                    </p>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;