import React from 'react';
import { motion } from 'framer-motion';

export default function GameBoard({ guesses, currentGuess, currentRow, wordLength, isFinal, timeLeft }) {
  const rows = [0, 1, 2, 3, 4];

  return (
    <div className="flex flex-col gap-2 mb-6">
      {/* Son 5 saniye kala kırmızı vignette (yanıp sönme) efekti */}
      {timeLeft !== undefined && timeLeft <= 5 && timeLeft > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none animate-pulse shadow-[inset_0_0_60px_20px_rgba(220,38,38,0.5)] sm:shadow-[inset_0_0_100px_40px_rgba(220,38,38,0.5)]"></div>
      )}

      {rows.map((rowIndex) => {
        const isCurrentRow = rowIndex === currentRow;
        const guessData = guesses[rowIndex];
        
        // Hata Kontrolü: Eğer sonuçta 'invalid' varsa satırı titret
        const isInvalid = guessData && guessData.result.some(r => r === 'invalid');
        
        return (
          <motion.div 
            key={rowIndex} 
            className="flex gap-2 justify-center"
            animate={isInvalid ? { x: [-5, 5, -5, 5, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {[...Array(wordLength)].map((_, colIndex) => {
              let letter = "";
              let status = "cell-empty"; // Default
              let shouldFlip = false;

              if (isCurrentRow && !guessData) {
                letter = currentGuess[colIndex] || "";
                if (colIndex === 0 && !letter) letter = currentGuess[0]; // İlk harf
                status = "cell-active";
              } else if (guessData) {
                letter = guessData.word[colIndex];
                const res = guessData.result[colIndex];
                if (res === 'green') status = "cell-correct";
                else if (res === 'yellow') status = "cell-present";
                else if (res === 'gray') status = "cell-absent";
                else if (res === 'invalid') status = "cell-invalid"; // Geçersiz kelime
                
                // Eğer geçerli bir tahminse (invalid değilse) çevirme animasyonu yap
                if (!isInvalid) shouldFlip = true;
              }

              // CSS transition delay (Renk değişimi için)
              const cssDelay = shouldFlip ? `${colIndex * 0.2}s` : '0s';

              return (
                <motion.div
                  key={colIndex}
                  initial={{ rotateX: 0, scale: 1 }}
                  animate={{ 
                    rotateX: shouldFlip ? [0, 90, 0] : 0, // 90 derecede görünmez olur, renk değişir, sonra 0'a döner
                    scale: (isCurrentRow && letter && !guessData) ? [1, 1.1, 1] : 1 // Yazarken hafif büyüme (Pop) efekti
                  }}
                  transition={{ 
                    rotateX: { duration: 0.6, delay: colIndex * 0.2 },
                    scale: { duration: 0.1 }
                  }}
                  className={`cell-base ${status} transition-all duration-500`}
                  style={{ transitionDelay: cssDelay }}
                >
                  {letter?.toLocaleUpperCase('tr-TR')}
                </motion.div>
              );
            })}
          </motion.div>
        );
      })}
    </div>
  );
}