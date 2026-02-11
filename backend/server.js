const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); 
const cors = require('cors');

dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 5000; 

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Bağlantısı Başarılı: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Hata: MongoDB bağlantısı kurulamadı: ${error.message}`);
        process.exit(1); 
    }
}

connectDB(); 

const allowedOrigins = ['http://localhost:5173'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Bu Origin için CORS izni verilmedi.'));
        }
    },
    credentials: true
}));

app.use(express.json());

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes); 

const contentRoutes = require('./routes/contentRoutes');
app.use('/api/content', contentRoutes);

const libraryRoutes = require('./routes/libraryRoutes');
app.use('/api/library', libraryRoutes);

const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

const feedRoutes = require('./routes/feedRoutes');
app.use('/api/feed', feedRoutes);

const listRoutes = require('./routes/listRoutes');
app.use('/api/lists', listRoutes);

const interactionRoutes = require('./routes/interactionRoutes');
app.use('/api/interactions', interactionRoutes);

app.get('/', (req, res) => {
    res.send('Sosyal Kütüphane API çalışıyor ve hazır!');
});

app.listen(PORT, () => {
    console.log(`Backend sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});