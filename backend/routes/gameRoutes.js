const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Yardımcı Fonksiyonlar
const getRandomWord = (length) => {
    const list = global.WORD_DB[length] || [];
    return list[Math.floor(Math.random() * list.length)];
};

const getScoring = (length) => {
    // 4 harfliler: Taban 1000, Ceza 100
    if (length === 4) return { base: 1000, penalty: 100 };
    // 5-6-7 harfliler: Taban 2000, Ceza 200
    return { base: 2000, penalty: 200 };
};

const checkWord = (target, guess) => {
    const result = new Array(target.length).fill('');
    const targetArr = target.split('');
    const guessArr = guess.split('');
    
    // 1. Adım: Yeşilleri bul (Doğru yer)
    guessArr.forEach((char, i) => {
        if (char === targetArr[i]) {
            result[i] = 'green';
            targetArr[i] = null; // Eşleşeni yak
        }
    });

    // 2. Adım: Sarıları bul (Yanlış yer)
    guessArr.forEach((char, i) => {
        if (result[i]) return; // Zaten yeşilse geç
        
        const targetIndex = targetArr.indexOf(char);
        if (targetIndex !== -1) {
            result[i] = 'yellow';
            targetArr[targetIndex] = null;
        } else {
            result[i] = 'gray';
        }
    });

    return result;
};

// Sonraki kelimeye geçiş hazırlığı
const prepareNextWord = (session) => {
    if (session.currentWordIndex < session.words.length - 1) {
        session.currentWordIndex++;
        session.guesses = [];
        const nextW = session.words[session.currentWordIndex];
        const scoring = getScoring(nextW.length);
        session.currentWordScore = scoring.base; // Yeni kelime için puanı sıfırla (base puana çek)
        
        return {
            hasMore: true,
            wordLength: nextW.length,
            firstLetter: nextW.word[0],
            round: session.currentWordIndex < 6 ? 1 : 2 // İlk 6 soru Tur 1, sonraki 6 soru Tur 2
        };
    } else {
        return { hasMore: false };
    }
};

// --- ENDPOINTS ---

// Oyunu Başlat
router.post('/start', (req, res) => {
    const sessionId = uuidv4();
    
    // Klasik Mod Başlangıç Yapısı
    const session = {
        id: sessionId,
        mode: 'classic', // classic | final
        round: 1, // 1 veya 2
        totalScore: 0, // KASA (Asla eksiye düşmez)
        currentWordScore: 0, // Şu anki kelimenin potansiyel puanı
        currentWordIndex: 0,
        words: [], // Oynanacak kelimeler listesi
        guesses: [], // Mevcut kelime için tahminler
        startTime: Date.now(),
        finalStage: 4 // Final modu için (4,5,6,7)
    };

    // FAZ 1: 12 Kelime Hazırla
    // Tur 1: 3 tane 4'lü, 3 tane 5'li
    for(let i=0; i<3; i++) session.words.push({ word: getRandomWord(4), length: 4 });
    for(let i=0; i<3; i++) session.words.push({ word: getRandomWord(5), length: 5 });
    // Tur 2: 3 tane 5'li, 3 tane 6'lı
    for(let i=0; i<3; i++) session.words.push({ word: getRandomWord(5), length: 5 });
    for(let i=0; i<3; i++) session.words.push({ word: getRandomWord(6), length: 6 });

    // İlk kelimenin puanını ayarla
    const firstWord = session.words[0];
    session.currentWordScore = getScoring(firstWord.length).base;

    global.gameSessions.set(sessionId, session);

    res.json({
        sessionId,
        mode: 'classic',
        round: 1,
        currentWordLength: firstWord.length,
        firstLetter: firstWord.word[0],
        totalWords: session.words.length,
        totalScore: 0
    });
});

