import React from 'react';

const Keyboard = ({ onKeyPress, letterStatuses = {} }) => {
  // Tam Türkçe Q Klavye Düzeni
  const keys = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ", "BACKSPACE"],
    ["Z", "X", "C", "V", "B", "N", "M", "Ö", "Ç", "ENTER"]
  ];

  const getKeyStyle = (key) => {
    const status = letterStatuses[key];
    
    // ORTAK STİL:
    // h-11: Yüksekliği azalttık (Daha karemsi durması için)
    // text-sm: Yazı boyutu ideal
    // font-semibold: WhatsApp gibi tok yazı
    // rounded-[5px]: Köşeler çok yuvarlak değil, hafif yumuşak (iOS tarzı)
    let baseStyle = "flex-1 flex items-center justify-center rounded-[5px] font-semibold transition-all duration-75 active:scale-95 select-none text-sm h-11 sm:h-14 shadow-sm border-b border-gray-300";
    
    // Özel Tuşlar (Enter ve Silme) - Biraz daha geniş ve koyu gri
    if (key === 'ENTER' || key === 'BACKSPACE') {
      return `${baseStyle} bg-gray-300 text-gray-700 border-gray-400 flex-[1.5]`; 
    }

    // Harf Renkleri
    switch (status) {
      case 'green':
        return `${baseStyle} bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/30`;
      case 'yellow':
        return `${baseStyle} bg-amber-400 text-white border-amber-500 shadow-amber-500/30`;
      case 'gray':
        return `${baseStyle} bg-slate-500 text-gray-200 border-slate-600 opacity-60`;
      default:
        // Varsayılan Tuş (Beyaz, iOS Tarzı)
        return `${baseStyle} bg-white text-slate-900 hover:bg-slate-50`;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-1 pb-6 select-none touch-manipulation">
      {/* Konteyner arka planı (Klavye zemini - Gri) */}
      <div className="bg-gray-200/50 p-1.5 rounded-xl backdrop-blur-sm">
        <div className="flex flex-col gap-1.5"> {/* Satır arası boşluk */}
          {keys.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center w-full"> {/* Tuş arası boşluk (gap-1 çok önemli, sıkı olsun) */}
              {row.map((key) => {
                // İkon Ayarları
                let content = key;
                if (key === 'BACKSPACE') {
                  content = (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
                      <line x1="18" y1="9" x2="12" y2="15" />
                      <line x1="12" y1="9" x2="18" y2="15" />
                    </svg>
                  );
                }
                if (key === 'ENTER') {
                  content = (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <polyline points="9 10 4 15 9 20" />
                      <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                    </svg>
                  );
                }

                return (
                  <button
                    key={key}
                    onClick={() => onKeyPress(key)}
                    className={getKeyStyle(key)}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Keyboard;