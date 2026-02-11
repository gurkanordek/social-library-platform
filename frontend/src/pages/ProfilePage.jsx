import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import CreateListModal from '../components/CreateListModal';

const ProfilePage = () => {
    const { userId } = useParams();
    const { user, isAuthenticated } = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentList, setCurrentList] = useState('watched');
    const [listItems, setListItems] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [specialLists, setSpecialLists] = useState([]);
    
    const [selectedSpecialListItems, setSelectedSpecialListItems] = useState([]);
    const [selectedListId, setSelectedListId] = useState(null);

    const handleListCreated = (newList) => {
        setSpecialLists(prevLists => [newList, ...prevLists]);
    };

    const isOwner = user && user._id === userId;

    const listTabs = [
        { name: 'İzlediklerim', status: 'watched' },
        { name: 'İzlenecekler', status: 'to_watch' },
        { name: 'Okuduklarım', status: 'read' },
        { name: 'Okunacaklar', status: 'to_read' },
    ];

    const handleFollow = async () => {
        if (!user || !user.token) {
            alert("Bu işlemi yapmak için giriş yapmalısınız.");
            return;
        }
        try {
            const response = await axios.post(`http://localhost:5000/api/users/follow/${userId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );

            setIsFollowing(response.data.status === 'followed');
            alert(response.data.message);

        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Takip işlemi başarısız oldu.';
            alert(errorMessage);
        }
    };

    const fetchLibrary = async (status) => {
        setLoading(true);
        setSelectedSpecialListItems([]);
        setSelectedListId(null); 
        
        try {
            const res = await axios.get(`http://localhost:5000/api/library/${userId}?status=${status}`);
            setListItems(res.data);

            setProfileData({
                username: "Testkullanici",
                bio: isOwner ? "Bu benim kişisel kütüphanem." : "Bu, başkasının profilidir.",
            });

        } catch (error) {
            console.error("Kütüphane verisi çekilemedi:", error);
            setProfileData(null);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchSpecialListContent = async (listId) => {
        if (!listId || !user || !user.token) return;
        setLoading(true);
        
        try {
            const response = await axios.get(`http://localhost:5000/api/lists/${listId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            setSelectedSpecialListItems(response.data.contents || []); 
            
        } catch (error) {
            console.error("Özel liste içeriği çekilemedi:", error);
            setSelectedSpecialListItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSpecialListClick = (listId) => {
        if (currentList !== 'special') {
            setCurrentList('special');
        }
        if (selectedListId === listId) return; 

        setSelectedListId(listId);
        fetchSpecialListContent(listId);
    };


    useEffect(() => {
        if (userId && currentList !== 'special') {
            fetchLibrary(currentList);
        }
    }, [userId, currentList, isOwner]);

    useEffect(() => {
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

        if (isAuthenticated && isOwner) {
            fetchSpecialLists();
        }
    }, [isAuthenticated, isOwner]);

    if (loading || !profileData) {
        return <div className="text-center mt-20">Yükleniyor...</div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <CreateListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onListCreated={handleListCreated}
            />
            
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h1 className="text-3xl font-bold text-indigo-700 mb-2">
                    {profileData.username} Profil Sayfası
                </h1>
                <p className="text-gray-600 mb-4">{profileData.bio}</p>

                {isOwner ? (
                    <div className="space-x-3">
                        <button className="bg-gray-200 text-gray-800 px-4 py-1 rounded">Profili Düzenle</button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 transition"
                        >
                            Yeni Özel Liste Oluştur
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleFollow}
                        className={`px-4 py-1 rounded transition ${isFollowing ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                    >
                        {isFollowing ? 'Takipten Çık' : 'Takip Et'}
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-lg">
                <div className="border-b flex overflow-x-auto">
                    {listTabs.map((tab) => (
                        <button
                            key={tab.status}
                            onClick={() => setCurrentList(tab.status)}
                            className={`px-4 py-3 text-sm font-medium transition duration-150 ease-in-out ${
                                currentList === tab.status
                                    ? 'border-b-4 border-indigo-600 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentList('special')}
                        className={`px-4 py-3 text-sm font-medium transition duration-150 ease-in-out ${
                            currentList === 'special'
                                ? 'border-b-4 border-indigo-600 text-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Özel Listeler ({specialLists.length})
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {currentList === 'special' ? (
                        <>
                            <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 rounded border">
                                {specialLists.length === 0 ? (
                                    <p className="text-gray-500 w-full">Henüz özel liste oluşturulmadı.</p>
                                ) : (
                                    specialLists.map(list => (
                                        <button 
                                            key={list._id} 
                                            onClick={() => handleSpecialListClick(list._id)}
                                            className={`px-3 py-1 text-sm rounded transition border ${
                                                selectedListId === list._id 
                                                    ? 'bg-indigo-600 text-white border-indigo-700' 
                                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {list.name} ({list.contents.length})
                                        </button>
                                    ))
                                )}
                            </div>
                            
                            {loading && selectedListId ? (
                                <p className="text-center text-indigo-500">Liste içeriği yükleniyor...</p>
                            ) : selectedListId && selectedSpecialListItems.length === 0 ? (
                                <p className="text-gray-500">Bu özel listede hiç içerik yok.</p>
                            ) : selectedListId ? (
                                selectedSpecialListItems.map(item => (
                                    <div key={item._id} className="bg-gray-50 p-3 border rounded flex items-center justify-between hover:bg-gray-100 transition cursor-pointer">
                                        <a href={`/content/${item.externalId}`} className="font-semibold text-indigo-700 hover:text-indigo-900">
                                            {item.title}
                                        </a>
                                        <span className="text-xs text-gray-500">{item.contentType}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">Görüntülemek için yukarıdaki butonlardan bir liste seçin.</p>
                            )}
                        </>
                    ) : (
                        listItems.length === 0 ? (
                            <p className="text-gray-500">Bu listede hiç içerik yok.</p>
                        ) : (
                            listItems.map(item => (
                                <div key={item._id} className="bg-gray-50 p-3 border rounded flex items-center justify-between">
                                    <a href={`/content/${item.content?.externalId}`} className="font-semibold hover:text-indigo-600">
                                        {item.content?.title || "İçerik Başlığı Yok"}
                                    </a>
                                    <span className="text-xs text-gray-500">
                                        {item.userRating ? `${item.userRating}/10 Puan` : 'Puanlanmadı'}
                                    </span>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;