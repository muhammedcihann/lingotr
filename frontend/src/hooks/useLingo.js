import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';

// Backend URL'ini belirle
// Proxy (package.json) kullanıldığı için sadece relative path yeterlidir.
// Bu sayede hem local'de hem de production'da (aynı domain altındaysa) çalışır.
const BASE_URL = process.env.REACT_APP_BACKEND_URL || '';
const API_URL = `${BASE_URL}/api/game`;

// Ses Efektleri
const SOUNDS = {
    key: new Audio('/sounds/key.mp3'),
    correct: new Audio('/sounds/correct.mp3'),
    wrong: new Audio('/sounds/wrong.mp3'),
    fail: new Audio('/sounds/fail.mp3'),
    win: new Audio('/sounds/win.mp3')
};

export const useLingo = () => {
    const [gameState, setGameState] = useState('idle'); // idle, playing, round-end, final, game-over
    const [sessionId, setSessionId] = useState(null);
    const [currentWordLength, setCurrentWordLength] = useState(5);
    const [firstLetter, setFirstLetter] = useState('');
    const [guesses, setGuesses] = useState([]); // { word: string, result: string[] }
    const [currentGuess, setCurrentGuess] = useState('');
    const [currentRow, setCurrentRow] = useState(0);
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState(0); // Satır süresi veya Final süresi
    const [isTransitioning, setIsTransitioning] = useState(false); // Geçiş kilidi
    const [transitionId, setTransitionId] = useState(0); // Timer resetlemek için
    
    // Mantıksal kilit için Ref (Anlık tepki verir)
    const processingRef = useRef(false);
    
    // Final Modu State'leri
    const [finalStage, setFinalStage] = useState(4); // 4,5,6,7
    const [finalReward, setFinalReward] = useState('');

    const timerRef = useRef(null);

    // State referansı (Timer içinde güncel state'e erişmek için)
    const stateRef = useRef({ currentGuess, currentRow, guesses, currentWordLength });
    useEffect(() => {
        stateRef.current = { currentGuess, currentRow, guesses, currentWordLength };
    }, [currentGuess, currentRow, guesses, currentWordLength]);

    // Ses Çalma Fonksiyonu
    const playSound = (type) => {
        if (SOUNDS[type]) {
            SOUNDS[type].currentTime = 0;
            SOUNDS[type].play().catch(e => console.log("Ses çalma hatası:", e));
        }
    };

    // Klavye harf durumlarını hesapla
    const letterStatuses = useMemo(() => {
        const statuses = {};
        guesses.forEach(guess => {
            if (!guess || !guess.word) return;
            guess.word.split('').forEach((letter, index) => {
                const result = guess.result[index];
                if (result === 'green') statuses[letter] = 'green';
                else if (result === 'yellow' && statuses[letter] !== 'green') statuses[letter] = 'yellow';
                else if (result === 'gray' && !statuses[letter]) statuses[letter] = 'gray';
            });
        });
        return statuses;
    }, [guesses]);

    // Bilinen (Yeşil) harfleri ve ilk harfi birleştirip başlangıç kelimesini oluşturur
    const constructInitialGuess = useCallback((length, startChar, pastGuesses = []) => {
        // Boşluklarla dolu bir dizi oluştur
        const chars = Array(length).fill(' ');
        
        // İlk harfi yerleştir
        if (startChar && startChar.length > 0) {
            chars[0] = startChar;
        }

        // Geçmiş tahminlerden yeşilleri topla
        pastGuesses.forEach(g => {
            if (!g) return;
            g.result.forEach((res, i) => {
                if (res === 'green') {
                    chars[i] = g.word[i];
                }
            });
        });

        return chars.join('');
    }, []);

    // Oyunu Başlat
    const startGame = async () => {
        try {
            console.log("🚀 Oyun başlatılıyor. İstek adresi:", `${API_URL}/start`);
            const res = await axios.post(`${API_URL}/start`);
            setSessionId(res.data.sessionId);
            setGameState('playing');
            setCurrentWordLength(res.data.currentWordLength);
            setFirstLetter(res.data.firstLetter);
            setGuesses(Array(5).fill(null)); // 5 hak
            setCurrentRow(0);
            
            // İlk tahmini hazırla (Sadece ilk harf ve boşluklar)
            const initialGuess = constructInitialGuess(res.data.currentWordLength, res.data.firstLetter, []);
            setCurrentGuess(initialGuess);
            
            setScore(res.data.totalScore);
            setTimeLeft(15); // Klasik mod satır süresi
            processingRef.current = false;
            setIsTransitioning(false);
        } catch (err) {
            console.error("Başlama hatası", err);
            setMessage("Sunucu hatası!");
        }
    };

    // Final Modunu Başlat
    const startFinal = async () => {
        try {
            const res = await axios.post(`${API_URL}/start-final`, { sessionId });
            setGameState('final');
            setFinalStage(4);
            setCurrentWordLength(4);
            setFirstLetter(res.data.firstLetter);
            
            const initialGuess = constructInitialGuess(4, res.data.firstLetter, []);
            setCurrentGuess(initialGuess);
            
            setCurrentRow(0); // BUG FIX: Final turunda satırı başa al
            setGuesses(Array(5).fill(null)); // Finalde de 5 hak var
            setTimeLeft(120); // 120 saniye toplam süre
            setIsTransitioning(false); // BUG FIX: Geçiş kilidini aç
            processingRef.current = false;
        } catch (err) {
            console.error(err);
            setIsTransitioning(false);
            processingRef.current = false;
        }
    };

    // Yeni kelimeye geçişi yöneten yardımcı fonksiyon
    const handleNextWordTransition = useCallback((nextWordData) => {
        if (nextWordData) {
            // Timer'ı hemen durdur ki eski timer çalışıp durmasın
            if (timerRef.current) clearInterval(timerRef.current);

            setGuesses(Array(5).fill(null));
            setCurrentRow(0);
            setCurrentWordLength(nextWordData.wordLength);
            setFirstLetter(nextWordData.firstLetter);
            
            const initialGuess = constructInitialGuess(nextWordData.wordLength, nextWordData.firstLetter, []);
            setCurrentGuess(initialGuess);
            
            setTimeLeft(15);
            setMessage(""); // Mesajı temizle
            setIsTransitioning(false); // Kilidi aç
            processingRef.current = false;
            setTransitionId(prev => prev + 1); // Timer'ı zorla yeniden başlat
        }
    }, []);

    const handleNextRow = useCallback((latestGuesses) => {
        if (currentRow < 4) {
            setCurrentRow(prev => prev + 1);
            
            // Bir sonraki satır için yeşil harfleri taşı
            const nextGuessStr = constructInitialGuess(currentWordLength, firstLetter, latestGuesses || guesses);
            setCurrentGuess(nextGuessStr);
            
            setTimeLeft(15); // Süreyi resetle
        } else {
            // Haklar bitti, kelime bilinemedi
            // Backend zaten bunu yönetiyor, burada sadece UI geçişi yapabiliriz
            // Basitlik adına: Backend'den yeni kelime isteği (Next Word) yapılmalı
            // Bu örnekte basitleştirildi.
            setMessage("Kelime bilinemedi!");
        }
    }, [currentRow, firstLetter, currentWordLength, guesses, constructInitialGuess]);

    const handleTimeout = useCallback(async () => {
        if (gameState === 'playing') {
            if (processingRef.current) return; // Zaten işlem yapılıyorsa dur

            processingRef.current = true;
            setIsTransitioning(true); // KİLİT: Timer'ı ve klavyeyi anında durdur
            
            try {
                const res = await axios.post(`${API_URL}/timeout`, { sessionId });
                
                if (res.data.status === 'fail') {
                    // Süre doldu ve haklar bitti (kelime yandı)
                    setMessage(res.data.message);
                    playSound('fail');
                    setScore(res.data.score);
                    
                    // O anki satırı kırmızı yak
                    const { currentGuess: currGuess, currentRow: currRow, guesses: currGuesses, currentWordLength: currLen } = stateRef.current;
                    const newGuesses = [...currGuesses];
                    newGuesses[currRow] = { word: currGuess, result: Array(currLen).fill('invalid') };
                    setGuesses(newGuesses);

                    setTimeout(() => {
                        if (res.data.isRoundFinished) {
                            setGameState('round-end');
                        } else {
                            handleNextWordTransition(res.data.nextWord);
                        }
                    }, res.data.nextDelay);
                }
            } catch (err) {
                console.error(err);
                processingRef.current = false;
                setIsTransitioning(false);
            }
        } else if (gameState === 'final') {
            setGameState('game-over');
            setMessage("Süre Bitti! Oyun Sona Erdi.");
        }
    }, [gameState, sessionId, handleNextRow, handleNextWordTransition]);

    // Timer Mantığı
    useEffect(() => {
        if (gameState !== 'playing' && gameState !== 'final') return;
        if (isTransitioning) return; // Geçiş sırasında timer çalışmasın

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [gameState, currentRow, sessionId, handleTimeout, transitionId, isTransitioning]); // currentRow değişince timer resetlenmeli (klasik modda)

    const submitGuess = useCallback(async () => {
        if (processingRef.current) return;
        // Boşluk kontrolü: Kelime tam doldurulmuş mu?
        if (currentGuess.includes(' ') || currentGuess.length !== Number(currentWordLength)) return;

        // İstek başladığında kilitle
        processingRef.current = true;
        setIsTransitioning(true);

        try {
            const res = await axios.post(`${API_URL}/guess`, {
                sessionId,
                guess: currentGuess
            });

            if (gameState === 'playing') {
                // 1. Durum: Kelime Yandı (Bilinemedi veya çok fazla geçersiz deneme)
                if (res.data.status === 'fail') {
                    // setIsTransitioning(true); // Zaten kilitli
                    setMessage(res.data.message);
                    playSound('fail');
                    setScore(res.data.score);
                    
                    // Son hali göster
                    const newGuesses = [...guesses];
                    if (res.data.result) {
                         newGuesses[currentRow] = { word: currentGuess, result: res.data.result };
                    } else {
                         // Geçersiz kelime ile yandıysa
                         newGuesses[currentRow] = { word: currentGuess, result: Array(currentWordLength).fill('invalid') };
                    }
                    setGuesses(newGuesses);
                    
                    setTimeout(() => {
                        if (res.data.isRoundFinished) {
                            setGameState('round-end');
                        } else {
                            handleNextWordTransition(res.data.nextWord);
                        }
                    }, res.data.nextDelay);
                } 
                // 3. Durum: Doğru Bildi
                else if (res.data.status === 'correct') {
                    // setIsTransitioning(true); // Zaten kilitli
                    const newGuesses = [...guesses];
                    newGuesses[currentRow] = { word: currentGuess, result: res.data.result };
                    setGuesses(newGuesses);
                    playSound('correct');
                    setScore(res.data.score);
                    setMessage("DOĞRU! 🎉");
                    
                    setTimeout(() => {
                        if (res.data.isRoundFinished) {
                            setGameState('round-end');
                        } else {
                            handleNextWordTransition(res.data.nextWord);
                        }
                    }, res.data.nextDelay);
                } 
                // 4. Durum: Yanlış Tahmin (Ama hak devam ediyor)
                else {
                    const newGuesses = [...guesses];
                    newGuesses[currentRow] = { word: currentGuess, result: res.data.result };
                    setGuesses(newGuesses);
                    setScore(res.data.score); // Puan güncellenmiş olabilir (ceza)
                    playSound('wrong');
                    
                    // Yeni satıra geçerken güncel tahminleri gönder
                    handleNextRow(newGuesses);
                    
                    setIsTransitioning(false); // Devam ettiği için kilidi aç
                    processingRef.current = false;
                }
            } 
            else if (gameState === 'final') {
                if (res.data.status === 'final_correct') {
                    // setIsTransitioning(true); // Zaten kilitli
                    const newGuesses = [...guesses];
                    newGuesses[currentRow] = { word: currentGuess, result: res.data.result };
                    setGuesses(newGuesses);

                    playSound('correct');
                    setMessage(`TEBRİKLER! ${res.data.reward}`);
                    setFinalReward(res.data.reward);
                    
                    setTimeout(() => {
                        setFinalStage(res.data.nextStage);
                        setCurrentWordLength(res.data.wordLength);
                        setFirstLetter(res.data.firstLetter);
                        
                        const initialGuess = constructInitialGuess(res.data.wordLength, res.data.firstLetter, []);
                        setCurrentGuess(initialGuess);
                        
                        setGuesses(Array(5).fill(null));
                        setCurrentRow(0);
                        setMessage("");
                        setIsTransitioning(false);
                        processingRef.current = false;
                    }, 5000);

                } else if (res.data.status === 'game_won') {
                    const newGuesses = [...guesses];
                    newGuesses[currentRow] = { word: currentGuess, result: res.data.result };
                    setGuesses(newGuesses);

                    playSound('win');
                    setMessage(`TEBRİKLER! ${res.data.reward}`);
                    setFinalReward(res.data.reward);
                    
                    setTimeout(() => {
                        setGameState('game-over');
                        setIsTransitioning(false);
                        processingRef.current = false;
                    }, 5000);

                } else if (res.data.status === 'final_fail' || res.data.status === 'final_wrong') {
                    // final_wrong: Eski backend uyumluluğu için
                    // setIsTransitioning(true); // Zaten kilitli
                    playSound('fail');
                    setMessage(res.data.message);
                    
                    const newGuesses = [...guesses];
                    if (res.data.result) {
                        newGuesses[currentRow] = { word: currentGuess, result: res.data.result };
                    } else {
                        newGuesses[currentRow] = { word: currentGuess, result: Array(currentWordLength).fill('invalid') };
                    }
                    setGuesses(newGuesses);

                    setTimeout(() => {
                        setFirstLetter(res.data.newFirstLetter);
                        
                        const initialGuess = constructInitialGuess(res.data.newWordLength || currentWordLength, res.data.newFirstLetter, []);
                        setCurrentGuess(initialGuess);
                        
                        setGuesses(Array(5).fill(null));
                        setCurrentRow(0);
                        setMessage("");
                        setIsTransitioning(false);
                        processingRef.current = false;
                    }, 5000);

                } else if (res.data.status === 'final_continue') {
                    const newGuesses = [...guesses];
                    playSound('wrong');
                    newGuesses[currentRow] = { word: currentGuess, result: res.data.result };
                    setGuesses(newGuesses);
                    setCurrentRow(prev => prev + 1);
                    
                    // Final turunda da yeşilleri taşı
                    const nextGuessStr = constructInitialGuess(currentWordLength, firstLetter, newGuesses);
                    setCurrentGuess(nextGuessStr);
                    
                    setIsTransitioning(false); // Devam ettiği için kilidi aç
                    processingRef.current = false;
                } else {
                    // Beklenmedik bir durum olursa kilidi aç (Güvenlik sübabı)
                    console.warn("Beklenmedik durum:", res.data.status);
                    setIsTransitioning(false);
                    processingRef.current = false;
                }
            }

        } catch (err) {
            console.error(err);
            setIsTransitioning(false); // Hata durumunda kilidi aç
            processingRef.current = false;
        }
    }, [currentGuess, currentWordLength, sessionId, gameState, guesses, currentRow, handleNextRow, handleNextWordTransition, firstLetter, constructInitialGuess]);

    const handleKey = useCallback((key) => {
        if ((gameState !== 'playing' && gameState !== 'final') || processingRef.current) return;

        if (key === 'BACKSPACE') {
            // Sondan başa doğru ilk silinebilir (kilitli olmayan) karakteri bul
            const knownChars = constructInitialGuess(currentWordLength, firstLetter, guesses).split('');
            const currentChars = currentGuess.split('');
            
            // Sağdan sola tara
            for (let i = currentWordLength - 1; i >= 0; i--) {
                // Eğer bu pozisyon zaten doluysa ve kilitli (known) değilse sil
                if (currentChars[i] !== ' ' && knownChars[i] === ' ') {
                    playSound('key');
                    const newChars = [...currentChars];
                    newChars[i] = ' ';
                    setCurrentGuess(newChars.join(''));
                    break;
                }
            }
        } else if (key === 'ENTER') {
            submitGuess();
        } else {
            // Soldan sağa ilk boşluğu bul ve doldur
            if (currentGuess.includes(' ')) {
                playSound('key');
                const newChars = currentGuess.split('');
                const emptyIndex = newChars.indexOf(' ');
                if (emptyIndex !== -1) {
                    newChars[emptyIndex] = key;
                    setCurrentGuess(newChars.join(''));
                }
            }
        }
    }, [gameState, currentGuess, currentWordLength, submitGuess, firstLetter, guesses, constructInitialGuess]);

    // Skoru Kaydet
    const submitScore = async (playerName) => {
        try {
            await axios.post(`${BASE_URL}/api/leaderboard`, { name: playerName, score });
            return true;
        } catch (err) {
            console.error("Skor kaydedilemedi", err);
            return false;
        }
    };

    return {
        gameState,
        score,
        timeLeft,
        guesses,
        currentGuess,
        currentRow,
        currentWordLength,
        message,
        finalStage,
        finalReward,
        startGame,
        startFinal,
        submitScore,
        handleKey,
        letterStatuses
    };
};