import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/HomePage.css";

export default function LeaderboardPage() {
  const [scores, setScores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const BASE_URL = process.env.REACT_APP_BACKEND_URL || '';
    axios.get(`${BASE_URL}/api/leaderboard`)
      .then(res => setScores(res.data))
      .catch(err => console.error(err));
  }, []);

  // Sıralamaya göre ikon ve stil döndüren fonksiyon
  const getRankDisplay = (index) => {
    if (index === 0) return <span className="text-3xl filter drop-shadow-lg">🥇</span>;
    if (index === 1) return <span className="text-3xl filter drop-shadow-lg">🥈</span>;
    if (index === 2) return <span className="text-3xl filter drop-shadow-lg">🥉</span>;
    return <span className="font-bold text-gray-400 text-xl">{index + 1}</span>;
  };

  return (
    <div className="home-page">
      <div className="lingo-background">
        <div className="lingo-circles"></div>
      </div>
      
      <div className="home-content" style={{ maxWidth: '600px' }}>
        <h2 className="text-3xl font-bold text-white mb-6 font-['Montserrat']">🏆 LİDER TABLOSU</h2>
        
        <div className="bg-black/20 rounded-2xl p-4 max-h-[60vh] overflow-y-auto border border-white/10 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="text-yellow-400 border-b border-white/10">
              <tr>
                <th className="p-3 w-20 text-center">Sıra</th>
                <th className="p-3">Oyuncu</th>
                <th className="p-3 text-right">Puan</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {scores.map((s, i) => (
                <tr key={i} className={`border-b border-white/5 transition-colors ${i < 3 ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                  <td className="p-3 text-center align-middle">
                    {getRankDisplay(i)}
                  </td>
                  <td className={`p-3 align-middle font-medium text-lg ${
                    i === 0 ? 'text-yellow-400' : 
                    i === 1 ? 'text-gray-300' : 
                    i === 2 ? 'text-orange-400' : ''
                  }`}>
                    {s.name}
                  </td>
                  <td className="p-3 text-right align-middle font-bold text-green-400 text-lg">{s.score}</td>
                </tr>
              ))}
              {scores.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-400">Henüz skor kaydedilmemiş.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button 
          className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10"
          onClick={() => navigate('/')}
        >
          ⬅ ANA MENÜ
        </button>
      </div>
    </div>
  );
}