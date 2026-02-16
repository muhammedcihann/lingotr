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
        
        return (
          <div key={rowIndex} className="flex gap-2 justify-center">
            {[...Array(wordLength)].map((_, colIndex) => {
              let letter = "";
              let status = "cell-empty"; // Default

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
              }

              // Dalga Efekti (Wave Effect)
              // Eğer satır açılmışsa (guessData varsa), her harfe index * 0.15s gecikme ekle
              const animationDelay = guessData ? `${colIndex * 0.15}s` : '0s';

              return (
                <motion.div
                  key={colIndex}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`cell-base ${status} transition-all duration-500`}
                  style={{ transitionDelay: animationDelay }}
                >
                  {letter?.toLocaleUpperCase('tr-TR')}
                </motion.div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}