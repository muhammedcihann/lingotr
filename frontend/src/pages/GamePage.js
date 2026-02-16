import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLingo } from "../hooks/useLingo";
import GameBoard from "../components/GameBoard";
import Keyboard from "../components/Keyboard";
import "../styles/GamePage.css";

export default function GamePage() {
  const [playerName, setPlayerName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const {
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
    passTurn,
    letterStatuses
  } = useLingo();

  useEffect(() => {
    startGame();
    // eslint-disable-next-line
  }, []);

  const handleSaveScore = async () => {
    if (!playerName.trim()) return;
    const success = await submitScore(playerName);
    if (success) setIsSubmitted(true);
  };

  // Fiziksel klavye desteği
  useEffect(() => {
    const handlePhysicalKey = (e) => {
      // Kısayolları engelleme (örn: Ctrl+R yenileme yapsın, oyuna yazmasın)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === 'Enter') {
        handleKey('ENTER');
      } else if (e.key === 'Backspace') {
        handleKey('BACKSPACE');
      } else {
        const key = e.key.toLocaleUpperCase('tr-TR');
        const ALLOWED_KEYS = [
          "A", "B", "C", "Ç", "D", "E", "F", "G", "Ğ", "H", "I", "İ", "J", "K", "L", "M", 
          "N", "O", "Ö", "P", "R", "S", "Ş", "T", "U", "Ü", "V", "Y", "Z"
        ];
        if (ALLOWED_KEYS.includes(key)) handleKey(key);
      }
    };

    window.addEventListener('keydown', handlePhysicalKey);
    return () => window.removeEventListener('keydown', handlePhysicalKey);
  }, [handleKey]);

  return (
    <div className="game-page" data-testid="game-page">
      <div className="game-background"></div>
      
      <div className="game-container">
        <div className="game-header">
          <div className="header-left">
            <h1 className="game-logo">LINGO</h1>
            <div className="round-info" data-testid="round-info">
              {gameState === 'final' ? '🔥 FİNAL TURU' : 'KLASİK TUR'}
            </div>
          </div>
          <div className="header-right">
            <div className="score-display" data-testid="score-display">
              <span className="score-label">PUAN</span>
              <span className="score-value">{score}</span>
            </div>
          </div>
        </div>

        <div className="game-info-bar">
          <div className="info-item">
            <span className="info-label">Süre</span>
            <span className={`info-value timer ${timeLeft < 5 ? 'text-red-500' : ''}`} data-testid="timer">
              {timeLeft}s
            </span>
          </div>
          {gameState === 'final' && (
            <div className="info-item">
              <span className="info-label">Hedef</span>
              <span className="info-value text-yellow-400">{finalStage} Harf</span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">Harf</span>
            <span className="info-value">{currentWordLength} harf</span>
          </div>
        </div>

        {message && (
          <div className="game-message animate-bounce" data-testid="game-message">
            {message}
          </div>
        )}

        <div className="grid-container" data-testid="grid-container">
          <GameBoard 
            guesses={guesses}
            currentGuess={currentGuess}
            currentRow={currentRow}
            wordLength={currentWordLength}
            isFinal={gameState === 'final'}
            timeLeft={timeLeft}
          />
        </div>

        {/* Final Modu Pas Butonu */}
        {gameState === 'final' && (
          <div className="flex justify-center my-2">
            <button 
              onClick={passTurn}
              disabled={!guesses.some(g => g !== null)}
              className={`px-6 py-2 rounded-full font-bold text-white transition-all ${
                guesses.some(g => g !== null) 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg transform hover:scale-105' 
                  : 'bg-gray-700 opacity-50 cursor-not-allowed'
              }`}
            >
              PAS GEÇ ⏭️
            </button>
          </div>
        )}

        <div className="keyboard" data-testid="keyboard">
          <Keyboard onKeyPress={handleKey} letterStatuses={letterStatuses} />
        </div>

        {/* Modals */}
        {gameState === "round-end" && (
          <div className="end-modal" data-testid="end-modal">
            <div className="end-content">
              {score > 0 ? (
                <>
                  <h2>🎊 Tur Tamamlandı!</h2>
                  <p className="final-score">Toplam Puan: <strong>{score}</strong></p>
                  <button 
                    className="next-btn" 
                    onClick={startFinal}
                    data-testid="next-round-btn"
                  >
                    FİNAL TURUNA GEÇ
                  </button>
                </>
              ) : (
                <>
                  <h2>😔 Yetersiz Puan</h2>
                  <p className="final-score">Toplam Puan: <strong>0</strong></p>
                  <p className="mb-6 text-gray-300">Final turuna geçmek için kasanızda puan olması gerekir.</p>
                  <button className="next-btn" onClick={() => window.location.reload()}>
                    TEKRAR OYNA
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {gameState === "game-over" && (
           <div className="end-modal">
             <div className="end-content">
               <h2>OYUN BİTTİ</h2>
               <p className="final-score">Kazanılan Ödül: <br/> <strong>{finalReward || "0 Puan"}</strong></p>
               
               {!isSubmitted ? (
                 <div className="flex flex-col gap-3 mb-6">
                   <input 
                     type="text" 
                     placeholder="Adınızı Girin" 
                     maxLength={15}
                     className="p-3 rounded-xl bg-white/10 border border-white/20 text-white text-center outline-none focus:border-yellow-400"
                     value={playerName}
                     onChange={(e) => setPlayerName(e.target.value)}
                   />
                   <button className="next-btn bg-yellow-500 hover:bg-yellow-600" onClick={handleSaveScore}>
                     SKORU KAYDET
                   </button>
                 </div>
               ) : (
                 <p className="text-green-400 font-bold mb-6">Skorunuz Kaydedildi! ✅</p>
               )}

               <div className="flex gap-3 w-full">
                 <button className="next-btn flex-1" onClick={() => window.location.reload()}>
                   TEKRAR OYNA
                 </button>
                 <button className="next-btn flex-1 bg-gray-600 hover:bg-gray-700 border-gray-500" onClick={() => navigate('/')}>
                   ANA MENÜ
                 </button>
               </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}