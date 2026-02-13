const fs = require('fs');
const https = require('https');
const path = require('path');

// %100 Çalışan, Açık Kaynak Türkçe Kelime Listesi (Text Formatında)
const SOURCE_URL = "https://raw.githubusercontent.com/mertemin/turkish-word-list/master/words.txt";

// Kayıt Yeri
const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(DATA_DIR, 'words.json');

// Klasör yoksa oluştur
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log("⏳ Kelime listesi indiriliyor... (Bu işlem bir kez yapılır)");

https.get(SOURCE_URL, (res) => {
    let rawData = '';

    res.on('data', (chunk) => { rawData += chunk; });

    res.on('end', () => {
        try {
            // Gelen veriyi satır satır böl
            const allWords = rawData.split('\n');
            
            // Lingo için sadece 4, 5, 6, 7 harflileri ayıkla
            const lingoData = { 4: [], 5: [], 6: [], 7: [] };
            let count = 0;

            allWords.forEach(word => {
                // Temizlik: Boşlukları at, Türkçe karakter sorunu olmasın diye küçük harfe çevir
                let cleanWord = word.trim().toLocaleLowerCase('tr-TR');

                // Şapkalı harfleri düzelt (kâğıt -> kagit) - Oyun zorlaşmasın diye
                cleanWord = cleanWord.replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');

                // Sadece harf içerdiğinden emin ol (nokta, virgül vs. olmasın)
                if (!/^[a-zçğıöşü]+$/.test(cleanWord)) return;

                const len = cleanWord.length;

                // Sadece istediğimiz uzunluktaki kelimeleri al
                if (lingoData[len]) {
                    // Büyük harfle kaydet (Lingo formatı) - Server tarafında kontrol kolaylığı için
                    // Ancak frontend'de küçük harf kullanıyorsak burada da küçük tutabiliriz.
                    // Senin verdiğin örnekte toLocaleUpperCase kullanılmış, biz de öyle yapalım.
                    // NOT: Mevcut oyun mantığımız küçük harf üzerine kurulu olabilir, 
                    // ama TDK kontrolü için büyük harf standardı daha iyidir.
                    // Server.js'de buna dikkat edeceğiz.
                    const finalWord = cleanWord.toLocaleLowerCase('tr-TR'); 
                    
                    // Tekrar edenleri engelle
                    if (!lingoData[len].includes(finalWord)) {
                        lingoData[len].push(finalWord);
                        count++;
                    }
                }
            });

            // JSON dosyasını yaz
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(lingoData, null, 2));
            
            console.log(`✅ İŞLEM TAMAM! Toplam ${count} kelime veritabanına eklendi.`);
            console.log(`📂 Dosya şuraya kaydedildi: ${OUTPUT_FILE}`);
            console.log(`📊 İstatistikler:`);
            console.log(`   4 Harfli: ${lingoData[4].length}`);
            console.log(`   5 Harfli: ${lingoData[5].length}`);
            console.log(`   6 Harfli: ${lingoData[6].length}`);
            console.log(`   7 Harfli: ${lingoData[7].length}`);

        } catch (err) {
            console.error("❌ Veri işleme hatası:", err);
        }
    });

}).on("error", (err) => {
    console.error("❌ İndirme başarısız:", err.message);
});