// Tahmin Yap
router.post('/guess', (req, res) => {
    const { sessionId, guess } = req.body;
    const session = global.gameSessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ error: "Oturum bulunamadı" });
    }

    // 1. Temel Kontroller
    if (!guess || typeof guess !== 'string') {
        return res.status(400).json({ error: "Geçersiz tahmin verisi" });
    }
    const guessClean = guess.trim();
    if (!guessClean) return res.status(400).json({ error: "Boş tahmin" });
    
    const guessLower = guessClean.toLocaleLowerCase('tr-TR');

    // Güvenlik: guesses dizisi yoksa oluştur
    if (!session.guesses || !Array.isArray(session.guesses)) {
        session.guesses = [];
    }

    // Final modu güvenliği
    if (session.mode === 'final' && (!session.words[session.currentWordIndex])) {
        session.currentWordIndex = 0;
    }

    const currentTargetObj = session.words[session.currentWordIndex];
    const targetWord = currentTargetObj.word;
    const scoring = getScoring(targetWord.length);

    // ---------------------------------------------------------
    // 🚨 KONTROL 1: AYNI KELİME Mİ? (En Başa Koyduk)
    // ---------------------------------------------------------
    if (session.guesses.includes(guessLower)) {
        // Ceza: Soru Yanar
        session.currentWordScore = 0;

        if (session.mode === 'classic') {
            const nextInfo = prepareNextWord(session);
            let delay = 4000;
            if (nextInfo.hasMore && session.currentWordIndex === 6) delay = 8000;

            return res.json({
                status: 'fail',
                message: `Daha Önce Aynı Kelimeyi Girdiniz! Cevap: ${targetWord.toLocaleUpperCase('tr-TR')}`,
                score: session.totalScore, // Kasa değişmez
                correctWord: targetWord,
                isRoundFinished: !nextInfo.hasMore,
                nextWord: nextInfo.hasMore ? nextInfo : null,
                nextDelay: delay
            });
        } 
        else if (session.mode === 'final') {
            const newWord = getRandomWord(session.finalStage);
            session.words[0] = { word: newWord, length: session.finalStage };
            session.guesses = []; 

            return res.json({
                status: 'final_fail',
                message: `Daha Önce Aynı Kelimeyi Girdiniz! Cevap: ${targetWord.toLocaleUpperCase('tr-TR')}`,
                newFirstLetter: newWord[0],
                newWordLength: session.finalStage
            });
        }
    }

    // ---------------------------------------------------------
    // 🚨 KONTROL 2: GEÇERLİ KELİME Mİ? (TDK)
    // ---------------------------------------------------------
    if (!global.WORD_DB[targetWord.length].includes(guessLower)) {
        session.currentWordScore = 0;

        // Geçersiz kelime de olsa "denendi" saymak istiyorsan burayı açabilirsin:
        // session.guesses.push(guessLower); 
        // Ama genelde geçersiz kelime hak yemez ama soru yakar, o yüzden kaydetmiyoruz.

        if (session.mode === 'classic') {
            const nextInfo = prepareNextWord(session);
            let delay = 4000;
            if (nextInfo.hasMore && session.currentWordIndex === 6) delay = 8000;

            return res.json({
                status: 'fail',
                message: `Geçersiz Bir Kelime Girdiniz! Cevap: ${targetWord.toLocaleUpperCase('tr-TR')}`,
                score: session.totalScore, // Kasa değişmez
                correctWord: targetWord,
                isRoundFinished: !nextInfo.hasMore,
                nextWord: nextInfo.hasMore ? nextInfo : null,
                nextDelay: delay
            });
        }
        else if (session.mode === 'final') {
            const newWord = getRandomWord(session.finalStage);
            session.words[0] = { word: newWord, length: session.finalStage };
            session.guesses = []; 

            return res.json({
                status: 'final_fail',
                message: `Geçersiz Bir Kelime Girdiniz! Cevap: ${targetWord.toLocaleUpperCase('tr-TR')}`,
                newFirstLetter: newWord[0],
                newWordLength: session.finalStage
            });
        }
    }

    // ---------------------------------------------------------
    // 📝 KAYIT (BURASI ÇOK ÖNEMLİ)
    // ---------------------------------------------------------
    // Kelime geçerli ve duplicate değil.
    // Doğru da olsa yanlış da olsa LİSTEYE EKLİYORUZ.
    session.guesses.push(guessLower); 

    // ---------------------------------------------------------
    // 🏁 SONUÇ HESAPLAMA
    // ---------------------------------------------------------
    const result = checkWord(targetWord, guessLower);
    const isCorrect = result.every(r => r === 'green');

    // --- KLASİK MOD ---
    if (session.mode === 'classic') {
        if (isCorrect) {
            session.totalScore += session.currentWordScore;
            const nextInfo = prepareNextWord(session);
            let delay = 4000;
            if (nextInfo.hasMore && session.currentWordIndex === 6) delay = 8000;
            
            return res.json({
                status: 'correct',
                result,
                score: session.totalScore,
                isRoundFinished: !nextInfo.hasMore,
                nextWord: nextInfo.hasMore ? nextInfo : null,
                nextDelay: delay
            });
        } else {
            // YANLIŞ TAHMİN
            session.currentWordScore = Math.max(0, session.currentWordScore - scoring.penalty);
            
            // 5 hak bitti mi?
            if (session.guesses.length >= 5) {
                const nextInfo = prepareNextWord(session);
                let delay = 4000;
                if (nextInfo.hasMore && session.currentWordIndex === 6) delay = 8000;

                return res.json({
                    status: 'fail',
                    result,
                    score: session.totalScore,
                    message: `Doğru Cevap: ${targetWord.toLocaleUpperCase('tr-TR')}`,
                    correctWord: targetWord,
                    isRoundFinished: !nextInfo.hasMore,
                    nextWord: nextInfo.hasMore ? nextInfo : null,
                    nextDelay: delay
                });
            } else {
                return res.json({
                    status: 'wrong',
                    result,
                    score: session.totalScore
                });
            }
        }
    }

    // --- FİNAL MODU ---
    else if (session.mode === 'final') {
        if (isCorrect) {
            let reward = 0;
            if (session.finalStage === 4) reward = `${Math.floor(session.totalScore * 0.5)} Puan (Kasa %50)`;
            if (session.finalStage === 5) reward = `${session.totalScore} Puan (Kasa %100)`;
            if (session.finalStage === 6) reward = `${session.totalScore * 2} Puan (Kasa x2)`;
            if (session.finalStage === 7) reward = `${(session.totalScore * 2)} Puan + 200.000 TL BÜYÜK ÖDÜL!`;

            if (session.finalStage === 7) {
                 return res.json({ status: 'game_won', result, reward, totalScore: session.totalScore });
            }

            // Yeni Aşama
            session.finalStage += 1;
            const newWord = getRandomWord(session.finalStage);
            session.words[0] = { word: newWord, length: session.finalStage };
            session.guesses = [];

            return res.json({
                status: 'final_correct',
                result,
                reward,
                nextStage: session.finalStage,
                firstLetter: newWord[0],
                wordLength: session.finalStage
            });

        } else {
            // Yanlış ama devam
            if (session.guesses.length >= 5) {
                const newWord = getRandomWord(session.finalStage);
                session.words[0] = { word: newWord, length: session.finalStage };
                session.guesses = [];

                return res.json({
                    status: 'final_fail',
                    result,
                    message: `Doğru Cevap: ${targetWord.toLocaleUpperCase('tr-TR')}. Yeni kelime...`,
                    newFirstLetter: newWord[0],
                    newWordLength: session.finalStage
                });
            } else {
                return res.json({ status: 'final_continue', result });
            }
        }
    }
});

