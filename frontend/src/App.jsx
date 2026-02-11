import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import FeedPage from './pages/FeedPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import ContentDetailPage from './pages/ContentDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

const ProtectedRoute = ({ element: Element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? Element : <Navigate to="/login" replace />;
};

function App() {
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <Router>
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-indigo-600 p-4 text-white shadow-md">
                    <div className="container mx-auto flex justify-between items-center">
                        <Link to="/" className="text-xl font-bold hover:text-indigo-200 transition">Sosyal Kütüphane</Link>

                        <div className="space-x-4">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/feed" className="hover:text-indigo-200">Akış</Link>
                                    <Link to="/search" className="hover:text-indigo-200">Ara/Keşfet</Link>
                                    <Link to={`/profile/${user._id}`} className="hover:text-indigo-200">Profilim</Link>

                                    <button
                                        onClick={logout}
                                        className="text-red-300 hover:text-white transition"
                                    >
                                        Çıkış Yap
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="hover:text-indigo-200">Giriş Yap</Link>
                                    <Link to="/register" className="hover:text-indigo-200">Kayıt Ol</Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <Routes>
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/feed" /> : <Login />} />
                    <Route path="/register" element={isAuthenticated ? <Navigate to="/feed" /> : <Register />} />

                    <Route path="/feed" element={<ProtectedRoute element={<FeedPage />} />} />
                    <Route path="/search" element={<ProtectedRoute element={<SearchPage />} />} />
                    <Route path="/content/:id" element={<ProtectedRoute element={<ContentDetailPage />} />} />
                    <Route path="/profile/:userId" element={<ProtectedRoute element={<ProfilePage />} />} />

                    <Route path="/" element={<Navigate to={isAuthenticated ? "/feed" : "/login"} replace />} />
                    <Route path="*" element={<div>404 Sayfa Bulunamadı</div>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;