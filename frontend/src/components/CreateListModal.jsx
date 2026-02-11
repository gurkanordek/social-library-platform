import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CreateListModal = ({ isOpen, onClose, onListCreated }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!name.trim()) {
            setError("Liste adı boş bırakılamaz.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/lists',
                { name, description },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                }
            );

            onListCreated(response.data);
            onClose();
            setName('');
            setDescription('');

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Liste oluşturulurken bir hata oluştu.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-indigo-700">Yeni Özel Liste Oluştur</h2>
                <form onSubmit={handleSubmit}>
                    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                    <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-1">Liste Adı (Zorunlu)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500"
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 font-semibold mb-1">Açıklama</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500"
                            rows="3"
                            disabled={loading}
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                            disabled={loading}
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Oluşturuluyor...' : 'Listeyi Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateListModal;