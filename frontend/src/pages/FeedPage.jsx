import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; 
import { useParams } from 'react-router-dom'; 
import { timeAgo } from '../utils/timeUtils';


const CommentModal = (props) => { 
    const { isOpen, onClose, activityId, userToken, onCommentAdded } = props; 
    const { user } = useAuth();
    
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(true);

    const fetchComments = async () => {
        setCommentsLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:5000/api/interactions/${activityId}/comments`
            );
            setComments(response.data);
        } catch (error) {
            console.error("Yorumlar yüklenirken hata oluştu:", error);
        } finally {
            setCommentsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && activityId) {
            fetchComments();
        }
    }, [isOpen, activityId]);

    const handleSubmitComment = async () => {
        if (!commentText.trim()) return;
        setLoading(true);

        try {
            const response = await axios.post(
                `http://localhost:5000/api/interactions/${activityId}/comment`,
                { commentText },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            
            const newComment = {
                ...response.data.interaction,
                user: {
                    _id: user._id, 
                    username: user.username,
                    avatar: user.avatar 
                },
                commentText: commentText
            };
            
            setComments(prev => [...prev, newComment]);
            setCommentText('');

            if (onCommentAdded) {
                onCommentAdded();
            }
            
        } catch (error) {
            alert('Yorum eklenirken hata oluştu.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Yorumlar ({comments.length})</h3>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                    {commentsLoading ? (
                        <p className="text-center text-gray-500">Yorumlar yükleniyor...</p>
                    ) : comments.length === 0 ? (
                        <p className="text-center text-gray-500 italic">Henüz yorum yok. İlk yorumu siz yapın!</p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment._id || comment.id} className="border-b pb-2">
                                <p className="text-sm font-semibold text-indigo-700">
                                    {comment.user.username || "Anonim"}
                                    <span className="text-xs text-gray-400 ml-2">
                                        {new Date(comment.createdAt).toLocaleTimeString()}
                                    </span>
                                </p>
                                <p className="text-gray-700 mt-1">{comment.commentText}</p>
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t pt-4">
                    <textarea 
                        value={commentText} 
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Yorumunuzu buraya yazın..."
                        rows="3"
                        disabled={loading}
                        className="w-full p-2 border rounded resize-none mb-3 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="flex justify-end space-x-2">
                        <button 
                            onClick={onClose}
                            disabled={loading}
                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                        >
                            Kapat
                        </button>
                        <button 
                            onClick={handleSubmitComment}
                            disabled={loading || !commentText.trim()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Gönderiliyor...' : 'Yorum Yap'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ActivityCard = ({ activity }) => {
    
    const activityId = activity?.id || activity?._id; 
    
    if (!activity || !activity.content || !activity.user || !activityId || !activity.user.username) { 
        console.warn("Eksik temel veri (ID, Content, User veya Username) nedeniyle aktivite kartı atlandı:", activity);
        return null; 
    }
    
    const { user, isAuthenticated } = useAuth(); 
    
    const currentUserId = user?._id 
    ? user._id.toString().trim().toLowerCase() 
    : null;

    const rawLikesArray = activity.likes || activity.likedBy || [];

    const stringLikesArray = Array.isArray(rawLikesArray) 
        ? rawLikesArray.map(id => {
            let stringId = null;

            if (id && typeof id === 'object' && id._id) {
                stringId = id._id.toString();
            } else if (id && id.toString) {
                stringId = id.toString();
            }
            
            return stringId ? stringId.trim().toLowerCase() : null; 
        }).filter(id => id) 
        : [];

    const hasUserLiked = currentUserId ? stringLikesArray.includes(currentUserId) : false; 

    const initialCommentCount = activity.commentCount || 0;

    const [likeStatus, setLikeStatus] = useState(hasUserLiked); 
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false); 
    const [likeCount, setLikeCount] = useState(stringLikesArray.length); 
    const [commentCount, setCommentCount] = useState(initialCommentCount);
    const [likeLoading, setLikeLoading] = useState(false);
    
    const isRating = activity.activityType === 'RATING' || activity.activityType === 'REVIEW';
    const ratingMatch = activity.actionText.match(/(\d+)\/10/); 
    const ratingDisplay = ratingMatch ? parseInt(ratingMatch[1]) : null;

    const handleLike = async () => {
        if (!isAuthenticated || !activityId) {
            alert(isAuthenticated ? "Aktivite ID'si eksik." : 'Beğenmek için giriş yapmalısınız.');
            return;
        }
        
        setLikeLoading(true);
        
        try {
            const response = await axios.post(
                `http://localhost:5000/api/interactions/${activityId}/like`, 
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            if (response.data.status === 'liked') {
                setLikeStatus(true);
                setLikeCount(prev => prev + 1);
            } else if (response.data.status === 'unliked') {
                setLikeStatus(false);
                setLikeCount(prev => prev - 1);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Beğeni işlemi başarısız oldu.';
            alert(errorMessage);
        } finally {
            setLikeLoading(false);
        }
    };

    const handleCommentSuccess = () => {
        setIsCommentModalOpen(false);
        setCommentCount(prev => prev + 1);
    };

    const MAX_LENGTH = 100;
    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength).trim() + '...';
    };
    
    const handleCommentClick = () => {
        if (!isAuthenticated) {
            alert('Yorum yapmak için giriş yapmalısınız.');
            return;
        }
        setIsCommentModalOpen(true); 
    };
    
    const content = activity.content;
    
    const reviewText = activity.activityType === 'REVIEW' ? activity.actionText : null;


    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            {isCommentModalOpen && user && ( 
            <CommentModal 
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                onCommentAdded={handleCommentSuccess}
                activityId={activityId}
                userToken={user.token}
            />
        )}
            
            <div className="flex items-center justify-between mb-4 border-b pb-3">
    <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-bold mr-3">
    {activity.user?.username ? activity.user.username[0]?.toUpperCase() : '?'} 
</div>
        <div>
            <a href={`/profile/${activity.user?._id || activity.user?.id}`} className="font-semibold text-indigo-700 hover:text-indigo-900">
                {activity.user?.username || 'Bilinmeyen Kullanıcı'}
            </a>
            
            <span className="ml-1 text-gray-600">{activity.actionText}</span>
            
        </div>
    </div>
    
    <span className="text-xs text-gray-500">
        {timeAgo(activity.createdAt)} 
    </span>
</div>

            <div className="flex gap-4">
                <div className="w-20 flex-shrink-0">
                    {content && content.imageUrl ? (
                        <img
                            src={content.imageUrl}
                            alt={content.title}
                            className="w-full h-28 object-cover rounded-md"
                        />
                    ) : (
                        <div className="w-full h-28 bg-gray-100 flex items-center justify-center text-xs text-gray-500 rounded-md">
                            {content?.contentType === 'movie' ? 'Film' : 'Kitap'}
                        </div>
                    )}
                </div>

                <div className="flex-1">
    {content && (
        <h4 className="text-lg font-bold text-gray-800 hover:text-indigo-600">
            {content.title}
        </h4>
    )}

    {isRating && ratingDisplay && (
        <div className="mt-1 flex items-center">
            <span className="mr-2 text-xl font-bold text-yellow-600">{ratingDisplay}/10</span>
            {Array(Math.floor(ratingDisplay / 2)).fill('★').join('')} 
        </div>
    )}

    {reviewText && (
        <div className="mt-2 text-gray-700">
            <p className="text-sm italic border-l-4 border-indigo-200 pl-3">
                {truncateText(reviewText, MAX_LENGTH)}
            </p>

            <a 
                href={`/content/${content?.externalId}`} 
                className="ml-3 text-indigo-500 hover:underline text-xs font-semibold mt-1 inline-block"
            >
                Detaylara Git
            </a>
        </div>
    )}

    {activity.activityType === 'LIST_ADD' && (
        <p className="text-sm text-gray-500 mt-2">
            {activity.actionText}
        </p>
    )}
</div>
            </div>

            <div className="flex mt-4 pt-3 border-t border-gray-100 space-x-4 text-sm text-gray-600">
                <button 
                    onClick={handleLike} 
                    disabled={likeLoading || !isAuthenticated}
                    className="flex items-center hover:text-indigo-600 transition disabled:opacity-50"
                >
                    {likeLoading ? '...' : likeStatus ? '❤️ Beğenildi' : '👍 Beğen'} ({likeCount})
                </button>
                <button 
                    onClick={handleCommentClick} 
                    disabled={!isAuthenticated}
                    className="flex items-center hover:text-indigo-600 transition disabled:opacity-50"
                >
                    💬 Yorum Yap ({commentCount})
                </button>
            </div>
        </div>
    );
};


