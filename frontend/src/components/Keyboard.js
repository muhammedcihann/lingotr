import React from 'react';

const KEYS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
  ["Z", "X", "C", "V", "B", "N", "M", "Ö", "Ç", "BACKSPACE", "ENTER"]
];

export default function Keyboard({ onKeyPress, letterStatuses = {} }) {
  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 select-none">
      <div className="flex flex-col gap-2">
        {KEYS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 sm:gap-1.5 w-full">
            {row.map((key) => {
              const isSpecial = key.length > 1;
              const status = letterStatuses[key];
              
              // Temel stiller (Gölge efekti ve animasyonlar eklendi)
              let baseClass = "flex items-center justify-center rounded-md sm:rounded-lg font-bold transition-all duration-100 shadow-[0_4px_0_rgb(0,0,0,0.2)] active:shadow-none active:translate-y-[4px]";
              
              // Boyutlandırma (Responsive)
              let sizeClass = isSpecial 
                ? "flex-[1.5] h-14 sm:h-16 text-xs sm:text-sm px-1" 
                : "flex-1 h-14 sm:h-16 text-lg sm:text-2xl";

              // Renkler
              let colorClass = "bg-slate-200 text-slate-900 hover:bg-slate-300"; // Varsayılan
              
              if (status === 'green') {
                colorClass = "bg-green-500 text-white border-green-600 hover:bg-green-600 shadow-[0_4px_0_#15803d]";
              } else if (status === 'yellow') {
                colorClass = "bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600 shadow-[0_4px_0_#a16207]";
              } else if (status === 'gray') {
                colorClass = "bg-gray-500 text-white border-gray-600 hover:bg-gray-600 shadow-[0_4px_0_#374151]";
              } else if (key === 'ENTER') {
                colorClass = "bg-blue-500 text-white hover:bg-blue-600 shadow-[0_4px_0_#1d4ed8]";
              } else if (isSpecial) {
                 colorClass = "bg-slate-300 text-slate-900 hover:bg-slate-400";
              }

              // İçerik (İkonlar vs.)
              let content = key;
              if (key === 'BACKSPACE') {
                content = (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                  </svg>
                );
              } else if (key === 'ENTER') {
                content = "ENTER";
              }

              return (
                <button
                  key={key}
                  onClick={() => onKeyPress(key)}
                  className={`${baseClass} ${sizeClass} ${colorClass}`}
                >
                  {content}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}