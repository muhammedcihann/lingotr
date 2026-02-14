import React from 'react';

const KEYS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
  ["Z", "X", "C", "V", "B", "N", "M", "Ö", "Ç"]
];

export default function Keyboard({ onKeyPress, letterStatuses = {} }) {
  return (
    <div className="w-full max-w-2xl mx-auto p-2">
      {KEYS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 mb-2">
          {row.map(key => {
            const status = letterStatuses[key];
            let statusClass = "key-base"; // Default
            
            if (status === 'green') statusClass += " key-correct";
            else if (status === 'yellow') statusClass += " key-present";
            else if (status === 'gray') statusClass += " key-absent";

            return (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className={`w-8 h-10 sm:w-10 sm:h-12 text-sm sm:text-base ${statusClass}`}
            >
              {key}
            </button>
            );
          })}
        </div>
      ))}
      <div className="flex justify-center gap-2 mt-2">
        <button 
          onClick={() => onKeyPress('BACKSPACE')}
          className="px-4 py-2 key-base bg-red-500 text-white shadow-[0_4px_0_#b91c1c] active:shadow-none active:translate-y-1"
        >
          SİL
        </button>
        <button 
          onClick={() => onKeyPress('ENTER')}
          className="px-6 py-2 key-base bg-blue-500 text-white shadow-[0_4px_0_#1d4ed8] active:shadow-none active:translate-y-1"
        >
          GÖNDER
        </button>
      </div>
    </div>
  );
}