// Süre Doldu (Klasik Mod Satır Timeout)
router.post('/timeout', (req, res) => {
    const { sessionId } = req.body;
    const session = global.gameSessions.get(sessionId);
    if (!session) return;

    const currentTargetObj = session.words[session.currentWordIndex];
    const scoring = getScoring(currentTargetObj.length);

    // KURAL: Süre dolarsa direkt yanar.
    session.currentWordScore = 0;
    
    const correctWord = currentTargetObj.word;
    const nextInfo = prepareNextWord(session);

    let delay = 5000; // Standart geçiş 5 saniye
    if (nextInfo.hasMore && session.currentWordIndex === 6) delay = 10000; // Tur geçişi 10 saniye

    res.json({
        status: 'fail',
        message: `Süre Doldu! Doğru Cevap: ${correctWord.toLocaleUpperCase('tr-TR')}`,
        score: session.totalScore,
        correctWord,
        isRoundFinished: !nextInfo.hasMore,
        nextWord: nextInfo.hasMore ? nextInfo : null,
        nextDelay: delay
    });
});

// Final Modunu Başlat
router.post('/start-final', (req, res) => {
    const { sessionId } = req.body;
    const session = global.gameSessions.get(sessionId);
    
    if (!session) return res.status(404).json({});

    session.mode = 'final';
    session.finalStage = 4;
    session.startTime = Date.now(); // 120sn buradan hesaplanacak
    session.currentWordIndex = 0; // Final modunda tek kelime slotu kullanılır, indeksi sıfırla
    
    const firstWord = getRandomWord(4);
    session.words = [{ word: firstWord, length: 4 }]; // Finalde dinamik tek kelime
    session.guesses = []; // Önceki turdan kalan tahminleri temizle

    res.json({
        mode: 'final',
        duration: 120,
        firstLetter: firstWord[0],
        wordLength: 4
    });
});

// Final Modu: Pas Geçme (Sadece geçerli bir tahmin yapıldıysa)
router.post('/pass', (req, res) => {
    const { sessionId } = req.body;
    const session = global.gameSessions.get(sessionId);
    
    if (!session || session.mode !== 'final') return res.status(400).json({ error: "Geçersiz işlem" });

    // Kural: En az 1 geçerli tahmin yapılmış olmalı
    if (session.guesses.length === 0) {
        return res.status(400).json({ error: "Pas geçmek için önce geçerli bir tahmin yapmalısınız." });
    }

    const skippedWord = session.words[0].word; // Pas geçilen kelimeyi yakala

    // Yeni kelime ver (Aynı seviyeden)
    const newWord = getRandomWord(session.finalStage);
    session.words[0] = { word: newWord, length: session.finalStage };
    session.guesses = []; // Tahminleri sıfırla

    res.json({
        status: 'passed',
        message: 'Pas geçildi!',
        skippedWord: skippedWord,
        newFirstLetter: newWord[0],
        newWordLength: session.finalStage
    });
});

module.exports = router;