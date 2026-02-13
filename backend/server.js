const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // Geliştirme aşamasında tüm kaynaklara izin ver
    methods: ['GET', 'POST']
}));
app.use(express.json());

// Kelime Veritabanını Yükle
let WORD_DB = {};
try {
    const dataPath = path.join(__dirname, 'data', 'words.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    WORD_DB = JSON.parse(rawData);
    console.log("📚 Kelime veritabanı yüklendi.");
} catch (err) {
    console.error("❌ HATA: words.json bulunamadı! Lütfen 'npm run fetch-words' çalıştırın.");
    // Fallback boş data
    WORD_DB = { 4: ["elma"], 5: ["armut"], 6: ["karpuz"], 7: ["patates"] };
}

// Global State (Production'da Redis kullanılmalı, şimdilik Memory)
global.gameSessions = new Map();
global.WORD_DB = WORD_DB;

// Routes
app.use('/api/game', gameRoutes);

// --- EKSTRA API ENDPOINTLERİ (İsteğin üzerine eklendi) ---

// 2. Rastgele Kelime Veren API
app.get('/api/word', (req, res) => {
    const length = parseInt(req.query.len); // Örn: /api/word?len=5
    
    if (!WORD_DB[length]) {
        return res.status(404).json({ error: "Bu uzunlukta kelime yok." });
    }

    const list = WORD_DB[length];
    const randomWord = list[Math.floor(Math.random() * list.length)];
    
    res.json({ word: randomWord });
});

// 3. Kelime Kontrol API (Kullanıcı salladı mı, gerçek mi?)
app.post('/api/check', (req, res) => {
    const { word } = req.body;
    if (!word) return res.status(400).send("Kelime yok");

    const lowerWord = word.toLocaleLowerCase('tr-TR');
    const len = lowerWord.length;

    // Listede var mı bak
    const isValid = WORD_DB[len] && WORD_DB[len].includes(lowerWord);

    res.json({ isValid });
});

app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor.`);
});