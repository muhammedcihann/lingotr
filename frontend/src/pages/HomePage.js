import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HomePage.css";

export default function HomePage() {
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();

  const startGame = () => {
    navigate("/game");
  };

  return (
    <div className="home-page" data-testid="home-page">
      <div className="lingo-background">
        <div className="lingo-circles"></div>
      </div>
      
      <div className="home-content">
        <div className="logo-section">
          <h1 className="lingo-title" data-testid="game-title">
            <span className="title-lingo">LINGO</span>
            <span className="title-turkiye">TÜRKİYE</span>
          </h1>
          <p className="subtitle">Kelime Tahmin Oyunu</p>
        </div>

        <div className="menu-buttons">
          <button 
            className="menu-btn start-btn" 
            onClick={startGame}
            data-testid="start-game-btn"
          >
            <span className="btn-icon">▶</span>
            OYUNA BAŞLA
          </button>
          
          <button 
            className="menu-btn rules-btn" 
            onClick={() => setShowRules(!showRules)}
            data-testid="rules-btn"
          >
            <span className="btn-icon">ℹ</span>
            OYUN KURALLARI
          </button>
        </div>

        {showRules && (
          <div className="rules-modal" data-testid="rules-modal">
            <div className="rules-content">
              <button 
                className="close-btn" 
                onClick={() => setShowRules(false)}
                data-testid="close-rules-btn"
              >
                ✕
              </button>
              
              <h2>🎯 Nasıl Oynanır?</h2>
              
              <div className="rules-section">
                <h3>📋 Oyun Akışı</h3>
                <ul>
                  <li><strong>TUR 1:</strong> 3 adet 4 harfli + 3 adet 5 harfli kelime</li>
                  <li><strong>TUR 2:</strong> 3 adet 5 harfli + 3 adet 6 harfli kelime</li>
                </ul>
              </div>

              <div className="rules-section">
                <h3>⏱️ Süre ve Deneme</h3>
                <ul>
                  <li>Her kelime için <strong>5 deneme hakkınız</strong> var</li>
                  <li>Her tahmin için <strong>10 saniye</strong> süreniz var</li>
                  <li>Süre biterse <strong>-200 puan</strong> kesilir</li>
                </ul>
              </div>

              <div className="rules-section">
                <h3>🎨 Renk Sistemi</h3>
                <div className="color-examples">
                  <div className="color-box green">Yeşil - Doğru yerde</div>
                  <div className="color-box yellow">Sarı - Var ama yanlış yerde</div>
                  <div className="color-box gray">Gri - Kelimede yok</div>
                </div>
              </div>

              <div className="rules-section">
                <h3>💰 Puanlama</h3>
                <ul>
                  <li><strong>4 harfli kelime:</strong> 1000 puan</li>
                  <li><strong>5 harfli kelime:</strong> 2000 puan</li>
                  <li><strong>6 harfli kelime:</strong> 2000 puan</li>
                  <li>Her yanlış tahminde <strong>-200 puan</strong></li>
                </ul>
              </div>

              <p className="good-luck">🍀 Bol Şans!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}