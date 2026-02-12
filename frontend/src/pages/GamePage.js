import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/GamePage.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const POINTS = {
  4: 1000,
  5: 2000,
  6: 2000
};

export default function GamePage() {
  const navigate = useNavigate();
  const [currentRound, setCurrentRound] = useState(1);
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [totalScore, setTotalScore] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameStatus, setGameStatus] = useState("playing"); // playing, won, lost, round-end
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    startRound(1);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameStatus === "playing" && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameStatus === "playing") {
      handleTimeOut();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameStatus]);

  const startRound = async (round) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/game/start`, { round });
      setWords(response.data.words);
      setCurrentRound(round);
      setCurrentWordIndex(0);
      setGuesses([]);
      setCurrentGuess("");
      setAttemptsLeft(5);
      setTimeLeft(10);
      setGameStatus("playing");
      setMessage("");
      setIsLoading(false);
    } catch (error) {
      console.error("Error starting round:", error);
      setMessage("Oyun başlatılamadı!");
      setIsLoading(false);
    }
  };

  const handleTimeOut = () => {
    setTotalScore(prev => Math.max(0, prev - 200));
    setMessage("⏰ Süre doldu! -200 puan");
    setTimeLeft(10);
  };

  const handleKeyPress = (letter) => {
    if (gameStatus !== "playing") return;
    
    const currentWord = words[currentWordIndex];
    if (currentGuess.length < currentWord.length) {
      setCurrentGuess(currentGuess + letter);
    }
  };

  const handleBackspace = () => {
    if (gameStatus !== "playing") return;
    setCurrentGuess(currentGuess.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (gameStatus !== "playing") return;
    
    const currentWord = words[currentWordIndex];
    if (currentGuess.length !== currentWord.length) {
      setMessage("Kelimeyi tamamlayın!");
      return;
    }

    try {
      const response = await axios.post(`${API}/game/check`, {
        word: currentGuess,
        target_word: currentWord.word
      });

      if (!response.data.is_valid) {
        setMessage("❌ Geçersiz kelime!");
        return;
      }

      const newGuess = {
        word: currentGuess,
        result: response.data.result
      };
      setGuesses([...guesses, newGuess]);

      if (response.data.is_correct) {
        // Correct guess
        const basePoints = POINTS[currentWord.length];
        const penalty = (5 - attemptsLeft) * 200;
        const earnedPoints = Math.max(0, basePoints - penalty);
        setTotalScore(totalScore + earnedPoints);
        setMessage(`🎉 Doğru! +${earnedPoints} puan`);
        setGameStatus("won");
        
        setTimeout(() => {
          moveToNextWord();
        }, 2000);
      } else {
        // Wrong guess
        const newAttemptsLeft = attemptsLeft - 1;
        setAttemptsLeft(newAttemptsLeft);
        
        if (newAttemptsLeft === 0) {
          setMessage(`😔 Kelime: ${currentWord.word}`);
          setGameStatus("lost");
          setTimeout(() => {
            moveToNextWord();
          }, 3000);
        } else {
          setMessage(`Kalan deneme: ${newAttemptsLeft}`);
        }
      }

      setCurrentGuess("");
      setTimeLeft(10);
    } catch (error) {
      console.error("Error checking guess:", error);
      setMessage("Bir hata oluştu!");
    }
  };

  const moveToNextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setGuesses([]);
      setCurrentGuess("");
      setAttemptsLeft(5);
      setTimeLeft(10);
      setGameStatus("playing");
      setMessage("");
    } else {
      // Round finished
      if (currentRound === 1) {
        setGameStatus("round-end");
        setMessage(`🎊 Tur 1 Tamamlandı! Toplam: ${totalScore} puan`);
      } else {
        setGameStatus("game-end");
        setMessage(`🏆 Oyun Bitti! Final Puanınız: ${totalScore}`);
      }
    }
  };

  const handleNextRound = () => {
    if (currentRound === 1) {
      startRound(2);
    } else {
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <div className="game-page" data-testid="game-page">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  const currentWord = words[currentWordIndex];
  const keyboard = [
    ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
    ["Z", "C", "V", "B", "N", "M", "Ö", "Ç"]
  ];

  return (
    <div className="game-page" data-testid="game-page">
      <div className="game-background"></div>
      
      <div className="game-container">
        {/* Header */}
        <div className="game-header">
          <div className="header-left">
            <h1 className="game-logo">LINGO</h1>
            <div className="round-info" data-testid="round-info">
              TUR {currentRound} • Kelime {currentWordIndex + 1}/{words.length}
            </div>
          </div>
          <div className="header-right">
            <div className="score-display" data-testid="score-display">
              <span className="score-label">PUAN</span>
              <span className="score-value">{totalScore}</span>
            </div>
          </div>
        </div>

        {/* Game Info Bar */}
        <div className="game-info-bar">
          <div className="info-item">
            <span className="info-label">Süre</span>
            <span className="info-value timer" data-testid="timer">{timeLeft}s</span>
          </div>
          <div className="info-item">
            <span className="info-label">Deneme</span>
            <span className="info-value" data-testid="attempts">{attemptsLeft}/5</span>
          </div>
          <div className="info-item">
            <span className="info-label">Harf</span>
            <span className="info-value">{currentWord?.length} harf</span>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="game-message" data-testid="game-message">
            {message}
          </div>
        )}

        {/* Grid */}
        <div className="grid-container" data-testid="grid-container">
          {[...Array(5)].map((_, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              {[...Array(currentWord?.length || 0)].map((_, colIndex) => {
                const guess = guesses[rowIndex];
                const letter = guess ? guess.word[colIndex] : 
                              (rowIndex === guesses.length && currentGuess[colIndex]) || 
                              (rowIndex === 0 && colIndex === 0 ? currentWord.first_letter : "");
                const state = guess ? guess.result[colIndex] : "";
                const isFirstLetter = rowIndex === 0 && colIndex === 0;
                
                return (
                  <div 
                    key={colIndex} 
                    className={`grid-cell ${state} ${isFirstLetter ? 'first-letter' : ''} ${letter ? 'filled' : ''}`}
                    data-testid={`grid-cell-${rowIndex}-${colIndex}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Keyboard */}
        <div className="keyboard" data-testid="keyboard">
          {keyboard.map((row, rowIndex) => (
            <div key={rowIndex} className="keyboard-row">
              {row.map((letter) => (
                <button
                  key={letter}
                  className="key-btn"
                  onClick={() => handleKeyPress(letter)}
                  disabled={gameStatus !== "playing"}
                  data-testid={`key-${letter}`}
                >
                  {letter}
                </button>
              ))}
            </div>
          ))}
          <div className="keyboard-row">
            <button
              className="key-btn key-backspace"
              onClick={handleBackspace}
              disabled={gameStatus !== "playing"}
              data-testid="key-backspace"
            >
              ⌫ SİL
            </button>
            <button
              className="key-btn key-enter"
              onClick={handleSubmit}
              disabled={gameStatus !== "playing"}
              data-testid="key-enter"
            >
              ✓ GÖNDER
            </button>
          </div>
        </div>

        {/* Round End / Game End */}
        {(gameStatus === "round-end" || gameStatus === "game-end") && (
          <div className="end-modal" data-testid="end-modal">
            <div className="end-content">
              <h2>{gameStatus === "round-end" ? "🎊 Tur Tamamlandı!" : "🏆 Oyun Bitti!"}</h2>
              <p className="final-score">Toplam Puanınız: <strong>{totalScore}</strong></p>
              <button 
                className="next-btn" 
                onClick={handleNextRound}
                data-testid="next-round-btn"
              >
                {gameStatus === "round-end" ? "TUR 2'YE GEÇ" : "ANA MENÜYE DÖN"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}