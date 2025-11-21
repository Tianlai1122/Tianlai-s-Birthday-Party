require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const partySceneRoutes = require('./routes/party-scene');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        process.env.FRONTEND_URL,
        /\.vercel\.app$/
    ].filter(Boolean),
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    });

// API routes
app.use('/api/party-scene', partySceneRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: '🎉 Virtual Party Scene API is running!',
        version: '1.0.0',
        endpoints: {
            createCharacter: 'POST /api/party-scene/characters',
            getAllCharacters: 'GET /api/party-scene/characters',
            getCharacter: 'GET /api/party-scene/characters/:id',
            updateCharacter: 'PATCH /api/party-scene/characters/:id',
            likeCharacter: 'POST /api/party-scene/characters/:id/like',
            addMessage: 'POST /api/party-scene/characters/:id/messages',
            deleteCharacter: 'DELETE /api/party-scene/characters/:id'
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size exceeds 5MB limit' });
        }
        return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
        error: error.message || 'Internal server error' 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🎉 Virtual Party Scene Server        ║
║                                        ║
║   Server: http://localhost:${PORT}       ║
║   Status: Running                      ║
║   Database: MongoDB                    ║
║                                        ║
╚════════════════════════════════════════╝
    `);
});

module.exports = app;