const FeedPage = () => {
    const { user } = useAuth();
    
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchFeed = async (pageNumber) => {
        if (!user || !user.token) {
            setLoading(false);
            setActivities([]);
            console.warn("Giriş yapılmadığı için Feed isteği engellendi.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/feed?page=${pageNumber}&limit=15`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                }
            });

            const newActivities = response.data.activities;

            setActivities(prevActivities => {
                return pageNumber === 1
                    ? newActivities
                    : [...prevActivities, ...newActivities];
            });

            setHasMore(response.data.page < response.data.pages);

        } catch (err) {
            console.error("Feed yüklenirken hata:", err);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed(1);
    }, [user]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchFeed(nextPage);
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600 border-b pb-3">
                Sosyal Akış (Feed)
            </h1>

            <div className="space-y-6">
                {activities.map((activity) => (
                    <ActivityCard 
                        key={activity.id || activity._id} 
                        activity={activity} 
                    />
                ))}

                {loading && <p className="text-center text-indigo-500">Yükleniyor...</p>}

                {!loading && hasMore && (
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={loadMore}
                            className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition"
                        >
                            Daha Fazla Yükle
                        </button>
                    </div>
                )}

                {!loading && activities.length === 0 && (
                    <p className="text-center text-gray-500 pt-10">
                        {user ? 'Takip ettiğiniz veya kendi aktiviteleriniz bulunamadı.' : 'Giriş yapın veya takip ettiğiniz kişilerin aktivitelerini görmek için takip etmeye başlayın.'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default FeedPage;