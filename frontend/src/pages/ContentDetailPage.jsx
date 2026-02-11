import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const RatingStars = ({ rating }) => {
    const fullStars = Math.floor(rating / 2);
    const stars = Array(5).fill(null).map((_, i) => (
        <span key={i} className={`text-2xl ${i < fullStars ? 'text-yellow-500' : 'text-gray-300'}`}>
            ★
        </span>
    ));
    return <div className="flex">{stars}</div>;
};

const ContentDetailPage = () => {
    const { id: contentId } = useParams(); 
    
    const { user, isAuthenticated } = useAuth();
    const [content, setContent] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userComment, setUserComment] = useState('');
    const [userRating, setUserRating] = useState(0);

    const [specialLists, setSpecialLists] = useState([]);
    const [isSpecialListModalOpen, setIsSpecialListModalOpen] = useState(false);

    const fetchData = async () => {
        if (!contentId) {
            setLoading(false);
            return;
        }

        try {
            const contentRes = await axios.get(`http://localhost:5000/api/content/${contentId}`);
            setContent(contentRes.data);

            const reviewsRes = await axios.get(`http://localhost:5000/api/reviews/${contentId}`);
            setReviews(reviewsRes.data);

        } catch (err) {
            console.error("Veri çekilemedi:", err);
            setContent(null); 
        } finally {
            setLoading(false);
        }
    };
    
    const fetchSpecialLists = async () => {
        if (!user || !user.token) return;

        try {
            const response = await axios.get('http://localhost:5000/api/lists', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSpecialLists(response.data);
        } catch (error) {
            console.error("Özel listeler çekilemedi:", error);
        }
    };

    useEffect(() => {
        fetchData();
        if (isAuthenticated) {
            fetchSpecialLists();
        }
    }, [contentId, isAuthenticated]); 

    const handleAddToSpecialList = async (listId) => {
        
        const contentMongoId = content?._id; 
        
        if (!contentMongoId || !user || !user.token) return alert('İçerik ID veya kullanıcı bilgisi eksik.');
        
        try {
            const response = await axios.put(`http://localhost:5000/api/lists/${listId}/content`, {
                contentId: contentMongoId,
                action: 'add'
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            alert(response.data.message);
            setIsSpecialListModalOpen(false);
            
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Listeye eklerken hata oluştu.';
            alert(errorMessage);
        }
    };


    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        if (!user || !user.token) {
            console.warn("Lütfen giriş yapın.");
            return;
        }
        
        if (!content || !content._id) {
            console.error("Yorum Gönderme Hatası: İçerik veritabanı ID'si (content._id) mevcut değil.", content);
            return; 
        }

        const submittedComment = userComment.trim() || null; 
        const submittedRating = (userRating >= 1 && userRating <= 10) ? userRating : null; 
        
        if (!submittedComment && !submittedRating) {
            alert("Lütfen bir yorum metni girin veya 1 ile 10 arasında bir puan verin.");
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/reviews', {
                contentId: content._id, 
                comment: submittedComment,
                rating: submittedRating
            }, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                }
            });

            console.log('Yorumunuz/Puanınız başarıyla kaydedildi.');
            setUserComment('');
            setUserRating(0);
            fetchData();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Yorum gönderirken hata oluştu.';
            console.error(errorMessage);
        }
    };

    const handleListAdd = async (status) => {
        if (!user || !user.token) {
            console.warn("Bu işlemi yapmak için lütfen giriş yapın.");
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/library/add', {
                contentId: contentId,
                listStatus: status
            }, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                }
            });

            console.log(`İçerik, '${status}' listenize eklendi/güncellendi. Aktivite kaydedildi.`);

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Listeye eklerken hata oluştu.';
            console.error(errorMessage);
        }
    };

    if (loading) {
        return <div className="text-center mt-20">Yükleniyor...</div>;
    }

    if (!content) {
        return <div className="text-center mt-20 text-red-600">İçerik bulunamadı veya sunucu hatası oluştu.</div>;
    }
    
    const isMovie = content.contentType === 'movie';
    const isBook = content.contentType === 'book';

    let releaseYear = 'Bilinmiyor';

    if (content.publishedDate) { 
        releaseYear = content.publishedDate.toString().substring(0, 4); 
    } 
    else if (content.releaseDate) {
        releaseYear = content.releaseDate.toString().substring(0, 4);
    }

    let durationOrPages = 'Bilinmiyor';
    if (isMovie && content.runtime) {
        const hours = Math.floor(content.runtime / 60);
        const minutes = content.runtime % 60;
        durationOrPages = hours > 0 ? `${hours}s ${minutes}dk` : `${minutes} dakika`;
    } else if (isBook && content.pageCount) {
        durationOrPages = `${content.pageCount} sayfa`;
    }

    let creator = 'Bilinmiyor';
    if (isMovie && content.director) {
        creator = content.director; 
    } else if (isBook && content.author) {
        creator = content.author;
    }
    
    const genres = content.genres?.length > 0 ? content.genres.join(', ') : 'Belirtilmemiş';

    const imageUrl = content.imageUrl;
    
    return (
        <div className="container mx-auto p-8 max-w-6xl relative">
            
            {isSpecialListModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm">
                        <h3 className="text-xl font-bold mb-4">Hangi Listeye Eklemek İstersiniz?</h3>
                        
                        {specialLists.length === 0 ? (
                            <p className="text-gray-500 mb-4">
                                Henüz özel listeniz yok. <a href="/profile" className="text-indigo-600 hover:underline">Profilinizden</a> yeni bir liste oluşturabilirsiniz.
                            </p>
                        ) : (
                            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                                {specialLists.map(list => (
                                    <button
                                        key={list._id}
                                        onClick={() => handleAddToSpecialList(list._id)}
                                        className="w-full text-left p-3 border rounded hover:bg-indigo-50 transition flex justify-between items-center"
                                        disabled={!content || !content._id}
                                    >
                                        <span className="font-semibold text-indigo-700">{list.name}</span>
                                        <span className="text-xs text-gray-500">({list.contents.length} içerik)</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setIsSpecialListModalOpen(false)}
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            
            <div className="flex flex-col md:flex-row gap-8 mb-10 border-b pb-8">
                <div className="flex-shrink-0 w-full md:w-64">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={content.title} 
                            className="rounded-lg shadow-xl w-full h-auto object-cover" 
                        />
                    ) : (
                        <div className="bg-gray-200 rounded-lg shadow-xl w-full h-96 flex items-center justify-center text-gray-500">
                            Kapak Yok
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
                        {content.title}
                    </h1>
                    
                    <p className="text-xl text-gray-500 mb-4">
                        {isMovie ? 'Film' : 'Kitap'}
                    </p>

                    <div className="mb-6">
                        <p className="text-md font-semibold">Platform Ortalaması:</p>
                        <div className="flex items-center">
                            <RatingStars rating={content.avgRating} />
                            <span className="ml-2 text-xl font-bold text-yellow-700">{content.avgRating ? content.avgRating.toFixed(1) : '0.0'}/10</span>
                            <span className="ml-2 text-gray-500 text-sm">({content.totalRatings || 0} Oy)</span>
                        </div>
                    </div>

                    <div className="space-y-2 text-lg text-gray-700">
                        
                        <p>
                            <span className="font-semibold text-indigo-600">{isMovie ? 'Yayın Yılı' : 'Çıkış Yılı'}:</span> {releaseYear}
                        </p>
                        
                        <p>
                            <span className="font-semibold text-indigo-600">{isMovie ? 'Süre' : 'Sayfa Sayısı'}:</span> {durationOrPages}
                        </p>
                        
                        <p>
                            <span className="font-semibold text-indigo-600">{isMovie ? 'Yönetmen/leri' : 'Yazar/ları'}:</span> {creator}
                        </p>
                        
                        <p>
                            <span className="font-semibold text-indigo-600">Türler:</span> {genres}
                        </p>
                    </div>

                    <div className="space-x-3 mt-6">
                        {content.contentType === 'movie' ? (
                            <>
                                <button onClick={() => handleListAdd('watched')} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">İzledim</button>
                                <button onClick={() => handleListAdd('to_watch')} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">İzlenecek</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => handleListAdd('read')} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Okudum</button>
                                <button onClick={() => handleListAdd('to_read')} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Okunacak</button>
                            </>
                        )}
                        <button 
                            onClick={() => {
                                if (!isAuthenticated) return console.warn("Lütfen giriş yapın.");
                                setIsSpecialListModalOpen(true);
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                            Özel Listeye Ekle
                        </button>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Özet</h2>
            <p className="text-gray-700 leading-relaxed mb-10">
                {content.summary || 'Bu içerik için bir özet bulunmamaktadır.'}
            </p>
            
            <h2 className="text-3xl font-bold mt-10 mb-6 text-gray-800 border-b pb-2">Yorumlar</h2>

            {isAuthenticated ? (
                <form onSubmit={handleReviewSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h3 className="text-xl font-semibold mb-3">Yorumunuzu ve Puanınızı Ekleyin</h3>

                    <div className="flex items-center mb-4">
                        <label className="mr-3">Puanınız (1-10):</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={userRating}
                            onChange={(e) => setUserRating(parseInt(e.target.value) || 0)}
                            className="w-16 p-2 border border-gray-300 rounded"
                        />
                    </div>

                    <textarea
                        placeholder="Düşüncelerinizi paylaşın..."
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                        rows="4"
                        required={userRating === 0 && userComment.trim() === ''}
                    ></textarea>
                    <button
                        type="submit"
                        className="mt-3 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        Yorum Gönder
                    </button>
                </form>
            ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg shadow-sm mb-8">
                    <p className="text-yellow-800">Yorum yapmak ve puanlamak için lütfen <a href="/login" className="font-bold text-indigo-600 hover:underline">giriş yapınız</a>.</p>
                </div>
            )}
            
            <div className="space-y-6">
                {reviews.length === 0 && <p className="text-gray-500">Henüz yorum yapılmamış.</p>}
                {reviews.map((review) => (
                    <div key={review._id} className="bg-white p-5 rounded-lg shadow border-l-4 border-indigo-500">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                                <span className="font-bold text-gray-800">{review.user.username}</span> 
                                <span className="ml-3 text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            {review.rating > 0 && (
                                <span className="text-lg font-bold text-yellow-600">{review.rating}/10</span>
                            )}
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                    </div>
                ))}
            </div>


        </div>

        
    );
};

export default ContentDetailPage;